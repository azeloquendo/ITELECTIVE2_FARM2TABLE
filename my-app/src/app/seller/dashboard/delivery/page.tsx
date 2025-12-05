"use client";
import { Truck } from "lucide-react";
import { useState, useMemo, useEffect } from 'react';
import styles from "./delivery.module.css";
// Firebase imports
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../../../../utils/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
// Chart.js imports
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);
const doughnutOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 20,
        usePointStyle: true,
        pointStyle: 'circle',
        font: {
          size: 14,
          weight: '600'
        }
      }
    },
  },
  cutout: '60%',
};
export default function DeliveryPage() {
  const [deliveryFilter, setDeliveryFilter] = useState<"all" | "pending" | "in-process" | "completed">("all");
  const [deliveryPage, setDeliveryPage] = useState(1);
  const itemsPerPage = 20;
  const [loading, setLoading] = useState(true);
  const [deliveryOrders, setDeliveryOrders] = useState<any[]>([]);
  const [deliveryData, setDeliveryData] = useState({
    labels: ['Pending', 'In Process', 'Completed'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#F59E0B', '#3B82F6', '#10B981'],
        borderWidth: 3,
        borderColor: '#fff',
        hoverOffset: 8
      }
    ]
  });
  // Get today's date range
  const getTodayDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { start: today, end: tomorrow };
  };
  // Fetch delivery data
  const fetchDeliveryData = async (userId: string) => {
    try {
      const ordersRef = collection(db, 'orders');
      const querySnapshot = await getDocs(ordersRef);
      
      const deliveryItems: any[] = [];
      let pendingCount = 0;
      let inProcessCount = 0;
      let completedCount = 0;
      const todayRange = getTodayDateRange();
      
      querySnapshot.forEach((doc) => {
        const order = doc.data();
        
        // Check if this order belongs to the current seller
        const sellerOrders = order.sellers || [];
        const isSellerOrder = sellerOrders.some((seller: any) => seller.sellerId === userId);
        
        if (!isSellerOrder) return;
        const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
        const status = order.status || 'pending';
        
        // Convert status to match your design
        let displayStatus: 'pending' | 'in-process' | 'completed' = 'pending';
        if (status === 'pending') {
          displayStatus = 'pending';
          pendingCount++;
        } else if (status === 'processing' || status === 'shipped') {
          displayStatus = 'in-process';
          inProcessCount++;
        } else if (status === 'completed' || status === 'delivered') {
          displayStatus = 'completed';
          completedCount++;
        }
        
        // Get seller-specific info
        const sellerInfo = sellerOrders.find((seller: any) => seller.sellerId === userId);
        const items = sellerInfo?.items || [];
        deliveryItems.push({
          id: doc.id,
          orderNumber: order.id || `ORD-${doc.id.slice(-4).toUpperCase()}`,
          customer: order.buyerInfo?.name || 'Customer',
          address: order.buyerInfo?.address || 'Address not specified',
          items: items.length,
          total: sellerInfo?.subtotal || 0,
          status: displayStatus,
          scheduledDate: orderDate.toISOString().split('T')[0],
          deliveryTime: '9:00-11:00 AM' // Default time slot
        });
      });
      
      setDeliveryOrders(deliveryItems);
      setDeliveryData({
        labels: ['Pending', 'In Process', 'Completed'],
        datasets: [{
          data: [pendingCount, inProcessCount, completedCount],
          backgroundColor: ['#F59E0B', '#3B82F6', '#10B981'],
          borderWidth: 3,
          borderColor: '#fff',
          hoverOffset: 8
        }]
      });
    } catch (error) {
      console.error('Error fetching delivery data:', error);
    } finally {
      setLoading(false);
    }
  };
  // Fetch data on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchDeliveryData(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);
  // Filter delivery orders based on selected filter
  const filteredDeliveryOrders = useMemo(() => 
    deliveryOrders.filter(order => {
      if (deliveryFilter === "all") return true;
      return order.status === deliveryFilter;
    }), 
    [deliveryOrders, deliveryFilter]
  );
  // Delivery pagination logic
  const deliveryTotalPages = Math.ceil(filteredDeliveryOrders.length / itemsPerPage);
  const deliveryStartIndex = (deliveryPage - 1) * itemsPerPage;
  const currentDeliveryOrders = filteredDeliveryOrders.slice(deliveryStartIndex, deliveryStartIndex + itemsPerPage);
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className={styles.statusBadge} style={{ backgroundColor: '#F59E0B', color: 'white' }}>Pending</span>;
      case "in-process":
        return <span className={styles.statusBadge} style={{ backgroundColor: '#3B82F6', color: 'white' }}>In Process</span>;
      case "completed":
        return <span className={styles.statusBadge} style={{ backgroundColor: '#10B981', color: 'white' }}>Completed</span>;
      default:
        return null;
    }
  };
  const handleDeliveryNextPage = () => {
    if (deliveryPage < deliveryTotalPages) {
      setDeliveryPage(deliveryPage + 1);
    }
  };
  const handleDeliveryPrevPage = () => {
    if (deliveryPage > 1) {
      setDeliveryPage(deliveryPage - 1);
    }
  };
  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loading}>Loading delivery data...</div>
      </div>
    );
  }
  return (
    <div className={styles.dashboard}>
      {/* Header Section - Completely removed */}
      <div className={styles.header}>
        {/* Empty header - text removed */}
      </div>
      <div className={styles.mainContent}>
        <div className={styles.chartsSection}>
          <div className={styles.chartCard}>
            {/* Chart Header - Removed icon and title */}
            <div className={styles.chartHeader}>
              {/* Empty header since we removed the title and icon */}
            </div>
            
            {/* Chart and Filters Container */}
            <div className={styles.chartAndFilters}>
              {/* Larger Chart Container for Delivery */}
              <div className={styles.largeChartContainer}>
                <Doughnut data={deliveryData} options={doughnutOptions} />
              </div>
              
              {/* Delivery Filter Buttons with 3D Style */}
              <div className={styles.inventoryFilters}>
                <button
                  className={`${styles.filterButton} ${deliveryFilter === "all" ? styles.active : ""}`}
                  onClick={() => {
                    setDeliveryFilter("all");
                    setDeliveryPage(1);
                  }}
                >
                  All Orders
                </button>
                <button
                  className={`${styles.filterButton} ${deliveryFilter === "pending" ? styles.active : ""}`}
                  onClick={() => {
                    setDeliveryFilter("pending");
                    setDeliveryPage(1);
                  }}
                >
                  Pending
                </button>
                <button
                  className={`${styles.filterButton} ${deliveryFilter === "in-process" ? styles.active : ""}`}
                  onClick={() => {
                    setDeliveryFilter("in-process");
                    setDeliveryPage(1);
                  }}
                >
                  In Process
                </button>
                <button
                  className={`${styles.filterButton} ${deliveryFilter === "completed" ? styles.active : ""}`}
                  onClick={() => {
                    setDeliveryFilter("completed");
                    setDeliveryPage(1);
                  }}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Table - Separate container below the chart */}
        <div className={styles.tableSection}>
          <div className={styles.inventoryTableContainer}>
            <table className={styles.inventoryTable}>
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Address</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Scheduled Date</th>
                  <th>Delivery Time</th>
                </tr>
              </thead>
              <tbody>
                {currentDeliveryOrders.map((order) => (
                  <tr key={order.id}>
                    <td className={styles.productNameCell}>{order.orderNumber}</td>
                    <td>{order.customer}</td>
                    <td>{order.address}</td>
                    <td>{order.items}</td>
                    <td>₱{order.total.toLocaleString()}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>{new Date(order.scheduledDate).toLocaleDateString()}</td>
                    <td>{order.deliveryTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDeliveryOrders.length === 0 && (
              <div className={styles.noProducts}>
                No orders found for the selected filter.
              </div>
            )}
          </div>
          
          {/* Delivery Pagination Controls */}
          {filteredDeliveryOrders.length > itemsPerPage && (
            <div className={styles.pagination}>
              <button
                className={`${styles.pageButton} ${deliveryPage === 1 ? styles.disabled : ''}`}
                onClick={handleDeliveryPrevPage}
                disabled={deliveryPage === 1}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {deliveryPage} of {deliveryTotalPages}
              </span>
              <button
                className={`${styles.pageButton} ${deliveryPage === deliveryTotalPages ? styles.disabled : ''}`}
                onClick={handleDeliveryNextPage}
                disabled={deliveryPage === deliveryTotalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}