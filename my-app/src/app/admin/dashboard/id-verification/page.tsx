"use client";
import { useEffect, useState, useRef } from "react";
import { collection, getDocs, query, updateDoc, doc, where } from "firebase/firestore";
import { Search, MoreVertical, Eye, CheckCircle, XCircle, Clock, Users, Store, User } from "lucide-react";
import { db } from "@/utils/lib/firebase";
import styles from "./idVerification.module.css";

interface IDVerification {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userType: "seller" | "buyer";
  idType: string;
  idNumber: string;
  frontImage: string;
  backImage: string;
  selfieImage: string;
  submittedAt: any;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: any;
  rejectionReason?: string;
  farmName?: string;
  accountStatus?: string;
  address?: string | {
    postalCode?: string;
    province?: string;
    location?: any;
    building?: string;
    city?: string;
    houseNo?: string;
    streetName?: string;
    region?: string;
    barangay?: string;
  };
  contactNumber?: string;
}

const formatAddress = (address: string | any): string => {
  if (!address) return "No address provided";
  
  if (typeof address === 'string') return address;
  
  if (typeof address === 'object') {
    const addressParts = [
      address.houseNo,
      address.streetName,
      address.barangay,
      address.city,
      address.province,
      address.region,
      address.postalCode
    ].filter(Boolean);
    
    return addressParts.length > 0 ? addressParts.join(', ') : 'Address format unavailable';
  }
  
  return 'Invalid address format';
};

const formatLocation = (location: any): string => {
  if (!location) return "Location not available";
  
  if (typeof location === 'string') return location;
  
  if (location && typeof location === 'object') {
    const locationParts = [
      location.barangay,
      location.city,
      location.province
    ].filter(Boolean);
    
    return locationParts.length > 0 ? locationParts.join(', ') : 'Location not available';
  }
  
  return 'Location not available';
};

type TabType = "all" | "sellers" | "buyers";

