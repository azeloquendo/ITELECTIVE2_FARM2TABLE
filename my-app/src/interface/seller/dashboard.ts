// Dashboard-related type definitions

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

export interface WeeklyMetrics {
  averageDaily: number;
  highestDay: string;
  highestAmount: number;
  growth: string;
  trend: 'up' | 'down';
  total: number;
  currentMonth: string;
  currentMonthRevenue: number;
}

export interface MonthlyMetrics {
  averageMonthly: number;
  highestMonth: string;
  highestAmount: number;
  growth: string;
  trend: 'up' | 'down';
  total: number;
  currentMonth: string;
  currentMonthRevenue: number;
  averageDaily: number;
  highestDay: string;
}

export type RevenueView = "week" | "month";

