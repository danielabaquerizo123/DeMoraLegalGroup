import { z } from "zod";
import { EstadoPublicacion } from "../generated/prisma/enums";

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();

export const adminPostStatusQuerySchema = z.object({
  estado: z.enum(["TODAS", "PUBLICADO", "BORRADOR"]).default("TODAS"),
});

export const adminPostIdParamSchema = z.object({
  id: z.string().uuid("Identificador inválido."),
});

export const adminPostPayloadSchema = z.object({
  titulo: z.string().trim().min(1, "El título es obligatorio.").max(250, "El título es demasiado largo."),
  extracto: optionalText(500),
  contenido: z.string().trim().min(1, "El contenido es obligatorio."),
  imagenPortadaUrl: optionalText(2000000),
  estado: z.enum([EstadoPublicacion.BORRADOR, EstadoPublicacion.PUBLICADO]).default(EstadoPublicacion.BORRADOR),
});

export const adminPostStatusSchema = z.object({
  estado: z.enum([EstadoPublicacion.BORRADOR, EstadoPublicacion.PUBLICADO]),
});
