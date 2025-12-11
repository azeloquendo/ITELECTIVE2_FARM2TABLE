import { NextResponse } from 'next/server';
import { attachPaymentMethod } from '@/api/paymongo/services';

export async function POST(request) {
  try {
    const { paymentIntentId, paymentMethodId, returnUrl } = await request.json();
    
    // Use provided return URL or default
    const finalReturnUrl = returnUrl || (request.headers.get('origin') || 'http://localhost:3000') + '/payment-success';

    const paymentIntent = await attachPaymentMethod({
      paymentIntentId,
      paymentMethodId,
      returnUrl: finalReturnUrl
    });

    return NextResponse.json({ data: paymentIntent });
  } catch (error) {
    console.error('Attach payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

