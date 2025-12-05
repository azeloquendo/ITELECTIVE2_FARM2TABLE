// Notification related service functions
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    where
} from 'firebase/firestore';
import { Notification, TimeFilter } from '../../interface/seller/notification';
import { db } from '../../utils/lib/firebase';

export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
): (() => void) => {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const notifications: Notification[] = [];
    snapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      } as Notification);
    });
    callback(notifications);
  });
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      read: true
    });
  } catch (error: any) {
    console.error("❌ Error marking notification as read:", error);
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );
    
    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { read: true })
    );
    
    await Promise.all(updatePromises);
  } catch (error: any) {
    console.error("❌ Error marking all notifications as read:", error);
    throw new Error(`Failed to mark all notifications as read: ${error.message}`);
  }
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "notifications", notificationId));
  } catch (error: any) {
    console.error("❌ Error deleting notification:", error);
    throw new Error(`Failed to delete notification: ${error.message}`);
  }
};

export const deleteNotifications = async (notificationIds: string[]): Promise<void> => {
  try {
    const deletePromises = notificationIds.map(id => 
      deleteDoc(doc(db, "notifications", id))
    );
    await Promise.all(deletePromises);
  } catch (error: any) {
    console.error("❌ Error deleting notifications:", error);
    throw new Error(`Failed to delete notifications: ${error.message}`);
  }
};

export const filterNotificationsByTime = (
  notifications: Notification[],
  filter: TimeFilter
): Notification[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  return notifications.filter(notification => {
    if (filter === 'all') return true;
    
    const notificationDate = notification.createdAt.toDate();
    
    if (filter === 'today') {
      return notificationDate >= today;
    }
    
    if (filter === 'week') {
      return notificationDate >= weekAgo && notificationDate < today;
    }
    
    if (filter === 'earlier') {
      return notificationDate < weekAgo;
    }
    
    return true;
  });
};

