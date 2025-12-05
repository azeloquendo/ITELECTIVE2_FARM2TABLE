// Help Center related service functions
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ContactForm } from '../../interface/seller/helpCenter';
import { db } from '../../utils/lib/firebase';

const ISSUE_TYPE_MAP = {
  technical: "Technical Issue",
  account: "Account Problem", 
  payment: "Payment Issue",
  products: "Product Issue",
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
      farmId: contactForm.farmId || "Not provided",
      issueType: ISSUE_TYPE_MAP[contactForm.issueType],
      subject: contactForm.subject,
      message: contactForm.message,
      status: "unread",
      createdAt: serverTimestamp(),
      userType: "seller",
      userId: userId || "unknown",
      reportId: reportId
    };

    // Save to supportTickets collection
    const docRef = await addDoc(collection(db, "supportTickets"), ticketData);
    
    console.log("✅ Seller support ticket saved to database:", ticketData);
    
    return docRef.id;
  } catch (error: any) {
    console.error("❌ Error submitting support ticket:", error);
    throw new Error(`Failed to submit support ticket: ${error.message}`);
  }
};

