"use client";
import { BarChart3, Calendar, Sprout, Trees } from "lucide-react";
import { usePathname } from "next/navigation";
import SubmenuSidebar from "../../layouts/SubmenuSidebar";

interface DashboardSubmenuProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function DashboardSubmenu({ 
  isMobileOpen = false, 
  onMobileClose 
}: DashboardSubmenuProps) {
  const pathname = usePathname();
  
  const items = [
    { href: "/buyer/dashboard", label: "Overview", icon: BarChart3 },
    { href: "/buyer/dashboard/fresh-arrivals", label: "Fresh Arrivals", icon: Calendar },
    { href: "/buyer/dashboard/local-farms", label: "Local Farms", icon: Trees },
  ];

  return (
    <SubmenuSidebar 
      title="Dashboard"
      items={items}
      type="navigation"
      isMobileOpen={isMobileOpen}
      onMobileClose={onMobileClose}
    />
  );
}