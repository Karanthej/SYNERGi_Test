import { create } from 'zustand';
import type { ChatMessageResponse } from '@/services/chatService';

// interface TypingUser {
//   userUuid: string;
//   name: string;
// }

interface OnlineUser {
  isOnline: boolean;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  inVoiceCall: boolean;
  lastSeen: string;
}

interface RoomActivity {
  userUuid: string;
  name: string;
  type: 'TYPING' | 'RECORDING' | 'UPLOADING' | 'NONE';
}

interface ChatState {
  messages: Record<string, ChatMessageResponse[]>; // Keyed by room UUID
  activeRoomUuid: string | null;
  isConnected: boolean;
  roomActivities: Record<string, RoomActivity[]>; // Keyed by room UUID
  typingUsers: Record<string, any[]>;
  unreadCounts: Record<string, number>;
  readReceipts: Record<string, Record<string, string>>; // roomUuid -> userUuid -> messageUuid
  onlineStatuses: Record<string, OnlineUser>; // Keyed by user UUID
  
  replyingTo: Record<string, ChatMessageResponse | null>; // Keyed by room UUID
  failedMessages: Record<string, Set<string>>; // Keyed by room UUID, set of message UUIDs
  
  setActiveRoom: (uuid: string) => void;
  setConnectionStatus: (status: boolean) => void;
  addOrUpdateMessage: (roomUuid: any, message: ChatMessageResponse) => void;
  setMessages: (roomUuid: any, messages: ChatMessageResponse[]) => void;
  prependMessages: (roomUuid: any, messages: ChatMessageResponse[]) => void;
  clearMessages: (roomUuid: any) => void;
  setActivityStatus: (roomUuid: any, userUuid: string, name: string, activityType: 'TYPING' | 'RECORDING' | 'UPLOADING' | 'NONE') => void;
  clearActivityStatus: (roomUuid: any) => void;
  setTypingStatus: (roomUuid: any, userUuid: string, name: string, isTyping: boolean) => void;
  setUnreadCount: (roomUuid: any, count: number) => void;
  incrementUnreadCount: (roomUuid: any) => void;
  resetUnreadCount: (roomUuid: any) => void;
  setReadReceipt: (roomUuid: any, userUuid: string, messageUuid: string) => void;
  handleStatusUpdate: (roomUuid: any, messageUuid: string, userUuid: string, statusType: 'DELIVERED' | 'READ', timestamp: string) => void;
  setOnlineStatus: (userUuid: string, isOnline: boolean, lastSeen: string, status?: string, inVoiceCall?: boolean) => void;
  
  setReplyingTo: (roomUuid: any, message: ChatMessageResponse | null) => void;
  setFailedMessage: (roomUuid: any, messageUuid: string) => void;
  clearFailedMessage: (roomUuid: any, messageUuid: string) => void;
  updateMessageProgress: (roomUuid: any, messageUuid: string, progress: number, isUploading?: boolean, isFailed?: boolean) => void;
  removeMessage: (roomUuid: any, messageUuid: string) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: {},
  activeRoomUuid: null,
  isConnected: false,
  roomActivities: {},
  typingUsers: {}, // fallback
  unreadCounts: {},
  readReceipts: {},
  onlineStatuses: {},
  replyingTo: {},
  failedMessages: {},

  setActiveRoom: (uuid) => set({ activeRoomUuid: uuid }),
  
  setConnectionStatus: (status) => set({ isConnected: status }),

