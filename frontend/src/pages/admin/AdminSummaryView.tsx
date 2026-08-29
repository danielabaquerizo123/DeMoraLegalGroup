import { FileText, Plus } from "lucide-react";
import type { AdminBlogSummary, AdminBlogPost } from "../../types/api";

type AdminSummaryViewProps = {
  summary: AdminBlogSummary | null;
  onNewPost: () => void;
  onOpenPost: (postId: string) => void;
};

function postStatusLabel(status: string) {
  return status === "PUBLICADO" ? "Publicada" : "Borrador";
}

function postImage(post: AdminBlogPost) {
  return post.imagen ?? "/images/Servicios/Martillo.jpg";
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

export function AdminSummaryView({ summary, onNewPost, onOpenPost }: AdminSummaryViewProps) {
  const actividadReciente = summary?.recientes?.slice(0, 3) ?? [];

  return (
    <div className="admin-summary">
      <div className="admin-summary__counts">
        <div className="admin-summary__card">
          <span className="admin-summary__card-label">Publicaciones</span>
          <span className="admin-summary__card-number">{summary?.conteos.total ?? 0}</span>
        </div>
        <div className="admin-summary__card">
          <span className="admin-summary__card-label">Borradores</span>
          <span className="admin-summary__card-number admin-summary__card-number--borradores">{summary?.conteos.borradores ?? 0}</span>
        </div>
        <div className="admin-summary__card">
          <span className="admin-summary__card-label">Comentarios</span>
          <span className="admin-summary__card-number admin-summary__card-number--comentarios">{summary?.conteos.comentarios ?? 0}</span>
        </div>
      </div>

      <div className="admin-summary__activity">
        <div className="admin-card__header">
          <h2>Última actividad</h2>
          <button className="admin-button admin-button--ghost" type="button" onClick={onNewPost}>
            <Plus /> Nueva publicación
          </button>
        </div>
        {actividadReciente.length ? (
          <div className="admin-summary__activity-list">
            {actividadReciente.map((post) => (
              <article className="admin-recent-post" key={post.id} onClick={() => onOpenPost(post.id)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") onOpenPost(post.id); }}>
                <img src={postImage(post)} alt="" />
                <div>
                  <h3>{post.titulo}</h3>
                  <span className={`admin-badge admin-badge--${post.estado.toLowerCase()}`}>{postStatusLabel(post.estado)}</span>
                  <p>{formatAdminDate(post.fecha ?? post.actualizadoEn)}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-empty admin-empty--editorial">
            <span aria-hidden="true"><FileText /></span>
            <strong>Tu espacio editorial está listo</strong>
            <p>Las publicaciones y borradores recientes aparecerán aquí a medida que agregues contenido.</p>
          </div>
        )}
      </div>
    </div>
  );
}
