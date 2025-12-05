// Buyer Help Center related type definitions

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon: string;
}

export interface ContactForm {
  name: string;
  email: string;
  orderId?: string;
  issueType: "delivery" | "quality" | "missing" | "payment" | "general";
  subject: string;
  message: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: "bot" | "user";
  timestamp: Date;
}

export interface FAQCategory {
  id: string;
  label: string;
  icon: string;
}

export interface IssueType {
  value: "delivery" | "quality" | "missing" | "payment" | "general";
  label: string;
}

