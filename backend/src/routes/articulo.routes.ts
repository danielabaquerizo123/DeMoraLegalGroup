import { Router } from "express";
import { articuloController } from "../controllers/articulo.controller";
import { createPublicComment, listPublicComments, rateLimitPublicComments } from "../controllers/blog-comment.controller";
import { asyncHandler } from "../utils/async-handler";
import { validateParams, validateQuery } from "../validators/request.validator";
import { articuloQuerySchema } from "../validators/articulo-query.validator";
import { slugParamSchema } from "../validators/slug.validator";

export const articuloRoutes = Router();

articuloRoutes.get("/", validateQuery(articuloQuerySchema), asyncHandler(articuloController.list));
articuloRoutes.get("/:slug/comentarios", validateParams(slugParamSchema), listPublicComments);
articuloRoutes.post("/:slug/comentarios", validateParams(slugParamSchema), rateLimitPublicComments, createPublicComment);
articuloRoutes.get("/:slug", validateParams(slugParamSchema), asyncHandler(articuloController.detail));
