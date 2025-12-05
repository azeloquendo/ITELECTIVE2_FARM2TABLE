// Orders-related constants

export const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "#F59E0B" },
  { value: "processing", label: "Processing", color: "#3B82F6" },
  { value: "ready_for_pickup", label: "Ready for Pickup", color: "#8B5CF6" },
  { value: "shipped", label: "Shipped", color: "#06B6D4" },
  { value: "completed", label: "Completed", color: "#10B981" },
  { value: "canceled", label: "Canceled", color: "#EF4444" }
] as const;

export const AVAILABLE_COURIERS = [
  { id: 'lalamove', name: 'Lalamove', coldChain: true, price: 120 },
  { id: 'grab', name: 'GrabExpress', coldChain: false, price: 100 },
  { id: 'local', name: 'Local Courier', coldChain: true, price: 80 }
] as const;

export const TRACKING_PREFIX = 'TRK';

export const REPORT_TYPES = {
  SALES: "sales",
  ORDERS: "orders",
  PRODUCTS: "products",
} as const;

export const REPORT_STATUS_FILTERS = {
  ALL: "all",
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  COMPLETED: "completed",
  CANCELED: "canceled",
} as const;

