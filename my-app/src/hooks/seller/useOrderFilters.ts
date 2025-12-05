// Custom hook for filtering orders

import { useMemo } from "react";
import { Order } from "../../interface/seller";

export const useOrderFilters = (
  orders: Order[],
  selectedCategory: string | null,
  searchTerm: string
) => {
  const filteredOrders = useMemo(() => {
    console.log("🔄 Filtering orders...");
    console.log("📦 Total orders:", orders.length);
    console.log("🔍 Selected category:", selectedCategory);
    console.log("🔎 Search term:", searchTerm);
    
    // If no category selected or "all", show all orders immediately
    if (!selectedCategory || selectedCategory === "all" || selectedCategory === "All Orders") {
      console.log("✅ Showing ALL orders");
      const allOrders = orders.filter(order => {
        const buyerName = order.buyerName || "";
        const orderId = order.id || "";
        const matchesSearch = buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             orderId.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      });
      console.log(`🔍 Search result: ${allOrders.length} orders found`);
      return allOrders;
    }
    
    // Only filter by status if a specific category is selected
    const filtered = orders.filter(order => {
      const matchesTab = order.status === selectedCategory;
      const buyerName = order.buyerName || "";
      const orderId = order.id || "";
      const matchesSearch = buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           orderId.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
    
    console.log(`🔍 Filter result: ${filtered.length} orders found in "${selectedCategory}"`);
    return filtered;
  }, [orders, selectedCategory, searchTerm]);

  return filteredOrders;
};

