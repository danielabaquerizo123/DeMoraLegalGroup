import { Link } from "react-router-dom";
import { professionalImagePositions, professionalImages } from "../../constants/assets";
import type { Professional } from "../../types/api";

type ProfessionalCardProps = {
  index?: number;
  professional: Professional;
  priority?: boolean;
  variant?: "default" | "showcase";
};

export function ProfessionalCard({ professional, priority = false, index, variant = "default" }: ProfessionalCardProps) {
  const image = professionalImages[professional.slug];
  const imagePosition = professionalImagePositions[professional.slug] ?? "center 24%";
  const className = variant === "showcase" ? "professional-card professional-card--showcase" : "professional-card";

  return (
    <article className={className}>
      <Link to={`/profesionales/${professional.slug}`} className="professional-card__image-link" aria-label={`Ver perfil de ${professional.nombreCompleto}`}>
        {index ? <span className="professional-card__index">{String(index).padStart(2, "0")}</span> : null}
        <img
          src={image}
          alt={`Retrato profesional de ${professional.nombreCompleto}`}
          loading={priority ? "eager" : "lazy"}
          className="professional-card__image"
          style={{ objectPosition: imagePosition }}
        />
      </Link>
      <div className="professional-card__body">
        <p className="eyebrow">{professional.cargo ?? "Profesional"}</p>
        <h3>
          <Link to={`/profesionales/${professional.slug}`}>{professional.nombreCompleto}</Link>
        </h3>
        {variant === "default" && professional.resumenProfesional ? <p className="muted">{professional.resumenProfesional}</p> : null}
        {variant === "default" && professional.servicios.length > 0 ? (
          <ul className="tag-list" aria-label="Servicios relacionados">
            {professional.servicios.slice(0, 3).map((service) => (
              <li key={service.slug}>{service.nombre}</li>
            ))}
          </ul>
        ) : variant === "default" ? (
          <p className="muted small">Servicios por confirmar.</p>
        ) : null}
        {variant === "showcase" ? (
          <Link className="text-link" to={`/profesionales/${professional.slug}`}>
            Ver perfil
          </Link>
        ) : (
          <Link className="text-link" to={`/profesionales/${professional.slug}`}>
            Conocer perfil
          </Link>
        )}
      </div>
    </article>
  );
}
