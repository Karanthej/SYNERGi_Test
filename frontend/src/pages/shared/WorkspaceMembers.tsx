import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/App";
import { Users, Shield, UserMinus, MessageCircle, MoreVertical, Copy, User, Phone } from "lucide-react";
import { workspaceService } from "@/services/workspaceService";
import type { WorkspaceResponse } from "@/services/workspaceService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { getImageUrl } from '@/lib/utils';
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function WorkspaceMembers() {
  const { workspace } = useOutletContext<{ workspace: WorkspaceResponse }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const { data: members = [], isLoading: loading } = useQuery({
    queryKey: ['members', workspace.startupUuid],
    queryFn: () => workspaceService.getWorkspaceMembers(workspace.startupUuid),
  });

  const handleRemoveMember = async (memberUuid: string) => {
    try {
      await workspaceService.removeMember(workspace.startupUuid, memberUuid);
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success("Member removed successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove member");
    }
  };

  const isOwner = user?.role === 'FOUNDER' && workspace.userRole === 'OWNER';
  
  const onlineStatuses = useChatStore(state => state.onlineStatuses);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchSearch = m.fullName.toLowerCase().includes(search.toLowerCase()) || 
                          (m.username && m.username.toLowerCase().includes(search.toLowerCase())) ||
                          m.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'ALL' || m.role === roleFilter;
      return matchSearch && matchRole;
    }).sort((a, b) => {
      // Sort Online users first, then by role (OWNER first)
      const aOnline = onlineStatuses[a.userUuid]?.isOnline ? 1 : 0;
      const bOnline = onlineStatuses[b.userUuid]?.isOnline ? 1 : 0;
      if (aOnline !== bOnline) return bOnline - aOnline;
      if (a.role === 'OWNER' && b.role !== 'OWNER') return -1;
      if (a.role !== 'OWNER' && b.role === 'OWNER') return 1;
      return a.fullName.localeCompare(b.fullName);
    });
  }, [members, search, roleFilter, onlineStatuses]);

  // Virtualizer setup for grid (assuming 3 columns for lg, 2 for sm, 1 for mobile)
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(filteredMembers.length / 3), // We'll render 3 cards per row
    getScrollElement: () => parentRef.current,
    estimateSize: () => 240, // Height of card + gap
    overscan: 5,
  });

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full h-[calc(100vh-10rem)] flex flex-col">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Team Members</h2>
          <p className="text-white/80 mt-1">Manage everyone with access to this workspace.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input 
            placeholder="Search members..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-surface w-full sm:w-64"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="glass-surface w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="ALL">All Roles</SelectItem>
               <SelectItem value="OWNER">Founder</SelectItem>
               <SelectItem value="TEAM_MEMBER">Talent</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="px-3 py-2 text-sm shrink-0 whitespace-nowrap"><Users className="w-4 h-4 mr-2" /> {filteredMembers.length} Members</Badge>
        </div>
      </div>

      <div ref={parentRef} className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            // Render 3 items per row
            const startIndex = virtualRow.index * 3;
            const rowItems = filteredMembers.slice(startIndex, startIndex + 3);

            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6"
              >
                {rowItems.map(member => {
                  const isUserOnline = onlineStatuses[member.userUuid]?.isOnline;
                  const lastSeen = onlineStatuses[member.userUuid]?.lastSeen;
                  
                  return (
                    <Card key={member.userUuid} className="relative overflow-hidden group h-[216px] glass-card border-white/10 hover:border-primary/30 transition-colors">
                      {member.role === 'OWNER' && (
                        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
                          <div className="absolute transform rotate-45 bg-primary text-primary-foreground text-[10px] font-bold py-1 right-[-35px] top-[32px] w-[170px] text-center shadow-md">
                            OWNER
                          </div>
                        </div>
                      )}
                      
                      <CardContent className="p-6 flex flex-col h-full relative">
                        {/* Dropdown Menu */}
                        <div className="absolute top-4 right-4 z-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 glass-surface">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => toast.info('Profile view coming soon')}>
                                <User className="mr-2 h-4 w-4" /> View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(window.location.origin + `/u/${member.username || member.userUuid}`).then(() => toast.success('Profile link copied!'))}>
                                <Copy className="mr-2 h-4 w-4" /> Copy Profile Link
                              </DropdownMenuItem>
                              {user?.uuid !== member.userUuid && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => navigate(`/${user?.role?.toLowerCase()}/workspace/${workspace.startupUuid}/chat`, { state: { openPrivateChatWithUserUuid: member.userUuid } })}>
                                    <MessageCircle className="mr-2 h-4 w-4" /> Private Chat
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toast.info('Direct Call API coming soon')}>
                                    <Phone className="mr-2 h-4 w-4" /> Call Member
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              {isOwner && member.role !== 'OWNER' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => toast.info('Promote API coming soon')}>
                                    <Shield className="mr-2 h-4 w-4" /> Promote Role
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-500 focus:bg-red-500/10 focus:text-red-500"
                                    onClick={() => handleRemoveMember(member.userUuid)}
                                  >
                                    <UserMinus className="mr-2 h-4 w-4" /> Remove Member
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-start gap-4 mb-4">
                          <div className="relative">
                            {member.avatarUrl ? (
                              <img src={getImageUrl(member.avatarUrl)} alt={member.fullName} className="w-14 h-14 rounded-full object-cover border border-white/10" />
                            ) : (
                              <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xl text-primary uppercase border border-primary/30">
                                {(member.fullName || member.username || member.email || "U").substring(0, 2)}
                              </div>
                            )}
                            {/* Online Status Indicator */}
                            <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#12121A] ${isUserOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0 pr-6">
                            <h3 className="font-semibold text-lg truncate text-white">{member.fullName}</h3>
                            <p className="text-sm text-muted-foreground truncate">@{member.username || member.email.split('@')[0]}</p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-auto">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Role</span>
                            <span className="font-medium flex items-center gap-1 text-white/90">
                              {member.role === 'OWNER' ? <Shield className="w-3 h-3 text-primary" /> : null}
                              {member.assignedRole || (member.role === 'OWNER' ? 'Founder' : 'Talent')}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Status</span>
                            <span className="font-medium text-white/90">
                              {isUserOnline ? 'Online' : (lastSeen ? `Last seen ${formatDistanceToNow(new Date(lastSeen))} ago` : 'Offline')}
                            </span>
                          </div>
                        </div>

                        {user?.uuid !== member.userUuid && (
                          <Button 
                            variant="secondary"
                            className="w-full mt-4 bg-white/5 text-white hover:bg-primary hover:text-white rounded-lg font-medium shadow-none transition-colors border border-white/5"
                            onClick={() => navigate(`/${user?.role?.toLowerCase()}/workspace/${workspace.startupUuid}/chat`, { state: { openPrivateChatWithUserUuid: member.userUuid } })}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" /> Message
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
