import { apiClient as api } from '@/lib/apiClient';

export interface ReactionResponse {
    emoji: string;
    count: number;
    userUuids: string[];
}

export interface AttachmentResponse {
    uuid: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
}

export interface ChatMessage {
    uuid: string;
    content: string;
    senderUuid: string;
    senderName: string;
    senderUsername?: string;
    senderAvatarUrl: string;
    senderRole: string;
    isPinned: boolean;
    isDeleted: boolean;
    isDeletedForMe: boolean;
    isEdited: boolean;
    isVoiceNote: boolean;
    voiceNoteDuration?: number;
    voiceNoteWaveform?: string;
    createdAt: string;
    replyToMessageUuid?: string;
    replyToContent?: string;
    replyToSenderName?: string;
    replyToSenderUsername?: string;
    reactions: ReactionResponse[];
    attachments: AttachmentResponse[];
}

export interface MessageStatusResponse {
    userUuid: string;
    deliveredAt: string | null;
    readAt: string | null;
}

export interface ChatMessageResponse {
    uuid: string;
    tempUuid?: string; // Client-side generated UUID for optimistic UI
    content: string;
    senderUuid: string;
    senderName: string;
    senderUsername?: string;
    senderAvatarUrl?: string;
    senderRole?: string;
    isPinned: boolean;
    isDeleted: boolean;
    isDeletedForMe: boolean;
    isEdited: boolean;
    isVoiceNote: boolean;
    voiceNoteDuration?: number;
    voiceNoteWaveform?: string;
    createdAt: string;
    replyToMessageUuid?: string;
    replyToContent?: string;
    replyToSenderName?: string;
    replyToSenderUsername?: string;
    reactions: ReactionResponse[];
    attachments: AttachmentResponse[];
    statuses?: MessageStatusResponse[];
    // Frontend-only properties:
    status?: 'sending' | 'sent' | 'failed'; 
    isUploading?: boolean;
    uploadProgress?: number;
    isFailed?: boolean;
    abortController?: AbortController;
}

export interface ChatRoomResponse {
    uuid: string;
    type: 'GENERAL' | 'GROUP' | 'PRIVATE';
    name: string;
    memberCount: number;
    createdAt: string;
    otherMemberName?: string;
    otherMemberAvatarUrl?: string;
    otherMemberRole?: string;
    description?: string;
    iconUrl?: string;
    colorTheme?: string;
    visibility?: string;
    isArchived?: boolean;
    unreadCount?: number;
}

export interface ChatMember {
  userUuid: string;
  fullName: string;
  username?: string;
  profileImage?: string;
  role: string;
  joinedAt: string;
}

export interface ChatMemberResponse {
    userUuid: string;
    fullName: string;
    username?: string;
    profileImage: string;
    role: string;
    joinedAt: string;
    isOnline?: boolean;
    lastSeen?: string;
}

export interface ChatMessageRequest {
    content: string;
    replyToMessageUuid?: string;
}

export interface ChatNotificationResponse {
    messageUuid: string;
    roomUuid: string;
    startupUuid: string;
    startupName: string;
    senderName: string;
    senderAvatar: string | null;
    content: string;
    createdAt: string;
    isRead: boolean;
}

export interface CallLogRequest {
    callerId: string;
    receiverId: string;
    status: string;
    durationSeconds: number;
}

export interface CallLogResponse {
    uuid: string;
    callerId: string;
    receiverId: string;
    status: string;
    durationSeconds?: number;
    startedAt: string;
    isDeletedForMe?: boolean;
}

export interface ReadReceiptResponse {
    userUuid: string;
    messageUuid: string;
    messageCreatedAt: string;
    readAt: string;
}

