// @ts-nocheck
import { useEffect, useRef, useCallback } from 'react';
import { Client, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { queryClient } from '@/App';
import { callSignalEmitter } from '@/utils/callSignalEmitter';
import { dispatchNotification, dispatchChatNotification } from '@/utils/NotificationDispatcher';
import { useNotificationStore } from '@/store/useNotificationStore';
import { notificationService } from '@/services/notificationService';
import { chatService } from '@/services/chatService';


const _apiBase = import.meta.env.VITE_API_URL || 'http://localhost:1026/api/v1';
// If VITE_API_URL is absolute (production), derive the server root by stripping /api/v1.
// If it is relative (dev, using Vite proxy), produce '/ws' so the browser resolves it
// against the current origin and the Vite /ws proxy forwards it to localhost:1026.
const SOCKET_URL = _apiBase.startsWith('http')
  ? _apiBase.replace(/\/api\/v1\/?$/, '') + '/ws'
  : '/ws';

// Global singleton client
let globalStompClient: Client | null = null;
let globalIsConnected = false;
let connectionPromise: Promise<void> | null = null;
let connectionCount = 0;

export function useWebSocket(workspaceId?: string, roomUuid?: string) {
  const { user } = useAuthStore();
  const { isConnected, setConnectionStatus, addOrUpdateMessage, setTypingStatus, setOnlineStatus, setReadReceipt } = useChatStore();
  const subscriptions = useRef<Map<string, StompSubscription>>(new Map());

  // Function to ensure we have a connected client
  const ensureConnection = useCallback(async () => {
    const token = await window.Clerk?.session?.getToken();
    if (!token) return;
    
    if (globalStompClient && globalIsConnected) {
        return; // Already connected
    }

    if (connectionPromise) {
        await connectionPromise; // Wait for existing connection attempt
        return;
    }

    connectionPromise = new Promise((resolve) => {
        const client = new Client({
            webSocketFactory: () => new SockJS(SOCKET_URL),
            connectHeaders: { Authorization: `Bearer ${token}` },
            beforeConnect: () => {
                client.connectHeaders = {
                    Authorization: `Bearer ${token}`
                };
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            connectionCount++;
            globalIsConnected = true;
            setConnectionStatus(true);
            
            if (connectionCount > 1) {
                // Reconnected: invalidate stale caches automatically
                queryClient.invalidateQueries({ queryKey: ['workspace'] });
                queryClient.invalidateQueries({ queryKey: ['members'] });
                queryClient.invalidateQueries({ queryKey: ['chat'] });
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
                queryClient.invalidateQueries({ queryKey: ['startup-applications'] });
            }
            
            // Global Subscriptions (only once per connection)
            client.subscribe('/user/queue/workspace-updates', (message) => {
                try {
                    const body = JSON.parse(message.body);
                    switch (body.type) {
                        case 'REMOVED':
                            dispatchNotification('MEMBER_REMOVED', 'Workspace Updated', `You were removed from ${body.startupName || 'a workspace'}`, {
                                workspaceUuid: body.startupUuid,
                                actionUrl: '/app/dashboard'
                            });
                            window.dispatchEvent(new CustomEvent('workspace-removed', { detail: { startupUuid: body.startupUuid } }));
                            break;
                        case 'APPLICATION_RECEIVED':
                            dispatchNotification('APPLICATION_RECEIVED', 'New Application', `New talent application received for ${body.startupName}`, {
                                workspaceUuid: body.startupUuid,
                                workspaceName: body.startupName,
                                actionUrl: `/app/${body.startupUuid}/applications`
                            });
                            queryClient.invalidateQueries({ queryKey: ['startup-applications'] });
                            break;
                        case 'APPLICATION_STATUS_UPDATED':
                            dispatchNotification('APPLICATION_ACCEPTED', 'Application Update', `Your application status was updated to ${body.status}`, {
                                workspaceUuid: body.startupUuid,
                                workspaceName: body.startupName,
                                actionUrl: '/app/dashboard'
                            });
                            queryClient.invalidateQueries({ queryKey: ['startup-applications'] });
                            break;
                        case 'WORKSPACE_CREATED':
                        case 'WORKSPACE_UPDATED':
                            dispatchNotification('WORKSPACE_UPDATED', 'Workspace Update', `Workspace ${body.startupName || ''} was updated`, {
                                workspaceUuid: body.startupUuid,
                                workspaceName: body.startupName
                            });
                            queryClient.invalidateQueries({ queryKey: ['workspace'] });
                            break;
                        case 'NEW_JOB_OFFER':
                            dispatchNotification('NEW_JOB_OFFER', 'Job Offer Received', `${body.founderName} invited you to join ${body.startupName}`, {
                                actionUrl: '/app/talent/job-offers'
                            });
                            queryClient.invalidateQueries({ queryKey: ['job-offers'] });
                            break;
                        case 'JOB_OFFER_REJECTED':
                            dispatchNotification('JOB_OFFER_REJECTED', 'Job Offer Rejected', `${body.talentName} has declined your invitation to join ${body.startupName}`, {
                                actionUrl: '/app/founder/job-offers'
                            });
                            queryClient.invalidateQueries({ queryKey: ['job-offers'] });
                            break;
                        case 'ROOM_DELETED':
                            queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
                            break;
                    }
                } catch(e) { console.warn(e); }
            });
            
            client.subscribe('/user/queue/call', (message) => {
                try {
                    const body = JSON.parse(message.body);
                    if (body && body.type) {
                        callSignalEmitter.dispatchEvent(new CustomEvent('receive-signal', { detail: body }));
                    }
                } catch(e) { console.warn(e); }
            });

            // Dispatch global event so active hooks know to resubscribe
            window.dispatchEvent(new Event('stomp-connected'));

            resolve();
        };

        client.onStompError = (frame) => {
            console.warn('Broker reported error: ' + frame.headers['message']);
        };

        client.onDisconnect = () => {
            globalIsConnected = false;
            setConnectionStatus(false);
            connectionPromise = null;
        };

        client.activate();
        globalStompClient = client;
        (window as any).__stompClient = client;
    });

    await connectionPromise;
  }, [setConnectionStatus]);

  useEffect(() => {
    let mounted = true;

    const setupSubscriptions = async () => {
        await ensureConnection();
        if (!mounted || !globalStompClient || !globalIsConnected) return;

        // Fetch initial notifications
        if (user) {
            useNotificationStore.getState().fetchNotifications();
        }

        // Clear existing local subscriptions
        subscriptions.current.forEach(sub => sub.unsubscribe());
        subscriptions.current.clear();

        if (workspaceId) {
            const presenceSub = globalStompClient.subscribe(`/topic/workspace.${workspaceId}.presence`, (message) => {
                try {
                    const body = JSON.parse(message.body);
                    setOnlineStatus(body.userUuid, body.isOnline, body.lastSeen, body.status, body.inVoiceCall);
                } catch(e) { console.warn(e); }
            });
            subscriptions.current.set(`workspace_presence_${workspaceId}`, presenceSub);

            const roomsSub = globalStompClient.subscribe(`/topic/workspace.${workspaceId}.rooms`, (message) => {
                try {
                    const body = JSON.parse(message.body);
                    if (body.type === 'ROOM_CREATED' || body.type === 'ROOM_UPDATED' || body.type === 'ROOM_DELETED') {
                        queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
                    }
                } catch(e) { console.warn(e); }
            });
            subscriptions.current.set(`workspace_rooms_${workspaceId}`, roomsSub);
        }

        if (user) {
            const notifSub = globalStompClient.subscribe(`/topic/user.${user.uuid}.chat-notifications`, (message) => {
                try {
                    const body = JSON.parse(message.body);
                    const { activeRoomUuid, unreadCounts, setUnreadCount } = useChatStore.getState();
                    
                    if (activeRoomUuid !== body.roomUuid || !document.hasFocus()) {
                        setUnreadCount(body.roomUuid, (unreadCounts[body.roomUuid] || 0) + 1);
                        
                        // ALSO ADD THE MESSAGE TO THE STORE SO THE SIDEBAR UPDATES
                        const partialMsg: any = {
                            uuid: body.messageUuid,
                            roomUuid: body.roomUuid,
                            content: body.content,
                            senderName: body.senderName,
                            senderAvatarUrl: body.senderAvatar,
                            createdAt: body.createdAt,
                            statuses: [],
                            reactions: [],
                            isDeletedForMe: false
                        };
                        useChatStore.getState().addOrUpdateMessage(body.roomUuid, partialMsg);

                        dispatchChatNotification(body);
                    } else {
                        // WhatsApp-like: Mark as read immediately if we are in the room and focused
                        if (body.startupUuid && body.roomUuid && body.messageUuid) {
                            chatService.markAsRead(body.startupUuid, body.roomUuid, body.messageUuid).catch(console.error);
                        }
                    }
                } catch(e) { console.warn(e); }
            });
            subscriptions.current.set(`user_notif_${user.uuid}`, notifSub);
        }

        if (roomUuid && roomUuid !== 'undefined') {
            const sub = globalStompClient.subscribe(`/topic/room.${roomUuid}`, (message) => {
                try {
                    const body = JSON.parse(message.body);
                    switch (body.type) {
                        case 'typing':
                            useChatStore.getState().setTypingStatus(roomUuid, body.userUuid, body.name, body.isTyping);
                            break;
                        case 'activity':
                            useChatStore.getState().setActivityStatus(roomUuid, body.userUuid, body.name, body.activityType);
                            break;
                        case 'readReceipt':
                            setReadReceipt(roomUuid, body.userUuid, body.lastReadMessageUuid);
                            break;
                        case 'statusUpdate':
                            useChatStore.getState().handleStatusUpdate(roomUuid, body.messageUuid, body.userUuid, body.status, body.timestamp);
                            break;
                        case 'MEMBER_ADDED':
                            dispatchNotification('MEMBER_ADDED', 'Member Joined', `${body.name} joined the chat`, { roomUuid });
                            queryClient.invalidateQueries({ queryKey: ['members'] });
                            queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
                            break;
                        case 'MEMBER_REMOVED':
                            dispatchNotification('MEMBER_REMOVED', 'Member Left', `${body.name} left the chat`, { roomUuid });
                            queryClient.invalidateQueries({ queryKey: ['members'] });
                            queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
                            break;
                        case 'MEMBER_ROLE_UPDATED':
                            queryClient.invalidateQueries({ queryKey: ['members'] });
                            break;
                        case 'ROOM_UPDATED':
                            queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
                            break;
                        case 'WORKSPACE_UPDATED':
                            queryClient.invalidateQueries({ queryKey: ['workspace'] });
                            break;
                        default:
                            addOrUpdateMessage(roomUuid, body);
                            if (user && body.uuid && body.senderUuid && body.senderUuid !== user.uuid) {
                                // Send delivery receipt
                                if (globalStompClient?.connected) {
                                    globalStompClient.publish({
                                        destination: `/app/chat.messageDelivered/${roomUuid}`,
                                        body: JSON.stringify({ messageUuid: body.uuid })
                                    });
                                }
                                
                                // Send read receipt if room is active and focused
                                const { activeRoomUuid } = useChatStore.getState();
                                if (activeRoomUuid === roomUuid && document.hasFocus()) {
                                    if (globalStompClient?.connected) {
                                        globalStompClient.publish({
                                            destination: `/app/chat.markRead/${roomUuid}`,
                                            body: JSON.stringify({ messageUuid: body.uuid })
                                        });
                                    }
                                }
                            }
                            break;
                    }
                } catch(e) { console.warn(e); }
            });
            subscriptions.current.set(`room_${roomUuid}`, sub);
            
            const receiptSub = globalStompClient.subscribe(`/topic/workspace/${workspaceId}/room/${roomUuid}/receipts`, (message) => {
                try {
                    const body = JSON.parse(message.body);
                    setReadReceipt(roomUuid, body.userUuid, body.messageUuid);
                } catch(e) { console.warn(e); }
            });
            subscriptions.current.set(`receipt_${roomUuid}`, receiptSub);
        }
    };

    setupSubscriptions();
    
    // Listen for reconnections to restore active subscriptions
    window.addEventListener('stomp-connected', setupSubscriptions);

    const currentSubs = subscriptions.current;
    return () => {
        mounted = false;
        window.removeEventListener('stomp-connected', setupSubscriptions);
        currentSubs.forEach(sub => sub.unsubscribe());
        currentSubs.clear();
    };
  }, [ensureConnection, workspaceId, roomUuid, addOrUpdateMessage, setTypingStatus, setOnlineStatus, setReadReceipt, user]);

  const sendMessage = useCallback((roomId: string, content: string, replyToMessageUuid?: string, isVoiceNote: boolean = false, voiceNoteDuration: number = 0) => {
    const tempUuid = `temp-${Date.now()}-${crypto.randomUUID()}`;
    const { addOrUpdateMessage, setFailedMessage } = useChatStore.getState();
    const currentUser = useAuthStore.getState().user;
    
    // Add optimistic message
    if (currentUser) {
      addOrUpdateMessage(roomId, {
        uuid: tempUuid,
        content,
        senderUuid: currentUser.uuid,
        senderName: currentUser.fullName,
        senderAvatarUrl: currentUser.profileImage,
        isPinned: false,
        isDeleted: false,
        isDeletedForMe: false,
        isEdited: false,
        isVoiceNote,
        voiceNoteDuration,
        createdAt: new Date().toISOString(),
        replyToMessageUuid,
        reactions: [],
        attachments: [],
        status: 'sending'
      });
    }

    if (globalStompClient && globalIsConnected) {
      try {
        globalStompClient.publish({
          destination: `/app/chat.sendMessage/${roomId}`,
          body: JSON.stringify({ tempUuid, content, replyToMessageUuid, isVoiceNote, voiceNoteDuration })
        });
        
        // Timeout to mark as failed if no response received
        setTimeout(() => {
          const state = useChatStore.getState();
          const msgs = state.messages[roomId] || [];
          if (msgs.find(m => m.uuid === tempUuid)) {
            // If it's still here with tempUuid, it failed
            addOrUpdateMessage(roomId, {
              ...msgs.find(m => m.uuid === tempUuid)!,
              status: 'failed'
            });
            setFailedMessage(roomId, tempUuid);
          }
        }, 5000);
      } catch (err) {
        console.error("Failed to send message via WebSocket:", err);
        addOrUpdateMessage(roomId, { ...useChatStore.getState().messages[roomId]?.find(m => m.uuid === tempUuid)!, status: 'failed' } as any);
        setFailedMessage(roomId, tempUuid);
      }
    } else {
      addOrUpdateMessage(roomId, { ...useChatStore.getState().messages[roomId]?.find(m => m.uuid === tempUuid)!, status: 'failed' } as any);
      setFailedMessage(roomId, tempUuid);
    }
  }, []);

  const editMessage = useCallback((roomId: string, messageUuid: string, content: string) => {
    if (globalStompClient && globalIsConnected) {
      try {
        globalStompClient.publish({
          destination: `/app/chat.editMessage/${roomId}`,
          body: JSON.stringify({ messageUuid, content })
        });
      } catch (err) {
        console.error("Failed to edit message via WebSocket:", err);
      }
    }
  }, []);

  const markRead = useCallback((roomId: string, messageUuid: string) => {
    if (globalStompClient && globalIsConnected) {
      try {
        globalStompClient.publish({
          destination: `/app/chat.markRead/${roomId}`,
          body: JSON.stringify({ messageUuid })
        });
      } catch (err) {
        console.error("Failed to mark message as read via WebSocket:", err);
      }
    }
  }, []);

  const deleteMessage = useCallback((roomId: string, messageUuid: string, deleteForEveryone: boolean = true) => {
    if (globalStompClient && globalIsConnected) {
      try {
        globalStompClient.publish({
          destination: `/app/chat.deleteMessage/${roomId}`,
          body: JSON.stringify({ messageUuid, deleteForEveryone })
        });
      } catch (err) {
        console.error("Failed to delete message via WebSocket:", err);
      }
    }
  }, []);

  const reactMessage = useCallback((roomId: string, messageUuid: string, emoji: string) => {
    if (globalStompClient && globalIsConnected) {
      try {
        globalStompClient.publish({
          destination: `/app/chat.reactMessage/${roomId}`,
          body: JSON.stringify({ messageUuid, emoji })
        });
      } catch (err) {
        console.error("Failed to react to message via WebSocket:", err);
      }
    }
  }, []);

  const sendTyping = useCallback((roomId: string, isTyping: boolean) => {
    if (globalStompClient && globalIsConnected) {
      try {
        globalStompClient.publish({
          destination: `/app/chat.typing/${roomId}`,
          body: JSON.stringify({ isTyping })
        });
      } catch (err) {
        console.error("Failed to send typing status via WebSocket:", err);
      }
    }
  }, []);

  const pinMessage = useCallback((roomId: string, messageUuid: string, isPinned: boolean) => {
    if (globalStompClient && globalIsConnected) {
      globalStompClient.publish({
        destination: `/app/chat.pinMessage/${roomId}`,
        body: JSON.stringify({ messageUuid, isPinned })
      });
    }
  }, []);

  const sendGeneric = useCallback((destination: string, body: any) => {
    if (globalStompClient && globalIsConnected) {
      globalStompClient.publish({
        destination,
        body: typeof body === 'string' ? body : JSON.stringify(body)
      });
    }
  }, []);

  const sendCallSignal = useCallback((body: any) => {
    if (globalStompClient && globalIsConnected) {
      globalStompClient.publish({
        destination: '/app/call/signal',
        body: JSON.stringify(body)
      });
    }
  }, []);

  const subscribe = useCallback((topic: string, callback: (msg: any) => void) => {
    if (globalStompClient && globalIsConnected) {
      const sub = globalStompClient.subscribe(topic, callback);
      return () => sub.unsubscribe();
    }
    return () => {};
  }, []);

  const setPresenceStatus = useCallback((status: 'ONLINE' | 'BUSY') => {
    if (globalStompClient?.connected) {
      globalStompClient.publish({
        destination: `/app/presence/setStatus`,
        body: JSON.stringify({ status })
      });
    }
  }, []);

  const sendActivity = useCallback((roomId: string, type: 'TYPING' | 'RECORDING' | 'UPLOADING' | 'NONE') => {
    if (globalStompClient?.connected) {
      globalStompClient.publish({
        destination: `/app/chat.activity/${roomId}`,
        body: JSON.stringify({ type })
      });
    }
  }, []);

  return { isConnected, sendMessage, editMessage, deleteMessage, reactMessage, sendTyping, markRead, pinMessage, sendGeneric, sendCallSignal, subscribe, setPresenceStatus, sendActivity };
}
