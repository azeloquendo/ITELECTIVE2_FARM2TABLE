"use client";
import { Timestamp } from "firebase/firestore";
import {
  AlertCircle,
  Bell,
  Calendar,
  Clock,
  DollarSign,
  Package,
  Trash2,
  Truck,
  UserCheck,
  UserPlus,
  Users
} from "lucide-react";
import { usePathname } from "next/navigation";
import DeleteConfirmationModal from "../../../../components/organisms/auth/modals/DeleteConfirmationModal/DeleteConfirmationModal";
import { TIME_FILTERS } from "../../../../constants/seller/notification";
import { useNotifications } from "../../../../hooks/seller";
import styles from "./notification.module.css";

export default function SellerNotificationsPage() {
  const pathname = usePathname();
  
  const {
    filteredNotifications,
    loading,
    selectedNotifications,
    isDeleteMode,
    setIsDeleteMode,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeleting,
    timeFilter,
    setTimeFilter,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDeleteNotification,
    handleDeleteSelected,
    toggleNotificationSelection,
    toggleSelectAll
  } = useNotifications();

  const getNotificationIcon = (type: string, message?: string) => {
    switch (type) {
      case 'order':
        if (message?.includes('cancelled')) return <AlertCircle size={20} />;
        return <Package size={20} />;
      case 'delivery':
        if (message?.includes('scheduled')) return <Truck size={20} />;
        if (message?.includes('completed')) return <UserCheck size={20} />;
        return <Truck size={20} />;
      case 'system':
        if (message?.includes('stock')) return <AlertCircle size={20} />;
        if (message?.includes('payment')) return <DollarSign size={20} />;
        return <Bell size={20} />;
      case 'follower':
        return <UserPlus size={20} />;
      case 'promotion':
        return <Users size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const getNotificationIconClass = (type: string) => {
    switch (type) {
      case 'order':
        return `${styles.notificationIcon} ${styles.orderStatus}`;
      case 'delivery':
        return `${styles.notificationIcon} ${styles.socialUpdates}`;
      case 'system':
        return `${styles.notificationIcon} ${styles.reminders}`;
      case 'follower':
        return `${styles.notificationIcon} ${styles.promotion}`;
      case 'promotion':
        return `${styles.notificationIcon} ${styles.promotion}`;
      default:
        return `${styles.notificationIcon} ${styles.system}`;
    }
  };

  const formatTime = (timestamp: Timestamp) => {
    if (!timestamp) return 'Recently';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    const diffInHours = diffInMinutes / 60;
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageLayout}>
      <div className={styles.submenuContainer}></div>
      <div className={styles.mainContent}>
        <div className={styles.container}>
          {/* Action Bar */}
          <div className={styles.actionBar}>
            <div className={styles.categoryButtons}>
              <button
                className={`${styles.categoryButton} ${timeFilter === TIME_FILTERS.TODAY ? styles.active : ''}`}
                onClick={() => setTimeFilter(TIME_FILTERS.TODAY)}
              >
                <Clock size={16} />
                Today
              </button>
              <button
                className={`${styles.categoryButton} ${timeFilter === TIME_FILTERS.WEEK ? styles.active : ''}`}
                onClick={() => setTimeFilter(TIME_FILTERS.WEEK)}
              >
                <Calendar size={16} />
                This Week
              </button>
              <button
                className={`${styles.categoryButton} ${timeFilter === TIME_FILTERS.EARLIER ? styles.active : ''}`}
                onClick={() => setTimeFilter(TIME_FILTERS.EARLIER)}
              >
                <Clock size={16} />
                Earlier
              </button>
              <button
                className={`${styles.categoryButton} ${timeFilter === TIME_FILTERS.ALL ? styles.active : ''}`}
                onClick={() => setTimeFilter(TIME_FILTERS.ALL)}
              >
                <Bell size={16} />
                All
              </button>
            </div>
            
            <div className={styles.actionButtons}>
              {!isDeleteMode ? (
                <>
                  <button 
                    className={styles.markAllReadBtn}
                    onClick={handleMarkAllAsRead}
                  >
                    <UserCheck size={16} />
                    Mark All Read
                  </button>
                  <button 
                    className={styles.deleteBtn}
                    onClick={() => setIsDeleteMode(true)}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className={styles.markAllReadBtn}
                    onClick={toggleSelectAll}
                  >
                    {selectedNotifications.length === filteredNotifications.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button 
                    className={styles.deleteBtn}
                    onClick={() => {
                      if (selectedNotifications.length > 0) {
                        setIsDeleteModalOpen(true);
                      } else {
                        setIsDeleteMode(false);
                      }
                    }}
                    disabled={selectedNotifications.length === 0}
                  >
                    <Trash2 size={16} />
                    Delete ({selectedNotifications.length})
                  </button>
                  <button 
                    className={styles.markAllReadBtn}
                    onClick={() => setIsDeleteMode(false)}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Notification Container */}
          <div className={styles.notificationContainer}>
            {filteredNotifications.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔔</div>
                <p>
                  {timeFilter === TIME_FILTERS.ALL 
                    ? "No notifications yet" 
                    : `No notifications in ${timeFilter}`
                  }
                </p>
                <span>
                  {timeFilter === TIME_FILTERS.ALL 
                    ? "Your notifications will appear here when you receive orders or new followers" 
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
                    if (!isDeleteMode && !notification.read) {
                      handleMarkAsRead(notification.id);
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
                  
                  <div className={getNotificationIconClass(notification.type)}>
                    {getNotificationIcon(notification.type, notification.message)}
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
                        {notification.amount && (
                          <span className={styles.orderAmount}>₱{notification.amount}</span>
                        )}
                        {notification.itemCount && (
                          <span className={styles.orderItems}>{notification.itemCount} items</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteSelected}
            selectedCount={selectedNotifications.length}
            isLoading={isDeleting}
          />
        </div>
      </div>
    </div>
  );
}
