import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="content-section page-section not-found-page">
      <p className="eyebrow">404</p>
      <h1>Pagina no encontrada</h1>
      <p>La ruta solicitada no existe o ya no esta disponible.</p>
      <Link className="button button--primary" to="/">
        Volver al inicio
      </Link>
    </section>
  );
}
