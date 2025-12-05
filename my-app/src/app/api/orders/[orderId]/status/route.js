import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../utils/lib/firebase-admin';

export async function PATCH(request, { params }) {
  try {
    const { orderId } = params;
    const { status } = await request.json();

    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the order document by its ID
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order status
    await orderRef.update({
      status: status,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      status: status,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}