 "use client"; 
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../utils/lib/firebase';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('loading');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent_id') || searchParams.get('payment_intent');
    
    if (paymentIntentId) {
      saveOrderToFirebase(paymentIntentId);
    } else {
      // If no payment intent but status is success (mock mode), still show success
      const statusParam = searchParams.get('status');
      if (statusParam === 'success') {
        setStatus('success');
        setOrderId('Mock Order');
      } else {
        setStatus('error');
      }
    }
  }, [searchParams]);

  // Auto-redirect to marketplace after 3 seconds when payment is successful
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        router.push('/buyer/marketplace');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  const saveOrderToFirebase = async (paymentIntentId) => {
    try {
      console.log('💾 Saving order to Firebase...');
      
      // 1. Get the pending order data from localStorage
      const pendingOrderData = localStorage.getItem('pendingOrder');
      const cartItems = localStorage.getItem('cartItems');
      
      if (!pendingOrderData) {
        console.error('❌ No pending order data found in localStorage');
        setStatus('error');
        return;
      }

      const orderData = JSON.parse(pendingOrderData);
      const items = cartItems ? JSON.parse(cartItems) : [];

      console.log('📦 Order data:', orderData);
      console.log('🛒 Cart items:', items);

      // 2. Prepare complete order data for Firebase
      const completeOrderData = {
        // Original order data
        ...orderData,
        
        // Add items from cart
        items: items,
        
        // Payment information
        paymentStatus: 'paid',
        paymentIntentId: paymentIntentId,
        paymentMethod: 'test_mode', // Since we're in test mode
        status: 'confirmed',
        
        // Timestamps
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Test mode flag
        isTestOrder: true,
        
        // Generate order number if not exists
        orderNumber: orderData.orderNumber || `TEST-${Date.now()}`
      };

      // 3. Generate a unique order ID for Firebase
      const finalOrderId = orderData.id || `test_order_${Date.now()}`;
      setOrderId(finalOrderId);
      
      // 4. Save to Firebase
      const orderRef = doc(db, 'orders', finalOrderId);
      await setDoc(orderRef, completeOrderData);
      
      console.log('✅ Order saved to Firebase with ID:', finalOrderId);
      console.log('📊 Order details:', completeOrderData);

      // 5. Clear local storage
      localStorage.removeItem('pendingOrder');
      localStorage.removeItem('cartItems');
      localStorage.removeItem('paymentIntentId');
      
      setStatus('success');

    } catch (error) {
      console.error('❌ Error saving order to Firebase:', error);
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Saving Your Order...</h2>
        <p>Please wait while we confirm and save your order details.</p>
        <div style={{ marginTop: '20px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #10b981', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
        <h2>Order Processing Issue</h2>
        <p>There was an issue saving your order. The payment was successful but we couldn't save the order details.</p>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
          Please contact support with your payment ID: {searchParams.get('payment_intent_id')}
        </p>
        <div style={{ marginTop: '20px' }}>
          <Link 
            href="/"
            style={{ 
              background: '#10b981', 
              color: 'white', 
              padding: '12px 24px', 
              borderRadius: '8px',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎉</div>
      <h2>Payment Successful!</h2>
      <p>Your test order has been confirmed and saved to the database.</p>
      
      <div style={{ 
        background: '#f0fdf4', 
        padding: '15px', 
        borderRadius: '8px', 
        margin: '20px auto',
        maxWidth: '400px',
        border: '1px solid #bbf7d0'
      }}>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>
          <strong>Order ID:</strong> {orderId}
        </p>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>
          <strong>Payment ID:</strong> {searchParams.get('payment_intent_id')}
        </p>
        <p style={{ margin: '5px 0', fontSize: '12px', color: '#059669' }}>
          ✓ Test Mode Order - Saved to Firebase
        </p>
      </div>

      <p>You can now view your order in the purchases section.</p>
      <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
        Redirecting to marketplace in 3 seconds...
      </p>

      <div style={{ marginTop: '30px' }}>
        <Link 
          href="/buyer/profile/my-purchases"
          style={{ 
            background: '#10b981', 
            color: 'white', 
            padding: '12px 24px', 
            borderRadius: '8px',
            textDecoration: 'none',
            display: 'inline-block',
            marginRight: '10px',
            fontWeight: '500'
          }}
        >
          View My Orders
        </Link>

        <Link 
          href="/buyer/marketplace"
          style={{ 
            border: '1px solid #10b981', 
            color: '#10b981', 
            padding: '12px 24px', 
            borderRadius: '8px',
            textDecoration: 'none',
            display: 'inline-block',
            fontWeight: '500'
          }}
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}