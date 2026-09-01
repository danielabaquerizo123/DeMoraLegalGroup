import { useEffect, useState, type FormEvent } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { CalendarDays, Clock, Home, Mail, MessageCircle, Play, Scale, UserRound } from "lucide-react";
import { ErrorState } from "../../components/common/ErrorState";
import { LoadingState } from "../../components/common/LoadingState";
import { blogApi } from "../../services/api/blog-api";
import { useApi } from "../../hooks/use-api";
import { formatDate } from "../../utils/format";
import { renderArticleContentHtml } from "../../utils/sanitize-html";
import { typographyClassName } from "../../utils/typography";
import { buildWhatsAppUrl } from "../../utils/whatsapp";
import type { Article, BlogComment, PaginatedResponse, SiteConfiguration } from "../../types/api";

const BLOG_POST_DELETED_EVENT = "demora:blog-post-deleted";

type LayoutContext = {
  configuration: SiteConfiguration | null;
};

function plainTextFromHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function readingTime(content: string) {
  const words = plainTextFromHtml(content).split(" ").filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min de lectura`;
}

function escapeHtml(value: string) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

function shareLinks(title: string) {
  const currentUrl = typeof window === "undefined" ? "" : window.location.href;
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(title);

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
  };
}

function articleTitleClass(size: Article["tituloTamano"], alignment: Article["tituloAlineacion"], typography: Article["tituloTipografia"]) {
  return [
    "article-title",
    `article-title--${(size ?? "NORMAL").toLowerCase()}`,
    `article-title--${(alignment ?? "IZQUIERDA").toLowerCase()}`,
    typographyClassName(typography),
  ].filter(Boolean).join(" ");
}

function articleLeadClass(size: Article["extractoTamano"], alignment: Article["extractoAlineacion"], typography: Article["extractoTipografia"]) {
  return [
    "article-detail__lead",
    `article-detail__lead--${(size ?? "NORMAL").toLowerCase()}`,
    `article-detail__lead--${(alignment ?? "IZQUIERDA").toLowerCase()}`,
    typographyClassName(typography),
  ].filter(Boolean).join(" ");
}

function primaryAuthor(article: Article) {
  return article.autores[0] ?? null;
}

export function BlogDetailPage() {
  const { slug = "" } = useParams();
  const { configuration } = useOutletContext<LayoutContext>();
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [comments, setComments] = useState<PaginatedResponse<BlogComment> | null>(null);
  const [commentPage, setCommentPage] = useState(1);
  const [commentForm, setCommentForm] = useState({ nombre: "", contenido: "" });
  const [commentFeedback, setCommentFeedback] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [articleReloadKey, setArticleReloadKey] = useState(0);
  const article = useApi(() => blogApi.articleDetail(slug), [slug, articleReloadKey]);
  const relatedArticles = useApi(() => blogApi.listArticles(1, 4), [slug]);
  const detailData = article.data?.data;
  const commentsEnabled = Boolean(detailData?.comentariosHabilitados);

  const loadComments = async (page = 1) => {
    if (!detailData) {
      return;
    }

    const response = await blogApi.listComments(detailData.slug, page, 10);
    setComments((current) => page === 1 ? response : { ...response, data: [...(current?.data ?? []), ...response.data] });
    setCommentPage(page);
  };

  useEffect(() => {
    document.body.classList.add("blog-detail-route");

    return () => {
      document.body.classList.remove("blog-detail-route");
    };
  }, []);

  useEffect(() => {
    const refreshIfCurrentArticleWasDeleted = (deletedSlug: string | null) => {
      if (deletedSlug && deletedSlug === slug) {
        setArticleReloadKey((current) => current + 1);
        setComments(null);
      }
    };

    const handleDeletedPost = (event: Event) => {
      const detail = "detail" in event ? (event.detail as { slug?: string } | null) : null;
      const deletedSlug = String(detail?.slug ?? "");
      refreshIfCurrentArticleWasDeleted(deletedSlug);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== BLOG_POST_DELETED_EVENT || !event.newValue) {
        return;
      }

      try {
        const payload = JSON.parse(event.newValue) as { slug?: string };
        refreshIfCurrentArticleWasDeleted(payload.slug ?? null);
      } catch {
        refreshIfCurrentArticleWasDeleted(null);
      }
    };

    window.addEventListener(BLOG_POST_DELETED_EVENT, handleDeletedPost);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(BLOG_POST_DELETED_EVENT, handleDeletedPost);
      window.removeEventListener("storage", handleStorage);
    };
  }, [slug]);

  useEffect(() => {
    const images = Array.from(document.querySelectorAll<HTMLImageElement>(".article-detail__content img"));
    const cleanup: Array<() => void> = [];

    images.forEach((image) => {
      const handleError = () => {
        const fallback = document.createElement("span");
        fallback.className = "article-image-fallback";
        fallback.textContent = "No se pudo cargar esta imagen.";
        image.replaceWith(fallback);
      };

      image.addEventListener("error", handleError, { once: true });
      cleanup.push(() => image.removeEventListener("error", handleError));

      if (image.complete && image.naturalWidth === 0) {
        handleError();
      }
    });

    return () => cleanup.forEach((removeListener) => removeListener());
  }, [article.data?.data.contenido]);

  useEffect(() => {
    if (commentsEnabled) {
      void loadComments(1);
    } else {
      setComments(null);
    }
  }, [detailData?.slug, commentsEnabled]);

  if (article.isLoading) {
    return (
      <section className="article-detail article-detail--state">
        <div className="article-detail__container">
          <LoadingState label="Cargando articulo" />
        </div>
      </section>
    );
  }

  if (article.error || !article.data) {
    return (
      <section className="article-detail article-detail--state">
        <div className="article-detail__container">
          <ErrorState message="No encontramos este articulo publicado." />
        </div>
      </section>
    );
  }

  const data = article.data.data;
  const safeContent = renderArticleContentHtml(data.contenido ?? "");
  const safeTitleHtml = renderArticleContentHtml(data.tituloHtml || escapeHtml(data.titulo));
  const safeExcerptHtml = data.extracto ? renderArticleContentHtml(data.extractoHtml || escapeHtml(data.extracto)) : "";
  const author = primaryAuthor(data);
  const related = relatedArticles.data?.data.filter((item) => item.slug !== data.slug).slice(0, 3) ?? [];
  const share = shareLinks(data.titulo);
  const whatsapp = configuration?.contacto_whatsapp_principal;
  const categoryName = data.categoria?.nombre ?? "Actualidad Jurídica";
  const hasVideoContent = /content-video|<iframe|youtube|youtu\.be|vimeo/i.test(safeContent);
  const canSubmitComment = commentForm.nombre.trim().length > 0 && commentForm.contenido.trim().length > 0 && !isSubmittingComment;
  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmitComment) {
      return;
    }

    setCommentFeedback(null);
    setIsSubmittingComment(true);

    try {
      const response = await blogApi.createComment(data.slug, {
        nombre: commentForm.nombre.trim(),
        contenido: commentForm.contenido.trim(),
      });
      setComments((current) => current ? { ...current, pagination: { ...current.pagination, total: current.pagination.total + 1 }, data: [response.data, ...current.data] } : current);
      setCommentForm({ nombre: "", contenido: "" });
      setCommentFeedback("Comentario publicado correctamente.");
    } catch {
      setCommentFeedback("No se pudo publicar el comentario. Revisa el nombre y el contenido.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleInstagramShare = async () => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyToast("Enlace copiado. Puedes compartirlo en Instagram.");
      window.setTimeout(() => setCopyToast(null), 3200);
    } catch {
      setCopyToast("No se pudo copiar el enlace.");
      window.setTimeout(() => setCopyToast(null), 3200);
    }
  };

  return (
    <article className="article-detail">
      <div className="article-detail__container">
        <header className="article-detail__header">
          <nav className="article-breadcrumb" aria-label="Ruta del articulo">
            <Link to="/"><Home /> Inicio</Link>
            <span>/</span>
            <Link to="/blog">Blog</Link>
            <span>/</span>
            <span>{categoryName}</span>
            <span>/</span>
            <strong>{data.titulo}</strong>
          </nav>
          <p className="eyebrow">{categoryName}</p>
          <h1 className={articleTitleClass(data.tituloTamano, data.tituloAlineacion, data.tituloTipografia)} dangerouslySetInnerHTML={{ __html: safeTitleHtml }} />
          {data.extracto ? <div className={articleLeadClass(data.extractoTamano, data.extractoAlineacion, data.extractoTipografia)} dangerouslySetInnerHTML={{ __html: safeExcerptHtml }} /> : null}
          <span className="article-detail__rule" aria-hidden="true" />
          <div className="article-detail__meta" aria-label="Informacion del articulo">
            <span><CalendarDays /> {formatDate(data.fecha)}</span>
            {author ? <span><UserRound /> {author.nombreCompleto}</span> : null}
            <span><Clock /> {readingTime(data.contenido ?? "")}</span>
          </div>
        </header>

        <div className="article-detail__grid">
          <div className="article-detail__main">
            {data.imagen ? <img className="article-detail__cover" src={data.imagen} alt="" /> : null}
            <section className="article-detail__byline" aria-label="Autor y opciones para compartir">
              {author ? (
                <div className="article-detail__author">
                  {author.fotoUrl ? <img src={author.fotoUrl} alt="" /> : <span aria-hidden="true">{author.nombreCompleto.charAt(0)}</span>}
                  <p>
                    <strong>{author.nombreCompleto}</strong>
                    <small>Abogado</small>
                  </p>
                </div>
              ) : null}
              <div className="article-detail__share">
                <span>Compartir:</span>
                <a href={share.facebook} target="_blank" rel="noreferrer" aria-label="Compartir en Facebook">f</a>
                <a href={share.linkedin} target="_blank" rel="noreferrer" aria-label="Compartir en LinkedIn">in</a>
                <a href={share.whatsapp} target="_blank" rel="noreferrer" aria-label="Compartir por WhatsApp"><MessageCircle /></a>
                <button className="article-share-button article-share-button--instagram" type="button" onClick={handleInstagramShare} aria-label="Copiar enlace para Instagram">ig</button>
                <a href={share.x} target="_blank" rel="noreferrer" aria-label="Compartir en X">X</a>
                <a href={share.email} aria-label="Compartir por correo"><Mail /></a>
              </div>
            </section>
            {hasVideoContent ? (
              <p className="article-video-label">
                <Play /> Contenido audiovisual
              </p>
            ) : null}
            <section className="article-content article-detail__content">
              <div dangerouslySetInnerHTML={{ __html: safeContent }} />
            </section>
            {commentsEnabled ? (
              <section className="article-comments">
                <h2>Comentarios</h2>
                {comments && comments.data.length === 0 ? <p className="article-comments__empty">No hay comentarios todavía.</p> : null}
                {comments?.data.map((comment) => (
                  <article className="article-comment" key={comment.id}>
                    <strong>{comment.nombre}</strong>
                    <p>{comment.contenido}</p>
                    <time>{formatDate(comment.fecha)}</time>
                    {comment.respuesta ? (
                      <div className="article-comment__reply">
                        <strong>{comment.respuesta.autor.nombreCompleto}</strong>
                        <small>{comment.respuesta.autor.cargo ?? "Abogado"} · Equipo De Mora</small>
                        <p>{comment.respuesta.contenido}</p>
                      </div>
                    ) : null}
                  </article>
                ))}
                {comments && comments.pagination.page < comments.pagination.totalPages ? (
                  <button className="button button--outline" type="button" onClick={() => void loadComments(commentPage + 1)}>Ver más comentarios</button>
                ) : null}
                <form className="article-comment-form" onSubmit={submitComment}>
                  <h3>Deje su comentario</h3>
                  <label>
                    Nombre
                    <input maxLength={80} value={commentForm.nombre} onChange={(event) => setCommentForm((current) => ({ ...current, nombre: event.target.value.slice(0, 80) }))} />
                  </label>
                  <label>
                    Comentario
                    <textarea maxLength={500} value={commentForm.contenido} onChange={(event) => setCommentForm((current) => ({ ...current, contenido: event.target.value.slice(0, 500) }))} />
                  </label>
                  <small>{commentForm.contenido.length} / 500</small>
                  {commentFeedback ? <p className="article-comment-feedback">{commentFeedback}</p> : null}
                  <button className="button button--primary" type="submit" disabled={!canSubmitComment}>{isSubmittingComment ? "Publicando..." : "Publicar comentario"}</button>
                </form>
              </section>
            ) : null}
          </div>

          <aside className="article-sidebar" aria-label="Contenido relacionado">
            <section className="article-sidebar__block">
              <h2>Artículos relacionados</h2>
              {relatedArticles.isLoading ? <LoadingState label="Cargando relacionados" /> : null}
              {related.map((item) => (
                <Link className="related-article" to={`/blog/${item.slug}`} key={item.slug}>
                  {item.imagen ? <img src={item.imagen} alt="" loading="lazy" /> : null}
                  <span>
                    <strong>{item.titulo}</strong>
                    <small>{formatDate(item.fecha)}</small>
                  </span>
                </Link>
              ))}
            </section>

            {whatsapp ? (
              <section className="article-sidebar__cta">
                <i aria-hidden="true"><Scale /></i>
                <h2>¿Necesitas asesoría legal?</h2>
                <p>Nuestro equipo está listo para ayudarte.</p>
                <a className="button button--primary" href={buildWhatsAppUrl(whatsapp.url)} target="_blank" rel="noreferrer">
                  Hablar por WhatsApp
                </a>
                <small>Respuesta inmediata por nuestro equipo legal.</small>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
      {copyToast ? <div className="article-copy-toast" role="status">{copyToast}</div> : null}
    </article>
  );
}
