import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCheck, Check } from 'lucide-react';
import type { ChatMessageResponse } from '@/services/chatService';
import type { WorkspaceMemberResponse } from '@/services/workspaceService';
import { getImageUrl } from '@/lib/utils';

interface MessageInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: ChatMessageResponse | null;
  workspaceMembers: WorkspaceMemberResponse[];
}

export const MessageInfoModal: React.FC<MessageInfoModalProps> = ({ isOpen, onClose, message, workspaceMembers }) => {
  if (!message) return null;

  const getMemberDetails = (uuid: string) => {
    return workspaceMembers.find(m => m.userUuid === uuid);
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const statuses = message.statuses || [];
  
  // Sort by read first, then delivered, then sent
  const readBy = statuses.filter(s => s.readAt).sort((a, b) => new Date(a.readAt!).getTime() - new Date(b.readAt!).getTime());
  const deliveredTo = statuses.filter(s => s.deliveredAt && !s.readAt).sort((a, b) => new Date(a.deliveredAt!).getTime() - new Date(b.deliveredAt!).getTime());

  // Find users who haven't even received it yet
  const statusUserIds = new Set(statuses.map(s => s.userUuid));
  const remainingMembers = workspaceMembers.filter(m => 
    m.userUuid !== message.senderUuid && !statusUserIds.has(m.userUuid)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-card w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                <h2 className="font-semibold text-lg">Message Info</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="p-4 border-b border-white/10">
                <div className="bg-primary/10 text-primary-foreground p-3 rounded-xl break-words">
                  {message.content}
                </div>
                <div className="text-xs text-muted-foreground mt-2 text-right">
                  Sent • {formatDateTime(message.createdAt)}
                </div>
              </div>

              <div className="overflow-y-auto p-4 flex-1 space-y-6 custom-scrollbar">
                
                {/* Read By Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3 text-blue-400">
                    <CheckCheck className="w-4 h-4" />
                    <h3 className="font-medium text-sm">Read by ({readBy.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {readBy.map(status => {
                      const member = getMemberDetails(status.userUuid);
                      return (
                        <div key={status.userUuid} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img 
                              src={(member as any)?.profileImage ? getImageUrl((member as any).profileImage) : ''} 
                              alt={member?.fullName}
                              className="w-8 h-8 rounded-full bg-white/10 object-cover"
                            />
                            <span className="text-sm">{member?.fullName || 'Unknown User'}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDateTime(status.readAt!)}</span>
                        </div>
                      );
                    })}
                    {readBy.length === 0 && <p className="text-sm text-muted-foreground italic">No one has read this yet.</p>}
                  </div>
                </div>

                {/* Delivered To Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3 text-white/70">
                    <CheckCheck className="w-4 h-4" />
                    <h3 className="font-medium text-sm">Delivered to ({deliveredTo.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {deliveredTo.map(status => {
                      const member = getMemberDetails(status.userUuid);
                      return (
                        <div key={status.userUuid} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img 
                              src={(member as any)?.profileImage ? getImageUrl((member as any).profileImage) : ''} 
                              alt={member?.fullName}
                              className="w-8 h-8 rounded-full bg-white/10 object-cover"
                            />
                            <span className="text-sm">{member?.fullName || 'Unknown User'}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDateTime(status.deliveredAt!)}</span>
                        </div>
                      );
                    })}
                    {deliveredTo.length === 0 && readBy.length > 0 && <p className="text-sm text-muted-foreground italic">Delivered to all readers.</p>}
                  </div>
                </div>

                {/* Remaining Section (Only show if group chat and there are remaining members) */}
                {remainingMembers.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 text-white/40">
                      <Check className="w-4 h-4" />
                      <h3 className="font-medium text-sm">Sent ({remainingMembers.length})</h3>
                    </div>
                    <div className="space-y-3">
                      {remainingMembers.map(member => (
                        <div key={member.userUuid} className="flex items-center gap-2">
                          <img 
                            src={(member as any)?.profileImage ? getImageUrl((member as any).profileImage) : ''} 
                            alt={member?.fullName}
                            className="w-8 h-8 rounded-full bg-white/10 object-cover opacity-60"
                          />
                          <span className="text-sm opacity-60">{member?.fullName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
