import type { AdminUser, ApiMessageResponse } from "../../types/api";
import { apiClient } from "./api-client";

export type LoginPayload = {
  username: string;
  password: string;
};

export type ChangePasswordPayload = {
  password: string;
};

export const adminAuthApi = {
  login: (payload: LoginPayload) =>
    apiClient<ApiMessageResponse<{ user: AdminUser }>>("/api/admin/auth/login", {
      method: "POST",
      body: payload,
    }),
  me: () => apiClient<{ data: { user: AdminUser | null } }>("/api/admin/auth/me"),
  logout: () =>
    apiClient<ApiMessageResponse>("/api/admin/auth/logout", {
      method: "POST",
    }),
  changePassword: (payload: ChangePasswordPayload) =>
    apiClient<ApiMessageResponse>("/api/admin/auth/cambiar-contrasena", {
      method: "POST",
      body: payload,
    }),
};
