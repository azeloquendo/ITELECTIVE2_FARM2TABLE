"use client";
import { usePathname } from "next/navigation";
import { Bell, Package, Users, Clock } from "lucide-react";
import SubmenuSidebar from "../layouts/SubmenuSidebar";

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
    { href: "/buyer/notification", label: "All Notifications", icon: Bell },
    { href: "/buyer/notification/order-status", label: "Order Status", icon: Package },
    { href: "/buyer/notification/reminders", label: "Reminders", icon: Clock },
  ];

  return (
    <SubmenuSidebar 
      title="Notifications"
      items={items}
      type="navigation"
      isMobileOpen={isMobileOpen}
      onMobileClose={onMobileClose}
    />
  );
}