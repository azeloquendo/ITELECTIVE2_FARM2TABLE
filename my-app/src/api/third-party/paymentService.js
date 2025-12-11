// Payment service for PayMongo integration
// Uses secure API routes for secret key operations, client-side for public key operations

const PAYMONGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYMONGO_TEST_PUBLIC_KEY;

// Helper to create Basic Auth header
const createAuthHeader = (key) => {
  return 'Basic ' + btoa(key + ':');
};

// Create payment method (client-side - safe to use public key)
export async function createPaymentMethod(paymentType, buyerDetails) {
  try {
    if (!PAYMONGO_PUBLIC_KEY) {
      throw new Error(
        'Paymongo public key not configured. Please set NEXT_PUBLIC_PAYMONGO_TEST_PUBLIC_KEY in your .env.local file.\n' +
        'Get your keys from: https://dashboard.paymongo.com/'
      );
    }

    const response = await fetch('https://api.paymongo.com/v1/payment_methods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': createAuthHeader(PAYMONGO_PUBLIC_KEY),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: paymentType, // 'gcash', 'paymaya', or 'card'
            billing: {
              name: buyerDetails.name,
              email: buyerDetails.email,
              phone: buyerDetails.phone,
            }
          }
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to create payment method');
    }

    return data.data.id; // payment_method_id
  } catch (error) {
    console.error('Create payment method error:', error);
    throw error;
  }
}

// Create payment intent (uses secure API route - secret key stays on server)
export async function createPaymentIntent(amount, orderId, orderNumber) {
  try {
    const response = await fetch('/api/paymongo/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        orderId: orderId,
        orderNumber: orderNumber
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      // Check if it's an account activation error - allow mock mode for demo
      const errorMsg = (data.error || '').toLowerCase();
      if (errorMsg.includes('activate') || 
          errorMsg.includes('activation') ||
          errorMsg.includes('verify') ||
          errorMsg.includes('verification') ||
          errorMsg.includes('access this resource')) {
        console.log('⚠️ Paymongo account not activated. Using mock payment intent for demo.');
        // Return mock payment intent
        return {
          id: `pi_mock_${Date.now()}`,
          type: 'payment_intent',
          attributes: {
            amount: Math.round(amount * 100),
            currency: 'PHP',
            status: 'awaiting_payment_method',
            payment_method_allowed: ['gcash', 'paymaya', 'card'],
            metadata: {
              order_id: orderId,
              order_number: orderNumber,
            }
          },
          _mock: true
        };
      }
      throw new Error(data.error || 'Failed to create payment intent');
    }

    return data.data; // payment intent data
  } catch (error) {
    console.error('Create payment intent error:', error);
    throw error;
  }
}

// Attach payment method to intent (uses secure API route - secret key stays on server)
export async function attachPaymentMethod(paymentIntentId, paymentMethodId, returnUrl = null) {
  try {
    // Use window.location for return URL if not provided
    const finalReturnUrl = returnUrl || (typeof window !== 'undefined' ? `${window.location.origin}/payment-success` : 'http://localhost:3000/payment-success');

    const response = await fetch('/api/paymongo/attach-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId: paymentIntentId,
        paymentMethodId: paymentMethodId,
        returnUrl: finalReturnUrl
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      // Check if it's an account activation error - allow mock mode for demo
      const errorMsg = (data.error || '').toLowerCase();
      if (errorMsg.includes('activate') || 
          errorMsg.includes('activation') ||
          errorMsg.includes('verify') ||
          errorMsg.includes('verification') ||
          errorMsg.includes('access this resource')) {
        console.log('⚠️ Paymongo account not activated. Using mock payment attachment for demo.');
        // Return mock payment attachment
        return {
          id: paymentIntentId,
          type: 'payment_intent',
          attributes: {
            status: 'awaiting_next_action',
            next_action: {
              type: 'redirect',
              redirect: {
                url: finalReturnUrl + '?payment_intent=' + paymentIntentId + '&status=success&mock=true'
              }
            }
          },
          _mock: true
        };
      }
      throw new Error(data.error || 'Failed to attach payment');
    }

    return data.data;
  } catch (error) {
    console.error('Attach payment error:', error);
    throw error;
  }
}

// Verify payment (uses secure API route - secret key stays on server)
export async function verifyPayment(paymentIntentId) {
  try {
    const response = await fetch(
      `/api/paymongo/verify-payment?paymentIntentId=${encodeURIComponent(paymentIntentId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to verify payment');
    }

    const paymentData = await response.json();
    
    return {
      status: paymentData.status,
      payment_method: paymentData.payment_method,
      amount: paymentData.amount,
      currency: paymentData.currency,
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
}

// Main payment handler
export async function processPayment(paymentData) {
  const { amount, orderId, orderNumber, paymentMethod, buyerDetails, returnUrl } = paymentData;

  try {
    console.log('🔄 Starting payment process...');
    console.log('📦 Processing payment for order number:', orderNumber);
    
    // 1. Create payment intent
    const paymentIntent = await createPaymentIntent(amount, orderId, orderNumber);
    console.log('✅ Payment intent created:', paymentIntent.id);

    // 2. Create payment method
    const paymentMethodId = await createPaymentMethod(paymentMethod, buyerDetails);
    console.log('✅ Payment method created:', paymentMethodId);

    // 3. Attach payment method to intent
    const attachedPayment = await attachPaymentMethod(paymentIntent.id, paymentMethodId, returnUrl);
    console.log('✅ Payment attached, redirect URL:', attachedPayment.attributes.next_action?.redirect?.url);

    return {
      success: true,
      redirectUrl: attachedPayment.attributes.next_action?.redirect?.url,
      paymentIntentId: paymentIntent.id,
      orderNumber: orderNumber
    };
  } catch (error) {
    console.error('❌ Payment processing failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}