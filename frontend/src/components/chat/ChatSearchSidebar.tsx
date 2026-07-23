import { useState, useEffect } from 'react';
import { Search, X, Loader2, FileText, Image as ImageIcon, Link2, Pin, MessageSquare, Users } from 'lucide-react';
import { chatService } from '@/services/chatService';
import type { ChatMessageResponse } from '@/services/chatService';

import { getImageUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatSearchSidebarProps {
  workspaceId: string;
  roomId: string;
  onClose: () => void;
  onJumpToMessage: (message: ChatMessageResponse) => void;
  workspaceMembers: any[];
}

type FilterType = 'ALL' | 'MEMBERS' | 'MEDIA' | 'DOCUMENTS' | 'LINKS' | 'PINNED' | 'REPLIES';

export function ChatSearchSidebar({ workspaceId, roomId, onClose, onJumpToMessage, workspaceMembers }: ChatSearchSidebarProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [results, setResults] = useState<ChatMessageResponse[]>([]);
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(handler);
  }, [query]);

  // Execute search
  useEffect(() => {
    if (filterType === 'MEMBERS') {
      const filtered = workspaceMembers.filter(m => 
        m.fullName.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
        (m.username && m.username.toLowerCase().includes(debouncedQuery.toLowerCase()))
      );
      setMemberResults(filtered);
      return;
    }

    const fetchSearch = async () => {
      // Allow searching by type even if query is empty (e.g. show all PINNED)
      if (!debouncedQuery.trim() && filterType === 'ALL') {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const msgs = await chatService.searchMessages(workspaceId, roomId, debouncedQuery, filterType);
        setResults(msgs);
      } catch (err) {
        toast.error("Failed to search messages");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSearch();
  }, [debouncedQuery, filterType, workspaceId, roomId, workspaceMembers]);

  const tabs = [
    { id: 'ALL', label: 'Messages', icon: MessageSquare },
    { id: 'MEMBERS', label: 'Members', icon: Users },
    { id: 'MEDIA', label: 'Media', icon: ImageIcon },
    { id: 'DOCUMENTS', label: 'Docs', icon: FileText },
    { id: 'LINKS', label: 'Links', icon: Link2 },
    { id: 'PINNED', label: 'Pinned', icon: Pin },
    { id: 'REPLIES', label: 'Replies', icon: MessageSquare },
  ];

  return (
    <div className="w-[350px] flex flex-col border-l border-white/5 bg-card/20 shrink-0 h-full">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 shrink-0 border-b border-white/5 glass-surface">
        <h2 className="text-lg font-bold">Search</h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-muted-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 shrink-0">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search this chat..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-black/40 text-sm rounded-full pl-9 pr-4 py-2 border border-white/5 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-2 pb-2 shrink-0 flex flex-wrap gap-1 border-b border-white/5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id as FilterType)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterType === tab.id 
                ? 'bg-primary/20 text-primary border border-primary/30' 
                : 'bg-black/20 text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : filterType === 'MEMBERS' ? (
          memberResults.length > 0 ? (
            memberResults.map(m => (
              <div key={m.userUuid} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                <img src={getImageUrl(m.profileImage) || `https://api.dicebear.com/7.x/initials/svg?seed=${m.fullName}`} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="text-sm font-medium">{m.fullName}</p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-8 text-muted-foreground text-sm">No members found</div>
          )
        ) : (
          results.length > 0 ? (
            results.map(msg => (
              <div 
                key={msg.uuid} 
                onClick={() => onJumpToMessage(msg)}
                className="flex gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer mb-1 border border-transparent hover:border-white/5"
              >
                <img src={getImageUrl(msg.senderAvatarUrl) || `https://api.dicebear.com/7.x/initials/svg?seed=${msg.senderName}`} className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold truncate">{msg.senderName}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                  {msg.content && (
                    <p className="text-xs text-foreground/80 mt-1 line-clamp-3 break-words">
                      {msg.content}
                    </p>
                  )}
                  {msg.attachments?.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                        {msg.attachments.length} attachment(s)
                      </span>
                    </div>
                  )}
                  {msg.isPinned && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-orange-400">
                      <Pin className="w-3 h-3" /> Pinned
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-8 text-muted-foreground text-sm">
              {!debouncedQuery && filterType === 'ALL' 
                ? 'Type to search messages' 
                : 'No results found'}
            </div>
          )
        )}
      </div>
    </div>
  );
}
