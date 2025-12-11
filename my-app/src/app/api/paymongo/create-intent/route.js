import { NextResponse } from 'next/server';
import { createPaymentIntent } from '@/api/paymongo/services';

export async function POST(request) {
  try {
    const { amount, orderId, orderNumber } = await request.json();
    
    const paymentIntent = await createPaymentIntent({
      amount,
      orderId,
      orderNumber
    });

    return NextResponse.json({ data: paymentIntent });
  } catch (error) {
    console.error('Payment intent error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

