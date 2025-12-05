"use client";
import { BarChart3, DollarSign, Package, Truck } from "lucide-react";
import { usePathname } from "next/navigation";
import SellerSidebar from "../layouts/SellerSidebar";
import { SellerProfile } from "../../utils/lib/sellerProfileService"; // 🟢 ADD IMPORT

interface DashboardSubmenuProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  sellerProfile?: SellerProfile | null; // 🟢 ADD THIS PROP
}

export default function DashboardSubmenu({ 
  isMobileOpen = false, 
  onMobileClose,
  sellerProfile // 🟢 ADD THIS
}: DashboardSubmenuProps) {
  const pathname = usePathname();
  
  const items = [
    { href: "/seller", label: "Revenue", icon: DollarSign },
    { href: "/seller/dashboard/inventory", label: "Inventory", icon: Package },
    { href: "/seller/dashboard/delivery", label: "Delivery", icon: Truck },
    { href: "/seller/dashboard/topSelling", label: "Top Selling", icon: BarChart3 },
  ];

  console.log("📦 DashboardSubmenu received sellerProfile:", sellerProfile); // 🟢 ADD DEBUG LOG

  return (
    <SellerSidebar
      title="Seller Dashboard"
      items={items}
      type="navigation"
      isMobileOpen={isMobileOpen}
      onMobileClose={onMobileClose}
      sellerProfile={sellerProfile} // 🟢 PASS THE PROFILE DATA
    />
  );
}