"use client";
import Link from "next/link";
import { LucideIcon, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./SellerSidebar.module.css";
import { SellerProfile } from "../../../utils/lib/sellerProfileService";

interface SubmenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  category?: string;
}

interface SellerSidebarProps {
  title: string;
  items: SubmenuItem[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  type?: "navigation" | "category";
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  sellerProfile?: SellerProfile | null;
}

export default function SellerSidebar({ 
  title, 
  items, 
  selectedCategory,
  onCategoryChange,
  type = "navigation",
  isMobileOpen = false,
  onMobileClose,
  sellerProfile
}: SellerSidebarProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    console.log("🔄 SellerSidebar mounted with profile:", sellerProfile);
  }, [sellerProfile]);

  const isActive = (href: string) => pathname === href;
  const isCategoryActive = (category: string) => selectedCategory === category;

  // 🟢 SIMPLIFIED: Get display name from farm name or full name
  const getDisplayName = (): string => {
    if (!sellerProfile) return "Seller";
    return sellerProfile.farm?.farmName || sellerProfile.fullName || "Seller";
  };

  // 🟢 SIMPLIFIED: Get profile picture directly from farm logo
  const getProfilePicture = (): string => {
    if (!sellerProfile) return "/seller-profile.jpg";
    
    // 🟢 DIRECT ACCESS: sellerProfile.farm.logo contains your Cloudinary URL
    if (sellerProfile.farm?.logo) {
      console.log("📸 Using logo for profile:", sellerProfile.farm.logo);
      return sellerProfile.farm.logo;
    }
    
    return "/seller-profile.jpg";
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn("❌ Seller profile image failed to load");
    const target = e.target as HTMLImageElement;
    target.src = "/seller-profile.jpg";
    target.onerror = null;
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    console.log("✅ Seller profile image loaded successfully");
    setImageLoading(false);
  };

  if (!isMounted) {
    return null;
  }

  console.log("🎨 SellerSidebar rendering with:", {
    hasProfile: !!sellerProfile,
    displayName: getDisplayName(),
    profilePicture: getProfilePicture()
  });

  return (
    <>
      {isMobileOpen && (
        <div 
          className={styles.mobileOverlay}
          onClick={onMobileClose}
        />
      )}
      
      <div className={`${styles.submenuSidebar} ${isMobileOpen ? styles.mobileOpen : ''}`}>
        
        {/* Mobile Header */}
        <div className={styles.mobileHeader}>
          <h3 className={styles.mobileTitle}>{title}</h3>
          <button 
            className={styles.closeButton}
            onClick={onMobileClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Desktop Header */}
        <h3 className={styles.desktopHeader}>{title}</h3>
        
        {/* Navigation Items */}
        <nav className={styles.submenuNav}>
          {items.map((item) => {
            const IconComponent = item.icon;
            
            if (type === "category" && onCategoryChange) {
              return (
                <button
                  key={item.category}
                  onClick={() => {
                    console.log("Seller category selected:", item.category);
                    onCategoryChange(item.category || "");
                    if (onMobileClose) onMobileClose();
                  }}
                  className={`${styles.submenuItem} ${isCategoryActive(item.category || "") ? styles.active : ""}`}
                >
                  <IconComponent size={18} className={styles.submenuIcon} />
                  <span className={styles.submenuText}>{item.label}</span>
                </button>
              );
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.submenuItem} ${isActive(item.href) ? styles.active : ""}`}
                onClick={onMobileClose}
              >
                <IconComponent size={18} className={styles.submenuIcon} />
                <span className={styles.submenuText}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 🟢 SELLER PROFILE SECTION - SIMPLIFIED */}
        {sellerProfile ? (
          <div className={styles.buyerProfileContainer}>
            <div className={styles.buyerProfile}>
              <div className={styles.imageWrapper}>
                {imageLoading && (
                  <div className={styles.imageLoading}>
                    <div className={styles.imageSpinner}></div>
                  </div>
                )}
                <img 
                  src={getProfilePicture()} 
                  alt="Seller Profile" 
                  className={styles.buyerProfilePicture}
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  style={{ opacity: imageLoading ? 0.5 : 1 }}
                />
              </div>
              <div className={styles.buyerInfo}>
                <h4 className={styles.buyerName}>
                  {getDisplayName()}
                </h4>
                {/* Removed contact number and verified seller status */}
              </div>
            </div>
          </div>
        ) : (
          /* 🟢 LOADING STATE WHEN NO PROFILE */
          <div className={styles.buyerProfileContainer}>
            <div className={styles.buyerProfile}>
              <div className={styles.profilePictureSkeleton}></div>
              <div className={styles.buyerInfo}>
                <div className={styles.nameSkeleton}></div>
                <div className={styles.emailSkeleton}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}