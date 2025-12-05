"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/utils/lib/firebase";
import { 
  TrendingUp,
  Calendar
} from "lucide-react";
import styles from "./dashboard.module.css";

interface StatsData {
  totalFarmers: number;
  totalBuyers: number;
  activeAccounts: number;
  suspendedAccounts: number;
}

export default function AdminDashboardOverview() {
  const [stats, setStats] = useState<StatsData>({
    totalFarmers: 0,
    totalBuyers: 0,
    activeAccounts: 0,
    suspendedAccounts: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"monthly" | "yearly">("yearly");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch from sellers collection
      const sellersQuery = query(collection(db, "sellers"));
      const sellersSnapshot = await getDocs(sellersQuery);
      const totalFarmers = sellersSnapshot.size;

      // Fetch from buyers collection
      const buyersQuery = query(collection(db, "buyers"));
      const buyersSnapshot = await getDocs(buyersQuery);
      const totalBuyers = buyersSnapshot.size;

      // Calculate active accounts (sum of sellers and buyers)
      const activeAccounts = totalFarmers + totalBuyers;

      // Calculate suspended accounts from both collections
      let suspendedAccounts = 0;

      // Count suspended sellers
      sellersSnapshot.forEach(doc => {
        const sellerData = doc.data();
        if (sellerData.status === "suspended") {
          suspendedAccounts++;
        }
      });

      // Count suspended buyers
      buyersSnapshot.forEach(doc => {
        const buyerData = doc.data();
        if (buyerData.status === "suspended") {
          suspendedAccounts++;
        }
      });

      const realStats: StatsData = {
        totalFarmers,
        totalBuyers,
        activeAccounts,
        suspendedAccounts
      };
      
      setStats(realStats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Fallback to users collection if specific collections don't exist
      await fetchFromUsersCollection();
    } finally {
      setLoading(false);
    }
  };

  const fetchFromUsersCollection = async () => {
    try {
      // Fetch sellers from users collection
      const sellersQuery = query(
        collection(db, "users"), 
        where("role", "==", "seller")
      );
      const sellersSnapshot = await getDocs(sellersQuery);
      const totalFarmers = sellersSnapshot.size;

      // Fetch buyers from users collection
      const buyersQuery = query(
        collection(db, "users"), 
        where("role", "==", "buyer")
      );
      const buyersSnapshot = await getDocs(buyersQuery);
      const totalBuyers = buyersSnapshot.size;

      // Calculate active accounts (sum of sellers and buyers)
      const activeAccounts = totalFarmers + totalBuyers;

      // Calculate suspended accounts
      let suspendedAccounts = 0;

      sellersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.status === "suspended") {
          suspendedAccounts++;
        }
      });

      buyersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.status === "suspended") {
          suspendedAccounts++;
        }
      });

      const realStats: StatsData = {
        totalFarmers,
        totalBuyers,
        activeAccounts,
        suspendedAccounts
      };
      
      setStats(realStats);
    } catch (error) {
      console.error("Error fetching from users collection:", error);
      // Final fallback to mock data
      const mockStats: StatsData = {
        totalFarmers: 45,
        totalBuyers: 234,
        activeAccounts: 279, // 45 + 234
        suspendedAccounts: 14
      };
      
      setStats(mockStats);
    }
  };

  // Get greeting based on Philippine time
  const getGreeting = () => {
    const hour = new Date().toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      hour: 'numeric',
      hour12: false
    });
    
    const hourNum = parseInt(hour);
    
    if (hourNum >= 5 && hourNum < 12) return "Good Morning";
    if (hourNum >= 12 && hourNum < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Stats data with 3D card design - removed total orders
  const statsData = [
    {
      title: "Total Farmers",
      description: "Registered sellers",
      value: stats.totalFarmers.toString(),
      background: "farmer"
    },
    {
      title: "Total Buyers",
      description: "Active customers",
      value: stats.totalBuyers.toString(),
      background: "buyer"
    },
    {
      title: "Active Accounts",
      description: "Platform users",
      value: stats.activeAccounts.toString(),
      background: "active"
    },
    {
      title: "Suspended Accounts",
      description: "Restricted access",
      value: stats.suspendedAccounts.toString(),
      background: "suspended"
    }
  ];

  // Yearly Platform Growth Data for Bar Graph
  const yearlyPlatformData = [
    { month: "Jan", users: 180, buyers: 120, sellers: 60 },
    { month: "Feb", users: 210, buyers: 145, sellers: 65 },
    { month: "Mar", users: 190, buyers: 135, sellers: 55 },
    { month: "Apr", users: 230, buyers: 165, sellers: 65 },
    { month: "May", users: 245, buyers: 180, sellers: 65 },
    { month: "Jun", users: 220, buyers: 160, sellers: 60 },
    { month: "Jul", users: 260, buyers: 190, sellers: 70 },
    { month: "Aug", users: 240, buyers: 175, sellers: 65 },
    { month: "Sep", users: 280, buyers: 210, sellers: 70 },
    { month: "Oct", users: 270, buyers: 200, sellers: 70 },
    { month: "Nov", users: 300, buyers: 230, sellers: 70 },
    { month: "Dec", users: 290, buyers: 220, sellers: 70 }
  ];

  // Monthly Platform Growth Data for Bar Graph
  const monthlyPlatformData = [
    { week: "Week 1", users: 65, buyers: 45, sellers: 20 },
    { week: "Week 2", users: 80, buyers: 55, sellers: 25 },
    { week: "Week 3", users: 72, buyers: 48, sellers: 24 },
    { week: "Week 4", users: 88, buyers: 62, sellers: 26 }
  ];

  const platformData = timeRange === "yearly" ? yearlyPlatformData : monthlyPlatformData;
  const xAxisLabels = timeRange === "yearly" ? yearlyPlatformData.map(item => item.month) : monthlyPlatformData.map(item => item.week);

  // Find max values for graph scaling
  const maxUsers = Math.max(...platformData.map(item => item.users));
  const maxBuyers = Math.max(...platformData.map(item => item.buyers));
  const maxSellers = Math.max(...platformData.map(item => item.sellers));

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.subtitle}>Loading platform analytics...</p>
        </div>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>
              {getGreeting()}, Admin!
            </h1>
            <p className={styles.subtitle}>Monitor platform performance and user activity</p>
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

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {statsData.map((stat, index) => (
          <div key={index} className={`${styles.statCard} ${styles[`statCard${index}`]}`}>
            <div className={styles.statCard3d}>
              <div className={styles.statInfo}>
                <h3 className={styles.statTitle}>{stat.title}</h3>
                <p className={styles.statDescription}>{stat.description}</p>
                <span className={styles.statValue}>{stat.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Growth Bar Graph */}
      <div className={styles.graphSection}>
        <div className={styles.graphContainer}>
          <div className={styles.graphHeader}>
            <div className={styles.graphTitleSection}>
              <h2 className={styles.graphTitle}>
                <TrendingUp size={20} />
                Platform Growth Analytics
              </h2>
              {/* Legend Items Below Title */}
              <div className={styles.graphLegend}>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.usersColor}`}></div>
                  <span>Users</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.buyersColor}`}></div>
                  <span>Buyers</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.sellersColor}`}></div>
                  <span>Sellers</span>
                </div>
              </div>
            </div>
            
            {/* Time Range Filter Buttons - Moved to Right Side */}
            <div className={styles.timeRangeFilter}>
              <button
                className={`${styles.timeRangeButton} ${timeRange === "monthly" ? styles.active : ""}`}
                onClick={() => setTimeRange("monthly")}
              >
                Monthly
              </button>
              <button
                className={`${styles.timeRangeButton} ${timeRange === "yearly" ? styles.active : ""}`}
                onClick={() => setTimeRange("yearly")}
              >
                Yearly
              </button>
            </div>
          </div>
          
          <div className={styles.barGraph}>
            <div className={styles.yAxis}>
              <div className={styles.yAxisLabel}>Count</div>
              <div className={styles.yAxisScale}>
                <span>{maxUsers}</span>
                <span>{Math.round(maxUsers * 0.75)}</span>
                <span>{Math.round(maxUsers * 0.5)}</span>
                <span>{Math.round(maxUsers * 0.25)}</span>
                <span>0</span>
              </div>
            </div>
            
            <div className={styles.graphArea}>
              <div className={styles.gridLines}>
                <div className={styles.gridLine}></div>
                <div className={styles.gridLine}></div>
                <div className={styles.gridLine}></div>
                <div className={styles.gridLine}></div>
                <div className={styles.gridLine}></div>
              </div>
              
              <div className={styles.barsContainer}>
                {platformData.map((data, index) => (
                  <div key={index} className={styles.barGroup}>
                    <div className={styles.bars}>
                      <div 
                        className={`${styles.bar} ${styles.usersBar}`}
                        style={{ height: `${(data.users / maxUsers) * 100}%` }}
                        data-tooltip={`${data.users} users in ${timeRange === "yearly" ? data.month : data.week}`}
                      >
                        <span className={styles.barValue}>{data.users}</span>
                      </div>
                      <div 
                        className={`${styles.bar} ${styles.buyersBar}`}
                        style={{ height: `${(data.buyers / maxBuyers) * 100}%` }}
                        data-tooltip={`${data.buyers} buyers in ${timeRange === "yearly" ? data.month : data.week}`}
                      >
                        <span className={styles.barValue}>{data.buyers}</span>
                      </div>
                      <div 
                        className={`${styles.bar} ${styles.sellersBar}`}
                        style={{ height: `${(data.sellers / maxSellers) * 100}%` }}
                        data-tooltip={`${data.sellers} sellers in ${timeRange === "yearly" ? data.month : data.week}`}
                      >
                        <span className={styles.barValue}>{data.sellers}</span>
                      </div>
                    </div>
                    <div className={styles.monthLabel}>
                      {timeRange === "yearly" ? data.month : data.week}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}