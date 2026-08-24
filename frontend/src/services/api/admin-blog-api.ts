import type { AdminBlogPost, AdminBlogSummary, AdminPostStatus, ApiCollectionResponse, ApiDetailResponse } from "../../types/api";
import { apiClient } from "./api-client";

export type AdminPostPayload = {
  titulo: string;
  extracto?: string;
  contenido: string;
  imagenPortadaUrl?: string | null;
  estado: AdminPostStatus;
};

export const adminBlogApi = {
  summary: () => apiClient<ApiDetailResponse<AdminBlogSummary>>("/api/admin/blog"),
  list: (estado: AdminPostStatus | "TODAS" = "TODAS") => apiClient<ApiCollectionResponse<AdminBlogPost>>(`/api/admin/blog/publicaciones?estado=${estado}`),
  detail: (id: string) => apiClient<ApiDetailResponse<AdminBlogPost>>(`/api/admin/blog/publicaciones/${id}`),
  create: (payload: AdminPostPayload) =>
    apiClient<ApiDetailResponse<AdminBlogPost>>("/api/admin/blog/publicaciones", {
      method: "POST",
      body: payload,
    }),
  update: (id: string, payload: AdminPostPayload) =>
    apiClient<ApiDetailResponse<AdminBlogPost>>(`/api/admin/blog/publicaciones/${id}`, {
      method: "PUT",
      body: payload,
    }),
  updateStatus: (id: string, estado: AdminPostStatus) =>
    apiClient<ApiDetailResponse<AdminBlogPost>>(`/api/admin/blog/publicaciones/${id}/estado`, {
      method: "PATCH",
      body: { estado },
    }),
  delete: (id: string) =>
    apiClient<{ data: { message: string } }>(`/api/admin/blog/publicaciones/${id}`, {
      method: "DELETE",
    }),
};
