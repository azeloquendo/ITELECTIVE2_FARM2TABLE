// Seller-related constants

export * from "./dashboard";
export * from "./helpCenter";
export * from "./messages";
export * from "./notification";
export * from "./orders";
export * from "./products";
export * from "./profile";

export const ORDER_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  READY_FOR_PICKUP: "ready_for_pickup",
  SHIPPED: "shipped",
  COMPLETED: "completed",
  CANCELED: "canceled",
} as const;

export const ORDER_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "#F59E0B",
    bgColor: "#FEF3C7",
    borderColor: "#D97706",
  },
  processing: {
    label: "Processing",
    color: "#3B82F6",
    bgColor: "#DBEAFE",
    borderColor: "#1D4ED8",
  },
  ready_for_pickup: {
    label: "Ready for Pickup",
    color: "#8B5CF6",
    bgColor: "#EDE9FE",
    borderColor: "#7C3AED",
  },
  shipped: {
    label: "Shipped",
    color: "#06B6D4",
    bgColor: "#CFFAFE",
    borderColor: "#0891B2",
  },
  completed: {
    label: "Completed",
    color: "#10B981",
    bgColor: "#D1FAE5",
    borderColor: "#047857",
  },
  canceled: {
    label: "Canceled",
    color: "#EF4444",
    bgColor: "#FEE2E2",
    borderColor: "#DC2626",
  },
} as const;

export const STOCK_STATUS_CONFIG = {
  in_stock: {
    label: "In Stock",
    color: "#10b981",
    bgColor: "#ecfdf5",
    borderColor: "#047857",
  },
  low_stock: {
    label: "Low Stock",
    color: "#f59e0b",
    bgColor: "#fffbeb",
    borderColor: "#d97706",
  },
  out_of_stock: {
    label: "Out of Stock",
    color: "#ef4444",
    bgColor: "#fef2f2",
    borderColor: "#dc2626",
  },
} as const;

export const PRODUCT_TAGS = [
  "Fresh Harvest",
  "Premium Quality",
  "Grade A",
  "Organic",
  "Natural",
  "Chemical-Free",
  "Pesticide-Free",
  "Non-GMO",
] as const;

export const PRODUCT_CATEGORIES = [
  "Vegetables",
  "Fruits",
  "Grains",
  "Dairy",
  "Meat",
  "Seafood",
  "Herbs",
  "Seasonal",
  "Local",
] as const;

export const CHART_COLORS = {
  primary: "#FFC93C",
  primaryLight: "rgba(255, 201, 60, 0.8)",
  primaryLighter: "rgba(255, 201, 60, 0.6)",
  text: "#273F4F",
  grid: "rgba(39, 63, 79, 0.05)",
} as const;

export const DATE_RANGES = {
  TODAY: "today",
  WEEK: "week",
  MONTH: "month",
  YEAR: "year",
} as const;

export const SORT_ORDERS = {
  NEWEST: "newest",
  OLDEST: "oldest",
} as const;

