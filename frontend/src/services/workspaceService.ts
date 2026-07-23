import { apiClient } from "@/lib/apiClient";

export interface WorkspaceResponse {
  startupUuid: string;
  startupName: string;
  startupLogoUrl?: string;
  tagline?: string;
  stage?: string;
  status: string;
  ownerName: string;
  teamMemberCount: number;
  lastActivity: string;
  userRole: string; // OWNER, TEAM_MEMBER
}

export interface WorkspaceMemberResponse {
  userUuid: string;
  fullName: string;
  username?: string;
  email: string;
  avatarUrl?: string;
  role: string; // OWNER, TEAM_MEMBER
  assignedRole?: string;
  skills?: string;
  bio?: string;
  status: string;
  joinedAt: string;
  isOnline?: boolean;   // from backend isOnline field
  online?: boolean;     // Lombok may serialize as 'online' (strips 'is' prefix)
  lastSeen?: string;
}


export const workspaceService = {
  getMyWorkspaces: async (): Promise<WorkspaceResponse[]> => {
    const res = await apiClient.get('/workspaces');
    return res.data.data;
  },

  getWorkspaceMembers: async (startupUuid: string): Promise<WorkspaceMemberResponse[]> => {
    const res = await apiClient.get(`/workspaces/${startupUuid}/members`);
    return res.data.data;
  },

  removeMember: async (startupUuid: string, memberUuid: string): Promise<void> => {
    await apiClient.delete(`/workspaces/${startupUuid}/members/${memberUuid}`);
  }
};
