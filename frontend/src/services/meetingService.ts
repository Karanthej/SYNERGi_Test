import { apiClient as api } from '@/lib/apiClient';

export interface MeetingResponse {
    uuid: string;
    title: string;
    description: string;
    type: string; // INSTANT, SCHEDULED
    status: string; // SCHEDULED, ONGOING, COMPLETED
    creatorName: string;
    creatorUuid: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    startedAt: string;
    endedAt: string;
    createdAt: string;
    participantCount: number;
}

export const meetingService = {
    createMeeting: async (startupUuid: string, data: any) => {
        const response = await api.post<{ data: MeetingResponse }>(`/workspaces/${startupUuid}/meetings`, data);
        return response.data.data;
    },

    getMeetings: async (startupUuid: string) => {
        const response = await api.get<{ data: MeetingResponse[] }>(`/workspaces/${startupUuid}/meetings`);
        return response.data.data;
    },

    getMeeting: async (startupUuid: string, meetingUuid: string) => {
        const response = await api.get<{ data: MeetingResponse }>(`/workspaces/${startupUuid}/meetings/${meetingUuid}`);
        return response.data.data;
    },

    joinMeeting: async (startupUuid: string, meetingUuid: string) => {
        await api.post(`/workspaces/${startupUuid}/meetings/${meetingUuid}/join`);
    },

    leaveMeeting: async (startupUuid: string, meetingUuid: string) => {
        await api.post(`/workspaces/${startupUuid}/meetings/${meetingUuid}/leave`);
    },

    endMeeting: async (startupUuid: string, meetingUuid: string) => {
        await api.post(`/workspaces/${startupUuid}/meetings/${meetingUuid}/end`);
    }
};
