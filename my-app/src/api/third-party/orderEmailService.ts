// utils/lib/orderEmailService.ts - Direct Resend API integration
// ⚠️ SECURITY NOTE: Resend API key should not be exposed client-side in production.
// For production, consider using Resend's client SDK or a secure proxy service.

const RESEND_API_KEY = process.env.NEXT_PUBLIC_RESEND_API_KEY;

// Email template function
const generateOrderEmailHTML = (orderData: any) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  // Handle createdAt - could be Timestamp or string
  const createdAtDate = orderData.createdAt?.toDate 
    ? orderData.createdAt.toDate() 
    : (orderData.createdAt ? new Date(orderData.createdAt) : new Date());

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - ${orderData.orderNumber}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .order-number {
      background: rgba(255, 255, 255, 0.2);
      padding: 8px 16px;
      border-radius: 20px;
      display: inline-block;
      margin-top: 10px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .section {
      margin-bottom: 25px;
      padding-bottom: 25px;
      border-bottom: 1px solid #e9ecef;
    }
    .section:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    .section-title {
      color: #16a34a;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
    }
    .order-summary {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
    }
    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #e9ecef;
    }
    .order-item:last-child {
      border-bottom: none;
    }
    .item-details {
      flex: 1;
    }
    .item-name {
      font-weight: 600;
      color: #333;
    }
    .item-meta {
      font-size: 14px;
      color: #6c757d;
      margin-top: 4px;
    }
    .item-price {
      font-weight: 600;
      color: #16a34a;
    }
    .total-section {
      background: #16a34a;
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 18px;
      font-weight: 600;
    }
    .delivery-info {
      background: #e8f5e8;
      border: 1px solid #22c55e;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
    }
    .status-badge {
      background: #22c55e;
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
      <div class="order-number">${orderData.orderNumber}</div>
    </div>
    <div class="content">
      <div class="section">
        <h2 class="section-title">Order Details</h2>
        <div class="info-row">
          <span><strong>Order Date:</strong></span>
          <span>${createdAtDate.toLocaleDateString('en-PH', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
        <div class="info-row">
          <span><strong>Delivery Method:</strong></span>
          <span>${orderData.deliveryMethod}</span>
        </div>
        ${orderData.deliveryMethod === 'Delivery' ? `
        <div class="info-row">
          <span><strong>Delivery Address:</strong></span>
          <span>${orderData.deliveryAddress || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span><strong>Delivery Time:</strong></span>
          <span>${orderData.deliveryTime || 'N/A'} on ${orderData.deliveryDate ? new Date(orderData.deliveryDate).toLocaleDateString('en-PH', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          }) : 'N/A'}</span>
        </div>
        ` : `
        <div class="info-row">
          <span><strong>Pickup Location:</strong></span>
          <span>${orderData.pickupLocation || 'N/A'}</span>
        </div>
        `}
        <div class="info-row">
          <span><strong>Payment Method:</strong></span>
          <span>${orderData.paymentMethod || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span><strong>Status:</strong></span>
          <span class="status-badge">${orderData.paymentStatus === 'cash_on_delivery' ? 'Cash on Delivery' : 'Payment Processing'}</span>
        </div>
      </div>
      <div class="section">
        <h2 class="section-title">Order Items</h2>
        <div class="order-summary">
          ${(orderData.products || []).map((product: any) => `
            <div class="order-item">
              <div class="item-details">
                <div class="item-name">${product.name}</div>
                <div class="item-meta">
                  ${product.quantity} ${product.unit || 'piece'} • ${product.farmName || 'Local Farm'}
                  ${product.requiresColdChain ? ' • ❄️ Cold Chain' : ''}
                </div>
              </div>
              <div class="item-price">${formatCurrency((product.unitPrice || product.price || 0) * (product.quantity || 1))}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ${orderData.smartMatchingInfo ? `
      <div class="delivery-info">
        <h3 style="margin: 0 0 15px 0; color: #16a34a;">🚚 Smart Delivery Information</h3>
        <div class="info-row">
          <span>Distance:</span>
          <span>${orderData.smartMatchingInfo.distance} km</span>
        </div>
        <div class="info-row">
          <span>Estimated Delivery Time:</span>
          <span>${orderData.smartMatchingInfo.estimatedDeliveryTime} minutes</span>
        </div>
        <div class="info-row">
          <span>From Farm:</span>
          <span>${orderData.smartMatchingInfo.farmerLocation}</span>
        </div>
      </div>
      ` : ''}
      <div class="total-section">
        <div class="total-row">
          <span>Total Amount:</span>
          <span>${formatCurrency(orderData.totalPrice || 0)}</span>
        </div>
      </div>
      ${orderData.specialInstructions ? `
      <div class="section">
        <h2 class="section-title">Special Instructions</h2>
        <p>${orderData.specialInstructions}</p>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>Thank you for choosing Farm2Table! 🌱</p>
      <p>If you have any questions about your order, please contact our support team.</p>
      <p>📞 Support: support@farm2table.com | 🌐 Website: www.farm2table.com</p>
      <p style="margin-top: 20px; font-size: 12px; color: #adb5bd;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

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

    // Check if Resend API key is configured
    if (!RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured, simulating email send');
      return { 
        success: true, 
        error: 'RESEND_API_KEY not configured (email would be sent in production)'
      };
    }

    // Call Resend API directly
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Farm2Table <orders@farm2table.com>',
        to: email,
        subject: `Order Confirmation - ${orderData.orderNumber}`,
        html: generateOrderEmailHTML(orderData),
      }),
    });

    console.log('📧 Resend API Response status:', response.status);

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Resend API error response:', result);
      return { 
        success: false, 
        error: result.message || result.error || `HTTP ${response.status}`
      };
    }

    console.log('✅ Email sent successfully via Resend:', result);
    return { success: true };

  } catch (error) {
    console.error('❌ Error in sendOrderConfirmationEmail:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};