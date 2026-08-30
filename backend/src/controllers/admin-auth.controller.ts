import type { Request } from "express";
import { asyncHandler } from "../utils/async-handler";
import { readAuthToken } from "../utils/auth-token";
import {
  buildClearSessionCookie,
  buildSessionCookie,
  changeAdminPassword,
  getAdminSession,
  loginAdmin,
  logoutAdmin,
} from "../services/admin-auth.service";

function requestMeta(request: Request) {
  return {
    ip: request.ip,
    userAgent: request.get("user-agent"),
  };
}

export const login = asyncHandler(async (request, response) => {
  const result = await loginAdmin(request.body, requestMeta(request));

  response.setHeader("Set-Cookie", buildSessionCookie(result.sessionToken, result.expiresAt));
  response.status(200).json({
    data: {
      user: result.user,
      sessionToken: result.sessionToken,
      message: "Sesión iniciada correctamente.",
    },
  });
});

export const me = asyncHandler(async (request, response) => {
  const token = readAuthToken(request);
  const session = token ? await getAdminSession(token) : null;

  response.status(200).json({
    data: {
      user: session?.user ?? null,
    },
  });
});

export const logout = asyncHandler(async (request, response) => {
  const token = readAuthToken(request);
  await logoutAdmin(token);

  response.setHeader("Set-Cookie", buildClearSessionCookie());
  response.status(200).json({
    data: {
      message: "Sesión cerrada correctamente.",
    },
  });
});

export const changePassword = asyncHandler(async (request, response) => {
  await changeAdminPassword(request.admin!.user.id, request.body);

  response.status(200).json({
    data: {
      message: "Contraseña actualizada correctamente.",
    },
  });
});
