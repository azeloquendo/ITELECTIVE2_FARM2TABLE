'use client';
import styles from './SuccessModal.module.css';

interface SuccessModalProps {
  onClose: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
}

export default function SuccessModal({
  onClose,
  title = "Success!",
  message = "Operation completed successfully.",
  buttonText = "Continue"
}: SuccessModalProps) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.successIcon}>✅</div>
        
        <h2 className={styles.modalTitle}>{title}</h2>
        
        <p className={styles.modalMessage}>{message}</p>
        
        <button className={styles.modalBtn} onClick={onClose}>
          {buttonText}
        </button>
      </div>
    </div>
  );
}