"use client";
import { Flag, UserPlus, Store } from "lucide-react";
import { usePathname } from "next/navigation";
import AdminSidebar from "../layouts/AdminSidebar";

interface NotificationSubmenuProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function NotificationSubmenu({ 
  isMobileOpen = false, 
  onMobileClose 
}: NotificationSubmenuProps) {
  const pathname = usePathname();
  
  const items = [
    { href: "/admin/notification", label: "Reports", icon: Flag },
    { href: "/admin/notification/newBuyer", label: "New Buyer", icon: UserPlus },
    { href: "/admin/notification/newSeller", label: "New Seller", icon: Store },
  ];

  return (
    <AdminSidebar 
      title="Notifications"
      items={items}
      type="navigation"
      isMobileOpen={isMobileOpen}
      onMobileClose={onMobileClose}
    />
  );
}