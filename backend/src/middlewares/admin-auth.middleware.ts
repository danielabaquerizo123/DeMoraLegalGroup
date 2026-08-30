import type { RequestHandler } from "express";
import { getAdminSession } from "../services/admin-auth.service";
import { HttpError } from "../utils/http-error";
import { readAuthToken } from "../utils/auth-token";

export const requireAdminAuth: RequestHandler = async (request, _response, next) => {
  try {
    const token = readAuthToken(request);

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
