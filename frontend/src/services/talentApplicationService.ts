import { apiClient } from "@/lib/apiClient";

export interface ApplicationRequest {
  introduction: string;
  whyJoin: string;
  whyRightFit: string;
  preferredRole: string;
  yearsExperience?: string;
  currentOccupation?: string;
  skills: string;
  technologiesKnown?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  personalWebsiteUrl?: string;
  hoursAvailable?: string;
  preferredWorkingStyle?: string;
  availableStartDate?: string;
  previousStartupExperience?: string;
  openSourceContributions?: string;
  achievements?: string;
  additionalNotes?: string;
}

export interface ApplicationResponse {
  uuid: string;
  startupUuid: string;
  startupName: string;
  startupLogoUrl?: string;
  founderName: string;
  talentUuid: string;
  talentName: string;
  talentEmail: string;
  talentAvatarUrl?: string;
  status: string;
  
  introduction: string;
  whyJoin: string;
  whyRightFit: string;
  preferredRole: string;
  yearsExperience?: string;
  currentOccupation?: string;
  skills: string;
  technologiesKnown?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  personalWebsiteUrl?: string;
  hoursAvailable?: string;
  preferredWorkingStyle?: string;
  availableStartDate?: string;
  previousStartupExperience?: string;
  openSourceContributions?: string;
  achievements?: string;
  additionalNotes?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const talentApplicationService = {
  apply: async (startupUuid: string, data: ApplicationRequest): Promise<ApplicationResponse> => {
    const res = await apiClient.post(`/talent/startups/${startupUuid}/apply`, data);
    return res.data.data;
  },
  
  withdraw: async (appUuid: string): Promise<void> => {
    await apiClient.put(`/talent/applications/${appUuid}/withdraw`);
  },
  
  getMyApplications: async (page = 0, size = 12): Promise<PageResponse<ApplicationResponse>> => {
    const res = await apiClient.get(`/talent/applications`, { params: { page, size } });
    return res.data.data;
  },
  
  getApplicationStatus: async (startupUuid: string): Promise<ApplicationResponse | null> => {
    const res = await apiClient.get(`/talent/startups/${startupUuid}/application-status`);
    return res.data.data;
  }
};
