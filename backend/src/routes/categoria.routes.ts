import { Router } from "express";
import { categoriaController } from "../controllers/categoria.controller";
import { asyncHandler } from "../utils/async-handler";
import { validateParams } from "../validators/request.validator";
import { slugParamSchema } from "../validators/slug.validator";

export const categoriaRoutes = Router();

categoriaRoutes.get("/", asyncHandler(categoriaController.list));
categoriaRoutes.get("/:slug", validateParams(slugParamSchema), asyncHandler(categoriaController.detail));
