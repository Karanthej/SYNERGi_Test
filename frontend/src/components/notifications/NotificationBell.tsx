import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Trash2, Settings, MessageSquare, UserPlus, Phone, Reply, Send, Briefcase, CheckCircle2, XCircle } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import type { AppNotification } from '@/store/useNotificationStore';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '@/lib/utils';

// Access the global stomp client for inline replies
declare const globalStompClient: any;
declare const globalIsConnected: boolean;

const MESSAGE_TYPES = new Set(['MESSAGE', 'PRIVATE_MESSAGE', 'NEW_MESSAGE', 'MENTION', 'REPLY']);

const getIcon = (type: string) => {
  switch (type) {
    case 'MESSAGE':
    case 'PRIVATE_MESSAGE':
    case 'NEW_MESSAGE': return <MessageSquare className="w-4 h-4 text-blue-400" />;
    case 'MENTION': return <Bell className="w-4 h-4 text-yellow-400" />;
    case 'MEMBER_ADDED':
    case 'WORKSPACE_JOINED': return <UserPlus className="w-4 h-4 text-green-400" />;
    case 'INCOMING_CALL': return <Phone className="w-4 h-4 text-green-400 animate-pulse" />;
    case 'JOB_OFFER_SENT':
    case 'JOB_OFFER_ACCEPTED':
    case 'JOB_OFFER_REJECTED': return <Briefcase className="w-4 h-4 text-indigo-400" />;
    case 'APPLICATION_ACCEPTED': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case 'APPLICATION_REJECTED':
    case 'APPLICATION_WITHDRAWN':
    case 'WORKSPACE_LEFT': return <XCircle className="w-4 h-4 text-red-400" />;
    default: return <Bell className="w-4 h-4 text-primary" />;
  }
};

