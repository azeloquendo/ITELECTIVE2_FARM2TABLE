// FAQ service - returns static FAQ data
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon: string;
}

const faqs: FAQ[] = [
  {
    id: "1",
    question: "How do I place an order for fresh produce?",
    answer: "Browse our marketplace, select fresh products from local farms, add to cart, and proceed to checkout. You can choose delivery time slots and payment method. For recurring orders, set up a subscription in your profile.",
    category: "ordering",
    icon: "🛒"
  },
  {
    id: "2",
    question: "What payment methods do you accept?",
    answer: "We accept GCash, credit/debit cards, and Cash on Delivery (COD). All payments are processed securely. COD has a minimum order of ₱200.",
    category: "payment",
    icon: "💰"
  },
  {
    id: "3",
    question: "How do you ensure items stay fresh during transport?",
    answer: "We use insulated boxes with ice packs for temperature-sensitive items. Our delivery partners are trained in proper handling, and we maintain cold chain logistics for maximum freshness.",
    category: "delivery",
    icon: "🚚"
  },
  {
    id: "4",
    question: "What if my produce arrives damaged or spoiled?",
    answer: "Take photos of the damaged items and contact us within 2 hours of delivery. We'll arrange a replacement or refund immediately. Our freshness guarantee covers all quality issues.",
    category: "refunds",
    icon: "❄️"
  },
  {
    id: "5",
    question: "Which local farms do you partner with?",
    answer: "We work with 50+ certified local farms across the region. Each farm profile shows their certifications, growing practices, and location. You can filter products by farm in the marketplace.",
    category: "farms",
    icon: "🌾"
  },
  {
    id: "6",
    question: "Can I modify or cancel my order after checkout?",
    answer: "You can modify or cancel orders within 1 hour of placement from your 'My Purchases' section. After 1 hour, please contact support as your order may already be in preparation.",
    category: "ordering",
    icon: "🛒"
  },
  {
    id: "7",
    question: "What are your delivery hours?",
    answer: "Delivery hours: 7:00 AM - 9:00 PM daily. You can choose 2-hour delivery windows during checkout. Early morning slots (7-9 AM) are available for breakfast freshness.",
    category: "delivery",
    icon: "🚚"
  },
  {
    id: "8",
    question: "How do I manage my weekly produce subscription?",
    answer: "Go to 'Subscriptions' in your profile to pause, modify, or cancel your weekly box. Changes must be made 48 hours before your next delivery.",
    category: "account",
    icon: "👤"
  }
];

/**
 * Get all FAQs
 */
export const getFAQs = async (): Promise<FAQ[]> => {
  // Simulate async operation (in case we want to fetch from a source later)
  return Promise.resolve(faqs);
};

/**
 * Get FAQs by category
 */
export const getFAQsByCategory = async (category: string): Promise<FAQ[]> => {
  return Promise.resolve(faqs.filter(faq => faq.category === category));
};

/**
 * Search FAQs
 */
export const searchFAQs = async (query: string): Promise<FAQ[]> => {
  const lowerQuery = query.toLowerCase();
  return Promise.resolve(
    faqs.filter(
      faq =>
        faq.question.toLowerCase().includes(lowerQuery) ||
        faq.answer.toLowerCase().includes(lowerQuery)
    )
  );
};

