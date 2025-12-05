// Custom hook for seller dashboard data

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { DashboardStats } from "../../interface/seller";
import {
    fetchDashboardStats,
    fetchFarmName,
    fetchRevenueChartData,
} from "../../services/seller/dashboardService";
import { auth } from "../../utils/lib/firebase";

export const useSellerDashboard = () => {
  const [farmName, setFarmName] = useState("Your Farm");
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<DashboardStats>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    pendingOrders: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    revenueTrend: "+0%",
    lowStockItems: 0,
    outOfStockItems: 0,
    todaysDeliveries: 0,
    completedDeliveries: 0,
  });
  const [weeklyRevenueData, setWeeklyRevenueData] = useState({
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    datasets: [{
      label: 'Revenue',
      data: [0, 0, 0, 0, 0, 0, 0],
      backgroundColor: [
        'rgba(255, 201, 60, 0.8)',
        'rgba(255, 201, 60, 0.7)',
        'rgba(255, 201, 60, 0.9)',
        'rgba(255, 201, 60, 0.7)',
        'rgba(255, 201, 60, 1.0)',
        'rgba(255, 201, 60, 0.9)',
        'rgba(255, 201, 60, 0.6)'
      ],
      borderColor: '#FFC93C',
      borderWidth: 2,
      borderRadius: 12,
      borderSkipped: false,
      barPercentage: 0.6,
      categoryPercentage: 0.7,
    }]
  });
  const [monthlyRevenueData, setMonthlyRevenueData] = useState({
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    datasets: [{
      label: 'Revenue',
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      backgroundColor: [
        'rgba(255, 201, 60, 0.8)',
        'rgba(255, 201, 60, 0.7)',
        'rgba(255, 201, 60, 0.9)',
        'rgba(255, 201, 60, 0.8)',
        'rgba(255, 201, 60, 0.7)',
        'rgba(255, 201, 60, 0.9)',
        'rgba(255, 201, 60, 0.8)',
        'rgba(255, 201, 60, 0.7)',
        'rgba(255, 201, 60, 0.9)',
        'rgba(255, 201, 60, 0.8)',
        'rgba(255, 201, 60, 0.7)',
        'rgba(255, 201, 60, 0.6)'
      ],
      borderColor: '#FFC93C',
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
      barPercentage: 0.7,
      categoryPercentage: 0.8,
    }]
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchDashboardData(user);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchDashboardData = async (user: any) => {
    try {
      setLoading(true);
      const farmNameData = await fetchFarmName(user.uid);
      setFarmName(farmNameData);
      
      const stats = await fetchDashboardStats(user.uid);
      setStatsData(stats);
      
      const chartData = await fetchRevenueChartData(user.uid);
      
      setWeeklyRevenueData(prev => ({
        ...prev,
        datasets: [{
          ...prev.datasets[0],
          data: chartData.weekly.data
        }]
      }));
      
      setMonthlyRevenueData(prev => ({
        ...prev,
        datasets: [{
          ...prev.datasets[0],
          data: chartData.monthly.data
        }]
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const weeklyMetrics = useMemo(() => {
    const weekData = weeklyRevenueData.datasets[0].data;
    const total = weekData.reduce((sum, val) => sum + val, 0);
    const averageDaily = total / weekData.length;
    const highestAmount = Math.max(...weekData);
    const highestDayIndex = weekData.indexOf(highestAmount);
    const highestDay = weeklyRevenueData.labels[highestDayIndex];
    return {
      averageDaily,
      highestDay,
      highestAmount,
      growth: "+15%",
      trend: 'up' as const,
      total,
      currentMonth: new Date().toLocaleString('default', { month: 'long' }),
      currentMonthRevenue: statsData.monthRevenue
    };
  }, [weeklyRevenueData, statsData.monthRevenue]);

  const monthlyMetrics = useMemo(() => {
    const monthData = monthlyRevenueData.datasets[0].data;
    const total = monthData.reduce((sum, val) => sum + val, 0);
    const averageMonthly = total / monthData.length;
    const highestAmount = Math.max(...monthData);
    const highestMonthIndex = monthData.indexOf(highestAmount);
    const highestMonth = monthlyRevenueData.labels[highestMonthIndex];
    return {
      averageMonthly,
      highestMonth,
      highestAmount,
      growth: "+12%",
      trend: 'up' as const,
      total,
      currentMonth: new Date().toLocaleString('default', { month: 'long' }),
      currentMonthRevenue: statsData.monthRevenue,
      averageDaily: statsData.todayRevenue,
      highestDay: 'Today'
    };
  }, [monthlyRevenueData, statsData.monthRevenue, statsData.todayRevenue]);

  return {
    farmName,
    loading,
    statsData,
    weeklyRevenueData,
    monthlyRevenueData,
    weeklyMetrics,
    monthlyMetrics,
    refetch: async () => {
      const user = auth.currentUser;
      if (user) {
        await fetchDashboardData(user);
      }
    },
  };
};

