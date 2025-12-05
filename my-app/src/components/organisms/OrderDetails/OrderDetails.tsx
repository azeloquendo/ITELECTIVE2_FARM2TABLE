"use client";
import { Calendar, CheckCircle, Clock, CreditCard, FileText, MapPin, MessageSquare, Package, Phone, Receipt, RefreshCcw, Truck, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { StatusBadge } from "../../../components";
import GenerateReceiptModal from "../GenerateReceiptModal/GenerateReceiptModal";
import styles from "./OrderDetails.module.css";
// Firebase imports
import { Timestamp, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../utils/lib/firebase";
import { createOrderStatusNotification } from "../../../utils/lib/OrderNotification";
// Import the new OrderStatusModal from auth modals
import { AVAILABLE_COURIERS, STATUS_OPTIONS, TRACKING_PREFIX } from "../../../constants/seller/orders";
import { Courier, OrderDetailsData, OrderDetailsProps } from "../../../interface/seller/orders";
import OrderStatusModal from "../../../components/organisms/auth/modals/OrderStatusModal/OrderStatusModal";

const generateTrackingNumber = () => {
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `${TRACKING_PREFIX}${random}`;
};
// Status update messages for notifications
const getStatusUpdateMessage = (status: string, orderId: string) => {
  const shortOrderId = orderId.slice(-6).toUpperCase();
  
  switch (status) {
    case "processing":
      return `Your order #${shortOrderId} is now being prepared! We'll notify you when it's ready.`;
    case "ready_for_pickup":
      return `Your order #${shortOrderId} is ready for pickup! Courier will arrive soon.`;
    case "shipped":
      return `Your order #${shortOrderId} has been shipped! Track your delivery in real-time.`;
    case "completed":
      return `Your order #${shortOrderId} has been completed! Thank you for your purchase.`;
    case "canceled":
      return `Your order #${shortOrderId} has been canceled. Contact support if you have questions.`;
    case "pending":
      return `Your order #${shortOrderId} is pending confirmation.`;
    default:
      return `Your order #${shortOrderId} status has been updated to ${status}.`;
  }
};
type NotificationStatus = 'pending' | 'preparing' | 'shipped' | 'completed' | 'cancelled';
const notificationStatusMap: Record<string, NotificationStatus> = {
  'pending': 'pending',
  'processing': 'preparing',
  'ready_for_pickup': 'preparing',
  'shipped': 'shipped',
  'completed': 'completed',
  'canceled': 'cancelled'
};
export default function OrderDetails({ order, onClose, onStatusUpdate }: OrderDetailsProps) {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [sellerName, setSellerName] = useState<string>("Seller");
  const [currentSeller, setCurrentSeller] = useState<any>(null);
  const [fullOrderData, setFullOrderData] = useState<OrderDetailsData | null>(null);
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  const [requiresColdChain, setRequiresColdChain] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const handleBookCourier = async () => {
    if (!selectedCourier) return;
    
    setIsUpdating(true);
    try {
      const trackingNumber = generateTrackingNumber();
      
      // Update order in Firebase
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        status: 'ready_for_pickup',
        logistics: {
          courier: selectedCourier.name,
          tracking_number: trackingNumber,
          cold_chain: requiresColdChain,
          delivery_status: 'scheduled'
        },
        updatedAt: Timestamp.now()
      });
      console.log('✅ Courier booked:', selectedCourier.name, 'Tracking:', trackingNumber);
      setShowCourierModal(false);
      
      // Show success modal instead of alert
      setSuccessMessage(`Courier booked successfully! Tracking: ${trackingNumber}`);
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('❌ Error booking courier:', error);
      setSuccessMessage('Failed to book courier');
      setShowSuccessModal(true);
    } finally {
      setIsUpdating(false);
    }
  };
  // Enhanced data fetching with proper mapping
  useEffect(() => {
    const fetchCompleteOrderData = async () => {
      try {
        const orderRef = doc(db, "orders", order.id);
        const orderDoc = await getDoc(orderRef);
        
        if (orderDoc.exists()) {
          const firebaseData = orderDoc.data();
          console.log("🔥 Raw Firebase data:", firebaseData);
          
          // Transform Firebase data to match your interface with proper fallbacks
          const transformedOrder: OrderDetailsData = {
            id: orderDoc.id,
            buyerId: firebaseData.buyerId,
            buyerName: firebaseData.buyerInfo?.name || firebaseData.buyerName || 'Unknown Buyer',
            buyerInfo: firebaseData.buyerInfo || {
              name: firebaseData.buyerName || 'Unknown Buyer',
              address: firebaseData.buyerInfo?.address || firebaseData.address || 'No address provided',
              contact: firebaseData.buyerInfo?.contact || firebaseData.contact || 'No contact provided',
              email: firebaseData.buyerInfo?.email || 'No email provided',
              id: firebaseData.buyerInfo?.id || firebaseData.buyerId
            },
            products: firebaseData.products || firebaseData.sellers?.[0]?.items || [],
            totalPrice: firebaseData.totalPrice || 0,
            orderDate: firebaseData.orderDate || firebaseData.createdAt,
            status: firebaseData.status || 'pending',
            contact: firebaseData.buyerInfo?.contact || firebaseData.contact || 'No contact provided',
            address: firebaseData.buyerInfo?.address || firebaseData.address || 'No address provided',
            deliveryMethod: firebaseData.deliveryMethod || 'Delivery',
            specialInstructions: firebaseData.specialInstructions || 
                                firebaseData.sellers?.[0]?.items?.[0]?.notes || 
                                'No special instructions provided',
            sellers: firebaseData.sellers,
            createdAt: firebaseData.createdAt,
            updatedAt: firebaseData.updatedAt,
            logistics: firebaseData.logistics,
            
            // Add new fields with fallbacks
            payment: firebaseData.payment || {
              method: firebaseData.paymentMethod || "Cash on Delivery",
              status: firebaseData.paymentStatus || "pending"
            },
            delivery: firebaseData.delivery || {
              method: firebaseData.deliveryMethod || "Standard Delivery",
              time: firebaseData.deliveryTime || "Within 3-5 business days",
              estimatedDelivery: firebaseData.estimatedDelivery,
              trackingNumber: firebaseData.trackingNumber
            }
          };
          console.log("✅ Transformed order data:", transformedOrder);
          setFullOrderData(transformedOrder);
          setCurrentStatus(transformedOrder.status);
          setSelectedStatus(transformedOrder.status);
        }
      } catch (error) {
        console.error("Error fetching complete order data:", error);
        setFullOrderData(order);
      }
    };
    fetchCompleteOrderData();
  }, [order.id]);
  // Real-time updates
  useEffect(() => {
    const orderRef = doc(db, "orders", order.id);
    const unsubscribe = onSnapshot(orderRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const firebaseData = docSnapshot.data();
        const updatedOrder: OrderDetailsData = {
          id: docSnapshot.id,
          buyerId: firebaseData.buyerId,
          buyerName: firebaseData.buyerInfo?.name || firebaseData.buyerName || 'Unknown Buyer',
          buyerInfo: firebaseData.buyerInfo,
          products: firebaseData.products || firebaseData.sellers?.[0]?.items || [],
          totalPrice: firebaseData.totalPrice || 0,
          orderDate: firebaseData.orderDate || firebaseData.createdAt,
          status: firebaseData.status || 'pending',
          contact: firebaseData.buyerInfo?.contact || firebaseData.contact || 'No contact provided',
          address: firebaseData.buyerInfo?.address || firebaseData.address || 'No address provided',
          deliveryMethod: firebaseData.deliveryMethod || 'Delivery',
          specialInstructions: firebaseData.specialInstructions || 
                              firebaseData.sellers?.[0]?.items?.[0]?.notes || 
                              'No special instructions provided',
          sellers: firebaseData.sellers,
          createdAt: firebaseData.createdAt,
          updatedAt: firebaseData.updatedAt,
          logistics: firebaseData.logistics,
          
          // Add new fields with fallbacks
          payment: firebaseData.payment || {
            method: firebaseData.paymentMethod || "Cash on Delivery",
            status: firebaseData.paymentStatus || "pending"
          },
          delivery: firebaseData.delivery || {
            method: firebaseData.deliveryMethod || "Standard Delivery",
            time: firebaseData.deliveryTime || "Within 3-5 business days",
            estimatedDelivery: firebaseData.estimatedDelivery,
            trackingNumber: firebaseData.trackingNumber
          }
        };
        
        setFullOrderData(updatedOrder);
        setCurrentStatus(updatedOrder.status);
        setSelectedStatus(updatedOrder.status);
      }
    });
    return () => unsubscribe();
  }, [order.id]);
  // Get seller data from Firebase Auth
  useEffect(() => {
    const getCurrentSeller = async () => {
      try {
        const { onAuthStateChanged } = await import("firebase/auth");
        
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            setCurrentSeller(user);
            
            try {
              const sellerDoc = await getDoc(doc(db, "sellers", user.uid));
              if (sellerDoc.exists()) {
                const sellerData = sellerDoc.data();
                setSellerName(sellerData.businessName || sellerData.fullName || user.displayName || "Seller");
              } else {
                setSellerName(user.displayName || user.email?.split('@')[0] || "Seller");
              }
            } catch (error) {
              setSellerName(user.displayName || user.email?.split('@')[0] || "Seller");
            }
          }
        });
      } catch (error) {
        console.error("Error getting current seller:", error);
      }
    };
    getCurrentSeller();
  }, []);
  // Get seller name from order data if available
  useEffect(() => {
    if (fullOrderData?.sellers && fullOrderData.sellers.length > 0) {
      const firstSeller = fullOrderData.sellers[0];
      if (firstSeller.sellerName) {
        setSellerName(firstSeller.sellerName);
      }
    }
  }, [fullOrderData?.sellers]);
  // Helper functions to handle data mapping
  const getBuyerDisplayInfo = () => {
    const dataToUse = fullOrderData || order;
    
    return {
      name: dataToUse.buyerInfo?.name || dataToUse.buyerName || 'Unknown Buyer',
      contact: dataToUse.buyerInfo?.contact || dataToUse.contact || 'No contact provided',
      address: dataToUse.buyerInfo?.address || dataToUse.address || 'No address provided',
      email: dataToUse.buyerInfo?.email || 'No email provided'
    };
  };
  const getSpecialInstructions = () => {
    const dataToUse = fullOrderData || order;
    
    const instructions = dataToUse.specialInstructions || 
                        dataToUse.sellers?.[0]?.items?.[0]?.notes || 
                        'No special instructions provided';
    
    console.log("📝 Special instructions found:", instructions);
    return instructions;
  };
  const getDeliveryMethod = () => {
    const dataToUse = fullOrderData || order;
    
    return dataToUse.deliveryMethod || 
           (dataToUse.address && dataToUse.address !== 'No address provided' ? 'Delivery' : 'Pickup');
  };
  const getProducts = () => {
    const dataToUse = fullOrderData || order;
    
    if (dataToUse.products && dataToUse.products.length > 0) {
      return dataToUse.products;
    }
    
    if (dataToUse.sellers && dataToUse.sellers.length > 0) {
      return dataToUse.sellers[0].items || [];
    }
    
    return [];
  };
  const getBuyerId = () => {
    const dataToUse = fullOrderData || order;
    
    return dataToUse.buyerId || 
           dataToUse.buyerInfo?.id || 
           (dataToUse.buyerInfo as any)?.uid;
  };
  const handleStatusChange = (newStatus: string) => {
    console.log("🔄 Status change triggered:", newStatus);
    setSelectedStatus(newStatus);
    setShowStatusModal(true);
    setIsStatusDropdownOpen(false);
    console.log("✅ showStatusModal should be true now");
  };
  // Update order status and send notification
  const confirmStatusUpdate = async () => {
    console.log("✅ Confirm status update triggered");
    setIsUpdating(true);
    try {
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        status: selectedStatus,
        updatedAt: Timestamp.now()
      });
      try {
        const buyerId = getBuyerId();
        console.log("👤 Buyer ID for notification:", buyerId);
        if (buyerId) {
          const notificationStatus: NotificationStatus = 
            notificationStatusMap[selectedStatus] || 'pending';
          await createOrderStatusNotification(
            buyerId,
            {
              orderId: order.id,
              status: notificationStatus,
              message: getStatusUpdateMessage(selectedStatus, order.id),
              sellerName: sellerName
            }
          );
          console.log("📢 Notification sent successfully");
        }
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }
      setCurrentStatus(selectedStatus);
      onStatusUpdate(order.id, selectedStatus);
      setShowStatusModal(false);
      console.log("✅ Status updated, modal closed");
      
      // Show success modal instead of alert
      setSuccessMessage(`Order status updated to ${selectedStatus} successfully!`);
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error("Error updating order status:", error);
      setSuccessMessage("Failed to update order status");
      setShowSuccessModal(true);
      setSelectedStatus(currentStatus);
    } finally {
      setIsUpdating(false);
    }
  };
  const cancelStatusUpdate = () => {
    console.log("❌ Status update cancelled");
    setSelectedStatus(currentStatus);
    setShowStatusModal(false);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "#F59E0B";
      case "processing": return "#3B82F6";
      case "ready_for_pickup": return "#8B5CF6";
      case "shipped": return "#06B6D4";
      case "completed": return "#10B981";
      case "canceled": return "#EF4444";
      default: return "#6B7280";
    }
  };
  const getSelectedStatusLabel = () => {
    return STATUS_OPTIONS.find(opt => opt.value === selectedStatus)?.label || "Select Status";
  };
  // Use helper functions for display data
  const buyerInfo = getBuyerDisplayInfo();
  const specialInstructions = getSpecialInstructions();
  const deliveryMethod = getDeliveryMethod();
  const products = getProducts();
  return (
    <>
      <div className={styles.overlay}>
        <div className={styles.detailsPanel}>
          {/* Close Button */}
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
          {/* Main Title with Highlight */}
          <div className={styles.mainTitle}>
            <h2>Order Details</h2>
          </div>
          {/* Order Header Section */}
          <section className={styles.orderHeaderSection}>
            <div className={styles.orderIdStatus}>
              <div className={styles.orderIdContainer}>
                <span className={styles.orderIdLabel}>Order ID:</span>
                <span className={styles.orderIdValue}>#{order.id}</span>
              </div>
              <StatusBadge status={currentStatus} />
            </div>
            
            {/* Order Date - No Box */}
            <div className={styles.orderDateSimple}>
              <Calendar size={16} />
              <span>{new Date(fullOrderData?.orderDate || order.orderDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          </section>
          {/* Status Update Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <RefreshCcw size={20} style={{ color: '#FFB319' }} />
              <h3>Update Order Status</h3>
            </div>
            <div className={styles.statusUpdateBox}>
              <div className={styles.statusUpdateItem}>
                <div className={styles.statusUpdateIcon} style={{ backgroundColor: '#FFB319' }}>
                  <RefreshCcw size={16} color="white" />
                </div>
                <div className={styles.statusUpdateContent}>
                  <label>Current Status</label>
                  <div className={styles.statusUpdateControls}>
                    {/* Custom Dropdown matching fresh arrivals design */}
                    <div className={styles.dropdownContainer}>
                      <button 
                        className={`${styles.dropdownButton} ${selectedStatus !== currentStatus ? styles.active : ''}`}
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      >
                        <span>{getSelectedStatusLabel()}</span>
                        <span className={`${styles.arrow} ${isStatusDropdownOpen ? styles.arrowUp : styles.arrowDown}`}></span>
                      </button>
                      
                      {isStatusDropdownOpen && (
                        <div className={styles.dropdownList}>
                          {STATUS_OPTIONS.map(option => (
                            <button
                              key={option.value}
                              className={`${styles.dropdownItem} ${selectedStatus === option.value ? styles.selected : ''}`}
                              onClick={() => handleStatusChange(option.value)}
                              style={{
                                color: option.value === selectedStatus ? option.color : '#000'
                              }}
                            >
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={styles.statusIndicator} style={{ 
                      backgroundColor: getStatusColor(currentStatus) 
                    }}></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* Buyer Information Box */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <User size={20} style={{ color: '#FFB319' }} />
              <h3>Buyer Information</h3>
            </div>
            <div className={styles.infoBox}>
              <div className={styles.infoGrid}>
                {/* Full Name */}
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon} style={{ backgroundColor: '#FFB319' }}>
                    <User size={16} color="white" />
                  </div>
                  <div className={styles.infoContent}>
                    <label>Full Name</label>
                    <span>{buyerInfo.name}</span>
                  </div>
                </div>
                
                {/* Contact Number */}
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon} style={{ backgroundColor: '#FFB319' }}>
                    <Phone size={16} color="white" />
                  </div>
                  <div className={styles.infoContent}>
                    <label>Contact Number</label>
                    <span>{buyerInfo.contact}</span>
                  </div>
                </div>
                
                {/* Delivery Address */}
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon} style={{ backgroundColor: '#FFB319' }}>
                    <MapPin size={16} color="white" />
                  </div>
                  <div className={styles.infoContent}>
                    <label>Delivery Address</label>
                    <span>{buyerInfo.address}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* Delivery & Payment Information */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Truck size={20} style={{ color: '#FFB319' }} />
              <h3>Delivery & Payment</h3>
            </div>
            <div className={styles.infoBox}>
              <div className={styles.infoGrid}>
                {/* Delivery Method */}
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon} style={{ backgroundColor: '#FFB319' }}>
                    <Truck size={16} color="white" />
                  </div>
                  <div className={styles.infoContent}>
                    <label>Delivery Method</label>
                    <span>{fullOrderData?.delivery?.method || deliveryMethod || 'Standard Delivery'}</span>
                  </div>
                </div>
                
                {/* Delivery Time */}
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon} style={{ backgroundColor: '#FFB319' }}>
                    <Clock size={16} color="white" />
                  </div>
                  <div className={styles.infoContent}>
                    <label>Delivery Time</label>
                    <span>{fullOrderData?.delivery?.time || fullOrderData?.deliveryTime || 'Within 3-5 business days'}</span>
                  </div>
                </div>
                
                {/* Estimated Delivery */}
                {fullOrderData?.delivery?.estimatedDelivery && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon} style={{ backgroundColor: '#FFB319' }}>
                      <Calendar size={16} color="white" />
                    </div>
                    <div className={styles.infoContent}>
                      <label>Estimated Delivery</label>
                      <span>{new Date(fullOrderData.delivery.estimatedDelivery).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
                
                {/* Payment Method */}
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon} style={{ backgroundColor: '#FFB319' }}>
                    <CreditCard size={16} color="white" />
                  </div>
                  <div className={styles.infoContent}>
                    <label>Payment Method</label>
                    <span>{fullOrderData?.payment?.method || 'Cash on Delivery'}</span>
                  </div>
                </div>
                
                {/* Payment Status */}
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon} style={{ 
                    backgroundColor: fullOrderData?.payment?.status === 'paid' ? '#10B981' : 
                                   fullOrderData?.payment?.status === 'pending' ? '#F59E0B' : '#EF4444'
                  }}>
                    <FileText size={16} color="white" />
                  </div>
                  <div className={styles.infoContent}>
                    <label>Payment Status</label>
                    <span style={{ 
                      color: fullOrderData?.payment?.status === 'paid' ? '#10B981' : 
                             fullOrderData?.payment?.status === 'pending' ? '#F59E0B' : '#EF4444',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {fullOrderData?.payment?.status || 'Pending'}
                    </span>
                  </div>
                </div>
                
                {/* Transaction ID */}
                {fullOrderData?.payment?.transactionId && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon} style={{ backgroundColor: '#FFB319' }}>
                      <CreditCard size={16} color="white" />
                    </div>
                    <div className={styles.infoContent}>
                      <label>Transaction ID</label>
                      <span className={styles.monospace}>
                        {fullOrderData.payment.transactionId}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Tracking Number */}
                {fullOrderData?.delivery?.trackingNumber && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon} style={{ backgroundColor: '#FFB319' }}>
                      <Truck size={16} color="white" />
                    </div>
                    <div className={styles.infoContent}>
                      <label>Tracking Number</label>
                      <span className={styles.monospace}>
                        {fullOrderData.delivery.trackingNumber}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
          {/* Order Items */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Package size={20} style={{ color: '#FFB319' }} />
              <h3>Order Items</h3>
            </div>
            <div className={styles.orderItems}>
              <div className={styles.tableHeader}>
                <span>Product</span>
                <span>Quantity</span>
                <span>Unit Price</span>
                <span>Total</span>
              </div>
              <div className={styles.tableBody}>
                {products.length > 0 ? (
                  products.map((product, index) => (
                    <div key={index} className={styles.tableRow}>
                      <span className={styles.productName}>{product.name}</span>
                      <span>{product.quantity} {product.unit}</span>
                      <span>₱{product.unitPrice?.toLocaleString() || '0'}</span>
                      <span className={styles.rowTotal}>
                        ₱{((product.quantity || 0) * (product.unitPrice || 0)).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className={styles.noProducts}>
                    <span>No products in this order</span>
                  </div>
                )}
              </div>
              <div className={styles.orderTotal}>
                <span>Total Amount</span>
                <span className={styles.totalAmount}>₱{(fullOrderData?.totalPrice || order.totalPrice)?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </section>
          {/* Special Instructions with Generate Receipt Button */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <MessageSquare size={20} style={{ color: '#FFB319' }} />
              <h3>Special Instructions</h3>
            </div>
            <div className={styles.instructionsBox}>
              {specialInstructions && specialInstructions !== 'No special instructions provided' ? (
                <div className={styles.instructionsContent}>
                  <p>{specialInstructions}</p>
                </div>
              ) : (
                <div className={styles.noInstructions}>
                  <MessageSquare size={24} />
                  <span>No special instructions provided</span>
                </div>
              )}
            </div>
            
            {/* Generate Receipt Button - Positioned below special instructions on the right */}
            <div className={styles.generateReceiptSection}>
              <button 
                className={styles.generateReceiptButton}
                onClick={() => setShowReceiptModal(true)}
              >
                <Receipt size={18} />
                Generate Receipt
              </button>
            </div>
          </section>
        </div>
      </div>
      {/* Order Status Confirmation Modal */}
      {showStatusModal && (
        <OrderStatusModal
          isOpen={showStatusModal}
          onClose={cancelStatusUpdate}
          onConfirm={confirmStatusUpdate}
          currentStatus={currentStatus}
          newStatus={selectedStatus}
          orderId={order.id}
          isUpdating={isUpdating}
        />
      )}
      {/* Success Message Modal */}
      {showSuccessModal && (
        <div className={styles.successModal}>
          <div className={styles.successModalContent}>
            <div className={styles.successIcon}>
              <CheckCircle size={32} color="#10B981" />
            </div>
            <h3 className={styles.successTitle}>Success!</h3>
            <p className={styles.successMessage}>{successMessage}</p>
            <button
              className={styles.successButton}
              onClick={() => setShowSuccessModal(false)}
            >
              Continue
            </button>
          </div>
        </div>
      )}
      {/* Generate Receipt Modal */}
      <GenerateReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        order={{
          id: order.id,
          orderDate: fullOrderData?.orderDate || order.orderDate,
          status: currentStatus,
          totalPrice: fullOrderData?.totalPrice || order.totalPrice
        }}
        sellerName={sellerName}
        buyerInfo={buyerInfo}
        deliveryMethod={deliveryMethod}
        products={products}
        specialInstructions={specialInstructions}
        
        // Add new props
        paymentInfo={fullOrderData?.payment}
        deliveryInfo={fullOrderData?.delivery}
      />
      {/* Courier Modal */}
      {showCourierModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.courierModal}>
            <div className={styles.modalHeader}>
              <h3>Select Courier Service</h3>
              <button onClick={() => setShowCourierModal(false)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            
            {/* Cold Chain Toggle */}
            <div className={styles.coldChainSection}>
              <label className={styles.coldChainLabel}>
                <input
                  type="checkbox"
                  checked={requiresColdChain}
                  onChange={(e) => setRequiresColdChain(e.target.checked)}
                />
                <span>❄️ Requires Cold Chain Delivery</span>
              </label>
              <small>For temperature-sensitive items</small>
            </div>
            {/* Courier List */}
            <div className={styles.courierList}>
              {AVAILABLE_COURIERS
                .filter(courier => !requiresColdChain || courier.coldChain)
                .map(courier => (
                  <div
                    key={courier.id}
                    className={`${styles.courierOption} ${
                      selectedCourier?.id === courier.id ? styles.selected : ''
                    }`}
                    onClick={() => setSelectedCourier(courier)}
                  >
                    <div className={styles.courierInfo}>
                      <span className={styles.courierName}>{courier.name}</span>
                      <span className={styles.courierPrice}>₱{courier.price}</span>
                    </div>
                    {courier.coldChain && (
                      <span className={styles.coldChainBadge}>❄️ Cold Chain</span>
                    )}
                  </div>
                ))}
            </div>
            {/* Action Buttons */}
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowCourierModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                disabled={!selectedCourier}
                onClick={handleBookCourier}
              >
                📦 Book Courier
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

