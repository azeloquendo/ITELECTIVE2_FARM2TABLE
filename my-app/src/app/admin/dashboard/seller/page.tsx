"use client";
import { useEffect, useState, useRef } from "react";
import { collection, getDocs, query, updateDoc, doc, where } from "firebase/firestore";
import { Search, MoreVertical, Eye, Trash2, Ban, RefreshCw } from "lucide-react";
import { db } from "@/utils/lib/firebase";
import styles from "./seller.module.css";

interface Seller {
  id: string;
  name: string;
  email: string;
  address: string;
  contactNumber: string;
  productsCount: number;
  status: "active" | "suspended";
  farmName?: string;
}

export default function SellerManagement() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSellers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatAddress = (addressData: any): string => {
    if (!addressData) return "No address provided";
    
    try {
      const parts = [];
      
      if (addressData.houseNo) parts.push(addressData.houseNo);
      if (addressData.streetName) parts.push(addressData.streetName);
      if (addressData.building) parts.push(addressData.building);
      if (addressData.barangay) parts.push(addressData.barangay);
      if (addressData.city) parts.push(addressData.city);
      if (addressData.province) parts.push(addressData.province);
      if (addressData.region) parts.push(addressData.region);
      if (addressData.postalCode) parts.push(addressData.postalCode);
      
      return parts.join(", ");
    } catch (error) {
      return "Invalid address format";
    }
  };

  const fetchSellers = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from sellers collection first
      const sellersQuery = query(collection(db, "sellers"));
      const sellersSnapshot = await getDocs(sellersQuery);
      
      if (sellersSnapshot.size > 0) {
        const sellersData: Seller[] = [];
        
        for (const doc of sellersSnapshot.docs) {
          const sellerData = doc.data();
          const productsCount = await getProductsCount(doc.id);
          const formattedAddress = formatAddress(sellerData.address);
          
          const seller: Seller = {
            id: doc.id,
            name: sellerData.fullName || sellerData.name || "Unknown Seller",
            email: sellerData.email || "No email",
            address: formattedAddress,
            contactNumber: sellerData.contact || sellerData.contactNumber || "No contact number",
            productsCount: productsCount,
            status: sellerData.status || "active",
            farmName: sellerData.farmName || sellerData.farm?.farmName || "No farm name"
          };
          
          sellersData.push(seller);
        }
        
        setSellers(sellersData);
        return;
      }
      
      // If no sellers collection, try users with seller role
      await fetchSellersFromUsers();
      
    } catch (error) {
      console.error("Error fetching sellers:", error);
      await fetchSellersFromUsers();
    } finally {
      setLoading(false);
    }
  };

  const fetchSellersFromUsers = async () => {
    try {
      const usersQuery = query(
        collection(db, "users"), 
        where("role", "==", "seller")
      );
      
      const querySnapshot = await getDocs(usersQuery);
      const sellersData: Seller[] = [];

      for (const doc of querySnapshot.docs) {
        const userData = doc.data();
        const productsCount = await getProductsCount(doc.id);
        const formattedAddress = formatAddress(userData.address);
        
        const seller: Seller = {
          id: doc.id,
          name: userData.fullName || "Unknown Seller",
          email: userData.email || "No email",
          address: formattedAddress,
          contactNumber: userData.contact || "No contact number",
          productsCount: productsCount,
          status: userData.status || "active",
          farmName: userData.farm?.farmName || "No farm name"
        };
        
        sellersData.push(seller);
      }

      setSellers(sellersData);
    } catch (error) {
      console.error("Error fetching sellers from users:", error);
      // No mock data fallback - just set empty array
      setSellers([]);
    }
  };

  const getProductsCount = async (sellerId: string): Promise<number> => {
    try {
      const productsQuery = query(
        collection(db, "products"),
        where("sellerId", "==", sellerId)
      );
      const productsSnapshot = await getDocs(productsQuery);
      return productsSnapshot.size;
    } catch (error) {
      console.error(`Error getting products count for seller ${sellerId}:`, error);
      return 0;
    }
  };

  const handleSuspend = async (sellerId: string) => {
    try {
      await updateDoc(doc(db, "sellers", sellerId), {
        status: "suspended"
      });
      setSellers(prev => prev.map(seller => 
        seller.id === sellerId ? { ...seller, status: "suspended" } : seller
      ));
      setActionMenu(null);
    } catch (error) {
      try {
        await updateDoc(doc(db, "users", sellerId), {
          status: "suspended"
        });
        setSellers(prev => prev.map(seller => 
          seller.id === sellerId ? { ...seller, status: "suspended" } : seller
        ));
        setActionMenu(null);
      } catch (userError) {
        setSellers(prev => prev.map(seller => 
          seller.id === sellerId ? { ...seller, status: "suspended" } : seller
        ));
        setActionMenu(null);
      }
    }
  };

  const handleRestore = async (sellerId: string) => {
    try {
      await updateDoc(doc(db, "sellers", sellerId), {
        status: "active"
      });
      setSellers(prev => prev.map(seller => 
        seller.id === sellerId ? { ...seller, status: "active" } : seller
      ));
      setActionMenu(null);
    } catch (error) {
      try {
        await updateDoc(doc(db, "users", sellerId), {
          status: "active"
        });
        setSellers(prev => prev.map(seller => 
          seller.id === sellerId ? { ...seller, status: "active" } : seller
        ));
        setActionMenu(null);
      } catch (userError) {
        setSellers(prev => prev.map(seller => 
          seller.id === sellerId ? { ...seller, status: "active" } : seller
        ));
        setActionMenu(null);
      }
    }
  };

  const handleDelete = async (sellerId: string) => {
    if (confirm("Are you sure you want to delete this seller? This action cannot be undone.")) {
      try {
        setSellers(prev => prev.filter(seller => seller.id !== sellerId));
        setActionMenu(null);
      } catch (error) {
        console.error("Error deleting seller:", error);
      }
    }
  };

  const getDropdownLabel = () => {
    return statusFilter === "all" ? "All Status" : 
           statusFilter === "active" ? "Active" : "Suspended";
  };

  const filteredSellers = sellers.filter(seller =>
    (seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.farmName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.address.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === "all" || seller.status === statusFilter)
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading sellers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Search and Filter Controls */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search sellers by name, email, farm, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Status Dropdown */}
        <div className={styles.filterControls}>
          <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button 
              className={`${styles.dropdownButton} ${statusFilter !== "all" ? styles.active : ''}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>{getDropdownLabel()}</span>
              <span className={`${styles.arrow} ${isDropdownOpen ? styles.arrowUp : styles.arrowDown}`}></span>
            </button>
            
            {isDropdownOpen && (
              <div className={styles.dropdownList}>
                <button
                  className={`${styles.dropdownItem} ${statusFilter === "all" ? styles.selected : ''}`}
                  onClick={() => {
                    setStatusFilter("all");
                    setIsDropdownOpen(false);
                  }}
                >
                  <span>All Status</span>
                </button>
                <button
                  className={`${styles.dropdownItem} ${statusFilter === "active" ? styles.selected : ''}`}
                  onClick={() => {
                    setStatusFilter("active");
                    setIsDropdownOpen(false);
                  }}
                >
                  <span>Active</span>
                </button>
                <button
                  className={`${styles.dropdownItem} ${statusFilter === "suspended" ? styles.selected : ''}`}
                  onClick={() => {
                    setStatusFilter("suspended");
                    setIsDropdownOpen(false);
                  }}
                >
                  <span>Suspended</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sellers Table */}
      <div className={styles.tableContainer}>
        <table className={styles.productsTable}>
          <thead>
            <tr>
              <th>Seller Profile</th>
              <th>Contact Information</th>
              <th>Farm Details</th>
              <th>Products</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSellers.length > 0 ? (
              filteredSellers.map((seller) => (
                <tr key={seller.id}>
                  <td>
                    <div className={styles.productInfo}>
                      <div className={styles.productDetails}>
                        <strong>{seller.name}</strong>
                        <span>{seller.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.contactInfo}>
                      <div className={styles.contactItem}>
                        <strong>Phone:</strong> {seller.contactNumber}
                      </div>
                      <div className={styles.contactItem}>
                        <strong>Address:</strong> {seller.address}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.farmInfo}>
                      {seller.farmName ? (
                        <strong>{seller.farmName}</strong>
                      ) : (
                        <span className={styles.noFarm}>No farm registered</span>
                      )}
                    </div>
                  </td>
                  <td className={styles.stock}>
                    {seller.productsCount}
                  </td>
                  <td>
                    <span className={`${styles.status} ${styles[seller.status]}`}>
                      {seller.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button 
                        className={styles.viewBtn}
                        onClick={() => {/* View details logic */}}
                        title="View Seller"
                      >
                        <Eye size={16} />
                      </button>
                      {seller.status === "active" ? (
                        <button 
                          className={styles.editBtn}
                          onClick={() => handleSuspend(seller.id)}
                          title="Suspend Seller"
                        >
                          <Ban size={16} />
                        </button>
                      ) : (
                        <button 
                          className={styles.editBtn}
                          onClick={() => handleRestore(seller.id)}
                          title="Restore Seller"
                        >
                          <RefreshCw size={16} />
                        </button>
                      )}
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(seller.id)}
                        title="Delete Seller"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className={styles.noProducts}>
                  <div className={styles.emptyState}>
                    <p>No sellers found</p>
                    <span>
                      {sellers.length === 0 
                        ? "No sellers found in the database" 
                        : "No sellers match your search criteria"
                      }
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}