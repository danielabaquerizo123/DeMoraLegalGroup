import { Link } from "react-router-dom";
import {
  BookOpen,
  BriefcaseBusiness,
  Calculator,
  Car,
  FileText,
  Gavel,
  Home,
  Landmark,
  Mail,
  Newspaper,
  MapPin,
  Phone,
  Scale,
  UserRound,
} from "lucide-react";
import { logoTransparentAsset } from "../../constants/assets";
import { useApi } from "../../hooks/use-api";
import { serviceApi } from "../../services/api/service-api";
import type { SiteConfiguration } from "../../types/api";
import { formatYear } from "../../utils/format";
import { buildWhatsAppUrl } from "../../utils/whatsapp";

type FooterProps = {
  configuration: SiteConfiguration | null;
};

const serviceIconMap = {
  "litigacion-y-asesoria-juridica": Scale,
  "derecho-procesal": Gavel,
  "derecho-administrativo": Landmark,
  "derecho-constitucional": BookOpen,
  "derecho-tributario": Calculator,
  "contratacion-publica": FileText,
  "derecho-de-familia": UserRound,
  "derecho-de-transito": Car,
};

export function Footer({ configuration }: FooterProps) {
  const name = configuration?.nombre_estudio?.nombre ?? "De Mora Legal Group";
  const whatsapp = configuration?.contacto_whatsapp_principal;
  const whatsappDisplay = whatsapp?.display ?? "+593 99 351 3995";
  const whatsappUrl = whatsapp ? buildWhatsAppUrl(whatsapp.url) : "https://wa.me/593993513995";
  const services = useApi(serviceApi.list, []);

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <Link className="brand brand--footer brand--logo" to="/" aria-label={`Ir al inicio de ${name}`}>
            <img src={logoTransparentAsset} alt={name} loading="lazy" />
          </Link>
          <p>© {formatYear()} {name}. Todos los derechos reservados.</p>
        </div>
        <div className="footer-column">
          <h2>Enlaces</h2>
          <Link to="/"><Home /> Inicio</Link>
          <a href="/#profesionales"><UserRound /> Profesionales</a>
          <Link to="/servicios"><BriefcaseBusiness /> Servicios</Link>
          <Link to="/blog"><Newspaper /> Blog</Link>
          <Link to="/contacto"><Mail /> Contacto</Link>
        </div>
        <div className="footer-column">
          <h2>Servicios</h2>
          {services.data?.data.map((service) => (
            <Link key={service.slug} to={`/servicios#${service.slug}`}>
              {(() => {
                const Icon = serviceIconMap[service.slug as keyof typeof serviceIconMap] ?? Scale;
                return <Icon />;
              })()}
              {service.nombre}
            </Link>
          ))}
        </div>
        <div className="footer-column">
          <h2>Contacto</h2>
          <a href={whatsappUrl} target="_blank" rel="noreferrer">
            <Phone />
            {whatsappDisplay}
          </a>
          <p>
            <MapPin />
            Guayaquil, Ecuador
          </p>
        </div>
      </div>
    </footer>
  );
}
