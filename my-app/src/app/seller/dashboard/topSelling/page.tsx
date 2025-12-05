"use client";
import { useState, useEffect, useMemo } from 'react';
import styles from "./topSelling.module.css";
// Firebase imports
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../../../../utils/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface TopProduct {
  id: string;
  name: string;
  category: string;
  orders: number;
  revenue: number;
}

// Common product categories for agriculture/farming
const PRODUCT_CATEGORIES = [
  'Vegetables', 'Fruits', 'Herbs', 'Grains', 'Dairy', 
  'Poultry', 'Livestock', 'Organic', 'Seasonal', 'Local'
];

export default function TopSellingPage() {
  const [timeFilter, setTimeFilter] = useState<"all" | "week" | "month" | "year">("all");
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Get date ranges for filters
  const getDateRange = (filter: string) => {
    const now = new Date();
    const start = new Date();
    
    switch (filter) {
      case "week":
        start.setDate(now.getDate() - 7);
        break;
      case "month":
        start.setMonth(now.getMonth() - 1);
        break;
      case "year":
        start.setFullYear(now.getFullYear() - 1);
        break;
      default: // "all"
        start.setFullYear(2020); // All time
        break;
    }
    
    return { start, end: now };
  };

  // Get random category (for demo - replace with actual data)
  const getRandomCategory = () => {
    return PRODUCT_CATEGORIES[Math.floor(Math.random() * PRODUCT_CATEGORIES.length)];
  };

  // Fetch top selling products with enhanced data
  const fetchTopProducts = async (userId: string) => {
    try {
      const ordersRef = collection(db, 'orders');
      const querySnapshot = await getDocs(ordersRef);
      const productSales: { [key: string]: { 
        name: string; 
        category: string;
        orders: number; 
        revenue: number;
        productId: string;
      } } = {};
      
      const dateRange = getDateRange(timeFilter);
      
      querySnapshot.forEach((doc) => {
        const order = doc.data();
        const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
        
        // Check if order is within date range
        if (orderDate < dateRange.start || orderDate > dateRange.end) return;
        
        // Check if this order belongs to the current seller
        const sellerOrders = order.sellers || [];
        const isSellerOrder = sellerOrders.some((seller: any) => seller.sellerId === userId);
        
        if (!isSellerOrder) return;
        
        const sellerInfo = sellerOrders.find((seller: any) => seller.sellerId === userId);
        const items = sellerInfo?.items || [];
        
        items.forEach((item: any) => {
          const productId = item.productId || item.name;
          const productName = item.name || 'Unnamed Product';
          const category = item.category || getRandomCategory(); // Use actual category or random
          const quantity = item.quantity || 1;
          const price = item.price || 0;
          const itemRevenue = quantity * price;
          
          if (productSales[productId]) {
            productSales[productId].orders += quantity;
            productSales[productId].revenue += itemRevenue;
          } else {
            productSales[productId] = {
              name: productName,
              category: category,
              orders: quantity,
              revenue: itemRevenue,
              productId: productId
            };
          }
        });
      });
      
      // Convert to array and sort by revenue (or orders)
      const topProductsArray = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue) // Sort by revenue
        .slice(0, 5) // Top 5 products
        .map((product, index) => ({
          id: product.productId,
          name: product.name,
          category: product.category,
          orders: product.orders,
          revenue: product.revenue,
        }));
      
      // Calculate total revenue
      const total = topProductsArray.reduce((sum, product) => sum + product.revenue, 0);
      
      setTopProducts(topProductsArray);
      setTotalRevenue(total);
    } catch (error) {
      console.error('Error fetching top products:', error);
    }
  };

  // Fetch data when filter changes or on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchTopProducts(user.uid);
        setLoading(false);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [timeFilter]);

  // Get max orders for bar scaling
  const maxOrders = useMemo(() => {
    return Math.max(...topProducts.map(p => p.orders), 1);
  }, [topProducts]);

  // Get rank class for styling
  const getRankClass = (index: number) => {
    switch (index) {
      case 0: return styles.top1;
      case 1: return styles.top2;
      case 2: return styles.top3;
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loading}>Loading top selling products...</div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Header Section - Completely removed */}
      <div className={styles.header}>
        {/* Empty header - text removed */}
      </div>
      
      <div className={styles.mainContent}>
        <div className={styles.chartsSection}>
          <div className={styles.chartCard}>
            {/* Filter Buttons - At Top */}
            <div className={styles.filterSection}>
              <div className={styles.topSellingFilters}>
                <button
                  className={`${styles.filterButton} ${timeFilter === "all" ? styles.active : ""}`}
                  onClick={() => setTimeFilter("all")}
                >
                  All Time
                </button>
                <button
                  className={`${styles.filterButton} ${timeFilter === "week" ? styles.active : ""}`}
                  onClick={() => setTimeFilter("week")}
                >
                  This Week
                </button>
                <button
                  className={`${styles.filterButton} ${timeFilter === "month" ? styles.active : ""}`}
                  onClick={() => setTimeFilter("month")}
                >
                  This Month
                </button>
                <button
                  className={`${styles.filterButton} ${timeFilter === "year" ? styles.active : ""}`}
                  onClick={() => setTimeFilter("year")}
                >
                  This Year
                </button>
              </div>
            </div>
            
            {/* Three Column Product Layout */}
            <div className={styles.chartContainer}>
              {topProducts.map((product, index) => (
                <div key={product.id} className={styles.productItem}>
                  {/* Column 1: Rank and Name */}
                  <div className={styles.productInfo}>
                    <span className={`${styles.productRank} ${getRankClass(index)}`}>
                      {index + 1}
                    </span>
                    <div className={styles.productDetails}>
                      <span className={styles.productName}>{product.name}</span>
                      <span className={styles.productCategory}>{product.category}</span>
                    </div>
                  </div>
                  
                  {/* Column 2: Bar Graph - Yellow */}
                  <div className={styles.productBarContainer}>
                    <div 
                      className={styles.productBarFill}
                      style={{
                        width: `${(product.orders / maxOrders) * 100}%`
                      }}
                    />
                  </div>
                  
                  {/* Column 3: Orders */}
                  <div className={styles.productStats}>
                    <span className={styles.productOrders}>{product.orders} orders</span>
                    <span className={styles.productRevenue}>₱{product.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Chart Footer - Only Total Revenue */}
            <div className={styles.chartFooter}>
              <span className={styles.totalRevenue}>
                Total Revenue: ₱{totalRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}