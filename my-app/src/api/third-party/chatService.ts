// Chat service - Rule-based chatbot for help center
// This replaces the /api/help/chat endpoint

interface ChatMessage {
  text: string;
  sender: 'bot' | 'user';
}

// Handle quick action button clicks
function handleButtonClick(buttonId: string): string {
  const buttonResponses: { [key: string]: string } = {
    // Payment & Ordering
    'button_payment_cod': "To use Cash on Delivery (COD):\n\n1. Add items to cart\n2. Proceed to checkout\n3. Select 'Cash on Delivery' as payment method\n4. Minimum order: ₱200\n5. Pay when your fresh items arrive! 💰\n\nCOD available for all Metro Manila areas.",
    
    'button_payment_gcash': "GCash payment:\n\n• Select GCash at checkout\n• You'll be redirected to GCash app\n• Confirm payment\n• Instant confirmation!\n• No minimum order amount\n\nGCash is our fastest payment method! 📱",
    
    'button_order_track': "Track your order:\n\n1. Go to 'My Purchases'\n2. Find your order\n3. See real-time delivery status\n4. Get 2-hour delivery window\n5. Receive SMS updates\n\nNeed help finding a specific order?",
    
    'button_order_modify': "Modify/cancel orders:\n\n✅ Within 1 hour: Self-service in 'My Purchases'\n❌ After 1 hour: Contact support\n📦 Subscriptions: Change 48 hours before delivery\n\nWhat would you like to modify?",
    
    // Delivery & Freshness
    'button_delivery_expedite': "Expedite delivery:\n\n🚚 Same-day delivery available for orders before 12PM\n⏰ Choose earlier 2-hour windows at checkout\n📞 Call (02) 1234-5678 for urgent requests\n• Additional fee may apply\n\nNeed urgent delivery?",
    
    'button_delivery_hours': "Delivery hours:\n\n🕐 7:00 AM - 9:00 PM daily\n⏱️ 2-hour delivery windows\n📦 Choose your preferred time at checkout\n🌆 Serving Metro Manila areas\n\nWhat's your delivery concern?",
    
    'button_freshness_guarantee': "Freshness guarantee:\n\n❄️ Report within 2 hours of delivery\n📸 Take photos of the items\n📧 Email to support@farm2table.com\n🔄 Immediate replacement/refund\n• Insulated boxes with ice packs\n\nHave quality concerns?",
    
    'button_freshness_photos': "For freshness issues:\n\n1. Take clear photos of damaged items\n2. Include delivery packaging\n3. Email to support@farm2table.com\n4. Mention your order ID\n5. We'll respond within 1 hour!\n\nYour satisfaction guaranteed! 📸",
    
    // Farms & Products
    'button_farms_local': "Our local farms:\n\n🌾 50+ certified partner farms\n📍 All within the region\n✅ Sustainable growing practices\n🔍 Filter by farm in marketplace\n📖 See farm profiles & certifications\n\nSupporting local agriculture!",
    
    'button_products_seasonal': "Seasonal products:\n\n🍓 Strawberries: Dec-Feb\n🥭 Mangoes: Mar-May\n🌽 Corn: Year-round\n🥬 Leafy greens: Year-round\n🛍️ Check marketplace for current availability\n\nWhat are you looking for?",
    
    // Support & Account
    'button_support_contact': "Contact support:\n\n📞 Phone: (02) 1234-5678\n📧 Email: support@farm2table.com\n🕐 Hours: Mon-Sat, 8AM-7PM\n🚚 Urgent delivery: Call directly\n💬 Live chat: Right here!\n\nHow can we help?",
    
    'button_account_subscription': "Manage subscriptions:\n\n📅 Go to 'Subscriptions' in profile\n⏰ Change 48 hours before delivery\n⏸️ Pause, modify, or cancel anytime\n📦 Weekly/Monthly options available\n\nNeed help with your subscription?",
    
    'button_faq_all': "Popular questions:\n\n• Delivery times & tracking\n• Payment methods & refunds\n• Freshness & quality concerns\n• Local farm information\n• Order modifications\n• Subscription management\n\nChoose a topic or ask your question! 📚"
  };
  
  return buttonResponses[buttonId] || "I'd love to help! What would you like to know about Farm2Table?";
}

