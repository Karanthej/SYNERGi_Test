import { apiClient } from "@/lib/apiClient";
import type { ApplicationResponse, PageResponse } from "./talentApplicationService";

export const founderApplicationService = {
  getStartupApplications: async (startupUuid: string, page = 0, size = 20): Promise<PageResponse<ApplicationResponse>> => {
    const res = await apiClient.get(`/founder/startups/${startupUuid}/applications`, { params: { page, size } });
    return res.data.data;
  },
  
  getApplicationDetails: async (appUuid: string): Promise<ApplicationResponse> => {
    const res = await apiClient.get(`/founder/applications/${appUuid}`);
    return res.data.data;
  },
  
  updateApplicationStatus: async (appUuid: string, status: string): Promise<void> => {
    await apiClient.put(`/founder/applications/${appUuid}/status?status=${status}`);
  }
};
