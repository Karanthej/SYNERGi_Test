import { apiClient } from "@/lib/apiClient";

export interface ExploreStartupResponse {
  uuid: string;
  name: string;
  logoUrl?: string;
  coverUrl?: string;
  tagline?: string;
  pitch?: string;
  problemStatement?: string;
  solution?: string;
  vision?: string;
  mission?: string;
  detailedDescription?: string;
  targetAudience?: string;
  businessModel?: string;
  revenueModel?: string;
  currentProgress?: string;
  roadmap?: string;
  futureGoals?: string;

  industry?: string;
  stage?: string;
  teamSize?: string;
  expectedTeamSize?: string;
  timeline?: string;
  launchGoal?: string;
  commitmentType?: string;
  workType?: string;
  city?: string;
  equityAvailable?: string;
  equityPercentage?: string;

  createdAt: string;
  updatedAt: string;
  
  founderName: string;
  founderAvatarUrl?: string;
  
  views: number;
  bookmarksCount: number;
  teamMembersCount: number;
  maxMembers?: number;
  approvedMembers?: number;
  availableSlots?: number;
  applicationsOpen?: boolean;
  isBookmarkedByMe: boolean;
  isFollowing: boolean;
  isMember?: boolean;
  founderUuid?: string;

  roles: string[];
  skills: string[];
  attachments: { type: string; url: string; fileName?: string }[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const talentStartupService = {
  exploreStartups: async (params: any): Promise<PageResponse<ExploreStartupResponse>> => {
    const res = await apiClient.get('/talent/startups/explore', { params });
    return res.data.data;
  },
  
  getStartupDetails: async (uuid: string): Promise<ExploreStartupResponse> => {
    const res = await apiClient.get(`/talent/startups/${uuid}`);
    return res.data.data;
  },
  
  bookmarkStartup: async (uuid: string): Promise<void> => {
    await apiClient.post(`/talent/startups/${uuid}/bookmark`);
  },
  
  unbookmarkStartup: async (uuid: string): Promise<void> => {
    await apiClient.delete(`/talent/startups/${uuid}/bookmark`);
  },
  
  getBookmarkedStartups: async (page = 0, size = 12): Promise<PageResponse<ExploreStartupResponse>> => {
    const res = await apiClient.get('/talent/startups/bookmarks', { params: { page, size } });
    return res.data.data;
  }
};
