"use client";
import { useEffect, useState, useRef } from "react";
import { collection, getDocs, query, updateDoc, doc, where } from "firebase/firestore";
import { Search, MoreVertical, Eye, Trash2, Ban } from "lucide-react";
import { db } from "@/utils/lib/firebase";
import styles from "./buyer.module.css";

interface Address {
  barangay: string;
  building?: string;
  city: string;
  houseNo: string;
  location?: {
    lat: number;
    lng: number;
  };
  postalCode: string;
  province: string;
  region: string;
  streetName: string;
}

interface Buyer {
  id: string;
  profileImage?: string;
  name: string;
  email: string;
  address: string;
  contactNumber: string;
  totalOrders: number;
  status: "active" | "suspended";
  age?: number;
  birthday?: string;
  createdAt?: any;
  emailVerified?: boolean;
  followingFarms?: string[];
  role?: string;
  uid?: string;
  updatedAt?: any;
}

export default function BuyerManagement() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBuyers();
  }, []);

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
      const address: Address = addressData;
      const parts = [];
      
      if (address.houseNo) parts.push(address.houseNo);
      if (address.streetName) parts.push(address.streetName);
      if (address.building) parts.push(address.building);
      if (address.barangay) parts.push(address.barangay);
      if (address.city) parts.push(address.city);
      if (address.province) parts.push(address.province);
      if (address.region) parts.push(address.region);
      if (address.postalCode) parts.push(address.postalCode);
      
      return parts.join(", ");
    } catch (error) {
      return "Invalid address format";
    }
  };

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      
      // Query the buyers collection directly
      const buyersQuery = query(collection(db, "buyers"));
      const querySnapshot = await getDocs(buyersQuery);
      
      if (querySnapshot.size === 0) {
        // Try to fetch from users collection as fallback
        await fetchBuyersFromUsers();
        return;
      }
      
      const buyersData: Buyer[] = [];
      
      querySnapshot.forEach((doc) => {
        const buyerData = doc.data();
        
        const formattedAddress = formatAddress(buyerData.address);
        
        const buyer: Buyer = {
          id: doc.id,
          profileImage: buyerData.profilePic || buyerData.profileImage || "/default-avatar.png",
          name: buyerData.fullName || buyerData.name || "Unknown Buyer",
          email: buyerData.email || "No email",
          address: formattedAddress,
          contactNumber: buyerData.contact || buyerData.contactNumber || buyerData.phone || "No contact number",
          totalOrders: buyerData.totalOrders || buyerData.ordersCount || 0,
          status: buyerData.status || "active",
          age: buyerData.age,
          birthday: buyerData.birthday,
          createdAt: buyerData.createdAt,
          emailVerified: buyerData.emailVerified,
          followingFarms: buyerData.followingFarms || [],
          role: buyerData.role,
          uid: buyerData.uid,
          updatedAt: buyerData.updatedAt
        };
        
        buyersData.push(buyer);
      });
      
      setBuyers(buyersData);
      
    } catch (error) {
      // Try users collection as fallback
      await fetchBuyersFromUsers();
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyersFromUsers = async () => {
    try {
      const usersQuery = query(
        collection(db, "users"),
        where("role", "==", "buyer")
      );
      
      const querySnapshot = await getDocs(usersQuery);
      
      if (querySnapshot.size === 0) {
        useMockData();
        return;
      }
      
      const buyersData: Buyer[] = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        const formattedAddress = formatAddress(userData.address);
        
        const buyer: Buyer = {
          id: doc.id,
          profileImage: userData.profilePic || userData.profileImage || "/default-avatar.png",
          name: userData.fullName || userData.name || userData.email || "Unknown Buyer",
          email: userData.email || "No email",
          address: formattedAddress,
          contactNumber: userData.contact || userData.contactNumber || userData.phone || "No contact number",
          totalOrders: userData.totalOrders || userData.ordersCount || 0,
          status: userData.status || "active",
          age: userData.age,
          birthday: userData.birthday,
          createdAt: userData.createdAt,
          emailVerified: userData.emailVerified,
          followingFarms: userData.followingFarms || [],
          role: userData.role,
          uid: userData.uid,
          updatedAt: userData.updatedAt
        };
        
        buyersData.push(buyer);
      });
      
      setBuyers(buyersData);
      
    } catch (error) {
      useMockData();
    }
  };

  const useMockData = () => {
    const mockBuyers: Buyer[] = [
      {
        id: "1",
        profileImage: "/default-avatar.png",
        name: "Sarah Johnson",
        email: "sarah.johnson@email.com",
        address: "123 Main Street, Makati City, Metro Manila",
        contactNumber: "+639171234567",
        totalOrders: 15,
        status: "active",
        age: 28,
        emailVerified: true,
        followingFarms: ["farm1", "farm2"]
      },
      {
        id: "2",
        profileImage: "/default-avatar.png",
        name: "Michael Chen",
        email: "michael.chen@email.com",
        address: "456 Oak Avenue, Quezon City, Metro Manila",
        contactNumber: "+639182345678",
        totalOrders: 8,
        status: "active",
        age: 32,
        emailVerified: true,
        followingFarms: ["farm1"]
      },
      {
        id: "3",
        profileImage: "/default-avatar.png",
        name: "Lisa Garcia",
        email: "lisa.garcia@email.com",
        address: "789 Pine Road, Cebu City, Cebu",
        contactNumber: "+639193456789",
        totalOrders: 23,
        status: "active",
        age: 25,
        emailVerified: false,
        followingFarms: ["farm1", "farm2", "farm3"]
      },
      {
        id: "4",
        profileImage: "/default-avatar.png",
        name: "David Martinez",
        email: "david.martinez@email.com",
        address: "321 Elm Street, Davao City, Davao del Sur",
        contactNumber: "+639104567890",
        totalOrders: 5,
        status: "suspended",
        age: 29,
        emailVerified: true,
        followingFarms: []
      }
    ];
    setBuyers(mockBuyers);
  };

  const handleSuspend = async (buyerId: string) => {
    try {
      await updateDoc(doc(db, "buyers", buyerId), {
        status: "suspended"
      });
      setBuyers(prev => prev.map(buyer => 
        buyer.id === buyerId ? { ...buyer, status: "suspended" } : buyer
      ));
    } catch (error) {
      try {
        await updateDoc(doc(db, "users", buyerId), {
          status: "suspended"
        });
        setBuyers(prev => prev.map(buyer => 
          buyer.id === buyerId ? { ...buyer, status: "suspended" } : buyer
        ));
      } catch (userError) {
        setBuyers(prev => prev.map(buyer => 
          buyer.id === buyerId ? { ...buyer, status: "suspended" } : buyer
        ));
      }
    }
  };

  const handleActivate = async (buyerId: string) => {
    try {
      await updateDoc(doc(db, "buyers", buyerId), {
        status: "active"
      });
      setBuyers(prev => prev.map(buyer => 
        buyer.id === buyerId ? { ...buyer, status: "active" } : buyer
      ));
    } catch (error) {
      try {
        await updateDoc(doc(db, "users", buyerId), {
          status: "active"
        });
        setBuyers(prev => prev.map(buyer => 
          buyer.id === buyerId ? { ...buyer, status: "active" } : buyer
        ));
      } catch (userError) {
        setBuyers(prev => prev.map(buyer => 
          buyer.id === buyerId ? { ...buyer, status: "active" } : buyer
        ));
      }
    }
  };

  const handleDelete = async (buyerId: string) => {
    if (confirm("Are you sure you want to delete this buyer? This action cannot be undone.")) {
      setBuyers(prev => prev.filter(buyer => buyer.id !== buyerId));
    }
  };

  const getDropdownLabel = () => {
    return statusFilter === "all" ? "All Status" : 
           statusFilter === "active" ? "Active" : "Suspended";
  };

  const filteredBuyers = buyers.filter(buyer =>
    (buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    buyer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    buyer.address.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === "all" || buyer.status === statusFilter)
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading buyers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Search Controls */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search buyers by name, email, or address..."
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

      {/* Buyers Table */}
      <div className={styles.tableContainer}>
        <table className={styles.productsTable}>
          <thead>
            <tr>
              <th>Buyer Profile</th>
              <th>Contact Information</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBuyers.length > 0 ? (
              filteredBuyers.map((buyer) => (
                <tr key={buyer.id}>
                  <td>
                    <div className={styles.productInfo}>
                      <div className={styles.productImage}>
                        <img 
                          src={buyer.profileImage} 
                          alt={buyer.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-avatar.png';
                          }}
                        />
                      </div>
                      <div className={styles.productDetails}>
                        <strong>{buyer.name}</strong>
                        <span>{buyer.email}</span>
                        {buyer.age && <span>Age: {buyer.age}</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.contactInfo}>
                      <div className={styles.contactItem}>
                        <strong>Phone:</strong> {buyer.contactNumber}
                      </div>
                      <div className={styles.contactItem}>
                        <strong>Email:</strong> {buyer.email}
                      </div>
                      <div className={styles.contactItem}>
                        <strong>Verified:</strong> 
                        <span className={buyer.emailVerified ? styles.verified : styles.notVerified}>
                          {buyer.emailVerified ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.locationInfo}>
                      {buyer.address}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.status} ${styles[buyer.status]}`}>
                      {buyer.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button 
                        className={styles.viewBtn}
                        onClick={() => {
                          // Add your view logic here
                        }}
                        title="View Buyer"
                      >
                        <Eye size={16} />
                      </button>
                      {buyer.status === "active" ? (
                        <button 
                          className={styles.editBtn}
                          onClick={() => handleSuspend(buyer.id)}
                          title="Suspend Buyer"
                        >
                          <Ban size={16} />
                        </button>
                      ) : (
                        <button 
                          className={styles.editBtn}
                          onClick={() => handleActivate(buyer.id)}
                          title="Activate Buyer"
                        >
                          <Ban size={16} />
                        </button>
                      )}
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(buyer.id)}
                        title="Delete Buyer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className={styles.noProducts}>
                  <div className={styles.emptyState}>
                    <p>No buyers found</p>
                    <span>
                      {searchTerm || statusFilter !== "all" 
                        ? "No buyers match your search criteria" 
                        : "No buyers found in the system"
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