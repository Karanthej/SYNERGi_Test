import React, { useState, useMemo } from 'react';
import { X, Search, Hash, Users, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { chatService } from '@/services/chatService';
import { workspaceService } from '@/services/workspaceService';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/utils';
import type { ChatMessageResponse } from '@/services/chatService';

interface ForwardMessageModalProps {
  workspaceId: string;
  messageToForward: ChatMessageResponse;
  onClose: () => void;
  onForward: (targetRoomId: string, text: string) => void;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({ workspaceId, messageToForward, onClose, onForward }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { data: rooms = [] } = useQuery({
    queryKey: ['chat-rooms', workspaceId],
    queryFn: () => chatService.getRooms(workspaceId),
    enabled: !!workspaceId
  });

  const { data: workspaceMembers = [] } = useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => workspaceService.getWorkspaceMembers(workspaceId),
    enabled: !!workspaceId
  });

  const forwardOptions = useMemo(() => {
    const groups = rooms.filter(r => r.type === 'GROUP').map(r => ({
      id: r.uuid,
      name: r.name,
      type: 'GROUP',
      iconUrl: r.iconUrl
    }));

    const members = workspaceMembers.map(m => {
      // Find existing private room if any
      const existingRoom = rooms.find(r => r.type === 'PRIVATE' && (r.name === m.fullName || r.otherMemberName === m.fullName));
      return {
        id: existingRoom?.uuid || m.userUuid, // We will handle creating room if it doesn't exist
        userUuid: m.userUuid,
        name: m.fullName,
        type: 'PRIVATE',
        iconUrl: m.avatarUrl,
        hasExistingRoom: !!existingRoom
      };
    });

    let combined = [...groups, ...members];
    if (searchQuery) {
      combined = combined.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return combined.sort((a, b) => a.name.localeCompare(b.name));
  }, [rooms, workspaceMembers, searchQuery]);

  const handleForward = async (option: any) => {
    setIsSending(true);
    try {
      let targetRoomId = option.id;
      if (option.type === 'PRIVATE' && !option.hasExistingRoom) {
        // Create private room if it doesn't exist
        const newRoom = await chatService.getOrCreatePrivateChat(workspaceId, option.userUuid);
        targetRoomId = newRoom.uuid;
      }
      
      const content = `[Forwarded]\n\n${messageToForward.content}`;
      onForward(targetRoomId, content);
      toast.success(`Message forwarded to ${option.name}`);
      onClose();
    } catch (err) {
      toast.error("Failed to forward message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-bold text-lg">Forward Message</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-white/10 bg-background/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search people or groups..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {forwardOptions.length === 0 ? (
            <div className="text-center p-6 text-muted-foreground text-sm">
              No results found.
            </div>
          ) : (
            forwardOptions.map(option => (
              <div 
                key={`${option.type}-${option.id}`}
                className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group"
                onClick={() => !isSending && handleForward(option)}
              >
                <div className="flex items-center space-x-3">
                  {option.iconUrl ? (
                    <img src={getImageUrl(option.iconUrl)} alt={option.name} className="w-10 h-10 rounded-full object-cover bg-white/5" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold">
                      {option.type === 'PRIVATE' ? <Users className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{option.name}</h4>
                    <p className="text-xs text-muted-foreground">{option.type === 'GROUP' ? 'Group Chat' : 'Direct Message'}</p>
                  </div>
                </div>
                <button 
                  disabled={isSending}
                  className="p-2 rounded-full bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
