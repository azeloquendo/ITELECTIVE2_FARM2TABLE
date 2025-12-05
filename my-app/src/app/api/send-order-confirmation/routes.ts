// app/api/send-order-confirmation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Email template function
const generateOrderEmailHTML = (orderData: any) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

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
    <!-- Header -->
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
      <div class="order-number">${orderData.orderNumber}</div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Order Details -->
      <div class="section">
        <h2 class="section-title">Order Details</h2>
        <div class="info-row">
          <span><strong>Order Date:</strong></span>
          <span>${new Date(orderData.createdAt).toLocaleDateString('en-PH', { 
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
          <span>${orderData.deliveryAddress}</span>
        </div>
        <div class="info-row">
          <span><strong>Delivery Time:</strong></span>
          <span>${orderData.deliveryTime} on ${new Date(orderData.deliveryDate).toLocaleDateString('en-PH', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })}</span>
        </div>
        ` : `
        <div class="info-row">
          <span><strong>Pickup Location:</strong></span>
          <span>${orderData.pickupLocation}</span>
        </div>
        `}
        <div class="info-row">
          <span><strong>Payment Method:</strong></span>
          <span>${orderData.paymentMethod}</span>
        </div>
        <div class="info-row">
          <span><strong>Status:</strong></span>
          <span class="status-badge">${orderData.paymentStatus === 'cash_on_delivery' ? 'Cash on Delivery' : 'Payment Processing'}</span>
        </div>
      </div>

      <!-- Order Items -->
      <div class="section">
        <h2 class="section-title">Order Items</h2>
        <div class="order-summary">
          ${orderData.products.map((product: any) => `
            <div class="order-item">
              <div class="item-details">
                <div class="item-name">${product.name}</div>
                <div class="item-meta">
                  ${product.quantity} ${product.unit} • ${product.farmName || 'Local Farm'}
                  ${product.requiresColdChain ? ' • ❄️ Cold Chain' : ''}
                </div>
              </div>
              <div class="item-price">${formatCurrency(product.unitPrice * product.quantity)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Delivery Info -->
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

      <!-- Total -->
      <div class="total-section">
        <div class="total-row">
          <span>Total Amount:</span>
          <span>${formatCurrency(orderData.totalPrice)}</span>
        </div>
      </div>

      <!-- Special Instructions -->
      ${orderData.specialInstructions ? `
      <div class="section">
        <h2 class="section-title">Special Instructions</h2>
        <p>${orderData.specialInstructions}</p>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
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

export async function POST(request: NextRequest) {
  try {
    const { email, name, orderData } = await request.json();

    console.log('📧 API: Sending order confirmation email to:', email);
    console.log('📦 Order Number:', orderData.orderNumber);
    console.log('💰 Total Amount:', orderData.totalPrice);

    // Validate required fields
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (!orderData?.orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing order number' },
        { status: 400 }
      );
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured, simulating email send');
      return NextResponse.json({ 
        success: true, 
        message: 'Order confirmation email would be sent (RESEND_API_KEY not configured)',
        orderNumber: orderData.orderNumber
      });
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Farm2Table <orders@farm2table.com>',
      to: email,
      subject: `Order Confirmation - ${orderData.orderNumber}`,
      html: generateOrderEmailHTML(orderData),
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to send email',
          details: error.message
        },
        { status: 500 }
      );
    }

    console.log('✅ Email sent successfully via Resend:', data);
    return NextResponse.json({ 
      success: true, 
      message: 'Order confirmation email sent successfully',
      orderNumber: orderData.orderNumber,
      emailId: data?.id
    });

  } catch (error) {
    console.error('❌ API Error sending order confirmation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}