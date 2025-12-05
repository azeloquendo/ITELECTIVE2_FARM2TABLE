import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { paymentIntentId, paymentMethodId } = await request.json();
    
    // TEST key for now
    const secretKey = process.env.PAYMONGO_TEST_SECRET_KEY;
    
    const response = await fetch(
      `https://api.paymongo.com/v1/payment_intents/${paymentIntentId}/attach`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(secretKey + ':').toString('base64'),
        },
        body: JSON.stringify({
          data: {
            attributes: {
              payment_method: paymentMethodId,
              return_url: 'http://localhost:3000/payment-success'
            }
          }
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to attach payment');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Attach payment error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}