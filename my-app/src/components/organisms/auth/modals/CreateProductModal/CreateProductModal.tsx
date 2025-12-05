// /components/auth/modals/CreateProductModal/CreateProductModal.tsx

"use client";
import React from 'react';
import styles from './CreateProductModal.module.css';
import { 
  X, 
  Check, 
  Plus, 
  Snowflake,
  Store,
  Tag as TagIcon
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  unit: string;
  farmName: string;
  location: string;
  description?: string;
  requiresColdChain?: boolean;
  tags?: string[];
  images?: string[];
  createdAt?: any;
}

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onCreateAnother?: () => void;
}

export default function CreateProductModal({
  isOpen,
  onClose,
  product,
  onCreateAnother
}: CreateProductModalProps) {
  if (!isOpen || !product) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContainer}>
        <button className={styles.exitBtn} onClick={onClose}>
          <X size={18} />
        </button>
        <div className={styles.successIcon}>
          <Check size={32} />
        </div>
        <h2 className={styles.title}>Product Created Successfully!</h2>
        <p className={styles.subtitle}>
          Your product has been listed and is now visible to buyers. 
          You can manage it from your seller dashboard.
        </p>
        <div className={styles.productInfo}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Product Name</span>
            <span className={styles.infoValue}>{product.name}</span>
          </div>
          
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Price</span>
            <span className={styles.infoValue}>{formatPrice(product.price)}</span>
          </div>
          
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Stock</span>
            <span className={styles.infoValue}>
              {product.stock} {product.unit}
            </span>
          </div>
          
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Category</span>
            <span className={styles.infoValue}>{product.category}</span>
          </div>
          
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>
              <Store size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Farm
            </span>
            <span className={styles.infoValue}>{product.farmName}</span>
          </div>
          
          {product.requiresColdChain && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Delivery</span>
              <span className={styles.infoValue}>
                Cold Chain Required
                <span className={styles.coldChainBadge}>
                  <Snowflake size={12} />
                  Temperature Controlled
                </span>
              </span>
            </div>
          )}
          
          {product.tags && product.tags.length > 0 && (
            <div className={styles.infoItem} style={{ alignItems: 'flex-start' }}>
              <span className={styles.infoLabel}>
                <TagIcon size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Tags
              </span>
              <div className={styles.tagsContainer}>
                {product.tags.map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className={styles.actions}>
          {/* ✅ Create Another button aligned to the right */}
          <button
            className={styles.primaryButton}
            onClick={onCreateAnother}
          >
            <Plus size={18} />
            Create Another
          </button>
        </div>
      </div>
    </div>
  );
}