export default function IDVerification() {
  const [verifications, setVerifications] = useState<IDVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchVerifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      
      const verificationsData: IDVerification[] = [];
      
      // Fetch Sellers
      const sellersQuery = query(collection(db, "sellers"));
      const sellersSnapshot = await getDocs(sellersQuery);
      
      sellersSnapshot.forEach((doc) => {
        const sellerData = doc.data();
        
        if (sellerData.idVerification) {
          const verification: IDVerification = {
            id: doc.id,
            userId: sellerData.uid || doc.id,
            userName: sellerData.fullName || "Unknown Seller",
            userEmail: sellerData.email || "No email",
            userType: "seller",
            idType: sellerData.idVerification.idType || "Government ID",
            idNumber: sellerData.idVerification.idNumber || "N/A",
            frontImage: sellerData.idVerification.idFront || "/default-id.png",
            backImage: sellerData.idVerification.idBack || "/default-id.png",
            selfieImage: sellerData.idVerification.selfieWithId || "/default-avatar.png",
            submittedAt: sellerData.idVerification.submittedAt,
            status: sellerData.idVerification.status || "pending",
            reviewedBy: sellerData.idVerification.reviewedBy,
            reviewedAt: sellerData.idVerification.reviewedAt,
            rejectionReason: sellerData.idVerification.rejectionReason,
            farmName: sellerData.farm?.farmName || "No farm name",
            accountStatus: sellerData.accountStatus || "pending"
          };
          
          verificationsData.push(verification);
        }
      });
      
      // Fetch Buyers
      const buyersQuery = query(collection(db, "buyers"));
      const buyersSnapshot = await getDocs(buyersQuery);
      
      buyersSnapshot.forEach((doc) => {
        const buyerData = doc.data();
        
        if (buyerData.idVerification) {
          const verification: IDVerification = {
            id: doc.id,
            userId: buyerData.uid || doc.id,
            userName: buyerData.fullName || buyerData.name || "Unknown Buyer",
            userEmail: buyerData.email || "No email",
            userType: "buyer",
            idType: buyerData.idVerification.idType || "Government ID",
            idNumber: buyerData.idVerification.idNumber || "N/A",
            frontImage: buyerData.idVerification.idFront || "/default-id.png",
            backImage: buyerData.idVerification.idBack || "/default-id.png",
            selfieImage: buyerData.idVerification.selfieWithId || "/default-avatar.png",
            submittedAt: buyerData.idVerification.submittedAt,
            status: buyerData.idVerification.status || "pending",
            reviewedBy: buyerData.idVerification.reviewedBy,
            reviewedAt: buyerData.idVerification.reviewedAt,
            rejectionReason: buyerData.idVerification.rejectionReason,
            accountStatus: buyerData.accountStatus || "pending",
            address: buyerData.address,
            contactNumber: buyerData.contactNumber || buyerData.phone || "No contact"
          };
          
          verificationsData.push(verification);
        }
      });
      
      console.log("📋 Fetched ID verifications:", {
        total: verificationsData.length,
        sellers: verificationsData.filter(v => v.userType === "seller").length,
        buyers: verificationsData.filter(v => v.userType === "buyer").length
      });
      
      setVerifications(verificationsData);
      
    } catch (error) {
      console.error("❌ Error fetching ID verifications:", error);
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (verificationId: string, userType: "seller" | "buyer") => {
    try {
      const collectionName = userType === "seller" ? "sellers" : "buyers";
      
      await updateDoc(doc(db, collectionName, verificationId), {
        "idVerification.status": "approved",
        "idVerification.reviewedBy": "admin",
        "idVerification.reviewedAt": new Date(),
        "accountStatus": "active"
      });
      
      setVerifications(prev => prev.map(verification => 
        verification.id === verificationId ? { 
          ...verification, 
          status: "approved",
          reviewedBy: "admin",
          reviewedAt: new Date(),
          accountStatus: "active"
        } : verification
      ));
      
      console.log(`✅ Approved ID verification for ${userType}:`, verificationId);
    } catch (error) {
      console.error(`❌ Error approving ID verification for ${userType}:`, error);
    }
  };

  const handleReject = async (verificationId: string, userType: "seller" | "buyer") => {
    const reason = prompt("Please enter rejection reason:");
    if (reason) {
      try {
        const collectionName = userType === "seller" ? "sellers" : "buyers";
        
        await updateDoc(doc(db, collectionName, verificationId), {
          "idVerification.status": "rejected",
          "idVerification.reviewedBy": "admin",
          "idVerification.reviewedAt": new Date(),
          "idVerification.rejectionReason": reason,
          "accountStatus": "pending"
        });
        
        setVerifications(prev => prev.map(verification => 
          verification.id === verificationId ? { 
            ...verification, 
            status: "rejected",
            reviewedBy: "admin",
            reviewedAt: new Date(),
            rejectionReason: reason,
            accountStatus: "pending"
          } : verification
        ));
        
        console.log(`❌ Rejected ID verification for ${userType}:`, verificationId);
      } catch (error) {
        console.error(`❌ Error rejecting ID verification for ${userType}:`, error);
      }
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    try {
      if (date.seconds) {
        return new Date(date.seconds * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Invalid Date";
    }
  };

  const getStatusBadge = (verification: IDVerification) => {
    const baseStatus = verification.status;
    const accountStatus = verification.accountStatus;
    
    if (baseStatus === "approved" && accountStatus === "active") {
      return { text: "Active", class: "approved" };
    } else if (baseStatus === "approved") {
      return { text: "Approved", class: "approved" };
    } else if (baseStatus === "rejected") {
      return { text: "Rejected", class: "rejected" };
    } else {
      return { text: "Pending", class: "pending" };
    }
  };

  const getStatusDropdownLabel = () => {
    return statusFilter === "all" ? "All Status" : 
           statusFilter === "pending" ? "Pending" : 
           statusFilter === "approved" ? "Approved" : "Rejected";
  };

  const filteredVerifications = verifications.filter(verification => {
    const searchLower = searchTerm.toLowerCase();
    const formattedAddress = formatAddress(verification.address || "");
    
    const matchesSearch = (
      verification.userName.toLowerCase().includes(searchLower) ||
      verification.userEmail.toLowerCase().includes(searchLower) ||
      verification.idNumber.toLowerCase().includes(searchLower) ||
      verification.farmName?.toLowerCase().includes(searchLower) ||
      formattedAddress.toLowerCase().includes(searchLower) ||
      verification.contactNumber?.toLowerCase().includes(searchLower)
    );
    
    const matchesStatus = statusFilter === "all" || verification.status === statusFilter;
    const matchesTab = activeTab === "all" || 
                      (activeTab === "sellers" && verification.userType === "seller") ||
                      (activeTab === "buyers" && verification.userType === "buyer");
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  const sellersVerifications = filteredVerifications.filter(v => v.userType === "seller");
  const buyersVerifications = filteredVerifications.filter(v => v.userType === "buyer");

  const openImageModal = (imageUrl: string, title: string) => {
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      cursor: pointer;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      background: white;
      border-radius: 8px;
      padding: 20px;
      position: relative;
      cursor: default;
    `;
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 15px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
    `;
    
    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = title;
    image.style.cssText = `
      max-width: 100%;
      max-height: 70vh;
      display: block;
    `;
    
    const imageTitle = document.createElement('h3');
    imageTitle.textContent = title;
    imageTitle.style.cssText = `
      margin: 0 0 15px 0;
      color: #333;
      text-align: center;
    `;
    
    modalContent.appendChild(closeButton);
    modalContent.appendChild(imageTitle);
    modalContent.appendChild(image);
    modalOverlay.appendChild(modalContent);
    
    const closeModal = () => {
      document.body.removeChild(modalOverlay);
    };
    
    closeButton.onclick = closeModal;
    modalOverlay.onclick = (e) => {
      if (e.target === modalOverlay) closeModal();
    };
    
    document.body.appendChild(modalOverlay);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading ID verifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>ID Verification Dashboard</h1>
        <p>Review and manage seller and buyer identity verification requests</p>
      </div>

      {/* Stats Summary */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{verifications.length}</span>
          <span className={styles.statLabel}>Total Requests</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>
            {verifications.filter(v => v.userType === 'seller').length}
          </span>
          <span className={styles.statLabel}>Sellers</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>
            {verifications.filter(v => v.userType === 'buyer').length}
          </span>
          <span className={styles.statLabel}>Buyers</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>
            {verifications.filter(v => v.status === 'pending').length}
          </span>
          <span className={styles.statLabel}>Pending</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>
            {verifications.filter(v => v.status === 'approved').length}
          </span>
          <span className={styles.statLabel}>Approved</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>
            {verifications.filter(v => v.status === 'rejected').length}
          </span>
          <span className={styles.statLabel}>Rejected</span>
        </div>
      </div>

      {/* Search Controls */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, email, farm name, address, or ID number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Filter Controls */}
        <div className={styles.filterControls}>
          {/* Status Dropdown */}
          <div className={styles.dropdownContainer} ref={statusDropdownRef}>
            <button 
              className={`${styles.dropdownButton} ${statusFilter !== "all" ? styles.active : ''}`}
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
            >
              <span>{getStatusDropdownLabel()}</span>
              <span className={`${styles.arrow} ${isStatusDropdownOpen ? styles.arrowUp : styles.arrowDown}`}></span>
            </button>
            
            {isStatusDropdownOpen && (
              <div className={styles.dropdownList}>
                <button
                  className={`${styles.dropdownItem} ${statusFilter === "all" ? styles.selected : ''}`}
                  onClick={() => {
                    setStatusFilter("all");
                    setIsStatusDropdownOpen(false);
                  }}
                >
                  <span>All Status</span>
                </button>
                <button
                  className={`${styles.dropdownItem} ${statusFilter === "pending" ? styles.selected : ''}`}
                  onClick={() => {
                    setStatusFilter("pending");
                    setIsStatusDropdownOpen(false);
                  }}
                >
                  <span>Pending</span>
                </button>
                <button
                  className={`${styles.dropdownItem} ${statusFilter === "approved" ? styles.selected : ''}`}
                  onClick={() => {
                    setStatusFilter("approved");
                    setIsStatusDropdownOpen(false);
                  }}
                >
                  <span>Approved</span>
                </button>
                <button
                  className={`${styles.dropdownItem} ${statusFilter === "rejected" ? styles.selected : ''}`}
                  onClick={() => {
                    setStatusFilter("rejected");
                    setIsStatusDropdownOpen(false);
                  }}
                >
                  <span>Rejected</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === "all" ? styles.active : ''}`}
          onClick={() => setActiveTab("all")}
        >
          <Users size={16} />
          All Users ({verifications.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === "sellers" ? styles.active : ''}`}
          onClick={() => setActiveTab("sellers")}
        >
          <Store size={16} />
          Sellers ({verifications.filter(v => v.userType === 'seller').length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === "buyers" ? styles.active : ''}`}
          onClick={() => setActiveTab("buyers")}
        >
          <User size={16} />
          Buyers ({verifications.filter(v => v.userType === 'buyer').length})
        </button>
      </div>

      {/* Verifications Tables */}
      <div className={styles.tablesContainer}>
        {/* Sellers Table */}
        {(activeTab === "all" || activeTab === "sellers") && sellersVerifications.length > 0 && (
          <div className={styles.userTypeSection}>
            <div className={styles.sectionHeader}>
              <Store size={20} />
              <h2>Seller Verifications ({sellersVerifications.length})</h2>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.verificationsTable}>
                <thead>
                  <tr>
                    <th>Seller Information</th>
                    <th>ID Details</th>
                    <th>Farm Details</th>
                    <th>Submission Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sellersVerifications.map((verification) => {
                    const statusBadge = getStatusBadge(verification);
                    return (
                      <tr key={`seller-${verification.id}`}>
                        <td>
                          <div className={styles.userInfo}>
                            <div className={styles.userImage}>
                              <img 
                                src={verification.selfieImage} 
                                alt={verification.userName}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/default-avatar.png';
                                }}
                              />
                            </div>
                            <div className={styles.userDetails}>
                              <strong>{verification.userName}</strong>
                              <span>{verification.userEmail}</span>
                              <span className={`${styles.userType} ${styles.seller}`}>
                                <Store size={12} /> Seller
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.idInfo}>
                            <div className={styles.idItem}>
                              <strong>Type:</strong> {verification.idType}
                            </div>
                            <div className={styles.idItem}>
                              <strong>Number:</strong> {verification.idNumber}
                            </div>
                            <div className={styles.imagesPreview}>
                              <button 
                                className={styles.imageBtn}
                                onClick={() => openImageModal(verification.frontImage, "ID Front - " + verification.userName)}
                              >
                                ID Front
                              </button>
                              <button 
                                className={styles.imageBtn}
                                onClick={() => openImageModal(verification.backImage, "ID Back - " + verification.userName)}
                              >
                                ID Back
                              </button>
                              <button 
                                className={styles.imageBtn}
                                onClick={() => openImageModal(verification.selfieImage, "Selfie with ID - " + verification.userName)}
                              >
                                Selfie
                              </button>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.additionalInfo}>
                            <strong>{verification.farmName || "No Farm Name"}</strong>
                            <span>Account: {verification.accountStatus || "pending"}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.dateInfo}>
                            {formatDate(verification.submittedAt)}
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.status} ${styles[statusBadge.class]}`}>
                            {verification.status === "pending" && <Clock size={12} />}
                            {verification.status === "approved" && <CheckCircle size={12} />}
                            {verification.status === "rejected" && <XCircle size={12} />}
                            {statusBadge.text}
                          </span>
                          {verification.rejectionReason && (
                            <div className={styles.rejectionReason}>
                              Reason: {verification.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button 
                              className={styles.viewBtn}
                              onClick={() => {
                                openImageModal(verification.frontImage, "ID Front - " + verification.userName);
                                setTimeout(() => {
                                  openImageModal(verification.backImage, "ID Back - " + verification.userName);
                                }, 100);
                                setTimeout(() => {
                                  openImageModal(verification.selfieImage, "Selfie with ID - " + verification.userName);
                                }, 200);
                              }}
                              title="View All Documents"
                            >
                              <Eye size={16} />
                              View All
                            </button>
                            {verification.status === "pending" && (
                              <div className={styles.reviewActions}>
                                <button 
                                  className={styles.approveBtn}
                                  onClick={() => handleApprove(verification.id, verification.userType)}
                                  title="Approve and Activate Seller Account"
                                >
                                  <CheckCircle size={16} />
                                  Approve
                                </button>
                                <button 
                                  className={styles.rejectBtn}
                                  onClick={() => handleReject(verification.id, verification.userType)}
                                  title="Reject Seller Verification"
                                >
                                  <XCircle size={16} />
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Buyers Table */}
        {(activeTab === "all" || activeTab === "buyers") && buyersVerifications.length > 0 && (
          <div className={styles.userTypeSection}>
            <div className={styles.sectionHeader}>
              <User size={20} />
              <h2>Buyer Verifications ({buyersVerifications.length})</h2>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.verificationsTable}>
                <thead>
                  <tr>
                    <th>Buyer Information</th>
                    <th>ID Details</th>
                    <th>Contact Details</th>
                    <th>Submission Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {buyersVerifications.map((verification) => {
                    const statusBadge = getStatusBadge(verification);
                    const formattedAddress = formatAddress(verification.address || "");
                    
                    return (
                      <tr key={`buyer-${verification.id}`}>
                        <td>
                          <div className={styles.userInfo}>
                            <div className={styles.userImage}>
                              <img 
                                src={verification.selfieImage} 
                                alt={verification.userName}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/default-avatar.png';
                                }}
                              />
                            </div>
                            <div className={styles.userDetails}>
                              <strong>{verification.userName}</strong>
                              <span>{verification.userEmail}</span>
                              <span className={`${styles.userType} ${styles.buyer}`}>
                                <User size={12} /> Buyer
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.idInfo}>
                            <div className={styles.idItem}>
                              <strong>Type:</strong> {verification.idType}
                            </div>
                            <div className={styles.idItem}>
                              <strong>Number:</strong> {verification.idNumber}
                            </div>
                            <div className={styles.imagesPreview}>
                              <button 
                                className={styles.imageBtn}
                                onClick={() => openImageModal(verification.frontImage, "ID Front - " + verification.userName)}
                              >
                                ID Front
                              </button>
                              <button 
                                className={styles.imageBtn}
                                onClick={() => openImageModal(verification.backImage, "ID Back - " + verification.userName)}
                              >
                                ID Back
                              </button>
                              <button 
                                className={styles.imageBtn}
                                onClick={() => openImageModal(verification.selfieImage, "Selfie with ID - " + verification.userName)}
                              >
                                Selfie
                              </button>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.additionalInfo}>
                            <strong>Address</strong>
                            <span title={formattedAddress}>
                              {formattedAddress.length > 50 
                                ? formattedAddress.substring(0, 50) + '...' 
                                : formattedAddress
                              }
                            </span>
                            <strong>Contact</strong>
                            <span>{verification.contactNumber || "No contact"}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.dateInfo}>
                            {formatDate(verification.submittedAt)}
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.status} ${styles[statusBadge.class]}`}>
                            {verification.status === "pending" && <Clock size={12} />}
                            {verification.status === "approved" && <CheckCircle size={12} />}
                            {verification.status === "rejected" && <XCircle size={12} />}
                            {statusBadge.text}
                          </span>
                          {verification.rejectionReason && (
                            <div className={styles.rejectionReason}>
                              Reason: {verification.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button 
                              className={styles.viewBtn}
                              onClick={() => {
                                openImageModal(verification.frontImage, "ID Front - " + verification.userName);
                                setTimeout(() => {
                                  openImageModal(verification.backImage, "ID Back - " + verification.userName);
                                }, 100);
                                setTimeout(() => {
                                  openImageModal(verification.selfieImage, "Selfie with ID - " + verification.userName);
                                }, 200);
                              }}
                              title="View All Documents"
                            >
                              <Eye size={16} />
                              View All
                            </button>
                            {verification.status === "pending" && (
                              <div className={styles.reviewActions}>
                                <button 
                                  className={styles.approveBtn}
                                  onClick={() => handleApprove(verification.id, verification.userType)}
                                  title="Approve and Activate Buyer Account"
                                >
                                  <CheckCircle size={16} />
                                  Approve
                                </button>
                                <button 
                                  className={styles.rejectBtn}
                                  onClick={() => handleReject(verification.id, verification.userType)}
                                  title="Reject Buyer Verification"
                                >
                                  <XCircle size={16} />
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredVerifications.length === 0 && (
          <div className={styles.noVerifications}>
            <div className={styles.emptyState}>
              <p>No ID verification requests found</p>
              <span>
                {searchTerm || statusFilter !== "all" || activeTab !== "all"
                  ? "No verification requests match your search criteria" 
                  : "No ID verification requests pending"
                }
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}