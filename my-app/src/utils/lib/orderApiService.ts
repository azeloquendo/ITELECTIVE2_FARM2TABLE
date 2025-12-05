export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  orderNumber: string; // ✅ ADDED: Order number field
  message: string;
}

export interface ApiOrderData {
  // Order metadata
  id: string;
  orderNumber: string; // ✅ ADDED: Order number field
  buyerId: string;
  buyerInfo: {
    id: string;
    name: string;
    address: string;
    contact?: string;
    email: string;
  };
  
  // Direct buyer fields for compatibility
  buyerName: string;
  contact: string;
  address: string;
  
  // Delivery information
  deliveryMethod: 'Delivery' | 'Pickup';
  deliveryDate: string;
  deliveryTime: string;
  deliveryAddress: string | null;
  pickupLocation: string | null;
  deliveryFee: number;
  deliveryOption: string | null;
  
  // Payment information
  paymentMethod: string;
  paymentType: 'cash' | 'digital';
  paymentStatus: string;
  
  // Order details
  products: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    unit: string;
  }>;
  sellers: Array<{
    sellerId: string;
    sellerName: string;
    items: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
      notes: string;
      unit: string;
      image: string;
    }>;
    subtotal: number;
  }>;
  subtotal: number;
  totalPrice: number;
  specialInstructions: string;
  
  // Additional metadata
  itemCount: number;
  productCount: number;

  // 🔥 NEW LOGISTICS FIELDS
  logistics?: {
    courier: string;
    tracking_number: string;
    cold_chain: boolean;
    delivery_status: string;
  };
}

// ✅ ADDED: Buyer Verification Check Function
const checkBuyerVerification = async (buyerId: string): Promise<{ isVerified: boolean; status: string }> => {
  try {
    if (!buyerId) {
      return { isVerified: false, status: "not_found" };
    }

    const { db } = await import("./firebase");
    const { doc, getDoc } = await import("firebase/firestore");

    const buyerDoc = await getDoc(doc(db, "buyers", buyerId));
    
    if (!buyerDoc.exists()) {
      return { isVerified: false, status: "not_found" };
    }

    const buyerData = buyerDoc.data();
    const verificationStatus = buyerData.idVerification?.status || "pending";
    
    return {
      isVerified: verificationStatus === "approved",
      status: verificationStatus
    };
  } catch (error) {
    console.error("❌ Error checking buyer verification:", error);
    return { isVerified: false, status: "error" };
  }
};

// ✅ ADDED: Get Verification Status Info
const getVerificationStatusInfo = (status: string) => {
  switch (status) {
    case "approved":
      return { 
        text: "Verified", 
        message: "Your account is verified and you can place orders."
      };
    case "pending":
      return { 
        text: "Verification Pending", 
        message: "Your account is under review. You cannot checkout until verified."
      };
    case "rejected":
      return { 
        text: "Verification Rejected", 
        message: "Your verification was rejected. Please contact support to resolve this issue."
      };
    default:
      return { 
        text: "Not Verified", 
        message: "Please complete ID verification to place orders."
      };
  }
};

export const createOrderViaApi = async (orderData: ApiOrderData): Promise<CreateOrderResponse> => {
  try {
    console.log('🚀 Sending order to API:', orderData);
    console.log('📦 Order Number being sent:', orderData.orderNumber);
    console.log('🔐 Checking buyer verification for:', orderData.buyerId);

    // ✅ ADDED: Buyer Verification Check before creating order
    const verification = await checkBuyerVerification(orderData.buyerId);
    console.log('🔐 Buyer verification status:', verification);

    if (!verification.isVerified) {
      const verificationInfo = getVerificationStatusInfo(verification.status);
      throw new Error(
        `ORDER_REJECTED: Account verification required. ` +
        `Status: ${verificationInfo.text}. ` +
        `${verificationInfo.message}`
      );
    }

    console.log('✅ Buyer verified, proceeding with order creation...');

    const response = await fetch('/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...orderData,
        // ✅ ADDED: Include verification status in order data for tracking
        buyerVerificationStatus: "approved",
        verificationCheckedAt: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // ✅ ADDED: Handle verification-related errors specifically
      if (errorData.error?.includes('verification') || errorData.error?.includes('verified')) {
        throw new Error(`ORDER_REJECTED: ${errorData.error}`);
      }
      
      throw new Error(errorData.error || `Failed to create order: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Order created via API:', result);
    console.log('📦 Order Number returned:', result.orderNumber);
    
    // ✅ ADDED: Validate that order number is returned
    if (!result.orderNumber) {
      console.warn('⚠️ Order number not returned from API, using generated one:', orderData.orderNumber);
      result.orderNumber = orderData.orderNumber;
    }
    
    return result;

  } catch (error) {
    console.error('❌ Error creating order via API:', error);
    
    // ✅ ADDED: Enhanced error handling for verification failures
    if (error instanceof Error && error.message.includes('ORDER_REJECTED')) {
      throw error; // Re-throw verification errors with clear messaging
    }
    
    throw error;
  }
};

// ✅ ADDED: Enhanced API health check with verification check
export const checkApiHealth = async (buyerId?: string): Promise<{ 
  apiHealthy: boolean; 
  buyerVerified?: boolean;
  verificationStatus?: string;
}> => {
  try {
    const response = await fetch('/api/orders/create', {
      method: 'HEAD',
    });
    
    const apiHealthy = response.ok;
    
    // ✅ ADDED: If buyerId provided, also check verification status
    if (buyerId) {
      try {
        const verification = await checkBuyerVerification(buyerId);
        return {
          apiHealthy,
          buyerVerified: verification.isVerified,
          verificationStatus: verification.status
        };
      } catch (verificationError) {
        console.error('❌ Error checking verification in health check:', verificationError);
        return {
          apiHealthy,
          buyerVerified: false,
          verificationStatus: 'error'
        };
      }
    }
    
    return { apiHealthy };
  } catch {
    return { apiHealthy: false };
  }
};

// ✅ ADDED: Standalone verification check function for other components
export const verifyBuyerBeforeAction = async (buyerId: string): Promise<void> => {
  const verification = await checkBuyerVerification(buyerId);
  
  if (!verification.isVerified) {
    const verificationInfo = getVerificationStatusInfo(verification.status);
    throw new Error(
      `ACTION_BLOCKED: Account verification required. ` +
      `Status: ${verificationInfo.text}. ` +
      `${verificationInfo.message}`
    );
  }
};

// ✅ ADDED: Get buyer verification status (for display purposes)
export const getBuyerVerificationStatus = async (buyerId: string): Promise<{
  isVerified: boolean;
  status: string;
  statusText: string;
  message: string;
}> => {
  const verification = await checkBuyerVerification(buyerId);
  const verificationInfo = getVerificationStatusInfo(verification.status);
  
  return {
    isVerified: verification.isVerified,
    status: verification.status,
    statusText: verificationInfo.text,
    message: verificationInfo.message
  };
};