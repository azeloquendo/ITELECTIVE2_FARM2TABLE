"use client";
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import { Calendar, DollarSign } from "lucide-react";
import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { CHART_OPTIONS, REVENUE_VIEW_TYPES } from '../../constants/seller/dashboard';
import { useSellerDashboard } from '../../hooks/seller';
import styles from "./seller.module.css";
// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
);
export default function SellerDashboard() {
  const [revenueView, setRevenueView] = useState<"week" | "month">(REVENUE_VIEW_TYPES.WEEK);
  
  // Use dashboard hook
  const {
    farmName,
    loading,
    statsData,
    weeklyRevenueData,
    monthlyRevenueData,
    weeklyMetrics,
    monthlyMetrics,
  } = useSellerDashboard();
  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loading}>Loading dashboard...</div>
      </div>
    );
  }
  const currentData = revenueView === REVENUE_VIEW_TYPES.WEEK ? weeklyRevenueData : monthlyRevenueData;
  const currentMetrics = revenueView === REVENUE_VIEW_TYPES.WEEK ? weeklyMetrics : monthlyMetrics;
  const currentOptions = revenueView === REVENUE_VIEW_TYPES.WEEK ? CHART_OPTIONS.weekly : CHART_OPTIONS.monthly;
  const isWeekly = revenueView === REVENUE_VIEW_TYPES.WEEK;
  return (
    <div className={styles.dashboard}>
      {/* Header Section - Updated to match buyer design */}
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>
              WELCOME BACK, {farmName.toUpperCase()}!
            </h1>
            <p className={styles.subtitle}>Here&apos;s your farm&apos;s performance overview</p>
          </div>
          <div className={styles.dateSection}>
            <div className={styles.dateCard}>
              <Calendar size={16} />
              <span className={styles.date}>
                {new Date().toLocaleDateString('en-PH', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Container */}
      <div className={styles.mainContent}>
        
        {/* Stats Cards Section - Updated to match buyer design */}
        <div className={styles.statsSection}>
          <div className={styles.statsGrid}>
            {/* Today's Orders */}
            <div className={`${styles.statCard} ${styles.statCard0}`}>
              <div className={styles.statCard3d}>
                <div className={styles.statInfo}>
                  <h3 className={styles.statTitle}>Today&apos;s Orders</h3>
                  <p className={styles.statDescription}>Live orders tracking</p>
                  <span className={styles.statValue}>{statsData.today}</span>
                </div>
              </div>
            </div>
            
            {/* This Week's Orders */}
            <div className={`${styles.statCard} ${styles.statCard1}`}>
              <div className={styles.statCard3d}>
                <div className={styles.statInfo}>
                  <h3 className={styles.statTitle}>Weekly Orders</h3>
                  <p className={styles.statDescription}>This week&apos;s performance</p>
                  <span className={styles.statValue}>{statsData.thisWeek}</span>
                </div>
              </div>
            </div>
            
            {/* Revenue Summary */}
            <div className={`${styles.statCard} ${styles.statCard2}`}>
              <div className={styles.statCard3d}>
                <div className={styles.statInfo}>
                  <h3 className={styles.statTitle}>Today&apos;s Revenue</h3>
                  <p className={styles.statDescription}>Total earnings</p>
                  <span className={styles.statValue}>₱{statsData.todayRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {/* Pending Actions */}
            <div className={`${styles.statCard} ${styles.statCard3}`}>
              <div className={styles.statCard3d}>
                <div className={styles.statInfo}>
                  <h3 className={styles.statTitle}>Pending Orders</h3>
                  <p className={styles.statDescription}>Need attention</p>
                  <span className={styles.statValue}>{statsData.pendingOrders}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart Section - Only Revenue chart since we have submenus now */}
        <div className={styles.chartsSection}>
          <div className={`${styles.chartCard} ${styles.revenueChartCard}`}>
            <div className={styles.chartHeader}>
              <div className={styles.chartTitleSection}>
                <DollarSign size={24} />
                <div>
                  <h3>{revenueView === REVENUE_VIEW_TYPES.WEEK ? "Weekly Revenue Trend" : "Monthly Revenue Overview"}</h3>
                  <div className={styles.revenueStats}>
                    <span className={styles.revenueStat}>
                      {isWeekly ? "Avg Daily:" : "Avg Monthly:"} <strong>₱{isWeekly ? currentMetrics.averageDaily.toLocaleString() : currentMetrics.averageMonthly.toLocaleString()}</strong>
                    </span>
                    <span className={styles.revenueStat}>
                      Growth: <strong className={styles.growthPositive}>{currentMetrics.growth}</strong>
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.revenueViewSelector}>
                <button
                  className={`${styles.viewButton} ${revenueView === REVENUE_VIEW_TYPES.WEEK ? styles.active : ""}`}
                  onClick={() => setRevenueView(REVENUE_VIEW_TYPES.WEEK)}
                >
                  This Week
                </button>
                <button
                  className={`${styles.viewButton} ${revenueView === REVENUE_VIEW_TYPES.MONTH ? styles.active : ""}`}
                  onClick={() => setRevenueView(REVENUE_VIEW_TYPES.MONTH)}
                >
                  This Year
                </button>
              </div>
            </div>
            
            <div className={styles.chartContainer}>
              <Bar data={currentData} options={currentOptions} />
            </div>
            
            <div className={styles.chartFooter}>
              <div className={styles.footerStats}>
                <div className={`${styles.footerStat} ${styles.blueOutline}`}>
                  <span className={styles.statLabel}>
                    {isWeekly ? "Peak Day" : "Peak Month"}
                  </span>
                  <span className={styles.statValue}>{isWeekly ? currentMetrics.highestDay : currentMetrics.highestMonth}</span>
                </div>
                <div className={`${styles.footerStat} ${styles.blueOutline}`}>
                  <span className={styles.statLabel}>Peak Revenue</span>
                  <span className={styles.statValue}>₱{currentMetrics.highestAmount.toLocaleString()}</span>
                </div>
                <div className={`${styles.footerStat} ${styles.blueOutline}`}>
                  <span className={styles.statLabel}>
                    {isWeekly ? "Week Total" : "Year Total"}
                  </span>
                  <span className={styles.statValue}>₱{currentMetrics.total.toLocaleString()}</span>
                </div>
              </div>
              {!isWeekly && (
                <div className={styles.currentMonthInfo}>
                  <Calendar size={16} />
                  <span>Current Month ({monthlyMetrics.currentMonth}): ₱{monthlyMetrics.currentMonthRevenue.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}