import type { SiteConfiguration } from "../../types/api";
import { buildWhatsAppUrl } from "../../utils/whatsapp";

type CTASectionProps = {
  configuration: SiteConfiguration | null;
};

export function CTASection({ configuration }: CTASectionProps) {
  const whatsapp = configuration?.contacto_whatsapp_principal;

  return (
    <section className="cta-section" id="contacto">
      <div>
        <p className="eyebrow">05&nbsp;&nbsp; Hablemos</p>
        <h2>¿Necesita asesoría jurídica?</h2>
      </div>
      {whatsapp ? (
        <div className="cta-contact-items">
          <a className="cta-contact-item" href={buildWhatsAppUrl(whatsapp.url)} target="_blank" rel="noreferrer">
            <span aria-hidden="true">☎</span>
            <strong>WhatsApp</strong>
            <small>{whatsapp.display}</small>
          </a>
        </div>
      ) : null}
    </section>
  );
}
