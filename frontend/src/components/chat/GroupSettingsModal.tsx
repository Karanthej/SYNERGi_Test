import { useState, useEffect, useRef } from 'react';
import { X, Users, Settings, UserPlus, Shield, UserMinus, Camera, Trash2, LogOut } from 'lucide-react';
import { chatService, type ChatRoomResponse, type ChatMemberResponse } from '@/services/chatService';
import { workspaceService } from '@/services/workspaceService';
import { toast } from 'sonner';
import { queryClient } from '@/App';
import { getImageUrl } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface GroupSettingsModalProps {
  workspaceId: string;
  room: ChatRoomResponse;
  onClose: () => void;
}

export function GroupSettingsModal({ workspaceId, room, onClose }: GroupSettingsModalProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'add'>('info');
  const [name, setName] = useState(room.name || '');
  const [description, setDescription] = useState(room.description || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const [groupMembers, setGroupMembers] = useState<ChatMemberResponse[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [membersRes, wsMembersRes] = await Promise.all([
          chatService.getRoomMembers(workspaceId, room.uuid),
          workspaceService.getWorkspaceMembers(workspaceId)
        ]);
        setGroupMembers(membersRes);
        setWorkspaceMembers(wsMembersRes);
      } catch (err) {
        toast.error('Failed to load group details');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [workspaceId, room.uuid]);

  const handleUpdateInfo = async () => {
    setIsSaving(true);
    try {
      await chatService.updateGroup(workspaceId, room.uuid, name, description, room.isArchived || false);
      toast.success('Group updated successfully');
      queryClient.invalidateQueries({ queryKey: ['chat-rooms', workspaceId] });
    } catch (err) {
      toast.error('Failed to update group');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMember = async (targetUserUuid: string) => {
    try {
      await chatService.addGroupMember(workspaceId, room.uuid, targetUserUuid);
      toast.success('Member added');
      // Refresh members
      const membersRes = await chatService.getRoomMembers(workspaceId, room.uuid);
      setGroupMembers(membersRes);
      queryClient.invalidateQueries({ queryKey: ['chat-rooms', workspaceId] });
    } catch (err) {
      toast.error('Failed to add member');
    }
  };

  const handleRemoveMember = async (targetUserUuid: string) => {
    try {
      await chatService.removeGroupMember(workspaceId, room.uuid, targetUserUuid);
      toast.success('Member removed');
      setGroupMembers(prev => prev.filter(m => m.userUuid !== targetUserUuid));
      queryClient.invalidateQueries({ queryKey: ['chat-rooms', workspaceId] });
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  const handleUpdateRole = async (targetUserUuid: string, role: string) => {
    try {
      await chatService.updateGroupMemberRole(workspaceId, room.uuid, targetUserUuid, role);
      toast.success('Role updated');
      setGroupMembers(prev => prev.map(m => m.userUuid === targetUserUuid ? { ...m, role } : m));
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingIcon(true);
    try {
      await chatService.uploadGroupIcon(workspaceId, room.uuid, file);
      toast.success('Group icon updated');
      queryClient.invalidateQueries({ queryKey: ['chat-rooms', workspaceId] });
      onClose();
    } catch (err) {
      toast.error('Failed to upload icon');
    } finally {
      setIsUploadingIcon(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveIcon = async () => {
    setIsUploadingIcon(true);
    try {
      await chatService.removeGroupIcon(workspaceId, room.uuid);
      toast.success('Group icon removed');
      queryClient.invalidateQueries({ queryKey: ['chat-rooms', workspaceId] });
      onClose();
    } catch (err) {
      toast.error('Failed to remove icon');
    } finally {
      setIsUploadingIcon(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!user?.uuid) return;
    if (!confirm('Are you sure you want to leave this group?')) return;
    
    try {
      await chatService.removeGroupMember(workspaceId, room.uuid, user.uuid);
      toast.success('You left the group');
      queryClient.invalidateQueries({ queryKey: ['chat-rooms', workspaceId] });
      const basePath = user?.role === 'FOUNDER' || user?.role === 'OWNER' ? '/founder' : '/talent';
      navigate(`${basePath}/workspace/${workspaceId}/chat`);
      onClose();
    } catch (err) {
      toast.error('Failed to leave group');
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure you want to completely delete this group? This action cannot be undone.')) return;
    
    try {
      await chatService.deleteGroup(workspaceId, room.uuid);
      toast.success('Group deleted');
      queryClient.invalidateQueries({ queryKey: ['chat-rooms', workspaceId] });
      const basePath = user?.role === 'FOUNDER' || user?.role === 'OWNER' ? '/founder' : '/talent';
      navigate(`${basePath}/workspace/${workspaceId}/chat`);
      onClose();
    } catch (err) {
      toast.error('Failed to delete group');
    }
  };

  const groupMemberUuids = groupMembers.map(m => m.userUuid);
  const availableMembers = workspaceMembers.filter(m => !groupMemberUuids.includes(m.userUuid));
  const currentUserMember = groupMembers.find(m => m.userUuid === user?.uuid);
  const isAdmin = currentUserMember?.role === 'ADMIN' || currentUserMember?.role === 'OWNER' || user?.role === 'FOUNDER';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
          <h3 className="font-bold text-lg">Group Settings</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-white/10 shrink-0">
          <button 
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Settings className="w-4 h-4" /> Info
          </button>
          <button 
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'members' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Users className="w-4 h-4" /> Members
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('add')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'add' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              <UserPlus className="w-4 h-4" /> Add
            </button>
          )}
        </div>

        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">Loading...</div>
          ) : (
            <>
              {activeTab === 'info' && (
                <div className="space-y-4">
                  
                  {/* Group Avatar Section */}
                  <div className="flex flex-col items-center py-4 border-b border-white/10">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-white/5 border-2 border-white/10 flex items-center justify-center">
                        {room.iconUrl ? (
                          <img src={getImageUrl(room.iconUrl)} alt={room.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl font-medium text-primary">{(room.name || 'G').charAt(0)}</span>
                        )}
                      </div>
                      
                      {isAdmin && (
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingIcon}
                          className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer disabled:cursor-not-allowed"
                        >
                          <Camera className="w-6 h-6 text-white mb-1" />
                          <span className="text-[10px] font-medium text-white">Change</span>
                        </button>
                      )}
                      
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleIconUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>
                    
                    {isAdmin && room.iconUrl && (
                      <button 
                        onClick={handleRemoveIcon}
                        disabled={isUploadingIcon}
                        className="mt-3 text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                      >
                        Remove Icon
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Group Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      disabled={!isAdmin}
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Description</label>
                    <textarea 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      disabled={!isAdmin}
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-colors min-h-[100px] disabled:opacity-50"
                    />
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={handleUpdateInfo}
                      disabled={isSaving || !name.trim()}
                      className="w-full py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  )}
                  
                  <div className="pt-4 mt-2 border-t border-white/10 space-y-2">
                    <button 
                      onClick={handleLeaveGroup}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Leave Group
                    </button>
                    
                    {isAdmin && (
                      <button 
                        onClick={handleDeleteGroup}
                        className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Group
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'members' && (
                <div className="space-y-2">
                  {groupMembers.map(m => (
                    <div key={m.userUuid} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5">
                      <div className="flex items-center gap-3">
                        <img src={getImageUrl(m.profileImage) || `https://api.dicebear.com/7.x/initials/svg?seed=${m.fullName}`} alt={m.fullName} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="text-sm font-medium flex items-center gap-2">
                            {m.fullName}
                            {m.role === 'ADMIN' || m.role === 'OWNER' ? <Shield className="w-3 h-3 text-primary" /> : null}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{m.role.toLowerCase()}</p>
                        </div>
                      </div>
                      
                      {isAdmin && m.userUuid !== user?.uuid && (
                        <div className="flex items-center gap-2">
                          <select 
                            value={m.role}
                            onChange={(e) => handleUpdateRole(m.userUuid, e.target.value)}
                            className="bg-background text-xs border border-white/10 rounded px-2 py-1 outline-none"
                          >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          <button 
                            onClick={() => handleRemoveMember(m.userUuid)}
                            className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                            title="Remove Member"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'add' && isAdmin && (
                <div className="space-y-2">
                  {availableMembers.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground p-4">All workspace members are already in this group.</div>
                  ) : (
                    availableMembers.map(m => (
                      <div key={m.userUuid} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5">
                        <div className="flex items-center gap-3">
                          <img src={getImageUrl(m.profileImage) || m.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${m.fullName}`} alt={m.fullName} className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            <p className="text-sm font-medium">{m.fullName}</p>
                            <p className="text-xs text-muted-foreground capitalize">{m.role.toLowerCase()}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleAddMember(m.userUuid)}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-medium rounded-lg transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
