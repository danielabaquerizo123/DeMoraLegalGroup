const DEFAULT_MESSAGE = "Hola, quisiera recibir información sobre sus servicios jurídicos.";

export function buildWhatsAppUrl(baseUrl: string, message = DEFAULT_MESSAGE) {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("text", message);
    return url.toString();
  } catch {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}text=${encodeURIComponent(message)}`;
  }
}

export function serviceWhatsAppMessage(serviceName: string) {
  return `Hola, quisiera recibir información sobre el servicio de ${serviceName}.`;
}
