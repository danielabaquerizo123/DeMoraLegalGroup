import { Link } from "react-router-dom";
import type { LegalService } from "../../types/api";

type ServiceStripProps = {
  services: LegalService[];
};

function ServiceIcon({ index }: { index: number }) {
  const icons = [
    <path key="scales" d="M12 4v16M7 7h10M8 7l-3 6h6L8 7Zm8 0-3 6h6l-3-6ZM6 20h12" />,
    <path key="gavel" d="m14 5 5 5M12 7l5 5M6 13l5 5M5 19l6-6M13 5l-8 8M18 10l-8 8" />,
    <path key="briefcase" d="M9 7V5h6v2M5 8h14v11H5V8Zm0 5h14M10 13h4" />,
    <path key="shield" d="M12 3 19 6v5c0 4.2-2.6 7.4-7 9-4.4-1.6-7-4.8-7-9V6l7-3Zm-3 8 2 2 4-5" />,
    <path key="document" d="M7 3h7l3 3v15H7V3Zm7 0v4h4M9 11h6M9 15h6M9 19h4" />,
    <path key="handshake" d="M7 12 4 9l4-4 4 4M17 12l3-3-4-4-4 4M8 13l4 4 4-4M10 15l-2 2M14 15l2 2" />,
  ];

  return (
    <svg className="service-strip__icon" viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
        {icons[index % icons.length]}
      </g>
    </svg>
  );
}

export function ServiceStrip({ services }: ServiceStripProps) {
  if (services.length === 0) {
    return null;
  }

  return (
    <section className="service-strip reveal" aria-label="Servicios destacados">
      <div className="service-strip__inner">
        {services.map((service, index) => (
          <Link className="service-strip__item" key={service.slug} to={`/servicios/${service.slug}`}>
            <ServiceIcon index={index} />
            <span>{service.nombre}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
