'use client';
import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  children: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  showImageOnMobile?: boolean;
}

export default function AuthLayout({
  children,
  imageSrc = "/images/sample.jpg",
  imageAlt = "Authentication",
  showImageOnMobile = false
}: AuthLayoutProps) {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContainer}>
        {/* Left Side - Image */}
        <div className={`${styles.imageSection} ${!showImageOnMobile ? styles.hideOnMobile : ''}`}>
          <div className={styles.imageContent}>
            <img
              src={imageSrc}
              alt={imageAlt}
              className={styles.image}
            />
          </div>
        </div>
        
        {/* Right Side - Content */}
        <div className={styles.contentSection}>
          <div className={styles.contentContainer}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}