import { Link, useOutletContext, useParams } from "react-router-dom";
import { ErrorState } from "../../components/common/ErrorState";
import { LoadingState } from "../../components/common/LoadingState";
import {
  ProfessionalEditorialSections,
  ProfessionalContactCTA,
  ProfessionalHero,
  ProfessionalQuote,
} from "../../components/professionals/ProfessionalProfileSections";
import { professionalApi } from "../../services/api/professional-api";
import { useApi } from "../../hooks/use-api";
import type { SiteConfiguration } from "../../types/api";

type LayoutContext = {
  configuration: SiteConfiguration | null;
};

export function ProfessionalDetailPage() {
  const { slug = "" } = useParams();
  const { configuration } = useOutletContext<LayoutContext>();
  const professional = useApi(() => professionalApi.detail(slug), [slug]);

  if (professional.isLoading) {
    return <LoadingState label="Cargando perfil profesional" />;
  }

  if (professional.error || !professional.data) {
    return <ErrorState message="No encontramos este perfil profesional." />;
  }

  const data = professional.data.data;

  return (
    <article className="professional-profile">
      <Link className="profile-back-link" to="/#profesionales">
        <span aria-hidden="true">←</span>
        Volver a nuestro equipo
      </Link>
      <ProfessionalHero professional={data} configuration={configuration} />
      <ProfessionalQuote professional={data} />
      <ProfessionalEditorialSections professional={data} />
      <ProfessionalContactCTA professional={data} configuration={configuration} />
    </article>
  );
}
