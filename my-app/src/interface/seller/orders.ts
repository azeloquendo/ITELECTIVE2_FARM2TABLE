// Orders-related type definitions

import { OrderProduct } from "./index";

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

export interface GenerateReportModalProps {
  onClose: () => void;
  onGenerateReport: (filters: ReportFilters) => Promise<SalesReport>;
  onExportCSV: (report: SalesReport, filters: ReportFilters) => void;
  generatingReport: boolean;
  reportData: SalesReport | null;
}

export interface OrderDetailsProps {
  order: OrderDetailsData;
  onClose: () => void;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
}

export interface OrderDetailsData {
  id: string;
  buyerId?: string;
  buyerName: string;
  buyerInfo?: {
    id?: string;
    name: string;
    address: string;
    contact: string;
    email: string;
  };
  products: OrderProduct[];
  totalPrice: number;
  orderDate: string;
  status: string;
  contact: string;
  address: string;
  deliveryMethod: string;
  specialInstructions: string;
  sellers?: Array<{
    sellerId: string;
    sellerName: string;
    items: any[];
    subtotal: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
  logistics?: {
    courier: string;
    tracking_number: string;
    cold_chain: boolean;
    delivery_status: string;
  };
  payment?: {
    method: string;
    status: string;
    transactionId?: string;
    paidAt?: string;
  };
  delivery?: {
    method: string;
    time: string;
    estimatedDelivery?: string;
    courier?: string;
    trackingNumber?: string;
  };
  deliveryTime?: string;
}

export interface Courier {
  id: string;
  name: string;
  coldChain: boolean;
  price: number;
}

export interface StatusOption {
  value: string;
  label: string;
  color: string;
}

export interface GenerateReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDetailsData;
}

