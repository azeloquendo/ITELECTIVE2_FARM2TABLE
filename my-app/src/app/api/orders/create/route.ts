import { NextResponse } from 'next/server';
import { adminDb } from '../../../../utils/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const orderData = await request.json();

    console.log('📦 Received order data:', orderData);
    console.log('🔢 Order Number received:', orderData.orderNumber);

    // Validate required fields
    if (!orderData.buyerId) {
      return NextResponse.json(
        { error: 'Buyer ID is required' },
        { status: 400 }
      );
    }

    if (!orderData.products || orderData.products.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain products' },
        { status: 400 }
      );
    }

    // Validate order number
    if (!orderData.orderNumber) {
      return NextResponse.json(
        { error: 'Order number is required' },
        { status: 400 }
      );
    }

    // Validate delivery method data
    if (!orderData.deliveryMethod) {
      return NextResponse.json(
        { error: 'Delivery method is required' },
        { status: 400 }
      );
    }

    // For delivery orders, validate address
    if (orderData.deliveryMethod === 'Delivery' && !orderData.deliveryAddress) {
      return NextResponse.json(
        { error: 'Delivery address is required for delivery orders' },
        { status: 400 }
      );
    }

    // For pickup orders, validate pickup location
    if (orderData.deliveryMethod === 'Pickup' && !orderData.pickupLocation) {
      return NextResponse.json(
        { error: 'Pickup location is required for pickup orders' },
        { status: 400 }
      );
    }

    // Create the order document structure
    const orderDoc = {
      // Order metadata
      id: orderData.id,
      orderNumber: orderData.orderNumber,
      buyerId: orderData.buyerId,
      buyerInfo: orderData.buyerInfo,
      
      // Direct buyer fields for compatibility
      buyerName: orderData.buyerName,
      contact: orderData.contact,
      address: orderData.address,
      
      // Delivery method fields
      deliveryMethod: orderData.deliveryMethod,
      deliveryDate: orderData.deliveryDate,
      deliveryTime: orderData.deliveryTime,
      deliveryAddress: orderData.deliveryAddress,
      pickupLocation: orderData.pickupLocation,
      deliveryFee: orderData.deliveryFee || 0,
      deliveryOption: orderData.deliveryOption,
      
      // Payment information
      paymentMethod: orderData.paymentMethod,
      paymentType: orderData.paymentType,
      paymentStatus: orderData.paymentStatus,
      
      // Order details
      products: orderData.products,
      sellers: orderData.sellers,
      subtotal: orderData.subtotal,
      totalPrice: orderData.totalPrice,
      specialInstructions: orderData.specialInstructions || "",
      
      // Timestamps
      createdAt: new Date().toISOString(),
      orderDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Status
      status: 'pending',
      
      // Additional metadata
      itemCount: orderData.itemCount,
      productCount: orderData.productCount,

      // Smart matching info if available
      smartMatchingInfo: orderData.smartMatchingInfo || null
    };

    console.log('💾 Saving order to Firestore...', {
      orderId: orderData.id,
      orderNumber: orderData.orderNumber,
      deliveryMethod: orderData.deliveryMethod,
      deliveryFee: orderData.deliveryFee
    });

    // Save to Firestore
    const docRef = await adminDb.collection('orders').add(orderDoc);

    console.log('✅ Order saved successfully:', {
      firestoreId: docRef.id,
      orderNumber: orderData.orderNumber
    });

    return NextResponse.json({
      success: true,
      orderId: docRef.id,
      orderNumber: orderData.orderNumber,
      message: 'Order created successfully'
    });

  } catch (error: any) {
    console.error('❌ Error creating order:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create order',
        message: error.message 
      },
      { status: 500 }
    );
  }
}