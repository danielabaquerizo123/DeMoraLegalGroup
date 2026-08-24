import { BlogCard } from "../../components/sections/BlogCard";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { LoadingState } from "../../components/common/LoadingState";
import { SectionHeader } from "../../components/common/SectionHeader";
import { blogApi } from "../../services/api/blog-api";
import { useApi } from "../../hooks/use-api";

export function BlogPage() {
  const articles = useApi(() => blogApi.listArticles(1, 10), []);
  const categories = useApi(blogApi.listCategories, []);

  return (
    <section className="content-section page-section">
      <SectionHeader
        eyebrow="Blog"
        title="Análisis y contenidos jurídicos"
        description="Publicaciones institucionales del estudio."
      />
      {articles.isLoading ? <LoadingState label="Cargando articulos" /> : null}
      {articles.error ? <ErrorState message={articles.error} /> : null}
      {articles.data && articles.data.data.length > 0 ? (
        <div className="blog-grid">
          {articles.data.data.map((article) => (
            <BlogCard key={article.slug} article={article} />
          ))}
        </div>
      ) : null}
      {articles.data && articles.data.data.length === 0 ? (
        <EmptyState title="Próximamente publicaremos análisis y contenidos jurídicos." message="Este espacio reunirá criterios, comentarios y publicaciones del estudio." />
      ) : null}
      {categories.data ? (
        <div className="category-strip" aria-label="Categorias editoriales">
          {categories.data.data.map((category) => (
            <span key={category.slug}>{category.nombre}</span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
