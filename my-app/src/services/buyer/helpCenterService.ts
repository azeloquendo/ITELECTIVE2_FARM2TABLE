// Buyer Help Center related service functions
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ContactForm } from '../../interface/buyer/helpCenter';
import { db } from '../../utils/lib/firebase';

const ISSUE_TYPE_MAP = {
  delivery: "Delivery Issue",
  quality: "Quality Problem",
  missing: "Missing Items",
  payment: "Payment Issue",
  general: "General Inquiry"
};

export const submitSupportTicket = async (
  contactForm: ContactForm,
  userId: string
): Promise<string> => {
  try {
    // Generate report ID
    const reportId = `REP-${Date.now().toString().slice(-6)}`;
    
    // Create support ticket
    const ticketData = {
      userName: contactForm.name,
      userEmail: contactForm.email,
      orderId: contactForm.orderId || "Not provided",
      issueType: ISSUE_TYPE_MAP[contactForm.issueType],
      subject: contactForm.subject,
      message: contactForm.message,
      status: "unread",
      createdAt: serverTimestamp(),
      userType: "buyer",
      userId: userId || "unknown",
      reportId: reportId
    };

    // Save to supportTickets collection
    const docRef = await addDoc(collection(db, "supportTickets"), ticketData);
    
    console.log("✅ Buyer support ticket saved to database:", ticketData);
    
    return docRef.id;
  } catch (error: any) {
    console.error("❌ Error submitting support ticket:", error);
    throw new Error(`Failed to submit support ticket: ${error.message}`);
  }
};

