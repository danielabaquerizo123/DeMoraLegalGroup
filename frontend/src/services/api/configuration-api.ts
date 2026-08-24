import type { ApiDetailResponse, SiteConfiguration } from "../../types/api";
import { apiClient } from "./api-client";

export const configurationApi = {
  getPublic: () => apiClient<ApiDetailResponse<SiteConfiguration>>("/api/configuracion"),
};
