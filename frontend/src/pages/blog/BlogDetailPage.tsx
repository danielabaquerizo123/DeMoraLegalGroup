import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { CalendarDays, Clock, Home, Mail, MessageCircle, Play, Scale, UserRound } from "lucide-react";
import { ErrorState } from "../../components/common/ErrorState";
import { LoadingState } from "../../components/common/LoadingState";
import { blogApi } from "../../services/api/blog-api";
import { useApi } from "../../hooks/use-api";
import { formatDate } from "../../utils/format";
import { renderArticleContentHtml } from "../../utils/sanitize-html";
import { buildWhatsAppUrl } from "../../utils/whatsapp";
import type { Article, SiteConfiguration } from "../../types/api";

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

function primaryAuthor(article: Article) {
  return article.autores[0] ?? null;
}

export function BlogDetailPage() {
  const { slug = "" } = useParams();
  const { configuration } = useOutletContext<LayoutContext>();
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const article = useApi(() => blogApi.articleDetail(slug), [slug]);
  const relatedArticles = useApi(() => blogApi.listArticles(1, 4), [slug]);

  useEffect(() => {
    document.body.classList.add("blog-detail-route");

    return () => {
      document.body.classList.remove("blog-detail-route");
    };
  }, []);

  if (article.isLoading) {
    return <LoadingState label="Cargando articulo" />;
  }

  if (article.error || !article.data) {
    return <ErrorState message="No encontramos este articulo publicado." />;
  }

  const data = article.data.data;
  const safeContent = renderArticleContentHtml(data.contenido ?? "");
  const author = primaryAuthor(data);
  const related = relatedArticles.data?.data.filter((item) => item.slug !== data.slug).slice(0, 3) ?? [];
  const share = shareLinks(data.titulo);
  const whatsapp = configuration?.contacto_whatsapp_principal;
  const categoryName = data.categoria?.nombre ?? "Actualidad Jurídica";
  const hasVideoContent = /content-video|<iframe|youtube|youtu\.be|vimeo/i.test(safeContent);

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
          <h1>{data.titulo}</h1>
          {data.extracto ? <p className="article-detail__lead">{data.extracto}</p> : null}
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
