"use client";
import { Package } from "lucide-react";
import { useState, useMemo, useEffect } from 'react';
import styles from "./inventory.module.css";
// Firebase imports
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../../../utils/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
// Chart.js imports
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);
const doughnutOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 20,
        usePointStyle: true,
        pointStyle: 'circle',
        font: {
          size: 14,
          weight: '600'
        }
      }
    },
  },
  cutout: '60%',
};
export default function InventoryPage() {
  const [inventoryFilter, setInventoryFilter] = useState<"all" | "in-stock" | "low-stock" | "out-of-stock">("all");
  const [inventoryPage, setInventoryPage] = useState(1);
  const itemsPerPage = 20;
  const [loading, setLoading] = useState(true);
  const [inventoryProducts, setInventoryProducts] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState({
    labels: ['In Stock', 'Low Stock', 'Out of Stock'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 3,
        borderColor: '#fff',
        hoverOffset: 8
      }
    ]
  });
  // Fetch inventory data
  const fetchInventoryData = async (userId: string) => {
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('sellerId', '==', userId));
      const querySnapshot = await getDocs(q);
      const inventoryItems: any[] = [];
      let inStockCount = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;
      querySnapshot.forEach((doc) => {
        const product = doc.data();
        const currentStock = product.stock || 0;
        const minStock = product.minStock || 10;
        const productName = product.name || 'Unnamed Product';
        const category = product.category || 'General';
        let status: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock';
        
        if (currentStock === 0) {
          status = 'out-of-stock';
          outOfStockCount++;
        } else if (currentStock <= minStock) {
          status = 'low-stock';
          lowStockCount++;
        } else {
          status = 'in-stock';
          inStockCount++;
        }
        
        inventoryItems.push({
          id: doc.id,
          name: productName,
          category: category,
          currentStock: currentStock,
          minStock: minStock,
          status: status,
          lastRestocked: product.updatedAt?.toDate().toISOString().split('T')[0] || 
                       product.createdAt?.toDate().toISOString().split('T')[0] || 
                       new Date().toISOString().split('T')[0]
        });
      });
      setInventoryProducts(inventoryItems);
      setInventoryData({
        labels: ['In Stock', 'Low Stock', 'Out of Stock'],
        datasets: [{
          data: [inStockCount, lowStockCount, outOfStockCount],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
          borderWidth: 3,
          borderColor: '#fff',
          hoverOffset: 8
        }]
      });
    } catch (error) {
      console.error('Error fetching products for inventory:', error);
    } finally {
      setLoading(false);
    }
  };
  // Fetch data on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchInventoryData(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);
  // Filter inventory products based on selected filter
  const filteredInventoryProducts = useMemo(() => 
    inventoryProducts.filter(product => {
      if (inventoryFilter === "all") return true;
      return product.status === inventoryFilter;
    }), 
    [inventoryProducts, inventoryFilter]
  );
  // Inventory pagination logic
  const inventoryTotalPages = Math.ceil(filteredInventoryProducts.length / itemsPerPage);
  const inventoryStartIndex = (inventoryPage - 1) * itemsPerPage;
  const currentInventoryProducts = filteredInventoryProducts.slice(inventoryStartIndex, inventoryStartIndex + itemsPerPage);
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in-stock":
        return <span className={styles.statusBadge} style={{ backgroundColor: '#10B981', color: 'white' }}>In Stock</span>;
      case "low-stock":
        return <span className={styles.statusBadge} style={{ backgroundColor: '#F59E0B', color: 'white' }}>Low Stock</span>;
      case "out-of-stock":
        return <span className={styles.statusBadge} style={{ backgroundColor: '#EF4444', color: 'white' }}>Out of Stock</span>;
      default:
        return null;
    }
  };
  const handleInventoryNextPage = () => {
    if (inventoryPage < inventoryTotalPages) {
      setInventoryPage(inventoryPage + 1);
    }
  };
  const handleInventoryPrevPage = () => {
    if (inventoryPage > 1) {
      setInventoryPage(inventoryPage - 1);
    }
  };
  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loading}>Loading inventory...</div>
      </div>
    );
  }
  return (
    <div className={styles.dashboard}>
      {/* Header Section - Completely removed "Inventory Management" and description */}
      <div className={styles.header}>
        {/* Empty header - text removed */}
      </div>
      <div className={styles.mainContent}>
        <div className={styles.chartsSection}>
          <div className={styles.chartCard}>
            {/* Chart Header - Removed icon and title */}
            <div className={styles.chartHeader}>
              {/* Empty header since we removed the title and icon */}
            </div>
            
            {/* Chart and Filters Container */}
            <div className={styles.chartAndFilters}>
              {/* Larger Chart Container */}
              <div className={styles.largeChartContainer}>
                <Doughnut data={inventoryData} options={doughnutOptions} />
              </div>
              
              {/* Inventory Filter Buttons with 3D Style */}
              <div className={styles.inventoryFilters}>
                <button
                  className={`${styles.filterButton} ${inventoryFilter === "all" ? styles.active : ""}`}
                  onClick={() => {
                    setInventoryFilter("all");
                    setInventoryPage(1);
                  }}
                >
                  All Items
                </button>
                <button
                  className={`${styles.filterButton} ${inventoryFilter === "in-stock" ? styles.active : ""}`}
                  onClick={() => {
                    setInventoryFilter("in-stock");
                    setInventoryPage(1);
                  }}
                >
                  In Stock
                </button>
                <button
                  className={`${styles.filterButton} ${inventoryFilter === "low-stock" ? styles.active : ""}`}
                  onClick={() => {
                    setInventoryFilter("low-stock");
                    setInventoryPage(1);
                  }}
                >
                  Low Stock
                </button>
                <button
                  className={`${styles.filterButton} ${inventoryFilter === "out-of-stock" ? styles.active : ""}`}
                  onClick={() => {
                    setInventoryFilter("out-of-stock");
                    setInventoryPage(1);
                  }}
                >
                  Out of Stock
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Table - Separate container below the chart */}
        <div className={styles.tableSection}>
          <div className={styles.inventoryTableContainer}>
            <table className={styles.inventoryTable}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Min Stock</th>
                  <th>Status</th>
                  <th>Last Restocked</th>
                </tr>
              </thead>
              <tbody>
                {currentInventoryProducts.map((product) => (
                  <tr key={product.id}>
                    <td className={styles.productNameCell}>{product.name}</td>
                    <td>{product.category}</td>
                    <td className={styles.stockCell}>
                      <span className={product.currentStock === 0 ? styles.outOfStock : ''}>
                        {product.currentStock}
                      </span>
                    </td>
                    <td className={styles.minStockCell}>{product.minStock}</td>
                    <td>{getStatusBadge(product.status)}</td>
                    <td>{new Date(product.lastRestocked).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredInventoryProducts.length === 0 && (
              <div className={styles.noProducts}>
                No products found for the selected filter.
              </div>
            )}
          </div>
          
          {/* Inventory Pagination Controls */}
          {filteredInventoryProducts.length > itemsPerPage && (
            <div className={styles.pagination}>
              <button
                className={`${styles.pageButton} ${inventoryPage === 1 ? styles.disabled : ''}`}
                onClick={handleInventoryPrevPage}
                disabled={inventoryPage === 1}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {inventoryPage} of {inventoryTotalPages}
              </span>
              <button
                className={`${styles.pageButton} ${inventoryPage === inventoryTotalPages ? styles.disabled : ''}`}
                onClick={handleInventoryNextPage}
                disabled={inventoryPage === inventoryTotalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}