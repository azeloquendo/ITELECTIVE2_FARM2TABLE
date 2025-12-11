'use client';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GalleryProps } from '../../../interface/seller/profile';
import styles from './Gallery.module.css';

export default function Gallery({ images, viewerRole, currentUserId, profileOwnerId }: GalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const openImage = (image: string, index: number) => {
    setSelectedImage(image);
    setCurrentIndex(index);
  };

  const closeImage = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    if (images.length > 0) {
      const nextIndex = (currentIndex + 1) % images.length;
      setCurrentIndex(nextIndex);
      setSelectedImage(images[nextIndex]);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      const prevIndex = (currentIndex - 1 + images.length) % images.length;
      setCurrentIndex(prevIndex);
      setSelectedImage(images[prevIndex]);
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className={styles.gallerySection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Gallery</h2>
        </div>
        <div className={styles.emptyGallery}>
          <Plus size={48} className={styles.emptyIcon} />
          <p>No images in gallery</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gallerySection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Gallery</h2>
        <span className={styles.imageCount}>({images.length} images)</span>
      </div>

      <div className={styles.galleryGrid}>
        {images.map((image, index) => (
          <div 
            key={index} 
            className={styles.galleryItem}
            onClick={() => openImage(image, index)}
          >
            <img 
              src={image} 
              alt={`Gallery image ${index + 1}`}
              className={styles.galleryImage}
            />
            <div className={styles.imageOverlay}>
              <Plus size={24} className={styles.zoomIcon} />
            </div>
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className={styles.imageModal} onClick={closeImage}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={closeImage}>
              <X size={24} />
            </button>
            
            <button className={styles.navButton} onClick={prevImage} style={{ left: '20px' }}>
              <ChevronLeft size={32} />
            </button>
            
            <img 
              src={selectedImage} 
              alt="Selected gallery" 
              className={styles.modalImage}
            />
            
            <button className={styles.navButton} onClick={nextImage} style={{ right: '20px' }}>
              <ChevronRight size={32} />
            </button>
            
            <div className={styles.imageCounter}>
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