export const NotificationBell: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, clearAll, dndMode, toggleDND } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const prevUnreadCountRef = useRef(unreadCount);

  // Trigger red blink whenever a new unread notification arrives
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
      setIsBlinking(true);
      const timer = setTimeout(() => setIsBlinking(false), 3000);
      prevUnreadCountRef.current = unreadCount;
      return () => clearTimeout(timer);
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  const handleOpenNotif = (notif: AppNotification) => {
    if (!notif.isRead) markAsRead(notif.id);
    setIsOpen(false);
    if (notif.actionUrl) navigate(notif.actionUrl);
  };

  const handleToggleReply = (e: React.MouseEvent, notif: AppNotification) => {
    e.stopPropagation();
    if (!notif.isRead) markAsRead(notif.id);
    setExpandedId(prev => prev === notif.id ? null : notif.id);
  };

  const handleSendReply = (e: React.MouseEvent | React.FormEvent, notif: AppNotification) => {
    e.stopPropagation();
    e.preventDefault();
    const text = replyText[notif.id]?.trim();
    if (!text || !notif.roomUuid) return;

    setSendingId(notif.id);

    // Send via the global WebSocket client
    try {
      // We import via the window object since globalStompClient is module-level in useWebSocket
      const client = (window as any).__stompClient;
      if (client && client.connected) {
        const tempUuid = `temp-${Date.now()}-${crypto.randomUUID()}`;
        const replyToUuid = notif.metadata?.messageUuid;
        client.publish({
          destination: `/app/chat.sendMessage/${notif.roomUuid}`,
          body: JSON.stringify({
            tempUuid,
            content: text,
            replyToMessageUuid: replyToUuid || undefined,
          }),
        });
        setReplyText(prev => ({ ...prev, [notif.id]: '' }));
        setExpandedId(null);
        // Navigate to the chat so the user can see their reply
        if (notif.actionUrl) {
          setIsOpen(false);
          navigate(notif.actionUrl);
        }
      } else {
        // Fallback: just navigate to the chat
        if (notif.actionUrl) {
          setIsOpen(false);
          navigate(notif.actionUrl);
        }
      }
    } catch {
      if (notif.actionUrl) {
        setIsOpen(false);
        navigate(notif.actionUrl);
      }
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all duration-300 ${
          isBlinking
            ? 'text-red-400 bg-red-500/10'
            : 'text-muted-foreground hover:bg-white/5 hover:text-white'
        }`}
      >
        <Bell
          className={`w-5 h-5 transition-all duration-300 ${isBlinking ? 'text-red-400' : ''}`}
          style={isBlinking ? { animation: 'bellBlink 0.4s ease-in-out infinite' } : {}}
        />
        {unreadCount > 0 && (
          <span
            className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-black transition-colors duration-300 ${
              isBlinking ? 'bg-red-500' : 'bg-primary'
            }`}
            style={isBlinking ? { animation: 'dotBlink 0.4s ease-in-out infinite' } : {}}
          />
        )}
      </button>

      {/* Inject blink keyframes */}
      <style>{`
        @keyframes bellBlink {
          0%, 100% { color: #f87171; filter: drop-shadow(0 0 6px #f87171); }
          50% { color: #fca5a5; filter: drop-shadow(0 0 12px #ef4444); }
        }
        @keyframes dotBlink {
          0%, 100% { background-color: #ef4444; box-shadow: 0 0 6px #ef4444; }
          50% { background-color: #fca5a5; box-shadow: 0 0 10px #ef4444; }
        }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-[380px] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh]"
              style={{ background: 'var(--gb-floating)', backdropFilter: 'blur(var(--gb-blur-floating)) saturate(180%)', WebkitBackdropFilter: 'blur(var(--gb-blur-floating)) saturate(180%)', border: '1px solid var(--gb-border-strong)' }}
            >
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--gb-border)', background: 'var(--gb-surface)', backdropFilter: 'blur(var(--gb-blur-surface))' }}>
                <h3 className="font-bold text-white flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full">{unreadCount}</span>}
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={toggleDND} className={`p-1.5 rounded-lg transition-colors ${dndMode ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/5 text-muted-foreground'}`} title="Do Not Disturb">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button onClick={markAllAsRead} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors" title="Mark all read">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                    <Bell className="w-8 h-8 mb-3 opacity-20" />
                    <p className="text-sm">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`group relative rounded-xl transition-all ${!notif.isRead ? 'border border-primary/20' : 'border border-transparent'}`}
                        style={!notif.isRead ? { background: 'var(--gb-surface)' } : { background: 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--gb-surface)')}
                        onMouseLeave={e => (e.currentTarget.style.background = !notif.isRead ? 'var(--gb-surface)' : 'transparent')}
                      >
                        {/* Main notification row */}
                        <div
                          className="p-3 flex gap-3 items-start cursor-pointer"
                          onClick={() => handleOpenNotif(notif)}
                        >
                          {!notif.isRead && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />}

                          <div className="bg-black/30 w-9 h-9 rounded-full shrink-0 flex items-center justify-center overflow-hidden">
                            {notif.avatarUrl ? (
                              <img src={getImageUrl(notif.avatarUrl)} className="w-full h-full object-cover" alt="Avatar" />
                            ) : (
                              getIcon(notif.type)
                            )}
                          </div>

                          <div className="flex-1 min-w-0 pr-6">
                            <p className="text-xs font-semibold text-white/90 truncate flex items-center gap-1.5">
                              {notif.senderName || notif.title}
                              {notif.roleBadge && <span className="text-[9px] uppercase font-bold bg-white/10 px-1.5 py-0.5 rounded text-muted-foreground">{notif.roleBadge}</span>}
                            </p>
                            {notif.conversationName && <p className="text-[9px] text-primary uppercase font-bold tracking-wider mt-0.5">{notif.conversationName}</p>}
                            <p className={`text-xs mt-0.5 line-clamp-2 ${!notif.isRead ? 'text-white/80' : 'text-muted-foreground'}`}>
                              {notif.type === 'MENTION' ? <span className="text-yellow-400 font-medium">@{notif.senderName} </span> : null}
                              {notif.body}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1.5 flex justify-between items-center">
                              <span>{notif.workspaceName}</span>
                              <span>{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</span>
                            </p>
                          </div>

                          {/* Action buttons shown on hover */}
                          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            {MESSAGE_TYPES.has(notif.type) && notif.roomUuid && (
                              <button
                                onClick={(e) => handleToggleReply(e, notif)}
                                className={`p-1.5 rounded-lg transition-all ${expandedId === notif.id ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}
                                title="Quick reply"
                              >
                                <Reply className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                              className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Inline reply input */}
                        <AnimatePresence>
                          {expandedId === notif.id && MESSAGE_TYPES.has(notif.type) && notif.roomUuid && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                              onClick={e => e.stopPropagation()}
                            >
                              <form
                                className="px-3 pb-3 flex gap-2"
                                onSubmit={(e) => handleSendReply(e, notif)}
                              >
                                <input
                                  autoFocus
                                  type="text"
                                  value={replyText[notif.id] || ''}
                                  onChange={(e) => setReplyText(prev => ({ ...prev, [notif.id]: e.target.value }))}
                                  placeholder={`Reply to ${notif.senderName || 'message'}…`}
                                  className="flex-1 bg-black/40 text-xs rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-primary/50 transition-colors placeholder:text-white/30"
                                />
                                <button
                                  type="submit"
                                  disabled={!replyText[notif.id]?.trim() || sendingId === notif.id}
                                  className="p-2 rounded-lg bg-primary/80 hover:bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                  title="Send reply"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </form>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-2 border-t text-center" style={{ borderColor: 'var(--gb-border)', background: 'var(--gb-surface)', backdropFilter: 'blur(var(--gb-blur-surface))' }}>
                  <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-white transition-colors">
                    Clear all notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
