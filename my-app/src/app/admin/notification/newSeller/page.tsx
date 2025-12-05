"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { Search, Mail, Phone, MapPin, Calendar, User } from "lucide-react";
import { db } from "@/utils/lib/firebase";
import styles from "./newSeller.module.css";

interface NewSeller {
  id: string;
  farmName: string;
  address: string;
  dateCreated: any;
  ownerName: string;
  email: string;
  contactNumber?: string;
  profileImage?: string;
}

export default function NewSellerPage() {
  const [newSellers, setNewSellers] = useState<NewSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchNewSellers();
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

  const formatDate = (dateInput: any): string => {
    if (!dateInput) return "Recently";
    
    try {
      // Handle Firebase Timestamp
      if (dateInput.toDate) {
        return dateInput.toDate().toLocaleDateString('en-PH', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      
      // Handle regular Date object or string
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return "Recently";
      
      return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return "Recently";
    }
  };

  const fetchNewSellers = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from sellers collection first
      const sellersQuery = query(
        collection(db, "sellers"),
        orderBy("createdAt", "desc")
      );
      const sellersSnapshot = await getDocs(sellersQuery);
      
      if (sellersSnapshot.size > 0) {
        const sellersData: NewSeller[] = [];
        
        sellersSnapshot.forEach((doc) => {
          const sellerData = doc.data();
          const formattedAddress = formatAddress(sellerData.address);
          
          const seller: NewSeller = {
            id: doc.id,
            farmName: sellerData.farmName || sellerData.farm?.farmName || "Unnamed Farm",
            address: formattedAddress,
            dateCreated: sellerData.createdAt || sellerData.dateCreated || new Date(),
            ownerName: sellerData.fullName || sellerData.ownerName || "Unknown Owner",
            email: sellerData.email || "No email",
            contactNumber: sellerData.contact || sellerData.contactNumber,
            profileImage: sellerData.profilePic || sellerData.profileImage || sellerData.farm?.logo
          };
          
          sellersData.push(seller);
        });
        
        setNewSellers(sellersData);
        return;
      }
      
      // If no sellers collection, try users with seller role
      await fetchSellersFromUsers();
      
    } catch (error) {
      console.error("Error fetching new sellers:", error);
      await fetchSellersFromUsers();
    } finally {
      setLoading(false);
    }
  };

  const fetchSellersFromUsers = async () => {
    try {
      const usersQuery = query(
        collection(db, "users"),
        where("role", "==", "seller"),
        orderBy("createdAt", "desc")
      );
      const usersSnapshot = await getDocs(usersQuery);
      const sellersData: NewSeller[] = [];

      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        const formattedAddress = formatAddress(userData.address);
        
        const seller: NewSeller = {
          id: doc.id,
          farmName: userData.farm?.farmName || "Unnamed Farm",
          address: formattedAddress,
          dateCreated: userData.createdAt || new Date(),
          ownerName: userData.fullName || "Unknown Owner",
          email: userData.email || "No email",
          contactNumber: userData.contact,
          profileImage: userData.profilePic || userData.farm?.logo
        };
        
        sellersData.push(seller);
      });

      setNewSellers(sellersData);
    } catch (error) {
      console.error("Error fetching sellers from users:", error);
      setNewSellers([]);
    }
  };

  const filteredSellers = newSellers.filter(seller => 
    seller.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.contactNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading new sellers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>New Sellers</h1>
        <p className={styles.subtitle}>Recently registered sellers and farms on the platform</p>
      </div>

      {/* Search */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search sellers by farm name, owner, address, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Sellers Count */}
      <div className={styles.sellersCount}>
        Showing {filteredSellers.length} of {newSellers.length} sellers
      </div>

      {/* Sellers List */}
      <div className={styles.sellersContainer}>
        {filteredSellers.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏪</div>
            <p className={styles.emptyTitle}>
              {newSellers.length === 0 
                ? "No sellers registered yet" 
                : "No sellers match your search"
              }
            </p>
            <span className={styles.emptySubtitle}>
              {newSellers.length === 0 
                ? "Seller registrations will appear here" 
                : "Try adjusting your search terms"
              }
            </span>
          </div>
        ) : (
          filteredSellers.map((seller) => (
            <div key={seller.id} className={styles.sellerCard}>
              {/* Profile Image */}
              <div className={styles.profileSection}>
                <img 
                  src={seller.profileImage || "/default-avatar.png"} 
                  alt={seller.farmName}
                  className={styles.profileImage}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-avatar.png';
                  }}
                />
              </div>
              
              <div className={styles.sellerContent}>
                {/* Seller Header */}
                <div className={styles.sellerHeader}>
                  <div>
                    <h3 className={styles.farmName}>{seller.farmName}</h3>
                    <div className={styles.ownerInfo}>
                      <User size={14} />
                      <span className={styles.ownerName}>{seller.ownerName}</span>
                    </div>
                  </div>
                  <div className={styles.joinDate}>
                    <Calendar size={14} />
                    <span>Joined {formatDate(seller.dateCreated)}</span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className={styles.contactInfo}>
                  <div className={styles.contactItem}>
                    <Mail size={16} className={styles.contactIcon} />
                    <span className={styles.contactText}>{seller.email}</span>
                  </div>
                  
                  {seller.contactNumber && (
                    <div className={styles.contactItem}>
                      <Phone size={16} className={styles.contactIcon} />
                      <span className={styles.contactText}>{seller.contactNumber}</span>
                    </div>
                  )}
                  
                  <div className={styles.contactItem}>
                    <MapPin size={16} className={styles.contactIcon} />
                    <span className={styles.contactText}>{seller.address}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}