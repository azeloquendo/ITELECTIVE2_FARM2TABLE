"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { Search, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { db } from "@/utils/lib/firebase";
import styles from "./newBuyer.module.css";

interface NewBuyer {
  id: string;
  name: string;
  address: string;
  dateCreated: any;
  email: string;
  contactNumber?: string;
  profileImage?: string;
}

export default function NewBuyerPage() {
  const [newBuyers, setNewBuyers] = useState<NewBuyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchNewBuyers();
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

  const fetchNewBuyers = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from buyers collection first
      const buyersQuery = query(
        collection(db, "buyers"),
        orderBy("createdAt", "desc")
      );
      const buyersSnapshot = await getDocs(buyersQuery);
      
      if (buyersSnapshot.size > 0) {
        const buyersData: NewBuyer[] = [];
        
        buyersSnapshot.forEach((doc) => {
          const buyerData = doc.data();
          const formattedAddress = formatAddress(buyerData.address);
          
          const buyer: NewBuyer = {
            id: doc.id,
            name: buyerData.fullName || buyerData.name || "Unknown Buyer",
            address: formattedAddress,
            dateCreated: buyerData.createdAt || buyerData.dateCreated || new Date(),
            email: buyerData.email || "No email",
            contactNumber: buyerData.contact || buyerData.contactNumber,
            profileImage: buyerData.profilePic || buyerData.profileImage
          };
          
          buyersData.push(buyer);
        });
        
        setNewBuyers(buyersData);
        return;
      }
      
      // If no buyers collection, try users with buyer role
      await fetchBuyersFromUsers();
      
    } catch (error) {
      console.error("Error fetching new buyers:", error);
      await fetchBuyersFromUsers();
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyersFromUsers = async () => {
    try {
      const usersQuery = query(
        collection(db, "users"),
        where("role", "==", "buyer"),
        orderBy("createdAt", "desc")
      );
      const usersSnapshot = await getDocs(usersQuery);
      const buyersData: NewBuyer[] = [];

      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        const formattedAddress = formatAddress(userData.address);
        
        const buyer: NewBuyer = {
          id: doc.id,
          name: userData.fullName || "Unknown Buyer",
          address: formattedAddress,
          dateCreated: userData.createdAt || new Date(),
          email: userData.email || "No email",
          contactNumber: userData.contact,
          profileImage: userData.profilePic
        };
        
        buyersData.push(buyer);
      });

      setNewBuyers(buyersData);
    } catch (error) {
      console.error("Error fetching buyers from users:", error);
      setNewBuyers([]);
    }
  };

  const filteredBuyers = newBuyers.filter(buyer => 
    buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    buyer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    buyer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    buyer.contactNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading new buyers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>New Buyers</h1>
        <p className={styles.subtitle}>Recently registered buyers on the platform</p>
      </div>

      {/* Search */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search buyers by name, email, address, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Buyers Count */}
      <div className={styles.buyersCount}>
        Showing {filteredBuyers.length} of {newBuyers.length} buyers
      </div>

      {/* Buyers List */}
      <div className={styles.buyersContainer}>
        {filteredBuyers.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👤</div>
            <p className={styles.emptyTitle}>
              {newBuyers.length === 0 
                ? "No buyers registered yet" 
                : "No buyers match your search"
              }
            </p>
            <span className={styles.emptySubtitle}>
              {newBuyers.length === 0 
                ? "Buyer registrations will appear here" 
                : "Try adjusting your search terms"
              }
            </span>
          </div>
        ) : (
          filteredBuyers.map((buyer) => (
            <div key={buyer.id} className={styles.buyerCard}>
              {/* Profile Image */}
              <div className={styles.profileSection}>
                <img 
                  src={buyer.profileImage || "/default-avatar.png"} 
                  alt={buyer.name}
                  className={styles.profileImage}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-avatar.png';
                  }}
                />
              </div>
              
              <div className={styles.buyerContent}>
                {/* Buyer Header */}
                <div className={styles.buyerHeader}>
                  <h3 className={styles.buyerName}>{buyer.name}</h3>
                  <div className={styles.joinDate}>
                    <Calendar size={14} />
                    <span>Joined {formatDate(buyer.dateCreated)}</span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className={styles.contactInfo}>
                  <div className={styles.contactItem}>
                    <Mail size={16} className={styles.contactIcon} />
                    <span className={styles.contactText}>{buyer.email}</span>
                  </div>
                  
                  {buyer.contactNumber && (
                    <div className={styles.contactItem}>
                      <Phone size={16} className={styles.contactIcon} />
                      <span className={styles.contactText}>{buyer.contactNumber}</span>
                    </div>
                  )}
                  
                  <div className={styles.contactItem}>
                    <MapPin size={16} className={styles.contactIcon} />
                    <span className={styles.contactText}>{buyer.address}</span>
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