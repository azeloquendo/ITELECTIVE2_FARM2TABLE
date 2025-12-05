import { doc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";

export interface OrderNotificationData {
  orderId: string;
  amount: string;
  items: any[];
  sellerId?: string;
  buyerName?: string;
}

/**
 * Creates a notification when an order is successfully placed
 */
export const createOrderNotification = async (orderData: OrderNotificationData): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    console.error("No user logged in");
    return;
  }

  try {
    // Create a reference to a new document in the notifications collection
    const notificationRef = doc(collection(db, "notifications"));
    
    const notification = {
      userId: user.uid,
      title: "Order Confirmed! 🎉",
      message: `Your order has been placed successfully. We'll notify you when it's ready for pickup.`,
      type: "order",
      read: false,
      createdAt: serverTimestamp(),
      orderId: orderData.orderId,
      amount: orderData.amount,
      itemCount: orderData.items.length,
      buyerName: orderData.buyerName || user.displayName || "Customer",
      // Optional: Include seller ID if you want seller notifications too
      sellerId: orderData.sellerId || null
    };

    await setDoc(notificationRef, notification);
    
    console.log("🎊 Order notification created successfully:", {
      orderId: orderData.orderId,
      amount: orderData.amount,
      items: orderData.items.length
    });
  } catch (error) {
    console.error("❌ Error creating order notification:", error);
    throw new Error("Failed to create order notification");
  }
};

/**
 * Creates a notification for order status updates
 */
export const createOrderStatusNotification = async (
  userId: string,
  orderData: {
    orderId: string;
    status: 'preparing' | 'ready' | 'completed' | 'cancelled';
    message: string;
    sellerName?: string;
  }
): Promise<void> => {
  try {
    const notificationRef = doc(collection(db, "notifications"));
    
    const statusTitles = {
      preparing: "👨‍🍳 Order Being Prepared",
      ready: "✅ Order Ready for Pickup!",
      completed: "🎊 Order Completed",
      cancelled: "❌ Order Cancelled"
    };

    const notification = {
      userId: userId,
      title: statusTitles[orderData.status] || "Order Update",
      message: orderData.message,
      type: "order",
      read: false,
      createdAt: serverTimestamp(),
      orderId: orderData.orderId,
      sellerName: orderData.sellerName || null
    };

    await setDoc(notificationRef, notification);
    
    console.log(`📦 Order status notification created: ${orderData.status}`);
  } catch (error) {
    console.error("❌ Error creating order status notification:", error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await setDoc(notificationRef, { read: true }, { merge: true });
    console.log("📖 Notification marked as read:", notificationId);
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    throw error;
  }
};