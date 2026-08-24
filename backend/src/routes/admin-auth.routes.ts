import { Router } from "express";
import { changePassword, login, logout, me } from "../controllers/admin-auth.controller";
import { requireAdminAuth } from "../middlewares/admin-auth.middleware";
import { validateBody } from "../validators/request.validator";
import { adminChangePasswordSchema, adminLoginSchema } from "../validators/admin-auth.validator";

export const adminAuthRoutes = Router();

adminAuthRoutes.post("/login", validateBody(adminLoginSchema), login);
adminAuthRoutes.get("/me", me);
adminAuthRoutes.post("/logout", logout);
adminAuthRoutes.post("/cambiar-contrasena", requireAdminAuth, validateBody(adminChangePasswordSchema), changePassword);
