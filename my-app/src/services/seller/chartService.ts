// Chart data formatting service functions

import { CHART_COLORS, CHART_LABELS } from "../../constants/seller/dashboard";

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string[];
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  borderSkipped: boolean;
  barPercentage: number;
  categoryPercentage: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

/**
 * Format weekly revenue chart data
 */
export const formatWeeklyChartData = (revenueData: number[]): ChartData => {
  return {
    labels: CHART_LABELS.weekly,
    datasets: [{
      label: 'Revenue',
      data: revenueData,
      backgroundColor: CHART_COLORS.weekly.backgroundColor,
      borderColor: CHART_COLORS.weekly.borderColor,
      borderWidth: 2,
      borderRadius: 12,
      borderSkipped: false,
      barPercentage: 0.6,
      categoryPercentage: 0.7,
    }]
  };
};

/**
 * Format monthly revenue chart data
 */
export const formatMonthlyChartData = (revenueData: number[]): ChartData => {
  return {
    labels: CHART_LABELS.monthly,
    datasets: [{
      label: 'Revenue',
      data: revenueData,
      backgroundColor: CHART_COLORS.monthly.backgroundColor,
      borderColor: CHART_COLORS.monthly.borderColor,
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
      barPercentage: 0.7,
      categoryPercentage: 0.8,
    }]
  };
};

/**
 * Calculate weekly metrics from chart data
 */
export const calculateWeeklyMetrics = (weekData: number[], monthRevenue: number) => {
  const total = weekData.reduce((sum, val) => sum + val, 0);
  const averageDaily = total / weekData.length;
  const highestAmount = Math.max(...weekData);
  const highestDayIndex = weekData.indexOf(highestAmount);
  const highestDay = CHART_LABELS.weekly[highestDayIndex];

  return {
    averageDaily,
    highestDay,
    highestAmount,
    growth: "+15%",
    trend: 'up' as const,
    total,
    currentMonth: new Date().toLocaleString('default', { month: 'long' }),
    currentMonthRevenue: monthRevenue
  };
};

/**
 * Calculate monthly metrics from chart data
 */
export const calculateMonthlyMetrics = (monthData: number[], monthRevenue: number, todayRevenue: number) => {
  const total = monthData.reduce((sum, val) => sum + val, 0);
  const averageMonthly = total / monthData.length;
  const highestAmount = Math.max(...monthData);
  const highestMonthIndex = monthData.indexOf(highestAmount);
  const highestMonth = CHART_LABELS.monthly[highestMonthIndex];

  return {
    averageMonthly,
    highestMonth,
    highestAmount,
    growth: "+12%",
    trend: 'up' as const,
    total,
    currentMonth: new Date().toLocaleString('default', { month: 'long' }),
    currentMonthRevenue: monthRevenue,
    averageDaily: todayRevenue,
    highestDay: 'Today'
  };
};

