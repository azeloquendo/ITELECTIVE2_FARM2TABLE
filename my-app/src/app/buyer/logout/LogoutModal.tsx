"use client";
import React from "react";
import { LogOut, X } from "lucide-react";
import styles from "./LogoutModal.module.css";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}: LogoutModalProps) {
  // Prevent background scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        {/* Logout Icon */}
        <div className={styles.iconContainer}>
          <LogOut size={48} className={styles.logoutIcon} />
        </div>

        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>Logout</h2>
          <p className={styles.subtitle}>
            Are you sure you want to logout from your buyer account? You'll need to login again to access your shopping cart and orders.
          </p>
        </div>

        {/* Action Buttons */}
        <div className={styles.modalActions}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isLoading}
            type="button"
          >
            <X size={18} />
            Continue Shopping
          </button>
          <button
            className={styles.logoutButton}
            onClick={handleConfirm}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? (
              <>
                <div className={styles.spinner}></div>
                Logging out...
              </>
            ) : (
              <>
                <LogOut size={18} />
                Yes, Logout
              </>
            )}
          </button>
        </div>

        {/* Close Button */}
        <button
          className={styles.closeButton}
          onClick={onClose}
          disabled={isLoading}
          type="button"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}