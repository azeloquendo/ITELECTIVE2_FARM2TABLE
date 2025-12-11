import { NextResponse } from 'next/server';
import { verifyPayment } from '@/api/paymongo/services';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'paymentIntentId is required' },
        { status: 400 }
      );
    }

    const paymentData = await verifyPayment(paymentIntentId);
    
    return NextResponse.json({
      status: paymentData.attributes.status,
      payment_method: paymentData.attributes.payment_method_allowed?.[0] || 'card',
      amount: paymentData.attributes.amount,
      currency: paymentData.attributes.currency,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

