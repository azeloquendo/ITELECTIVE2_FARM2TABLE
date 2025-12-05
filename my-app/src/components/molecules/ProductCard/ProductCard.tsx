"use client";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ChevronLeft, ChevronRight, Edit, MapPin, Snowflake, Star, Tag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Product } from "../../../interface/seller";
import { db } from "../../../utils/lib/firebase";
import DeleteConfirmationModal from "../../organisms/DeleteConfirmationModal/DeleteConfirmationModal";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  product: Product;
  onUpdate: (product: Product) => void;
  onDelete: (id: string) => void;
  showNewTag?: boolean;
}

export default function ProductCard({ 
  product, 
  onUpdate, 
  onDelete,
  showNewTag = true
}: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [realRating, setRealRating] = useState<{ rating: number; reviewCount: number } | null>(null);

  useEffect(() => {
    const fetchRealRating = async () => {
      try {
        const reviewsRef = collection(db, "reviews");
        const reviewsQuery = query(
          reviewsRef,
          where("productId", "==", product.id),
          where("isActive", "==", true)
        );
        
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (reviewsData.length > 0) {
          const totalRating = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0);
          const averageRating = totalRating / reviewsData.length;
          
          setRealRating({
            rating: parseFloat(averageRating.toFixed(1)),
            reviewCount: reviewsData.length
          });
        } else {
          setRealRating({
            rating: product.rating || 0,
            reviewCount: product.reviews || 0
          });
        }
      } catch (error) {
        console.error("Error fetching real ratings:", error);
        setRealRating({
          rating: product.rating || 0,
          reviewCount: product.reviews || 0
        });
      }
    };
    fetchRealRating();
  }, [product.id, product.rating, product.reviews]);

  const getDisplayImages = (): string[] => {
    if (product.imageUrls && product.imageUrls.length > 0) return product.imageUrls;
    if (product.image) return [product.image];
    return ["/images/tomatoes.jpg"];
  };

  const images = getDisplayImages();
  const hasMultipleImages = images.length > 1;

  const checkIfNew = (): boolean => {
    if (product.isNew !== undefined) return product.isNew;
    
    if (!product.createdAt) return false;
    
    try {
      let productDate: Date;
      
      if (product.createdAt && (product.createdAt as any).toDate) {
        productDate = (product.createdAt as any).toDate();
      } else if (product.createdAt && (product.createdAt as any).seconds) {
        productDate = new Date((product.createdAt as any).seconds * 1000);
      } else {
        productDate = new Date(product.createdAt);
      }
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      return productDate >= oneWeekAgo;
    } catch (error) {
      console.error("Error checking if product is new:", error);
      return false;
    }
  };

  const isNewProduct = showNewTag && checkIfNew();

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
    setImageLoaded(false);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    setImageLoaded(false);
  };

  const goToImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(index);
    setImageLoaded(false);
  };

  const getStockDisplay = (): { text: string; isLow: boolean } => {
    if (product.stock !== undefined) {
      return {
        text: `${product.stock} in stock`,
        isLow: product.stock < 10
      };
    }
    return {
      text: `${product.sold} sold`,
      isLow: false
    };
  };

  const truncateToSingleLine = (text: string, maxLength: number = 40): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleUpdateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUpdate(product);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(product.id);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false);
    }
  };

  const handleCardClick = () => {
    console.log("View product:", product.name);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.warn(`Image failed to load: ${e.currentTarget.src}`);
    setImageError(true);
    setImageLoaded(true);
  };

  const stockInfo = getStockDisplay();
  const truncatedDescription = product.description ? truncateToSingleLine(product.description, 50) : '';
  const truncatedLocation = truncateToSingleLine(product.location, 30);
  const truncatedFarmName = truncateToSingleLine(product.farmName, 30);
  
  const displayRating = realRating?.rating || product.rating || 0;
  const displayReviews = realRating?.reviewCount || product.reviews || 0;
  
  const displayTags = product.tags ? product.tags.slice(0, 10) : [];
  const hasTags = product.requiresColdChain || displayTags.length > 0;

  return (
    <>
      <div 
        className={styles.card} 
        onClick={handleCardClick}
        onKeyDown={handleKeyPress}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${product.name}`}
      >
        <div className={styles.imageContainer}>
          <div className={`${styles.imageWrapper} ${imageLoaded ? styles.loaded : ''}`}>
            <img
              src={images[currentImageIndex]}
              alt={`${product.name} - Image ${currentImageIndex + 1}`}
              className={styles.productImage}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
            />
            
            {isNewProduct && (
              <div className={styles.newBookmark}>NEW</div>
            )}
            
            {hasMultipleImages && (
              <>
                <button 
                  className={styles.navButton} 
                  onClick={prevImage}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  className={`${styles.navButton} ${styles.navButtonRight}`} 
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            
            {hasMultipleImages && (
              <div className={styles.dotsContainer}>
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.dot} ${index === currentImageIndex ? styles.activeDot : ''}`}
                    onClick={(e) => goToImage(index, e)}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
            
            {!imageLoaded && !imageError && (
              <div className={styles.imagePlaceholder}>
                Loading...
              </div>
            )}
            {imageError && (
              <div className={styles.imagePlaceholder}>
                No Image
              </div>
            )}
          </div>
        </div>

        <div className={styles.metaInfo}>
          <div className={styles.ratingSection}>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  size={12} 
                  fill={star <= Math.floor(displayRating) ? "#fbbf24" : "none"}
                  color="#fbbf24"
                />
              ))}
            </div>
            <span className={styles.ratingText}>
              {displayRating.toFixed(1)} {displayReviews > 0 && `(${displayReviews})`}
            </span>
          </div>
          
          <span className={`${styles.stock} ${stockInfo.isLow ? styles.lowStock : ''}`}>
            {stockInfo.text}
          </span>
        </div>
        
        <div className={styles.content}>
          <h3 className={styles.productName}>{product.name}</h3>
          
          {truncatedDescription && (
            <p className={styles.description}>
              {truncatedDescription}
            </p>
          )}
          
          <div className={`${styles.tagsContainer} ${hasTags ? styles.hasTags : ''}`}>
            {product.requiresColdChain && (
              <div className={`${styles.tag} ${styles.coldChainTag}`}>
                <Snowflake size={12} />
                <span>Cold Chain</span>
              </div>
            )}
            {displayTags.map((tag, index) => (
              <div key={index} className={styles.tag}>
                {tag}
              </div>
            ))}
          </div>
          
          {truncatedDescription && <div className={styles.descriptionSeparator} />}
          
          <div className={styles.locationInfo}>
            <div className={styles.locationItem}>
              <MapPin size={12} />
              <span className={styles.locationText} title={product.location}>
                {truncatedLocation}
              </span>
            </div>
            <div className={styles.locationItem}>
              <Tag size={12} />
              <span className={styles.farmText} title={product.farmName}>
                {truncatedFarmName}
              </span>
            </div>
          </div>
          
          <div className={styles.priceSection}>
            <div className={styles.priceInfo}>
              <span className={styles.price}>₱{product.price}</span>
              <span className={styles.unit}>/{product.unit}</span>
            </div>
          </div>

          <div className={styles.sellerActions}>
            <button
              onClick={handleUpdateClick}
              className={styles.updateBtn}
              type="button"
              aria-label={`Update ${product.name}`}
            >
              <Edit size={16} />
              Update
            </button>
            <button 
              onClick={handleDeleteClick}
              className={styles.deleteBtn}
              disabled={isDeleting}
              type="button"
              aria-label={`Delete ${product.name}`}
            >
              <Trash2 size={16} />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
      
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        productName={product.name}
        isLoading={isDeleting}
      />
    </>
  );
}

