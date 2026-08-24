export type AssistantView = "home" | "services" | "team" | "blog" | "contact";

export const assistantOptions: Array<{
  label: string;
  view: AssistantView;
}> = [
  { label: "Necesito asesoría jurídica", view: "services" },
  { label: "Ver servicios", view: "services" },
  { label: "Conocer al equipo", view: "team" },
  { label: "Leer artículos", view: "blog" },
  { label: "Contactar al estudio", view: "contact" },
];
