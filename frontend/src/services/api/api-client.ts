import { API_BASE_URL } from "../../config/api";

export const AUTH_TOKEN_STORAGE_KEY = "demora_admin_session_token";

export function getStoredSessionToken(): string | null {
  try {
    return sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredSessionToken(token: string): void {
  try {
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } catch {
    // sessionStorage no disponible: la cookie sigue siendo el transporte principal.
  }
}

export function clearStoredSessionToken(): void {
  try {
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // sin sesión persistente que limpiar.
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiClientOptions = {
  method?: string;
  body?: unknown;
};

export const apiClient = async <T>(path: string, options: ApiClientOptions = {}): Promise<T> => {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const token = getStoredSessionToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const fallbackMessage = "No pudimos cargar la informacion solicitada.";
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;

    throw new ApiError(payload?.error?.message ?? fallbackMessage, response.status);
  }

  return response.json() as Promise<T>;
};
