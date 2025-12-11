// User order service using Firebase Client SDK
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { generateTrackingFromStatus } from './orderStatusService';

export interface UserOrder {
  id: string;
  status: string;
  sellerName: string;
  sellerLogo: string;
  productImage: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
  orderDate: string;
  tracking: Array<{
    location: string;
    time: string;
    description: string;
  }>;
  [key: string]: any; // Allow additional order fields
}

/**
 * Get all orders for a user
 */
export const getUserOrders = async (userId: string): Promise<UserOrder[]> => {
  try {
    console.log('🔍 Fetching orders for user:', userId);

    const ordersQuery = query(
      collection(db, 'orders'),
      where('buyerId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    console.log('📊 Querying Firestore for orders...');
    const ordersSnapshot = await getDocs(ordersQuery);
    console.log('📦 Found orders:', ordersSnapshot.size);

    const orders: UserOrder[] = [];
    
    for (const doc of ordersSnapshot.docs) {
      const orderData = doc.data();
      console.log('📄 Order data:', orderData.id, orderData.status);
      
      // Handle timestamps - could be Firestore Timestamp or string
      const createdAt = orderData.createdAt?.toDate 
        ? orderData.createdAt.toDate().toISOString()
        : (orderData.createdAt || orderData.orderDate || new Date().toISOString());

      const transformedOrder: UserOrder = {
        id: orderData.id || doc.id,
        status: orderData.status || 'pending',
        sellerName: orderData.sellers?.[0]?.sellerName || 'Unknown Seller',
        sellerLogo: orderData.sellers?.[0]?.sellerLogo || '',
        productImage: orderData.products?.[0]?.image || '/images/placeholder.jpg',
        productName: orderData.products?.[0]?.name || 'Multiple Products',
        quantity: orderData.products?.reduce((sum: number, product: any) => sum + (product.quantity || 1), 0) || 1,
        price: orderData.products?.[0]?.unitPrice || orderData.products?.[0]?.price || 0,
        totalPrice: orderData.totalPrice || 0,
        orderDate: createdAt,
        tracking: [],
        ...orderData
      };

      // Generate tracking timeline
      const tracking = generateTrackingFromStatus(transformedOrder);
      transformedOrder.tracking = tracking;

      orders.push(transformedOrder);
    }

    console.log('✅ Returning orders:', orders.length);
    return orders;
    
  } catch (error) {
    console.error('❌ Error fetching user orders:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch user orders');
  }
};

