// Custom hook for managing seller orders

import { useEffect, useState } from "react";
import { useAuth } from "../../app/context/AuthContext";
import { Order } from "../../interface/seller";
import { fetchSellerOrders, updateOrderStatus } from "../../services/seller/orderService";

export const useSellerOrders = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentSellerId = user?.uid;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!currentSellerId) {
          console.log("No seller ID found, cannot fetch orders");
          setLoading(false);
          return;
        }
        
        console.log("🔍 Fetching orders for seller:", currentSellerId);
        const ordersData = await fetchSellerOrders(currentSellerId);
        setOrders(ordersData);
        console.log("✅ Final processed orders for current seller:", ordersData.length);
      } catch (err) {
        console.error("Error fetching orders from Firebase:", err);
        setError("Failed to load orders from server. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && currentSellerId) {
      fetchOrders();
    } else if (!authLoading && !currentSellerId) {
      setLoading(false);
    }
  }, [currentSellerId, authLoading]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      if (!currentSellerId) {
        throw new Error("Cannot update order: No seller ID found");
      }
      
      await updateOrderStatus(orderId, newStatus);
      
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      return true;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  };

  return {
    orders,
    loading: loading || authLoading,
    error,
    currentSellerId,
    updateStatus: handleStatusUpdate,
    refetch: async () => {
      if (currentSellerId) {
        const ordersData = await fetchSellerOrders(currentSellerId);
        setOrders(ordersData);
      }
    },
  };
};

