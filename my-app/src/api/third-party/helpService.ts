// Help service using Firebase Client SDK and Resend API
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../utils/lib/firebase';

const RESEND_API_KEY = process.env.NEXT_PUBLIC_RESEND_API_KEY;

interface SupportTicketData {
  name: string;
  email: string;
  orderId?: string;
  issueType: string;
  subject: string;
  message: string;
}

/**
 * Submit support ticket
 */
export const submitSupportTicket = async (ticketData: SupportTicketData): Promise<{
  success: boolean;
  message: string;
  ticketId?: string;
  timestamp?: string;
}> => {
  try {
    const { name, email, orderId, issueType, subject, message } = ticketData;
    
    const timestamp = new Date().toLocaleString('en-PH', {
      timeZone: 'Asia/Manila'
    });
    const ticketId = 'TKT-' + Date.now();

    // 1. Save to Firebase
    const supportTicketData = {
      ticketId: ticketId,
      name: name,
      email: email,
      orderId: orderId || null,
      issueType: issueType,
      subject: subject,
      message: message,
      status: 'new',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      timestamp: timestamp
    };

    await setDoc(doc(db, 'supportTickets', ticketId), supportTicketData);
    console.log('✅ Saved to Firebase:', ticketId);

    // 2. Send emails via Resend (if API key is configured)
    if (RESEND_API_KEY) {
      try {
        // Send to admin
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Farm2Table <onboarding@resend.dev>',
            to: ['farm2table.pushpop@gmail.com'],
            subject: `🎯 NEW SUPPORT: ${subject}`,
            html: generateSupportAdminEmailHTML(ticketId, timestamp, name, email, orderId, issueType, subject, message),
          }),
        });

        // Auto-reply to customer
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Farm2Table Support <onboarding@resend.dev>',
            to: [email],
            subject: 'We Received Your Support Request - Farm2Table',
            html: generateSupportCustomerEmailHTML(ticketId, timestamp, name, email, orderId, issueType, subject),
          }),
        });

        console.log('📧 Emails sent successfully!');
      } catch (emailError) {
        console.warn('⚠️ Failed to send emails, but ticket was saved:', emailError);
      }
    } else {
      console.warn('⚠️ RESEND_API_KEY not configured, skipping email sending');
    }

    return {
      success: true,
      message: 'Support request received successfully! We have sent you a confirmation email.',
      ticketId: ticketId,
      timestamp: timestamp
    };
    
  } catch (error) {
    console.error('❌ Error submitting support ticket:', error);
    throw error instanceof Error ? error : new Error('Failed to submit support ticket');
  }
};

// Email template functions
const generateSupportAdminEmailHTML = (
  ticketId: string,
  timestamp: string,
  name: string,
  email: string,
  orderId: string | undefined,
  issueType: string,
  subject: string,
  message: string
) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1A4D2E 0%, #2e7d32 100%); padding: 20px; color: white;">
        <h1 style="margin: 0; font-size: 24px;">🏪 Farm2Table Support</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">New Customer Request</p>
      </div>
      <div style="padding: 25px;">
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #1A4D2E; margin-top: 0;">📋 Request Details</h3>
          <table style="width: 100%;">
            <tr><td style="padding: 5px 0;"><strong>Ticket ID:</strong></td><td style="padding: 5px 0;">${ticketId}</td></tr>
            <tr><td style="padding: 5px 0;"><strong>Submitted:</strong></td><td style="padding: 5px 0;">${timestamp}</td></tr>
            <tr><td style="padding: 5px 0;"><strong>Customer:</strong></td><td style="padding: 5px 0;">${name}</td></tr>
            <tr><td style="padding: 5px 0;"><strong>Email:</strong></td><td style="padding: 5px 0;">${email}</td></tr>
            <tr><td style="padding: 5px 0;"><strong>Order ID:</strong></td><td style="padding: 5px 0;">${orderId || 'Not provided'}</td></tr>
            <tr><td style="padding: 5px 0;"><strong>Issue Type:</strong></td><td style="padding: 5px 0;">${issueType}</td></tr>
          </table>
        </div>
        <div style="margin-bottom: 20px;">
          <h3 style="color: #1A4D2E;">📝 Subject</h3>
          <p style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #1A4D2E;">${subject}</p>
        </div>
        <div>
          <h3 style="color: #1A4D2E;">💬 Message</h3>
          <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0; white-space: pre-wrap;">${message}</div>
        </div>
      </div>
      <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e0e0e0;">
        🏪 Farm2Table - Fresh Food Delivery | This is an automated message
      </div>
    </div>
  `;
};

const generateSupportCustomerEmailHTML = (
  ticketId: string,
  timestamp: string,
  name: string,
  email: string,
  orderId: string | undefined,
  issueType: string,
  subject: string
) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1A4D2E 0%, #2e7d32 100%); padding: 25px; color: white; text-align: center;">
        <h1 style="margin: 0 0 10px 0; font-size: 28px;">✅ Request Received!</h1>
        <p style="margin: 0; opacity: 0.9; font-size: 16px;">Thank you for contacting Farm2Table Support</p>
      </div>
      <div style="padding: 30px;">
        <p>Hello <strong>${name}</strong>,</p>
        <p>We've successfully received your support request and our team will review it shortly.</p>
        <div style="background: #f0f7f0; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #1A4D2E;">
          <h3 style="color: #1A4D2E; margin-top: 0;">📋 Your Request Details</h3>
          <p><strong>Reference Number:</strong> ${ticketId}</p>
          <p><strong>Issue Type:</strong> ${issueType}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          ${orderId ? `<p><strong>Order ID:</strong> ${orderId}</p>` : ''}
          <p><strong>Submitted:</strong> ${timestamp}</p>
        </div>
        <div style="background: #fff8e1; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffa000;">
          <h3 style="color: #ffa000; margin-top: 0;">⏱️ What Happens Next?</h3>
          <ul style="margin-bottom: 0;">
            <li>Our support team will review your request</li>
            <li>You'll receive a response within <strong>12 hours</strong></li>
            <li>For urgent delivery issues, reply to this email</li>
          </ul>
        </div>
        <p>We appreciate your patience and look forward to assisting you!</p>
      </div>
      <div style="background: #1A4D2E; padding: 20px; color: white; text-align: center;">
        <h3 style="margin: 0 0 10px 0;">🏪 Farm2Table</h3>
        <p style="margin: 5px 0; opacity: 0.8;">Fresh Food Delivery Service</p>
        <p style="margin: 5px 0; font-size: 12px; opacity: 0.7;">
          Email: support@farm2table.com | Phone: (02) 1234-5678
        </p>
      </div>
    </div>
  `;
};

