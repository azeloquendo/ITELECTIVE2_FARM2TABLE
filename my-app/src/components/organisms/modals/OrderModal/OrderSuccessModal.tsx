"use client";
import { X, Check, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./OrderSuccessModal.module.css";

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    id: string;
    orderNumber?: string;
    totalPrice: number;
    deliveryMethod?: string;
    deliveryTime?: string;
    deliveryDate?: string;
    itemCount?: number;
    paymentMethod?: string;
    status?: string;
    buyerInfo?: {
      email?: string;
      name?: string;
    };
    emailSent?: boolean;
  } | null;
}

export default function OrderSuccessModal({
  isOpen,
  onClose,
  orderData
}: OrderSuccessModalProps) {
  const router = useRouter();

  if (!isOpen || !orderData) return null;

  const handleContinueShopping = () => {
    onClose();
    router.push('/buyer/marketplace');
  };

  const handleViewOrders = () => {
    onClose();
    router.push('/buyer/purchases');
  };

  const displayOrderNumber = () => {
    return orderData.orderNumber || orderData.id;
  };

  const formatDeliveryDate = (date: string) => {
    if (!date) return 'Today';
    try {
      const deliveryDate = new Date(date);
      const today = new Date();
      
      if (deliveryDate.toDateString() === today.toDateString()) {
        return 'Today';
      }
      
      return deliveryDate.toLocaleDateString('en-PH', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return date;
    }
  };

  const getPaymentMethodIcon = (method: string = '') => {
    if (method.toLowerCase().includes('cash')) return '💵';
    if (method.toLowerCase().includes('gcash')) return '📱';
    if (method.toLowerCase().includes('card')) return '💳';
    if (method.toLowerCase().includes('maya')) return '📱';
    return '💳';
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        {/* Success Icon */}
        <div className={styles.successIcon}>
          <Check size={24} />
        </div>

        {/* Main Message */}
        <h3 className={styles.messageTitle}>Order Placed Successfully!</h3>
        
        {/* Order Details */}
        <div className={styles.orderDetails}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Order Number:</span>
            <span className={styles.detailValue}>{displayOrderNumber()}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Total Amount:</span>
            <span className={styles.detailPrice}>₱{orderData.totalPrice.toFixed(2)}</span>
          </div>
          
          {/* Additional Order Details */}
          {orderData.itemCount && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Items:</span>
              <span className={styles.detailValue}>{orderData.itemCount} product(s)</span>
            </div>
          )}
          
          {orderData.deliveryMethod && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Delivery:</span>
              <span className={styles.detailValue}>
                {orderData.deliveryMethod === 'Delivery' ? '🚚 Delivery' : '🏪 Pickup'}
              </span>
            </div>
          )}
          
          {orderData.paymentMethod && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Payment:</span>
              <span className={styles.detailValue}>
                {getPaymentMethodIcon(orderData.paymentMethod)} {orderData.paymentMethod}
              </span>
            </div>
          )}
        </div>

        {/* Email Confirmation Section */}
        <div className={styles.emailSection}>
          <div className={styles.emailHeader}>
            <Mail size={14} className={styles.emailIcon} />
            <span>Email Confirmation</span>
          </div>
          <div className={styles.emailContent}>
            <p>
              <strong>You will receive a confirmation email shortly</strong> at{" "}
              <span className={styles.emailAddress}>
                {orderData.buyerInfo?.email || 'your registered email'}
              </span>
            </p>
            <div className={styles.emailFeatures}>
              <span>✓ Complete order details</span>
              <span>✓ Delivery information</span>
              <span>✓ Order tracking updates</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className={styles.additionalInfo}>
          <p>You can track your order in your dashboard.</p>
          <p>We'll notify you when your order is on the way!</p>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button
            onClick={handleViewOrders}
            className={styles.secondaryButton}
          >
            View Orders
          </button>
          <button
            onClick={handleContinueShopping}
            className={styles.continueButton}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}