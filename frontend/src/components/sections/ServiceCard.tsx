import { serviceImagePositions, serviceImages, studioMeetingAsset } from "../../constants/assets";
import type { LegalService } from "../../types/api";

type ServiceCardProps = {
  service: LegalService;
};

export function ServiceCard({ service }: ServiceCardProps) {
  const imageSrc = serviceImages[service.slug] ?? service.imagenUrl ?? studioMeetingAsset;
  const imagePosition = serviceImagePositions[service.slug] ?? "center 55%";
  const iconLabel = service.icono ?? "Servicio juridico";

  return (
    <article className="service-card" id={service.slug} tabIndex={-1}>
      <div className="service-card__image" aria-hidden="true">
        <img src={imageSrc} alt="" loading="lazy" style={{ objectPosition: imagePosition }} />
      </div>
      <div className="service-card__body">
        <div className={`service-card__icon service-card__icon--${service.slug}`} aria-label={iconLabel} />
        <h3>{service.nombre}</h3>
        {service.resumen ? <p>{service.resumen}</p> : null}
      </div>
    </article>
  );
}
