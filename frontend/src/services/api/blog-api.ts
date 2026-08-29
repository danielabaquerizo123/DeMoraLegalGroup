import type { ApiCollectionResponse, ApiDetailResponse, Article, BlogComment, Category, PaginatedResponse } from "../../types/api";
import { apiClient } from "./api-client";

export const blogApi = {
  listArticles: (page = 1, limit = 10) => apiClient<PaginatedResponse<Article>>(`/api/articulos?page=${page}&limit=${limit}`),
  articleDetail: (slug: string) => apiClient<ApiDetailResponse<Article>>(`/api/articulos/${slug}`),
  listComments: (slug: string, page = 1, limit = 10) => apiClient<PaginatedResponse<BlogComment>>(`/api/articulos/${slug}/comentarios?page=${page}&limit=${limit}`),
  createComment: (slug: string, payload: { nombre: string; contenido: string }) =>
    apiClient<ApiDetailResponse<BlogComment>>(`/api/articulos/${slug}/comentarios`, {
      method: "POST",
      body: payload,
    }),
  listCategories: () => apiClient<ApiCollectionResponse<Category>>("/api/categorias"),
  categoryDetail: (slug: string) => apiClient<ApiDetailResponse<Category>>(`/api/categorias/${slug}`),
};
