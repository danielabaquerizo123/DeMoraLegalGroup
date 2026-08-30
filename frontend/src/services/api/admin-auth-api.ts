import type { AdminUser, ApiMessageResponse } from "../../types/api";
import { apiClient, clearStoredSessionToken, setStoredSessionToken } from "./api-client";

export type LoginPayload = {
  username: string;
  password: string;
};

export type ChangePasswordPayload = {
  password: string;
};

type LoginResponse = {
  user: AdminUser;
  sessionToken?: string;
};

export const adminAuthApi = {
  login: async (payload: LoginPayload) => {
    const response = await apiClient<ApiMessageResponse<LoginResponse>>("/api/admin/auth/login", {
      method: "POST",
      body: payload,
    });

    if (response.data?.sessionToken) {
      setStoredSessionToken(response.data.sessionToken);
    }

    return response;
  },
  me: () => apiClient<{ data: { user: AdminUser | null } }>("/api/admin/auth/me"),
  logout: async () => {
    try {
      await apiClient<ApiMessageResponse>("/api/admin/auth/logout", {
        method: "POST",
      });
    } finally {
      clearStoredSessionToken();
    }
  },
  changePassword: (payload: ChangePasswordPayload) =>
    apiClient<ApiMessageResponse>("/api/admin/auth/cambiar-contrasena", {
      method: "POST",
      body: payload,
    }),
};
