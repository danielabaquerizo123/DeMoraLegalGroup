import { Component, useEffect, useMemo, useRef, useState, type ChangeEvent, type ClipboardEvent, type ErrorInfo, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AlertTriangle,
  Bold,
  ChevronDown,
  Edit3,
  Eye,
  EyeOff,
  FileEdit,
  Fullscreen,
  Heading1,
  Heading2,
  Heading3,
  Home,
  Image as ImageIcon,
  Info,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  LogOut,
  Minimize2,
  Minus,
  Pilcrow,

  Plus,
  Quote,
  Redo2,
  RemoveFormatting,
  Save,
  Send,
  Strikethrough,
  Table2,
  Trash2,
  Undo2,
  Underline,
  Unlink,
  Video,
} from "lucide-react";
import { logoAsset, professionalImages } from "../../constants/assets";
import { adminAuthApi } from "../../services/api/admin-auth-api";
import { adminBlogApi } from "../../services/api/admin-blog-api";
import { ApiError } from "../../services/api/api-client";
import type { AdminBlogPost, AdminBlogSummary, AdminPostStatus, AdminUser } from "../../types/api";
import { createVideoBlockHtml, detectMediaProvider, parseVideoUrl, plainTextToHtml, renderArticleContentHtml, sanitizeHtml, type MediaDetection } from "../../utils/sanitize-html";
import { AdminSummaryView } from "./AdminSummaryView";

type AdminBlogPageProps = {
  user: AdminUser;
};

type EditorForm = {
  titulo: string;
  extracto: string;
  contenido: string;
  imagenPortadaUrl: string | null;
};

type ViewMode = "resumen" | "publicaciones" | "editor";
type StatusFilter = AdminPostStatus | "TODAS";
type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: number;
  type: ToastType;
  message: string;
};

type LinkForm = {
  url: string;
  text: string;
  newTab: boolean;
};

type ImageForm = {
  url: string;
  alt: string;
  caption: string;
  align: "left" | "center" | "right" | "full";
  size: "25" | "50" | "75" | "100";
};

type ImageSourceMode = "url" | "upload";
type ImageValidationStatus = "idle" | "checking" | "valid" | "error";

type ImagePreviewState = {
  status: ImageValidationStatus;
  message: string;
  src: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
};

type ProcessedImage = {
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  type: string;
};

type TableForm = {
  rows: number;
  columns: number;
};

type CalloutType = "info" | "warning" | "update";
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
type ActiveTool =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "p"
  | "h1"
  | "h2"
  | "h3"
  | "alignLeft"
  | "alignCenter"
  | "alignRight"
  | "alignJustify"
  | "unorderedList"
  | "orderedList"
  | "blockquote"
  | "link";

type ToolbarTool = {
  icon: ReactNode;
  label: string;
  action: () => void;
  activeKey?: ActiveTool;
  isToggle?: boolean;
  disabled?: boolean;
};

type ToolbarGroup = {
  label: string;
  tools: ToolbarTool[];
};

const emptyForm: EditorForm = {
  titulo: "",
  extracto: "",
  contenido: "",
  imagenPortadaUrl: null,
};

const emptyImageForm: ImageForm = {
  url: "",
  alt: "",
  caption: "",
  align: "center",
  size: "100",
};

const COVER_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const INLINE_IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const COVER_MAX_SIZE_BYTES = 2 * 1024 * 1024;
const COVER_MAX_WIDTH = 1920;
const COVER_TARGET_QUALITY = 0.82;
const AUTOSAVE_DELAY_MS = 7000;

type EditorErrorBoundaryProps = {
  children: ReactNode;
};

type EditorErrorBoundaryState = {
  hasError: boolean;
};

class EditorErrorBoundary extends Component<EditorErrorBoundaryProps, EditorErrorBoundaryState> {
  state: EditorErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error en el editor administrativo", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <p className="admin-toast admin-toast--error">No se pudo cargar el editor. Intenta nuevamente.</p>;
    }

    return this.props.children;
  }
}

