import { Link, useParams } from "react-router-dom";
import { ErrorState } from "../../components/common/ErrorState";
import { LoadingState } from "../../components/common/LoadingState";
import { serviceApi } from "../../services/api/service-api";
import { useApi } from "../../hooks/use-api";

export function ServiceDetailPage() {
  const { slug = "" } = useParams();
  const service = useApi(() => serviceApi.detail(slug), [slug]);

  if (service.isLoading) {
    return <LoadingState label="Cargando servicio" />;
  }

  if (service.error || !service.data) {
    return <ErrorState message="No encontramos este servicio." />;
  }

  const data = service.data.data;

  return (
    <article className="detail-page detail-page--narrow">
      <p className="eyebrow">Servicio juridico</p>
      <h1>{data.nombre}</h1>
      {data.descripcion ? <p className="lead">{data.descripcion}</p> : null}
      <section className="glass-panel">
        <h2>Profesionales relacionados</h2>
        {data.profesionales && data.profesionales.length > 0 ? (
          <ul className="stack-list">
            {data.profesionales.map((professional) => (
              <li key={professional.slug}>
                <Link to={`/profesionales/${professional.slug}`}>{professional.nombreCompleto}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>Profesionales por confirmar.</p>
        )}
      </section>
    </article>
  );
}
