import type { ApiCollectionResponse, ApiDetailResponse, Professional } from "../../types/api";
import { apiClient } from "./api-client";

export const professionalApi = {
  list: () => apiClient<ApiCollectionResponse<Professional>>("/api/profesionales"),
  detail: (slug: string) => apiClient<ApiDetailResponse<Professional>>(`/api/profesionales/${slug}`),
};
