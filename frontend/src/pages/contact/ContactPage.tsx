import { useOutletContext } from "react-router-dom";
import { CTASection } from "../../components/sections/CTASection";
import type { SiteConfiguration } from "../../types/api";

type LayoutContext = {
  configuration: SiteConfiguration | null;
};

export function ContactPage() {
  const { configuration } = useOutletContext<LayoutContext>();
  const whatsapp = configuration?.contacto_whatsapp_principal;

  return (
    <section className="content-section page-section contact-page">
      <p className="eyebrow">Contacto</p>
      <h1>Hablemos de su caso.</h1>
      <p className="lead">Para consultas profesionales, utilice el canal institucional confirmado por el estudio.</p>
      <div className="glass-panel contact-panel">
        <h2>WhatsApp institucional</h2>
        {whatsapp ? (
          <>
            <p>{whatsapp.display}</p>
            <a className="button button--primary" href={whatsapp.url} target="_blank" rel="noreferrer">
              Abrir WhatsApp
            </a>
          </>
        ) : (
          <p>Contacto en preparacion.</p>
        )}
      </div>
      <CTASection configuration={configuration} />
    </section>
  );
}
