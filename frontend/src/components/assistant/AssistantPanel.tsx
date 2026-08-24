import { Link } from "react-router-dom";
import type { LegalService } from "../../types/api";
import { assistantOptions } from "./assistant-options";
import type { useAssistant } from "./use-assistant";

type AssistantState = ReturnType<typeof useAssistant>;

type AssistantPanelProps = {
  assistant: AssistantState;
};

export function AssistantPanel({ assistant }: AssistantPanelProps) {
  const {
    close,
    defaultWhatsappUrl,
    reset,
    selectedService,
    selectedServiceWhatsappUrl,
    services,
    setSelectedService,
    view,
    chooseView,
  } = assistant;

  return (
    <section className="assistant-panel" role="dialog" aria-modal="false" aria-label="Asistente legal orientativo">
      <div className="assistant-panel__header">
        <div>
          <p className="eyebrow">Orientación</p>
          <h2>Hola. ¿Cómo podemos ayudarte?</h2>
        </div>
        <button className="assistant-icon-button" type="button" aria-label="Cerrar asistente" onClick={close}>
          X
        </button>
      </div>

      <div className="assistant-panel__body">
        {view === "home" ? (
          <div className="assistant-option-grid">
            {assistantOptions.map((option) => (
              <button key={option.label} type="button" onClick={() => chooseView(option.view)}>
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        {view === "services" ? (
          <ServiceAssistantView
            defaultWhatsappUrl={defaultWhatsappUrl}
            selectedService={selectedService}
            selectedServiceWhatsappUrl={selectedServiceWhatsappUrl}
            services={services}
            setSelectedService={setSelectedService}
          />
        ) : null}

        {view === "team" ? (
          <AssistantLinkView
            title="Equipo profesional"
            description="Puedes revisar los perfiles públicos del equipo y sus servicios relacionados."
            to="/#profesionales"
            label="Ver profesionales"
          />
        ) : null}

        {view === "blog" ? (
          <AssistantLinkView
            title="Articulos"
            description="El blog está preparado para publicaciones jurídicas institucionales."
            to="/blog"
            label="Ir al blog"
          />
        ) : null}

        {view === "contact" ? (
          <div className="assistant-message">
            <h3>Contacto institucional</h3>
            <p>Podemos llevarte a la página de contacto o abrir WhatsApp con un mensaje profesional precargado.</p>
            <div className="assistant-actions">
              <Link className="button button--secondary" to="/contacto" onClick={close}>
                Ver contacto
              </Link>
              {defaultWhatsappUrl ? (
                <a className="button button--primary" href={defaultWhatsappUrl} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="assistant-panel__footer">
        <p>Esta guía es orientativa y no sustituye asesoría profesional.</p>
        {view !== "home" ? (
          <button type="button" onClick={reset}>
            Volver al inicio
          </button>
        ) : null}
      </div>
    </section>
  );
}

type ServiceAssistantViewProps = {
  defaultWhatsappUrl: string | null;
  selectedService: LegalService | null;
  selectedServiceWhatsappUrl: string | null;
  services: AssistantState["services"];
  setSelectedService: (service: LegalService) => void;
};

function ServiceAssistantView({
  defaultWhatsappUrl,
  selectedService,
  selectedServiceWhatsappUrl,
  services,
  setSelectedService,
}: ServiceAssistantViewProps) {
  if (services.isLoading) {
    return <p>Cargando servicios disponibles...</p>;
  }

  if (services.error || !services.data) {
    return (
      <div className="assistant-message">
        <h3>No pudimos cargar servicios</h3>
        <p>La navegación principal sigue disponible para continuar.</p>
      </div>
    );
  }

  return (
    <>
      <div className="assistant-service-list" aria-label="Servicios juridicos">
        {services.data.data.map((service) => (
          <button key={service.slug} type="button" onClick={() => setSelectedService(service)} className={selectedService?.slug === service.slug ? "active" : ""}>
            <span>{String(service.orden).padStart(2, "0")}</span>
            {service.nombre}
          </button>
        ))}
      </div>

      {selectedService ? (
        <div className="assistant-message">
          <h3>{selectedService.nombre}</h3>
          <p>{selectedService.resumen ?? selectedService.descripcion ?? "Servicio jurídico disponible para revisión profesional."}</p>
          <div className="assistant-actions">
            <Link className="button button--secondary" to={`/servicios/${selectedService.slug}`}>
              Ver detalle
            </Link>
            {selectedServiceWhatsappUrl ? (
              <a className="button button--primary" href={selectedServiceWhatsappUrl} target="_blank" rel="noreferrer">
                Contactar
              </a>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="assistant-message">
          <h3>Selecciona un servicio</h3>
          <p>Te mostraremos una descripción breve y una opción de contacto sin emitir criterio jurídico.</p>
          {defaultWhatsappUrl ? (
            <a className="text-link" href={defaultWhatsappUrl} target="_blank" rel="noreferrer">
              Contacto general
            </a>
          ) : null}
        </div>
      )}
    </>
  );
}

type AssistantLinkViewProps = {
  description: string;
  label: string;
  title: string;
  to: string;
};

function AssistantLinkView({ description, label, title, to }: AssistantLinkViewProps) {
  return (
    <div className="assistant-message">
      <h3>{title}</h3>
      <p>{description}</p>
      <Link className="button button--primary" to={to}>
        {label}
      </Link>
    </div>
  );
}
