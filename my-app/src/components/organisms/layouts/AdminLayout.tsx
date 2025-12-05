"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../../utils/lib/firebase";
import { useRouter } from "next/navigation";
import DashboardSubmenu from "../../../components/organisms/admin-submenus/DashboardSubmenu";
import NotificationSubmenu from "../../../components/organisms/admin-submenus/NotificationSubmenu";
import LogoutModal from "../auth/modals/LogoutModal/LogoutModal";
import MainSidebar from "../navigation/AdminMainSidebar";
import { useAuth } from "@/app/context/AuthContext";
import styles from "./AdminLayout.module.css";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmenuMobileOpen, setIsSubmenuMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const { user, userRole, logout } = useAuth();
  
  const pathname = usePathname();
  const router = useRouter();
  
  // 🟢 UPDATED: Define which sections have submenus
  const isDashboard = pathname?.startsWith("/admin/dashboard");
  const isNotifications = pathname?.startsWith("/admin/notification");
  const hasSubmenu = isDashboard || isNotifications;

  // 🟢 IMPROVED: Role-based route protection
  useEffect(() => {
    console.log("🔐 AdminLayout - User role:", userRole, "Path:", pathname);
    
    if (userRole === null) {
      return;
    }
    
    if (userRole !== 'admin') {
      console.log("🚫 Non-admin user trying to access admin routes:", userRole);
      
      if (userRole === 'seller') {
        router.push('/seller');
      } else if (userRole === 'buyer') {
        router.push('/buyer/dashboard');
      } else {
        router.push('/roleSelection');
      }
      return;
    }
    
    setLoading(false);
  }, [userRole, pathname, router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        console.log("❌ No authenticated user, redirecting to role selection");
        router.push('/roleSelection');
        return;
      }
      
      console.log("✅ Authenticated user:", user.email);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmenuToggle = () => {
    setIsSubmenuMobileOpen(!isSubmenuMobileOpen);
  };

  const handleSubmenuClose = () => {
    setIsSubmenuMobileOpen(false);
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      await logout();
      console.log("Admin logged out successfully");
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
    if (isDashboard) {
      if (pathname?.startsWith("/admin/dashboard/seller")) return "Seller Management";
      if (pathname?.startsWith("/admin/dashboard/buyer")) return "Buyer Management";
      if (pathname?.startsWith("/admin/dashboard/id-verification")) return "ID Verification";
      return "Dashboard";
    }
    if (isNotifications) return "Notifications";
    return "Menu";
  };

  if (loading || userRole === null) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your admin dashboard...</p>
      </div>
    );
  }

  if (userRole !== 'admin') {
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

  console.log("🎯 AdminLayout rendering - User:", user?.email, "Role:", userRole, "Path:", pathname);

  return (
    <div className={styles.container}>
      <MainSidebar 
        onLogoutClick={handleLogoutClick}
        onSubmenuToggle={handleSubmenuToggle}
        showSubmenuToggle={hasSubmenu}
        isSubmenuOpen={isSubmenuMobileOpen}
      />
      
      {/* 🟢 FIXED: Render both dashboard and notification submenus */}
      {isDashboard && (
        <DashboardSubmenu 
          isMobileOpen={isSubmenuMobileOpen}
          onMobileClose={handleSubmenuClose}
        />
      )}
      
      {isNotifications && (
        <NotificationSubmenu 
          isMobileOpen={isSubmenuMobileOpen}
          onMobileClose={handleSubmenuClose}
        />
      )}
      
      {/* 🟢 FIXED: Main content area with proper spacing */}
      <main className={`${styles.main} ${hasSubmenu ? styles.withSubmenu : styles.withoutSubmenu}`}>
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
        
        <div className={styles.content}>
          {children}
        </div>
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayoutContent>{children}</AdminLayoutContent>
  );
}