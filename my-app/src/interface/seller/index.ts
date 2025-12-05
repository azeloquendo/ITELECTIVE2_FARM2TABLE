// Seller-related type definitions

// Export section-specific interfaces
export * from "./dashboard";
export * from "./helpCenter";
export * from "./messages";
export * from "./notification";
export * from "./orders";
export * from "./products";
export * from "./profile";

export interface Product {
  id: string;
  name: string;
  image?: string;
  location: string;
  farmName: string;
  price: string;
  unit: string;
  sold: number;
  category?: string;
  description?: string;
  stock?: number;
  imageUrls?: string[];
  rating?: number;
  reviews?: number;
  distance?: string;
  createdAt?: any;
  isNew?: boolean;
  requiresColdChain?: boolean;
  tags?: string[];
  sellerId?: string;
  productId?: string;
  quantity_available?: number;
  reviewsCount?: number;
}

export interface Order {
  id: string;
  buyerName: string;
  products: OrderProduct[];
  totalPrice: number;
  orderDate: string;
  status: string;
  contact: string;
  address: string;
  deliveryMethod: string;
  specialInstructions?: string;
  sellers?: SellerInfo[];
  isForCurrentSeller: boolean;
  currentSellerItems?: OrderProduct[];
  currentSellerSubtotal?: number;
  payment?: PaymentInfo;
  delivery?: DeliveryInfo;
  deliveryTime?: string;
}

export interface OrderProduct {
  name: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  sellerId?: string;
  productId?: string;
  image?: string;
  notes?: string;
}

export interface SellerInfo {
  sellerId: string;
  sellerName: string;
  items: OrderProduct[];
  subtotal: number;
}

export interface PaymentInfo {
  method: string;
  status: string;
  transactionId?: string;
  paidAt?: string;
}

export interface DeliveryInfo {
  method: string;
  time: string;
  estimatedDelivery?: string;
  courier?: string;
  trackingNumber?: string;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  status: string;
  reportType: "sales" | "orders" | "products";
}

export interface SalesReport {
  totalOrders: number;
  totalRevenue: number;
  completedOrders: number;
  pendingOrders: number;
  canceledOrders: number;
  averageOrderValue: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
}

export interface DashboardStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  pendingOrders: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  revenueTrend: string;
  lowStockItems: number;
  outOfStockItems: number;
  todaysDeliveries: number;
  completedDeliveries: number;
}

export interface SellerData {
  id?: string;
  farmName?: string;
  logo?: string;
  coverPhoto?: string;
  location?: string;
  description?: string;
  rating?: number;
  followerCount?: number;
  isVerified?: boolean;
  gallery?: string[];
  featuredProducts?: any[];
  farmers?: any[];
  address?: {
    region?: string;
    province?: string;
    city?: string;
    barangay?: string;
    location?: string;
  };
  idVerification?: {
    status?: string;
  };
}

export type OrderStatus = 
  | "pending" 
  | "processing" 
  | "ready_for_pickup" 
  | "shipped" 
  | "completed" 
  | "canceled";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

