import type { TypographyBlog } from "../types/api";

export const TYPOGRAPHY_OPTIONS: ReadonlyArray<{ value: TypographyBlog; label: string }> = [
  { value: "INSTITUCIONAL", label: "Tipografía institucional" },
  { value: "TIMES_NEW_ROMAN", label: "Times New Roman" },
  { value: "ARIAL", label: "Arial" },
  { value: "CALIBRI", label: "Calibri" },
  { value: "GEORGIA", label: "Georgia" },
  { value: "GARAMOND", label: "Garamond" },
];

const TYPOGRAPHY_TO_CLASS: Record<TypographyBlog, string | null> = {
  INSTITUCIONAL: null,
  TIMES_NEW_ROMAN: "font-times-new-roman",
  ARIAL: "font-arial",
  CALIBRI: "font-calibri",
  GEORGIA: "font-georgia",
  GARAMOND: "font-garamond",
};

export function typographyClassName(typography: TypographyBlog | null | undefined) {
  return TYPOGRAPHY_TO_CLASS[typography ?? "INSTITUCIONAL"] ?? null;
}
