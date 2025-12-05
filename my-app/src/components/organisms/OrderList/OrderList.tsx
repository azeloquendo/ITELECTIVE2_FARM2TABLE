"use client";
import { Calendar, Phone, User } from "lucide-react";
import { Order } from "../../../interface/seller";
import StatusBadge from "../../atoms/StatusBadge/StatusBadge";
import styles from "./OrderList.module.css";

interface OrderListProps {
  orders: Order[];
  onOrderSelect: (order: Order) => void;
}

export default function OrderList({ orders, onOrderSelect }: OrderListProps) {
  const formatOrderDate = (dateString: string | any) => {
    if (typeof dateString === 'string') {
      return new Date(dateString);
    }
    if (dateString && typeof dateString.toDate === 'function') {
      return dateString.toDate();
    }
    return new Date(dateString);
  };

  if (orders.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No orders found</p>
        <span>Try changing your filters or search term</span>
      </div>
    );
  }

  return (
    <div className={styles.orderGrid}>
      {orders.map(order => (
        <div
          key={order.id}
          className={styles.orderCard}
          onClick={() => onOrderSelect(order)}
        >
          <div className={styles.orderHeader}>
            <div className={styles.orderInfo}>
              <h3 className={styles.orderId}>Order #{order.id.slice(-8)}</h3>
              <div className={styles.buyerContact}>
                <div className={styles.contactItem}>
                  <User size={14} />
                  <span>{order.buyerName}</span>
                </div>
                <div className={styles.contactItem}>
                  <Phone size={14} />
                  <span>{order.contact}</span>
                </div>
              </div>
            </div>
            <StatusBadge status={order.status} />
          </div>
          
          <div className={styles.tableContainer}>
            <div className={styles.orderTable}>
              <div className={styles.tableHeader}>
                <span>Product</span>
                <span>Qty</span>
                <span>Price</span>
                <span>Total</span>
              </div>
              <div className={styles.tableBody}>
                {order.products.map((product, index) => (
                  <div key={index} className={styles.tableRow}>
                    <span className={styles.productName}>{product.name}</span>
                    <span>{product.quantity} {product.unit}</span>
                    <span>₱{product.unitPrice}</span>
                    <span className={styles.rowTotal}>
                      ₱{product.quantity * product.unitPrice}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className={styles.orderFooter}>
            <div className={styles.actionContainer}>
              <button className={styles.viewDetailsBtn}>
                View Details
              </button>
            </div>
            
            <div className={styles.dateTotalContainer}>
              <div className={styles.dateBox}>
                <Calendar size={14} />
                <span>{formatOrderDate(order.orderDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}</span>
              </div>
              <div className={styles.totalSection}>
                <span className={styles.totalLabel}>Total Amount:</span>
                <span className={styles.totalPrice}>₱{order.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