// Enhanced rule-based responses
function getEnhancedFallback(userMessage: string, chatHistory: ChatMessage[] = []): string {
  if (!userMessage) {
    return "Hi! I'm Unis, your Farm2Table assistant. How can I help with your fresh food delivery today? 🍅";
  }

  const msg = userMessage.toLowerCase();
  const lastBotMessage = chatHistory.filter(m => m.sender === 'bot').pop()?.text || '';

  // Context-aware responses
  if (lastBotMessage.includes('delivery') && (msg.includes('yes') || msg.includes('check') || msg.includes('track'))) {
    return "Great! You can check your exact delivery window in 'My Purchases'. We'll also send you SMS updates on delivery day! 📱";
  }
  
  if (lastBotMessage.includes('freshness') && (msg.includes('photo') || msg.includes('picture'))) {
    return "Perfect! Please email photos to support@farm2table.com with your order ID. We'll process replacement within 24 hours! 📸";
  }

  // Smart keyword matching
  if (msg.includes('delivery') || msg.includes('arrive') || msg.includes('when')) {
    return "🚚 Delivery: 7:00 AM - 9:00 PM daily, 2-hour windows. Check your specific time in 'My Purchases'! Need tracking help or expedited delivery?";
  } else if (msg.includes('fresh') || msg.includes('quality') || msg.includes('spoiled')) {
    return "❄️ Freshness guarantee! Report within 2 hours with photos for immediate replacement/refund. What items need attention?";
  } else if (msg.includes('payment') || msg.includes('refund') || msg.includes('money')) {
    return "💰 Accept GCash, cards, COD (min ₱200). Refunds take 3-5 business days. Need help with a specific payment method?";
  } else if (msg.includes('order') || msg.includes('track') || msg.includes('status')) {
    return "📦 Track orders in 'My Purchases'. Modify/cancel within 1 hour. Need help finding or managing your order?";
  } else if (msg.includes('farm') || msg.includes('local') || msg.includes('partner')) {
    return "🌾 50+ certified local farms! Filter by farm in marketplace to see their practices and certifications.";
  } else if (msg.includes('hello') || msg.includes('hi') || msg.startsWith('hi')) {
    return "👋 Hello! I'm Unis, your Farm2Table assistant. I can help with delivery, orders, freshness, payments, or farm info!";
  } else if (msg.includes('thank')) {
    return "😊 You're welcome! Is there anything else I can help you with today?";
  } else if (msg.includes('contact') || msg.includes('support') || msg.includes('help')) {
    return "📞 Support: (02) 1234-5678 (Mon-Sat 8AM-7PM) • Email: support@farm2table.com • Live chat available!";
  } else if (msg.includes('subscription') || msg.includes('weekly')) {
    return "📅 Manage subscriptions in profile. Changes need 48 hours notice. Need to modify your weekly box?";
  } else {
    return "I understand you need assistance! I can help with delivery questions, order issues, freshness concerns, payment questions, or farm information. What would you like to know? 😊";
  }
}

/**
 * Process chat message and return response
 */
export const processChatMessage = (
  message: string,
  chatHistory: ChatMessage[] = []
): { response: string; showQuickActions: boolean } => {
  // Check if it's a button click (starts with "button_")
  if (message.startsWith('button_')) {
    const response = handleButtonClick(message);
    return {
      response,
      showQuickActions: false // Hide buttons after selection
    };
  }
  
  // Regular message - use smart rule-based system
  const response = getEnhancedFallback(message, chatHistory);
  
  // Show quick actions only for first message or when user says "help"
  const showQuickActions = chatHistory.length === 0 || 
                         message.toLowerCase().includes('help') ||
                         message.toLowerCase().includes('option');
  
  return {
    response,
    showQuickActions
  };
};

