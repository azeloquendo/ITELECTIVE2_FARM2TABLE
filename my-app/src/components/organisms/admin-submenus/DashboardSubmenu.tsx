"use client";
import { BarChart3, Users, Store, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import AdminSidebar from "../layouts/AdminSidebar";

interface DashboardSubmenuProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function DashboardSubmenu({ 
  isMobileOpen = false, 
  onMobileClose
  
}: DashboardSubmenuProps) {
  const pathname = usePathname();
  
  // 🟢 DASHBOARD SUBMENU ITEMS - Including ID Verification
  const items = [
    { href: "/admin/dashboard", label: "Overview", icon: BarChart3 },
    { href: "/admin/dashboard/seller", label: "Seller Management", icon: Store },
    { href: "/admin/dashboard/buyer", label: "Buyer Management", icon: Users },
    { href: "/admin/dashboard/id-verification", label: "ID Verification", icon: ShieldCheck },
  ];

  return (
    <AdminSidebar 
      title="Dashboard"
      items={items}
      type="navigation"
      isMobileOpen={isMobileOpen}
      onMobileClose={onMobileClose}
  
    />
  );
}