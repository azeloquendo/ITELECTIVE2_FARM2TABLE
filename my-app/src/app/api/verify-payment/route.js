import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { paymentIntentId } = await request.json();

    // Verify payment with Paymongo
    const response = await fetch(
      `https://api.paymongo.com/v1/payment_intents/${paymentIntentId}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to verify payment with Paymongo');
    }

    const paymentData = await response.json();
    
    return NextResponse.json({
      status: paymentData.data.attributes.status,
      payment_method: paymentData.data.attributes.payment_method_allowed?.[0] || 'card',
      amount: paymentData.data.attributes.amount,
      currency: paymentData.data.attributes.currency,
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}