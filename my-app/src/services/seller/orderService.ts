// Order-related service functions for API/Firebase interactions

import {
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    Timestamp,
    updateDoc
} from "firebase/firestore";
import { Order, OrderProduct } from "../../interface/seller";
import { db } from "../../utils/lib/firebase";

/**
 * Fetch all orders for a specific seller
 */
export const fetchSellerOrders = async (sellerId: string): Promise<Order[]> => {
  try {
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    const orders: Order[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Check if this order contains items for the current seller
      const hasSellerItems = checkIfOrderHasSellerItems(data, sellerId);
      
      if (!hasSellerItems) return;
      
      // Extract products for current seller only
      const { products, subtotal } = extractSellerProducts(data, sellerId);
      
      if (products.length === 0) return;
      
      const buyerName = data.buyerInfo?.name || data.buyerName || "Unknown Buyer";
      const contact = data.buyerInfo?.contact || data.contact || data.phone || "No contact";
      const address = data.buyerInfo?.address || data.address || data.deliveryAddress || "No address";
      
      const order: Order = {
        id: doc.id,
        buyerName: buyerName,
        products: products,
        totalPrice: subtotal || data.totalPrice || 0,
        orderDate: data.createdAt?.toDate?.()?.toISOString() || 
                  data.orderDate || 
                  new Date().toISOString(),
        status: data.status || "pending",
        contact: contact,
        address: address,
        deliveryMethod: data.deliveryMethod || data.shippingMethod || "Standard Delivery",
        specialInstructions: data.specialInstructions || data.notes || "",
        sellers: data.sellers,
        isForCurrentSeller: true,
        currentSellerItems: products,
        currentSellerSubtotal: subtotal,
        payment: data.payment || {
          method: data.paymentMethod || "Cash on Delivery",
          status: data.paymentStatus || "pending"
        },
        delivery: data.delivery || {
          method: data.deliveryMethod || "Standard Delivery",
          time: data.deliveryTime || "Within 3-5 business days",
          estimatedDelivery: data.estimatedDelivery,
          trackingNumber: data.trackingNumber
        }
      };
      
      orders.push(order);
    });
    
    return orders;
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    throw error;
  }
};

/**
 * Check if order has items for a specific seller
 */
export const checkIfOrderHasSellerItems = (orderData: any, sellerId: string): boolean => {
  if (orderData.sellers && Array.isArray(orderData.sellers)) {
    const sellerOrder = orderData.sellers.find((seller: any) => 
      seller.sellerId === sellerId
    );
    return !!sellerOrder && sellerOrder.items && sellerOrder.items.length > 0;
  }
  
  if (orderData.products && Array.isArray(orderData.products)) {
    return orderData.products.some((product: any) => product.sellerId === sellerId);
  }
  
  return false;
};

/**
 * Extract products for a specific seller from order data
 */
export const extractSellerProducts = (
  orderData: any, 
  sellerId: string
): { products: OrderProduct[]; subtotal: number } => {
  let products: OrderProduct[] = [];
  let subtotal = 0;
  
  if (orderData.sellers && Array.isArray(orderData.sellers)) {
    const sellerOrder = orderData.sellers.find((seller: any) => 
      seller.sellerId === sellerId
    );
    
    if (sellerOrder && sellerOrder.items && Array.isArray(sellerOrder.items)) {
      products = sellerOrder.items.map((item: any) => ({
        name: item.name || "Unknown Product",
        quantity: item.quantity || 1,
        unitPrice: item.price || item.unitPrice || 0,
        unit: item.unit || "pc",
        sellerId: item.sellerId,
        productId: item.productId,
        image: item.image,
        notes: item.notes
      }));
      subtotal = sellerOrder.subtotal || 0;
    }
  }
  
  if (products.length === 0 && orderData.products && Array.isArray(orderData.products)) {
    const sellerProducts = orderData.products.filter((product: any) => 
      product.sellerId === sellerId
    );
    products = sellerProducts.map((item: any) => ({
      name: item.name || "Unknown Product",
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || item.price || 0,
      unit: item.unit || "pc",
      sellerId: item.sellerId
    }));
  }
  
  return { products, subtotal };
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string, 
  newStatus: string
): Promise<void> => {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

/**
 * Fetch orders within date range for dashboard stats
 */
export const fetchOrdersInDateRange = async (
  sellerId: string,
  startDate: Date,
  endDate: Date
) => {
  try {
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    const orders: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const order = doc.data();
      
      // Check if this order belongs to the current seller
      const sellerOrders = order.sellers || [];
      const isSellerOrder = sellerOrders.some((seller: any) => seller.sellerId === sellerId);
      
      if (!isSellerOrder) return;
      
      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
      
      // Filter dates
      if (orderDate >= startDate && orderDate < endDate) {
        orders.push({
          id: doc.id,
          ...order,
          orderDate
        });
      }
    });
    
    return orders;
  } catch (error) {
    console.error("Error fetching orders in date range:", error);
    throw error;
  }
};

