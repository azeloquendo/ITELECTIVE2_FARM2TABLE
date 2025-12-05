// Buyer notification interfaces
import { Timestamp } from 'firebase/firestore';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'system' | 'promotion';
  category?: 'orderStatus' | 'socialUpdates' | 'reminders';
  read: boolean;
  createdAt: Timestamp;
  orderId?: string;
  amount?: string;
  itemCount?: number;
  buyerName?: string;
  sellerName?: string;
  productId?: string;
  sellerId?: string;
}

export type NotificationCategory = 'orderStatus' | 'socialUpdates' | 'reminders' | 'all';
export type TimeFilter = 'today' | 'week' | 'earlier' | 'all';

