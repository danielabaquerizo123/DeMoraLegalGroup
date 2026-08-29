import { z } from "zod";

export const publicCommentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(10).default(10),
});

export const publicCommentPayloadSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio.").max(80, "El nombre no puede superar 80 caracteres."),
  contenido: z.string().trim().min(1, "El comentario es obligatorio.").max(500, "El comentario no puede superar 500 caracteres."),
});

export const adminReplyPayloadSchema = z.object({
  contenido: z.string().trim().min(1, "La respuesta es obligatoria.").max(500, "La respuesta no puede superar 500 caracteres."),
});

export const commentIdParamSchema = z.object({
  id: z.string().uuid("Identificador inválido."),
});
