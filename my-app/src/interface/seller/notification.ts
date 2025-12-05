// Notification related type definitions

import { Timestamp } from 'firebase/firestore';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'system' | 'promotion' | 'delivery' | 'follower';
  read: boolean;
  createdAt: Timestamp;
  orderId?: string;
  amount?: string;
  itemCount?: number;
  buyerName?: string;
  sellerName?: string;
  followerName?: string;
  productName?: string;
}

export type TimeFilter = 'today' | 'week' | 'earlier' | 'all';

