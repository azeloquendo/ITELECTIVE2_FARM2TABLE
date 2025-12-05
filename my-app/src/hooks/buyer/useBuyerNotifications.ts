// Buyer notifications hook
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Notification, NotificationCategory, TimeFilter } from '../../interface/buyer/notification';
import {
    deleteNotifications,
    filterNotificationsByCategory,
    filterNotificationsByTime,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    subscribeToBuyerNotifications
} from '../../services/buyer/notificationService';

export const useBuyerNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const pathname = usePathname();

  // Determine current category from URL
  const getCurrentCategory = (): NotificationCategory => {
    if (pathname?.includes('/orderStatus')) return 'orderStatus';
    if (pathname?.includes('/socialUpdates')) return 'socialUpdates';
    if (pathname?.includes('/reminders')) return 'reminders';
    return 'all';
  };

  const currentCategory = getCurrentCategory();

  // Subscribe to notifications
  useEffect(() => {
    const unsubscribe = subscribeToBuyerNotifications((notificationsData) => {
      setNotifications(notificationsData);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Filter notifications
  useEffect(() => {
    let filtered = notifications;
    
    // Filter by category
    filtered = filterNotificationsByCategory(filtered, currentCategory);
    
    // Filter by time
    filtered = filterNotificationsByTime(filtered, timeFilter);
    
    setFilteredNotifications(filtered);
  }, [notifications, currentCategory, timeFilter]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = filteredNotifications
        .filter(n => !n.read)
        .map(n => n.id);
      
      if (unreadIds.length > 0) {
        await markAllNotificationsAsRead(unreadIds);
        setNotifications(prev =>
          prev.map(n => unreadIds.includes(n.id) ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Toggle delete mode
  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    if (isDeleteMode) {
      setSelectedNotifications([]);
    }
  };

  // Toggle notification selection
  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => {
      if (prev.includes(notificationId)) {
        return prev.filter(id => id !== notificationId);
      }
      return [...prev, notificationId];
    });
  };

  // Handle delete click
  const handleDeleteClick = () => {
    if (selectedNotifications.length > 0) {
      setIsDeleteModalOpen(true);
    }
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      setIsDeleting(true);
      await deleteNotifications(selectedNotifications);
      setNotifications(prev =>
        prev.filter(n => !selectedNotifications.includes(n.id))
      );
      setSelectedNotifications([]);
      setIsDeleteMode(false);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting notifications:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    // This will be handled by the component
    return type;
  };

  // Format time
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  return {
    notifications,
    filteredNotifications,
    loading,
    selectedNotifications,
    isDeleteMode,
    isDeleteModalOpen,
    isDeleting,
    timeFilter,
    setTimeFilter,
    currentCategory,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    toggleDeleteMode,
    toggleNotificationSelection,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    getNotificationIcon,
    formatTime,
  };
};

