"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent_id');
    
    if (paymentIntentId) {
      // Payment was successful
      setStatus('success');
      
      // Clear any pending order data from localStorage
      localStorage.removeItem('pendingOrder');
      localStorage.removeItem('paymentIntentId');
      
      console.log('✅ Payment successful, intent ID:', paymentIntentId);
    } else {
      setStatus('error');
    }
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Processing your payment...</h2>
        <p>Please wait while we confirm your payment.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Payment Issue</h2>
        <p>There was an issue processing your payment. Please try again.</p>
        <Link href="/" style={{ color: '#10b981', textDecoration: 'underline' }}>
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎉</div>
      <h2>Payment Successful!</h2>
      <p>Your order has been confirmed and payment was successful.</p>
      <p>You will receive an order confirmation shortly.</p>
      <div style={{ marginTop: '30px' }}>
        <Link 
          href="/orders" 
          style={{ 
            background: '#10b981', 
            color: 'white', 
            padding: '12px 24px', 
            borderRadius: '8px',
            textDecoration: 'none',
            display: 'inline-block',
            marginRight: '10px'
          }}
        >
          View Orders
        </Link>
        <Link 
          href="/" 
          style={{ 
            border: '1px solid #10b981', 
            color: '#10b981', 
            padding: '12px 24px', 
            borderRadius: '8px',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}