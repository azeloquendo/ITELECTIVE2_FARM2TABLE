import React from 'react';
import styles from './PriceBreakdown.module.css';

export interface PriceBreakdownProps {
  marketPrice: number;
  farmerMarkup: number;
  platformFee: number;
  shippingFee: number;
  vatAmount: number;
  finalPrice: number;
  className?: string;
}

const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  marketPrice,
  farmerMarkup,
  platformFee,
  shippingFee,
  vatAmount,
  finalPrice,
  className = ''
}) => {
  return (
    <div className={`${styles.priceBreakdown} ${className}`}>
      <h4 className={styles.title}>💵 Price Breakdown</h4>
      <div className={styles.breakdownList}>
        <div className={styles.breakdownItem}>
          <span>Market Price:</span>
          <span>₱{marketPrice.toFixed(2)}</span>
        </div>
        <div className={styles.breakdownItem}>
          <span>Farmer Income:</span>
          <span className={styles.positive}>+₱{farmerMarkup.toFixed(2)}</span>
        </div>
        {platformFee > 0 && (
          <div className={styles.breakdownItem}>
            <span>Platform Fee:</span>
            <span className={styles.fee}>+₱{platformFee.toFixed(2)}</span>
          </div>
        )}
        <div className={styles.breakdownItem}>
          <span>Delivery Fee:</span>
          <span className={styles.fee}>+₱{shippingFee.toFixed(2)}</span>
        </div>
        <div className={styles.breakdownItem}>
          <span>VAT (12%):</span>
          <span className={styles.tax}>+₱{vatAmount.toFixed(2)}</span>
        </div>
        <div className={styles.total}>
          <span>Total Price:</span>
          <span>₱{finalPrice.toFixed(2)}</span>
        </div>
      </div>
      
      <div className={styles.transparencyNote}>
        <small>💡 This breakdown shows how your payment is distributed</small>
      </div>
    </div>
  );
};

export default PriceBreakdown;