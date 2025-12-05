"use client";
import { ORDER_STATUS_CONFIG } from "../../../constants/seller";
import styles from "./StatusBadge.module.css";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG] || ORDER_STATUS_CONFIG.pending;
  
  return (
    <span
      className={styles.statusBadge}
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
        borderColor: config.borderColor
      }}
    >
      {config.label}
    </span>
  );
}

