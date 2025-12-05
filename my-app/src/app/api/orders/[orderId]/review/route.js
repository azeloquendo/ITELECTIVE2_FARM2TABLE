import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../utils/lib/firebase-admin';

export async function POST(request, { params }) {
  try {
    const { orderId } = params;
    const { rating, review } = await request.json();

    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the order
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Create review in a separate collection
    await adminDb.collection('reviews').add({
      orderId: orderId,
      rating: rating,
      review: review || '',
      buyerId: orderDoc.data().buyerId,
      sellerId: orderDoc.data().sellers?.[0]?.sellerId,
      createdAt: new Date().toISOString(),
      productNames: orderDoc.data().products?.map(p => p.name) || []
    });

    // Update order status to completed
    await orderRef.update({
      status: 'completed',
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}