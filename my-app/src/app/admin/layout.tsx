"use client";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/utils/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import AdminLayout from "../../components/organisms/layouts/AdminLayout";
import DashboardSubmenu from "../../components/organisms/submenu/admin-submenus/DashboardSubmenu";
import NotificationSubmenu from "../../components/organisms/submenu/admin-submenus/NotificationSubmenu";
import LogoutModal from "../../components/organisms/modals/LogoutModal/LogoutModal";

export default function RootAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const renderSubmenu = () => {
    if (pathname?.startsWith("/admin/dashboard")) {
      return <DashboardSubmenu />;
    }
    
    if (pathname?.startsWith("/admin/notification")) {
      return <NotificationSubmenu />; // FIXED COMPONENT NAME
    }
    
    return null;
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      setIsLogoutModalOpen(false);
      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogoutCancel = () => {
    setIsLogoutModalOpen(false);
  };

  const currentSubmenu = renderSubmenu();

  return (
    <AdminLayout onLogoutClick={handleLogoutClick}> 
      {currentSubmenu}
      {children}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
        userType="admin"
      />
    </AdminLayout>
  );
}