import type { Request } from "express";
import { getSessionCookieName } from "../services/admin-auth.service";
import { readCookie } from "./cookies";

export function readAuthToken(request: Request): string | null {
  const cookieToken = readCookie(request.headers.cookie, getSessionCookieName());
  if (cookieToken) {
    return cookieToken;
  }

  const authorization = request.headers.authorization;
  if (authorization && authorization.startsWith("Bearer ")) {
    const bearerToken = authorization.slice("Bearer ".length).trim();
    if (bearerToken) {
      return bearerToken;
    }
  }

  return null;
}
