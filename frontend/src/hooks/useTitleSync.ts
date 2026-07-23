import { useEffect } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useChatStore } from '@/store/useChatStore';

export const useTitleSync = () => {
  const notifications = useNotificationStore(state => state.notifications);
  const unreadCounts = useChatStore(state => state.unreadCounts);

  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.isRead).length;
    const unreadChats = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
    const totalUnread = unreadNotifications + unreadChats;

    if (totalUnread > 0) {
      document.title = `(${totalUnread}) SYNERGi`;
    } else {
      document.title = 'SYNERGi';
    }
  }, [notifications, unreadCounts]);
};
