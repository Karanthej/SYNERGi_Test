import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { chatService, type ChatRoomResponse } from '@/services/chatService';
import { workspaceService } from '@/services/workspaceService';
import { useChatStore } from '@/store/useChatStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { 
  Search, Hash, Phone, MessageSquare, 
  Plus, MoreVertical
} from 'lucide-react';
import { CallOverlay } from '@/components/chat/CallOverlay';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { TeamChatSidebar } from '@/components/chat/TeamChatSidebar';
import { ChatSearchSidebar } from '@/components/chat/ChatSearchSidebar';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallStore } from '@/store/useCallStore';
import { getImageUrl } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/App';
import { apiClient } from '@/lib/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { GroupSettingsModal } from '@/components/chat/GroupSettingsModal';
import { ForwardMessageModal } from '@/components/chat/ForwardMessageModal';
import { MessageInfoModal } from '@/components/chat/MessageInfoModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Loader2 } from 'lucide-react';
export default function TeamChat() {
  const { id: workspaceId, roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { messages, setMessages, setActiveRoom: setStoreActiveRoom, onlineStatuses, readReceipts, typingUsers, replyingTo, setReplyingTo, unreadCounts, roomActivities, resetUnreadCount } = useChatStore();
  const { uiMode, setChatSidebarAvailable } = useCallStore();

  useEffect(() => {
    setChatSidebarAvailable(true);
    return () => setChatSidebarAvailable(false);
  }, [setChatSidebarAvailable]);
  const { sendMessage, editMessage, deleteMessage, pinMessage, markRead, reactMessage, sendActivity } = useWebSocket(workspaceId, roomId);
  const { initiateCall } = useCallStore();
  
  const [activeRoom, setActiveRoom] = useState<ChatRoomResponse | null>(null);
  const roomMessages = roomId ? (messages[roomId] || []) : [];
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isGroupSettingsModalOpen, setIsGroupSettingsModalOpen] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<any>(null);
  const [infoMessage, setInfoMessage] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'Direct Messages' | 'Groups'>('All');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMemberUuids, setSelectedMemberUuids] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [activeTab] = useState<'chats' | 'calls'>('chats');
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  const [isSearchSidebarOpen, setIsSearchSidebarOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  
  const [editingMessage, setEditingMessage] = useState<any>(null);
  
  const { data: rooms = [] } = useQuery({
    queryKey: ['chat-rooms', workspaceId],
    queryFn: () => workspaceId ? chatService.getRooms(workspaceId) : Promise.resolve([]),
    enabled: !!workspaceId
  });

  const { data: workspaceMembers = [] } = useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => workspaceId ? workspaceService.getWorkspaceMembers(workspaceId) : Promise.resolve([]),
    enabled: !!workspaceId
  });

  const { data: callLogs = [] } = useQuery({
    queryKey: ['call-logs', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await apiClient.get(`/workspaces/${workspaceId}/calls`);
      return res.data?.data || [];
    },
    enabled: !!workspaceId && activeTab === 'calls'
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const otherMemberUuid = activeRoom?.type === 'PRIVATE' ? (activeRoom as any).otherMemberUuid : null;
  const lastReadMsgUuid = otherMemberUuid && roomId ? readReceipts[roomId]?.[otherMemberUuid] : null;
  const lastReadIndex = roomMessages.findIndex(m => m.uuid === lastReadMsgUuid);

  // IntersectionObserver for marking as read
  useEffect(() => {
    if (!roomId || !user) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const msgUuid = entry.target.getAttribute('data-message-uuid');
            const msgSenderUuid = entry.target.getAttribute('data-sender-uuid');
            if (msgUuid && msgSenderUuid && msgSenderUuid !== user.uuid) {
              markRead(roomId, msgUuid);
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const messageElements = document.querySelectorAll('.chat-message-bubble');
    messageElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [roomMessages, roomId, user, markRead]);

  // Fetched data is handled by React Query now.

  // Load specific room details and messages when roomId changes
  useEffect(() => {
    if (workspaceId && roomId) {
      loadRoomAndMessages(workspaceId, roomId);
    }
  }, [workspaceId, roomId]);

  const rowVirtualizer = useVirtualizer({
    count: roomMessages.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 60, // approximate height of a message
    overscan: 20,
    getItemKey: (index) => roomMessages[index]?.tempUuid || roomMessages[index]?.uuid || index,
  });

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMsgCount, setNewMsgCount] = useState(0);

  useEffect(() => {
    if (scrollRef.current && isAtBottom) {
      rowVirtualizer.scrollToIndex(roomMessages.length - 1, { align: 'end' });
    } else if (!isAtBottom) {
      setNewMsgCount(prev => prev + 1);
    }
  }, [roomMessages.length]);

  // WhatsApp-like: Mark as read when window regains focus on the active chat
  useEffect(() => {
    const handleFocus = () => {
      if (roomId && workspaceId && roomMessages.length > 0) {
        const unread = unreadCounts[roomId] || 0;
        if (unread > 0) {
          const latestMsg = roomMessages.reduce((latest, current) => {
            return new Date(current.createdAt).getTime() > new Date(latest.createdAt).getTime() ? current : latest;
          }, roomMessages[0]);
          if (latestMsg && latestMsg.uuid && !latestMsg.uuid.startsWith('temp-')) {
            chatService.markAsRead(workspaceId, roomId, latestMsg.uuid).catch(console.error);
            resetUnreadCount(roomId);
          }
        }
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [roomId, workspaceId, roomMessages, unreadCounts, resetUnreadCount]);


  const loadRoomAndMessages = useCallback(async (wId: string, rId: string) => {
    setIsLoadingMessages(true);
    try {
      const [room, members] = await Promise.all([
        chatService.getRoomInfo(wId, rId),
        chatService.getRoomMembers(wId, rId).catch(() => [])
      ]);
      
      if (room.type === 'PRIVATE' && user) {
        // Since backend provides the correct fields directly via getRoomInfo now, we do not need to patch these manually.
        const otherMember = members.find(m => m.userUuid !== user.uuid);
        if (otherMember) {
          (room as any).isOnline = otherMember.isOnline;
          (room as any).otherMemberUuid = otherMember.userUuid;
        }
      }
      
      setActiveRoom(room);
      setStoreActiveRoom(rId);
      resetUnreadCount(rId);
      setPage(0);
      setHasMore(true);
      const fetchedMsgs = await chatService.getMessages(wId, rId, 0, 50);
      setHasMore(fetchedMsgs.length === 50);
      setMessages(rId, fetchedMsgs);
      
      // WhatsApp-like: Mark the latest message as read in the backend
      if (fetchedMsgs.length > 0) {
        const latestMsg = fetchedMsgs.reduce((latest, current) => {
          return new Date(current.createdAt).getTime() > new Date(latest.createdAt).getTime() ? current : latest;
        }, fetchedMsgs[0]);
        if (latestMsg) {
          chatService.markAsRead(wId, rId, latestMsg.uuid).catch(console.error);
        }
      }

      setIsLoadingMessages(false);
    } catch (err) {
      console.error("Failed to load room details:", err);
      toast.error("Failed to load chat room. Please check your connection.");
      // We explicitly DO NOT navigate away here.
      // During voice call acceptance, the browser's native permission prompt can 
      // throttle background network requests, causing this fetch to timeout.
      // Forcing navigation causes the user to lose their currently selected conversation.
    } finally {
      setIsLoadingMessages(false);
    }
  }, [setStoreActiveRoom, setMessages, user, navigate]);

  const fetchPreviousPage = useCallback(async () => {
    if (!roomId || !workspaceId || isFetchingMore || !hasMore || isLoadingMessages) return;
    setIsFetchingMore(true);
    try {
      const nextPage = page + 1;
      const fetchedMsgs = await chatService.getMessages(workspaceId, roomId, nextPage, 50);
      if (fetchedMsgs.length < 50) {
        setHasMore(false);
      }
      setPage(nextPage);
      if (fetchedMsgs.length > 0) {
        // Prepend to store
        useChatStore.getState().prependMessages(roomId, fetchedMsgs);
      }
    } catch (err) {
      toast.error("Failed to load older messages.");
    } finally {
      setIsFetchingMore(false);
    }
  }, [roomId, workspaceId, page, hasMore, isFetchingMore, isLoadingMessages]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const bottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;
    setIsAtBottom(bottom);
    if (bottom) setNewMsgCount(0);

    if (target.scrollTop < 100) {
      fetchPreviousPage();
    }
  }, [fetchPreviousPage]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F for Search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchSidebarOpen(true);
      }
      // Esc to close sidebar/modals
      if (e.key === 'Escape') {
        setIsSearchSidebarOpen(false);
        setEditingMessage(null);
        setInfoMessage(null);
        setForwardMessage(null);
      }
      // ArrowUp to edit last message
      if (e.key === 'ArrowUp' && !editingMessage && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
        const lastMyMsg = [...roomMessages].reverse().find(m => m.senderUuid === user?.uuid && !m.isDeleted);
        if (lastMyMsg) {
          e.preventDefault();
          setEditingMessage(lastMyMsg);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roomMessages, user, editingMessage]);

  const scrollToBottom = useCallback(() => {
    rowVirtualizer.scrollToIndex(roomMessages.length - 1, { align: 'end' });
    setNewMsgCount(0);
    setIsAtBottom(true);
  }, [rowVirtualizer, roomMessages.length]);

  const handleSendMessage = useCallback((text: string) => {
    if (!roomId || !user) return;
    
    if (editingMessage) {
      editMessage(roomId, editingMessage.uuid, text);
      setEditingMessage(null);
      return;
    }

    const replyTarget = replyingTo[roomId];
    
    sendMessage(roomId, text, replyTarget?.uuid);
    setReplyingTo(roomId, null);
    
    // Ensure we are at the bottom so the incoming broadcast auto-scrolls
    setIsAtBottom(true);
    setNewMsgCount(0);
  }, [roomId, user, replyingTo, sendMessage, setReplyingTo, editingMessage, editMessage]);

  const handleActivity = useCallback((activity: 'TYPING' | 'RECORDING' | 'UPLOADING' | 'NONE') => {
    if (roomId && user) sendActivity(roomId, activity);
  }, [roomId, user, sendActivity]);

  const handleSendVoice = useCallback(async (file: File, duration: number, waveform: string) => {
    if (!roomId || !workspaceId || !user) return;
    
    // Optimistic UI for voice notes could be complex due to file URLs, 
    // but we can send it directly through the chatService.
    try {
      await chatService.sendMessageWithFiles(
        workspaceId,
        roomId,
        '', // empty content for voice notes
        replyingTo[roomId]?.uuid,
        true, // isVoiceNote
        duration,
        waveform,
        [file]
      );
      
      setReplyingTo(roomId, null);
      setIsAtBottom(true);
      setNewMsgCount(0);
      
      // Usually, the WebSocket will broadcast the new message down to all clients.
      // In case we want to immediately push it to the local store:
      // setMessages(roomId, [...roomMessages, response]); // The websocket should handle this to prevent duplicates
    } catch (err) {
      console.error("Failed to send voice note:", err);
      toast.error("Failed to send voice note");
    }
  }, [roomId, workspaceId, user, replyingTo, setReplyingTo]);

  const { addOrUpdateMessage, updateMessageProgress } = useChatStore();

  const handleSendFiles = useCallback(async (text: string, files: File[]) => {
    if (!roomId || !workspaceId || !user) return;
    
    const tempUuid = 'temp-' + Date.now().toString();
    const abortController = new AbortController();

    // Create Optimistic Message
    const optimisticMessage: any = {
      uuid: tempUuid,
      tempUuid: tempUuid,
      content: text,
      senderUuid: user.uuid,
      senderName: user.fullName,
      senderAvatarUrl: (user as any).avatarUrl,
      isPinned: false,
      isDeleted: false,
      isDeletedForMe: false,
      isEdited: false,
      isVoiceNote: false,
      createdAt: new Date().toISOString(),
      reactions: [],
      statuses: [],
      attachments: files.map(f => ({
        uuid: `temp-att-${crypto.randomUUID()}`,
        fileUrl: URL.createObjectURL(f),
        fileName: f.name,
        fileType: f.type,
        fileSize: f.size
      })),
      isUploading: true,
      uploadProgress: 0,
      abortController
    };

    addOrUpdateMessage(roomId, optimisticMessage);
    setIsAtBottom(true);

    try {
      const response = await chatService.sendMessageWithFiles(
        workspaceId,
        roomId,
        text,
        replyingTo[roomId]?.uuid,
        false,
        undefined,
        undefined,
        files,
        (progressEvent) => {
          const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0;
          updateMessageProgress(roomId, tempUuid, progress, true, false);
        },
        abortController.signal
      );
      
      // Update with the real response from the backend (broadcast handles this, but let's just make sure it's not 'uploading' anymore)
      addOrUpdateMessage(roomId, response);
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.message === 'canceled') {
        // Handled by cancel
        useChatStore.getState().removeMessage(roomId, tempUuid);
      } else {
        console.error("Failed to send files:", err);
        updateMessageProgress(roomId, tempUuid, 0, false, true);
        toast.error("Failed to upload files");
      }
    }
  }, [roomId, workspaceId, user, replyingTo, addOrUpdateMessage, updateMessageProgress]);

  const handleCancelReply = useCallback(() => {
    if (roomId) setReplyingTo(roomId, null);
  }, [roomId, setReplyingTo]);
  
  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
  }, []);

  const [messageToDelete, setMessageToDelete] = useState<any>(null);
  
  const confirmDelete = useCallback((deleteForEveryone: boolean) => {
    if (messageToDelete && roomId) {
      deleteMessage(roomId, messageToDelete.uuid, deleteForEveryone);
      setMessageToDelete(null);
    }
  }, [messageToDelete, roomId, deleteMessage]);






  const handleCall = useCallback((_type?: 'AUDIO' | 'VIDEO') => {
    if (!activeRoom) return;
    
    if (!workspaceId || !initiateCall) {
      toast.error("Call service unavailable.");
      return;
    }
    
    if (activeRoom.type === 'PRIVATE') {
      let targetUuid = otherMemberUuid;
      let targetName = (activeRoom as any).otherMemberName || activeRoom.name;
      let targetAvatar = (activeRoom as any).otherMemberAvatarUrl;
      
      if (!targetUuid) {
        // Fallback: search workspace members by activeRoom name
        const fallbackMember = workspaceMembers.find((m: any) => m.fullName === activeRoom.name);
        if (fallbackMember) {
          targetUuid = fallbackMember.userUuid;
          targetName = fallbackMember.fullName;
          targetAvatar = fallbackMember.avatarUrl;
        }
      }

      if (!targetUuid) {
        toast.error("Could not find the other user to call.");
        return;
      }
      
      initiateCall({
        uuid: targetUuid,
        name: targetName,
        profileUrl: targetAvatar
      }, workspaceId);
    } else {
      toast.info("Group calls are coming soon!");
    }
  }, [activeRoom, workspaceId, initiateCall, workspaceMembers]);

  const filteredItems = useMemo(() => {
    let items: any[] = [];

    const membersList = workspaceMembers
      .filter((m: any) => m.userUuid !== user?.uuid)
      .map((m: any) => {
        const existingRoom = rooms.find(r => r.type === 'PRIVATE' && (r as any).otherMemberUuid === m.userUuid);
        const roomMsgs = existingRoom ? messages[existingRoom.uuid] : [];
        const lastMsg = roomMsgs && roomMsgs.length > 0 ? roomMsgs[roomMsgs.length - 1] : null;
        const typing = existingRoom ? typingUsers[existingRoom.uuid] : [];
        
        let desc = existingRoom ? "Start chatting now..." : "Click to start chat";
        if (typing && typing.length > 0) {
            desc = 'Typing...';
        } else if (lastMsg) {
            if (lastMsg.content?.startsWith('$$CALL_LOG$$')) {
                const parts = lastMsg.content.split('|');
                const status = parts[1];
                desc = (status === 'MISSED' || status === 'REJECTED') ? '📞 Missed Call' : '📞 Call Ended';
            } else {
                desc = lastMsg.isVoiceNote ? '🎤 Voice Note' : lastMsg.content;
            }
        }

        return {
          id: m.userUuid,
          isMember: true,
          type: 'PRIVATE',
          name: m.fullName,
          username: m.username,
          iconUrl: m.profileImage,
          role: m.role,
          unreadCount: unreadCounts[existingRoom?.uuid || ''] || existingRoom?.unreadCount || 0,
          createdAt: existingRoom?.createdAt || m.joinedAt,
          latestActivity: lastMsg?.createdAt || existingRoom?.createdAt,
          description: desc,
          isTyping: typing && typing.length > 0,
          isFounder: m.role === 'OWNER' || m.role === 'FOUNDER',
          roomUuid: existingRoom?.uuid,
          isOnline: onlineStatuses[m.userUuid]?.isOnline || false
        };
      });

    const groupRooms = rooms.filter(r => r.type === 'GROUP').map(r => {
      const roomMsgs = messages[r.uuid] || [];
      const lastMsg = roomMsgs.length > 0 ? roomMsgs[roomMsgs.length - 1] : null;
      const typing = typingUsers[r.uuid] || [];
      
      let desc = r.description || "Start chatting now...";
      if (typing && typing.length > 0) {
          desc = `${typing[0].name} is typing...`;
      } else if (lastMsg) {
          desc = `${lastMsg.senderName}: ${lastMsg.isVoiceNote ? '🎤 Voice Note' : lastMsg.content}`;
      }
      
      return {
        id: r.uuid,
        isMember: false,
        type: r.type,
        name: r.name,
        iconUrl: r.iconUrl,
        role: null,
        unreadCount: unreadCounts[r.uuid] || r.unreadCount || 0,
        createdAt: r.createdAt,
        latestActivity: lastMsg?.createdAt || r.createdAt,
        description: desc,
        isTyping: typing && typing.length > 0,
        isFounder: false,
        roomUuid: r.uuid,
        isOnline: false
      };
    });

    if (filter === 'All') {
      items = [...membersList, ...groupRooms];
    } else if (filter === 'Groups') {
      items = groupRooms;
    } else if (filter === 'Direct Messages') {
      items = membersList;
    }

    items.sort((a, b) => {
      // Sort by latest activity timestamp
      const dateA = new Date(a.latestActivity || a.createdAt || 0).getTime();
      const dateB = new Date(b.latestActivity || b.createdAt || 0).getTime();
      if (dateA !== dateB) return dateB - dateA; // Descending
      
      if (a.isFounder && !b.isFounder) return -1;
      if (!a.isFounder && b.isFounder) return 1;
      return a.name.localeCompare(b.name);
    });

    if (searchQuery) {
      items = items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return items;
  }, [rooms, workspaceMembers, searchQuery, filter, messages, typingUsers, unreadCounts, onlineStatuses, user?.uuid]);



  const otherOnlineState = otherMemberUuid ? onlineStatuses[otherMemberUuid] : null;
  const currentRoomActivities = roomId ? roomActivities[roomId] || [] : [];

  return (
    <div className="flex h-full w-full glass-surface overflow-hidden rounded-[var(--radius-xl)] lg:rounded-[var(--radius-2xl)] relative">

      {/* LEFT SIDEBAR: Chats List */}
      <TeamChatSidebar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filter={filter}
        setFilter={setFilter}
        activeTab={activeTab}
        setIsGroupModalOpen={setIsGroupModalOpen}
        filteredItems={filteredItems}
        workspaceId={workspaceId}
        roomId={roomId}
        user={user}
        callLogs={callLogs}
      />



      {/* RIGHT PANEL: Main Chat Area */}
      {roomId && activeRoom ? (
        <>
        <div className="flex-1 flex flex-col h-full relative min-w-0">
          
          {/* Header */}
          <header className="h-16 shrink-0 px-6 flex items-center justify-between z-10 border-b border-border/50 glass-surface">
            <div className="flex items-center space-x-3 cursor-pointer">
              {activeRoom.type === 'PRIVATE' ? (
                <div className="relative">
                  <img src={getImageUrl(activeRoom.otherMemberAvatarUrl) || `https://api.dicebear.com/7.x/initials/svg?seed=${activeRoom.name}&backgroundColor=000000`} alt={activeRoom.name} className="w-10 h-10 rounded-full object-cover border border-border" />
                  {otherOnlineState?.inVoiceCall ? (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-orange-500 border-2 border-background rounded-full flex items-center justify-center">
                       <span className="text-[5px] text-foreground">📞</span>
                    </div>
                  ) : otherOnlineState?.status === 'BUSY' ? (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 border-2 border-background rounded-full" />
                  ) : otherOnlineState?.isOnline || (activeRoom as any).isOnline ? (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                  ) : null}
                </div>
              ) : activeRoom.iconUrl ? (
                <img src={getImageUrl(activeRoom.iconUrl)} alt={activeRoom.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold">
                  <Hash className="w-5 h-5" />
                </div>
              )}
              
              <div className="flex flex-col justify-center">
                <div className="flex items-center space-x-2">
                  <h2 className="font-semibold">
                    {activeRoom.type === 'PRIVATE' && activeRoom.otherMemberName ? activeRoom.otherMemberName : activeRoom.name}
                  </h2>
                  {activeRoom.type === 'PRIVATE' && (activeRoom as any).otherMemberUsername && (
                    <span className="text-xs text-muted-foreground">@{(activeRoom as any).otherMemberUsername}</span>
                  )}
                  {activeRoom.type === 'PRIVATE' && activeRoom.otherMemberRole && (
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-foreground/10 text-muted-foreground px-1.5 py-0.5 rounded">
                      {activeRoom.otherMemberRole.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <p className={`text-xs ${currentRoomActivities.length > 0 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {currentRoomActivities.length > 0
                    ? currentRoomActivities.map(a => `${a.name} is ${a.type.toLowerCase().replace('_', ' ')}...`).join(', ')
                    : activeRoom.type === 'PRIVATE' ? 'Direct Message' : `${activeRoom.memberCount || 0} members`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button onClick={() => handleCall('AUDIO')} className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground hover:text-primary transition-colors">
                <Phone className="w-5 h-5" />
              </button>
              <div className="w-px h-5 bg-foreground/10 mx-1 sm:mx-2 hidden sm:block" />
              <button onClick={() => setIsSearchSidebarOpen(!isSearchSidebarOpen)} className={`p-2 rounded-full transition-colors hidden sm:block ${isSearchSidebarOpen ? 'bg-primary/20 text-primary' : 'hover:bg-foreground/10 text-muted-foreground'}`}>
                <Search className="w-5 h-5" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {activeRoom.type === 'PRIVATE' ? (
                    <DropdownMenuItem onClick={() => toast.info("Profile view coming soon")}>
                      View Profile
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => setIsGroupSettingsModalOpen(true)}>
                        Group Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 focus:text-red-500 focus:bg-red-400/10" onClick={async () => {
                         try {
                            const basePath = user?.role === 'FOUNDER' || user?.role === 'OWNER' ? '/founder' : '/talent';
                            await chatService.removeGroupMember(workspaceId!, activeRoom.uuid, user!.uuid);
                            navigate(`${basePath}/workspace/${workspaceId}/chat`);
                         } catch(e) { toast.error("Failed to leave group"); }
                      }}>
                        Leave Group
                      </DropdownMenuItem>
                      {(user?.role === 'FOUNDER' || user?.role === 'OWNER') && (
                        <DropdownMenuItem className="text-red-400 focus:text-red-500 focus:bg-red-400/10" onClick={async () => {
                           if(confirm("Are you sure you want to delete this group?")) {
                             try {
                                const basePath = user?.role === 'FOUNDER' || user?.role === 'OWNER' ? '/founder' : '/talent';
                                await chatService.deleteGroup(workspaceId!, activeRoom.uuid);
                                navigate(`${basePath}/workspace/${workspaceId}/chat`);
                             } catch(e) { toast.error("Failed to delete group"); }
                           }
                        }}>
                          Delete Group
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-400 focus:text-red-500 focus:bg-red-400/10"
                    onClick={async () => {
                      if (confirm("Are you sure you want to clear this chat history? This will permanently delete messages for you.")) {
                         try {
                           await chatService.clearChatMessages(workspaceId!, activeRoom.uuid);
                           useChatStore.getState().clearMessages(activeRoom.uuid);
                           toast.success("Chat history cleared");
                         } catch (error) {
                           toast.error("Failed to clear chat history");
                         }
                      }
                    }}
                  >
                    Clear Chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Messages Feed */}
          <div 
            ref={scrollRef} 
            onScroll={handleScroll}
            className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 relative custom-scrollbar bg-transparent`}
          >
            {isLoadingMessages && page === 0 ? (
              <div className="flex flex-col h-full w-full justify-end space-y-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`flex w-full gap-2 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <div className={`w-48 h-12 rounded-[1.25rem] animate-pulse ${i % 2 === 0 ? 'bg-primary/20 rounded-br-sm' : 'bg-foreground/5 rounded-bl-sm'}`}></div>
                  </div>
                ))}
              </div>
            ) : roomMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full w-full text-center p-8 animate-in fade-in zoom-in duration-500">
                 <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <MessageSquare className="w-10 h-10 text-primary" />
                 </div>
                 <h3 className="text-xl font-bold text-foreground mb-2">It's quiet here...</h3>
                 <p className="text-muted-foreground">Be the first to send a message!</p>
              </div>
            ) : (
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
              {isFetchingMore && (
                <div className="absolute top-0 left-0 w-full flex justify-center py-2 z-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const msg = roomMessages[virtualRow.index];
                const isMe = msg.senderUuid === user?.uuid;
                const isRead = activeRoom.type === 'PRIVATE' 
                  ? (lastReadIndex !== -1 && virtualRow.index <= lastReadIndex)
                  : false;
                
                const currentRoomUnreadCount = unreadCounts[roomId || ''] || 0;
                const unreadStartIndex = currentRoomUnreadCount > 0 ? roomMessages.length - currentRoomUnreadCount : -1;
                const showUnreadDivider = virtualRow.index === unreadStartIndex;
                
                let tickStatus: 'sending' | 'failed' | 'sent' | 'delivered' | 'read' = 'sent';
                if (msg.status === 'sending' || msg.status === 'failed') {
                  tickStatus = msg.status;
                } else if (msg.statuses && msg.statuses.length > 0) {
                  const otherMembersCount = Math.max(1, (activeRoom?.memberCount || 2) - 1);
                  const readCount = msg.statuses.filter(s => s.readAt != null).length;
                  if (readCount >= otherMembersCount) {
                    tickStatus = 'read';
                  } else {
                    tickStatus = 'delivered';
                  }
                } else if (isRead) {
                  tickStatus = 'read';
                }
                const prevMsg = virtualRow.index > 0 ? roomMessages[virtualRow.index - 1] : null;
                const nextMsg = virtualRow.index < roomMessages.length - 1 ? roomMessages[virtualRow.index + 1] : null;
                
                const isFirstInSequence = !prevMsg || prevMsg.senderUuid !== msg.senderUuid || (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 5 * 60000) || prevMsg.content?.startsWith('$$CALL_LOG$$');
                const isLastInSequence = !nextMsg || nextMsg.senderUuid !== msg.senderUuid || (new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime() > 5 * 60000) || nextMsg.content?.startsWith('$$CALL_LOG$$');

                const itemKey = msg.tempUuid || msg.uuid || virtualRow.index;
                return (
                  <div
                    key={itemKey}
                    ref={rowVirtualizer.measureElement}
                    data-index={virtualRow.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {showUnreadDivider && (
                      <div className="w-full flex items-center gap-4 my-2 mb-4 px-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="h-px bg-red-500/50 flex-1"/>
                        <span className="text-[10px] text-red-400 font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">New</span>
                        <div className="h-px bg-red-500/50 flex-1"/>
                      </div>
                    )}
                    <MessageBubble 
                      message={msg}
                      isMe={isMe}
                      isRead={isRead}
                      isHighlighted={highlightedMessageId === msg.uuid}
                      tickStatus={tickStatus}
                      otherMemberAvatar={activeRoom.type === 'PRIVATE' ? activeRoom.otherMemberAvatarUrl : undefined}
                      isFirstInSequence={isFirstInSequence}
                      isLastInSequence={isLastInSequence}
                      isPrivateChat={activeRoom.type === 'PRIVATE'}
                      onPin={() => {
                        pinMessage(roomId, msg.uuid, !msg.isPinned);
                        toast.success(msg.isPinned ? "Message unpinned" : "Message pinned");
                      }}
                      onEdit={(m) => setEditingMessage(m)}
                      onDelete={(m) => setMessageToDelete(m)}
                      onReply={(m) => roomId && setReplyingTo(roomId, m)}
                      onReact={(emoji) => {
                        if (roomId) reactMessage(roomId, msg.uuid, emoji);
                      }}
                      onForward={(m) => setForwardMessage(m)}
                      onInfo={(m) => setInfoMessage(m)}
                    />
                  </div>
                );
              })}
            </div>
            )}
            
            {/* New Messages FAB / Jump to Latest */}
            {(!isAtBottom || newMsgCount > 0) && (
              <div className="sticky bottom-4 w-full flex justify-center z-20 pointer-events-none">
                <button 
                  onClick={scrollToBottom}
                  className="pointer-events-auto bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1.5 rounded-full shadow-lg shadow-primary/20 text-xs font-semibold flex items-center gap-2 backdrop-blur-sm transition-all animate-in slide-in-from-bottom-2"
                >
                  <span>{newMsgCount > 0 ? `${newMsgCount} New Messages` : 'Jump to Latest'}</span>
                </button>
              </div>
            )}
            
            {/* Typing Indicator */}
            {currentRoomActivities.includes('TYPING' as any) && (
              <div className="sticky bottom-0 left-0 p-2 pointer-events-none z-10">
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-[1.25rem] rounded-bl-sm px-4 py-2 flex items-center gap-1.5 w-fit">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                   <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                   <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></div>
                </div>
              </div>
            )}
          </div>

          {/* Message Composer Area */}
          <MessageComposer 
            onSend={handleSendMessage}
            onSendVoice={handleSendVoice}
            onSendFiles={handleSendFiles}
            onActivity={handleActivity}
            isSending={false} // Expand logic if needed for text messages
            replyTo={roomId ? replyingTo[roomId] : null}
            onCancelReply={handleCancelReply}
            editMode={editingMessage}
            onCancelEdit={handleCancelEdit}
            isPrivateChat={activeRoom.type === 'PRIVATE'}
          />
        </div>
        {isSearchSidebarOpen && (
          <ChatSearchSidebar 
            workspaceId={workspaceId!}
            roomId={roomId}
            onClose={() => setIsSearchSidebarOpen(false)}
            onJumpToMessage={(message) => {
              const index = roomMessages.findIndex(m => m.uuid === message.uuid);
              if (index !== -1 && rowVirtualizer) {
                rowVirtualizer.scrollToIndex(index, { align: 'center' });
                setHighlightedMessageId(message.uuid);
                setTimeout(() => setHighlightedMessageId(null), 3000);
              } else {
                toast.error("Message is too old to jump to currently.");
              }
            }}
            workspaceMembers={workspaceMembers}
          />
        )}
      </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background/50">
          <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center mb-4 text-primary">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Welcome to Team Chat</h2>
          <p className="text-muted-foreground max-w-sm">
            Select a conversation from the sidebar or create a new group to start collaborating.
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {messageToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm glass-surface rounded-2xl p-6 shadow-2xl border border-border"
            >
              <h3 className="text-lg font-bold text-foreground mb-2">Delete Message?</h3>
              <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => confirmDelete(true)}
                  className="w-full py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-xl transition-colors"
                >
                  Delete for Everyone
                </button>
                <button
                  onClick={() => confirmDelete(false)}
                  className="w-full py-2.5 bg-foreground/5 hover:bg-foreground/10 text-foreground font-medium rounded-xl transition-colors"
                >
                  Delete for Me
                </button>
                <button
                  onClick={() => setMessageToDelete(null)}
                  className="w-full py-2.5 text-muted-foreground hover:text-foreground font-medium rounded-xl transition-colors mt-2"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-lg">Create New Group</h3>
              <button onClick={() => setIsGroupModalOpen(false)} className="p-1 hover:bg-foreground/10 rounded-full">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Group Name</label>
                <input 
                  type="text" 
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="e.g. Design Team" 
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Select Members</label>
                <div className="space-y-2">
                  {workspaceMembers.filter(m => m.role !== 'OWNER' && m.role !== 'FOUNDER').length === 0 ? (
                    <div className="text-sm text-muted-foreground italic p-2">No team members available.</div>
                  ) : (
                    workspaceMembers.filter(m => m.role !== 'OWNER' && m.role !== 'FOUNDER').map(m => (
                      <label key={m.userUuid} className="flex items-center space-x-3 p-2 hover:bg-foreground/5 rounded-lg cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={selectedMemberUuids.includes(m.userUuid)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMemberUuids([...selectedMemberUuids, m.userUuid]);
                            } else {
                              setSelectedMemberUuids(selectedMemberUuids.filter(id => id !== m.userUuid));
                            }
                          }}
                          className="rounded border-border/50 bg-background text-primary focus:ring-primary focus:ring-offset-0"
                        />
                        <img src={(m as any).avatarUrl || `https://ui-avatars.com/api/?name=${m.fullName}`} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <span className="text-sm font-medium">{m.fullName}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end space-x-2 bg-muted">
              <button 
                onClick={() => setIsGroupModalOpen(false)}
                className="px-4 py-2 text-sm font-medium hover:bg-foreground/5 rounded-full transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!newGroupName.trim() || selectedMemberUuids.length === 0) {
                    toast.error("Please enter a group name and select at least one member.");
                    return;
                  }
                  setIsCreatingGroup(true);
                  try {
                    const basePath = user?.role === 'FOUNDER' || user?.role === 'OWNER' ? '/founder' : '/talent';
                    const newGroup = await chatService.createGroup(workspaceId!, newGroupName, "", selectedMemberUuids);
                    queryClient.invalidateQueries({ queryKey: ['chat-rooms', workspaceId] });
                    setIsGroupModalOpen(false);
                    setNewGroupName('');
                    setSelectedMemberUuids([]);
                    navigate(`${basePath}/workspace/${workspaceId}/chat/${newGroup.uuid}`);
                  } catch (err) {
                    toast.error("Failed to create group");
                  } finally {
                    setIsCreatingGroup(false);
                  }
                }}
                disabled={isCreatingGroup || !newGroupName.trim() || selectedMemberUuids.length === 0}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingGroup ? "Creating..." : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}
      {isGroupSettingsModalOpen && workspaceId && activeRoom && (
        <GroupSettingsModal 
          workspaceId={workspaceId} 
          room={activeRoom} 
          onClose={() => setIsGroupSettingsModalOpen(false)} 
        />
      )}

      {forwardMessage && workspaceId && (
        <ForwardMessageModal 
          workspaceId={workspaceId}
          messageToForward={forwardMessage}
          onClose={() => setForwardMessage(null)}
          onForward={(targetRoomId, text) => {
            sendMessage(targetRoomId, text);
          }}
        />
      )}

      <MessageInfoModal
        isOpen={!!infoMessage}
        onClose={() => setInfoMessage(null)}
        message={infoMessage}
        workspaceMembers={workspaceMembers}
      />
      {uiMode === 'docked' && (
        <div className="w-[320px] lg:w-[360px] h-full flex-shrink-0 border-l border-border bg-background flex flex-col transition-all duration-300 z-20">
           <CallOverlay mode="docked" />
        </div>
      )}

    </div>
  );
}


