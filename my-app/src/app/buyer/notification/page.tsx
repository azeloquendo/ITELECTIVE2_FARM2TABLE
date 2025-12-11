"use client";
import { AlertTriangle, Bell, Calendar, Clock, Package, ShoppingCart, Sparkles, Star, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import NotificationSubmenu from "../../../components/organisms/submenu/buyer-submenus/NotificationSubmenu";
import DeleteConfirmationModal from "../../../components/organisms/modals/DeleteConfirmationModal/DeleteConfirmationModal";
import { TIME_FILTERS } from "../../../constants/buyer/notification";
import { useBuyerNotifications } from "../../../hooks/buyer";
import styles from "./notification.module.css";

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    filteredNotifications,
    loading,
    selectedNotifications,
    isDeleteMode,
    isDeleteModalOpen,
    isDeleting,
    timeFilter,
    setTimeFilter,
    currentCategory,
    markAsRead,
    markAllAsRead,
    toggleDeleteMode,
    toggleNotificationSelection,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    formatTime,
  } = useBuyerNotifications();

  // Format order ID to match purchase code
  const formatOrderId = (orderId: string | undefined) => {
    if (!orderId) return '';
    
    // If it's a Firestore document ID (like in purchase code), use the full ID
    // If it's a custom order ID, use the last 6 characters like before
    const isFirestoreId = orderId.length === 20; // Firestore IDs are typically 20 chars
    
    if (isFirestoreId) {
      return orderId.toUpperCase();
    } else {
      return `ORD${orderId.slice(-6).toUpperCase()}`;
    }
  };

  // Handle notification click with proper order ID
  const handleNotificationClick = (notification: any) => {
    // Mark as read first
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Handle redirects based on notification type and category
    if (notification.category === 'orderStatus' || notification.type === 'order') {
      // Redirect to purchases page for order status updates
      if (notification.orderId) {
        // Pass the order ID to the purchases page
        router.push(`/buyer/profile/my-purchases?orderId=${notification.orderId}`);
      } else {
        router.push('/buyer/profile/my-purchases');
      }
    } else if (notification.category === 'reminders') {
      // Check if it's a review reminder
      if (notification.message.toLowerCase().includes('review') || 
          notification.message.toLowerCase().includes('rate')) {
        // Redirect to purchases page to review the specific order
        if (notification.orderId) {
          router.push(`/buyer/profile/my-purchases?orderId=${notification.orderId}&tab=to-review`);
        } else {
          router.push('/buyer/profile/my-purchases?tab=to-review');
        }
      } else {
        // Default redirect for other reminders
        router.push('/buyer/profile/my-purchases');
      }
    } else if (notification.category === 'socialUpdates') {
      // Check if it's a new product notification
      if (notification.message.toLowerCase().includes('new product') || 
          notification.message.toLowerCase().includes('posted')) {
        // Redirect to marketplace, optionally with seller ID
        if (notification.sellerId) {
          router.push(`/buyer/marketplace?sellerId=${notification.sellerId}`);
        } else {
          router.push('/buyer/marketplace');
        }
      } else if (notification.productId) {
        // Redirect to specific product
        router.push(`/buyer/marketplace/product/${notification.productId}`);
      } else {
        // Default redirect for other social updates
        router.push('/buyer/marketplace');
      }
    } else {
      // Default redirect
      router.push('/buyer/profile/my-purchases');
    }
  };

  const getNotificationIcon = (category?: string, type?: string, message?: string) => {
    if (category === 'orderStatus') {
      return <Package size={20} />;
    }
    if (category === 'socialUpdates') {
      if (message?.includes('new') || message?.includes('posted')) return <Sparkles size={20} />;
      if (message?.includes('seasonal')) return <Calendar size={20} />;
      if (message?.includes('limited')) return <AlertTriangle size={20} />;
      return <Package size={20} />;
    }
    if (category === 'reminders') {
      if (message?.includes('review')) return <Star size={20} />;
      if (message?.includes('cart')) return <ShoppingCart size={20} />;
      if (message?.includes('subscription')) return <Calendar size={20} />;
      return <Clock size={20} />;
    }
    
    switch (type) {
      case 'order':
        return <Package size={20} />;
      case 'system':
        return <Bell size={20} />;
      case 'promotion':
        return <Users size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const getNotificationIconClass = (category?: string, type?: string) => {
    if (category === 'orderStatus') {
      return `${styles.notificationIcon} ${styles.orderStatus}`;
    }
    if (category === 'socialUpdates') {
      return `${styles.notificationIcon} ${styles.socialUpdates}`;
    }
    if (category === 'reminders') {
      return `${styles.notificationIcon} ${styles.reminders}`;
    }
    
    switch (type) {
      case 'order':
        return `${styles.notificationIcon} ${styles.orderStatus}`;
      case 'system':
        return `${styles.notificationIcon} ${styles.system}`;
      case 'promotion':
        return `${styles.notificationIcon} ${styles.promotion}`;
      default:
        return `${styles.notificationIcon} ${styles.system}`;
    }
  };


  if (loading) {
    return (
      <div className={styles.pageLayout}>
        <div className={styles.submenuContainer}>
          <NotificationSubmenu />
        </div>
        <div className={styles.mainContent}>
          <div className={styles.container}>
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading notifications...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageLayout}>
      <div className={styles.submenuContainer}>
        <NotificationSubmenu />
      </div>
      
      <div className={styles.mainContent}>
        <div className={styles.container}>
          {/* Action Bar with Category Buttons on left and Action Buttons on right */}
          <div className={styles.actionBar}>
            <div className={styles.categoryButtons}>
              {TIME_FILTERS.map(filter => (
                <button
                  key={filter.value}
                  className={`${styles.categoryButton} ${timeFilter === filter.value ? styles.active : ''}`}
                  onClick={() => setTimeFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className={styles.actionButtons}>
              <button 
                className={`${styles.deleteBtn} ${isDeleteMode ? styles.active : ''}`}
                onClick={isDeleteMode ? handleDeleteClick : toggleDeleteMode}
                disabled={isDeleteMode && selectedNotifications.length === 0}
              >
                <Trash2 size={18} />
                {isDeleteMode ? 'Delete Selected' : 'Delete'}
              </button>
              
              {isDeleteMode && (
                <button 
                  className={styles.markAllReadBtn}
                  onClick={toggleDeleteMode}
                >
                  Cancel
                </button>
              )}
              
              {!isDeleteMode && filteredNotifications.length > 0 && filteredNotifications.some(n => !n.read) && (
                <button 
                  className={styles.markAllReadBtn}
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>
          
          {/* Notification Container */}
          <div className={styles.notificationContainer}>
            {filteredNotifications.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔔</div>
                <p>
                  {notifications.length === 0 
                    ? "No notifications yet" 
                    : `No notifications in ${timeFilter}`
                  }
                </p>
                <span>
                  {notifications.length === 0 
                    ? "Your notifications will appear here" 
                    : `You're all caught up for this time period`
                  }
                </span>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`${styles.notificationItem} ${notification.read ? styles.read : styles.unread}`}
                  onClick={() => {
                    if (!isDeleteMode) {
                      handleNotificationClick(notification);
                    }
                  }}
                >
                  {/* Checkbox for delete mode */}
                  {isDeleteMode && (
                    <div className={styles.notificationCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => toggleNotificationSelection(notification.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  
                  <div className={getNotificationIconClass(notification.category, notification.type)}>
                    {getNotificationIcon(notification.category, notification.type, notification.message)}
                  </div>
                  
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationHeader}>
                      <h3 className={styles.notificationTitle}>{notification.title}</h3>
                      <span className={styles.notificationTime}>
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                    
                    <p className={styles.notificationMessage}>{notification.message}</p>
                    
                    {notification.orderId && (
                      <div className={styles.orderDetails}>
                        {/* UPDATED: Use the new formatOrderId function */}
                        <span className={styles.orderId}>
                          Order #{formatOrderId(notification.orderId)}
                        </span>
                        {notification.amount && (
                          <span className={styles.orderAmount}>₱{notification.amount}</span>
                        )}
                        {notification.itemCount && (
                          <span className={styles.itemCount}>{notification.itemCount} item(s)</span>
                        )}
                      </div>
                    )}
                    
                    {/* Additional context for social updates */}
                    {notification.category === 'socialUpdates' && notification.sellerName && (
                      <div className={styles.sellerDetails}>
                        <span className={styles.sellerName}>From: {notification.sellerName}</span>
                      </div>
                    )}
                  </div>
                  
                  {!notification.read && !isDeleteMode && (
                    <div className={styles.unreadIndicator}></div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            selectedCount={selectedNotifications.length}
            isLoading={isDeleting}
          />
        </div>
      </div>
    </div>
  );
}