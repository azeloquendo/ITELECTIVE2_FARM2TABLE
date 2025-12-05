// lib/firebase/dashboardService.js
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';

// Get buyer profile data
export const getBuyerProfile = async (buyerId) => {
  try {
    const buyerDoc = await getDoc(doc(db, 'buyers', buyerId));
    if (buyerDoc.exists()) {
      return { id: buyerDoc.id, ...buyerDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching buyer profile:', error);
    throw error;
  }
};

// Get buyer stats (CO2 reduced, food waste prevented, etc.)
export const getBuyerStats = async (buyerId) => {
  try {
    // You might want to store these in a separate collection
    const statsDoc = await getDoc(doc(db, 'buyerStats', buyerId));
    if (statsDoc.exists()) {
      return statsDoc.data();
    }
    
    // Return default stats if none found
    return {
      co2Reduced: 245,
      foodWastePrevented: 18,
      localSourcing: 85,
      ecoOrders: 12
    };
  } catch (error) {
    console.error('Error fetching buyer stats:', error);
    throw error;
  }
};

// Get monthly eco impact data
export const getMonthlyEcoImpact = async (buyerId) => {
  try {
    const impactQuery = query(
      collection(db, 'buyerEcoImpact'),
      where('buyerId', '==', buyerId),
      orderBy('month', 'asc'),
      limit(12)
    );
    
    const querySnapshot = await getDocs(impactQuery);
    const monthlyData = [];
    
    querySnapshot.forEach((doc) => {
      monthlyData.push({ id: doc.id, ...doc.data() });
    });
    
    // If no data found, return sample data
    if (monthlyData.length === 0) {
      return [
        { month: "Jan", co2: 180, waste: 12 },
        { month: "Feb", co2: 210, waste: 15 },
        { month: "Mar", co2: 190, waste: 14 },
        { month: "Apr", co2: 230, waste: 16 },
        { month: "May", co2: 245, waste: 18 },
        { month: "Jun", co2: 220, waste: 17 },
        { month: "Jul", co2: 260, waste: 20 },
        { month: "Aug", co2: 240, waste: 19 },
        { month: "Sep", co2: 280, waste: 22 },
        { month: "Oct", co2: 270, waste: 21 },
        { month: "Nov", co2: 300, waste: 25 },
        { month: "Dec", co2: 290, waste: 24 }
      ];
    }
    
    return monthlyData;
  } catch (error) {
    console.error('Error fetching eco impact data:', error);
    throw error;
  }
};

// Get recent orders for quick stats
export const getRecentOrders = async (buyerId) => {
  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('buyerId', '==', buyerId),
      where('status', 'in', ['completed', 'delivered']),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    
    return orders;
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    throw error;
  }
};