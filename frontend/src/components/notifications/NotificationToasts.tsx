import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { AppNotification } from '@/store/useNotificationStore';
import { X, Reply, ArrowRight, MessageSquare, Bell, UserPlus, Phone, Send } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

interface NotifProps {
  notif: AppNotification;
  onClose: () => void;
}

const MESSAGE_TYPES = new Set(['MESSAGE', 'PRIVATE_MESSAGE', 'NEW_MESSAGE', 'MENTION', 'REPLY']);

const getIcon = (type: string) => {
  switch (type) {
    case 'MESSAGE':
    case 'PRIVATE_MESSAGE':
    case 'NEW_MESSAGE': return <MessageSquare className="w-4 h-4 text-blue-400" />;
    case 'MENTION': return <Bell className="w-4 h-4 text-yellow-400" />;
    case 'MEMBER_ADDED': return <UserPlus className="w-4 h-4 text-green-400" />;
    case 'INCOMING_CALL': return <Phone className="w-4 h-4 text-green-400 animate-pulse" />;
    default: return <Bell className="w-4 h-4 text-primary" />;
  }
};

const sendQuickReply = (notif: AppNotification, text: string): boolean => {
  try {
    const client = (window as any).__stompClient;
    if (client && client.connected && notif.roomUuid) {
      const tempUuid = `temp-${Date.now()}-${crypto.randomUUID()}`;
      client.publish({
        destination: `/app/chat.sendMessage/${notif.roomUuid}`,
        body: JSON.stringify({
          tempUuid,
          content: text,
          replyToMessageUuid: notif.metadata?.messageUuid || undefined,
        }),
      });
      return true;
    }
  } catch {}
  return false;
};

export const SmallGlassNotification: React.FC<NotifProps> = ({ notif, onClose }) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const handleOpen = () => {
    onClose();
    if (notif.actionUrl) window.location.assign(notif.actionUrl);
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = replyText.trim();
    if (!text) return;
    setSending(true);
    const sent = sendQuickReply(notif, text);
    setSending(false);
    if (sent) {
      setReplyText('');
      setShowReply(false);
      onClose();
    } else {
      // Fallback: navigate to the chat
      handleOpen();
    }
  };

  const isMessageType = MESSAGE_TYPES.has(notif.type) && !!notif.roomUuid;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-[280px] glass-surface border border-white/10 rounded-xl p-3 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      <div className="flex gap-3">
        {notif.avatarUrl ? (
          <img src={getImageUrl(notif.avatarUrl)} className="w-10 h-10 rounded-full object-cover shrink-0" alt="Avatar" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            {getIcon(notif.type)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className="text-sm font-semibold text-white truncate pr-4">
              {notif.senderName || notif.title} 
              {notif.roleBadge && <span className="ml-2 text-[9px] uppercase font-bold bg-white/10 px-1.5 py-0.5 rounded text-muted-foreground">{notif.roleBadge}</span>}
            </h4>
            <button onClick={onClose} className="text-muted-foreground hover:text-white shrink-0 -mt-1 -mr-1 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          {notif.conversationName && <p className="text-[10px] text-primary uppercase font-bold tracking-wider mt-1">{notif.conversationName}</p>}
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notif.type === 'MENTION' ? <span className="text-yellow-400 font-medium">@{notif.senderName} </span> : null}
            {notif.body}
          </p>
          
          {/* Inline reply input */}
          {showReply && (
            <form onSubmit={handleReplySubmit} className="mt-2 flex gap-1.5">
              <input
                autoFocus
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Reply…"
                className="flex-1 bg-black/40 text-xs rounded-lg px-2.5 py-1.5 border border-white/10 focus:outline-none focus:border-primary/50 transition-colors placeholder:text-white/30 min-w-0"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || sending}
                className="p-1.5 rounded-lg bg-primary/80 hover:bg-primary text-white disabled:opacity-40 transition-all"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          )}

          <div className="flex gap-2 mt-3">
            <button 
              onClick={handleOpen}
              className="flex-1 bg-white/5 hover:bg-white/10 text-xs font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              Open <ArrowRight className="w-3 h-3" />
            </button>
            {isMessageType && (
              <button 
                onClick={() => setShowReply(prev => !prev)}
                className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  showReply
                    ? 'bg-primary/30 text-primary'
                    : 'bg-primary/20 hover:bg-primary/30 text-primary'
                }`}
              >
                Reply <Reply className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const PremiumLongNotification: React.FC<NotifProps> = ({ notif, onClose }) => {
  const handleOpen = () => {
    onClose();
    if (notif.actionUrl) window.location.assign(notif.actionUrl);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="w-full max-w-sm glass-card border border-white/20 rounded-xl p-3 shadow-2xl backdrop-blur-xl relative"
    >
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
        <div className="bg-primary/20 p-1.5 rounded-lg">
          {getIcon(notif.type)}
        </div>
        <span className="text-xs font-bold tracking-wider text-primary uppercase">{notif.workspaceName || 'SYNERGi'}</span>
        <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-white p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-4">
        {notif.avatarUrl && (
          <img src={getImageUrl(notif.avatarUrl)} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10" alt="Avatar" />
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">{notif.senderName || notif.title}</h4>
                {notif.roleBadge && (
                  <span className="text-[9px] uppercase font-bold bg-white/10 px-1.5 py-0.5 rounded text-muted-foreground">
                    {notif.roleBadge}
                  </span>
                )}
              </div>
          </div>
          {notif.conversationName && <p className="text-[10px] text-primary uppercase font-bold tracking-wider mt-0.5">{notif.conversationName}</p>}
          <p className="text-xs text-foreground/80 mt-1 leading-snug">
            {notif.type === 'MENTION' ? <span className="text-yellow-400 font-medium">@{notif.senderName} </span> : null}
            {notif.body}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-3 pt-1.5">
        <button 
          onClick={onClose}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-1.5 rounded-lg transition-all"
        >
          Dismiss
        </button>
        <button 
          onClick={handleOpen}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium py-1.5 rounded-lg transition-all shadow-lg shadow-primary/25"
        >
          Open Workspace
        </button>
      </div>
    </motion.div>
  );
};
