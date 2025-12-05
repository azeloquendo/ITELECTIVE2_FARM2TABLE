// Payment service for PayMongo integration

// Use TEST key for now (switch to LIVE when ready)
const PAYMONGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYMONGO_TEST_PUBLIC_KEY;

// Create payment method (frontend - safe to use public key)
export async function createPaymentMethod(paymentType, buyerDetails) {
  try {
    const response = await fetch('https://api.paymongo.com/v1/payment_methods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(PAYMONGO_PUBLIC_KEY + ':'),
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

// Create payment intent (through our backend)
export async function createPaymentIntent(amount, orderId, orderNumber) { // ✅ ADDED: orderNumber parameter
  try {
    const response = await fetch('/api/payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        orderId: orderId,
        orderNumber: orderNumber // ✅ ADDED: Include order number
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create payment intent');
    }

    return data.data; // payment intent data
  } catch (error) {
    console.error('Create payment intent error:', error);
    throw error;
  }
}

// Attach payment method to intent (through our backend)
export async function attachPaymentMethod(paymentIntentId, paymentMethodId) {
  try {
    const response = await fetch('/api/attach-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId: paymentIntentId,
        paymentMethodId: paymentMethodId
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to attach payment');
    }

    return data.data;
  } catch (error) {
    console.error('Attach payment error:', error);
    throw error;
  }
}

// Main payment handler
export async function processPayment(paymentData) {
  const { amount, orderId, orderNumber, paymentMethod, buyerDetails } = paymentData; // ✅ ADDED: orderNumber

  try {
    console.log('🔄 Starting payment process...');
    console.log('📦 Processing payment for order number:', orderNumber); // ✅ ADDED: Log order number
    
    // 1. Create payment intent
    const paymentIntent = await createPaymentIntent(amount, orderId, orderNumber); // ✅ UPDATED: Pass order number
    console.log('✅ Payment intent created:', paymentIntent.id);

    // 2. Create payment method
    const paymentMethodId = await createPaymentMethod(paymentMethod, buyerDetails);
    console.log('✅ Payment method created:', paymentMethodId);

    // 3. Attach payment method to intent
    const attachedPayment = await attachPaymentMethod(paymentIntent.id, paymentMethodId);
    console.log('✅ Payment attached, redirect URL:', attachedPayment.attributes.next_action?.redirect?.url);

    return {
      success: true,
      redirectUrl: attachedPayment.attributes.next_action?.redirect?.url,
      paymentIntentId: paymentIntent.id,
      orderNumber: orderNumber // ✅ ADDED: Return order number
    };
  } catch (error) {
    console.error('❌ Payment processing failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}