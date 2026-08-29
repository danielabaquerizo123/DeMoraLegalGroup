import type { AdminBlogComment, AdminBlogPost, AdminBlogSummary, AdminPostStatus, ApiCollectionResponse, ApiDetailResponse, BlogComment, TypographyBlog } from "../../types/api";
import { apiClient } from "./api-client";

export type AdminPostPayload = {
  titulo: string;
  tituloHtml?: string | null;
  extracto?: string;
  extractoHtml?: string | null;
  contenido: string;
  imagenPortadaUrl?: string | null;
  tituloTamano: AdminBlogPost["tituloTamano"];
  tituloAlineacion: AdminBlogPost["tituloAlineacion"];
  tituloTipografia: TypographyBlog;
  extractoTamano: AdminBlogPost["extractoTamano"];
  extractoAlineacion: AdminBlogPost["extractoAlineacion"];
  extractoTipografia: TypographyBlog;
  comentariosHabilitados: boolean;
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
  comments: () => apiClient<ApiCollectionResponse<AdminBlogComment>>("/api/admin/blog/comentarios"),
  replyComment: (id: string, contenido: string) =>
    apiClient<ApiDetailResponse<BlogComment["respuesta"]>>(`/api/admin/blog/comentarios/${id}/respuesta`, {
      method: "POST",
      body: { contenido },
    }),
  deleteComment: (id: string) =>
    apiClient<{ data: { message: string } }>(`/api/admin/blog/comentarios/${id}`, {
      method: "DELETE",
    }),
};
