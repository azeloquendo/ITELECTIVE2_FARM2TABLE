"use client";
import { Eye, Search } from "lucide-react";
import { useState } from "react";
import { OrderList, StatusBadge } from "../../../components";
import GenerateReportModal from "../../../components/organisms/order/GenerateReportModal/GenerateReportModal";
import OrderDetails from "../../../components/organisms/order/OrderDetails/OrderDetails";
import { useOrderFilters, useOrderReports, useSellerOrders } from "../../../hooks/seller";
import { Order } from "../../../interface/seller";
import { useCategory } from "../../context/CategoryContext";
import styles from "./orders.module.css";

export default function OrdersPage() {
  const { selectedCategory } = useCategory();
  const { orders, loading, error, currentSellerId, updateStatus } = useSellerOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Use hooks for filtering and reports
  const filteredOrders = useOrderFilters(orders, selectedCategory, searchTerm);
  const {
    showReportModal,
    setShowReportModal,
    generatingReport,
    reportData,
    generateReport,
    exportCSV,
    closeReportModal,
  } = useOrderReports(orders);

  // Handle status updates
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus(orderId, newStatus);
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
      
      if (newStatus === "completed" || newStatus === "canceled") {
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    }
  };


  return (
    <div className={styles.ordersPage}>
      <div className={styles.ordersContent}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            {/* Search Container with Icon */}
            <div className={styles.searchContainer}>
              <Search size={20} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search orders by buyer or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            {/* Generate Report Button - Updated to match fresh arrivals design */}
            <button 
              className={styles.reportButton}
              onClick={() => setShowReportModal(true)}
            >
              Generate Report
            </button>
          </div>
          
          {/* Stats Overview with colored borders and white background */}
          <div className={styles.statsOverview}>
            <div className={`${styles.statCard} ${styles.totalOrdersCard}`}>
              <span className={styles.statNumber}>{orders.length}</span>
              <span className={styles.statLabel}>Total Orders</span>
            </div>
            <div className={`${styles.statCard} ${styles.totalRevenueCard}`}>
              <span className={styles.statNumber}>
                ₱{orders.reduce((sum, order) => sum + order.totalPrice, 0).toFixed(2)}
              </span>
              <span className={styles.statLabel}>Total Revenue</span>
            </div>
            <div className={`${styles.statCard} ${styles.completedCard}`}>
              <span className={styles.statNumber}>
                {orders.filter(order => order.status === "completed").length}
              </span>
              <span className={styles.statLabel}>Completed</span>
            </div>
            <div className={`${styles.statCard} ${styles.pendingCard}`}>
              <span className={styles.statNumber}>
                {orders.filter(order => order.status === "pending").length}
              </span>
              <span className={styles.statLabel}>Pending</span>
            </div>
          </div>
          
          {/* Seller info */}
          {currentSellerId && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Showing orders for your store only
            </div>
          )}
          
          {/* Error Banner */}
          {error && (
            <div className={styles.errorBanner}>
              {error}
            </div>
          )}
        </div>
        
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading your orders...</p>
          </div>
        ) : (
          <>
            {/* ADDED: Simple Orders Table */}
            <div className={styles.tableContainer}>
              <table className={styles.ordersTable}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => (
                      <tr key={order.id}>
                        <td className={styles.orderId}>#{order.id.slice(-8)}</td>
                        <td>
                          <div className={styles.customerInfo}>
                            <strong>{order.buyerName || 'Customer'}</strong>
                            <span>{order.contact || 'No contact'}</span>
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={order.status} />
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button 
                              className={styles.viewBtn}
                              onClick={() => setSelectedOrder(order)}
                              title="View Order Details"
                            >
                              <Eye size={16} />
                              View Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className={styles.noOrders}>
                        <div className={styles.emptyState}>
                          <p>No orders found</p>
                          <span>
                            {searchTerm || selectedCategory !== "all" 
                              ? "Try adjusting your search or filter criteria" 
                              : "You don't have any orders yet. Orders will appear here when customers purchase your products."}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* KEEP EXISTING OrderList COMPONENT */}
            {filteredOrders.length === 0 && !error ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📦</div>
                <h3>No orders found</h3>
                <p>
                  {searchTerm || selectedCategory !== "all" 
                    ? "Try adjusting your search or filter criteria" 
                    : "You don't have any orders yet. Orders will appear here when customers purchase your products."}
                </p>
              </div>
            ) : (
              <OrderList
                orders={filteredOrders}
                onOrderSelect={setSelectedOrder}
              />
            )}
          </>
        )}
      </div>
      
      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
      
      {showReportModal && (
        <GenerateReportModal
          onClose={closeReportModal}
          onGenerateReport={generateReport}
          onExportCSV={exportCSV}
          generatingReport={generatingReport}
          reportData={reportData}
        />
      )}
    </div>
  );
}