// Dashboard-related service functions

import { doc, getDoc } from "firebase/firestore";
import { DashboardStats } from "../../interface/seller";
import { db } from "../../utils/lib/firebase";
import { fetchOrdersInDateRange } from "./orderService";

/**
 * Get today's date range
 */
export const getTodayDateRange = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { start: today, end: tomorrow };
};

/**
 * Get this week's date range
 */
export const getThisWeekDateRange = () => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return { start: startOfWeek, end: endOfWeek };
};

/**
 * Get this month's date range
 */
export const getThisMonthDateRange = () => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);
  return { start: startOfMonth, end: endOfMonth };
};

/**
 * Fetch farm name for seller
 */
export const fetchFarmName = async (userId: string): Promise<string> => {
  try {
    const sellerDoc = await getDoc(doc(db, 'sellers', userId));
    
    if (sellerDoc.exists()) {
      const firestoreData = sellerDoc.data();
      return firestoreData.farmName || firestoreData.farm?.farmName || 'Your Farm';
    }
    
    return 'Your Farm';
  } catch (err) {
    console.error('Error fetching farm name:', err);
    return 'Your Farm';
  }
};

/**
 * Fetch dashboard statistics
 */
export const fetchDashboardStats = async (userId: string): Promise<DashboardStats> => {
  try {
    const todayRange = getTodayDateRange();
    const weekRange = getThisWeekDateRange();
    const monthRange = getThisMonthDateRange();
    
    // Fetch orders for each time period
    const todayOrders = await fetchOrdersInDateRange(userId, todayRange.start, todayRange.end);
    const weekOrders = await fetchOrdersInDateRange(userId, weekRange.start, weekRange.end);
    const monthOrders = await fetchOrdersInDateRange(userId, monthRange.start, monthRange.end);
    
    // Calculate stats
    let todayRevenue = 0;
    let weekRevenue = 0;
    let monthRevenue = 0;
    let pendingOrders = 0;
    
    todayOrders.forEach(order => {
      const sellerInfo = order.sellers?.find((seller: any) => seller.sellerId === userId);
      const orderTotal = sellerInfo?.subtotal || order.totalPrice || 0;
      todayRevenue += orderTotal;
      if (order.status === 'pending') pendingOrders++;
    });
    
    weekOrders.forEach(order => {
      const sellerInfo = order.sellers?.find((seller: any) => seller.sellerId === userId);
      const orderTotal = sellerInfo?.subtotal || order.totalPrice || 0;
      weekRevenue += orderTotal;
    });
    
    monthOrders.forEach(order => {
      const sellerInfo = order.sellers?.find((seller: any) => seller.sellerId === userId);
      const orderTotal = sellerInfo?.subtotal || order.totalPrice || 0;
      monthRevenue += orderTotal;
    });
    
    return {
      today: todayOrders.length,
      thisWeek: weekOrders.length,
      thisMonth: monthOrders.length,
      pendingOrders,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      revenueTrend: "+0%",
      lowStockItems: 0,
      outOfStockItems: 0,
      todaysDeliveries: 0,
      completedDeliveries: 0
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

/**
 * Fetch revenue chart data
 */
export const fetchRevenueChartData = async (userId: string) => {
  try {
    const ordersQuery = await fetchOrdersInDateRange(
      userId,
      new Date(0), // Start from beginning
      new Date() // Until now
    );
    
    // Initialize weekly data
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weeklyRevenue = [0, 0, 0, 0, 0, 0, 0];
    
    // Initialize monthly data
    const monthlyRevenue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    ordersQuery.forEach((order: any) => {
      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
      const sellerInfo = order.sellers?.find((seller: any) => seller.sellerId === userId);
      const orderTotal = sellerInfo?.subtotal || 0;
      
      if (orderDate) {
        // Weekly data
        const dayOfWeek = (orderDate.getDay() + 6) % 7; // Convert to Monday-start week
        weeklyRevenue[dayOfWeek] += orderTotal;
        
        // Monthly data
        const month = orderDate.getMonth();
        monthlyRevenue[month] += orderTotal;
      }
    });
    
    return {
      weekly: {
        labels: weekDays,
        data: weeklyRevenue
      },
      monthly: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        data: monthlyRevenue
      }
    };
  } catch (error) {
    console.error('Error fetching revenue chart data:', error);
    throw error;
  }
};

