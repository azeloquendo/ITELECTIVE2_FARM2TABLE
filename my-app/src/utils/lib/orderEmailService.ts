// utils/lib/orderEmailService.ts
export const sendOrderConfirmationEmail = async (
  email: string,
  name: string,
  orderData: any
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📧 Preparing to send order confirmation email...');
    console.log('📧 Email details:', {
      to: email,
      name: name,
      orderNumber: orderData.orderNumber,
      total: orderData.totalPrice
    });

    // Validate email parameters
    if (!email || !email.includes('@')) {
      console.error('❌ Invalid email address:', email);
      return { success: false, error: 'Invalid email address' };
    }

    if (!orderData.orderNumber) {
      console.error('❌ Missing order number');
      return { success: false, error: 'Missing order number' };
    }

    const response = await fetch('/api/send-order-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name,
        orderData
      }),
    });

    console.log('📧 API Response status:', response.status);

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('❌ Non-JSON response from email API:', textResponse.substring(0, 200));
      return { 
        success: false, 
        error: `Email service returned non-JSON response: ${response.status}`
      };
    }

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Email API error response:', result);
      return { 
        success: false, 
        error: result.error || result.message || `HTTP ${response.status}`
      };
    }

    console.log('✅ Email API success response:', result);
    return { success: true };

  } catch (error) {
    console.error('❌ Error in sendOrderConfirmationEmail:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};