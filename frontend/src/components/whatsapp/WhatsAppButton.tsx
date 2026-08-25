import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { serviceApi } from "../../services/api/service-api";
import type { SiteConfiguration } from "../../types/api";
import { buildWhatsAppUrl, serviceWhatsAppMessage } from "../../utils/whatsapp";

type WhatsAppButtonProps = {
  configuration: SiteConfiguration | null;
};

export function WhatsAppButton({ configuration }: WhatsAppButtonProps) {
  const location = useLocation();
  const [serviceName, setServiceName] = useState<string | null>(null);
  const whatsapp = configuration?.contacto_whatsapp_principal;
  const serviceMatch = location.pathname.match(/^\/servicios\/([^/]+)$/);
  const serviceSlug = serviceMatch?.[1] ?? null;

  useEffect(() => {
    let isMounted = true;

    if (!serviceSlug) {
      setServiceName(null);
      return undefined;
    }

    serviceApi
      .detail(serviceSlug)
      .then((response) => {
        if (isMounted) {
          setServiceName(response.data.nombre);
        }
      })
      .catch(() => {
        if (isMounted) {
          setServiceName(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [serviceSlug]);

  const href = useMemo(() => {
    if (!whatsapp) {
      return null;
    }

    return buildWhatsAppUrl(whatsapp.url, serviceName ? serviceWhatsAppMessage(serviceName) : undefined);
  }, [serviceName, whatsapp]);

  if (!whatsapp || !href) {
    return null;
  }

  return (
    <a className="whatsapp-float" href={href} target="_blank" rel="noreferrer" aria-label="Contactar por WhatsApp" title="WhatsApp">
      <img src="/images/ui/legal-whatsapp.png" alt="" aria-hidden="true" />
      <span>WhatsApp</span>
    </a>
  );
}
