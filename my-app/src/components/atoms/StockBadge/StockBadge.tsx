"use client";
import { STOCK_STATUS_CONFIG } from "../../../constants/seller";
import styles from "./StockBadge.module.css";

interface StockBadgeProps {
  stock: number;
}

export default function StockBadge({ stock }: StockBadgeProps) {
  const getStockStatus = (stock: number): keyof typeof STOCK_STATUS_CONFIG => {
    if (stock === 0) return "out_of_stock";
    if (stock <= 10) return "low_stock";
    return "in_stock";
  };

  const status = getStockStatus(stock);
  const config = STOCK_STATUS_CONFIG[status];

  return (
    <span 
      className={styles.stockBadge}
      style={{ 
        color: config.color, 
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`
      }}
    >
      {config.label}
    </span>
  );
}