function formatAdminDate(date: string | null) {
  if (!date) {
    return "Sin publicar";
  }

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function postStatusLabel(status: AdminPostStatus) {
  return status === "PUBLICADO" ? "Publicada" : "Borrador";
}

function postImage(post: AdminBlogPost) {
  return post.imagen ?? "/images/Servicios/Martillo.jpg";
}

function professionalPhoto(user: AdminUser) {
  return user.profesional.fotoUrl ?? professionalImages[user.profesional.slug] ?? "/images/professionals/Paul.png";
}

function normalizeSafeUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    const allowedProtocols = ["http:", "https:", "mailto:", "tel:"];

    if (!allowedProtocols.includes(parsed.protocol)) {
      return null;
    }

    if ((parsed.protocol === "http:" || parsed.protocol === "https:") && !parsed.hostname) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function isSafeImageDataUrl(value: string) {
  return /^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(value);
}

function imagePageHint(url: string) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (hostname === "google.com" && parsed.pathname.startsWith("/search")) {
      return "Ese enlace es una pagina de resultados de Google Images, no la URL directa de una imagen.";
    }

    if (hostname === "pinterest.com" && parsed.pathname.includes("/pin/")) {
      return "Ese enlace es una pagina de Pinterest. Usa una URL directa de imagen, por ejemplo i.pinimg.com.";
    }
  } catch {
    return null;
  }

  return null;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) {
    return "";
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${Math.round(bytes / 1024)} KB`;
}

function readFileAsDataUrl(file: File | Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

function loadImageSource(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => {
      image.src = "";
      reject(new Error("timeout"));
    }, 9000);

    image.onload = () => {
      window.clearTimeout(timeout);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("load"));
    };
    image.src = src;
  });
}

async function processImageFile(file: File, options: { maxWidth: number; quality: number; preserveGif?: boolean }): Promise<ProcessedImage> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageSource(objectUrl);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;

    if (options.preserveGif && file.type === "image/gif") {
      return {
        dataUrl: await readFileAsDataUrl(file),
        width: sourceWidth,
        height: sourceHeight,
        sizeBytes: file.size,
        type: file.type,
      };
    }

    if (file.type === "image/webp" && sourceWidth <= options.maxWidth && file.size <= 800 * 1024) {
      return {
        dataUrl: await readFileAsDataUrl(file),
        width: sourceWidth,
        height: sourceHeight,
        sizeBytes: file.size,
        type: file.type,
      };
    }

    const scale = sourceWidth > options.maxWidth ? options.maxWidth / sourceWidth : 1;
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("No se pudo procesar la imagen.");
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", options.quality));
    if (!blob) {
      return {
        dataUrl: await readFileAsDataUrl(file),
        width: sourceWidth,
        height: sourceHeight,
        sizeBytes: file.size,
        type: file.type,
      };
    }

    return {
      dataUrl: await readFileAsDataUrl(blob),
      width,
      height,
      sizeBytes: blob.size,
      type: blob.type || "image/webp",
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function findAnchorFromRange(range: Range | null, editor: HTMLElement | null) {
  if (!range || !editor) {
    return null;
  }

  const node = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
    ? range.commonAncestorContainer
    : range.commonAncestorContainer.parentElement;

  if (!(node instanceof Element)) {
    return null;
  }

  const anchor = node.closest("a");

  return anchor instanceof HTMLAnchorElement && editor.contains(anchor) ? anchor : null;
}

function configureAnchor(anchor: HTMLAnchorElement, url: string, newTab: boolean) {
  anchor.href = url;

  if (newTab) {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    return;
  }

  anchor.removeAttribute("target");
  anchor.removeAttribute("rel");
}

function escapeHtml(value: string) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

function closestEditableElement(range: Range | null, editor: HTMLElement | null) {
  if (!range || !editor) {
    return null;
  }

  const node = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
    ? range.commonAncestorContainer
    : range.commonAncestorContainer.parentElement;

  return node instanceof Element && editor.contains(node) ? node : null;
}

function closestImageFigure(range: Range | null, editor: HTMLElement | null) {
  const element = closestEditableElement(range, editor);
  const figure = element?.closest("figure");

  return figure instanceof HTMLElement && editor?.contains(figure) && figure.querySelector("img") ? figure : null;
}

function plainTextFromHtml(html: string) {
  const template = document.createElement("template");
  template.innerHTML = html;
  return (template.content.textContent ?? "").replace(/\s+/g, " ").trim();
}

function editorMetrics(html: string) {
  const words = plainTextFromHtml(html).split(" ").filter(Boolean).length;
  return {
    words,
    minutes: Math.max(1, Math.ceil(words / 220)),
  };
}

function formatWordCount(words: number) {
  return new Intl.NumberFormat("es-EC").format(words);
}

function mediaProviderLabel(provider: MediaDetection["provider"]) {
  const labels: Record<MediaDetection["provider"], string> = {
    youtube: "YouTube",
    instagram: "Instagram",
    tiktok: "TikTok",
    x: "X",
    facebook: "Facebook",
    drive: "Google Drive",
    unsupported: "No compatible",
  };

  return labels[provider];
}

export function AdminBlogPage({ user }: AdminBlogPageProps) {
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const editorSelectionRef = useRef<Range | null>(null);
  const editingLinkRef = useRef<HTMLAnchorElement | null>(null);
  const editingImageRef = useRef<HTMLElement | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const toastIdRef = useRef(0);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [view, setView] = useState<ViewMode>("resumen");
  const [summary, setSummary] = useState<AdminBlogSummary | null>(null);
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("TODAS");
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [form, setForm] = useState<EditorForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<AdminPostStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState<EditorForm | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<MediaDetection | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkForm, setLinkForm] = useState<LinkForm>({ url: "", text: "", newTab: true });
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageForm, setImageForm] = useState<ImageForm>(emptyImageForm);
  const [imageSourceMode, setImageSourceMode] = useState<ImageSourceMode>("url");
  const [imagePreview, setImagePreview] = useState<ImagePreviewState>({
    status: "idle",
    message: "",
    src: null,
    width: null,
    height: null,
    sizeBytes: null,
  });
  const [inlineImageFileName, setInlineImageFileName] = useState("");
  const [inlineImageError, setInlineImageError] = useState<string | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableForm, setTableForm] = useState<TableForm>({ rows: 2, columns: 2 });
  const [isFullscreenEditor, setIsFullscreenEditor] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [coverMeta, setCoverMeta] = useState<{ width: number; height: number; sizeBytes: number } | null>(null);
  const [postPendingDelete, setPostPendingDelete] = useState<AdminBlogPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "" });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [activeTools, setActiveTools] = useState<Record<ActiveTool, boolean>>({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    p: false,
    h1: false,
    h2: false,
    h3: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
    unorderedList: false,
    orderedList: false,
    blockquote: false,
    link: false,
  });

  const photo = useMemo(() => professionalPhoto(user), [user]);
  const previewHtml = useMemo(() => renderArticleContentHtml(previewPost?.contenido ?? ""), [previewPost?.contenido]);
  const isSaving = savingStatus !== null;
  const metrics = useMemo(() => editorMetrics(form.contenido), [form.contenido]);

  function showToast(message: string, type: ToastType = "success") {
    toastIdRef.current += 1;
    const id = toastIdRef.current;

    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }

  function dismissToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function markDirty() {
    if (saveState !== "saving") {
      setSaveState("dirty");
    }
  }

  function updateForm(updater: (current: EditorForm) => EditorForm) {
    setForm(updater);
    markDirty();
  }

  async function refreshData(nextFilter = filter) {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryResponse, postsResponse] = await Promise.all([adminBlogApi.summary(), adminBlogApi.list(nextFilter)]);
      setSummary(summaryResponse.data);
      setPosts(postsResponse.data);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "No pudimos cargar el panel editorial.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshData();
  }, []);

  useEffect(() => {
    if (!postPendingDelete && !isLinkModalOpen && !isImageModalOpen && !isVideoModalOpen && !isTableModalOpen) {
      return undefined;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (postPendingDelete && !isDeleting) {
        setPostPendingDelete(null);
      }

      if (isLinkModalOpen) {
        closeLinkModal();
      }

      if (isImageModalOpen) {
        closeImageModal();
      }

      if (isVideoModalOpen) {
        closeVideoModal();
      }

      if (isTableModalOpen) {
        closeTableModal();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [postPendingDelete, isDeleting, isLinkModalOpen, isImageModalOpen, isVideoModalOpen, isTableModalOpen]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = form.contenido;
    }
  }, [currentPostId, view]);

  useEffect(() => {
    function handleSelectionChange() {
      const editor = editorRef.current;
      const selection = window.getSelection();

      if (!editor || !selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);
      if (!editor.contains(range.commonAncestorContainer)) {
        return;
      }

      editorSelectionRef.current = range.cloneRange();
      updateActiveTools(range);
    }

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  useEffect(() => {
    setVideoPreview(videoUrl.trim() ? detectMediaProvider(videoUrl) : null);
  }, [videoUrl]);

  useEffect(() => {
    if (!isImageModalOpen || imageSourceMode !== "url") {
      return undefined;
    }

    const rawUrl = imageForm.url.trim();
    if (!rawUrl) {
      setImagePreview({ status: "idle", message: "", src: null, width: null, height: null, sizeBytes: null });
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      const normalizedUrl = normalizeSafeUrl(rawUrl);

      if (!normalizedUrl || !/^https?:\/\//i.test(normalizedUrl)) {
        setImagePreview({
          status: "error",
          message: "Ingresa una URL publica con http o https.",
          src: null,
          width: null,
          height: null,
          sizeBytes: null,
        });
        return;
      }

      const pageHint = imagePageHint(normalizedUrl);
      if (pageHint) {
        setImagePreview({ status: "error", message: pageHint, src: null, width: null, height: null, sizeBytes: null });
        return;
      }

      setImagePreview({ status: "checking", message: "Comprobando imagen...", src: normalizedUrl, width: null, height: null, sizeBytes: null });
      void loadImageSource(normalizedUrl)
        .then((image) => {
          if (cancelled) {
            return;
          }

          setImagePreview({
            status: "valid",
            message: "Imagen disponible.",
            src: normalizedUrl,
            width: image.naturalWidth || image.width,
            height: image.naturalHeight || image.height,
            sizeBytes: null,
          });
        })
        .catch(() => {
          if (cancelled) {
            return;
          }

          setImagePreview({
            status: "error",
            message: "Este sitio no permite mostrar la imagen directamente. Descargala y utiliza la opcion Subir archivo.",
            src: null,
            width: null,
            height: null,
            sizeBytes: null,
          });
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [imageForm.url, imageSourceMode, isImageModalOpen]);

  useEffect(() => {
    function closeFullscreen(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsFullscreenEditor(false);
      }
    }

    window.addEventListener("keydown", closeFullscreen);
    return () => window.removeEventListener("keydown", closeFullscreen);
  }, []);

  useEffect(() => {
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    if (saveState !== "dirty") {
      return undefined;
    }

    const hasEnoughDraftData = Boolean(form.titulo.trim() || form.extracto.trim() || plainTextFromHtml(form.contenido) || form.imagenPortadaUrl);

    if (!hasEnoughDraftData) {
      return undefined;
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      void savePost("BORRADOR", { autosave: true });
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [form, saveState]);

  function resetEditor() {
    setCurrentPostId(null);
    setForm(emptyForm);
    setCoverMeta(null);
    setSaveState("idle");
    setLastSavedAt(null);
    setError(null);
    setView("editor");
  }

  async function openPost(postId: string) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminBlogApi.detail(postId);
      const post = response.data;
      setCurrentPostId(post.id);
      setForm({
        titulo: post.titulo,
        extracto: post.extracto ?? "",
        contenido: post.contenido,
        imagenPortadaUrl: post.imagen,
      });
      setCoverMeta(null);
      setSaveState("saved");
      setLastSavedAt(new Date(post.actualizadoEn));
      setView("editor");
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "No pudimos abrir la publicacion.");
    } finally {
      setIsLoading(false);
    }
  }

  function saveEditorSelection() {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (editor.contains(range.commonAncestorContainer)) {
      editorSelectionRef.current = range.cloneRange();
    }
  }

  function restoreEditorSelection() {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection) {
      return;
    }

    editor.focus();
    selection.removeAllRanges();

    if (editorSelectionRef.current) {
      selection.addRange(editorSelectionRef.current);
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.addRange(range);
  }

  function selectionElement(range = editorSelectionRef.current) {
    return closestEditableElement(range, editorRef.current);
  }

  function updateActiveTools(range = editorSelectionRef.current) {
    const editor = editorRef.current;
    const element = selectionElement(range);

    if (!editor || !element) {
      return;
    }

    const block = element.closest("h1,h2,h3,p,blockquote,li");
    const aligned = element.closest(".text-align-left,.text-align-center,.text-align-right,.text-align-justify");
    const nextState: Record<ActiveTool, boolean> = {
      bold: document.queryCommandState("bold") || Boolean(element.closest("strong,b")),
      italic: document.queryCommandState("italic") || Boolean(element.closest("em,i")),
      underline: document.queryCommandState("underline") || Boolean(element.closest("u")),
      strikeThrough: document.queryCommandState("strikeThrough") || Boolean(element.closest("s,strike,del")),
      p: block?.tagName === "P",
      h1: block?.tagName === "H1",
      h2: block?.tagName === "H2",
      h3: block?.tagName === "H3",
      alignLeft: aligned?.classList.contains("text-align-left") ?? false,
      alignCenter: aligned?.classList.contains("text-align-center") ?? false,
      alignRight: aligned?.classList.contains("text-align-right") ?? false,
      alignJustify: aligned?.classList.contains("text-align-justify") ?? false,
      unorderedList: document.queryCommandState("insertUnorderedList") || Boolean(element.closest("ul")),
      orderedList: document.queryCommandState("insertOrderedList") || Boolean(element.closest("ol")),
      blockquote: block?.tagName === "BLOCKQUOTE",
      link: Boolean(element.closest("a")),
    };

    setActiveTools(nextState);
  }

  function refreshEditorState() {
    saveEditorSelection();
    updateActiveTools();
  }

  function syncEditorContent() {
    setForm((current) => ({ ...current, contenido: editorRef.current?.innerHTML ?? "" }));
    markDirty();
  }

  function applyCommand(command: string, value?: string) {
    restoreEditorSelection();
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncEditorContent();
    saveEditorSelection();
    window.setTimeout(updateActiveTools, 0);
  }

  function applyHeading(tag: "p" | "h1" | "h2" | "h3") {
    applyCommand("formatBlock", tag);
  }

  function toggleAlignment(alignment: "left" | "center" | "right" | "justify") {
    restoreEditorSelection();
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const blocks = Array.from(editor.querySelectorAll<HTMLElement>("p,h1,h2,h3,li,blockquote,div")).filter((element) => {
      return range.intersectsNode(element) && !element.hasAttribute("data-content-block");
    });

    const targets = blocks.length ? blocks : [closestEditableElement(range, editor)?.closest("p,h1,h2,h3,li,blockquote,div")].filter(Boolean);

    targets.forEach((target) => {
      if (!(target instanceof HTMLElement) || !editor.contains(target)) {
        return;
      }

      target.classList.remove("text-align-left", "text-align-center", "text-align-right", "text-align-justify");
      target.classList.add(`text-align-${alignment}`);
    });

    syncEditorContent();
    saveEditorSelection();
    window.setTimeout(updateActiveTools, 0);
  }

  function removeAlignmentFromSelection() {
    const editor = editorRef.current;
    const range = editorSelectionRef.current;

    if (!editor || !range) {
      return;
    }

    editor.querySelectorAll<HTMLElement>(".text-align-left, .text-align-center, .text-align-right, .text-align-justify").forEach((element) => {
      if (range.intersectsNode(element)) {
        element.classList.remove("text-align-left", "text-align-center", "text-align-right", "text-align-justify");
      }
    });
  }

  function cleanFormatting() {
    restoreEditorSelection();
    document.execCommand("removeFormat");
    document.execCommand("formatBlock", false, "p");
    removeAlignmentFromSelection();
    syncEditorContent();
    saveEditorSelection();
    window.setTimeout(updateActiveTools, 0);
  }

  function removeCurrentLink() {
    const editor = editorRef.current;
    const anchor = findAnchorFromRange(editorSelectionRef.current, editor);

    if (!editor || !anchor) {
      showToast("Ubica el cursor dentro de un enlace para quitarlo.", "info");
      return;
    }

    anchor.replaceWith(document.createTextNode(anchor.textContent ?? ""));
    syncEditorContent();
    editor.focus();
    saveEditorSelection();
    window.setTimeout(updateActiveTools, 0);
  }

  function insertHorizontalRule() {
    applyCommand("insertHTML", "<hr><p><br></p>");
  }

  function openTableModal() {
    saveEditorSelection();
    setTableForm({ rows: 2, columns: 2 });
    setIsTableModalOpen(true);
  }

  function closeTableModal() {
    setIsTableModalOpen(false);
  }

  function insertTable() {
    const rows = Math.min(10, Math.max(1, Number(tableForm.rows) || 2));
    const columns = Math.min(8, Math.max(1, Number(tableForm.columns) || 2));
    const cells = Array.from({ length: columns }, () => "<td><br></td>").join("");
    const body = Array.from({ length: rows }, () => `<tr>${cells}</tr>`).join("");

    applyCommand("insertHTML", `<table><tbody>${body}</tbody></table><p><br></p>`);
    closeTableModal();
  }

  function insertCallout(type: CalloutType) {
    const labels: Record<CalloutType, string> = {
      info: "Nota",
      warning: "Importante",
      update: "Actualizacion",
    };

    applyCommand("insertHTML", `<div class="article-callout article-callout--${type}"><strong>${labels[type]}</strong><p>Escribe aqui el contenido destacado.</p></div><p><br></p>`);
  }

  function handleEditorInput(event: FormEvent<HTMLDivElement>) {
    const html = event.currentTarget.innerHTML;
    updateForm((current) => ({ ...current, contenido: html }));
    refreshEditorState();
  }

  function handleEditorPaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();

    const clipboard = event.clipboardData;
    const html = clipboard.getData("text/html");
    const text = clipboard.getData("text/plain");
    const pastedContent = html ? sanitizeHtml(html) : plainTextToHtml(text);

    if (pastedContent) {
      document.execCommand("insertHTML", false, pastedContent);
    }

    const htmlAfterPaste = editorRef.current?.innerHTML ?? event.currentTarget.innerHTML;
    updateForm((current) => ({ ...current, contenido: htmlAfterPaste }));
    refreshEditorState();
  }

  function openVideoModal() {
    saveEditorSelection();
    setVideoUrl("");
    setVideoError(null);
    setIsVideoModalOpen(true);
  }

  function closeVideoModal() {
    setIsVideoModalOpen(false);
    setVideoUrl("");
    setVideoError(null);
    setVideoPreview(null);
  }

  function insertLink() {
    const editor = editorRef.current;
    const anchor = findAnchorFromRange(editorSelectionRef.current, editor);

    editingLinkRef.current = anchor;
    setLinkError(null);
    setLinkForm({
      url: anchor?.getAttribute("href") ?? "",
      text: anchor?.textContent ?? editorSelectionRef.current?.toString() ?? "",
      newTab: anchor?.getAttribute("target") === "_blank" || !anchor,
    });
    setIsLinkModalOpen(true);
  }

  function closeLinkModal() {
    setIsLinkModalOpen(false);
    setLinkError(null);
    editingLinkRef.current = null;
  }

  function applyLinkFromModal() {
    const normalizedUrl = normalizeSafeUrl(linkForm.url);
    const visibleText = linkForm.text.trim();
    const editor = editorRef.current;

    if (!normalizedUrl) {
      setLinkError("Ingresa una URL valida: http, https, mailto o tel.");
      return;
    }

    if (!visibleText) {
      setLinkError("Escribe el texto visible del enlace.");
      return;
    }

    if (!editor) {
      return;
    }

    const existingAnchor = editingLinkRef.current;

    if (existingAnchor && editor.contains(existingAnchor)) {
      existingAnchor.textContent = visibleText;
      configureAnchor(existingAnchor, normalizedUrl, linkForm.newTab);
      syncEditorContent();
      closeLinkModal();
      editor.focus();
      saveEditorSelection();
      window.setTimeout(updateActiveTools, 0);
      return;
    }

    restoreEditorSelection();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const anchor = document.createElement("a");
    anchor.textContent = visibleText;
    configureAnchor(anchor, normalizedUrl, linkForm.newTab);
    range.deleteContents();
    range.insertNode(anchor);
    range.setStartAfter(anchor);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    editorSelectionRef.current = range.cloneRange();
    syncEditorContent();
    closeLinkModal();
    editor.focus();
    saveEditorSelection();
    window.setTimeout(updateActiveTools, 0);
  }

  function removeLinkFromModal() {
    const editor = editorRef.current;
    const anchor = editingLinkRef.current;

    if (!editor || !anchor || !editor.contains(anchor)) {
      closeLinkModal();
      return;
    }

    const textNode = document.createTextNode(anchor.textContent ?? "");
    anchor.replaceWith(textNode);
    syncEditorContent();
    closeLinkModal();
    editor.focus();
    saveEditorSelection();
    window.setTimeout(updateActiveTools, 0);
  }

  function insertVideo() {
    const video = videoPreview?.provider === "unsupported" ? null : (videoPreview ?? parseVideoUrl(videoUrl));

    if (!video) {
      setVideoError("Enlace de video no compatible.");
      return;
    }

    applyCommand("insertHTML", createVideoBlockHtml(video));
    closeVideoModal();
  }

  function openCurrentPreview() {
    const currentContent = editorRef.current?.innerHTML ?? form.contenido;
    setPreviewPost({ ...form, contenido: currentContent });
  }

  function insertInlineImage() {
    saveEditorSelection();
    const figure = closestImageFigure(editorSelectionRef.current, editorRef.current);
    const image = figure?.querySelector("img");
    const caption = figure?.querySelector("figcaption");

    editingImageRef.current = figure;
    if (image && figure) {
      const source = image.getAttribute("src") ?? "";
      setImageForm({
        url: source,
        alt: image.getAttribute("alt") ?? "",
        caption: caption?.textContent ?? "",
        align: figure.classList.contains("image-align-left") ? "left" : figure.classList.contains("image-align-right") ? "right" : figure.classList.contains("image-align-full") ? "full" : "center",
        size: figure.classList.contains("image-size-25") ? "25" : figure.classList.contains("image-size-50") ? "50" : figure.classList.contains("image-size-75") ? "75" : "100",
      });
      setImageSourceMode(isSafeImageDataUrl(source) ? "upload" : "url");
      setImagePreview({
        status: "valid",
        message: "Imagen cargada.",
        src: source,
        width: null,
        height: null,
        sizeBytes: null,
      });
    } else {
      setImageForm(emptyImageForm);
      setImageSourceMode("url");
      setImagePreview({ status: "idle", message: "", src: null, width: null, height: null, sizeBytes: null });
    }
    setInlineImageFileName("");
    setInlineImageError(null);
    setIsImageModalOpen(true);
  }

  function closeImageModal() {
    setIsImageModalOpen(false);
    setImageForm(emptyImageForm);
    setImageSourceMode("url");
    setImagePreview({ status: "idle", message: "", src: null, width: null, height: null, sizeBytes: null });
    setInlineImageFileName("");
    setInlineImageError(null);
    editingImageRef.current = null;
  }

  function applyInlineImageFromModal() {
    const normalizedUrl = imageSourceMode === "upload" && isSafeImageDataUrl(imageForm.url)
      ? imageForm.url
      : normalizeSafeUrl(imageForm.url);

    if (!normalizedUrl || (!/^https?:\/\//i.test(normalizedUrl) && !isSafeImageDataUrl(normalizedUrl))) {
      setInlineImageError("Ingresa una URL publica valida o sube una imagen permitida.");
      return;
    }

    if (imageSourceMode === "url" && imagePreview.status !== "valid") {
      setInlineImageError("Primero comprueba que la URL cargue como imagen.");
      return;
    }

    const alt = escapeHtml(imageForm.alt.trim());
    const caption = escapeHtml(imageForm.caption.trim());
    const alignClass = `image-align-${imageForm.align}`;
    const sizeClass = `image-size-${imageForm.size}`;
    const figureHtml = `<figure class="article-image ${alignClass} ${sizeClass}"><img src="${escapeHtml(normalizedUrl).replace(/"/g, "&quot;")}" alt="${alt}">${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure><p><br></p>`;
    const existingFigure = editingImageRef.current;

    if (existingFigure && editorRef.current?.contains(existingFigure)) {
      existingFigure.outerHTML = figureHtml;
      syncEditorContent();
      closeImageModal();
      return;
    }

    applyCommand("insertHTML", figureHtml);
    closeImageModal();
  }

  async function handleInlineImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!INLINE_IMAGE_ALLOWED_TYPES.includes(file.type)) {
      setInlineImageError("Formato no permitido. Usa JPG, PNG, WEBP o GIF.");
      return;
    }

    if (file.size > COVER_MAX_SIZE_BYTES) {
      setInlineImageError("La imagen supera el limite maximo de 2 MB. Selecciona una imagen mas ligera.");
      return;
    }

    setInlineImageError(null);
    setImagePreview({ status: "checking", message: "Procesando imagen...", src: null, width: null, height: null, sizeBytes: null });

    try {
      const processed = await processImageFile(file, { maxWidth: COVER_MAX_WIDTH, quality: COVER_TARGET_QUALITY, preserveGif: true });
      setImageForm((current) => ({ ...current, url: processed.dataUrl }));
      setInlineImageFileName(file.name);
      setImagePreview({
        status: "valid",
        message: "Imagen lista para insertar.",
        src: processed.dataUrl,
        width: processed.width,
        height: processed.height,
        sizeBytes: processed.sizeBytes,
      });
    } catch {
      setImagePreview({ status: "error", message: "No se pudo procesar esta imagen.", src: null, width: null, height: null, sizeBytes: null });
    }
  }

  function removeInlineImageFromModal() {
    const figure = editingImageRef.current;

    if (figure && editorRef.current?.contains(figure)) {
      figure.remove();
      syncEditorContent();
    }

    closeImageModal();
  }

  async function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!COVER_ALLOWED_TYPES.includes(file.type)) {
      setCoverError("Formato no permitido. Usa JPG, PNG o WebP.");
      return;
    }

    if (file.size > COVER_MAX_SIZE_BYTES) {
      setCoverError("La imagen supera el limite maximo de 2 MB. Selecciona una imagen mas ligera.");
      return;
    }

    setCoverError(null);
    setCoverMeta(null);

    try {
      const processed = await processImageFile(file, { maxWidth: COVER_MAX_WIDTH, quality: COVER_TARGET_QUALITY });
      updateForm((current) => ({ ...current, imagenPortadaUrl: processed.dataUrl }));
      setCoverMeta({ width: processed.width, height: processed.height, sizeBytes: processed.sizeBytes });
    } catch {
      setCoverError("No se pudo procesar la imagen. Intenta con otro archivo JPG, PNG o WebP.");
    }
  }

  function removeCoverImage() {
    updateForm((current) => ({ ...current, imagenPortadaUrl: null }));
    setCoverMeta(null);
    setCoverError(null);
  }

  async function savePost(status: AdminPostStatus, options: { autosave?: boolean } = {}) {
    setError(null);

    const titulo = form.titulo.trim();
    const contenido = form.contenido.trim();

    if (status === "PUBLICADO" && (!titulo || !contenido)) {
      if (!options.autosave) {
        showToast("Escribe titulo y contenido para publicar.", "error");
      }
      return;
    }

    if (status === "BORRADOR" && !titulo && !form.extracto.trim() && !contenido && !form.imagenPortadaUrl) {
      if (!options.autosave) {
        showToast("Escribe al menos un dato para guardar el borrador.", "error");
      }
      return;
    }

    const isEditingExistingPost = Boolean(currentPostId);
    setSaveState("saving");
    setSavingStatus(status);
    try {
      const payload = {
        titulo: titulo || "Borrador sin titulo",
        extracto: form.extracto.trim(),
        contenido,
        imagenPortadaUrl: form.imagenPortadaUrl,
        estado: status,
      };
      const response = currentPostId ? await adminBlogApi.update(currentPostId, payload) : await adminBlogApi.create(payload);
      setCurrentPostId(response.data.id);
      setForm({
        titulo: response.data.titulo,
        extracto: response.data.extracto ?? "",
        contenido: response.data.contenido,
        imagenPortadaUrl: response.data.imagen,
      });
      setSaveState("saved");
      setLastSavedAt(new Date());
      if (!options.autosave) {
        showToast(status === "PUBLICADO" ? (isEditingExistingPost ? "Publicación actualizada correctamente." : "Publicación publicada correctamente.") : "Borrador guardado correctamente.");
      }
      if (!options.autosave) {
        await refreshData();
      }
    } catch (caughtError) {
      console.error("Error al guardar publicacion", caughtError);
      setSaveState("error");
      if (!options.autosave) {
        showToast(caughtError instanceof ApiError ? caughtError.message : status === "PUBLICADO" ? "No se pudo publicar. Intenta nuevamente." : "No se pudo guardar el borrador. Intenta nuevamente.", "error");
      }
    } finally {
      setSavingStatus(null);
    }
  }

  async function changeStatus(post: AdminBlogPost, status: AdminPostStatus) {
    setError(null);
    try {
      await adminBlogApi.updateStatus(post.id, status);
      showToast(status === "PUBLICADO" ? "Publicación publicada correctamente." : "Publicación actualizada correctamente.");
      await refreshData();
    } catch (caughtError) {
      showToast(caughtError instanceof ApiError ? caughtError.message : "No pudimos actualizar el estado.", "error");
    }
  }

  function requestDeletePost(post: AdminBlogPost) {
    setPostPendingDelete(post);
  }

  async function confirmDeletePost() {
    if (!postPendingDelete) {
      return;
    }

    setError(null);
    setIsDeleting(true);
    try {
      await adminBlogApi.delete(postPendingDelete.id);
      if (currentPostId === postPendingDelete.id) {
        setCurrentPostId(null);
        setForm(emptyForm);
      }
      setPostPendingDelete(null);
      showToast("Publicación eliminada correctamente.");
      await refreshData();
    } catch (caughtError) {
      showToast(caughtError instanceof ApiError ? caughtError.message : "No pudimos eliminar la publicacion.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleLogout() {
    await adminAuthApi.logout().catch(() => undefined);
    navigate("/admin/login", { replace: true });
  }

  async function handlePasswordChange() {
    setError(null);
    const password = passwordForm.password.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (!password) {
      showToast("La nueva contraseña es obligatoria.", "error");
      return;
    }

    if (!confirmPassword) {
      showToast("Confirma la nueva contraseña.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Las contraseñas no coinciden.", "error");
      return;
    }

    if (password.length < 8) {
      showToast("La contraseña debe tener al menos 8 caracteres.", "error");
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      showToast("La contraseña debe incluir al menos una letra y un número.", "error");
      return;
    }

    try {
      await adminAuthApi.changePassword({ password });
      setPasswordForm({ password: "", confirmPassword: "" });
      setIsPasswordVisible(false);
      setIsPasswordOpen(false);
      showToast("Tu contraseña ha sido modificada correctamente.");
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        showToast("Tu sesión ha expirado. Inicia sesión nuevamente.", "error");
        return;
      }

      showToast("No se pudo modificar la contraseña. Intenta nuevamente.", "error");
    }
  }

  async function updateFilter(nextFilter: StatusFilter) {
    setFilter(nextFilter);
    await refreshData(nextFilter);
  }

  function handleEditorKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === "k") {
      event.preventDefault();
      saveEditorSelection();
      insertLink();
      return;
    }

    if (key === "y" || (key === "z" && event.shiftKey)) {
      event.preventDefault();
      applyCommand("redo");
    }
  }

  const saveStateLabel = saveState === "dirty"
    ? "Cambios sin guardar"
    : saveState === "saving"
      ? "Guardando..."
      : saveState === "saved"
        ? `Borrador guardado${lastSavedAt ? ` · ${lastSavedAt.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}` : ""}`
        : saveState === "error"
          ? "Error al guardar"
          : "Sin cambios";

  const toolbarGroups: ToolbarGroup[] = [
    {
      label: "Formato",
      tools: [
        { icon: <Bold />, label: "Negrita (Ctrl+B)", action: () => applyCommand("bold"), activeKey: "bold", isToggle: true },
        { icon: <Italic />, label: "Cursiva (Ctrl+I)", action: () => applyCommand("italic"), activeKey: "italic", isToggle: true },
        { icon: <Underline />, label: "Subrayado (Ctrl+U)", action: () => applyCommand("underline"), activeKey: "underline", isToggle: true },
        { icon: <Strikethrough />, label: "Tachado", action: () => applyCommand("strikeThrough"), activeKey: "strikeThrough", isToggle: true },
      ],
    },
    {
      label: "Titulos",
      tools: [
        { icon: <Pilcrow />, label: "Parrafo normal", action: () => applyHeading("p"), activeKey: "p", isToggle: true },
        { icon: <Heading1 />, label: "Titulo 1", action: () => applyHeading("h1"), activeKey: "h1", isToggle: true },
        { icon: <Heading2 />, label: "Titulo 2", action: () => applyHeading("h2"), activeKey: "h2", isToggle: true },
        { icon: <Heading3 />, label: "Titulo 3", action: () => applyHeading("h3"), activeKey: "h3", isToggle: true },
      ],
    },
    {
      label: "Alineacion",
      tools: [
        { icon: <AlignLeft />, label: "Alinear a la izquierda", action: () => toggleAlignment("left"), activeKey: "alignLeft", isToggle: true },
        { icon: <AlignCenter />, label: "Centrar", action: () => toggleAlignment("center"), activeKey: "alignCenter", isToggle: true },
        { icon: <AlignRight />, label: "Alinear a la derecha", action: () => toggleAlignment("right"), activeKey: "alignRight", isToggle: true },
        { icon: <AlignJustify />, label: "Justificar", action: () => toggleAlignment("justify"), activeKey: "alignJustify", isToggle: true },
      ],
    },
    {
      label: "Estructura",
      tools: [
        { icon: <List />, label: "Lista con viñetas", action: () => applyCommand("insertUnorderedList"), activeKey: "unorderedList", isToggle: true },
        { icon: <ListOrdered />, label: "Lista numerada", action: () => applyCommand("insertOrderedList"), activeKey: "orderedList", isToggle: true },
        { icon: <Quote />, label: "Cita", action: () => applyCommand("formatBlock", "blockquote"), activeKey: "blockquote", isToggle: true },
        { icon: <Minus />, label: "Insertar separador", action: insertHorizontalRule },
        { icon: <Table2 />, label: "Insertar tabla", action: openTableModal },
        { icon: <Info />, label: "Insertar nota", action: () => insertCallout("info") },
        { icon: <AlertTriangle />, label: "Insertar aviso importante", action: () => insertCallout("warning") },
      ],
    },
    {
      label: "Multimedia",
      tools: [
        { icon: <LinkIcon />, label: "Insertar o editar enlace (Ctrl+K)", action: insertLink, activeKey: "link", isToggle: true },
        { icon: <Unlink />, label: "Quitar enlace", action: removeCurrentLink, disabled: !activeTools.link },
        { icon: <ImageIcon />, label: "Insertar imagen", action: insertInlineImage },
        { icon: <Video />, label: "Insertar video o publicacion", action: openVideoModal },
      ],
    },
    {
      label: "Edicion",
      tools: [
        { icon: <RemoveFormatting />, label: "Limpiar formato", action: cleanFormatting },
        { icon: <Undo2 />, label: "Deshacer (Ctrl+Z)", action: () => applyCommand("undo") },
        { icon: <Redo2 />, label: "Rehacer", action: () => applyCommand("redo") },
      ],
    },
    {
      label: "Vista",
      tools: [
        { icon: <Eye />, label: "Vista previa", action: openCurrentPreview },
        { icon: isFullscreenEditor ? <Minimize2 /> : <Fullscreen />, label: isFullscreenEditor ? "Salir de pantalla completa" : "Pantalla completa", action: () => setIsFullscreenEditor((current) => !current) },
      ],
    },
  ];

  return (
    <main className="admin-editorial">
      <div className="admin-editorial__shell">
        <aside className="admin-editorial__sidebar">
          <img className="admin-editorial__logo" src={logoAsset} alt="De Mora Legal Group" />
          <nav aria-label="Panel editorial">
            <span>Panel editorial</span>
            <button className={view === "resumen" ? "is-active" : ""} type="button" onClick={() => setView("resumen")}>
              <Home /> Resumen
            </button>
            <button className={view === "publicaciones" ? "is-active" : ""} type="button" onClick={() => setView("publicaciones")}>
              <FileEdit /> Publicaciones
            </button>
            <button className={view === "editor" && !currentPostId ? "is-active" : ""} type="button" onClick={resetEditor}>
              <Plus /> Nueva publicacion
            </button>
          </nav>
          <button className="admin-editorial__logout" type="button" onClick={handleLogout}>
            <LogOut /> Cerrar sesion
          </button>
          <div className="admin-editorial__brand">
            <strong>De Mora Legal Group</strong>
            <span>Panel Editorial</span>
            <small>© 2026 Todos los derechos reservados.</small>
          </div>
        </aside>

        <section className="admin-editorial__workspace">
        <header className="admin-editorial__topbar">
          <div>
            <h1>Bienvenido, {user.profesional.nombres.split(" ")[0]}</h1>
            <p>Gestiona aqui el contenido que compartes en nuestro blog.</p>
          </div>
          <div className="admin-profile-menu">
            <button type="button" onClick={() => setIsProfileOpen((current) => !current)}>
              <img src={photo} alt={user.profesional.nombreCompleto} />
              <span>
                <strong>{user.profesional.nombreCompleto}</strong>
                <small>{user.profesional.cargo ?? "Abogado"}</small>
              </span>
              <ChevronDown />
            </button>
            {isProfileOpen ? (
              <div className="admin-profile-menu__dropdown">
                <button type="button" onClick={() => setIsPasswordOpen(true)}>
                  Cambiar contraseña
                </button>
                <button type="button" onClick={handleLogout}>
                  Cerrar sesion
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <div className="admin-toast-stack" aria-live="polite" aria-atomic="false">
          {toasts.map((toast) => (
            <div className={`admin-toast admin-toast--${toast.type}`} role={toast.type === "error" ? "alert" : "status"} key={toast.id}>
              <span>{toast.message}</span>
              <button type="button" onClick={() => dismissToast(toast.id)} aria-label="Cerrar notificacion">Cerrar</button>
            </div>
          ))}
        </div>

        {error ? <p className="admin-toast admin-toast--error">{error}</p> : null}
        {isLoading ? <p className="admin-toast">Cargando contenido editorial...</p> : null}

        {view === "resumen" && (
          <AdminSummaryView
            summary={summary}
            onNewPost={resetEditor}
            onOpenPost={openPost}
          />
        )}

        {view === "editor" && (
          <section className="admin-card admin-card--editor admin-card--editor-full">
            <div className="admin-card__header">
              <h2>{currentPostId ? "Editar publicacion" : "Nueva publicacion"}</h2>
              <span className="admin-badge admin-badge--borrador">Borrador</span>
            </div>
            <label className="admin-editor-field">
              <span>Titulo</span>
              <input value={form.titulo} placeholder="Escribe un titulo atractivo..." onChange={(event) => updateForm((current) => ({ ...current, titulo: event.target.value }))} />
            </label>
            <label className="admin-editor-field">
              <span>Resumen</span>
              <textarea value={form.extracto} placeholder="Breve descripcion que aparecera en la tarjeta del blog..." onChange={(event) => updateForm((current) => ({ ...current, extracto: event.target.value }))} />
            </label>
            <EditorErrorBoundary>
              <div className={`admin-editor-field admin-editor-field--content ${isFullscreenEditor ? "is-fullscreen" : ""}`}>
                <span>Contenido</span>
                <div className="admin-rich-toolbar" aria-label="Herramientas del editor">
                  {toolbarGroups.map((group) => (
                    <div className="admin-rich-toolbar__group" key={group.label} aria-label={group.label}>
                      <span>{group.label}</span>
                      {group.tools.map((tool) => (
                        <button
                          type="button"
                          className={tool.activeKey && activeTools[tool.activeKey] ? "is-active" : ""}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={tool.action}
                          aria-label={tool.label}
                          aria-pressed={tool.isToggle ? Boolean(tool.activeKey && activeTools[tool.activeKey]) : undefined}
                          title={tool.label}
                          disabled={tool.disabled}
                          key={tool.label}
                        >
                          {tool.icon}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                <div
                  ref={editorRef}
                  className="admin-rich-editor"
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="Empieza a escribir tu contenido aqui..."
                  onInput={handleEditorInput}
                  onPaste={handleEditorPaste}
                  onKeyDown={handleEditorKeyDown}
                  onKeyUp={saveEditorSelection}
                  onMouseUp={saveEditorSelection}
                  onBlur={saveEditorSelection}
                />
                <div className="admin-editor-meta">
                  <span>{formatWordCount(metrics.words)} palabras · {metrics.minutes} min de lectura</span>
                  <span className={`admin-save-state admin-save-state--${saveState}`}>{saveStateLabel}</span>
                </div>
              </div>
            </EditorErrorBoundary>
            <div className="admin-editor-bottom">
              <div>
                <span>Imagen de portada</span>
                <small className="admin-cover-help">JPG, PNG o WEBP · Maximo 2 MB</small>
                <small className="admin-cover-help">Recomendado: 1600 x 900 px</small>
                <button className="admin-cover-picker" type="button" onClick={() => coverInputRef.current?.click()}>
                  {form.imagenPortadaUrl ? <img src={form.imagenPortadaUrl} alt="" /> : <><ImageIcon /><strong>Seleccionar imagen</strong><small>JPG, PNG o WEBP · Maximo 2 MB</small></>}
                </button>
                <input ref={coverInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleCoverChange} />
                {coverMeta ? <small className="admin-cover-help">{coverMeta.width} x {coverMeta.height} px · {formatFileSize(coverMeta.sizeBytes)}</small> : null}
                {form.imagenPortadaUrl ? (
                  <div className="admin-cover-actions">
                    <button className="admin-button admin-button--outline" type="button" onClick={() => coverInputRef.current?.click()}>Cambiar imagen</button>
                    <button className="admin-button admin-button--ghost admin-button--danger" type="button" onClick={removeCoverImage}>Eliminar imagen</button>
                  </div>
                ) : null}
                {coverError ? <p className="admin-form-message admin-form-message--error">{coverError}</p> : null}
              </div>
              <div className="admin-author-box">
                <span>Autor</span>
                <div>
                  <img src={photo} alt="" />
                  <p>
                    <strong>{user.profesional.nombreCompleto}</strong>
                    <small>Se asigna automaticamente</small>
                  </p>
                </div>
              </div>
            </div>
            <div className="admin-editor-actions">
              <button className="admin-button admin-button--outline" type="button" onClick={() => savePost("BORRADOR")} disabled={isSaving}>
                <Save /> {savingStatus === "BORRADOR" ? "Guardando..." : "Guardar borrador"}
              </button>
              <button className="admin-button admin-button--outline" type="button" onClick={openCurrentPreview}>
                <Eye /> Vista previa
              </button>
              <button className="admin-button admin-button--primary" type="button" onClick={() => savePost("PUBLICADO")} disabled={isSaving}>
                <Send /> {savingStatus === "PUBLICADO" ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </section>
        )}

        {view === "publicaciones" && (
          <section className="admin-card admin-publications">
            <div className="admin-card__header">
              <h2>Publicaciones</h2>
              <div className="admin-filter">
                {(["TODAS", "PUBLICADO", "BORRADOR"] as const).map((status) => (
                  <button key={status} className={filter === status ? "is-active" : ""} type="button" onClick={() => updateFilter(status)}>
                    {status === "TODAS" ? "Todas" : postStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>
            <div className="admin-publications__list">
              {posts.map((post) => (
                <article key={post.id} className="admin-publication-row">
                  <img src={postImage(post)} alt="" />
                  <div>
                    <h3>{post.titulo}</h3>
                    <p>{post.extracto ?? "Sin resumen"}</p>
                    <small>{formatAdminDate(post.fecha ?? post.actualizadoEn)}</small>
                  </div>
                  <span className={`admin-badge admin-badge--${post.estado.toLowerCase()}`}>{postStatusLabel(post.estado)}</span>
                  <button type="button" onClick={() => openPost(post.id)}><Edit3 /> Editar</button>
                  <button type="button" onClick={() => changeStatus(post, post.estado === "PUBLICADO" ? "BORRADOR" : "PUBLICADO")}>
                    {post.estado === "PUBLICADO" ? "Pasar a borrador" : "Publicar"}
                  </button>
                  <button type="button" onClick={() => requestDeletePost(post)}><Trash2 /> Eliminar</button>
                </article>
              ))}
            </div>
          </section>
        )}
        </section>
      </div>

      {previewPost ? (
        <div className="admin-modal" role="dialog" aria-modal="true" onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setPreviewPost(null);
          }
        }}>
          <article className="admin-modal__panel admin-preview">
            <button className="admin-modal__close" type="button" onClick={() => setPreviewPost(null)}>Cerrar</button>
            {previewPost.imagenPortadaUrl ? <img src={previewPost.imagenPortadaUrl} alt="" /> : null}
            <h2>{previewPost.titulo || "Titulo de la publicacion"}</h2>
            <p>{previewPost.extracto}</p>
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </article>
        </div>
      ) : null}

      {isVideoModalOpen ? (
        <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-video-title" onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeVideoModal();
          }
        }}>
          <section className="admin-modal__panel admin-video-dialog">
            <h2 id="admin-video-title">Insertar video o publicación</h2>
            <label>
              URL del contenido
              <input value={videoUrl} placeholder="Pega un enlace de YouTube, Instagram, TikTok, X, Facebook o Google Drive" onChange={(event) => setVideoUrl(event.target.value)} autoFocus />
            </label>
            <small>Compatible con YouTube, Instagram, TikTok, X, Facebook y Google Drive.</small>
            {videoPreview ? (
              <div className={`admin-video-preview ${videoPreview.provider === "unsupported" ? "admin-video-preview--error" : ""}`}>
                <strong>Plataforma detectada: {mediaProviderLabel(videoPreview.provider)}</strong>
                <small>{videoPreview.provider === "unsupported" ? videoPreview.reason : videoPreview.url}</small>
              </div>
            ) : null}
            {videoError ? <p className="admin-form-message admin-form-message--error">{videoError}</p> : null}
            <div className="admin-editor-actions">
              <button className="admin-button admin-button--outline" type="button" onClick={closeVideoModal}>Cancelar</button>
              <button className="admin-button admin-button--primary" type="button" onClick={insertVideo}>Insertar</button>
            </div>
          </section>
        </div>
      ) : null}

      {isLinkModalOpen ? (
        <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-link-title" onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeLinkModal();
          }
        }}>
          <section className="admin-modal__panel admin-link-dialog">
            <h2 id="admin-link-title">Agregar enlace</h2>
            <label>
              URL del enlace
              <input
                value={linkForm.url}
                placeholder="https://ejemplo.com"
                onChange={(event) => setLinkForm((current) => ({ ...current, url: event.target.value }))}
                autoFocus
              />
            </label>
            <label>
              Texto visible
              <input
                value={linkForm.text}
                placeholder="Texto que verá el lector"
                onChange={(event) => setLinkForm((current) => ({ ...current, text: event.target.value }))}
              />
            </label>
            <label className="admin-checkbox-field">
              <input
                type="checkbox"
                checked={linkForm.newTab}
                onChange={(event) => setLinkForm((current) => ({ ...current, newTab: event.target.checked }))}
              />
              Abrir en una nueva pestaña
            </label>
            {linkError ? <p className="admin-form-message admin-form-message--error">{linkError}</p> : null}
            <div className="admin-modal-actions">
              {editingLinkRef.current ? (
                <button className="admin-button admin-button--ghost admin-button--danger" type="button" onClick={removeLinkFromModal}>Quitar enlace</button>
              ) : null}
              <button className="admin-button admin-button--outline" type="button" onClick={closeLinkModal}>Cancelar</button>
              <button className="admin-button admin-button--primary" type="button" onClick={applyLinkFromModal}>Agregar enlace</button>
            </div>
          </section>
        </div>
      ) : null}

      {isImageModalOpen ? (
        <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-image-title" onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeImageModal();
          }
        }}>
          <section className="admin-modal__panel admin-link-dialog admin-image-dialog">
            <h2 id="admin-image-title">{editingImageRef.current ? "Editar imagen" : "Insertar imagen"}</h2>
            <div className="admin-image-tabs" role="tablist" aria-label="Origen de imagen">
              <button
                className={imageSourceMode === "url" ? "is-active" : ""}
                type="button"
                role="tab"
                aria-selected={imageSourceMode === "url"}
                onClick={() => {
                  setImageSourceMode("url");
                  setImageForm((current) => ({ ...current, url: isSafeImageDataUrl(current.url) ? "" : current.url }));
                  setInlineImageFileName("");
                }}
              >
                Desde URL
              </button>
              <button
                className={imageSourceMode === "upload" ? "is-active" : ""}
                type="button"
                role="tab"
                aria-selected={imageSourceMode === "upload"}
                onClick={() => {
                  setImageSourceMode("upload");
                  const hasUploadedImage = isSafeImageDataUrl(imageForm.url);
                  setImagePreview({ status: hasUploadedImage ? "valid" : "idle", message: hasUploadedImage ? "Imagen cargada." : "", src: hasUploadedImage ? imageForm.url : null, width: null, height: null, sizeBytes: null });
                }}
              >
                Subir archivo
              </button>
            </div>
            {imageSourceMode === "url" ? (
              <label>
                URL publica de la imagen
                <input
                  value={imageForm.url}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  onChange={(event) => setImageForm((current) => ({ ...current, url: event.target.value }))}
                  autoFocus
                />
                <small>Pega el enlace directo de una imagen publica disponible en Internet.</small>
                <small>Compatible con imagenes JPG, PNG, WEBP y GIF accesibles publicamente.</small>
              </label>
            ) : (
              <label>
                Subir archivo
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleInlineImageFileChange} />
                <small>JPG, PNG, WEBP o GIF · Maximo 2 MB</small>
                {inlineImageFileName ? <small>Archivo: {inlineImageFileName}</small> : null}
              </label>
            )}
            <div className={`admin-image-preview admin-image-preview--${imagePreview.status}`}>
              <strong>Previsualizacion</strong>
              {imagePreview.src ? <img src={imagePreview.src} alt="" /> : <span>La imagen aparecera aqui antes de insertarla.</span>}
              {imagePreview.message ? <small>{imagePreview.status === "valid" ? "✓ " : ""}{imagePreview.message}</small> : null}
              {imagePreview.width && imagePreview.height ? <small>{imagePreview.width} x {imagePreview.height} px{imagePreview.sizeBytes ? ` · ${formatFileSize(imagePreview.sizeBytes)}` : ""}</small> : null}
            </div>
            <label>
              Texto alternativo
              <input
                value={imageForm.alt}
                placeholder="Describe brevemente el contenido de la imagen"
                onChange={(event) => setImageForm((current) => ({ ...current, alt: event.target.value }))}
              />
              <small>Recomendado para accesibilidad y posicionamiento.</small>
            </label>
            <label>
              Pie de foto
              <input
                value={imageForm.caption}
                placeholder="Opcional"
                onChange={(event) => setImageForm((current) => ({ ...current, caption: event.target.value }))}
              />
            </label>
            <div className="admin-modal-grid">
              <label>
                Alineacion
                <select value={imageForm.align} onChange={(event) => setImageForm((current) => ({ ...current, align: event.target.value as ImageForm["align"] }))}>
                  <option value="left">Izquierda</option>
                  <option value="center">Centro</option>
                  <option value="right">Derecha</option>
                  <option value="full">Ancho completo</option>
                </select>
              </label>
              <label>
                Tamaño
                <select value={imageForm.size} onChange={(event) => setImageForm((current) => ({ ...current, size: event.target.value as ImageForm["size"] }))}>
                  <option value="25">25%</option>
                  <option value="50">50%</option>
                  <option value="75">75%</option>
                  <option value="100">100%</option>
                </select>
              </label>
            </div>
            <p className="admin-form-message admin-form-message--info">Asegurate de contar con autorizacion para utilizar imagenes de terceros.</p>
            {inlineImageError ? <p className="admin-form-message admin-form-message--error">{inlineImageError}</p> : null}
            <div className="admin-modal-actions">
              {editingImageRef.current ? <button className="admin-button admin-button--ghost admin-button--danger" type="button" onClick={removeInlineImageFromModal}>Eliminar imagen</button> : null}
              <button className="admin-button admin-button--outline" type="button" onClick={closeImageModal}>Cancelar</button>
              <button className="admin-button admin-button--primary" type="button" onClick={applyInlineImageFromModal} disabled={imagePreview.status !== "valid"}>{editingImageRef.current ? "Guardar imagen" : "Insertar imagen"}</button>
            </div>
          </section>
        </div>
      ) : null}

      {isTableModalOpen ? (
        <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-table-title" onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeTableModal();
          }
        }}>
          <section className="admin-modal__panel admin-link-dialog">
            <h2 id="admin-table-title">Insertar tabla</h2>
            <div className="admin-modal-grid">
              <label>
                Filas
                <input type="number" min={1} max={10} value={tableForm.rows} onChange={(event) => setTableForm((current) => ({ ...current, rows: Number(event.target.value) }))} />
              </label>
              <label>
                Columnas
                <input type="number" min={1} max={8} value={tableForm.columns} onChange={(event) => setTableForm((current) => ({ ...current, columns: Number(event.target.value) }))} />
              </label>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-button admin-button--outline" type="button" onClick={closeTableModal}>Cancelar</button>
              <button className="admin-button admin-button--primary" type="button" onClick={insertTable}>Insertar</button>
            </div>
          </section>
        </div>
      ) : null}

      {postPendingDelete ? (
        <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-delete-title" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isDeleting) {
            setPostPendingDelete(null);
          }
        }}>
          <section className="admin-modal__panel admin-delete-dialog">
            <h2 id="admin-delete-title">Eliminar publicación</h2>
            <p>¿Estás seguro de que deseas eliminar "{postPendingDelete.titulo}"?</p>
            <small>Esta acción no se puede deshacer.</small>
            <div className="admin-modal-actions">
              <button className="admin-button admin-button--outline" type="button" onClick={() => setPostPendingDelete(null)} disabled={isDeleting}>Cancelar</button>
              <button className="admin-button admin-button--primary admin-button--danger" type="button" onClick={confirmDeletePost} disabled={isDeleting}>
                <Trash2 /> {isDeleting ? "Eliminando..." : "Eliminar publicación"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isPasswordOpen ? (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <section className="admin-modal__panel">
            <h2>Cambiar contraseña</h2>
            <label>
              Nueva contraseña
              <span className="admin-password-input">
                <input type={isPasswordVisible ? "text" : "password"} value={passwordForm.password} onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))} />
                <button type="button" onClick={() => setIsPasswordVisible((current) => !current)} aria-label={isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"} title={isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}>
                  {isPasswordVisible ? <EyeOff /> : <Eye />}
                </button>
              </span>
            </label>
            <label>
              Confirmar nueva contraseña
              <span className="admin-password-input">
                <input type={isPasswordVisible ? "text" : "password"} value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
                <button type="button" onClick={() => setIsPasswordVisible((current) => !current)} aria-label={isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"} title={isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}>
                  {isPasswordVisible ? <EyeOff /> : <Eye />}
                </button>
              </span>
            </label>
            <div className="admin-editor-actions">
              <button className="admin-button admin-button--outline" type="button" onClick={() => setIsPasswordOpen(false)}>Cancelar</button>
              <button className="admin-button admin-button--primary" type="button" onClick={handlePasswordChange}>Guardar contraseña</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
