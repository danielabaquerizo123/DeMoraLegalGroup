import { useParams } from "react-router-dom";
import { ErrorState } from "../../components/common/ErrorState";
import { LoadingState } from "../../components/common/LoadingState";
import { blogApi } from "../../services/api/blog-api";
import { useApi } from "../../hooks/use-api";
import { formatDate } from "../../utils/format";

export function BlogDetailPage() {
  const { slug = "" } = useParams();
  const article = useApi(() => blogApi.articleDetail(slug), [slug]);

  if (article.isLoading) {
    return <LoadingState label="Cargando articulo" />;
  }

  if (article.error || !article.data) {
    return <ErrorState message="No encontramos este articulo publicado." />;
  }

  const data = article.data.data;

  return (
    <article className="detail-page detail-page--narrow">
      <p className="eyebrow">{data.categoria?.nombre ?? "Blog juridico"}</p>
      <h1>{data.titulo}</h1>
      <p className="lead">{data.extracto}</p>
      <p className="muted">{formatDate(data.fecha)}</p>
      {data.imagen ? <img className="article-cover" src={data.imagen} alt="" /> : null}
      {data.autores.length > 0 ? (
        <div className="article-author">
          {data.autores[0].fotoUrl ? <img src={data.autores[0].fotoUrl} alt="" /> : null}
          <span>{data.autores[0].nombreCompleto}</span>
        </div>
      ) : null}
      <section className="glass-panel article-content">
        <div dangerouslySetInnerHTML={{ __html: data.contenido ?? "" }} />
      </section>
    </article>
  );
}
