// utils/lib/emailTemplates.ts
export const orderConfirmationTemplate = (orderData: any, buyerInfo: any) => {
  const orderItems = orderData.products?.map((item: any) => 
    `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity} ${item.unit}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₱${(item.unitPrice * item.quantity).toFixed(2)}</td>
    </tr>`
  ).join('') || '';

  const deliveryInfo = orderData.deliveryMethod === 'Delivery' 
    ? `
      <p><strong>Delivery Address:</strong><br>${orderData.deliveryAddress}</p>
      <p><strong>Delivery Time:</strong> ${orderData.deliveryTime}</p>
      <p><strong>Delivery Date:</strong> ${orderData.deliveryDate}</p>
    `
    : `
      <p><strong>Pickup Location:</strong><br>${orderData.pickupLocation}</p>
      <p><strong>Pickup Time:</strong> ${orderData.deliveryTime}</p>
    `;

  return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px; }
        .order-card { background: #f8fafc; border-radius: 12px; padding: 25px; margin: 20px 0; border-left: 4px solid #10b981; }
        .order-number { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 10px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th { background: #f1f5f9; padding: 12px; text-align: left; font-weight: 600; }
        .total-section { background: #ecfdf5; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .footer { background: #f8fafc; padding: 25px; text-align: center; color: #64748b; font-size: 14px; }
        .status-badge { background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; font-weight: 600; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎉 Order Confirmed!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for choosing Farm2Table</p>
        </div>
        
        <div class="content">
            <h2 style="color: #1f2937; margin-bottom: 10px;">Hello ${buyerInfo.name},</h2>
            <p style="font-size: 16px; color: #4b5563;">Your order has been successfully placed and is being processed. Here's your order summary:</p>
            
            <div class="order-card">
                <div class="order-number">${orderData.orderNumber}</div>
                <div class="status-badge">🔄 Order Processing</div>
                
                <div style="margin-top: 20px;">
                    <h3 style="color: #374151; margin-bottom: 15px;">📦 Order Details</h3>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th style="text-align: left;">Item</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orderItems}
                        </tbody>
                    </table>
                </div>
                
                <div class="total-section">
                    <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
                        <span>Total Amount:</span>
                        <span>₱${orderData.totalPrice?.toFixed(2) || '0.00'}</span>
                    </div>
                    <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
                        Payment Method: ${orderData.paymentMethod}<br>
                        ${orderData.paymentStatus === 'cash_on_delivery' ? '💵 Pay when you receive your order' : '✅ Payment processed'}
                    </p>
                </div>
            </div>
            
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151; margin-bottom: 15px;">🚚 Delivery Information</h3>
                ${deliveryInfo}
                <p><strong>Contact:</strong> ${orderData.contact}</p>
            </div>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #92400e; margin-bottom: 10px;">📞 Next Steps</h3>
                <p style="margin: 5px 0; color: #92400e;">
                    • We'll notify you when your order is out for delivery<br>
                    • Keep your phone nearby for delivery updates<br>
                    • Contact support if you have any questions
                </p>
            </div>
            
            <p style="font-size: 16px; color: #4b5563;">
                We're working with our local farm partners to prepare your fresh produce. 
                You'll receive another email when your order is on its way!
            </p>
        </div>
        
        <div class="footer">
            <p style="margin: 0 0 10px 0;">
                <strong>Farm2Table</strong><br>
                Fresh produce delivered to your doorstep 🍅🌽
            </p>
            <p style="margin: 0; font-size: 12px;">
                Need help? Contact us at support@farm2table.com or call (02) 1234-5678
            </p>
        </div>
    </div>
</body>
</html>
  `;
};

export const sellerOrderNotificationTemplate = (orderData: any, sellerInfo: any) => {
  const sellerItems = orderData.sellers?.find((seller: any) => seller.sellerId === sellerInfo.sellerId)?.items || [];

  const itemsList = sellerItems.map((item: any) => 
    `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity} ${item.unit}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₱${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
  ).join('');

  return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #3b82f6; color: white; padding: 25px; text-align: center; }
        .content { padding: 25px; }
        .order-card { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 15px 0; }
    </style>
</head>
<body>
    <div style="max-width: 600px; margin: 0 auto; background: white;">
        <div class="header">
            <h1 style="margin: 0;">🛍️ New Order Received!</h1>
            <p style="margin: 10px 0 0 0;">You have a new order on Farm2Table</p>
        </div>
        
        <div class="content">
            <h2 style="color: #1f2937;">Hello ${sellerInfo.sellerName},</h2>
            <p>You have received a new order from ${orderData.buyerName}.</p>
            
            <div class="order-card">
                <h3 style="color: #374151; margin-bottom: 15px;">Order Details</h3>
                <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                <p><strong>Buyer:</strong> ${orderData.buyerName}</p>
                <p><strong>Contact:</strong> ${orderData.contact}</p>
                <p><strong>Delivery Address:</strong> ${orderData.deliveryAddress}</p>
                <p><strong>Delivery Time:</strong> ${orderData.deliveryTime}</p>
                
                <h4 style="margin: 20px 0 10px 0;">Items to Prepare:</h4>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="text-align: left; padding: 8px; background: #f1f5f9;">Item</th>
                            <th style="text-align: center; padding: 8px; background: #f1f5f9;">Qty</th>
                            <th style="text-align: right; padding: 8px; background: #f1f5f9;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsList}
                    </tbody>
                </table>
                
                <div style="background: #dbeafe; padding: 15px; border-radius: 6px; margin-top: 15px;">
                    <p style="margin: 0; font-weight: bold;">
                        Your Earnings: ₱${sellerItems.reduce((total: number, item: any) => total + (item.price * item.quantity), 0).toFixed(2)}
                    </p>
                </div>
            </div>
            
            <p>Please prepare the items for delivery according to the scheduled time.</p>
            <p><strong>Login to your seller dashboard for complete order details and to update order status.</strong></p>
        </div>
    </div>
</body>
</html>
  `;
};