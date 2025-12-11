"use client";
import { Beef, Carrot, Egg, Fish, Gem, Gift, Package, Wheat } from "lucide-react";
import { createContext, useContext, useState } from "react";
import SubmenuSidebar from "../../layouts/SubmenuSidebar";

// Context to share the selected category between the sidebar and the page
const CategoryContext = createContext<{
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}>({
  selectedCategory: "all",
  setSelectedCategory: () => {},
});

export function useCategory() {
  return useContext(CategoryContext);
}

// Provider so other components (e.g., MarketplacePage) can subscribe to the same state
export function MarketplaceCategoryProvider({ children }: { children: React.ReactNode }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  return (
    <CategoryContext.Provider value={{ selectedCategory, setSelectedCategory }}>
      {children}
    </CategoryContext.Provider>
  );
}

interface MarketplaceSubmenuProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function MarketplaceSubmenu({ 
  isMobileOpen = false, 
  onMobileClose 
}: MarketplaceSubmenuProps) {
  // Use shared context when available; fallback to local state to avoid crashes in isolation
  const categoryContext = useCategory();
  const hasProvider = categoryContext?.setSelectedCategory !== undefined;
  const [localSelected, setLocalSelected] = useState("all");
  const selectedCategory = hasProvider ? categoryContext.selectedCategory : localSelected;
  const setSelectedCategory = hasProvider ? categoryContext.setSelectedCategory : setLocalSelected;

  const items = [
    { category: "all", label: "All Products", icon: Package },
    { category: "fresh-produce", label: "Fresh Produce", icon: Carrot },
    { category: "dairy-eggs", label: "Dairy & Eggs", icon: Egg },
    { category: "grains-staples", label: "Grains & Staples", icon: Wheat },
    { category: "livestock-poultry", label: "Livestock & Poultry", icon: Beef },
    { category: "fishery", label: "Fishery", icon: Fish },
    { category: "specialty-products", label: "Specialty Products", icon: Gem },
    { category: "value-added-goods", label: "Value-added Goods", icon: Gift },
  ];

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <CategoryContext.Provider value={{ selectedCategory, setSelectedCategory }}>
      <SubmenuSidebar 
        title="Marketplace"
        items={items.map(item => ({
          href: "#", // Remove URL dependency
          label: item.label,
          icon: item.icon,
          category: item.category
        }))}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        type="category"
        isMobileOpen={isMobileOpen}
        onMobileClose={onMobileClose}
      />
    </CategoryContext.Provider>
  );
}