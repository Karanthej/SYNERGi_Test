import { useState, useEffect, useRef } from 'react';
import { Bell, Send, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { chatService, type ChatNotificationResponse } from '@/services/chatService';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { getImageUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ──────────────────────────────────────────────────────────────────
type StackedNotification = ChatNotificationResponse & {
  id: string;
  isExpanded?: boolean;
};

// ─── Single Notification Card ────────────────────────────────────────────────
function NotificationCard({
  notification,
  index,
  total,
  isTopCard,
  onDismiss,
  onReply,
  onOpenChat,
  replyingTo,
  replyText,
  setReplyText,
  onSendReply,
}: {
  notification: StackedNotification;
  index: number;
  total: number;
  isTopCard: boolean;
  onDismiss: () => void;
  onReply: () => void;
  onOpenChat: () => void;
  replyingTo: string | null;
  replyText: string;
  setReplyText: (v: string) => void;
  onSendReply: () => void;
}) {
  // Stack offset: cards behind shift up and scale down
  const stackOffset = index * 10;
  const stackScale = 1 - index * 0.04;
  const stackBlur = index > 0 ? `blur(${index * 1.5}px)` : undefined;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.88 }}
      animate={{
        opacity: index > 2 ? 0 : 1 - index * 0.15,
        y: -stackOffset,
        scale: stackScale,
        filter: stackBlur,
        zIndex: total - index,
      }}
      exit={{ opacity: 0, scale: 0.85, y: 20, transition: { duration: 0.25 } }}
      transition={{ type: 'spring', damping: 26, stiffness: 280 }}
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: total - index }}
      className="w-full"
    >
      <div
        className={`
          relative w-full rounded-[22px] overflow-hidden
          border border-white/30 dark:border-white/10
          notification-card-glass
          ${isTopCard ? 'shadow-[0_8px_32px_rgba(0,0,0,0.18)]' : 'shadow-[0_4px_16px_rgba(0,0,0,0.12)]'}
          transition-all duration-300
        `}
        style={{
          background: isTopCard
            ? 'var(--notif-card-bg, rgba(255,255,255,0.82))'
            : 'var(--notif-card-bg-behind, rgba(255,255,255,0.72))',
        }}
      >
        {/* Frosted glass top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

        {/* Content */}
        <div className="p-4 pb-3">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shadow-sm"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
              >
                {notification.startupName.charAt(0)}
              </div>
              <span className="text-[12px] font-semibold text-foreground/80 tracking-wide">
                {notification.startupName}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground font-medium">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: false })}
              </span>
              {isTopCard && (
                <button
                  onClick={onDismiss}
                  className="h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 border-2 border-white/60 dark:border-white/20 shadow-sm flex-shrink-0">
              <AvatarImage src={getImageUrl(notification.senderAvatar) || ''} className="object-cover" />
              <AvatarFallback
                className="text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
              >
                {notification.senderName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground leading-none mb-1">
                {notification.senderName}
              </p>
              <p className="text-[12px] text-foreground/70 leading-relaxed line-clamp-2">
                {notification.content}
              </p>
            </div>
          </div>

          {/* Action Buttons (only on top card) */}
          {isTopCard && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={onReply}
                className="flex-1 h-8 rounded-full text-[11px] font-semibold text-white transition-all active:scale-95 shadow-sm"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
              >
                Reply
              </button>
              <button
                onClick={onOpenChat}
                className="flex-1 h-8 rounded-full text-[11px] font-semibold border border-black/10 dark:border-white/20 text-foreground/80 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-all active:scale-95"
              >
                Open Chat
              </button>
            </div>
          )}

          {/* Reply Input */}
          {isTopCard && replyingTo === notification.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 mt-2 overflow-hidden"
            >
              <Input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type a reply…"
                className="h-8 text-xs flex-1 rounded-full bg-black/5 dark:bg-white/10 border-black/10 dark:border-white/20"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') onSendReply(); }}
              />
              <Button size="sm" className="h-8 w-8 p-0 rounded-full shrink-0" onClick={onSendReply}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Expand Panel (full list) ────────────────────────────────────────────────
function NotificationPanel({
  notifications,
  onDismiss,
  onOpenChat,
  onClose,
  sendMessage,
}: {
  notifications: StackedNotification[];
  onDismiss: (id: string) => void;
  onOpenChat: (startupUuid: string) => void;
  onClose: () => void;
  sendMessage: (roomUuid: string, content: string, replyTo?: string) => void;
}) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = (n: StackedNotification) => {
    if (!replyText.trim()) return;
    sendMessage(n.roomUuid, replyText, n.messageUuid);
    setReplyingTo(null);
    setReplyText('');
    onDismiss(n.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 16 }}
      transition={{ type: 'spring', damping: 26, stiffness: 300 }}
      className="mb-4 w-[360px] max-w-[calc(100vw-48px)] max-h-[520px] flex flex-col rounded-[28px] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.2)] border border-white/30 dark:border-white/10"
      style={{ background: 'var(--panel-bg, rgba(255,255,255,0.82))' }}
    >
      {/* Panel frosted top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent z-10" />

      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b border-black/8 dark:border-white/10 shrink-0"
        style={{ backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
          >
            <Bell className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-[14px] font-bold text-foreground">Notifications</h3>
          {notifications.length > 0 && (
            <span
              className="text-[11px] font-bold text-white px-2 py-0.5 rounded-full"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
            >
              {notifications.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-all"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 no-scrollbar p-3 space-y-2">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Bell className="h-8 w-8 opacity-20 mb-3" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs mt-1 opacity-60">No unread messages</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {notifications.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                className="rounded-[18px] overflow-hidden border border-black/8 dark:border-white/10"
                style={{ background: 'var(--notif-item-bg, rgba(0,0,0,0.04))' }}
              >
                <div className="p-3.5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-5 w-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
                      >
                        {n.startupName.charAt(0)}
                      </div>
                      <span className="text-[11px] font-semibold text-foreground/70">{n.startupName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: false })}
                      </span>
                      <button
                        onClick={() => onDismiss(n.id)}
                        className="h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-all ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex items-start gap-2.5">
                    <Avatar className="h-9 w-9 border-2 border-white/60 dark:border-white/20 shadow-sm flex-shrink-0">
                      <AvatarImage src={getImageUrl(n.senderAvatar) || ''} className="object-cover" />
                      <AvatarFallback
                        className="text-white text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
                      >
                        {n.senderName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-foreground leading-none mb-1">{n.senderName}</p>
                      <p className="text-[11px] text-foreground/65 leading-relaxed line-clamp-2">{n.content}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <button
                      onClick={() => { setReplyingTo(replyingTo === n.id ? null : n.id); setReplyText(''); }}
                      className="flex-1 h-7 rounded-full text-[11px] font-semibold text-white transition-all active:scale-95 shadow-sm"
                      style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => onOpenChat(n.startupUuid)}
                      className="flex-1 h-7 rounded-full text-[11px] font-semibold border border-black/10 dark:border-white/20 text-foreground/80 bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-all active:scale-95"
                    >
                      Open
                    </button>
                  </div>

                  {replyingTo === n.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 mt-2 overflow-hidden"
                    >
                      <Input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type a reply…"
                        className="h-7 text-[11px] flex-1 rounded-full bg-black/5 dark:bg-white/10 border-black/10 dark:border-white/20"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendReply(n); }}
                      />
                      <Button size="sm" className="h-7 w-7 p-0 rounded-full shrink-0" onClick={() => handleSendReply(n)}>
                        <Send className="h-3 w-3" />
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer: Clear All */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-black/8 dark:border-white/10 shrink-0">
          <button
            onClick={() => notifications.forEach((n) => onDismiss(n.id))}
            className="w-full h-8 rounded-full text-[12px] font-semibold text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
          >
            Clear All
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function GlobalChatBubble() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { subscribe, isConnected, sendMessage } = useWebSocket();

  const [notifications, setNotifications] = useState<StackedNotification[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isStackVisible, setIsStackVisible] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Load initial unread notifications
  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  // ── WebSocket subscription
  useEffect(() => {
    if (!subscribe || !isConnected || !user) return;
    const topic = `/topic/user.${user.uuid}.chat-notifications`;
    const unsubscribe = subscribe(topic, (message: any) => {
      const payload: ChatNotificationResponse = JSON.parse(message.body);
      const newNotif: StackedNotification = { ...payload, id: payload.messageUuid };
      setNotifications((prev) => {
        if (prev.find((n) => n.id === payload.messageUuid)) return prev;
        return [newNotif, ...prev];
      });
      // Flash the stack
      setIsStackVisible(true);
    });
    return () => unsubscribe();
  }, [subscribe, isConnected, user, navigate]);

  // ── Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsPanelOpen(false);
        setIsStackVisible(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await chatService.getUnreadNotifications();
      setNotifications(data.map((n) => ({ ...n, id: n.messageUuid })));
    } catch (err) {
      /* console.error removed */
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleOpenChat = (startupUuid: string) => {
    setIsPanelOpen(false);
    setIsStackVisible(false);
    navigate(`/${user?.role.toLowerCase()}/workspace/${startupUuid}/chat`);
  };

  const handleSendReply = (notification: StackedNotification) => {
    if (!replyText.trim()) return;
    sendMessage(notification.roomUuid, replyText, notification.messageUuid);
    setReplyingTo(null);
    setReplyText('');
    dismissNotification(notification.id);
  };

  const handleBellClick = () => {
    if (notifications.length === 0) {
      setIsPanelOpen((prev) => !prev);
      setIsStackVisible(false);
      return;
    }
    if (isStackVisible && !isPanelOpen) {
      setIsPanelOpen(true);
      setIsStackVisible(false);
    } else if (isPanelOpen) {
      setIsPanelOpen(false);
    } else {
      setIsStackVisible((prev) => !prev);
    }
  };

  const unreadCount = notifications.length;
  const stackNotifs = notifications.slice(0, 3); // Show max 3 in stack

  if (!user) return null;

  return (
    <>
      {/* ─── CSS Custom Properties for theme-aware notification colors ── */}
      <style>{`
        :root {
          --notif-card-bg: rgba(255, 255, 255, 0.88);
          --notif-card-bg-behind: rgba(255, 255, 255, 0.76);
          --notif-item-bg: rgba(0, 0, 0, 0.04);
          --panel-bg: rgba(255, 255, 255, 0.88);
        }
        .dark {
          --notif-card-bg: rgba(22, 24, 38, 0.90);
          --notif-card-bg-behind: rgba(18, 20, 32, 0.82);
          --notif-item-bg: rgba(255, 255, 255, 0.05);
          --panel-bg: rgba(16, 18, 30, 0.92);
        }
        .notification-card-glass {
          backdrop-filter: blur(60px) saturate(180%);
          -webkit-backdrop-filter: blur(60px) saturate(180%);
        }
      `}</style>

      <div ref={containerRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end">

        {/* ── Notification Stack (above bell) ── */}
        <AnimatePresence>
          {isStackVisible && !isPanelOpen && stackNotifs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              className="relative mb-4"
              style={{
                width: 320,
                // Height = card height (approx 130px) + stack offset of behind cards
                height: Math.min(stackNotifs.length, 3) * 10 + 150,
              }}
            >
              {/* Render from back to front */}
              {[...stackNotifs].reverse().map((n, revIdx) => {
                const realIdx = stackNotifs.length - 1 - revIdx;
                const isTop = realIdx === 0;
                return (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    index={realIdx}
                    total={stackNotifs.length}
                    isTopCard={isTop}
                    onDismiss={() => dismissNotification(n.id)}
                    onReply={() => setReplyingTo(replyingTo === n.id ? null : n.id)}
                    onOpenChat={() => handleOpenChat(n.startupUuid)}
                    replyingTo={replyingTo}
                    replyText={replyText}
                    setReplyText={setReplyText}
                    onSendReply={() => handleSendReply(n)}
                  />
                );
              })}

              {/* "X more" pill if more than 3 */}
              {unreadCount > 3 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => { setIsPanelOpen(true); setIsStackVisible(false); }}
                  className="absolute -top-8 right-0 h-7 px-3 rounded-full text-[11px] font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
                >
                  +{unreadCount - 3} more
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Full Notification Panel ── */}
        <AnimatePresence>
          {isPanelOpen && (
            <div className="relative mb-4 w-[360px] max-w-[calc(100vw-48px)]">
              <NotificationPanel
                notifications={notifications}
                onDismiss={dismissNotification}
                onOpenChat={handleOpenChat}
                onClose={() => setIsPanelOpen(false)}
                sendMessage={sendMessage}
              />
            </div>
          )}
        </AnimatePresence>

        {/* ── Bell Button ── */}
        <div className="relative">
          {/* Pulse ring when new notifs arrive */}
          {unreadCount > 0 && !isStackVisible && !isPanelOpen && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
              animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />
          )}

          <motion.button
            onClick={handleBellClick}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.06, y: -2 }}
            transition={{ type: 'spring', damping: 18, stiffness: 320 }}
            className="relative h-16 w-16 rounded-full flex items-center justify-center text-white shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden focus:outline-none"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)' }}
          >
            {/* Glossy top sheen */}
            <div className="absolute inset-x-1 top-1 h-1/2 rounded-full bg-white/20 pointer-events-none" />

            <motion.div
              animate={unreadCount > 0 && !isStackVisible && !isPanelOpen
                ? { rotate: [0, -15, 15, -10, 10, 0] }
                : { rotate: 0 }
              }
              transition={{ duration: 0.5, delay: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 4 }}
            >
              {isPanelOpen || isStackVisible
                ? <ChevronDown className="h-6 w-6" />
                : <Bell className="h-6 w-6" />
              }
            </motion.div>
          </motion.button>

          {/* Badge count */}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                key={unreadCount}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 16, stiffness: 400 }}
                className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-white text-[11px] font-bold border-2 border-background shadow-sm px-1"
                style={{ background: 'linear-gradient(135deg, #ff4545, #ff6b6b)' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