  addOrUpdateMessage: (roomUuid: any, message) => set((state) => {
    if (!message || !message.uuid) return state; // Defense-in-depth against stray non-message payloads
    const roomMsgs = state.messages[roomUuid] || [];
    let index = roomMsgs.findIndex(m => m.uuid === message.uuid);
    
    // If the message came from backend and has a tempUuid, replace the optimistic message
    if (index === -1 && (message as any).tempUuid) {
      index = roomMsgs.findIndex(m => m.uuid === (message as any).tempUuid);
    }
    
    let newMsgs;
    if (index >= 0) {
      // Update existing message (edit, delete, reaction, or replacing optimistic message)
      newMsgs = [...roomMsgs];
      newMsgs[index] = { ...newMsgs[index], ...message, status: 'sent' } as ChatMessageResponse;
    } else {
      // Add new message
      newMsgs = [...roomMsgs, { ...message, status: 'sent' } as ChatMessageResponse];
    }
    
    // Update unread count if it's a new message in an inactive room or unfocused
    const isNew = index === -1;
    const isInactiveRoom = state.activeRoomUuid !== roomUuid || !document.hasFocus();
    const unreadCounts = { ...state.unreadCounts };
    if (isNew && isInactiveRoom) {
      unreadCounts[roomUuid] = (unreadCounts[roomUuid] || 0) + 1;
    }
    
    return {
      messages: { ...state.messages, [roomUuid]: newMsgs },
      unreadCounts
    };
  }),

  updateMessageProgress: (roomUuid, messageUuid, progress, isUploading = true, isFailed = false) => set((state) => {
    const roomMsgs = state.messages[roomUuid] || [];
    const index = roomMsgs.findIndex(m => m.uuid === messageUuid);
    if (index === -1) return state;
    
    const newMsgs = [...roomMsgs];
    newMsgs[index] = { ...newMsgs[index], uploadProgress: progress, isUploading, isFailed } as ChatMessageResponse;
    return { messages: { ...state.messages, [roomUuid]: newMsgs } };
  }),

  removeMessage: (roomUuid, messageUuid) => set((state) => {
    const roomMsgs = state.messages[roomUuid] || [];
    const newMsgs = roomMsgs.filter(m => m.uuid !== messageUuid);
    return { messages: { ...state.messages, [roomUuid]: newMsgs } };
  }),

  setMessages: (roomUuid, newMessages) => set((state) => ({
    messages: {
      ...state.messages,
      [roomUuid]: [...newMessages].filter(m => !m.isDeletedForMe).reverse(),
    }
  })),

  prependMessages: (roomUuid, olderMessages) => set((state) => {
    const currentMsgs = state.messages[roomUuid] || [];
    // Only prepend messages we don't already have
    const existingUuids = new Set(currentMsgs.map(m => m.uuid));
    const newUnique = olderMessages.filter(m => !existingUuids.has(m.uuid) && !m.isDeletedForMe).reverse();
    return {
      messages: {
        ...state.messages,
        [roomUuid]: [...newUnique, ...currentMsgs],
      }
    };
  }),

  clearMessages: (roomUuid) => set((state) => {
    const newMessages = { ...state.messages };
    delete newMessages[roomUuid];
    return { messages: newMessages };
  }),

  setTypingStatus: (roomUuid, userUuid, name, isTyping) => set((state) => {
    // Forward to setActivityStatus
    const activityType = isTyping ? 'TYPING' : 'NONE';
    const roomAct = state.roomActivities[roomUuid] || [];
    let newAct = [...roomAct];
    
    if (activityType !== 'NONE') {
      const existing = newAct.find(u => u.userUuid === userUuid);
      if (existing) {
        existing.type = activityType;
      } else {
        newAct.push({ userUuid, name, type: activityType });
      }
    } else {
      newAct = newAct.filter(u => u.userUuid !== userUuid);
    }
    
    return {
      roomActivities: { ...state.roomActivities, [roomUuid]: newAct }
    };
  }),

  setActivityStatus: (roomUuid, userUuid, name, activityType) => set((state) => {
    const roomAct = state.roomActivities[roomUuid] || [];
    let newAct = [...roomAct];
    
    if (activityType !== 'NONE') {
      const existing = newAct.find(u => u.userUuid === userUuid);
      if (existing) {
        existing.type = activityType;
      } else {
        newAct.push({ userUuid, name, type: activityType });
      }
    } else {
      newAct = newAct.filter(u => u.userUuid !== userUuid);
    }
    
    return {
      roomActivities: { ...state.roomActivities, [roomUuid]: newAct }
    };
  }),

