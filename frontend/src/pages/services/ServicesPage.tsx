import { useOutletContext } from "react-router-dom";
import { ErrorState } from "../../components/common/ErrorState";
import { LoadingState } from "../../components/common/LoadingState";
import { ServiceCard } from "../../components/sections/ServiceCard";
import { servicesHeroAsset } from "../../constants/assets";
import { serviceApi } from "../../services/api/service-api";
import { useApi } from "../../hooks/use-api";
import type { SiteConfiguration } from "../../types/api";
import { buildWhatsAppUrl } from "../../utils/whatsapp";

type LayoutContext = {
  configuration: SiteConfiguration | null;
};

const commitmentItems = [
  {
    title: "Análisis riguroso de cada caso",
    icon: "target",
  },
  {
    title: "Ética y responsabilidad",
    icon: "shield",
  },
  {
    title: "Acompañamiento cercano y claro",
    icon: "team",
  },
];

const processSteps = [
  {
    title: "Escuchamos su caso",
    text: "Entendemos su situación, objetivos y necesidades.",
  },
  {
    title: "Analizamos",
    text: "Estudiamos el asunto con rigor técnico y criterio jurídico.",
  },
  {
    title: "Definimos una estrategia",
    text: "Proponemos el camino más adecuado para su caso.",
  },
  {
    title: "Lo acompañamos",
    text: "Durante todo el proceso, con comunicación clara y constante.",
  },
];

export function ServicesPage() {
  const services = useApi(serviceApi.list, []);
  const { configuration } = useOutletContext<LayoutContext>();
  const whatsapp = configuration?.contacto_whatsapp_principal;

  return (
    <article className="services-page cinematic-section" data-cinematic-services="true">
      <section className="services-hero" aria-labelledby="services-hero-title">
        <div className="services-hero__inner">
          <div className="services-hero__content">
            <p className="eyebrow">Nuestros servicios</p>
            <h1 id="services-hero-title">
              Asesoría jurídica que protege lo que <em>más importa</em>
            </h1>
            <i aria-hidden="true" />
            <p>Brindamos soluciones legales estratégicas, con un enfoque técnico, ético y orientado a los objetivos de cada cliente.</p>
          </div>
          <div className="services-hero__image" aria-hidden="true">
            <img src={servicesHeroAsset} alt="" />
          </div>
        </div>
      </section>

      <section className="services-catalog" aria-labelledby="services-catalog-title">
        <div className="services-catalog__intro">
          <p className="eyebrow">Áreas de práctica</p>
          <h2 id="services-catalog-title">
            Áreas en las que podemos <em>asesorarlo</em>
          </h2>
          <p>Una atención especializada para cada necesidad, con el respaldo de la experiencia y el criterio jurídico del equipo de De Mora Legal Group.</p>
        </div>

        {services.isLoading ? <LoadingState /> : null}
        {services.error ? <ErrorState message={services.error} /> : null}
        {services.data ? (
          <div className="service-grid service-grid--editorial">
            {services.data.data.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        ) : null}
      </section>

      <section className="services-commitment" aria-labelledby="services-commitment-title">
        <div className="services-commitment__inner">
          <div className="services-commitment__copy">
            <p className="eyebrow">Nuestro compromiso</p>
            <h2 id="services-commitment-title">
              Más que asesoría, <em>una visión estratégica.</em>
            </h2>
          </div>
          <div className="services-commitment__items">
            {commitmentItems.map((item) => (
              <div className="services-commitment__item" key={item.title}>
                <span className={`services-symbol services-symbol--${item.icon}`} aria-hidden="true" />
                <strong>{item.title}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="services-process" aria-labelledby="services-process-title">
        <div className="services-process__intro">
          <p className="eyebrow">Nuestro proceso</p>
          <h2 id="services-process-title">
            Un camino claro, de <em>principio a fin.</em>
          </h2>
        </div>
        <ol className="services-process__steps">
          {processSteps.map((step, index) => (
            <li key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {whatsapp ? (
        <section className="services-contact-cta" aria-label="Contacto por WhatsApp">
          <div>
            <p>¿Necesita asesoría jurídica?</p>
            <h2>Conversemos sobre su caso.</h2>
          </div>
          <a className="button button--primary" href={buildWhatsAppUrl(whatsapp.url)} target="_blank" rel="noreferrer">
            Consultar por WhatsApp
          </a>
        </section>
      ) : null}
    </article>
  );
}
