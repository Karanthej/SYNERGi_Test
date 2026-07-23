// @ts-nocheck
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff, Clock, Calendar, Search, SearchX, PhoneCall } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/store/useAuthStore';
import { useCallStore } from '@/store/useCallStore';
import { workspaceService } from '@/services/workspaceService';
import { callService } from '@/services/callService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getImageUrl } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function WorkspaceCalls() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const initiateCallByUsername = useCallStore(s => s.initiateCallByUsername);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'INCOMING' | 'OUTGOING' | 'MISSED'>('ALL');
  const [visibleCount, setVisibleCount] = useState(15);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceService.getWorkspaceMembers(workspaceId!),
    enabled: !!workspaceId
  });

  const { data: calls = [], isLoading: isLoadingCalls, isError } = useQuery({
    queryKey: ['workspace-calls', workspaceId],
    queryFn: () => callService.getWorkspaceCalls(workspaceId!),
    enabled: !!workspaceId,
    refetchInterval: 30000 // Refetch every 30s for live updates
  });

  const memberMap = useMemo(() => {
    return members.reduce((acc, member) => {
      acc[member.userUuid] = member;
      return acc;
    }, {} as Record<string, any>);
  }, [members]);

  const enrichedCalls = useMemo(() => {
    if (!user) return [];
    
    return calls.map(call => {
      const isIncoming = call.receiverId === user.uuid;
      const peerId = isIncoming ? call.callerId : call.receiverId;
      const peer = memberMap[peerId];
      
      return {
        ...call,
        isIncoming,
        peer
      };
    }).filter(c => c.peer); // Only show calls where the peer is still a known member (or we can show Unknown, but let's filter for now)
  }, [calls, user, memberMap]);

  const filteredCalls = useMemo(() => {
    return enrichedCalls.filter(call => {
      // Search
      if (searchQuery && call.peer) {
        const matchesName = call.peer.fullName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesUsername = call.peer.username?.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesName && !matchesUsername) return false;
      }
      
      // Filter tab
      if (filter === 'INCOMING' && !call.isIncoming) return false;
      if (filter === 'OUTGOING' && call.isIncoming) return false;
      if (filter === 'MISSED' && call.status !== 'MISSED') return false;
      
      return true;
    });
  }, [enrichedCalls, searchQuery, filter]);

  const visibleCalls = useMemo(() => {
    return filteredCalls.slice(0, visibleCount);
  }, [filteredCalls, visibleCount]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => Math.min(prev + 15, filteredCalls.length));
      }
    }, { threshold: 0.1 });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [filteredCalls.length]);

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getStatusIcon = (status: string, isIncoming: boolean) => {
    switch(status) {
      case 'MISSED': return <PhoneMissed className="w-4 h-4 text-red-500" />;
      case 'REJECTED': return <PhoneOff className="w-4 h-4 text-orange-500" />;
      case 'BUSY': return <PhoneOff className="w-4 h-4 text-orange-500" />;
      default: return isIncoming ? <PhoneIncoming className="w-4 h-4 text-blue-500" /> : <PhoneOutgoing className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'MISSED': return 'text-red-500 bg-red-500/10';
      case 'REJECTED': return 'text-orange-500 bg-orange-500/10';
      case 'BUSY': return 'text-orange-500 bg-orange-500/10';
      default: return 'text-green-500 bg-green-500/10';
    }
  };

  const handleCallBack = (username: string) => {
    if (workspaceId && username) {
       initiateCallByUsername?.(username, workspaceId);
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
          <PhoneOff className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Failed to load calls</h3>
        <p className="text-muted-foreground max-w-md">There was a problem retrieving the call history for this workspace.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent max-w-5xl mx-auto w-full p-4 lg:p-8 overflow-hidden">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
             <Phone className="w-6 h-6 text-primary" />
             Call History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Review your incoming and outgoing calls in this workspace.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                 placeholder="Search calls..." 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="pl-9 bg-background/50 border-border/50"
              />
           </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {['ALL', 'INCOMING', 'OUTGOING', 'MISSED'].map(f => (
           <button
             key={f}
             onClick={() => setFilter(f as any)}
             className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filter === f ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-background/50 text-muted-foreground hover:bg-white/5 border border-border/50'}`}
           >
             {f.charAt(0) + f.slice(1).toLowerCase()}
           </button>
        ))}
      </div>

      {/* Call List */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {isLoadingCalls || isLoadingMembers ? (
          <div className="space-y-3">
             {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="w-full h-20 rounded-2xl" />
             ))}
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-white/5 text-muted-foreground rounded-full flex items-center justify-center mb-4">
              {searchQuery ? <SearchX className="w-8 h-8" /> : <Phone className="w-8 h-8 opacity-50" />}
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">{searchQuery ? 'No matches found' : 'No calls yet'}</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {searchQuery ? `No call history matching "${searchQuery}".` : "You haven't made or received any calls in this workspace yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            {visibleCalls.map((call, idx) => (
              <div 
                key={`${call.uuid}-${idx}`} 
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all hover:shadow-md"
              >
                 <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <Avatar className="w-12 h-12 border-2 border-background">
                         <AvatarImage src={getImageUrl(call.peer.avatarUrl)} />
                         <AvatarFallback>{call.peer.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background flex items-center justify-center border border-border">
                         {getStatusIcon(call.status, call.isIncoming)}
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                       <span className="text-base font-bold text-foreground truncate">{call.peer.fullName}</span>
                       <span className="text-xs text-muted-foreground truncate">@{call.peer.username}</span>
                    </div>
                 </div>

                 <div className="flex items-center gap-6 sm:gap-10">
                    <div className="flex flex-col sm:items-end gap-1 min-w-[120px]">
                       <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(call.startedAt), 'MMM d, h:mm a')}
                       </div>
                       <div className="flex items-center gap-2">
                          {call.durationSeconds > 0 && (
                            <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                               <Clock className="w-3 h-3" />
                               {formatDuration(call.durationSeconds)}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${getStatusColor(call.status)}`}>
                             {call.status}
                          </span>
                       </div>
                    </div>
                    
                    <button 
                       onClick={() => handleCallBack(call.peer.username)}
                       className="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all sm:opacity-0 sm:-translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 focus:opacity-100 focus:translate-x-0"
                       title={`Call ${call.peer.fullName}`}
                    >
                       <PhoneCall className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            ))}
            
            {visibleCount < filteredCalls.length && (
              <div ref={loadMoreRef} className="py-4 flex justify-center">
                 <Skeleton className="w-full h-20 rounded-2xl opacity-50" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
