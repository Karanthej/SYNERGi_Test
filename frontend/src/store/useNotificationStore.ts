import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { notificationService } from '@/services/notificationService';
import type { ChatNotificationResponse } from '@/services/notificationService';
import { useAuthStore } from '@/store/useAuthStore';

export type NotificationType = 
  | 'MESSAGE' 
  | 'PRIVATE_MESSAGE' 
  | 'MENTION' 
  | 'REPLY' 
  | 'REACTION'
  | 'WORKSPACE_INVITATION' 
  | 'APPLICATION_RECEIVED' 
  | 'APPLICATION_ACCEPTED' 
  | 'APPLICATION_REJECTED' 
  | 'MEMBER_ADDED' 
  | 'MEMBER_REMOVED' 
  | 'WORKSPACE_UPDATED' 
  | 'ANNOUNCEMENT' 
  | 'INCOMING_CALL' 
  | 'MISSED_CALL' 
  | 'CALL_ENDED'
  | 'NEW_MESSAGE'
  | 'VOICE_NOTE'
  | 'IMAGE'
  | 'DOCUMENT'
  | 'GROUP_CREATED'
  | 'GROUP_RENAMED'
  | 'GROUP_DELETED'
  | 'JOB_OFFER_SENT'
  | 'JOB_OFFER_ACCEPTED'
  | 'JOB_OFFER_REJECTED'
  | 'APPLICATION_WITHDRAWN'
  | 'WORKSPACE_JOINED'
  | 'WORKSPACE_LEFT';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  avatarUrl?: string;
  senderName?: string;
  workspaceUuid?: string;
  workspaceName?: string;
  roomUuid?: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: any;
  roleBadge?: string;
  conversationName?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  dndMode: boolean;
  mutedWorkspaces: Set<string>;
  mutedRooms: Set<string>;
  mutedUsers: Set<string>;
  
  // Actions
  addNotification: (notification: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  addNotificationFromSocket: (dto: ChatNotificationResponse) => void;
  toggleDND: () => void;
  toggleMuteWorkspace: (workspaceUuid: string) => void;
  toggleMuteRoom: (roomUuid: string) => void;
  toggleMuteUser: (userUuid: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      dndMode: false,
      mutedWorkspaces: new Set(),
      mutedRooms: new Set(),
      mutedUsers: new Set(),

      addNotification: (notif) => {
        const { mutedWorkspaces, mutedRooms, mutedUsers } = get();
        
        // Check Mute states
        if (notif.workspaceUuid && mutedWorkspaces.has(notif.workspaceUuid)) return;
        if (notif.roomUuid && mutedRooms.has(notif.roomUuid)) return;
        if (notif.metadata?.senderUuid && mutedUsers.has(notif.metadata.senderUuid)) return;

        const newNotif: AppNotification = {
          ...notif,
          id: `local-${crypto.randomUUID()}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          notifications: [newNotif, ...state.notifications].slice(0, 500) // Keep max 500
        }));
      },

      fetchNotifications: async () => {
        try {
          const dtos = await notificationService.getNotifications();
          const role = useAuthStore.getState().user?.role?.toLowerCase() || 'talent';
          const mapped: AppNotification[] = dtos.map(dto => {
            const actionUrl = (dto.actionData && dto.actionData.startsWith('/'))
              ? dto.actionData
              : dto.startupUuid && dto.roomUuid
                ? `/${role}/workspace/${dto.startupUuid}/chat/${dto.roomUuid}`
                : dto.startupUuid
                ? `/${role}/workspace/${dto.startupUuid}/chat`
                : undefined;
            return {
              id: dto.uuid || dto.messageUuid || `local-${crypto.randomUUID()}`,
              type: dto.notificationType as NotificationType,
              title: dto.notificationType.replace('_', ' '),
              body: dto.content || '',
              avatarUrl: dto.senderAvatar,
              senderName: dto.senderName,
              workspaceUuid: dto.startupUuid,
              workspaceName: dto.startupName,
              roomUuid: dto.roomUuid,
              isRead: dto.isRead,
              createdAt: dto.createdAt,
              roleBadge: dto.roleBadge,
              conversationName: dto.conversationName,
              actionUrl,
              metadata: { senderUuid: dto.senderName, messageUuid: dto.messageUuid },
            };
          });
          set({ notifications: mapped });
        } catch (error) {
          console.error("Failed to fetch notifications", error);
        }
      },

      addNotificationFromSocket: (dto: ChatNotificationResponse) => {
        const { mutedWorkspaces, mutedRooms } = get();
        if (dto.startupUuid && mutedWorkspaces.has(dto.startupUuid)) return;
        if (dto.roomUuid && mutedRooms.has(dto.roomUuid)) return;

        const role = useAuthStore.getState().user?.role?.toLowerCase() || 'talent';
        const actionUrl = (dto.actionData && dto.actionData.startsWith('/'))
          ? dto.actionData
          : dto.startupUuid && dto.roomUuid
            ? `/${role}/workspace/${dto.startupUuid}/chat/${dto.roomUuid}`
            : dto.startupUuid
            ? `/${role}/workspace/${dto.startupUuid}/chat`
            : undefined;
        
        const newNotif: AppNotification = {
          id: dto.uuid || dto.messageUuid || `local-${crypto.randomUUID()}`,
          type: dto.notificationType as NotificationType,
          title: dto.notificationType.replace('_', ' '),
          body: dto.content || '',
          avatarUrl: dto.senderAvatar,
          senderName: dto.senderName,
          workspaceUuid: dto.startupUuid,
          workspaceName: dto.startupName,
          roomUuid: dto.roomUuid,
          isRead: dto.isRead,
          createdAt: dto.createdAt,
          roleBadge: dto.roleBadge,
          conversationName: dto.conversationName,
          actionUrl,
          metadata: { messageUuid: dto.messageUuid },
        };
        
        set((state) => {
            // Avoid duplicates
            if (state.notifications.some(n => n.id === newNotif.id)) return state;
            return { notifications: [newNotif, ...state.notifications].slice(0, 500) };
        });
      },

      markAsRead: async (id) => {
        set((state) => ({
          notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
        }));
        if (id.startsWith('local-')) return;
        try {
            await notificationService.markAsRead(id);
        } catch(e) {}
      },

      markAllAsRead: async () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, isRead: true }))
        }));
        try {
            await notificationService.markAllAsRead();
        } catch(e) {}
      },

      deleteNotification: async (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
        if (id.startsWith('local-')) return;
        try {
            await notificationService.deleteNotification(id);
        } catch(e) {}
      },

      clearAll: async () => {
        set({ notifications: [] });
      },

      toggleDND: () => set((state) => ({ dndMode: !state.dndMode })),

      toggleMuteWorkspace: (workspaceUuid) => set((state) => {
        const newSet = new Set(state.mutedWorkspaces);
        if (newSet.has(workspaceUuid)) newSet.delete(workspaceUuid);
        else newSet.add(workspaceUuid);
        return { mutedWorkspaces: newSet };
      }),

      toggleMuteRoom: (roomUuid) => set((state) => {
        const newSet = new Set(state.mutedRooms);
        if (newSet.has(roomUuid)) newSet.delete(roomUuid);
        else newSet.add(roomUuid);
        return { mutedRooms: newSet };
      }),

      toggleMuteUser: (userUuid) => set((state) => {
        const newSet = new Set(state.mutedUsers);
        if (newSet.has(userUuid)) newSet.delete(userUuid);
        else newSet.add(userUuid);
        return { mutedUsers: newSet };
      })
    }),
    {
      name: 'synergi-notifications-settings',
      partialize: (state) => ({ 
        dndMode: state.dndMode,
        mutedWorkspaces: Array.from(state.mutedWorkspaces),
        mutedRooms: Array.from(state.mutedRooms),
        mutedUsers: Array.from(state.mutedUsers),
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        mutedWorkspaces: new Set(persistedState?.mutedWorkspaces || []),
        mutedRooms: new Set(persistedState?.mutedRooms || []),
        mutedUsers: new Set(persistedState?.mutedUsers || []),
      })
    }
  )
);