export const chatService = {
    getRooms: async (startupUuid: string) => {
        const response = await api.get<{ data: ChatRoomResponse[] }>(`/workspaces/${startupUuid}/chat/rooms`);
        return response.data.data;
    },
    
    getRoomInfo: async (startupUuid: string, roomUuid: string) => {
        const response = await api.get<{ data: ChatRoomResponse }>(`/workspaces/${startupUuid}/chat/rooms/${roomUuid}`);
        return response.data.data;
    },

    getRoomMembers: async (startupUuid: string, roomUuid: string) => {
        const response = await api.get<{ data: ChatMemberResponse[] }>(`/workspaces/${startupUuid}/chat/rooms/${roomUuid}/members`);
        return response.data.data;
    },

    getUnreadNotifications: async (): Promise<ChatNotificationResponse[]> => {
        const response = await api.get('/global-chat/unread');
        return response.data.data;
    },

    getMessages: async (startupUuid: string, roomUuid: string, page = 0, size = 50) => {
        const response = await api.get<{ data: { content: ChatMessageResponse[] } }>(`/workspaces/${startupUuid}/chat/rooms/${roomUuid}/messages`, {
            params: { page, size }
        });
        return response.data.data.content || [];
    },

    searchMessages: async (startupUuid: string, roomUuid: string, query: string, filterType?: string, page = 0, size = 50) => {
        const params: any = { q: query, page, size };
        if (filterType && filterType !== 'ALL') {
            params.type = filterType;
        }
        const response = await api.get<{ data: { content: ChatMessageResponse[] } }>(`/workspaces/${startupUuid}/chat/rooms/${roomUuid}/messages/search`, {
            params
        });
        return response.data.data.content || [];
    },

    getOrCreatePrivateChat: async (startupUuid: string, targetUserUuid: string) => {
        const response = await api.post<{ data: ChatRoomResponse }>(`/workspaces/${startupUuid}/chat/private/${targetUserUuid}`);
        return response.data.data;
    },

    createGroup: async (startupUuid: string, name: string, description: string, memberUuids: string[]) => {
        const response = await api.post<{ data: ChatRoomResponse }>(`/workspaces/${startupUuid}/chat/groups`, { name, description, memberUuids });
        return response.data.data;
    },

    updateGroup: async (startupUuid: string, roomUuid: string, name: string, description: string, isArchived: boolean) => {
        const response = await api.put<{ data: ChatRoomResponse }>(`/workspaces/${startupUuid}/chat/groups/${roomUuid}`, { name, description, isArchived });
        return response.data.data;
    },

    uploadGroupIcon: async (startupUuid: string, roomUuid: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<{ data: ChatRoomResponse }>(`/workspaces/${startupUuid}/chat/groups/${roomUuid}/icon`, formData);
        return response.data.data;
    },

    removeGroupIcon: async (startupUuid: string, roomUuid: string) => {
        const response = await api.delete<{ data: ChatRoomResponse }>(`/workspaces/${startupUuid}/chat/groups/${roomUuid}/icon`);
        return response.data.data;
    },

    deleteGroup: async (startupUuid: string, roomUuid: string) => {
        await api.delete(`/workspaces/${startupUuid}/chat/groups/${roomUuid}`);
    },

    clearChatMessages: async (startupUuid: string, roomUuid: string) => {
        await api.delete(`/workspaces/${startupUuid}/chat/groups/${roomUuid}/messages`);
    },

    getRoomReceipts: async (startupUuid: string, roomUuid: string) => {
        const response = await api.get<{ data: ReadReceiptResponse[] }>(`/workspaces/${startupUuid}/chat/rooms/${roomUuid}/receipts`);
        return response.data.data;
    },

    markAsRead: async (startupUuid: string, roomUuid: string, messageUuid: string) => {
        const response = await api.post(`/workspaces/${startupUuid}/chat/rooms/${roomUuid}/read`, { messageUuid });
        return response.data;
    },

    togglePinMessage: async (startupUuid: string, roomUuid: string, messageUuid: string) => {
        const response = await api.put<{ data: ChatMessageResponse }>(`/workspaces/${startupUuid}/chat/rooms/${roomUuid}/messages/${messageUuid}/pin`);
        return response.data.data;
    },

    addGroupMember: async (startupUuid: string, roomUuid: string, targetUserUuid: string) => {
        await api.post(`/workspaces/${startupUuid}/chat/groups/${roomUuid}/members/${targetUserUuid}`);
    },

    removeGroupMember: async (startupUuid: string, roomUuid: string, targetUserUuid: string) => {
        await api.delete(`/workspaces/${startupUuid}/chat/groups/${roomUuid}/members/${targetUserUuid}`);
    },

    updateGroupMemberRole: async (startupUuid: string, roomUuid: string, targetUserUuid: string, role: string) => {
        await api.put(`/workspaces/${startupUuid}/chat/groups/${roomUuid}/members/${targetUserUuid}/role?role=${role}`);
    },
    
    sendMessageWithFiles: async (startupUuid: string, roomUuid: string, content: string, replyToMessageUuid: string | undefined, isVoiceNote: boolean, voiceNoteDuration: number | undefined, voiceNoteWaveform: string | undefined, files: File[], onUploadProgress?: (progressEvent: any) => void, abortSignal?: AbortSignal) => {
        const formData = new FormData();
        if (content) formData.append('content', content);
        if (replyToMessageUuid) formData.append('replyToMessageUuid', replyToMessageUuid);
        if (isVoiceNote) formData.append('isVoiceNote', 'true');
        if (voiceNoteDuration !== undefined) formData.append('voiceNoteDuration', voiceNoteDuration.toString());
        if (voiceNoteWaveform !== undefined) formData.append('voiceNoteWaveform', voiceNoteWaveform);
        files.forEach(file => formData.append('files', file));
        
        const response = await api.post<{ data: ChatMessageResponse }>(`/workspaces/${startupUuid}/chat/rooms/${roomUuid}/messages/with-files`, formData, {
            onUploadProgress,
            signal: abortSignal
        });
        return response.data.data;
    },
    
    getAttachments: async (startupUuid: string, roomUuid: string, type?: string) => {
        const params = type ? { type } : {};
        const response = await api.get<{ data: AttachmentResponse[] }>(`/workspaces/${startupUuid}/chat/rooms/${roomUuid}/attachments`, { params });
        return response.data.data;
    },
    
    logCall: async (workspaceId: string, request: CallLogRequest) => {
        const response = await api.post<CallLogResponse>(`/workspaces/${workspaceId}/calls`, request);
        return response.data;
    },
    
    getCallHistory: async (workspaceId: string, user1Id: string, user2Id: string) => {
        const response = await api.get<CallLogResponse[]>(`/workspaces/${workspaceId}/calls/user/${user1Id}/with/${user2Id}`);
        return response.data;
    }
};
