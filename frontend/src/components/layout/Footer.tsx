import { Link } from "react-router-dom";
import { logoTransparentAsset } from "../../constants/assets";
import { useApi } from "../../hooks/use-api";
import { serviceApi } from "../../services/api/service-api";
import type { SiteConfiguration } from "../../types/api";
import { formatYear } from "../../utils/format";
import { buildWhatsAppUrl } from "../../utils/whatsapp";

type FooterProps = {
  configuration: SiteConfiguration | null;
};

export function Footer({ configuration }: FooterProps) {
  const name = configuration?.nombre_estudio?.nombre ?? "De Mora Legal Group";
  const whatsapp = configuration?.contacto_whatsapp_principal;
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
          <Link to="/">Inicio</Link>
          <a href="/#profesionales">Profesionales</a>
          <Link to="/servicios">Servicios</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/contacto">Contacto</Link>
        </div>
        <div className="footer-column">
          <h2>Servicios</h2>
          {services.data?.data.map((service) => (
            <Link key={service.slug} to={`/servicios/${service.slug}`}>
              {service.nombre}
            </Link>
          ))}
        </div>
        <div className="footer-column">
          <h2>Contacto</h2>
          {whatsapp ? (
            <a href={buildWhatsAppUrl(whatsapp.url)} target="_blank" rel="noreferrer">
              {whatsapp.display}
            </a>
          ) : null}
          {!whatsapp ? <p>Información de contacto pendiente de configuración pública.</p> : null}
        </div>
      </div>
    </footer>
  );
}
