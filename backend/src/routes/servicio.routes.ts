import { Router } from "express";
import { servicioController } from "../controllers/servicio.controller";
import { asyncHandler } from "../utils/async-handler";
import { validateParams } from "../validators/request.validator";
import { slugParamSchema } from "../validators/slug.validator";

export const servicioRoutes = Router();

servicioRoutes.get("/", asyncHandler(servicioController.list));
servicioRoutes.get("/:slug", validateParams(slugParamSchema), asyncHandler(servicioController.detail));
