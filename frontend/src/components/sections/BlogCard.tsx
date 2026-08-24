import { Link } from "react-router-dom";
import type { Article } from "../../types/api";
import { formatDate } from "../../utils/format";

type BlogCardProps = {
  article: Article;
};

export function BlogCard({ article }: BlogCardProps) {
  return (
    <article className="blog-card">
      <p className="eyebrow">{article.categoria?.nombre ?? "Blog juridico"}</p>
      {article.imagen ? <img className="blog-card__image" src={article.imagen} alt="" /> : null}
      <h3>
        <Link to={`/blog/${article.slug}`}>{article.titulo}</Link>
      </h3>
      {article.extracto ? <p>{article.extracto}</p> : null}
      <div className="blog-card__meta">
        <span>{formatDate(article.fecha)}</span>
        <Link className="text-link" to={`/blog/${article.slug}`}>
          Leer más
        </Link>
      </div>
    </article>
  );
}
