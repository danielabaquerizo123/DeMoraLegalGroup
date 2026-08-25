import { z } from "zod";
import { EstadoPublicacion } from "../generated/prisma/enums";

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();

// Límite temporal para imagenPortadaUrl mientras se almacenen data URLs Base64.
// El frontend acepta archivos de hasta 2 MB; Base64 infla ~4/3 (≈ 2 793 538 caracteres)
// más el prefijo "data:image/...;base64,". Se fija 3 000 000 como tope con margen
// mínimo para bloquear payloads absurdos sin rechazar una imagen válida de 2 MB.
// Cuando la portada pase a almacenarse en un servicio de archivos (URL corta),
// este límite debe reducirse a un VarChar/limite de URL normal.
export const IMAGEN_PORTADA_MAX_CARACTERES = 3000000;

export const adminPostStatusQuerySchema = z.object({
  estado: z.enum(["TODAS", "PUBLICADO", "BORRADOR"]).default("TODAS"),
});

export const adminPostIdParamSchema = z.object({
  id: z.string().uuid("Identificador inválido."),
});

export const adminPostPayloadSchema = z
  .object({
    titulo: z.string().trim().max(250, "El título es demasiado largo.").optional().default(""),
    extracto: optionalText(500),
    contenido: z.string().trim().optional().default(""),
    imagenPortadaUrl: optionalText(IMAGEN_PORTADA_MAX_CARACTERES),
    estado: z.enum([EstadoPublicacion.BORRADOR, EstadoPublicacion.PUBLICADO]).default(EstadoPublicacion.BORRADOR),
  })
  .superRefine((payload, context) => {
    if (payload.estado !== EstadoPublicacion.PUBLICADO) {
      return;
    }

    if (!payload.titulo) {
      context.addIssue({ code: "custom", path: ["titulo"], message: "El título es obligatorio para publicar." });
    }

    if (!payload.contenido) {
      context.addIssue({ code: "custom", path: ["contenido"], message: "El contenido es obligatorio para publicar." });
    }
  });

export const adminPostStatusSchema = z.object({
  estado: z.enum([EstadoPublicacion.BORRADOR, EstadoPublicacion.PUBLICADO]),
});
