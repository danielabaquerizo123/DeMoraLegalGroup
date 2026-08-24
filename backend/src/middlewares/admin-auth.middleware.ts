import type { RequestHandler } from "express";
import { getAdminSession, getSessionCookieName } from "../services/admin-auth.service";
import { HttpError } from "../utils/http-error";
import { readCookie } from "../utils/cookies";

export const requireAdminAuth: RequestHandler = async (request, _response, next) => {
  try {
    const token = readCookie(request.headers.cookie, getSessionCookieName());

    if (!token) {
      throw new HttpError(401, "Acceso administrativo requerido.");
    }

    const session = await getAdminSession(token);

    if (!session) {
      throw new HttpError(401, "Sesión administrativa inválida o expirada.");
    }

    request.admin = session;
    next();
  } catch (error) {
    next(error);
  }
};
