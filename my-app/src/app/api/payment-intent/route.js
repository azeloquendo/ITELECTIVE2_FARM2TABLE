import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { amount, orderId } = await request.json();
    
    // Use TEST key for now (switch to LIVE when ready)
    const secretKey = process.env.PAYMONGO_TEST_SECRET_KEY;
    
    const response = await fetch('https://api.paymongo.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(secretKey + ':').toString('base64'),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.round(amount * 100), 
            currency: 'PHP',
            payment_method_allowed: ['gcash', 'paymaya', 'card'],
            capture_type: 'automatic',
            metadata: {
              order_id: orderId,
            }
          }
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to create payment intent');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Payment intent error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}