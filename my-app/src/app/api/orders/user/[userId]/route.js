import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../utils/lib/firebase-admin';

export async function GET(request, { params }) {
  try {
    const { userId } = params;
    
    console.log('🔍 Fetching orders for user:', userId);

    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    console.log('🔑 Token present:', !!token);
    
    if (!token) {
      console.log('❌ No authorization token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📊 Querying Firestore for orders...');
    
    const ordersSnapshot = await adminDb
      .collection('orders')
      .where('buyerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    console.log('📦 Found orders:', ordersSnapshot.size);

    const orders = [];
    
    for (const doc of ordersSnapshot.docs) {
      const orderData = doc.data();
      console.log('📄 Order data:', orderData.id, orderData.status);
      
      const transformedOrder = {
        id: orderData.id || doc.id,
        status: orderData.status || 'pending',
        sellerName: orderData.sellers?.[0]?.sellerName || 'Unknown Seller',
        sellerLogo: '',
        productImage: orderData.products?.[0]?.image || '/images/placeholder.jpg',
        productName: orderData.products?.[0]?.name || 'Multiple Products',
        quantity: orderData.products?.reduce((sum, product) => sum + (product.quantity || 1), 0) || 1,
        price: orderData.products?.[0]?.unitPrice || orderData.products?.[0]?.price || 0,
        totalPrice: orderData.totalPrice || 0,
        orderDate: orderData.orderDate || orderData.createdAt,
        tracking: [],
        ...orderData
      };

      // Generate tracking timeline
      const tracking = generateTrackingFromStatus(transformedOrder);
      transformedOrder.tracking = tracking;

      orders.push(transformedOrder);
    }

    console.log('✅ Returning orders:', orders.length);
    return NextResponse.json(orders);
    
  } catch (error) {
    console.error('❌ Error in API route:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

function generateTrackingFromStatus(order) {
  const tracking = [];
  const now = new Date().toISOString();
  
  tracking.push({
    location: "Order Placed",
    time: order.orderDate || order.createdAt || now,
    description: "Your order has been received"
  });

  if (order.status === 'to-ship' || order.status === 'confirmed') {
    tracking.push({
      location: "Order Confirmed",
      time: order.updatedAt || now,
      description: "Seller has confirmed your order"
    });
  }

  if (order.status === 'to-receive' || order.status === 'shipped') {
    tracking.push({
      location: "Shipped",
      time: order.updatedAt || now,
      description: "Your order is on the way"
    });
  }

  if (order.status === 'to-review' || order.status === 'delivered') {
    tracking.push({
      location: "Delivered",
      time: order.updatedAt || now,
      description: "Your order has been delivered"
    });
  }

  if (order.status === 'completed') {
    tracking.push({
      location: "Completed",
      time: order.updatedAt || now,
      description: "Order completed successfully"
    });
  }

  return tracking;
}