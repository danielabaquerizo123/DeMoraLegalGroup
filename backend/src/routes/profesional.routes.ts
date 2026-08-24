import { Router } from "express";
import { profesionalController } from "../controllers/profesional.controller";
import { asyncHandler } from "../utils/async-handler";
import { validateParams } from "../validators/request.validator";
import { slugParamSchema } from "../validators/slug.validator";

export const profesionalRoutes = Router();

profesionalRoutes.get("/", asyncHandler(profesionalController.list));
profesionalRoutes.get("/:slug", validateParams(slugParamSchema), asyncHandler(profesionalController.detail));
