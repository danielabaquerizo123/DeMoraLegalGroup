import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
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

const emptyForm: EditorForm = {
  titulo: "",
  extracto: "",
  contenido: "",
  imagenPortadaUrl: null,
};

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

export function AdminBlogPage({ user }: AdminBlogPageProps) {
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [view, setView] = useState<ViewMode>("resumen");
  const [summary, setSummary] = useState<AdminBlogSummary | null>(null);
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("TODAS");
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [form, setForm] = useState<EditorForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState<EditorForm | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", password: "", confirmPassword: "" });

  const photo = useMemo(() => professionalPhoto(user), [user]);

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
    if (editorRef.current && editorRef.current.innerHTML !== form.contenido) {
      editorRef.current.innerHTML = form.contenido;
    }
  }, [form.contenido, view]);

  function resetEditor() {
    setCurrentPostId(null);
    setForm(emptyForm);
    setMessage(null);
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

  function applyCommand(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    setForm((current) => ({ ...current, contenido: editorRef.current?.innerHTML ?? "" }));
  }

  function insertLink() {
    const url = window.prompt("URL del enlace");
    if (url) {
      applyCommand("createLink", url);
    }
  }

  function insertVideo() {
    const url = window.prompt("URL de YouTube");
    const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (!match) {
      return;
    }

    applyCommand("insertHTML", `<figure><iframe src="https://www.youtube.com/embed/${match[1]}" title="Video" allowfullscreen></iframe></figure>`);
  }

  function insertInlineImage() {
    const url = window.prompt("URL de la imagen");
    if (url) {
      applyCommand("insertImage", url);
    }
  }

  function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, imagenPortadaUrl: String(reader.result) }));
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function savePost(status: AdminPostStatus) {
    setError(null);
    setMessage(null);

    if (!form.titulo.trim() || !form.contenido.trim()) {
      setError("Escribe al menos un titulo y contenido para continuar.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        titulo: form.titulo.trim(),
        extracto: form.extracto.trim(),
        contenido: form.contenido,
        imagenPortadaUrl: form.imagenPortadaUrl,
        estado: status,
      };
      const response = currentPostId ? await adminBlogApi.update(currentPostId, payload) : await adminBlogApi.create(payload);
      setCurrentPostId(response.data.id);
      setMessage(status === "PUBLICADO" ? "Publicacion publicada correctamente." : "Borrador guardado correctamente.");
      await refreshData();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "No pudimos guardar la publicacion.");
    } finally {
      setIsSaving(false);
    }
  }

  async function changeStatus(post: AdminBlogPost, status: AdminPostStatus) {
    setError(null);
    try {
      await adminBlogApi.updateStatus(post.id, status);
      await refreshData();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "No pudimos actualizar el estado.");
    }
  }

  async function deletePost(post: AdminBlogPost) {
    if (!window.confirm(`¿Eliminar "${post.titulo}"? Esta accion no modifica otros datos.`)) {
      return;
    }

    setError(null);
    try {
      await adminBlogApi.delete(post.id);
      if (currentPostId === post.id) {
        setCurrentPostId(null);
        setForm(emptyForm);
      }
      await refreshData();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "No pudimos eliminar la publicacion.");
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
      setMessage("Contraseña actualizada correctamente.");
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "No pudimos actualizar la contraseña.");
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

        {error ? <p className="admin-toast admin-toast--error">{error}</p> : null}
        {message ? <p className="admin-toast admin-toast--success">{message}</p> : null}
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
                <button type="button" onClick={insertVideo} aria-label="Video"><Video /></button>
                <button type="button" onClick={() => applyCommand("undo")} aria-label="Deshacer"><Undo2 /></button>
              </div>
              <div
                ref={editorRef}
                className="admin-rich-editor"
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Empieza a escribir tu contenido aqui..."
                onInput={(event) => setForm((current) => ({ ...current, contenido: event.currentTarget.innerHTML }))}
              />
            </div>
            <div className="admin-editor-bottom">
              <div>
                <span>Imagen de portada</span>
                <button className="admin-cover-picker" type="button" onClick={() => coverInputRef.current?.click()}>
                  {form.imagenPortadaUrl ? <img src={form.imagenPortadaUrl} alt="" /> : <><ImageIcon /><strong>Seleccionar imagen</strong><small>JPG o PNG. Recomendado 16:9</small></>}
                </button>
                <input ref={coverInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleCoverChange} />
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
                <Save /> Guardar borrador
              </button>
              <button className="admin-button admin-button--outline" type="button" onClick={() => setPreviewPost(form)}>
                <Eye /> Vista previa
              </button>
              <button className="admin-button admin-button--primary" type="button" onClick={() => savePost("PUBLICADO")} disabled={isSaving}>
                <Send /> Publicar
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
                <button type="button" onClick={() => deletePost(post)}><Trash2 /> Eliminar</button>
              </article>
            ))}
          </div>
        </section>
      </section>

      {previewPost ? (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <article className="admin-modal__panel admin-preview">
            <button className="admin-modal__close" type="button" onClick={() => setPreviewPost(null)}>Cerrar</button>
            {previewPost.imagenPortadaUrl ? <img src={previewPost.imagenPortadaUrl} alt="" /> : null}
            <h2>{previewPost.titulo || "Titulo de la publicacion"}</h2>
            <p>{previewPost.extracto}</p>
            <div dangerouslySetInnerHTML={{ __html: previewPost.contenido }} />
          </article>
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
