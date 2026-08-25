import { useOutletContext } from "react-router-dom";
import { Clock, MessageCircle, Shield, Users } from "lucide-react";
import type { SiteConfiguration } from "../../types/api";
import { buildWhatsAppUrl } from "../../utils/whatsapp";

type LayoutContext = {
  configuration: SiteConfiguration | null;
};

const contactBenefits = [
  {
    icon: Shield,
    title: "Confidencialidad garantizada",
    text: "Su información está segura con nosotros.",
  },
  {
    icon: Clock,
    title: "Respuesta inmediata",
    text: "Atención rápida y eficiente en cada consulta.",
  },
  {
    icon: Users,
    title: "Asesoría profesional",
    text: "Nuestro equipo legal está listo para ayudarle.",
  },
];

export function ContactPage() {
  const { configuration } = useOutletContext<LayoutContext>();
  const whatsapp = configuration?.contacto_whatsapp_principal;
  const whatsappHref = whatsapp ? buildWhatsAppUrl(whatsapp.url) : "https://wa.me/593993513995";

  return (
    <section className="contact-page" aria-labelledby="contact-title">
      <div className="contact-hero">
        <img
          className="contact-hero__background"
          src="/images/contact/contact-legal-hero.jpg"
          alt=""
          aria-hidden="true"
        />
        <div className="contact-hero__content">
          <p className="eyebrow">Contacto</p>
          <h1 id="contact-title">Hablemos de su caso.</h1>
          <i aria-hidden="true" />
          <p>Estamos listos para brindarle la asesoría legal que usted y su caso merecen.</p>
        </div>

        <aside className="contact-whatsapp-card" aria-label="Contacto por WhatsApp">
          <span className="contact-whatsapp-card__icon" aria-hidden="true">
            <MessageCircle />
          </span>
          <p className="contact-whatsapp-card__eyebrow">Contáctenos por</p>
          <h2>WhatsApp</h2>
          <span className="contact-whatsapp-card__rule" aria-hidden="true" />
          <p className="contact-whatsapp-card__copy">
            Comuníquese directamente con nuestro equipo legal. Atención rápida, confidencial y segura.
          </p>
          <a className="contact-whatsapp-card__button" href={whatsappHref} target="_blank" rel="noreferrer" aria-label="Hablar por WhatsApp">
            <MessageCircle aria-hidden="true" />
            Hablar por WhatsApp
          </a>
          <p className="contact-whatsapp-card__security">
            <Shield aria-hidden="true" />
            <span>
              Su información está protegida.
              <small>Atención 100% confidencial.</small>
            </span>
          </p>
        </aside>
      </div>

      <div className="contact-benefits" aria-label="Beneficios del contacto">
        {contactBenefits.map((benefit) => {
          const Icon = benefit.icon;

          return (
            <article className="contact-benefit" key={benefit.title}>
              <Icon aria-hidden="true" />
              <div>
                <h2>{benefit.title}</h2>
                <p>{benefit.text}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
