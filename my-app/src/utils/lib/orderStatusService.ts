// Order status service using Firebase Client SDK
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type OrderStatus = 'pending' | 'confirmed' | 'to-ship' | 'to-receive' | 'shipped' | 'delivered' | 'to-review' | 'completed' | 'cancelled';

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string, 
  status: OrderStatus
): Promise<{ success: boolean; status: OrderStatus; message: string }> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    await updateDoc(orderRef, {
      status: status,
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      status: status,
      message: 'Order status updated successfully'
    };
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error instanceof Error ? error : new Error('Failed to update order status');
  }
};

/**
 * Get order status
 */
export const getOrderStatus = async (orderId: string): Promise<OrderStatus | null> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      return null;
    }

    return orderDoc.data().status as OrderStatus || 'pending';
  } catch (error) {
    console.error('Error fetching order status:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch order status');
  }
};

/**
 * Generate tracking timeline from order status
 */
export const generateTrackingFromStatus = (order: any) => {
  const tracking = [];
  const now = new Date().toISOString();
  
  tracking.push({
    location: "Order Placed",
    time: order.orderDate || order.createdAt || now,
    description: "Your order has been received"
  });

  if (order.status === 'to-ship' || order.status === 'confirmed') {
    tracking.push({
      location: "Order Confirmed",
      time: order.updatedAt || now,
      description: "Seller has confirmed your order"
    });
  }

  if (order.status === 'to-receive' || order.status === 'shipped') {
    tracking.push({
      location: "Shipped",
      time: order.updatedAt || now,
      description: "Your order is on the way"
    });
  }

  if (order.status === 'to-review' || order.status === 'delivered') {
    tracking.push({
      location: "Delivered",
      time: order.updatedAt || now,
      description: "Your order has been delivered"
    });
  }

  if (order.status === 'completed') {
    tracking.push({
      location: "Completed",
      time: order.updatedAt || now,
      description: "Order completed successfully"
    });
  }

  return tracking;
};

