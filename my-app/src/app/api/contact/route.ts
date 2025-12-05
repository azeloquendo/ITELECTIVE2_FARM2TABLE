import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../utils/lib/firebase';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, message, type, source } = body;
    
    const timestamp = new Date().toLocaleString('en-PH', {
      timeZone: 'Asia/Manila'
    });
    const ticketId = 'LND-' + Date.now();

    // 1. Save to Firebase
    const contactFormData = {
      ticketId: ticketId,
      name: name,
      email: email,
      message: message,
      type: type || 'landing_page_contact',
      source: source || 'landing_page',
      status: 'new',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      timestamp: timestamp
    };

    // Save to Firestore
    await setDoc(doc(db, 'landingPageContacts', ticketId), contactFormData);
    console.log('✅ Saved landing page contact to Firebase:', ticketId);

    // 2. Send email to admin
    const adminEmail = await resend.emails.send({
      from: 'Farm2Table <onboarding@resend.dev>',
      to: ['farm2table.pushpop@gmail.com'],
      subject: `🌱 NEW LANDING PAGE: Contact Form Submission`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1A4D2E 0%, #2e7d32 100%); padding: 20px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">🌱 Farm2Table Landing Page</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">New Contact Form Submission</p>
          </div>
          
          <div style="padding: 25px;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1A4D2E; margin-top: 0;">📋 Contact Details</h3>
              <table style="width: 100%;">
                <tr><td style="padding: 5px 0;"><strong>Reference ID:</strong></td><td style="padding: 5px 0;">${ticketId}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Submitted:</strong></td><td style="padding: 5px 0;">${timestamp}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Name:</strong></td><td style="padding: 5px 0;">${name}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Email:</strong></td><td style="padding: 5px 0;">${email}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Source:</strong></td><td style="padding: 5px 0;">${source || 'Landing Page'}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Type:</strong></td><td style="padding: 5px 0;">${type || 'General Inquiry'}</td></tr>
              </table>
            </div>

            <div>
              <h3 style="color: #1A4D2E;">💬 Message</h3>
              <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0; white-space: pre-wrap;">${message}</div>
            </div>
          </div>

          <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e0e0e0;">
            🌱 Farm2Table - Fresh Food Delivery | Landing Page Contact
          </div>
        </div>
      `,
    });

    // 3. Auto-reply to customer
    const customerEmail = await resend.emails.send({
      from: 'Farm2Table <onboarding@resend.dev>',
      to: [email],
      subject: 'Thank You for Contacting Farm2Table!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1A4D2E 0%, #2e7d32 100%); padding: 25px; color: white; text-align: center;">
            <h1 style="margin: 0 0 10px 0; font-size: 28px;">🌱 Thank You!</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 16px;">We've received your message</p>
          </div>
          
          <div style="padding: 30px;">
            <p>Hello <strong>${name}</strong>,</p>
            
            <p>Thank you for reaching out to Farm2Table! We're excited to hear from you and will get back to you as soon as possible.</p>
            
            <div style="background: #f0f7f0; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #1A4D2E;">
              <h3 style="color: #1A4D2E; margin-top: 0;">📬 What's Next?</h3>
              <ul style="margin-bottom: 0;">
                <li>Our team will review your inquiry within <strong>24 hours</strong></li>
                <li>We'll contact you at: <strong>${email}</strong></li>
                <li>Reference ID: <strong>${ticketId}</strong></li>
              </ul>
            </div>

            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #1976d2;">
              <h3 style="color: #1976d2; margin-top: 0;">🚀 Ready to Start Shopping?</h3>
              <p>While you wait for our response, why not explore our fresh produce marketplace?</p>
              <a href="https://yourdomain.com/roleSelection" 
                 style="display: inline-block; background: #1A4D2E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
                 Browse Fresh Products
              </a>
            </div>

            <p>We look forward to helping you discover the freshest local produce!</p>
          </div>

          <div style="background: #1A4D2E; padding: 20px; color: white; text-align: center;">
            <h3 style="margin: 0 0 10px 0;">🏪 Farm2Table</h3>
            <p style="margin: 5px 0; opacity: 0.8;">From Local Farms to Your Table</p>
            <p style="margin: 5px 0; font-size: 12px; opacity: 0.7;">
              Fresh, Local, Sustainable
            </p>
          </div>
        </div>
      `,
    });

    console.log('📧 Landing page emails sent successfully!');

    return NextResponse.json({ 
      success: true, 
      message: 'Thank you for your message! We will get back to you within 24 hours.',
      ticketId: ticketId,
      timestamp: timestamp
    });
    
  } catch (error) {
    console.error('❌ Error in landing page contact:', error);
    
    // Fallback - log the data even if something fails
    console.log('📝 Landing page contact data (fallback):', {
      name, email, message, type, source
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send your message. Please try again later.' 
      },
      { status: 500 }
    );
  }
}