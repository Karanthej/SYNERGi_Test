import type { StartupResponse } from "@/components/startup/StartupCard";
import { apiClient } from "@/lib/apiClient";

export const startupService = {
  getMyStartups: async (): Promise<StartupResponse[]> => {
    const res = await apiClient.get('/founder/startups');
    return res.data.data;
  },
  
  createStartup: async (data: any): Promise<StartupResponse> => {
    const res = await apiClient.post('/founder/startups', data);
    return res.data.data;
  },
  
  updateStartup: async (uuid: string, data: any): Promise<StartupResponse> => {
    const res = await apiClient.put(`/founder/startups/${uuid}`, data);
    return res.data.data;
  },
  
  deleteStartup: async (uuid: string): Promise<void> => {
    await apiClient.delete(`/founder/startups/${uuid}`);
  },
  
  updateStatus: async (uuid: string, status: string): Promise<void> => {
    await apiClient.put(`/founder/startups/${uuid}/status?status=${status}`);
  },
  
  getStartup: async (uuid: string): Promise<StartupResponse> => {
    const res = await apiClient.get(`/founder/startups/${uuid}`);
    return res.data.data;
  }
};
