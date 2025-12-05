"use client";
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, where } from "firebase/firestore";
import { ChevronLeft, ChevronRight, Heart, Info, MapPin, ShieldAlert, ShoppingCart, Snowflake, Star, Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { calculateDeliveryFee, calculateDistance, calculateETA } from "../../../utils/lib/distanceCalculator";
import { auth, db } from "../../../utils/lib/firebase";
import PriceBreakdown from "../PriceBreakdown";
import styles from "./ProductCard.module.css";

// ✅ Buyer verification helpers
const checkBuyerVerification = async (buyerId: string): Promise<{ isVerified: boolean; status: string }> => {
  try {
    if (!buyerId) {
      return { isVerified: false, status: "not_found" };
    }

    const buyerDoc = await getDoc(doc(db, "buyers", buyerId));
    if (!buyerDoc.exists()) {
      return { isVerified: false, status: "not_found" };
    }

    const buyerData = buyerDoc.data();
    const verificationStatus = buyerData.idVerification?.status || "pending";

    return {
      isVerified: verificationStatus === "approved",
      status: verificationStatus,
    };
  } catch (error) {
    console.error("❌ Error checking buyer verification:", error);
    return { isVerified: false, status: "error" };
  }
};

const getVerificationStatusInfo = (status: string) => {
  switch (status) {
    case "approved":
      return {
        text: "Verified",
        color: "#10b981",
        bgColor: "#ecfdf5",
        message: "Your account is verified and you can place orders.",
      };
    case "pending":
      return {
        text: "Verification Pending",
        color: "#f59e0b",
        bgColor: "#fffbeb",
        message: "Your account is under review. You can browse but cannot checkout until verified.",
      };
    case "rejected":
      return {
        text: "Verification Rejected",
        color: "#ef4444",
        bgColor: "#fef2f2",
        message: "Your verification was rejected. Please contact support to resolve this issue.",
      };
    default:
      return {
        text: "Not Verified",
        color: "#6b7280",
        bgColor: "#f9fafb",
        message: "Please complete ID verification to place orders.",
      };
  }
};

// 🟢 Product type (buyer-facing)
interface Product {
  id: string;
  name: string;
  image?: string;
  location: string | any;
  farmName: string;
  price: string;
  unit: string;
  sold: number;
  category?: string;
  description?: string;
  stock?: number;
  imageUrls?: string[];
  rating?: number;
  reviews?: number;
  distance?: string;
  createdAt?: any;
  isNew?: boolean;
  sellerId?: string;
  requiresColdChain?: boolean;
  tags?: string[];
  farmer?: {
    location?: {
      lat: number;
      lng: number;
    };
    barangay?: string;
    displayName?: string;
    fullName?: string;
  };
  smartScore?: number;
  matchReason?: string;
  isSmartMatch?: boolean;
  displayPrice?: string;
  farmerBarangay?: string;
  farmerPrice?: number;
  marketPrice?: number;
  platformFee?: number;
  shippingFee?: number;
  vatAmount?: number;
  finalPrice?: number;
  priceBreakdown?: any;
  estimatedDistance?: number;
  estimatedDeliveryTime?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onSaveItem?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  showNewTag?: boolean;
  currentUserLocation?: { lat: number; lng: number } | null;
  showDeliveryInfo?: boolean;
  showPriceBreakdown?: boolean;
}

const formatLocation = (location: any): string => {
  if (typeof location === "string") return location;
  if (location && typeof location === "object") {
    const addressParts = [location.barangay, location.city, location.province].filter(Boolean);
    return addressParts.length > 0 ? addressParts.join(", ") : "Location not available";
  }
  return "Location not available";
};

export default function ProductCard({
  product,
  onAddToCart,
  onSaveItem,
  onViewDetails,
  showNewTag = true,
  currentUserLocation,
  showDeliveryInfo = true,
  showPriceBreakdown = false,
}: ProductCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [realRating, setRealRating] = useState<{ rating: number; reviewCount: number } | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<{
    distance: number;
    deliveryFee: number;
    etaMinutes: number;
    farmerName: string;
    farmerBarangay: string;
  } | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const [buyerVerification, setBuyerVerification] = useState<{
    isVerified: boolean;
    status: string;
    loading: boolean;
  }>({
    isVerified: false,
    status: "pending",
    loading: true,
  });

  // Saved state
  useEffect(() => {
    const checkIfSaved = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const ref = doc(db, "users", user.uid, "savedItems", product.id);
      const snap = await getDoc(ref);
      if (snap.exists()) setIsSaved(true);
    };
    checkIfSaved();
  }, [product.id]);

  // Buyer verification
  useEffect(() => {
    const checkVerification = async () => {
      const user = auth.currentUser;
      if (user?.uid) {
        setBuyerVerification((prev) => ({ ...prev, loading: true }));
        const verification = await checkBuyerVerification(user.uid);
        setBuyerVerification({ ...verification, loading: false });
      } else {
        setBuyerVerification({
          isVerified: false,
          status: "not_logged_in",
          loading: false,
        });
      }
    };
    checkVerification();
  }, []);

  const verificationInfo = getVerificationStatusInfo(buyerVerification.status);

  // Ratings
  useEffect(() => {
    const fetchRealRating = async () => {
      try {
        const reviewsRef = collection(db, "reviews");
        const reviewsQuery = query(reviewsRef, where("productId", "==", product.id), where("isActive", "==", true), orderBy("createdAt", "desc"));
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));

        if (reviewsData.length > 0) {
          const totalRating = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0);
          const averageRating = totalRating / reviewsData.length;
          setRealRating({
            rating: parseFloat(averageRating.toFixed(1)),
            reviewCount: reviewsData.length,
          });
        } else {
          setRealRating({
            rating: product.rating || 0,
            reviewCount: product.reviews || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching real ratings:", error);
        setRealRating({
          rating: product.rating || 0,
          reviewCount: product.reviews || 0,
        });
      }
    };
    fetchRealRating();
  }, [product.id, product.rating, product.reviews]);

  // Delivery info
  const farmerLocation = product.farmer?.location;
  const farmerName = product.farmer?.displayName || product.farmer?.fullName || product.farmName;

  const farmerBarangay = useMemo(() => {
    if (product.farmer?.barangay) return product.farmer.barangay;
    if (product.farmerBarangay) return product.farmerBarangay;
    if (product.location && typeof product.location === "object") {
      if (product.location.barangay) return product.location.barangay;
    }
    return formatLocation(product.location);
  }, [product.farmer, product.farmerBarangay, product.location]);

  const locationKey = useMemo(() => {
    if (!currentUserLocation || !farmerLocation || !showDeliveryInfo) return null;
    return `${currentUserLocation.lat},${currentUserLocation.lng}-${farmerLocation.lat},${farmerLocation.lng}`;
  }, [currentUserLocation, farmerLocation, showDeliveryInfo]);

  useEffect(() => {
    if (!showDeliveryInfo || !currentUserLocation || !farmerLocation) {
      setDeliveryInfo(null);
      return;
    }
    try {
      const distance = calculateDistance(currentUserLocation.lat, currentUserLocation.lng, farmerLocation.lat, farmerLocation.lng);
      const deliveryFee = calculateDeliveryFee(distance);
      const etaMinutes = calculateETA(distance);
      setDeliveryInfo({
        distance: parseFloat(distance.toFixed(1)),
        deliveryFee: Math.round(deliveryFee),
        etaMinutes: Math.round(etaMinutes),
        farmerName,
        farmerBarangay,
      });
    } catch (error) {
      console.error("Error calculating distance:", error);
      setDeliveryInfo(null);
    }
  }, [locationKey, farmerName, farmerBarangay, showDeliveryInfo]);

  const priceBreakdown = product.priceBreakdown;

  const images = useMemo(() => {
    if (product.imageUrls && product.imageUrls.length > 0) return product.imageUrls;
    if (product.image) return [product.image];
    return ["/images/tomatoes.jpg"];
  }, [product.image, product.imageUrls]);

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
        productDate = new Date(product.createdAt as any);
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

  const getStockDisplay = (): { text: string; status: "in-stock" | "low-stock" | "out-of-stock" } => {
    const stock = product.stock;
    if (stock !== undefined && stock !== null) {
      if (stock === 0) return { text: "Out of Stock", status: "out-of-stock" };
      if (stock <= 10) return { text: `Only ${stock} left`, status: "low-stock" };
      return { text: `${stock} in stock`, status: "in-stock" };
    }
    return { text: `${product.sold} sold`, status: "in-stock" };
  };

  const truncateToSingleLine = (text: string, maxLength: number = 40): string => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to save items.");
      return;
    }
    const savedItemRef = doc(db, "users", user.uid, "savedItems", product.id);
    try {
      if (!isSaved) {
        await setDoc(savedItemRef, {
          ...product,
          realRating: realRating?.rating || product.rating,
          realReviewCount: realRating?.reviewCount || product.reviews,
          savedAt: new Date().toISOString(),
        });
      } else {
        await deleteDoc(savedItemRef);
      }
      setIsSaved(!isSaved);
    } catch (error) {
      console.error("Error saving item:", error);
    }
    if (onSaveItem) onSaveItem(product);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!buyerVerification.loading && !buyerVerification.isVerified) {
      alert(
        `❌ Account Verification Required\n\nYour account needs to be verified before you can add items to cart.\n\nCurrent Status: ${verificationInfo.text}\n\n${verificationInfo.message}`
      );
      return;
    }
    setIsAddingToCart(true);
    try {
      if (onAddToCart) {
        const productWithCompleteFarmerData = {
          ...product,
          farmer: {
            location: product.farmer?.location,
            barangay: farmerBarangay,
            displayName: product.farmer?.displayName || product.farmName,
            fullName: product.farmer?.fullName || product.farmName,
          },
          farmerPrice: product.farmerPrice,
          marketPrice: product.marketPrice,
          platformFee: product.platformFee,
          shippingFee: product.shippingFee,
          vatAmount: product.vatAmount,
          finalPrice: product.finalPrice,
          priceBreakdown: product.priceBreakdown,
        };
        await onAddToCart(productWithCompleteFarmerData);
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleCardClick = () => {
    if (onViewDetails) onViewDetails(product);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
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

  const formatDistance = (km: number): string => {
    if (km < 1) return `${Math.round(km * 1000)}m away`;
    return `${km.toFixed(1)}km away`;
  };

  const handleMouseEnter = () => {
    if (showPriceBreakdown && priceBreakdown) setShowBreakdown(true);
  };
  const handleMouseLeave = () => setShowBreakdown(false);

  const stockInfo = getStockDisplay();
  const isOutOfStock = stockInfo.status === "out-of-stock";
  const truncatedDescription = product.description ? truncateToSingleLine(product.description, 50) : "";
  const formattedLocation = formatLocation(product.location);
  const truncatedLocation = truncateToSingleLine(formattedLocation, 30);
  const truncatedFarmName = truncateToSingleLine(product.farmName, 30);

  const displayRating = realRating?.rating || product.rating || 0;
  const displayReviews = realRating?.reviewCount || product.reviews || 0;

  const displayTags = product.tags ? product.tags.slice(0, 10) : [];
  const hasTags = product.requiresColdChain || displayTags.length > 0;
  const shouldShowDeliveryInfo = showDeliveryInfo && deliveryInfo !== null;

  const displayPrice = product.finalPrice ? product.finalPrice.toString() : product.displayPrice || product.price;
  const isCartButtonDisabled = isAddingToCart || isOutOfStock || !buyerVerification.isVerified;

  return (
    <div
      className={styles.card}
      onClick={handleCardClick}
      onKeyDown={handleKeyPress}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${product.name}`}
    >
      <div className={styles.imageContainer}>
        <div className={`${styles.imageWrapper} ${imageLoaded ? styles.loaded : ""}`}>
          <img
            src={images[currentImageIndex]}
            alt={`${product.name} - Image ${currentImageIndex + 1}`}
            className={styles.productImage}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
          {isNewProduct && <div className={styles.newBookmark}>NEW</div>}
          {!buyerVerification.loading && !buyerVerification.isVerified && (
            <div
              className={styles.verificationBadge}
              style={{
                backgroundColor: verificationInfo.bgColor,
                border: `1px solid ${verificationInfo.color}20`,
                color: verificationInfo.color,
              }}
            >
              <ShieldAlert size={12} />
              <span>{verificationInfo.text}</span>
            </div>
          )}
          {hasMultipleImages && (
            <>
              <button className={styles.navButton} onClick={prevImage} aria-label="Previous image">
                <ChevronLeft size={20} />
              </button>
              <button className={`${styles.navButton} ${styles.navButtonRight}`} onClick={nextImage} aria-label="Next image">
                <ChevronRight size={20} />
              </button>
            </>
          )}
          {hasMultipleImages && (
            <div className={styles.dotsContainer}>
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.dot} ${index === currentImageIndex ? styles.activeDot : ""}`}
                  onClick={(e) => goToImage(index, e)}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
          {!imageLoaded && !imageError && <div className={styles.imagePlaceholder}>Loading...</div>}
          {imageError && <div className={styles.imagePlaceholder}>No Image</div>}
        </div>
        <button
          className={`${styles.saveBtn} ${isSaved ? styles.saved : ""}`}
          onClick={handleSaveClick}
          type="button"
          aria-label={isSaved ? "Remove from saved items" : "Save item"}
        >
          <Heart size={14} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      <div className={styles.metaInfo}>
        {displayRating > 0 && (
          <div className={styles.ratingSection}>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={12} fill={star <= Math.floor(displayRating) ? "#fbbf24" : "none"} color="#fbbf24" />
              ))}
            </div>
            <span className={styles.ratingText}>{displayRating.toFixed(1)} {displayReviews > 0 && `(${displayReviews})`}</span>
          </div>
        )}
        <span className={`${styles.stock} ${styles[stockInfo.status]}`}>{stockInfo.text}</span>
      </div>

      <div className={styles.content}>
        <h3 className={styles.productName}>{product.name}</h3>
        {truncatedDescription && <p className={styles.description}>{truncatedDescription}</p>}

        <div className={`${styles.tagsContainer} ${hasTags ? styles.hasTags : ""}`}>
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

        {priceBreakdown && (
          <div className={styles.priceBreakdownPreview}>
            <div className={styles.breakdownInfo}>
              <Info size={12} />
              <span>Includes delivery & fees</span>
            </div>
          </div>
        )}

        {shouldShowDeliveryInfo && deliveryInfo && (
          <div className={styles.deliveryInfo}>
            <div className={styles.deliveryDetails}>
              <span className={styles.distanceBadge}>🚗 {formatDistance(deliveryInfo.distance)}</span>
              <span className={styles.deliveryFee}>📦 ₱{deliveryInfo.deliveryFee}</span>
              <span className={styles.eta}>⏱️ {deliveryInfo.etaMinutes}min</span>
            </div>
            <div className={styles.farmerInfo}>From {deliveryInfo.farmerName} in {deliveryInfo.farmerBarangay}</div>
          </div>
        )}

        {truncatedDescription && <div className={styles.descriptionSeparator} />}

        <div className={styles.locationInfo}>
          <div className={styles.locationItem}>
            <MapPin size={12} />
            <span className={styles.locationText} title={formattedLocation}>
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
            <span className={styles.price}>₱{displayPrice}</span>
            <span className={styles.unit}>/{product.unit}</span>
            {priceBreakdown && (
              <div className={styles.breakdownIndicator}>
                <Info size={12} />
              </div>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className={`${styles.cartBtn} ${!buyerVerification.isVerified ? styles.verificationRequired : ""}`}
            disabled={isCartButtonDisabled}
            type="button"
            aria-label={!buyerVerification.isVerified ? "Verification required" : isOutOfStock ? "Out of stock" : `Add ${product.name} to cart`}
          >
            {buyerVerification.loading ? (
              <div className={styles.spinner}></div>
            ) : !buyerVerification.isVerified ? (
              <ShieldAlert size={16} />
            ) : isAddingToCart ? (
              <div className={styles.spinner}></div>
            ) : (
              <ShoppingCart size={16} />
            )}
          </button>
        </div>

        {!buyerVerification.loading && !buyerVerification.isVerified && (
          <div className={styles.verificationTooltip}>
            <div className={styles.tooltipContent}>
              <ShieldAlert size={14} />
              <div className={styles.tooltipText}>
                <strong>Verification Required</strong>
                <span>{verificationInfo.message}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPriceBreakdown && showBreakdown && priceBreakdown && (
        <div className={styles.priceBreakdownTooltip}>
          <PriceBreakdown
            marketPrice={priceBreakdown.marketPrice}
            farmerMarkup={priceBreakdown.farmerMarkup}
            platformFee={priceBreakdown.platformFee}
            shippingFee={priceBreakdown.shippingFee}
            vatAmount={priceBreakdown.vatAmount}
            finalPrice={priceBreakdown.finalPrice}
            className={styles.breakdownContent}
          />
        </div>
      )}
    </div>
  );
}

