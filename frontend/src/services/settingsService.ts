// @ts-nocheck
import { apiClient } from '@/lib/apiClient';

export const settingsService = {
  getProfile: async () => {
    const res = await apiClient.get(`/profile`);
    return res.data.data;
  },

  getPublicProfile: async (uuid: string) => {
    const res = await apiClient.get(`/profile/${uuid}`);
    return res.data.data;
  },

  updateProfile: async (data: any) => {
    const res = await apiClient.put(`/profile`, data);
    return res.data.data;
  },



  uploadCoverImage: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post(`/profile/cover`, formData);
    return res.data.data;
  },

  uploadProfileImage: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post(`/profile/image`, formData);
    return res.data.data;
  },

  exploreUsers: async (params: ExploreUsersParams) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append("search", params.search);
    if (params.role) searchParams.append("role", params.role);
    if (params.page !== undefined) searchParams.append("page", params.page.toString());
    if (params.size !== undefined) searchParams.append("size", params.size.toString());
    if (params.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params.sortDir) searchParams.append("sortDir", params.sortDir);
    
    const res = await apiClient.get(`/profile/explore?${searchParams.toString()}`);
    return res.data.data;
  }
};
