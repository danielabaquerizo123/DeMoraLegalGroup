import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import type { SiteConfiguration } from "../../types/api";
import { AssistantPanel } from "./AssistantPanel";
import { useAssistant } from "./use-assistant";

type LegalAssistantProps = {
  configuration: SiteConfiguration | null;
};

export function LegalAssistant({ configuration }: LegalAssistantProps) {
  const assistant = useAssistant(configuration);
  const { close, isOpen, open } = assistant;
  const location = useLocation();

  useEffect(() => {
    close();
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);

  return (
    <div className="assistant-shell">
      {isOpen ? <AssistantPanel assistant={assistant} /> : null}
      <button className="assistant-float" type="button" aria-label="Abrir asistente legal" aria-expanded={isOpen} onClick={open}>
        <span>Guía</span>
      </button>
    </div>
  );
}
