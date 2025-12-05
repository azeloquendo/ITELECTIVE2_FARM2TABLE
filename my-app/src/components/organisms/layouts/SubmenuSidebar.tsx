"use client";
import Link from "next/link";
import { LucideIcon, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./SubmenuSidebar.module.css";

// 🟢 Your Firebase imports
import { auth } from "../../../utils/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
// 🟢 Import the same profile service you're using
import { getUserProfile } from "../../../utils/lib/profileService";

interface SubmenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  category?: string;
}

interface SubmenuSidebarProps {
  title: string;
  items: SubmenuItem[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  type?: "navigation" | "category";
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface UserProfile {
  fullName: string;
  profilePic: string;
  email: string;
  contact?: string;
}

export default function SubmenuSidebar({ 
  title, 
  items, 
  selectedCategory,
  onCategoryChange,
  type = "navigation",
  isMobileOpen = false,
  onMobileClose
}: SubmenuSidebarProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  
  // 🟢 Updated user state to match your profile service
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);

  // 🟢 UPDATED: Using the same pattern as your profile page
  useEffect(() => {
    setIsMounted(true);
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchUserProfile();
      } else {
        setUserProfile(null);
        setIsLoading(false);
        setImageLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🟢 UPDATED: Same fetch function as your profile page
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setImageLoading(true);
      
      const user = auth.currentUser;
      if (!user) {
        setIsLoading(false);
        setImageLoading(false);
        return;
      }

      console.log("🔄 Fetching profile for sidebar user:", user.uid, user.email);
      
      try {
        const userData = await getUserProfile();
        
        if (userData) {
          console.log("📥 Loaded user data for sidebar:", userData);
          
          setUserProfile({
            fullName: userData.fullName || user.displayName || "User",
            profilePic: userData.profilePic || "",
            email: userData.email || user.email || "",
            contact: userData.contact || ""
          });
        }
      } catch (err: any) {
        // Handle "profile not found" error specifically
        if (err.message === "User profile not found in buyers collection") {
          console.log("🆕 Profile not found for sidebar user:", user.email);
          
          // Set default values for new user
          setUserProfile({
            fullName: user.displayName || "User",
            profilePic: "",
            email: user.email || "",
            contact: ""
          });
        } else {
          console.error('Error fetching profile for sidebar:', err);
          // Fallback to basic user data
          setUserProfile({
            fullName: user.displayName || "User",
            profilePic: "",
            email: user.email || "",
            contact: ""
          });
        }
      }
      
    } catch (err: any) {
      console.error('Error in sidebar profile fetch:', err);
      // Final fallback
      const user = auth.currentUser;
      if (user) {
        setUserProfile({
          fullName: user.displayName || "User",
          profilePic: "",
          email: user.email || "",
          contact: ""
        });
      }
    } finally {
      setIsLoading(false);
      // Don't set imageLoading to false here - let the image handle it
    }
  };

  useEffect(() => {
    console.log("SubmenuSidebar mounted with isMobileOpen:", isMobileOpen);
  }, []);

  useEffect(() => {
    console.log("SubmenuSidebar isMobileOpen changed to:", isMobileOpen);
  }, [isMobileOpen]);

  const isActive = (href: string) => pathname === href;
  const isCategoryActive = (category: string) => selectedCategory === category;

  // 🟢 UPDATED: Get user display name matching your profile structure
  const getDisplayName = (): string => {
    if (!userProfile) return "Guest User";
    return userProfile.fullName || userProfile.email.split('@')[0] || "User";
  };

  // 🟢 UPDATED: Get profile picture matching your profile structure
  const getProfilePicture = (): string => {
    if (!userProfile || !userProfile.profilePic) return "/buyer-profile.jpg";
    return userProfile.profilePic;
  };

  // 🟢 ADDED: Image error handler like your profile page
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn("❌ Sidebar profile image failed to load, using default");
    const target = e.target as HTMLImageElement;
    target.src = "/buyer-profile.jpg";
    target.onerror = null;
    setImageLoading(false);
  };

  // 🟢 ADDED: Image load handler
  const handleImageLoad = () => {
    setImageLoading(false);
    console.log("✅ Sidebar profile image loaded successfully");
  };

  // Render nothing if not mounted
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Mobile Overlay - Only show when mobile menu is open */}
      {isMobileOpen && (
        <div 
          className={styles.mobileOverlay}
          onClick={onMobileClose}
        />
      )}
      
      {/* Main Sidebar */}
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
                    console.log("Category selected:", item.category);
                    onCategoryChange(item.category || "");
                    if (onMobileClose) {
                      onMobileClose();
                    }
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

        {/* 🟢 UPDATED: Buyer Profile Container using same data structure */}
        {!isLoading && (
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
                  alt="Buyer Profile" 
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
              </div>
            </div>
          </div>
        )}

        {/* 🟢 UPDATED: Loading state for profile */}
        {isLoading && (
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