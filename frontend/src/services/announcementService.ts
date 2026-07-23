import { apiClient } from "@/lib/apiClient";
import type { Announcement, AnnouncementRequest } from '../types/announcement';

export const announcementService = {
  getAnnouncements: async (startupUuid: string): Promise<Announcement[]> => {
    const response = await apiClient.get(`/workspaces/${startupUuid}/announcements`);
    return response.data;
  },

  createAnnouncement: async (startupUuid: string, data: AnnouncementRequest): Promise<Announcement> => {
    const response = await apiClient.post(`/workspaces/${startupUuid}/announcements`, data);
    return response.data;
  },

  deleteAnnouncement: async (startupUuid: string, announcementUuid: string): Promise<void> => {
    await apiClient.delete(`/workspaces/${startupUuid}/announcements/${announcementUuid}`);
  },

  togglePin: async (startupUuid: string, announcementUuid: string, isPinned: boolean): Promise<Announcement> => {
    const response = await apiClient.patch(`/workspaces/${startupUuid}/announcements/${announcementUuid}/pin`, null, {
      params: { isPinned }
    });
    return response.data;
  }
};
