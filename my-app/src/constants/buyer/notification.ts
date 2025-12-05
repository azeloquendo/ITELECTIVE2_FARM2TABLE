// Buyer notification constants
import { TimeFilter } from '../../interface/buyer/notification';

export const TIME_FILTERS: Array<{ value: TimeFilter; label: string }> = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'earlier', label: 'Earlier' },
];

export const NOTIFICATION_TYPES = {
  ORDER: 'order',
  SYSTEM: 'system',
  PROMOTION: 'promotion',
} as const;

export const NOTIFICATION_CATEGORIES = {
  ORDER_STATUS: 'orderStatus',
  SOCIAL_UPDATES: 'socialUpdates',
  REMINDERS: 'reminders',
  ALL: 'all',
} as const;

