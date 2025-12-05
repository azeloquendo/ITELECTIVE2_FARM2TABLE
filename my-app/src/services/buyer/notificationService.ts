// Buyer notification service functions
import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    where
} from 'firebase/firestore';
import { Notification, NotificationCategory, TimeFilter } from '../../interface/buyer/notification';
import { auth, db } from '../../utils/lib/firebase';

// Subscribe to buyer notifications
export const subscribeToBuyerNotifications = (
  callback: (notifications: Notification[]) => void
): (() => void) => {
  const user = auth.currentUser;
  if (!user) {
    callback([]);
    return () => {};
  }

  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];
        callback(notifications);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        // If orderBy fails, try without it
        if (error.code === 'failed-precondition' || error.message?.includes('index')) {
          console.log('⚠️ Index missing, trying query without orderBy...');
          const qWithoutOrder = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid)
          );
          
          return onSnapshot(qWithoutOrder, (snapshot) => {
            const notifications = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Notification[];
            // Sort manually
            notifications.sort((a, b) => {
              const timeA = a.createdAt?.toMillis?.() || 0;
              const timeB = b.createdAt?.toMillis?.() || 0;
              return timeB - timeA;
            });
            callback(notifications);
          });
        } else {
          callback([]);
        }
      }
    );
  } catch (error) {
    console.error('Error setting up notifications subscription:', error);
    return () => {};
  }
};

// Mark notification as read
export const markNotificationAsRead = async (
  notificationId: string
): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (
  notificationIds: string[]
): Promise<void> => {
  try {
    const updatePromises = notificationIds.map((id) =>
      updateDoc(doc(db, 'notifications', id), { read: true })
    );
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (
  notificationId: string
): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Delete multiple notifications
export const deleteNotifications = async (
  notificationIds: string[]
): Promise<void> => {
  try {
    const deletePromises = notificationIds.map((id) =>
      deleteDoc(doc(db, 'notifications', id))
    );
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting notifications:', error);
    throw error;
  }
};

// Filter notifications by category
export const filterNotificationsByCategory = (
  notifications: Notification[],
  category: NotificationCategory
): Notification[] => {
  if (category === 'all') return notifications;

  switch (category) {
    case 'orderStatus':
      return notifications.filter(
        (notif) => notif.category === 'orderStatus' || notif.type === 'order'
      );
    case 'socialUpdates':
      return notifications.filter(
        (notif) =>
          notif.category === 'socialUpdates' ||
          notif.type === 'promotion' ||
          notif.type === 'system'
      );
    case 'reminders':
      return notifications.filter((notif) => notif.category === 'reminders');
    default:
      return notifications;
  }
};

// Filter notifications by time
export const filterNotificationsByTime = (
  notifications: Notification[],
  timeFilter: TimeFilter
): Notification[] => {
  if (timeFilter === 'all') return notifications;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  switch (timeFilter) {
    case 'today':
      return notifications.filter((notif) => {
        const notificationDate = notif.createdAt.toDate();
        return notificationDate >= today;
      });
    case 'week':
      return notifications.filter((notif) => {
        const notificationDate = notif.createdAt.toDate();
        return notificationDate >= weekAgo && notificationDate < today;
      });
    case 'earlier':
      return notifications.filter((notif) => {
        const notificationDate = notif.createdAt.toDate();
        return notificationDate < weekAgo;
      });
    default:
      return notifications;
  }
};

