import { Router } from "express";
import { configuracionController } from "../controllers/configuracion.controller";
import { asyncHandler } from "../utils/async-handler";

export const configuracionRoutes = Router();

configuracionRoutes.get("/", asyncHandler(configuracionController.list));
