"use client";
import { collection, doc, getDocs, limit, orderBy, query, setDoc, Timestamp, where } from "firebase/firestore";
import { AlertCircle, Calendar, ChevronDown, ChevronUp, Clock, CreditCard, MapPin, Minus, Navigation, Plus, Snowflake, Store, Truck, Wallet, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createOrderNotification } from "../../../utils/lib/OrderNotification";
import { calculateDeliveryFee, calculateDistance, calculateETA } from "../../../utils/lib/distanceCalculator";
import { db } from "../../../utils/lib/firebase";
import { createOrderViaApi } from "../../../utils/lib/orderApiService";
import { processPayment } from "../../../utils/lib/paymentService";
import styles from "./CartSidebar.module.css";

// ✅ ADDED: MOQ Validation Helper
const validateCartItemsMOQ = (cartItems: any[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  cartItems.forEach(item => {
    const moq = item.minimumOrderQuantity || 1;
    
    if (item.quantity < moq) {
      errors.push(`Minimum order quantity for ${item.name} is ${moq} ${item.unit || 'unit'}. Current quantity: ${item.quantity}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ✅ IMPROVED: Cold Chain Detection Function - Check multiple properties
const hasColdChainItems = (cartItems: any[]): boolean => {
  return cartItems.some(item => 
    item.requiresColdChain === true || 
    item.coldChain === true ||
    item.tags?.includes('Cold Chain') ||
    item.category === 'cold-chain' ||
    item.productType === 'cold-chain'
  );
};

// ✅ IMPROVED: Order number generator with retry logic
const generateOrderNumber = async (retryCount = 0): Promise<string> => {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Get today's orders to determine increment
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));
  
  try {
    const ordersSnapshot = await getDocs(
      query(
        collection(db, "orders"),
        where("createdAt", ">=", startOfDay),
        where("createdAt", "<=", endOfDay),
        orderBy("createdAt", "desc"),
        limit(1)
      )
    );
    
    let increment = '0001';
    
    if (!ordersSnapshot.empty) {
      const lastOrder = ordersSnapshot.docs[0].data();
      if (lastOrder.orderNumber && lastOrder.orderNumber.startsWith('F2T')) {
        const lastIncrement = parseInt(lastOrder.orderNumber.slice(-4));
        increment = String(lastIncrement + 1).padStart(4, '0');
      }
    }
    
    const orderNumber = `F2T-${datePart}-${increment}`;
    
    // ✅ ADDED: Check if this order number already exists (race condition protection)
    const existingOrderQuery = await getDocs(
      query(
        collection(db, "orders"),
        where("orderNumber", "==", orderNumber),
        limit(1)
      )
    );
    
    if (!existingOrderQuery.empty && retryCount < 5) {
      // If order number exists, retry with incremented number
      console.warn(`🔄 Order number ${orderNumber} exists, retrying... (attempt ${retryCount + 1})`);
      return generateOrderNumber(retryCount + 1);
    }
    
    if (existingOrderQuery.empty) {
      console.log('✅ Generated unique order number:', orderNumber);
      return orderNumber;
    } else {
      // Fallback: use timestamp-based order number
      const fallbackNumber = `F2T-${datePart}-${Date.now().toString().slice(-4)}`;
      console.warn('⚠️ Using fallback order number:', fallbackNumber);
      return fallbackNumber;
    }
    
  } catch (error) {
    console.error('❌ Error generating order number:', error);
    // Fallback order number
    const fallbackNumber = `F2T-${datePart}-${Date.now().toString().slice(-4)}`;
    console.warn('⚠️ Using fallback order number due to error:', fallbackNumber);
    return fallbackNumber;
  }
};

// Price Breakdown Component
const PriceBreakdown = ({ 
  marketPrice, 
  farmerMarkup, 
  platformFee, 
  shippingFee, 
  vatAmount, 
  finalPrice,
  className = "" 
}: {
  marketPrice: number;
  farmerMarkup: number;
  platformFee: number;
  shippingFee: number;
  vatAmount: number;
  finalPrice: number;
  className?: string;
}) => {
  return (
    <div className={`${styles.priceBreakdown} ${className}`}>
      <div className={styles.breakdownItem}>
        <span className={styles.breakdownLabel}>Base Price (DTI)</span>
        <span className={styles.breakdownValue}>₱{marketPrice.toFixed(2)}</span>
      </div>
      <div className={styles.breakdownItem}>
        <span className={styles.breakdownLabel}>Farmer Markup</span>
        <span className={`${styles.breakdownValue} ${styles.positive}`}>+₱{farmerMarkup.toFixed(2)}</span>
      </div>
      <div className={styles.breakdownItem}>
        <span className={styles.breakdownLabel}>Platform Fee</span>
        <span className={styles.breakdownValue}>+₱{platformFee.toFixed(2)}</span>
      </div>
      <div className={styles.breakdownItem}>
        <span className={styles.breakdownLabel}>Shipping Fee</span>
        <span className={styles.breakdownValue}>+₱{shippingFee.toFixed(2)}</span>
      </div>
      <div className={styles.breakdownItem}>
        <span className={styles.breakdownLabel}>VAT (12%)</span>
        <span className={styles.breakdownValue}>+₱{vatAmount.toFixed(2)}</span>
      </div>
      <div className={styles.breakdownTotal}>
        <span className={styles.breakdownLabel}>Total Amount</span>
        <span className={styles.breakdownValue}>₱{finalPrice.toFixed(2)}</span>
      </div>
    </div>
  );
};

interface DeliveryOption {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  selected?: boolean;
  type: 'smart' | 'priority' | 'standard' | 'saver' | 'cold-chain';
  icon: React.ReactNode;
  requiresColdChain?: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'digital';
  icon: React.ReactNode;
  selected?: boolean;
  requiresProcessing?: boolean;
  paymongoType?: string;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onPlaceOrder: (orderData: any) => void;
  onOrderSuccess?: (orderData: any) => void;
  buyerInfo: {
    name: string;
    address: string;
    contact?: string;
    id?: string;
  };
  currentUserLocation?: {
    lat: number;
    lng: number;
  };
}

const createSellerNotifications = async (orderData: any, cartItems: any[]) => {
  try {
    console.log("🛍️ Creating seller notifications for order:", orderData.id);
    console.log("📦 Order Number for notifications:", orderData.orderNumber);
    
    for (const seller of orderData.sellers) {
      const sellerId = seller.sellerId;
      const buyerName = orderData.buyerInfo?.name || "Customer";
      const items = seller.items || [];
      const totalAmount = seller.subtotal || 0;
      const itemCount = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
      const productNames = items.map((item: any) => item.name).slice(0, 2).join(", ");
      
      const notificationRef = doc(collection(db, "sellerNotifications"));
      
      const notificationData = {
        id: notificationRef.id,
        userId: sellerId,
        title: 'New Order Received! 🎉',
        message: `${buyerName} placed an order (${orderData.orderNumber}) for ${productNames}. Total: ₱${totalAmount}`,
        type: 'order',
        read: false,
        createdAt: Timestamp.now(),
        orderId: orderData.id,
        orderNumber: orderData.orderNumber,
        amount: totalAmount.toString(),
        itemCount: itemCount,
        buyerName: buyerName,
        productName: productNames
      };
      
      await setDoc(notificationRef, notificationData);
      console.log("✅ Notification created for seller:", sellerId);
    }
    
    console.log("🎊 All seller notifications created successfully");
  } catch (error) {
    console.error("❌ Error creating seller notifications:", error);
  }
};

export default function CartSidebar({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateNotes,
  onPlaceOrder,
  onOrderSuccess,
  buyerInfo,
  currentUserLocation
}: CartSidebarProps) {
  const [selectedOption, setSelectedOption] = useState<'delivery' | 'pickup'>('delivery');
  const [showCalendar, setShowCalendar] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState<'today' | 'custom'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('ASAP');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<{
    distance: number;
    deliveryFee: number;
    etaMinutes: number;
    farmerName: string;
    farmerBarangay: string;
  } | null>(null);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  // ✅ ADDED: MOQ Validation State
  const [moqErrors, setMoqErrors] = useState<string[]>([]);

  const router = useRouter();
  
  // ✅ FIXED: Initialize delivery options with cold chain
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([
    { 
      id: 'smart', 
      name: 'Smart Delivery', 
      description: 'Local courier - optimized pricing', 
      price: 0,
      duration: 'Varies by distance', 
      selected: true,
      type: 'smart',
      icon: <Navigation size={14} />
    },
    { 
      id: 'cold-chain', 
      name: 'Cold Chain', 
      description: 'Temperature-controlled delivery', 
      price: 75, 
      duration: '30-45 min', 
      selected: false,
      type: 'cold-chain',
      icon: <Snowflake size={14} />,
      requiresColdChain: true
    },
    { 
      id: 'priority', 
      name: 'Priority', 
      description: 'Fastest delivery - premium service', 
      price: 80, 
      duration: '15-25 min', 
      selected: false,
      type: 'priority',
      icon: <Truck size={14} />
    },
    { 
      id: 'standard', 
      name: 'Standard', 
      description: 'Regular delivery service', 
      price: 50, 
      duration: '30-45 min', 
      selected: false,
      type: 'standard',
      icon: <Truck size={14} />
    },
    { 
      id: 'saver', 
      name: 'Economy', 
      description: 'Budget-friendly delivery', 
      price: 35, 
      duration: '45-60 min', 
      selected: false,
      type: 'saver',
      icon: <Truck size={14} />
    }
  ]);
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { 
      id: 'cash', 
      name: 'Cash on Delivery', 
      type: 'cash', 
      icon: <Wallet size={14} />, 
      selected: true,
      requiresProcessing: false 
    },
    { 
      id: 'gcash', 
      name: 'GCash', 
      type: 'digital', 
      icon: <CreditCard size={14} />, 
      selected: false,
      requiresProcessing: true,
      paymongoType: 'gcash'
    },
    { 
      id: 'maya', 
      name: 'Maya', 
      type: 'digital', 
      icon: <CreditCard size={14} />, 
      selected: false,
      requiresProcessing: true,
      paymongoType: 'paymaya'
    },
    { 
      id: 'card', 
      name: 'Credit/Debit Card', 
      type: 'digital', 
      icon: <CreditCard size={14} />, 
      selected: false,
      requiresProcessing: true,
      paymongoType: 'card'
    }
  ]);

  // ✅ ADDED: MOQ Validation Effect
  useEffect(() => {
    const validation = validateCartItemsMOQ(cartItems);
    setMoqErrors(validation.errors);
  }, [cartItems]);

  // ✅ IMPROVED: Cold Chain Detection with better property checking
  const hasColdChainProducts = hasColdChainItems(cartItems);

  // ✅ FIXED: Enhanced getAvailableDeliveryOptions with proper cold chain logic
  const getAvailableDeliveryOptions = () => {
    console.log("❄️ Cold chain check:", {
      hasColdChainProducts,
      cartItems: cartItems.map(item => ({
        name: item.name,
        requiresColdChain: item.requiresColdChain,
        coldChain: item.coldChain,
        tags: item.tags,
        category: item.category
      }))
    });

    if (hasColdChainProducts) {
      console.log("❄️ COLD CHAIN: Only showing cold chain delivery option");
      // For cold chain products, ONLY show cold chain delivery and auto-select it
      const coldChainOption = deliveryOptions.find(opt => opt.type === 'cold-chain');
      if (coldChainOption) {
        return [{
          ...coldChainOption,
          selected: true // Auto-select cold chain
        }];
      }
    }
    
    // For normal products, show all options except cold chain
    console.log("🚚 NORMAL: Showing all delivery options except cold chain");
    return deliveryOptions
      .filter(option => option.type !== 'cold-chain')
      .map((option, index) => ({
        ...option,
        selected: index === 0 // Auto-select first option for normal products
      }));
  };

  // ✅ FIXED: Auto-select cold chain when cold chain products are detected
  useEffect(() => {
    if (hasColdChainProducts) {
      console.log("❄️ Auto-selecting cold chain delivery for cold chain products");
      setDeliveryOptions(options =>
        options.map(option => ({
          ...option,
          selected: option.type === 'cold-chain'
        }))
      );
    } else {
      console.log("🚚 Auto-selecting smart delivery for normal products");
      setDeliveryOptions(options =>
        options.map(option => ({
          ...option,
          selected: option.type === 'smart'
        }))
      );
    }
  }, [hasColdChainProducts, cartItems]);

  const availableDeliveryOptions = getAvailableDeliveryOptions();

  // Helper functions
  const getSelectedDeliveryOption = () => {
    return availableDeliveryOptions.find(option => option.selected) || availableDeliveryOptions[0];
  };

  const getSelectedPaymentMethod = () => {
    return paymentMethods.find(method => method.selected) || paymentMethods[0];
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    let deliveryFee = 0;
    if (selectedOption === 'delivery') {
      const selectedDelivery = getSelectedDeliveryOption();
      deliveryFee = selectedDelivery.price;
    }
    return subtotal + deliveryFee;
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const time = now.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return { date, time };
  };

  const getDeliveryDateDisplay = () => {
    if (deliveryDate === 'today') {
      return 'Today';
    } else {
      const date = new Date(selectedDate);
      return date.toLocaleDateString('en-PH', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getDeliveryTimeDisplay = () => {
    return selectedTime;
  };

  const getPickupLocation = () => {
    if (cartItems.length > 0) {
      const firstItem = cartItems[0];
      return `${firstItem.farmName}, ${firstItem.location}`;
    }
    return "Farmers Market Quezon City, 123 Main Street, Quezon City";
  };

  const formatDistance = (km: number): string => {
    if (km < 1) return `${Math.round(km * 1000)}m away`;
    return `${km.toFixed(1)}km away`;
  };

  // ✅ UPDATED: Enhanced MOQ Validation for Quantity Updates
  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    const item = cartItems.find(item => item.id === id);
    if (!item) return;

    const moq = item.minimumOrderQuantity || 1;
    
    // Prevent quantity from going below MOQ
    if (newQuantity < moq) {
      // Show warning but don't prevent the action
      console.warn(`⚠️ Quantity ${newQuantity} is below MOQ of ${moq} for ${item.name}`);
    }
    
    // Allow the update but it will be validated before checkout
    onUpdateQuantity(id, newQuantity);
  };

  // ✅ ADDED: MOQ Quantity Control Component
  const MOQQuantityControl = ({ item }: { item: any }) => {
    const moq = item.minimumOrderQuantity || 1;
    const isBelowMOQ = item.quantity < moq;

    return (
      <div className={styles.quantityControl}>
        <button
          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
          disabled={item.quantity <= 1}
          className={`${styles.quantityBtn} ${isBelowMOQ ? styles.moqWarning : ''}`}
          aria-label="Decrease quantity"
        >
          <Minus size={10} />
        </button>
        <span className={`${styles.quantityDisplay} ${isBelowMOQ ? styles.moqWarningText : ''}`}>
          {item.quantity}
          {isBelowMOQ && <span className={styles.moqIndicator}>⚠️</span>}
        </span>
        <button
          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
          className={styles.quantityBtn}
          aria-label="Increase quantity"
        >
          <Plus size={10} />
        </button>
        <span className={styles.unitDisplay}>
          {item.unit}
        </span>
        {moq > 1 && (
          <div className={styles.moqBadge}>
            MOQ: {moq}
          </div>
        )}
      </div>
    );
  };

  // ✅ PRICE BREAKDOWN CALCULATION
  const calculatePriceBreakdown = () => {
    if (cartItems.length === 0) return null;

    // Calculate totals from price breakdown data if available
    const totals = cartItems.reduce((acc, item) => {
      const breakdown = item.priceBreakdown;
      const quantity = item.quantity || 1;

      if (breakdown) {
        acc.marketPrice += breakdown.marketPrice * quantity;
        acc.farmerMarkup += breakdown.farmerMarkup * quantity;
        acc.platformFee += breakdown.platformFee * quantity;
        acc.shippingFee += breakdown.shippingFee;
        acc.vatAmount += breakdown.vatAmount * quantity;
        acc.finalPrice += breakdown.finalPrice * quantity;
      } else {
        // Fallback to basic calculation
        const itemPrice = item.price || 0;
        const shippingFee = item.shippingFee || 0;
        const platformFee = itemPrice * 0.05;
        const vatAmount = (itemPrice + platformFee + shippingFee) * 0.12;
        
        acc.marketPrice += itemPrice * quantity;
        acc.farmerMarkup += 0;
        acc.platformFee += platformFee * quantity;
        acc.shippingFee += shippingFee;
        acc.vatAmount += vatAmount * quantity;
        acc.finalPrice += (itemPrice + platformFee + shippingFee + vatAmount) * quantity;
      }

      return acc;
    }, {
      marketPrice: 0,
      farmerMarkup: 0,
      platformFee: 0,
      shippingFee: 0,
      vatAmount: 0,
      finalPrice: 0
    });

    // Add delivery fee if applicable
    if (selectedOption === 'delivery') {
      const selectedDelivery = getSelectedDeliveryOption();
      totals.shippingFee += selectedDelivery.price;
      totals.finalPrice += selectedDelivery.price;
      // Recalculate VAT including delivery fee
      totals.vatAmount = (totals.marketPrice + totals.farmerMarkup + totals.platformFee + totals.shippingFee) * 0.12;
      totals.finalPrice = totals.marketPrice + totals.farmerMarkup + totals.platformFee + totals.shippingFee + totals.vatAmount;
    }

    return {
      marketPrice: Math.round(totals.marketPrice * 100) / 100,
      farmerMarkup: Math.round(totals.farmerMarkup * 100) / 100,
      platformFee: Math.round(totals.platformFee * 100) / 100,
      shippingFee: Math.round(totals.shippingFee * 100) / 100,
      vatAmount: Math.round(totals.vatAmount * 100) / 100,
      finalPrice: Math.round(totals.finalPrice * 100) / 100
    };
  };

  const cartPriceBreakdown = calculatePriceBreakdown();

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { auth } = await import("../../../utils/lib/firebase");
        const { onAuthStateChanged } = await import("firebase/auth");
        
        onAuthStateChanged(auth, (user) => {
          if (user) {
            setCurrentUser(user);
            console.log("🔥 Current user:", user.uid, user.email);
          } else {
            console.log("❌ No user logged in");
          }
        });
      } catch (error) {
        console.error("Error getting current user:", error);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const calculateDeliveryInformation = () => {
      console.log("📍 Calculating delivery information...");
      console.log("📍 Current user location:", currentUserLocation);
      console.log("📍 Cart items:", cartItems.length);
      
      if (!currentUserLocation) {
        console.log("❌ No user location available");
        setDeliveryInfo(null);
        return;
      }
      if (cartItems.length === 0) {
        console.log("❌ No cart items");
        setDeliveryInfo(null);
        return;
      }
      try {
        const firstItem = cartItems[0];
        console.log("📍 First cart item:", firstItem);
        console.log("📍 Farmer data:", firstItem.farmer);
        console.log("📍 Farmer location:", firstItem.farmer?.location);
        
        if (firstItem.farmer?.location?.lat && firstItem.farmer?.location?.lng) {
          const distance = calculateDistance(
            currentUserLocation.lat,
            currentUserLocation.lng,
            firstItem.farmer.location.lat,
            firstItem.farmer.location.lng
          );
          
          const deliveryFee = calculateDeliveryFee(distance);
          const etaMinutes = calculateETA(distance);
          
          const calculatedInfo = {
            distance: parseFloat(distance.toFixed(1)),
            deliveryFee: Math.round(deliveryFee),
            etaMinutes: Math.round(etaMinutes),
            farmerName: firstItem.farmName || "Local Farmer",
            farmerBarangay: firstItem.farmer?.barangay || firstItem.location || "Local Area"
          };
          setDeliveryInfo(calculatedInfo);
          
          setDeliveryOptions(options => 
            options.map(option => 
              option.id === 'smart' 
                ? { ...option, price: calculatedInfo.deliveryFee, duration: `${calculatedInfo.etaMinutes} min` }
                : option
            )
          );
          console.log("📍 Smart Matching - Delivery Info Calculated:", calculatedInfo);
        } else {
          console.log("❌ No farmer location data available in cart item");
          setDeliveryInfo(null);
        }
      } catch (error) {
        console.error("❌ Error calculating delivery information:", error);
        setDeliveryInfo(null);
      }
    };
    calculateDeliveryInformation();
  }, [cartItems, currentUserLocation]);

  const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80";

  useEffect(() => {
    if (isOpen && cartItems.length > 0) {
      setTimeout(() => {
        console.log("🔍 DEBUG CART DATA:");
        console.log("User location:", currentUserLocation);
        console.log("Cart items:", cartItems);
        if (cartItems.length > 0) {
          console.log("First item farmer data:", cartItems[0].farmer);
          console.log("First item farmer location:", cartItems[0].farmer?.location);
        }
        console.log("Delivery info:", deliveryInfo);
        console.log("❄️ Cold Chain Products:", hasColdChainProducts);
        console.log("🚚 Available Delivery Options:", availableDeliveryOptions.map(opt => opt.name));
      }, 1000);
    }
  }, [isOpen, cartItems]);

  const processDigitalPayment = async (orderData: any) => {
    try {
      const selectedPayment = getSelectedPaymentMethod();
      
      if (!selectedPayment.requiresProcessing) {
        return { success: true, isCash: true };
      }
      console.log('💳 Processing digital payment via PayMongo...');
      console.log('📦 Order Number for payment:', orderData.orderNumber);
      
      const orderDataForStorage = {
        ...orderData,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes,
          image: item.image || item.imageUrls?.[0] || PLACEHOLDER_IMAGE,
          farmName: item.farmName,
          location: item.location,
          sellerId: item.sellerId,
          // 🟢 ADDED: Include pricing data
          farmerPrice: item.farmerPrice,
          marketPrice: item.marketPrice,
          platformFee: item.platformFee,
          shippingFee: item.shippingFee,
          vatAmount: item.vatAmount,
          finalPrice: item.finalPrice,
          priceBreakdown: item.priceBreakdown,
          // ✅ ADDED: Cold chain data
          requiresColdChain: item.requiresColdChain
        })),
        savedAt: new Date().toISOString()
      };
      
      try {
        localStorage.setItem('pendingOrder', JSON.stringify(orderDataForStorage));
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        localStorage.setItem('orderNumber', orderData.orderNumber);
        console.log('✅ Order data saved to localStorage successfully');
        console.log('📦 Order Number stored:', orderData.orderNumber);
      } catch (storageError) {
        console.error('❌ localStorage error:', storageError);
        throw new Error('Failed to save order data');
      }
      
      const paymentResult = await processPayment({
        amount: orderData.totalPrice,
        orderId: orderData.id,
        orderNumber: orderData.orderNumber,
        paymentMethod: selectedPayment.paymongoType,
        buyerDetails: {
          name: orderData.buyerInfo.name,
          email: orderData.buyerInfo.email,
          phone: orderData.buyerInfo.contact
        }
      });
      
      if (paymentResult.success && paymentResult.redirectUrl) {
        localStorage.setItem('paymentIntentId', paymentResult.paymentIntentId);
        console.log('🔗 Payment intent ID saved:', paymentResult.paymentIntentId);
        console.log('📦 Order Number for payment:', orderData.orderNumber);
        
        console.log('🔄 Redirecting to Paymongo...');
        window.location.href = paymentResult.redirectUrl;
        return { success: true, redirecting: true };
      } else {
        throw new Error(paymentResult.error || 'Payment processing failed');
      }
    } catch (error) {
      console.error('❌ Payment processing error:', error);
      localStorage.removeItem('pendingOrder');
      localStorage.removeItem('paymentIntentId');
      localStorage.removeItem('orderNumber');
      throw error;
    }
  };

  if (!isOpen) return null;

  const handleDeliveryOptionSelect = (optionId: string) => {
    setDeliveryOptions(options =>
      options.map(option => ({
        ...option,
        selected: option.id === optionId
      }))
    );
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setPaymentMethods(methods =>
      methods.map(method => ({
        ...method,
        selected: method.id === methodId
      }))
    );
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleOrderSuccessCallback = (orderData: any) => {
    console.log("🎉 CartSidebar: Order success callback triggered");
    console.log("📦 Order Number in success:", orderData.orderNumber);
    
    if (onOrderSuccess) {
      console.log("✅ CartSidebar: Calling onOrderSuccess callback");
      onOrderSuccess(orderData);
    } else {
      console.log("ℹ️ CartSidebar: No onOrderSuccess callback provided");
    }
    
    if (onPlaceOrder) {
      console.log("✅ CartSidebar: Calling onPlaceOrder for inventory updates");
      onPlaceOrder(orderData);
    }
  };

  // ✅ UPDATED: Enhanced handlePlaceOrder with MOQ validation
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    
    // ✅ ADDED: MOQ Validation before placing order
    const moqValidation = validateCartItemsMOQ(cartItems);
    if (!moqValidation.isValid) {
      alert(`❌ Minimum Order Quantity Required:\n\n${moqValidation.errors.join('\n')}\n\nPlease adjust quantities to meet the minimum requirements.`);
      return;
    }
    
    if (!currentUser) {
      alert('Please log in to place an order.');
      return;
    }
    
    if (selectedOption === 'delivery' && (!buyerInfo.address || buyerInfo.address.includes('No address') || buyerInfo.address.includes('Please update'))) {
      alert('Please update your delivery address in your profile before placing a delivery order.');
      return;
    }
    
    setIsPlacingOrder(true);
    
    try {
      const orderNumber = await generateOrderNumber();
      console.log('📦 Generated order number:', orderNumber);
      
      const ordersBySeller = cartItems.reduce((acc, item) => {
        const sellerId = item.sellerId || 'unknown';
        if (!acc[sellerId]) {
          acc[sellerId] = {
            sellerId,
            sellerName: item.farmName,
            items: [],
            subtotal: 0
          };
        }
        
        const orderItem = {
          productId: item.id || 'unknown-product',
          name: item.name || 'Unknown Product',
          price: item.price || 0,
          unitPrice: item.price || 0,
          quantity: item.quantity || 1,
          notes: item.notes || '',
          unit: item.unit || 'pc',
          image: item.image || item.imageUrls?.[0] || PLACEHOLDER_IMAGE,
          // 🟢 ADDED: Include MOQ data in order
          minimumOrderQuantity: item.minimumOrderQuantity || 1,
          // 🟢 ADDED: Include pricing data in order
          farmerPrice: item.farmerPrice,
          marketPrice: item.marketPrice,
          platformFee: item.platformFee,
          shippingFee: item.shippingFee,
          vatAmount: item.vatAmount,
          finalPrice: item.finalPrice,
          priceBreakdown: item.priceBreakdown,
          // ✅ ADDED: Cold chain data in order
          requiresColdChain: item.requiresColdChain
        };
        
        acc[sellerId].items.push(orderItem);
        acc[sellerId].subtotal += (item.price || 0) * (item.quantity || 1);
        return acc;
      }, {} as any);
      
      const actualBuyerId = currentUser.uid;
      const actualBuyerEmail = currentUser.email || 'user@example.com';
      console.log("🔥 Using actual buyer ID:", actualBuyerId);
      
      const completeBuyerInfo = {
        id: actualBuyerId,
        name: buyerInfo.name || 'Customer',
        address: buyerInfo.address || 'No address provided',
        contact: buyerInfo.contact || 'No contact provided',
        email: actualBuyerEmail
      };
      
      const pickupLocation = getPickupLocation();
      const products = cartItems.map(item => ({
        name: item.name || 'Unknown Product',
        quantity: item.quantity || 1,
        unitPrice: item.price || 0,
        unit: item.unit || 'pc',
        price: item.price || 0,
        notes: item.notes || '',
        // 🟢 ADDED: Include MOQ data
        minimumOrderQuantity: item.minimumOrderQuantity || 1,
        // 🟢 ADDED: Include pricing data
        farmerPrice: item.farmerPrice,
        marketPrice: item.marketPrice,
        platformFee: item.platformFee,
        shippingFee: item.shippingFee,
        vatAmount: item.vatAmount,
        finalPrice: item.finalPrice,
        // ✅ ADDED: Cold chain data
        requiresColdChain: item.requiresColdChain
      }));
      
      const selectedPayment = getSelectedPaymentMethod();
      const selectedDelivery = getSelectedDeliveryOption();
      
      const tempOrderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const orderData = {
        id: tempOrderId,
        orderNumber: orderNumber,
        buyerId: actualBuyerId,
        buyerInfo: completeBuyerInfo,
        buyerName: buyerInfo.name || 'Customer',
        contact: buyerInfo.contact || 'No contact provided',
        address: buyerInfo.address || 'No address provided',
        deliveryMethod: selectedOption === 'delivery' ? 'Delivery' : 'Pickup',
        deliveryDate: deliveryDate === 'today' ? new Date().toISOString().split('T')[0] : selectedDate,
        deliveryTime: selectedTime,
        deliveryAddress: selectedOption === 'delivery' ? buyerInfo.address : null,
        pickupLocation: selectedOption === 'pickup' ? pickupLocation : null,
        deliveryOption: selectedDelivery.name,
        deliveryOptionType: selectedDelivery.type,
        deliveryFee: selectedOption === 'delivery' ? selectedDelivery.price : 0,
        smartMatchingInfo: deliveryInfo ? {
          distance: deliveryInfo.distance,
          calculatedDeliveryFee: deliveryInfo.deliveryFee,
          estimatedDeliveryTime: deliveryInfo.etaMinutes,
          farmerLocation: deliveryInfo.farmerBarangay,
          usedSmartPricing: selectedDelivery.type === 'smart'
        } : null,
        paymentMethod: selectedPayment.name,
        paymentType: selectedPayment.type,
        paymentStatus: selectedPayment.requiresProcessing ? 'pending' : 'cash_on_delivery',
        products: products,
        sellers: Object.values(ordersBySeller).map((seller: any) => ({
          ...seller,
          items: seller.items.map((item: any) => ({
            ...item,
            unitPrice: item.price,
            name: item.name || 'Unknown Product',
            quantity: item.quantity || 1,
            price: item.price || 0,
            unit: item.unit || 'pc',
            notes: item.notes || '',
            image: item.image || PLACEHOLDER_IMAGE,
            // 🟢 ADDED: Include MOQ data
            minimumOrderQuantity: item.minimumOrderQuantity || 1,
            // 🟢 ADDED: Include pricing data
            farmerPrice: item.farmerPrice,
            marketPrice: item.marketPrice,
            platformFee: item.platformFee,
            shippingFee: item.shippingFee,
            vatAmount: item.vatAmount,
            finalPrice: item.finalPrice,
            // ✅ ADDED: Cold chain data
            requiresColdChain: item.requiresColdChain
          }))
        })),
        subtotal: calculateSubtotal(),
        totalPrice: calculateTotal(),
        // 🟢 ADDED: Price breakdown data
        priceBreakdown: cartPriceBreakdown,
        // ✅ ADDED: Cold chain flag in order
        hasColdChainItems: hasColdChainProducts,
        specialInstructions: cartItems.find(item => item.notes)?.notes || "",
        createdAt: new Date().toISOString(),
        orderDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'pending',
        itemCount: cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
        productCount: cartItems.length
      };
      
      console.log('🔥 Placing order with order number:', orderNumber);
      console.log('🔥 Payment method:', selectedPayment.name);
      console.log('💰 Price breakdown included in order:', cartPriceBreakdown);
      console.log('❄️ Cold chain items in order:', hasColdChainProducts);
      
      const paymentResult = await processDigitalPayment(orderData);
      if (paymentResult.redirecting) {
        console.log('🔄 Redirecting to payment page...');
        return;
      }
      
      if (paymentResult.success) {
        console.log('✅ Payment processed successfully, placing order via API...');
        
        const apiResult = await createOrderViaApi(orderData);
        console.log('✅ API RESPONSE:', apiResult);
        
        if (apiResult.success) {
          const actualFirestoreOrderId = apiResult.orderId;
          const actualOrderNumber = apiResult.orderNumber || orderNumber;
          
          console.log('🎉 Order created successfully via API:', {
            firestoreId: actualFirestoreOrderId,
            orderNumber: actualOrderNumber
          });
          
          await createSellerNotifications({
            ...orderData,
            id: actualFirestoreOrderId,
            orderNumber: actualOrderNumber
          }, cartItems);
          
          try {
            await createOrderNotification({
              orderId: actualFirestoreOrderId,
              orderNumber: actualOrderNumber,
              amount: calculateTotal().toFixed(2),
              items: cartItems,
              buyerName: buyerInfo.name || 'Customer',
              sellerId: cartItems[0]?.sellerId
            });
            
            console.log('🎊 Order notification created with order number:', actualOrderNumber);
          } catch (notificationError) {
            console.error('❌ Failed to create notification, but order was placed:', notificationError);
          }
          
          await handleOrderSuccessCallback({
            ...orderData,
            id: actualFirestoreOrderId,
            orderNumber: actualOrderNumber,
            totalPrice: calculateTotal(),
            deliveryMethod: selectedOption === 'delivery' ? 'Delivery' : 'Pickup',
            deliveryTime: selectedTime,
            deliveryDate: deliveryDate === 'today' ? new Date().toISOString().split('T')[0] : selectedDate,
            itemCount: cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
          });
          
        } else {
          throw new Error('API order creation failed: ' + (apiResult.message || 'Unknown error'));
        }
      }
      
    } catch (error: any) {
      console.error('❌ Error placing order:', error);
      alert(`Order Error: ${error.message}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const generateTimeSlots = () => {
    return [
      { value: 'ASAP', label: 'ASAP' },
      { value: '08:00', label: '8:00 AM' },
      { value: '09:00', label: '9:00 AM' },
      { value: '10:00', label: '10:00 AM' },
      { value: '11:00', label: '11:00 AM' },
      { value: '12:00', label: '12:00 PM' },
      { value: '13:00', label: '1:00 PM' },
      { value: '14:00', label: '2:00 PM' },
      { value: '15:00', label: '3:00 PM' },
      { value: '16:00', label: '4:00 PM' },
      { value: '17:00', label: '5:00 PM' },
      { value: '18:00', label: '6:00 PM' },
      { value: '19:00', label: '7:00 PM' },
      { value: '20:00', label: '8:00 PM' },
      { value: '21:00', label: '9:00 PM' }
    ];
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i <= 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const timeSlots = generateTimeSlots();
  const dateOptions = generateDateOptions();
  const { date, time } = getCurrentDateTime();
  const selectedDelivery = getSelectedDeliveryOption();
  const selectedPayment = getSelectedPaymentMethod();
  const subtotal = calculateSubtotal();
  const deliveryFee = selectedOption === 'delivery' ? selectedDelivery.price : 0;
  const total = calculateTotal();

  return (
    <div className={styles.cartSidebar}>
      <div className={styles.cartHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2 className={styles.cartTitle}>Order Details</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close cart"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className={styles.buyerInfo}>
          <span className={styles.buyerName}>{buyerInfo.name}</span>
          <div className={styles.addressDisplay}>
            <MapPin size={12} />
            <span className={styles.buyerAddress}>
              {buyerInfo.address}
              {(selectedOption === 'delivery' && (!buyerInfo.address || buyerInfo.address.includes('No address') || buyerInfo.address.includes('Please update'))) && (
                <span className={styles.addressWarning}> - Update address for delivery</span>
              )}
            </span>
          </div>
          {buyerInfo.contact && (
            <div className={styles.contactDisplay}>
              <span className={styles.buyerContact}>Contact: {buyerInfo.contact}</span>
            </div>
          )}
          <div className={styles.orderDateTime}>
            <div className={styles.dateTimeItem}>
              <Calendar size={10} />
              <span>{date}</span>
            </div>
            <div className={styles.dateTimeItem}>
              <Clock size={10} />
              <span>{time}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.cartContent}>
        <h3 className={styles.orderDetailTitle}>Order Items</h3>
        
        {cartItems.length === 0 ? (
          <div className={styles.emptyCart}>
            <p>Your cart is empty</p>
            <p>Add some products to get started!</p>
          </div>
        ) : (
          <>
            {/* ✅ ADDED: MOQ Validation Warning */}
            {moqErrors.length > 0 && (
              <div className={styles.moqWarningSection}>
                <div className={styles.moqWarningHeader}>
                  <AlertCircle size={16} className={styles.warningIcon} />
                  <span>Minimum Order Requirements</span>
                </div>
                <div className={styles.moqWarningList}>
                  {moqErrors.map((error, index) => (
                    <div key={index} className={styles.moqWarningItem}>
                      {error}
                    </div>
                  ))}
                </div>
                <div className={styles.moqWarningNote}>
                  Please adjust quantities to meet minimum requirements before checkout.
                </div>
              </div>
            )}
            
            <div className={styles.cartItems}>
              {cartItems.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.itemHeader}>
                    <div className={styles.itemImage}>
                      <img 
                        src={item.image || item.imageUrls?.[0] || PLACEHOLDER_IMAGE}
                        alt={item.name}
                        className={styles.productImage}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = PLACEHOLDER_IMAGE;
                        }}
                      />
                    </div>
                    <div className={styles.itemDetails}>
                      <h4 className={styles.itemName}>{item.name}</h4>
                      <div className={styles.itemMeta}>
                        <div className={styles.metaItem}>
                          <MapPin size={10} />
                          <span>{item.location}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <Store size={10} />
                          <span>{item.farmName}</span>
                        </div>
                        {/* ✅ ADDED: Cold Chain Indicator in Cart */}
                        {(item.requiresColdChain || item.coldChain || item.tags?.includes('Cold Chain')) && (
                          <div className={styles.metaItem}>
                            <Snowflake size={10} />
                            <span className={styles.coldChainLabel}>Cold Chain Required</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className={styles.removeBtn}
                      aria-label={`Remove ${item.name}`}
                    >
                      <X size={10} />
                    </button>
                  </div>
                  <div className={styles.notesSection}>
                    <label className={styles.notesLabel}>Notes (optional):</label>
                    <textarea
                      value={item.notes}
                      onChange={(e) => onUpdateNotes(item.id, e.target.value)}
                      placeholder="Add special instructions..."
                      className={styles.notesInput}
                    />
                  </div>
                  <div className={styles.itemFooter}>
                    {/* ✅ UPDATED: Using MOQ Quantity Control */}
                    <MOQQuantityControl item={item} />
                    <div className={styles.itemPrice}>
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 🟢 ADDED: Price Breakdown Section */}
            {cartPriceBreakdown && (
              <div className={styles.priceBreakdownSection}>
                <div 
                  className={styles.breakdownHeader}
                  onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                >
                  <h4 className={styles.sectionTitle}>💵 Price Breakdown</h4>
                  <button className={styles.breakdownToggle}>
                    {showPriceBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span>{showPriceBreakdown ? 'Hide' : 'Show'} Details</span>
                  </button>
                </div>
                
                {showPriceBreakdown ? (
                  <PriceBreakdown
                    marketPrice={cartPriceBreakdown.marketPrice}
                    farmerMarkup={cartPriceBreakdown.farmerMarkup}
                    platformFee={cartPriceBreakdown.platformFee}
                    shippingFee={cartPriceBreakdown.shippingFee}
                    vatAmount={cartPriceBreakdown.vatAmount}
                    finalPrice={cartPriceBreakdown.finalPrice}
                    className={styles.cartBreakdown}
                  />
                ) : (
                  <div className={styles.breakdownSummary}>
                    <div className={styles.summaryItem}>
                      <span>Items Total:</span>
                      <span>₱{cartPriceBreakdown.marketPrice.toFixed(2)}</span>
                    </div>
                    {selectedOption === 'delivery' && (
                      <div className={styles.summaryItem}>
                        <span>Delivery:</span>
                        <span>₱{cartPriceBreakdown.shippingFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className={styles.summaryTotal}>
                      <span>Total with VAT:</span>
                      <span>₱{cartPriceBreakdown.finalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {selectedOption === 'delivery' && (
              <div className={styles.smartMatchingSection}>
                <h4 className={styles.sectionTitle}>
                  <Navigation size={14} />
                  Smart Delivery Information
                </h4>
                
                {deliveryInfo ? (
                  <>
                    <div className={styles.deliveryInfoGrid}>
                      <div className={styles.deliveryInfoItem}>
                        <div className={styles.infoLabel}>Distance</div>
                        <div className={styles.infoValue}>
                          <MapPin size={12} />
                          {formatDistance(deliveryInfo.distance)}
                        </div>
                      </div>
                      <div className={styles.deliveryInfoItem}>
                        <div className={styles.infoLabel}>Delivery Fee</div>
                        <div className={styles.infoValue}>
                          ₱{deliveryInfo.deliveryFee}
                        </div>
                      </div>
                      <div className={styles.deliveryInfoItem}>
                        <div className={styles.infoLabel}>Estimated Time</div>
                        <div className={styles.infoValue}>
                          <Clock size={12} />
                          {deliveryInfo.etaMinutes} min
                        </div>
                      </div>
                    </div>
                    <div className={styles.farmerLocation}>
                      <Store size={10} />
                      From {deliveryInfo.farmerName} in {deliveryInfo.farmerBarangay}
                    </div>
                  </>
                ) : (
                  <div className={styles.calculatingInfo}>
                    <div className={styles.calculatingSpinner}></div>
                    <span>Calculating distance and delivery fee...</span>
                    {!currentUserLocation && (
                      <div className={styles.locationWarning}>
                        📍 User location not available
                      </div>
                    )}
                    {cartItems.length > 0 && !cartItems[0].farmer?.location && (
                      <div className={styles.locationWarning}>
                        🚜 Farmer location data missing
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className={styles.deliveryTimeSection}>
              <h4 className={styles.sectionTitle}>Delivery Schedule</h4>
              
              <div className={styles.deliveryTimeOptions}>
                <div className={`${styles.timeOption} ${deliveryDate === 'today' ? styles.active : ''}`} 
                     onClick={() => setDeliveryDate('today')}>
                  <div className={styles.timeOptionContent}>
                    <div className={styles.timeOptionTitle}>Today</div>
                    <div className={styles.timeOptionSubtitle}>Fastest delivery</div>
                  </div>
                  <div className={styles.radioCircle}>
                    {deliveryDate === 'today' && <div className={styles.radioDot} />}
                  </div>
                </div>
                
                <div className={`${styles.timeOption} ${deliveryDate === 'custom' ? styles.active : ''}`} 
                     onClick={() => setDeliveryDate('custom')}>
                  <div className={styles.timeOptionContent}>
                    <div className={styles.timeOptionTitle}>Choose Date</div>
                    <div className={styles.timeOptionSubtitle}>Select preferred date</div>
                  </div>
                  <div className={styles.radioCircle}>
                    {deliveryDate === 'custom' && <div className={styles.radioDot} />}
                  </div>
                </div>
              </div>
              
              {deliveryDate === 'custom' && (
                <div className={styles.calendarSection}>
                  <div className={styles.calendarContainer}>
                    <div className={styles.calendarHeader}>
                      <h5>Select Delivery Date</h5>
                    </div>
                    <div className={styles.calendarGrid}>
                      {dateOptions.map((dateObj) => {
                        const dateString = dateObj.toISOString().split('T')[0];
                        const isSelected = selectedDate === dateString;
                        const isToday = dateObj.toDateString() === new Date().toDateString();
                        
                        return (
                          <button
                            key={dateString}
                            className={`${styles.dateOption} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''}`}
                            onClick={() => handleDateSelect(dateString)}
                          >
                            <div className={styles.dayName}>
                              {dateObj.toLocaleDateString('en-PH', { weekday: 'short' })}
                            </div>
                            <div className={styles.dayNumber}>
                              {dateObj.getDate()}
                            </div>
                            <div className={styles.monthName}>
                              {dateObj.toLocaleDateString('en-PH', { month: 'short' })}
                            </div>
                            {isToday && <div className={styles.todayBadge}>Today</div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              
              <div className={styles.timeSelection}>
                <label className={styles.timeLabel}>
                  Delivery Time <span className={styles.timeNote}>(select your preferred time)</span>
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className={styles.timeSelect}
                >
                  {timeSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className={styles.deliverySection}>
              <h4 className={styles.sectionTitle}>Delivery Method</h4>
              
              <div className={styles.deliveryToggle}>
                <button
                  className={`${styles.toggleBtn} ${selectedOption === 'delivery' ? styles.active : ''}`}
                  onClick={() => setSelectedOption('delivery')}
                >
                  Delivery
                </button>
                <button
                  className={`${styles.toggleBtn} ${selectedOption === 'pickup' ? styles.active : ''}`}
                  onClick={() => setSelectedOption('pickup')}
                >
                  Pickup
                </button>
              </div>
              
              {selectedOption === 'delivery' && (
                <div className={styles.deliveryOptions}>
                  {/* ✅ ADDED: Cold Chain Warning Message */}
                  {hasColdChainProducts && (
                    <div className={styles.coldChainWarning}>
                      <Snowflake size={16} />
                      <div className={styles.warningContent}>
                        <strong>Cold Chain Required</strong>
                        <span>Your cart contains temperature-sensitive products. Cold chain delivery is required to maintain product quality.</span>
                      </div>
                    </div>
                  )}
                  
                  {deliveryInfo ? (
                    <div className={styles.distanceInfo}>
                      <Navigation size={12} />
                      <span>Smart Matching: <strong>{formatDistance(deliveryInfo.distance)}</strong> from {deliveryInfo.farmerName}</span>
                    </div>
                  ) : (
                    <div className={styles.distanceInfo}>
                      <MapPin size={12} />
                      <span>Distance from you: <strong>Calculating...</strong></span>
                    </div>
                  )}
                  
                  <div className={styles.deliveryOptionsList}>
                    {/* ✅ FIXED: Use the properly filtered delivery options */}
                    {availableDeliveryOptions.map((option) => (
                      <div
                        key={option.id}
                        className={`${styles.deliveryOption} ${option.selected ? styles.selected : ''} ${
                          option.type === 'smart' ? styles.smartOption : ''
                        } ${option.type === 'cold-chain' ? styles.coldChainOption : ''}`}
                        onClick={() => handleDeliveryOptionSelect(option.id)}
                      >
                        <div className={styles.optionRadio}>
                          <div className={styles.radioCircle}>
                            {option.selected && <div className={styles.radioDot} />}
                          </div>
                        </div>
                        <div className={styles.optionIcon}>
                          {option.icon}
                        </div>
                        <div className={styles.optionInfo}>
                          <div className={styles.optionHeader}>
                            <span className={styles.optionName}>
                              {option.name}
                              {option.type === 'smart' && deliveryInfo && (
                                <span className={styles.smartBadge}>Smart Price</span>
                              )}
                              {option.type === 'cold-chain' && (
                                <span className={styles.coldChainBadge}>Cold Chain</span>
                              )}
                            </span>
                            <span className={styles.optionPrice}>₱{option.price.toFixed(2)}</span>
                          </div>
                          <div className={styles.optionDetails}>
                            <Clock size={10} />
                            <span>{option.duration}</span>
                            <span className={styles.optionDescription}>{option.description}</span>
                          </div>
                          {option.type === 'smart' && deliveryInfo && (
                            <div className={styles.smartDetails}>
                              <span className={styles.smartText}>
                                Based on {formatDistance(deliveryInfo.distance)} from {deliveryInfo.farmerName}
                              </span>
                            </div>
                          )}
                          {/* ✅ ADDED: Cold Chain Requirement Note */}
                          {hasColdChainProducts && option.type === 'cold-chain' && (
                            <div className={styles.coldChainNote}>
                              <Snowflake size={10} />
                              <span>Required for temperature-sensitive items in your cart</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedOption === 'pickup' && (
                <div className={styles.pickupInfo}>
                  <div className={styles.pickupLocation}>
                    <MapPin size={14} />
                    <div>
                      <span className={styles.pickupAddress}>{getPickupLocation()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className={styles.paymentSection}>
              <h4 className={styles.sectionTitle}>Payment Method</h4>
              <div className={styles.paymentMethods}>
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`${styles.paymentMethod} ${method.selected ? styles.selected : ''}`}
                    onClick={() => handlePaymentMethodSelect(method.id)}
                  >
                    <div className={styles.methodRadio}>
                      <div className={styles.radioCircle}>
                        {method.selected && <div className={styles.radioDot} />}
                      </div>
                    </div>
                    <div className={styles.methodIcon}>
                      {method.icon}
                    </div>
                    <span className={styles.methodName}>{method.name}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.orderSummary}>
              <h4 className={styles.sectionTitle}>Order Summary</h4>
              <div className={styles.summaryRow}>
                <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              {selectedOption === 'delivery' && (
                <div className={styles.summaryRow}>
                  <span>
                    Delivery Fee
                    {deliveryInfo && (
                      <span className={styles.smartFeeBadge}> (Smart Matching)</span>
                    )}
                  </span>
                  <span>₱{deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className={styles.summaryTotal}>
                <span>Total Amount:</span>
                <span>₱{total.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>
      
      {cartItems.length > 0 && (
        <div className={styles.cartFooter}>
          <div className={styles.footerTotal}>
            <div className={styles.totalSection}>
              <span className={styles.totalLabel}>Total Amount:</span>
              <span className={styles.totalAmount}>₱{total.toFixed(2)}</span>
            </div>
          </div>
          <div className={styles.footerActions}>
            <div className={styles.deliveryTimeSummary}>
              <Clock size={12} />
              <span>{getDeliveryDateDisplay()} • {getDeliveryTimeDisplay()}</span>
            </div>
            <div className={styles.paymentMethodSummary}>
              {selectedPayment.icon}
              <span>{selectedPayment.name}</span>
            </div>
            <button
              onClick={handlePlaceOrder}
              className={`${styles.proceedBtn} ${moqErrors.length > 0 ? styles.disabled : ''}`}
              disabled={cartItems.length === 0 || isPlacingOrder || moqErrors.length > 0}
            >
              {isPlacingOrder ? (
                'Processing...'
              ) : moqErrors.length > 0 ? (
                'Fix MOQ Requirements'
              ) : getSelectedPaymentMethod().requiresProcessing ? (
                `Pay ₱${calculateTotal().toFixed(2)}`
              ) : (
                'Place Order (Cash on Delivery)'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}