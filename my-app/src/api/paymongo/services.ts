// Paymongo API service - server-side only
// This service is used by Next.js API routes in app/api/paymongo/

const getSecretKey = (): string => {
  const secretKey = process.env.PAYMONGO_SECRET_KEY || process.env.PAYMONGO_TEST_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Paymongo secret key not configured on server. Please set PAYMONGO_SECRET_KEY or PAYMONGO_TEST_SECRET_KEY in environment variables.');
  }
  return secretKey;
};

const createAuthHeader = (key: string): string => {
  return 'Basic ' + Buffer.from(key + ':').toString('base64');
};

export interface CreatePaymentIntentParams {
  amount: number;
  orderId: string;
  orderNumber: string;
}

export interface AttachPaymentParams {
  paymentIntentId: string;
  paymentMethodId: string;
  returnUrl: string;
}

export interface PaymentIntentResponse {
  id: string;
  type: string;
  attributes: {
    amount: number;
    currency: string;
    status: string;
    payment_method_allowed: string[];
    metadata?: Record<string, any>;
    next_action?: any;
  };
  _mock?: boolean;
}

/**
 * Create payment intent via Paymongo API
 */
export async function createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResponse> {
  const secretKey = getSecretKey();
  
  const response = await fetch('https://api.paymongo.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': createAuthHeader(secretKey),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(params.amount * 100),
          currency: 'PHP',
          payment_method_allowed: ['gcash', 'paymaya', 'card'],
          capture_type: 'automatic',
          metadata: {
            order_id: params.orderId,
            order_number: params.orderNumber,
          }
        }
      }
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    const errorMessage = data.errors?.[0]?.detail || data.errors?.[0]?.message || 'Failed to create payment intent';
    const errorMessageLower = errorMessage.toLowerCase();
    
    // Mock mode for demo purposes when account is not activated
    if (errorMessageLower.includes('activate') || 
        errorMessageLower.includes('activation') ||
        errorMessageLower.includes('verify') ||
        errorMessageLower.includes('verification') ||
        errorMessageLower.includes('access this resource')) {
      console.log('⚠️ Paymongo account not activated. Using mock payment intent for demo purposes.');
      
      return {
        id: `pi_mock_${Date.now()}`,
        type: 'payment_intent',
        attributes: {
          amount: Math.round(params.amount * 100),
          currency: 'PHP',
          status: 'awaiting_payment_method',
          payment_method_allowed: ['gcash', 'paymaya', 'card'],
          metadata: {
            order_id: params.orderId,
            order_number: params.orderNumber,
          }
        },
        _mock: true
      };
    }
    
    throw new Error(errorMessage);
  }

  return data.data;
}

/**
 * Attach payment method to payment intent
 */
export async function attachPaymentMethod(params: AttachPaymentParams): Promise<PaymentIntentResponse> {
  const secretKey = getSecretKey();
  
  const response = await fetch(
    `https://api.paymongo.com/v1/payment_intents/${params.paymentIntentId}/attach`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': createAuthHeader(secretKey),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: params.paymentMethodId,
            return_url: params.returnUrl
          }
        }
      })
    }
  );

  const data = await response.json();
  
  if (!response.ok) {
    const errorMessage = data.errors?.[0]?.detail || data.errors?.[0]?.message || 'Failed to attach payment';
    const errorMessageLower = errorMessage.toLowerCase();
    
    // Mock mode for demo purposes
    if (errorMessageLower.includes('activate') || 
        errorMessageLower.includes('activation') ||
        errorMessageLower.includes('verify') ||
        errorMessageLower.includes('verification') ||
        errorMessageLower.includes('access this resource')) {
      console.log('⚠️ Paymongo account not activated. Using mock payment attachment for demo purposes.');
      
      return {
        id: params.paymentIntentId,
        type: 'payment_intent',
        attributes: {
          status: 'awaiting_next_action',
          next_action: {
            type: 'redirect',
            redirect: {
              url: params.returnUrl + `?payment_intent=${params.paymentIntentId}&status=success&mock=true`
            }
          }
        },
        _mock: true
      };
    }
    
    throw new Error(errorMessage);
  }

  return data.data;
}

/**
 * Verify payment status
 */
export async function verifyPayment(paymentIntentId: string): Promise<any> {
  const secretKey = getSecretKey();
  
  const response = await fetch(
    `https://api.paymongo.com/v1/payment_intents/${paymentIntentId}`,
    {
      headers: {
        'Authorization': createAuthHeader(secretKey),
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.errors?.[0]?.detail || 'Failed to verify payment');
  }

  const paymentData = await response.json();
  return paymentData.data;
}

