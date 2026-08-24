import type { ApiCollectionResponse, ApiDetailResponse, LegalService } from "../../types/api";
import { apiClient } from "./api-client";

export const serviceApi = {
  list: () => apiClient<ApiCollectionResponse<LegalService>>("/api/servicios"),
  detail: (slug: string) => apiClient<ApiDetailResponse<LegalService>>(`/api/servicios/${slug}`),
};
