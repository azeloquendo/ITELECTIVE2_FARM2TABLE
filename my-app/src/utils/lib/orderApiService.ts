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
    console.log('🚀 Creating order directly in Firebase:', orderData);
    console.log('📦 Order Number being sent:', orderData.orderNumber);
    console.log('🔐 Checking buyer verification for:', orderData.buyerId);

    // ✅ Buyer Verification Check before creating order
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

    // Import Firebase functions
    const { db } = await import("./firebase");
    const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");

    // Validate required fields
    if (!orderData.buyerId) {
      throw new Error('Buyer ID is required');
    }

    if (!orderData.products || orderData.products.length === 0) {
      throw new Error('Order must contain products');
    }

    if (!orderData.orderNumber) {
      throw new Error('Order number is required');
    }

    if (!orderData.deliveryMethod) {
      throw new Error('Delivery method is required');
    }

    // For delivery orders, validate address
    if (orderData.deliveryMethod === 'Delivery' && !orderData.deliveryAddress) {
      throw new Error('Delivery address is required for delivery orders');
    }

    // For pickup orders, validate pickup location
    if (orderData.deliveryMethod === 'Pickup' && !orderData.pickupLocation) {
      throw new Error('Pickup location is required for pickup orders');
    }

    // Helper function to remove undefined values (Firestore doesn't allow undefined)
    const removeUndefined = (obj: any): any => {
      // Handle null or undefined
      if (obj === null || obj === undefined) {
        return null;
      }
      
      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(item => removeUndefined(item)).filter(item => item !== undefined);
      }
      
      // Handle Date objects and Firestore Timestamps (keep as is)
      if (obj instanceof Date || (obj && typeof obj.toDate === 'function')) {
        return obj;
      }
      
      // Handle primitive types (string, number, boolean)
      if (typeof obj !== 'object') {
        return obj;
      }
      
      // Handle objects
      const cleaned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          
          // Skip undefined values completely
          if (value === undefined) {
            continue;
          }
          
          // Recursively clean nested objects and arrays
          if (value !== null && typeof value === 'object') {
            if (Array.isArray(value)) {
              const cleanedArray = value.map(item => removeUndefined(item)).filter(item => item !== undefined);
              if (cleanedArray.length > 0) {
                cleaned[key] = cleanedArray;
              }
            } else if (value instanceof Date || (value && typeof value.toDate === 'function')) {
              // Keep Date and Firestore Timestamp objects as is
              cleaned[key] = value;
            } else {
              // Recursively clean nested objects
              const cleanedValue = removeUndefined(value);
              if (cleanedValue !== null && cleanedValue !== undefined) {
                cleaned[key] = cleanedValue;
              }
            }
          } else {
            // Primitive value - keep it
            cleaned[key] = value;
          }
        }
      }
      return cleaned;
    };

    // Create the order document structure with explicit defaults
    const orderDoc: any = {
      // Order metadata
      id: orderData.id || '',
      orderNumber: orderData.orderNumber || '',
      buyerId: orderData.buyerId || '',
      buyerInfo: orderData.buyerInfo ? removeUndefined(orderData.buyerInfo) : {},
      
      // Direct buyer fields for compatibility
      buyerName: orderData.buyerName || '',
      contact: orderData.contact || '',
      address: orderData.address || '',
      
      // Delivery method fields
      deliveryMethod: orderData.deliveryMethod || 'Delivery',
      deliveryDate: orderData.deliveryDate || null,
      deliveryTime: orderData.deliveryTime || null,
      deliveryAddress: orderData.deliveryAddress || null,
      pickupLocation: orderData.pickupLocation || null,
      deliveryFee: orderData.deliveryFee ?? 0,
      deliveryOption: orderData.deliveryOption || null,
      deliveryOptionType: orderData.deliveryOptionType || null,
      
      // Payment information
      paymentMethod: orderData.paymentMethod || '',
      paymentType: orderData.paymentType || 'cash',
      paymentStatus: orderData.paymentStatus || 'pending',
      
      // Order details - clean nested arrays
      products: Array.isArray(orderData.products) 
        ? orderData.products.map((p: any) => removeUndefined({
            name: p.name || '',
            quantity: p.quantity ?? 0,
            unitPrice: p.unitPrice ?? p.price ?? 0,
            unit: p.unit || 'pc',
            productId: p.productId || '',
            image: p.image || '',
            notes: p.notes || '',
            minimumOrderQuantity: p.minimumOrderQuantity ?? 1,
            farmerPrice: p.farmerPrice ?? null,
            marketPrice: p.marketPrice ?? null,
            platformFee: p.platformFee ?? null,
            shippingFee: p.shippingFee ?? null,
            vatAmount: p.vatAmount ?? null,
            finalPrice: p.finalPrice ?? null,
            requiresColdChain: p.requiresColdChain ?? false,
          }))
        : [],
      sellers: Array.isArray(orderData.sellers)
        ? orderData.sellers.map((s: any) => removeUndefined({
            sellerId: s.sellerId || '',
            sellerName: s.sellerName || '',
            subtotal: s.subtotal ?? 0,
            items: Array.isArray(s.items) 
              ? s.items.map((item: any) => removeUndefined({
                  productId: item.productId || '',
                  name: item.name || '',
                  price: item.price ?? item.unitPrice ?? 0,
                  unitPrice: item.unitPrice ?? item.price ?? 0,
                  quantity: item.quantity ?? 0,
                  notes: item.notes || '',
                  unit: item.unit || 'pc',
                  image: item.image || '',
                  minimumOrderQuantity: item.minimumOrderQuantity ?? 1,
                  farmerPrice: item.farmerPrice ?? null,
                  marketPrice: item.marketPrice ?? null,
                  platformFee: item.platformFee ?? null,
                  shippingFee: item.shippingFee ?? null,
                  vatAmount: item.vatAmount ?? null,
                  finalPrice: item.finalPrice ?? null,
                  requiresColdChain: item.requiresColdChain ?? false,
                }))
              : [],
          }))
        : [],
      subtotal: orderData.subtotal ?? 0,
      totalPrice: orderData.totalPrice ?? 0,
      specialInstructions: orderData.specialInstructions || "",
      
      // Price breakdown if available
      priceBreakdown: orderData.priceBreakdown ? removeUndefined(orderData.priceBreakdown) : null,
      hasColdChainItems: orderData.hasColdChainItems ?? false,
      
      // Timestamps
      createdAt: serverTimestamp(),
      orderDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
      
      // Status
      status: orderData.status || 'pending',
      
      // Additional metadata
      itemCount: orderData.itemCount ?? 0,
      productCount: orderData.productCount ?? 0,

      // Smart matching info if available
      smartMatchingInfo: orderData.smartMatchingInfo ? removeUndefined(orderData.smartMatchingInfo) : null,

      // Verification status
      buyerVerificationStatus: "approved",
      verificationCheckedAt: serverTimestamp()
    };

    // Remove any undefined values before saving to Firestore (final cleanup)
    const cleanedOrderDoc = removeUndefined(orderDoc);
    
    // Final validation: Check for any remaining undefined values
    const checkForUndefined = (obj: any, path: string = ''): string[] => {
      const undefinedPaths: string[] = [];
      if (obj === undefined) {
        undefinedPaths.push(path || 'root');
        return undefinedPaths;
      }
      if (obj === null || typeof obj !== 'object' || obj instanceof Date || (obj && typeof obj.toDate === 'function')) {
        return undefinedPaths;
      }
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          if (item === undefined) {
            undefinedPaths.push(`${path}[${index}]`);
          } else if (item !== null && typeof item === 'object') {
            undefinedPaths.push(...checkForUndefined(item, `${path}[${index}]`));
          }
        });
      } else {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            const currentPath = path ? `${path}.${key}` : key;
            if (value === undefined) {
              undefinedPaths.push(currentPath);
            } else if (value !== null && typeof value === 'object') {
              undefinedPaths.push(...checkForUndefined(value, currentPath));
            }
          }
        }
      }
      return undefinedPaths;
    };
    
    const undefinedFields = checkForUndefined(cleanedOrderDoc);
    if (undefinedFields.length > 0) {
      console.error('❌ Found undefined values in cleaned order document:', undefinedFields);
      // Remove undefined fields explicitly
      undefinedFields.forEach(path => {
        const keys = path.split(/[\.\[\]]/).filter(k => k);
        let current: any = cleanedOrderDoc;
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (current[key] === undefined) {
            return; // Path doesn't exist
          }
          current = current[key];
        }
        const lastKey = keys[keys.length - 1];
        if (current && typeof current === 'object' && !Array.isArray(current)) {
          delete current[lastKey];
        }
      });
    }
    
    // Log the cleaned document for debugging (without sensitive data)
    console.log('📋 Order document structure:', {
      orderNumber: cleanedOrderDoc.orderNumber,
      buyerId: cleanedOrderDoc.buyerId,
      deliveryMethod: cleanedOrderDoc.deliveryMethod,
      paymentType: cleanedOrderDoc.paymentType,
      productCount: cleanedOrderDoc.productCount,
      sellerCount: cleanedOrderDoc.sellers?.length || 0,
    });

    console.log('💾 Saving order to Firestore...', {
      orderId: orderData.id,
      orderNumber: orderData.orderNumber,
      deliveryMethod: orderData.deliveryMethod,
      deliveryFee: orderData.deliveryFee
    });

    // Save to Firestore (using cleaned document without undefined values)
    const docRef = await addDoc(collection(db, 'orders'), cleanedOrderDoc);

    console.log('✅ Order saved successfully:', {
      firestoreId: docRef.id,
      orderNumber: orderData.orderNumber
    });

    return {
      success: true,
      orderId: docRef.id,
      orderNumber: orderData.orderNumber,
      message: 'Order created successfully'
    };

  } catch (error) {
    console.error('❌ Error creating order:', error);
    
    // Enhanced error handling for verification failures
    if (error instanceof Error && error.message.includes('ORDER_REJECTED')) {
      throw error; // Re-throw verification errors with clear messaging
    }
    
    throw error instanceof Error ? error : new Error('Failed to create order');
  }
};

// Health check - verify Firebase connection and buyer verification
export const checkApiHealth = async (buyerId?: string): Promise<{ 
  apiHealthy: boolean; 
  buyerVerified?: boolean;
  verificationStatus?: string;
}> => {
  try {
    // Check Firebase connection by trying to access db
    const { db } = await import("./firebase");
    const apiHealthy = !!db;
    
    // If buyerId provided, also check verification status
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