import { Component, useEffect, useMemo, useRef, useState, type ChangeEvent, type ClipboardEvent, type ErrorInfo, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bold,
  ChevronDown,
  Edit3,
  Eye,
  FileEdit,
  Heading1,
  Heading2,
  Home,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  LogOut,
  MoreVertical,
  Plus,
  Quote,
  Save,
  Send,
  Trash2,
  Undo2,
  Video,
} from "lucide-react";
import { logoAsset, professionalImages } from "../../constants/assets";
import { adminAuthApi } from "../../services/api/admin-auth-api";
import { adminBlogApi } from "../../services/api/admin-blog-api";
import { ApiError } from "../../services/api/api-client";
import type { AdminBlogPost, AdminBlogSummary, AdminPostStatus, AdminUser } from "../../types/api";
import { createVideoBlockHtml, parseVideoUrl, plainTextToHtml, renderArticleContentHtml, sanitizeHtml } from "../../utils/sanitize-html";

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

const emptyForm: EditorForm = {
  titulo: "",
  extracto: "",
  contenido: "",
  imagenPortadaUrl: null,
};

const COVER_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const COVER_MAX_SIZE_BYTES = 2 * 1024 * 1024;

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

export function AdminBlogPage({ user }: AdminBlogPageProps) {
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const editorSelectionRef = useRef<Range | null>(null);
  const editingLinkRef = useRef<HTMLAnchorElement | null>(null);
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
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkForm, setLinkForm] = useState<LinkForm>({ url: "", text: "", newTab: true });
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [inlineImageUrl, setInlineImageUrl] = useState("");
  const [inlineImageError, setInlineImageError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [postPendingDelete, setPostPendingDelete] = useState<AdminBlogPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", password: "", confirmPassword: "" });

  const photo = useMemo(() => professionalPhoto(user), [user]);
  const previewHtml = useMemo(() => renderArticleContentHtml(previewPost?.contenido ?? ""), [previewPost?.contenido]);
  const isSaving = savingStatus !== null;

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
    if (!postPendingDelete && !isLinkModalOpen && !isImageModalOpen && !isVideoModalOpen) {
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
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [postPendingDelete, isDeleting, isLinkModalOpen, isImageModalOpen, isVideoModalOpen]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = form.contenido;
    }
  }, [currentPostId, view]);

  function resetEditor() {
    setCurrentPostId(null);
    setForm(emptyForm);
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

  function syncEditorContent() {
    setForm((current) => ({ ...current, contenido: editorRef.current?.innerHTML ?? "" }));
  }

  function applyCommand(command: string, value?: string) {
    restoreEditorSelection();
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncEditorContent();
  }

  function handleEditorInput(event: FormEvent<HTMLDivElement>) {
    const html = event.currentTarget.innerHTML;
    setForm((current) => ({ ...current, contenido: html }));
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

    const htmlAfterPaste = event.currentTarget.innerHTML;
    setForm((current) => ({ ...current, contenido: htmlAfterPaste }));
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
  }

  function insertVideo() {
    const video = parseVideoUrl(videoUrl);

    if (!video) {
      setVideoError("Enlace de video no compatible.");
      return;
    }

    applyCommand("insertHTML", createVideoBlockHtml(video));
    closeVideoModal();
  }

  function insertInlineImage() {
    saveEditorSelection();
    setInlineImageUrl("");
    setInlineImageError(null);
    setIsImageModalOpen(true);
  }

  function closeImageModal() {
    setIsImageModalOpen(false);
    setInlineImageUrl("");
    setInlineImageError(null);
  }

  function applyInlineImageFromModal() {
    const normalizedUrl = normalizeSafeUrl(inlineImageUrl);

    if (!normalizedUrl || !normalizedUrl.startsWith("http")) {
      setInlineImageError("Ingresa una URL de imagen valida con http o https.");
      return;
    }

    applyCommand("insertImage", normalizedUrl);
    closeImageModal();
  }

  function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
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
      setCoverError("La imagen supera el maximo de 2 MB. Selecciona una imagen mas liviana.");
      return;
    }

    setCoverError(null);

    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, imagenPortadaUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  async function savePost(status: AdminPostStatus) {
    setError(null);

    const titulo = form.titulo.trim();
    const contenido = form.contenido.trim();

    if (status === "PUBLICADO" && (!titulo || !contenido)) {
      showToast("Escribe titulo y contenido para publicar.", "error");
      return;
    }

    if (status === "BORRADOR" && !titulo && !form.extracto.trim() && !contenido && !form.imagenPortadaUrl) {
      showToast("Escribe al menos un dato para guardar el borrador.", "error");
      return;
    }

    const isEditingExistingPost = Boolean(currentPostId);
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
      showToast(status === "PUBLICADO" ? (isEditingExistingPost ? "Publicación actualizada correctamente." : "Publicación publicada correctamente.") : "Borrador guardado correctamente.");
      await refreshData();
    } catch (caughtError) {
      console.error("Error al guardar publicacion", caughtError);
      showToast(caughtError instanceof ApiError ? caughtError.message : status === "PUBLICADO" ? "No se pudo publicar. Intenta nuevamente." : "No se pudo guardar el borrador. Intenta nuevamente.", "error");
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
    try {
      await adminAuthApi.changePassword(passwordForm);
      setPasswordForm({ currentPassword: "", password: "", confirmPassword: "" });
      setIsPasswordOpen(false);
      showToast("Contraseña actualizada correctamente.");
    } catch (caughtError) {
      showToast(caughtError instanceof ApiError ? caughtError.message : "No pudimos actualizar la contraseña.", "error");
    }
  }

  async function updateFilter(nextFilter: StatusFilter) {
    setFilter(nextFilter);
    await refreshData(nextFilter);
  }

  return (
    <main className="admin-editorial">
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

        <div className="admin-editorial__grid">
          <section className="admin-card admin-card--recent">
            <div className="admin-card__header">
              <h2>Mis publicaciones recientes</h2>
              <button className="admin-button admin-button--ghost" type="button" onClick={resetEditor}>
                <Plus /> Nueva publicacion
              </button>
            </div>
            {(summary?.recientes ?? []).map((post) => (
              <article className="admin-recent-post" key={post.id}>
                <img src={postImage(post)} alt="" />
                <div>
                  <h3>{post.titulo}</h3>
                  <span className={`admin-badge admin-badge--${post.estado.toLowerCase()}`}>{postStatusLabel(post.estado)}</span>
                  <p>{formatAdminDate(post.fecha ?? post.actualizadoEn)}</p>
                </div>
                <button type="button" aria-label="Editar publicacion" onClick={() => openPost(post.id)}>
                  <MoreVertical />
                </button>
              </article>
            ))}
            {summary && summary.recientes.length === 0 ? <p className="admin-empty">Todavia no tienes publicaciones.</p> : null}
            <button className="admin-card__footer-action" type="button" onClick={() => setView("publicaciones")}>
              Ver todas mis publicaciones
            </button>
          </section>

          <section className="admin-card admin-card--editor">
            <div className="admin-card__header">
              <h2>{currentPostId ? "Editar publicacion" : "Nueva publicacion"}</h2>
              <span className="admin-badge admin-badge--borrador">Borrador</span>
            </div>
            <label className="admin-editor-field">
              <span>Titulo</span>
              <input value={form.titulo} placeholder="Escribe un titulo atractivo..." onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))} />
            </label>
            <label className="admin-editor-field">
              <span>Resumen</span>
              <textarea value={form.extracto} placeholder="Breve descripcion que aparecera en la tarjeta del blog..." onChange={(event) => setForm((current) => ({ ...current, extracto: event.target.value }))} />
            </label>
            <EditorErrorBoundary>
              <div className="admin-editor-field">
                <span>Contenido</span>
                <div className="admin-rich-toolbar" aria-label="Herramientas del editor">
                  <button type="button" onClick={() => applyCommand("bold")} aria-label="Negrita"><Bold /></button>
                  <button type="button" onClick={() => applyCommand("italic")} aria-label="Cursiva"><Italic /></button>
                  <button type="button" onClick={() => applyCommand("formatBlock", "h1")} aria-label="Titulo 1"><Heading1 /></button>
                  <button type="button" onClick={() => applyCommand("formatBlock", "h2")} aria-label="Titulo 2"><Heading2 /></button>
                  <button type="button" onClick={() => applyCommand("insertUnorderedList")} aria-label="Lista"><List /></button>
                  <button type="button" onClick={() => applyCommand("insertOrderedList")} aria-label="Lista numerada"><ListOrdered /></button>
                  <button type="button" onClick={() => applyCommand("formatBlock", "blockquote")} aria-label="Cita"><Quote /></button>
                  <button type="button" onClick={insertLink} aria-label="Enlace"><LinkIcon /></button>
                  <button type="button" onClick={insertInlineImage} aria-label="Imagen"><ImageIcon /></button>
                  <button type="button" onClick={openVideoModal} aria-label="Video"><Video /></button>
                  <button type="button" onClick={() => applyCommand("undo")} aria-label="Deshacer"><Undo2 /></button>
                </div>
                <div
                  ref={editorRef}
                  className="admin-rich-editor"
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="Empieza a escribir tu contenido aqui..."
                  onInput={handleEditorInput}
                  onPaste={handleEditorPaste}
                  onKeyUp={saveEditorSelection}
                  onMouseUp={saveEditorSelection}
                  onBlur={saveEditorSelection}
                />
              </div>
            </EditorErrorBoundary>
            <div className="admin-editor-bottom">
              <div>
                <span>Imagen de portada</span>
                <button className="admin-cover-picker" type="button" onClick={() => coverInputRef.current?.click()}>
                  {form.imagenPortadaUrl ? <img src={form.imagenPortadaUrl} alt="" /> : <><ImageIcon /><strong>Seleccionar imagen</strong><small>JPG o PNG. Recomendado 16:9</small></>}
                </button>
                <input ref={coverInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleCoverChange} />
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
              <button className="admin-button admin-button--outline" type="button" onClick={() => setPreviewPost(form)}>
                <Eye /> Vista previa
              </button>
              <button className="admin-button admin-button--primary" type="button" onClick={() => savePost("PUBLICADO")} disabled={isSaving}>
                <Send /> {savingStatus === "PUBLICADO" ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </section>
        </div>

        <section className={`admin-card admin-publications ${view === "publicaciones" ? "is-visible" : ""}`}>
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
      </section>

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
            <h2 id="admin-video-title">Insertar video</h2>
            <label>
              URL del video
              <input value={videoUrl} placeholder="https://www.youtube.com/watch?v=..." onChange={(event) => setVideoUrl(event.target.value)} autoFocus />
            </label>
            {videoError ? <p className="admin-form-message admin-form-message--error">{videoError}</p> : null}
            <div className="admin-editor-actions">
              <button className="admin-button admin-button--outline" type="button" onClick={closeVideoModal}>Cancelar</button>
              <button className="admin-button admin-button--primary" type="button" onClick={insertVideo}>Insertar video</button>
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
          <section className="admin-modal__panel admin-link-dialog">
            <h2 id="admin-image-title">Insertar imagen</h2>
            <label>
              URL de la imagen
              <input
                value={inlineImageUrl}
                placeholder="https://ejemplo.com/imagen.jpg"
                onChange={(event) => setInlineImageUrl(event.target.value)}
                autoFocus
              />
            </label>
            {inlineImageError ? <p className="admin-form-message admin-form-message--error">{inlineImageError}</p> : null}
            <div className="admin-modal-actions">
              <button className="admin-button admin-button--outline" type="button" onClick={closeImageModal}>Cancelar</button>
              <button className="admin-button admin-button--primary" type="button" onClick={applyInlineImageFromModal}>Insertar imagen</button>
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
              Contraseña actual
              <input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} />
            </label>
            <label>
              Nueva contraseña
              <input type="password" value={passwordForm.password} onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))} />
            </label>
            <label>
              Confirmar contraseña
              <input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
            </label>
            <div className="admin-editor-actions">
              <button className="admin-button admin-button--outline" type="button" onClick={() => setIsPasswordOpen(false)}>Cancelar</button>
              <button className="admin-button admin-button--primary" type="button" onClick={handlePasswordChange}>Guardar</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
