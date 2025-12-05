"use client";
import { Package, Egg, Wheat, Beef, Fish, Gift, ChefHat, Layers } from "lucide-react";
import SellerSidebar from "../layouts/SellerSidebar"; // 🟢 CHANGE TO SELLER SIDEBAR
import { SellerProfile } from "../../utils/lib/sellerProfileService"; // 🟢 ADD IMPORT

interface ProductsSubmenuProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  sellerProfile?: SellerProfile | null; // 🟢 ADD THIS PROP
}

export default function ProductsSubmenu({ 
  isMobileOpen = false, 
  onMobileClose,
  selectedCategory = "All Products",
  onCategoryChange,
  sellerProfile // 🟢 ADD THIS
}: ProductsSubmenuProps) {
  
  // Static categories
  const categories = [
    { 
      id: "all-products", 
      category: "All Products", 
      label: "All Products", 
      icon: Layers, 
      href: "#" 
    },
    { 
      id: "fresh-produce", 
      category: "Fresh Produce", 
      label: "Fresh Produce", 
      icon: Package, 
      href: "#" 
    },
    { 
      id: "dairy-eggs", 
      category: "Dairy & Eggs", 
      label: "Dairy & Eggs", 
      icon: Egg, 
      href: "#" 
    },
    { 
      id: "grains-staples", 
      category: "Grains & Staples", 
      label: "Grains & Staples", 
      icon: Wheat, 
      href: "#" 
    },
    { 
      id: "livestock-poultry", 
      category: "Livestock & Poultry", 
      label: "Livestock & Poultry", 
      icon: Beef, 
      href: "#" 
    },
    { 
      id: "fishery", 
      category: "Fishery", 
      label: "Fishery", 
      icon: Fish, 
      href: "#" 
    },
    { 
      id: "specialty-products", 
      category: "Specialty Products", 
      label: "Specialty Products", 
      icon: Gift, 
      href: "#" 
    },
    { 
      id: "value-added", 
      category: "Value-added", 
      label: "Value-added", 
      icon: ChefHat, 
      href: "#" 
    },
  ];

  const handleCategoryClick = (category: string) => {
    console.log("🎯 ProductsSubmenu - Category clicked:", category);
    
    if (onCategoryChange) {
      onCategoryChange(category);
    }
    
    if (onMobileClose) {
      onMobileClose();
    }
  };

  console.log("📦 ProductsSubmenu received sellerProfile:", sellerProfile); // 🟢 ADD DEBUG LOG

  return (
    <SellerSidebar // 🟢 CHANGE TO SELLER SIDEBAR
      title="Products"
      items={categories}
      selectedCategory={selectedCategory}
      onCategoryChange={handleCategoryClick}
      type="category"
      isMobileOpen={isMobileOpen}
      onMobileClose={onMobileClose}
      sellerProfile={sellerProfile} // 🟢 PASS THE PROFILE DATA
    />
  );
}