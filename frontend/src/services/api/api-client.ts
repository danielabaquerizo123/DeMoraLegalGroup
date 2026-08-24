import { API_BASE_URL } from "../../config/api";

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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const fallbackMessage = "No pudimos cargar la informacion solicitada.";
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;

    throw new ApiError(payload?.error?.message ?? fallbackMessage, response.status);
  }

  return response.json() as Promise<T>;
};
