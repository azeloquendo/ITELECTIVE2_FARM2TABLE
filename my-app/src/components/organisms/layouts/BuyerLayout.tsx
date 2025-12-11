"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../../app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext"; // 🟢 ADD AUTH CONTEXT
import DashboardSubmenu from "../submenu/buyer-submenus/DashboardSubmenu";
import MarketplaceSubmenu from "../submenu/buyer-submenus/MarketplaceSubmenu";
import ProfileSubmenu from "../submenu/buyer-submenus/ProfileSubmenu";
import NotificationSubmenu from "../submenu/buyer-submenus/NotificationSubmenu"; 
import LogoutModal from "../modals/LogoutModal/LogoutModal";
import MainSidebar from "../navigation/MainSidebar"; // 🟢 USE BUYER-SPECIFIC SIDEBAR
import styles from "./BuyerLayout.module.css";

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmenuMobileOpen, setIsSubmenuMobileOpen] = useState(false);
  
  // 🟢 USE AUTH CONTEXT
  const { user, userRole, logout } = useAuth();
  
  const pathname = usePathname();
  const router = useRouter();
  const { isCartOpen } = useCart();

  // 🟢 Enhanced route detection from frontend code
  const isMarketplace = pathname?.startsWith("/buyer/marketplace");
  const isDashboard = pathname?.startsWith("/buyer/dashboard");
  const isProfile = pathname?.startsWith("/buyer/profile");
  const isNotification = pathname?.startsWith("/buyer/notification");
  
  const hasSubmenu = isMarketplace || isDashboard || isProfile || isNotification;

  // 🟢 IMPROVED: Role-based route protection
  useEffect(() => {
    console.log("🔐 BuyerLayout - User role:", userRole, "Path:", pathname);
    
    if (userRole === null) {
      // Still loading, wait for auth context
      return;
    }
    
    if (userRole !== 'buyer') {
      console.log("🚫 Non-buyer user trying to access buyer routes:", userRole);
      
      // Redirect to appropriate dashboard based on role
      if (userRole === 'seller') {
        router.push('/seller');
      } else if (userRole === 'admin') {
        router.push('/admin/dashboard');
      } else {
        // No role or not logged in, go to role selection
        router.push('/roleSelection');
      }
      return;
    }
    
    // User is buyer, allow access
  }, [userRole, pathname, router]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 🟢 Debug logging from frontend code
  useEffect(() => {
    console.log("🛒 BuyerLayout - Current route:", pathname);
    console.log("🛒 BuyerLayout - User role:", userRole);
    console.log("🛒 BuyerLayout - isMarketplace:", isMarketplace);
    console.log("🛒 BuyerLayout - isDashboard:", isDashboard);
    console.log("🛒 BuyerLayout - isSubmenuMobileOpen:", isSubmenuMobileOpen);
  }, [pathname, isMarketplace, isDashboard, isSubmenuMobileOpen, userRole]);

  // 🟢 Enhanced submenu handlers from frontend code
  const handleSubmenuToggle = () => {
    console.log("Toggling submenu. Current state:", isSubmenuMobileOpen);
    setIsSubmenuMobileOpen(!isSubmenuMobileOpen);
  };

  const handleSubmenuClose = () => {
    console.log("Closing submenu");
    setIsSubmenuMobileOpen(false);
  };

  // 🟢 IMPROVED: Use AuthContext logout
  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout(); // 🟢 Use AuthContext logout
      console.log("✅ Buyer logged out successfully");
      setIsLogoutModalOpen(false);
      router.push("/roleSelection");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // 🟢 Get the appropriate title for the mobile toggle button from frontend code
  const getSubmenuTitle = () => {
    if (isMarketplace) return "Categories";
    if (isDashboard) return "Dashboard";
    if (isProfile) return "Profile";
    if (isNotification) return "Notifications";
    return "Menu";
  };

  // 🟢 IMPROVED: Show loading when role is not confirmed
  if (!isMounted || userRole === null) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your buyer dashboard...</p>
        </div>
      </div>
    );
  }

  // 🟢 ADDED: Extra protection - don't render if not buyer
  if (userRole !== 'buyer') {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  // 🟢 ADD DEBUG INFO
  console.log("🎯 BuyerLayout rendering - User:", user?.email, "Role:", userRole);

  return (
    <div className={styles.container}>
      {/* 🟢 BuyerMainSidebar with combined props */}
      <MainSidebar 
        onLogoutClick={() => setIsLogoutModalOpen(true)}
        onSubmenuToggle={handleSubmenuToggle}
        showSubmenuToggle={hasSubmenu}
        isSubmenuOpen={isSubmenuMobileOpen}
      />
      
      {/* 🟢 Render all appropriate submenus based on current route */}
      {isMarketplace && (
        <MarketplaceSubmenu 
          isMobileOpen={isSubmenuMobileOpen}
          onMobileClose={handleSubmenuClose}
        />
      )}
      
      {isDashboard && (
        <DashboardSubmenu 
          isMobileOpen={isSubmenuMobileOpen}
          onMobileClose={handleSubmenuClose}
        />
      )}
      
      {isProfile && (
        <ProfileSubmenu 
          isMobileOpen={isSubmenuMobileOpen}
          onMobileClose={handleSubmenuClose}
        />
      )}

      {isNotification && (
        <NotificationSubmenu 
          isMobileOpen={isSubmenuMobileOpen}
          onMobileClose={handleSubmenuClose}
        />
      )}
      
      {/* 🟢 Main content area with enhanced styling */}
      <main className={`${styles.main} ${hasSubmenu ? styles.withSubmenu : ''} ${isCartOpen ? styles.withCart : ''}`}>
        {/* 🟢 Mobile submenu toggle from frontend code */}
        {hasSubmenu && (
          <button 
            className={styles.mobileSubmenuToggle}
            onClick={handleSubmenuToggle}
            aria-label={`Open ${getSubmenuTitle()} menu`}
            type="button"
          >
            <span>☰</span>
            <span>{getSubmenuTitle()}</span>
          </button>
        )}
        
        {children}
      </main>
      
      {/* 🟢 Enhanced LogoutModal with AuthContext integration */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
      />
    </div>
  );
}