  clearActivityStatus: (roomUuid: any) => set((state) => ({
    roomActivities: { ...state.roomActivities, [roomUuid]: [] }
  })),

  clearTypingStatus: (roomUuid: any) => set((state) => ({
    roomActivities: { ...state.roomActivities, [roomUuid]: [] }
  })),

  setUnreadCount: (roomUuid: any, count: any) => set((state) => ({
    unreadCounts: { ...state.unreadCounts, [roomUuid]: count }
  })),

  incrementUnreadCount: (roomUuid: any) => set((state) => ({
    unreadCounts: { ...state.unreadCounts, [roomUuid]: (state.unreadCounts[roomUuid] || 0) + 1 }
  })),

  resetUnreadCount: (roomUuid: any) => set((state) => ({
    unreadCounts: { ...state.unreadCounts, [roomUuid]: 0 }
  })),

  setReadReceipt: (roomUuid, userUuid, messageUuid) => set((state) => {
    const roomReceipts = state.readReceipts[roomUuid] || {};
    return {
      readReceipts: {
        ...state.readReceipts,
        [roomUuid]: {
          ...roomReceipts,
          [userUuid]: messageUuid
        }
      }
    };
  }),

  handleStatusUpdate: (roomUuid, messageUuid, userUuid, statusType, timestamp) => set((state) => {
    const roomMsgs = state.messages[roomUuid] || [];
    const msgIndex = roomMsgs.findIndex(m => m.uuid === messageUuid);
    if (msgIndex === -1) return state;

    const newMsgs = [...roomMsgs];
    const msg = { ...newMsgs[msgIndex] };
    const statuses = msg.statuses ? [...msg.statuses] : [];
    const statusIndex = statuses.findIndex(s => s.userUuid === userUuid);

    if (statusIndex >= 0) {
      if (statusType === 'DELIVERED') {
        statuses[statusIndex] = { ...statuses[statusIndex], deliveredAt: timestamp };
      } else if (statusType === 'READ') {
        statuses[statusIndex] = { ...statuses[statusIndex], readAt: timestamp };
      }
    } else {
      statuses.push({
        userUuid,
        deliveredAt: statusType === 'DELIVERED' ? timestamp : null,
        readAt: statusType === 'READ' ? timestamp : null
      });
    }

    msg.statuses = statuses;
    newMsgs[msgIndex] = msg as ChatMessageResponse;

    return {
      messages: {
        ...state.messages,
        [roomUuid]: newMsgs
      }
    };
  }),

  setOnlineStatus: (userUuid, isOnline, lastSeen, status = 'ONLINE', inVoiceCall = false) => set((state) => ({
    onlineStatuses: {
      ...state.onlineStatuses,
      [userUuid]: { 
        isOnline, 
        lastSeen, 
        status: status as any,
        inVoiceCall 
      }
    }
  })),
  
  setReplyingTo: (roomUuid: any, message: ChatMessageResponse | null) => set((state) => ({
    replyingTo: { ...state.replyingTo, [roomUuid]: message }
  })),

  setFailedMessage: (roomUuid: any, messageUuid: string) => set((state) => {
    const failedSet = new Set(state.failedMessages[roomUuid] || []);
    failedSet.add(messageUuid);
    return { failedMessages: { ...state.failedMessages, [roomUuid]: failedSet } };
  }),
  
  clearFailedMessage: (roomUuid: any, messageUuid: string) => set((state) => {
    const failedSet = new Set(state.failedMessages[roomUuid] || []);
    failedSet.delete(messageUuid);
    return { failedMessages: { ...state.failedMessages, [roomUuid]: failedSet } };
  }),
}));
