import { apiClient } from "@/lib/apiClient";
import type { CallLogResponse } from "@/types/call";

export const callService = {
  getWorkspaceCalls: async (workspaceId: string): Promise<CallLogResponse[]> => {
    const res = await apiClient.get(`/workspaces/${workspaceId}/calls`);
    return res.data; // Assuming it directly returns the list based on typical Spring Boot ResponseEntity<List<CallLogResponse>>
  }
};
