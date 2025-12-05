// Buyer Help Center related constants

import { FAQ, FAQCategory, IssueType } from '../../interface/buyer/helpCenter';

export const FAQ_DATA: FAQ[] = [
  {
    id: "1",
    question: "How do I place an order?",
    answer: "Browse products in the Marketplace, add items to your cart, and proceed to checkout. You can filter by category, location, and price. Make sure to check minimum order quantities.",
    category: "ordering",
    icon: "🛒"
  },
  {
    id: "2",
    question: "What are the delivery options and fees?",
    answer: "Delivery fees vary by location and order size. You'll see the exact delivery fee at checkout. Standard delivery is 1-3 business days. Express delivery options may be available.",
    category: "delivery",
    icon: "🚚"
  },
  {
    id: "3",
    question: "How do I track my order?",
    answer: "Go to My Purchases to view all your orders. Click on any order to see real-time tracking information, delivery status, and estimated arrival time.",
    category: "tracking",
    icon: "📍"
  },
  {
    id: "4",
    question: "What if I receive damaged or incorrect items?",
    answer: "Contact us immediately through Help Center with your order ID. We'll process a refund or replacement within 24 hours for quality issues. Take photos if possible.",
    category: "quality",
    icon: "⚠️"
  },
  {
    id: "5",
    question: "How do I cancel or modify my order?",
    answer: "You can cancel orders within 1 hour of placement from My Purchases. After that, contact support. Modifications depend on order status - contact us for assistance.",
    category: "orders",
    icon: "✏️"
  },
  {
    id: "6",
    question: "What payment methods are accepted?",
    answer: "We accept cash on delivery, credit/debit cards, and digital wallets. Payment is processed securely. COD is available for most areas.",
    category: "payment",
    icon: "💳"
  },
  {
    id: "7",
    question: "How do I save products for later?",
    answer: "Click the heart icon on any product to save it. View all saved items in Profile > Saved Items. You can organize by products or farms.",
    category: "saving",
    icon: "❤️"
  },
  {
    id: "8",
    question: "How do I contact a seller directly?",
    answer: "Go to the seller's farm profile and click 'Message' to start a conversation. You can also message from your order details page.",
    category: "communication",
    icon: "💬"
  }
];

export const FAQ_CATEGORIES: FAQCategory[] = [
  { id: "all", label: "All Questions", icon: "📚" },
  { id: "ordering", label: "Ordering", icon: "🛒" },
  { id: "delivery", label: "Delivery", icon: "🚚" },
  { id: "tracking", label: "Tracking", icon: "📍" },
  { id: "quality", label: "Quality Issues", icon: "⚠️" },
  { id: "payment", label: "Payment", icon: "💳" }
];

export const ISSUE_TYPES: IssueType[] = [
  { value: "delivery", label: "Delivery Issue" },
  { value: "quality", label: "Quality Problem" },
  { value: "missing", label: "Missing Items" },
  { value: "payment", label: "Payment Issue" },
  { value: "general", label: "General Inquiry" }
];

export const INITIAL_CHAT_MESSAGE = {
  id: "1",
  text: "Hi! I'm Unis, your Farm2Table assistant. How can I help you with your fresh food delivery today?",
  sender: "bot" as const,
  timestamp: new Date()
};

export const SUPPORT_HOURS = {
  days: "Monday - Saturday",
  time: "7:00 AM - 8:00 PM"
};

export const RESPONSE_TIME = {
  priority: "Priority Response",
  time: "Within 30 Minutes",
  for: "For Buyer Issues"
};

