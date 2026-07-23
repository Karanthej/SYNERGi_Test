import { useNotificationStore } from '@/store/useNotificationStore';
import type { NotificationType } from '@/store/useNotificationStore';
import { AudioEngine } from '@/utils/AudioEngine';
import type { ChatNotificationResponse } from '@/services/notificationService';

export const dispatchChatNotification = (dto: ChatNotificationResponse) => {
  const store = useNotificationStore.getState();
  if (dto.startupUuid && store.mutedWorkspaces.has(dto.startupUuid)) return;
  if (dto.roomUuid && store.mutedRooms.has(dto.roomUuid)) return;
  if (dto.senderName && store.mutedUsers.has(dto.senderName)) return;

  // Suppress if user is already in the same chat room
  const currentPath = window.location.pathname;
  const isSameRoom = dto.roomUuid && currentPath.includes(`/chat/${dto.roomUuid}`);
  if (isSameRoom) return;

  // Add to notification store (bell)
  store.addNotificationFromSocket(dto);

  // Play sound
  if (
    dto.notificationType === 'NEW_MESSAGE' ||
    dto.notificationType === 'REPLY' ||
    dto.notificationType === 'VOICE_NOTE' ||
    dto.notificationType === 'IMAGE' ||
    dto.notificationType === 'DOCUMENT'
  ) {
    AudioEngine.playMessageSound();
  } else if (dto.notificationType === 'MENTION') {
    AudioEngine.playMentionSound();
  }
};

export const dispatchNotification = (
  type: NotificationType,
  title: string,
  body: string,
  metadata?: {
    workspaceUuid?: string;
    workspaceName?: string;
    roomUuid?: string;
    senderName?: string;
    avatarUrl?: string;
    actionUrl?: string;
    role?: string;
    senderUuid?: string;
  }
) => {
  const store = useNotificationStore.getState();
  if (metadata?.workspaceUuid && store.mutedWorkspaces.has(metadata.workspaceUuid)) return;
  if (metadata?.roomUuid && store.mutedRooms.has(metadata.roomUuid)) return;
  if (metadata?.senderUuid && store.mutedUsers.has(metadata.senderUuid)) return;

  // Add to notification store (bell)
  store.addNotification({
    type,
    title,
    body,
    ...metadata,
  });

  // Play sound
  if (type === 'MESSAGE' || type === 'PRIVATE_MESSAGE' || type === 'REPLY') {
    AudioEngine.playMessageSound();
  } else if (type === 'MENTION') {
    AudioEngine.playMentionSound();
  }
};
