import type { ApiCollectionResponse, ApiDetailResponse, Article, Category, PaginatedResponse } from "../../types/api";
import { apiClient } from "./api-client";

export const blogApi = {
  listArticles: (page = 1, limit = 10) => apiClient<PaginatedResponse<Article>>(`/api/articulos?page=${page}&limit=${limit}`),
  articleDetail: (slug: string) => apiClient<ApiDetailResponse<Article>>(`/api/articulos/${slug}`),
  listCategories: () => apiClient<ApiCollectionResponse<Category>>("/api/categorias"),
  categoryDetail: (slug: string) => apiClient<ApiDetailResponse<Category>>(`/api/categorias/${slug}`),
};
