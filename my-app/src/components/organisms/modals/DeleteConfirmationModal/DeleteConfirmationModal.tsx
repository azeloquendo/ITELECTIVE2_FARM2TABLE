"use client";
import React from "react";
import { Trash2, X } from "lucide-react";
import styles from "./DeleteConfirmationModal.module.css";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  isLoading?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  isLoading = false
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        {/* Delete Icon */}
        <div className={styles.iconContainer}>
          <Trash2 size={48} className={styles.deleteIcon} />
        </div>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>Delete Conversation{selectedCount !== 1 ? 's' : ''}</h2>
          <p className={styles.subtitle}>
            Are you sure you want to delete {selectedCount} conversation{selectedCount !== 1 ? 's' : ''}? 
            <strong> This action cannot be undone.</strong>
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
            className={styles.deleteButton}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner}></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={18} />
                Delete
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