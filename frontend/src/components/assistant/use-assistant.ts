import { useCallback, useMemo, useState } from "react";
import { serviceApi } from "../../services/api/service-api";
import type { LegalService, SiteConfiguration } from "../../types/api";
import { buildWhatsAppUrl, serviceWhatsAppMessage } from "../../utils/whatsapp";
import { useApi } from "../../hooks/use-api";
import type { AssistantView } from "./assistant-options";

export function useAssistant(configuration: SiteConfiguration | null) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<AssistantView>("home");
  const [selectedService, setSelectedService] = useState<LegalService | null>(null);
  const services = useApi(serviceApi.list, []);
  const whatsapp = configuration?.contacto_whatsapp_principal;

  const defaultWhatsappUrl = useMemo(() => {
    return whatsapp ? buildWhatsAppUrl(whatsapp.url) : null;
  }, [whatsapp]);

  const selectedServiceWhatsappUrl = useMemo(() => {
    if (!whatsapp || !selectedService) {
      return null;
    }

    return buildWhatsAppUrl(whatsapp.url, serviceWhatsAppMessage(selectedService.nombre));
  }, [selectedService, whatsapp]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const reset = useCallback(() => {
    setView("home");
    setSelectedService(null);
  }, []);

  const chooseView = useCallback((nextView: AssistantView) => {
    setView(nextView);
    setSelectedService(null);
  }, []);

  return {
    close,
    defaultWhatsappUrl,
    isOpen,
    open,
    reset,
    selectedService,
    selectedServiceWhatsappUrl,
    services,
    setIsOpen,
    setSelectedService,
    view,
    chooseView,
  };
}
