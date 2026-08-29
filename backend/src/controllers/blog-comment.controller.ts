import type { NextFunction, Request, Response } from "express";
import { blogCommentService } from "../services/blog-comment.service";
import { asyncHandler } from "../utils/async-handler";
import { adminReplyPayloadSchema, commentIdParamSchema, publicCommentPayloadSchema, publicCommentQuerySchema } from "../validators/blog-comment.validator";
import { slugParamSchema } from "../validators/slug.validator";

const commentAttempts = new Map<string, number[]>();
const COMMENT_WINDOW_MS = 60 * 1000;
const COMMENT_LIMIT = 4;

function clientKey(request: Request) {
  return `${request.ip}:${request.params.slug}`;
}

export function rateLimitPublicComments(request: Request, response: Response, next: NextFunction) {
  const key = clientKey(request);
  const now = Date.now();
  const attempts = (commentAttempts.get(key) ?? []).filter((time) => now - time < COMMENT_WINDOW_MS);

  if (attempts.length >= COMMENT_LIMIT) {
    response.status(429).json({ error: { message: "Espera un momento antes de publicar otro comentario." } });
    return;
  }

  attempts.push(now);
  commentAttempts.set(key, attempts);
  next();
}

function professionalIdFromSession(admin: NonNullable<Express.Request["admin"]>) {
  const professionalId = admin.user.profesional?.id;

  if (!professionalId) {
    throw new Error("La sesión administrativa no tiene profesional asociado.");
  }

  return professionalId;
}

export const listPublicComments = asyncHandler(async (request, response) => {
  const { slug } = slugParamSchema.parse(request.params);
  const query = publicCommentQuerySchema.parse(request.query);
  const result = await blogCommentService.listForArticle(slug, query);

  response.status(200).json(result);
});

export const createPublicComment = asyncHandler(async (request, response) => {
  const { slug } = slugParamSchema.parse(request.params);
  const payload = publicCommentPayloadSchema.parse(request.body);
  const data = await blogCommentService.createForArticle(slug, payload);

  response.status(201).json({ data });
});

export const listAdminComments = asyncHandler(async (request, response) => {
  const professionalId = professionalIdFromSession(request.admin!);
  const data = await blogCommentService.listForAdmin(professionalId);

  response.status(200).json({ data });
});

export const replyAdminComment = asyncHandler(async (request, response) => {
  const professionalId = professionalIdFromSession(request.admin!);
  const { id } = commentIdParamSchema.parse(request.params);
  const payload = adminReplyPayloadSchema.parse(request.body);
  const data = await blogCommentService.reply(professionalId, request.admin!.user.id, id, payload);

  response.status(201).json({ data });
});

export const deleteAdminComment = asyncHandler(async (request, response) => {
  const professionalId = professionalIdFromSession(request.admin!);
  const { id } = commentIdParamSchema.parse(request.params);
  await blogCommentService.remove(professionalId, id);

  response.status(200).json({ data: { message: "Comentario eliminado correctamente." } });
});
