// Custom hook for managing notifications
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Notification, TimeFilter } from '../../interface/seller/notification';
import {
    deleteNotification,
    deleteNotifications,
    filterNotificationsByTime,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    subscribeToNotifications
} from '../../services/seller/notificationService';
import { auth } from '../../utils/lib/firebase';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        setupRealTimeListeners(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const setupRealTimeListeners = (userId: string) => {
    setLoading(true);
    
    const unsubscribe = subscribeToNotifications(userId, (notificationsData) => {
      console.log("🛍️ Seller notifications loaded:", notificationsData.length);
      setNotifications(notificationsData);
      setLoading(false);
    });

    return unsubscribe;
  };

  // Filter notifications by time
  useEffect(() => {
    const filtered = filterNotificationsByTime(notifications, timeFilter);
    setFilteredNotifications(filtered);
  }, [notifications, timeFilter]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUserId) return;
    
    try {
      await markAllNotificationsAsRead(currentUserId);
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifications.length === 0) return;
    
    setIsDeleting(true);
    try {
      await deleteNotifications(selectedNotifications);
      setNotifications(prev => 
        prev.filter(notif => !selectedNotifications.includes(notif.id))
      );
      setSelectedNotifications([]);
      setIsDeleteMode(false);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting notifications:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => {
      if (prev.includes(notificationId)) {
        return prev.filter(id => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  return {
    notifications,
    filteredNotifications,
    loading,
    selectedNotifications,
    isDeleteMode,
    setIsDeleteMode,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeleting,
    timeFilter,
    setTimeFilter,
    currentUserId,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDeleteNotification,
    handleDeleteSelected,
    toggleNotificationSelection,
    toggleSelectAll
  };
};

