import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  imageUrl?: string; // Added for Farm2Table product images
}

export interface Order {
  id?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string; // Added for Farm2Table
  deliveryAddress?: string; // Added for Farm2Table deliveries
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'; // Customized for Farm2Table
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'; // Added for Farm2Table
  paymentMethod?: 'card' | 'cash' | 'transfer'; // Added for Farm2Table
  specialInstructions?: string; // Added for Farm2Table
  createdAt: Date;
  updatedAt: Date;
  deliveryDate?: Date; // Added for Farm2Table delivery scheduling

  // 🔥 NEW LOGISTICS FIELDS
  logistics?: {
    courier: string;
    tracking_number: string;
    cold_chain: boolean;
    delivery_status: string;
  };
}

// Convert Firestore data to Order object
const orderFromFirestore = (doc: any): Order => {
  const data = doc.data();
  return {
    id: doc.id,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    deliveryAddress: data.deliveryAddress,
    items: data.items || [],
    totalAmount: data.totalAmount || 0,
    status: data.status || 'pending',
    paymentStatus: data.paymentStatus || 'pending',
    paymentMethod: data.paymentMethod,
    specialInstructions: data.specialInstructions,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    deliveryDate: data.deliveryDate?.toDate(),
    // 🔥 NEW LOGISTICS FIELDS
    logistics: data.logistics
  };
};

// Order Service for Farm2Table
export const orderService = {
  // Get all orders
  async getOrders(): Promise<Order[]> {
    const ordersQuery = query(
      collection(db, 'orders'), 
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(ordersQuery);
    return querySnapshot.docs.map(orderFromFirestore);
  },

  // Get order by ID
  async getOrderById(orderId: string): Promise<Order | null> {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return orderFromFirestore(docSnap);
    }
    return null;
  },

  // ⚠️ DEPRECATED: Use createOrderViaApi instead for better delivery method handling
  // Create new order for Farm2Table (Legacy - direct Firestore)
  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    console.warn('⚠️ Using legacy createOrder. Consider using createOrderViaApi for better delivery method support.');
    
    const docRef = await addDoc(collection(db, 'orders'), {
      ...order,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  },

  // Update order
  async updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  },

  // Delete order
  async deleteOrder(orderId: string): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
    await deleteDoc(docRef);
  },

  // Get orders by status (Farm2Table specific)
  async getOrdersByStatus(status: Order['status']): Promise<Order[]> {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(ordersQuery);
    return querySnapshot.docs.map(orderFromFirestore);
  },

  // Get today's orders for Farm2Table
  async getTodaysOrders(): Promise<Order[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(today)),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(ordersQuery);
    return querySnapshot.docs.map(orderFromFirestore);
  },

  // Get orders by customer email
  async getOrdersByCustomer(email: string): Promise<Order[]> {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('customerEmail', '==', email),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(ordersQuery);
    return querySnapshot.docs.map(orderFromFirestore);
  },

  // Get orders by buyer ID (for new schema)
  async getOrdersByBuyerId(buyerId: string): Promise<any[]> {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('buyerId', '==', buyerId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(ordersQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
};