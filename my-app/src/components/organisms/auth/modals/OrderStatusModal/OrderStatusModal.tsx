"use client";
import { AlertTriangle, Truck, X } from "lucide-react";
import styles from "./OrderStatusModal.module.css";

interface OrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentStatus: string;
  newStatus: string;
  orderId: string;
  isUpdating: boolean;
}

const statusConfig = {
  pending: { color: '#F59E0B', bgColor: '#fffbeb', text: 'Pending' },
  processing: { color: '#3b82f6', bgColor: '#eff6ff', text: 'Processing' },
  ready_for_pickup: { color: '#8b5cf6', bgColor: '#faf5ff', text: 'Ready for Pickup' },
  shipped: { color: '#06B6D4', bgColor: '#ecfeff', text: 'Shipped' },
  completed: { color: '#10b981', bgColor: '#ecfdf5', text: 'Completed' },
  canceled: { color: '#ef4444', bgColor: '#fef2f2', text: 'Canceled' }
};

const statusMessages = {
  pending: "Are you sure you want to mark this order as Pending?",
  processing: "Are you sure you want to start processing this order?",
  ready_for_pickup: "Ready for courier pickup? This will trigger logistics options.",
  shipped: "Mark as shipped? Buyer will see tracking information.",
  completed: "Are you sure you want to mark this order as Completed?",
  canceled: "Are you sure you want to cancel this order? This action cannot be undone."
};

export default function OrderStatusModal({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  newStatus,
  orderId,
  isUpdating
}: OrderStatusModalProps) {
  console.log("🔍 OrderStatusModal rendered - isOpen:", isOpen);
  console.log("📊 Props:", { currentStatus, newStatus, orderId, isUpdating });
  
  if (!isOpen) {
    console.log("❌ OrderStatusModal not rendering because isOpen is false");
    return null;
  }

  console.log("✅ OrderStatusModal rendering!");

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || 
           { color: '#6b7280', bgColor: '#f9fafb', text: status };
  };

  const currentConfig = getStatusConfig(currentStatus);
  const newConfig = getStatusConfig(newStatus);

  const getConfirmationMessage = () => {
    return statusMessages[newStatus as keyof typeof statusMessages] || 
           `Are you sure you want to update the order status to ${newConfig.text}?`;
  };

  const shortOrderId = orderId.slice(-8).toUpperCase();

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        {/* Close Button */}
        <button 
          className={styles.closeButton} 
          onClick={onClose}
          disabled={isUpdating}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <AlertTriangle size={24} className={styles.warningIcon} />
          <h3>Confirm Status Update</h3>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          <p className={styles.confirmationMessage}>
            {getConfirmationMessage()}
          </p>
          
          <div className={styles.statusPreview}>
            {/* Current Status */}
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Current:</span>
              <div 
                className={styles.currentStatusBadge}
                style={{
                  color: currentConfig.color,
                  backgroundColor: currentConfig.bgColor,
                  border: `1px solid ${currentConfig.color}20`
                }}
              >
                {currentConfig.text}
              </div>
            </div>
            
            {/* Arrow Icon */}
            <div className={styles.deliveryIcon}>
              <Truck size={20} />
            </div>
            
            {/* New Status */}
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>New:</span>
              <div 
                className={styles.newStatusBadge}
                style={{
                  color: newConfig.color,
                  backgroundColor: newConfig.bgColor,
                  border: `1px solid ${newConfig.color}20`
                }}
              >
                {newConfig.text}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancel
          </button>
          <button
            className={styles.confirmButton}
            onClick={onConfirm}
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : "Confirm Update"}
          </button>
        </div>
      </div>
    </div>
  );
}