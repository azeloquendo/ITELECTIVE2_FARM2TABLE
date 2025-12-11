"use client";
import React from "react";
import { LogOut, X } from "lucide-react";
import styles from "./LogoutModal.module.css";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  userType?: "buyer" | "seller"; // Add userType prop
}

export default function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  userType = "seller" // Default to seller for backward compatibility
}: LogoutModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  // Dynamic content based on user type
  const getSubtitle = () => {
    if (userType === "buyer") {
      return "Are you sure you want to logout from your buyer account? You'll need to login again to access your account.";
    } else {
      return "Are you sure you want to logout from your seller account? You'll need to login again to access your account.";
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        {/* Logout Icon */}
        <div className={styles.iconContainer}>
          <LogOut size={48} className={styles.logoutIcon} />
        </div>

        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>Logout</h2>
          <p className={styles.subtitle}>
            {getSubtitle()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className={styles.modalActions}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isLoading}
          >
            <X size={18} />
            Cancel
          </button>
          <button
            className={styles.logoutButton}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner}></div>
                Logging out...
              </>
            ) : (
              <>
                <LogOut size={18} />
                Logout
              </>
            )}
          </button>
        </div>

        {/* Close Button */}
        <button
          className={styles.closeButton}
          onClick={onClose}
          disabled={isLoading}
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}