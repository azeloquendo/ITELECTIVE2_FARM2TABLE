// Help Center related constants

import { FAQ, FAQCategory, IssueType } from '../../interface/seller/helpCenter';

export const FAQ_DATA: FAQ[] = [
  {
    id: "1",
    question: "How do I add new products to my farm?",
    answer: "Go to Products > Add New Product. Fill in product details, upload images, set pricing, and inventory. Make sure to categorize correctly for better visibility.",
    category: "products",
    icon: "📦"
  },
  {
    id: "2",
    question: "How are payments processed for my sales?",
    answer: "Payments are processed securely and transferred to your registered account every Friday. You can view your earnings and payment history in the Dashboard > Revenue section.",
    category: "payments",
    icon: "💰"
  },
  {
    id: "3",
    question: "What are the delivery requirements and timelines?",
    answer: "Orders should be prepared within 24 hours. Delivery partners will collect from your farm between 7-9 AM. Ensure products are properly packaged and labeled.",
    category: "delivery",
    icon: "🚚"
  },
  {
    id: "4",
    question: "How do I update my farm profile and information?",
    answer: "Navigate to Your Feed > Edit Mode to update farm details, description, gallery images, and farmer profiles. Changes are reflected immediately.",
    category: "profile",
    icon: "🏪"
  },
  {
    id: "5",
    question: "What are the commission rates and fees?",
    answer: "We charge a 15% commission on all sales. This includes platform maintenance, payment processing, and delivery coordination. No hidden fees.",
    category: "fees",
    icon: "📊"
  },
  {
    id: "6",
    question: "How do I handle customer returns or complaints?",
    answer: "Contact support immediately for quality issues. For valid complaints, we facilitate refunds and you'll be notified. Maintain quality standards to minimize returns.",
    category: "support",
    icon: "🔄"
  },
  {
    id: "7",
    question: "Can I offer discounts or run promotions?",
    answer: "Yes! Go to Products > select product > Edit > set promotional pricing. You can also create bundle deals and seasonal offers to attract more customers.",
    category: "marketing",
    icon: "🎯"
  },
  {
    id: "8",
    question: "How do I track my order performance and analytics?",
    answer: "Visit Dashboard > Top Selling for product performance. You can view sales trends, customer ratings, and inventory turnover rates.",
    category: "analytics",
    icon: "📈"
  }
];

export const FAQ_CATEGORIES: FAQCategory[] = [
  { id: "all", label: "All Questions", icon: "📚" },
  { id: "products", label: "Products", icon: "📦" },
  { id: "payments", label: "Payments", icon: "💰" },
  { id: "delivery", label: "Delivery", icon: "🚚" },
  { id: "profile", label: "Profile", icon: "🏪" },
  { id: "fees", label: "Fees & Commission", icon: "📊" }
];

export const ISSUE_TYPES: IssueType[] = [
  { value: "technical", label: "Technical Issue" },
  { value: "account", label: "Account Management" },
  { value: "payment", label: "Payment Issue" },
  { value: "products", label: "Product Listing" },
  { value: "general", label: "General Inquiry" }
];

export const INITIAL_CHAT_MESSAGE = {
  id: "1",
  text: "Hello! I'm FarmAssist, your dedicated seller support assistant. How can I help you with your farm operations today?",
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
  for: "For Seller Issues"
};

