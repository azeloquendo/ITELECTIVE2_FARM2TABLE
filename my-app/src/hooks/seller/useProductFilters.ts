// Custom hook for filtering and sorting products

import { useMemo } from "react";
import { Product } from "../../interface/seller";

export const useProductFilters = (
  products: Product[],
  selectedCategory: string | null,
  sortOrder: string
) => {
  const sortProducts = (productsToSort: Product[], order: string): Product[] => {
    return [...productsToSort].sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      
      if (order === "newest") {
        return dateB.getTime() - dateA.getTime();
      } else {
        return dateA.getTime() - dateB.getTime();
      }
    });
  };

  const filteredAndSortedProducts = useMemo(() => {
    console.log("🔄 Filtering products...");
    console.log("🔍 Total products:", products.length);
    console.log("🔍 Selected category:", selectedCategory);
    
    // If no category selected or "All Products", show all products
    if (!selectedCategory || selectedCategory === "All Products" || selectedCategory === "all") {
      console.log("✅ Showing ALL products");
      return sortProducts(products, sortOrder);
    }
    
    // Only filter if a specific category is selected
    const filtered = products.filter(p => {
      const matches = p.category === selectedCategory;
      console.log(`🔍 Product "${p.name}" - category: "${p.category}" - matches: ${matches}`);
      return matches;
    });
    
    console.log(`🔍 Filter result: ${filtered.length} products found in "${selectedCategory}"`);
    return sortProducts(filtered, sortOrder);
  }, [products, selectedCategory, sortOrder]);

  return filteredAndSortedProducts;
};

