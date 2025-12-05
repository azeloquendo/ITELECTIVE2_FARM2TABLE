"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardSubmenu from "../../../components/organisms/seller-submenus/DashboardSubmenu";
import ProductsSubmenu from "../../../components/organisms/seller-submenus/ProductsSubmenu";
import OrdersSubmenu from "../../../components/organisms/seller-submenus/OrdersSubmenu";
import ProfileSubmenu from "../../../components/organisms/seller-submenus/ProfileSubmenu";
import LogoutModal from "../auth/modals/LogoutModal/LogoutModal";
import MainSidebar from "../navigation/SellerMainSidebar";
import { CategoryProvider, useCategory } from "../../../app/context/CategoryContext";
import { useAuth } from "@/app/context/AuthContext";
import styles from "./SellerLayout.module.css";

// 🟢 ADD SELLER PROFILE SERVICE IMPORT
import { getSellerProfile, SellerProfile } from "../../../utils/lib/sellerProfileService";

// Inner component that uses the category context
function SellerLayoutContent({ children }: { children: React.ReactNode }) {
  const { selectedCategory, setSelectedCategory } = useCategory();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmenuMobileOpen, setIsSubmenuMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // 🟢 USE AUTH CONTEXT INSTEAD OF DIRECT FIREBASE
  const { user, userRole, logout } = useAuth();
  
  // 🟢 ADD SELLER PROFILE STATE
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  
  const pathname = usePathname();
  const router = useRouter();
  
  const isDashboard = pathname?.startsWith("/seller") && 
                     (pathname === "/seller" || 
                      pathname?.startsWith("/seller/dashboard"));
  
  const isProducts = pathname?.startsWith("/seller/products");
  const isOrders = pathname?.startsWith("/seller/orders");
  const isProfile = pathname?.startsWith("/seller/profile");
  const hasSubmenu = isDashboard || isProducts || isOrders || isProfile;

  // 🟢 IMPROVED: Role-based route protection
  useEffect(() => {
    console.log("🔐 SellerLayout - User role:", userRole, "Path:", pathname);
    
    if (userRole === null) {
      // Still loading, wait for auth context
      return;
    }
    
    if (userRole !== 'seller') {
      console.log("🚫 Non-seller user trying to access seller routes:", userRole);
      
      // Redirect to appropriate dashboard based on role
      if (userRole === 'buyer') {
        router.push('/buyer/dashboard');
      } else if (userRole === 'admin') {
        router.push('/admin/dashboard');
      } else {
        // No role or not logged in, go to role selection
        router.push('/roleSelection');
      }
      return;
    }
    
    // User is seller, allow access and fetch profile
    if (user && userRole === 'seller') {
      fetchSellerProfile();
    }
  }, [userRole, pathname, router, user]);

  // 🟢 UPDATED: Seller profile fetch function
  const fetchSellerProfile = async () => {
    try {
      if (!user) {
        console.log("❌ No user found for profile fetch");
        return;
      }

      console.log("🔄 SellerLayout - Fetching seller profile for UID:", user.uid);
      
      const sellerData = await getSellerProfile();
      
      if (sellerData) {
        console.log("✅ SellerLayout - Successfully loaded seller profile:", {
          fullName: sellerData.fullName,
          farmName: sellerData.farm.farmName,
          logo: sellerData.farm.logo
        });
        setSellerProfile(sellerData);
      } else {
        console.log("⚠️ SellerLayout - No seller data returned");
        setSellerProfile(null);
      }
    } catch (err: any) {
      console.error('❌ SellerLayout - Error fetching seller profile:', err);
      
      // Create fallback seller profile
      if (user) {
        const fallbackProfile: SellerProfile = {
          id: user.uid,
          uid: user.uid,
          userId: user.uid,
          fullName: user.displayName || "Seller",
          email: user.email || "",
          contact: "",
          age: 0,
          birthday: "",
          role: "seller",
          farm: {
            farmName: "My Farm",
            description: "",
            logo: ""
          },
          address: {
            barangay: "",
            building: "",
            city: "",
            houseNo: "",
            postalCode: "",
            province: "",
            region: "",
            streetName: "",
            location: { lat: 0, lng: 0 }
          },
          profilePic: "",
          coverPhoto: "",
          gallery: [],
          farmers: [],
          rating: 0,
          followerCount: 0,
          isVerified: false,
          createdAt: null,
          updatedAt: null
        };
        setSellerProfile(fallbackProfile);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmenuToggle = () => {
    setIsSubmenuMobileOpen(!isSubmenuMobileOpen);
  };

  const handleSubmenuClose = () => {
    setIsSubmenuMobileOpen(false);
  };

  const handleCategoryChange = (category: string) => {
    console.log("🏠 SellerLayout - Category changed to:", category);
    setSelectedCategory(category);
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  // 🟢 IMPROVED: Use AuthContext logout
  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      await logout(); // 🟢 Use AuthContext logout
      console.log("✅ Seller logged out successfully");
      router.push('/roleSelection');
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  const handleCloseModal = () => {
    if (!isLoggingOut) {
      setIsLogoutModalOpen(false);
    }
  };

  const getSubmenuTitle = () => {
    if (isDashboard) return "Dashboard";
    if (isProducts) return "Products";
    if (isOrders) return "Orders";
    if (isProfile) return "Profile";
    return "Menu";
  };

  // 🟢 ADD DEBUG LOGS
  useEffect(() => {
    console.log("🔍 SellerLayout Debug:", {
      loading,
      user: user?.email,
      userRole,
      sellerProfile: sellerProfile ? {
        fullName: sellerProfile.fullName,
        farmName: sellerProfile.farm.farmName,
        logo: sellerProfile.farm.logo
      } : null
    });
  }, [loading, user, userRole, sellerProfile]);

  // 🟢 IMPROVED: Show loading only when necessary
  if (loading || userRole === null) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your seller dashboard...</p>
      </div>
    );
  }

  // 🟢 ADDED: Extra protection - don't render if not seller
  if (userRole !== 'seller') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Redirecting to your dashboard...</p>
      </div>
    );
  }

  if (!isMounted) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          {children}
        </main>
      </div>
    );
  }

  // 🟢 ADD DEBUG INFO
  console.log("🎯 SellerLayout rendering - User:", user?.email, "Role:", userRole);

  return (
    <div className={styles.container}>
      <MainSidebar 
        onLogoutClick={handleLogoutClick}
        onSubmenuToggle={handleSubmenuToggle}
        showSubmenuToggle={hasSubmenu}
        isSubmenuOpen={isSubmenuMobileOpen}
      />
      
      {/* 🟢 PASS SELLER PROFILE DATA TO ALL SUBMENUS */}
      {isDashboard && (
        <DashboardSubmenu 
          isMobileOpen={isSubmenuMobileOpen}
          onMobileClose={handleSubmenuClose}
          sellerProfile={sellerProfile} // 🟢 PASS PROFILE
        />
      )}
      
      {isProducts && (
        <ProductsSubmenu 
          isMobileOpen={isSubmenuMobileOpen}
          onMobileClose={handleSubmenuClose}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          sellerProfile={sellerProfile} // 🟢 PASS PROFILE
        />
      )}
      
      {isOrders && (
        <OrdersSubmenu 
          isMobileOpen={isSubmenuMobileOpen}
          onMobileClose={handleSubmenuClose}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          sellerProfile={sellerProfile} // 🟢 PASS PROFILE
        />
      )}
      
      {isProfile && (
        <ProfileSubmenu 
          isMobileOpen={isSubmenuMobileOpen}
          onMobileClose={handleSubmenuClose}
          sellerProfile={sellerProfile} // 🟢 PASS PROFILE
        />
      )}
      
      <main className={`${styles.main} ${hasSubmenu ? styles.withSubmenu : ''}`}>
        {hasSubmenu && (
          <button 
            className={styles.mobileSubmenuToggle}
            onClick={handleSubmenuToggle}
            aria-label={`Open ${getSubmenuTitle()} menu`}
          >
            <span>☰</span>
            <span>{getSubmenuTitle()}</span>
          </button>
        )}
        
        {children}
      </main>
      
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
      />
    </div>
  );
}

// Main component that provides the category context
export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <CategoryProvider>
      <SellerLayoutContent>{children}</SellerLayoutContent>
    </CategoryProvider>
  );
}