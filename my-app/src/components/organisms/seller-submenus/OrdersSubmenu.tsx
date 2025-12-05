"use client";
import { Package, Clock, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import SellerSidebar from "../layouts/SellerSidebar"; // 🟢 CHANGE TO SELLER SIDEBAR
import { SellerProfile } from "../../utils/lib/sellerProfileService"; // 🟢 ADD IMPORT

interface OrdersSubmenuProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  sellerProfile?: SellerProfile | null; // 🟢 ADD THIS PROP
}

export default function OrdersSubmenu({ 
  isMobileOpen = false, 
  onMobileClose,
  selectedCategory = "all",
  onCategoryChange,
  sellerProfile // 🟢 ADD THIS
}: OrdersSubmenuProps) {
  
  const orderCategories = [
    { 
      id: "all-orders", 
      category: "all", 
      label: "All Orders", 
      icon: Package, 
      href: "#" 
    },
    { 
      id: "pending-orders", 
      category: "pending", 
      label: "Pending", 
      icon: Clock, 
      href: "#" 
    },
    { 
      id: "processing-orders", 
      category: "processing", 
      label: "Processing", 
      icon: RefreshCw, 
      href: "#" 
    },
    { 
      id: "completed-orders", 
      category: "completed", 
      label: "Completed", 
      icon: CheckCircle, 
      href: "#" 
    },
    { 
      id: "canceled-orders", 
      category: "canceled", 
      label: "Canceled", 
      icon: XCircle, 
      href: "#" 
    },
  ];

  const handleCategoryClick = (category: string) => {
    console.log("🎯 OrdersSubmenu - Category clicked:", category);
    
    if (onCategoryChange) {
      onCategoryChange(category);
    }
    
    if (onMobileClose) {
      onMobileClose();
    }
  };

  console.log("📦 OrdersSubmenu received sellerProfile:", sellerProfile); // 🟢 ADD DEBUG LOG

  return (
    <SellerSidebar // 🟢 CHANGE TO SELLER SIDEBAR
      title="Orders"
      items={orderCategories}
      selectedCategory={selectedCategory}
      onCategoryChange={handleCategoryClick}
      type="category"
      isMobileOpen={isMobileOpen}
      onMobileClose={onMobileClose}
      sellerProfile={sellerProfile} // 🟢 PASS THE PROFILE DATA
    />
  );
}