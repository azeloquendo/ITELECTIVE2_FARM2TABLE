"use client";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import { submitSupportTicket } from "@/api/third-party/helpService";
import { getFAQs } from "@/api/third-party/faqService";
import { ChevronDown, ChevronUp, Search, Send, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./helpCenter.module.css";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon: string;
}

interface ContactForm {
  name: string;
  email: string;
  orderId?: string;
  issueType: "delivery" | "quality" | "missing" | "payment" | "general";
  subject: string;
  message: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "bot" | "user";
  timestamp: Date;
}

export default function HelpCenterPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: "",
    email: "",
    orderId: "",
    issueType: "general",
    subject: "",
    message: ""
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "Hi! I'm Unis, your Farm2Table assistant. How can I help you with your fresh food delivery today?",
      sender: "bot",
      timestamp: new Date()
    }
  ]);
  const [userMessage, setUserMessage] = useState("");
  const [isIssueTypeOpen, setIsIssueTypeOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const issueTypeRef = useRef<HTMLDivElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesContainerRef = useRef<HTMLDivElement>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  // Contact form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');

  // Default FAQs as fallback
  const defaultFaqs: FAQ[] = [
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

  const categories = [
    { id: "all", label: "All Questions", icon: "📚" },
    { id: "ordering", label: "Ordering", icon: "🛒" },
    { id: "payment", label: "Payments", icon: "💰" },
    { id: "delivery", label: "Delivery", icon: "🚚" },
    { id: "refunds", label: "Refunds & Returns", icon: "🔄" },
    { id: "farms", label: "Local Farms", icon: "🌾" }
  ];

  const issueTypes = [
    { value: "delivery", label: "Delivery Delay/Issue" },
    { value: "quality", label: "Quality/Freshness Concern" },
    { value: "missing", label: "Missing Items" },
    { value: "payment", label: "Payment/Refund" },
    { value: "general", label: "General Inquiry" }
  ];

  // Fetch FAQs
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoadingFaqs(true);
        const data = await getFAQs();
        setFaqs(data);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        setFaqs(defaultFaqs);
      } finally {
        setLoadingFaqs(false);
      }
    };

    fetchFaqs();
  }, []);

  // Fixed auto-scroll - only scroll when needed and prevent page scroll
  useEffect(() => {
    if (shouldScrollToBottom && chatMessagesEndRef.current) {
      // Use a more controlled approach that only affects the chat container
      const chatContainer = chatMessagesContainerRef.current;
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [chatMessages, isTyping, shouldScrollToBottom]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (issueTypeRef.current && !issueTypeRef.current.contains(event.target as Node)) {
        setIsIssueTypeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle chat scroll to detect user manual scrolling
  const handleChatScroll = () => {
    if (chatMessagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatMessagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      setShouldScrollToBottom(isNearBottom);
    }
  };

  // Filter FAQs based on search and category
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Suggested FAQs based on search (top 3 matches)
  const suggestedFaqs = searchTerm ? 
    faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 3) : [];

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  // Contact form submission using helpService
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSubmitSuccess(false);
    
    try {
      const result = await submitSupportTicket({
        name: contactForm.name,
        email: contactForm.email,
        orderId: contactForm.orderId || undefined,
        issueType: contactForm.issueType,
        subject: contactForm.subject,
        message: contactForm.message
      });

      if (result.success) {
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 5000);
        setContactForm({
          name: "",
          email: "",
          orderId: "",
          issueType: "general",
          subject: "",
          message: ""
        });
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleIssueTypeSelect = (value: "delivery" | "quality" | "missing" | "payment" | "general") => {
    setContactForm(prev => ({
      ...prev,
      issueType: value
    }));
    setIsIssueTypeOpen(false);
  };

  const getSelectedIssueTypeLabel = () => {
    return issueTypes.find(opt => opt.value === contactForm.issueType)?.label || "General Inquiry";
  };

  // Enhanced chat with typing indicator
  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;

    // Enable scrolling for new messages
    setShouldScrollToBottom(true);

    // Add user message
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      text: userMessage,
      sender: "user",
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newUserMessage]);
    const currentMessage = userMessage;
    setUserMessage("");
    setIsTyping(true);

    try {
      // Use chatService directly instead of API route
      const { processChatMessage } = await import('@/api/third-party/chatService');
      
      // Simulate typing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Process message using chat service
      const chatResponse = processChatMessage(currentMessage, chatMessages.map(m => ({
        text: m.text,
        sender: m.sender
      })));

      const botResponseText = chatResponse.response || "I understand you're looking for help. Let me connect you with our support team who can assist you with this specific issue. They'll be with you shortly!";

      // Add bot response
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: "bot",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botResponse]);

    } catch (error) {
      console.error('Error sending chat message:', error);
      
      // Fallback response if API fails
      const fallbackResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I understand you're looking for help. Let me connect you with our support team who can assist you with this specific issue. They'll be with you shortly!",
        sender: "bot",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Help Center</h1>
        <p className={styles.subtitle}>
          Get instant help with your fresh food delivery experience
        </p>
      </div>

      {/* Search Section */}
      <div className={styles.searchSection}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Ask about delivery, freshness, orders, or farms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Suggested FAQs */}
        {searchTerm && suggestedFaqs.length > 0 && (
          <div className={styles.suggestedFaqs}>
            <h3 className={styles.suggestedTitle}>Quick Answers</h3>
            {suggestedFaqs.map(faq => (
              <button
                key={faq.id}
                className={styles.suggestedItem}
                onClick={() => {
                  setSearchTerm("");
                  setExpandedFaq(faq.id);
                  document.getElementById(`faq-${faq.id}`)?.scrollIntoView({
                    behavior: 'smooth'
                  });
                }}
              >
                <span className={styles.suggestedIcon}>{faq.icon}</span>
                <span className={styles.suggestedText}>{faq.question}</span>
                <ChevronDown size={16} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Support Info */}
      <div className={styles.highlightedSupport}>
        <div className={`${styles.supportFeature} ${styles.supportHours}`}>
          <div className={styles.supportContent}>
            <h3>Fast Support Hours</h3>
            <p>Monday - Saturday<br/>8:00 AM - 7:00 PM</p>
          </div>
        </div>
        <div className={`${styles.supportFeature} ${styles.responseTime}`}>
          <div className={styles.supportContent}>
            <h3>Quick Response Time</h3>
            <p>Within 1 Hour<br/>During Business Hours</p>
          </div>
        </div>
      </div>

      {/* Two Column Contact Options */}
      <div className={styles.contactGrid}>
        {/* Live Chat - Left Side */}
        <div className={styles.chatContainer}>
          <div className={styles.optionHeader}>
            <h3>Live Chat with Unis</h3>
            <p>Your Farm2Table assistant. Get instant help</p>
          </div>

          {/* Messenger-style Chat */}
          <div className={styles.chatWindow}>
            <div 
              ref={chatMessagesContainerRef}
              className={styles.chatMessages}
              onScroll={handleChatScroll}
            >
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`${styles.message} ${message.sender === 'bot' ? styles.botMessage : styles.userMessage}`}
                >
                  <div className={styles.messageContent}>
                    <div className={styles.messageText}>
                      {message.text}
                    </div>
                    <div className={styles.messageTime}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className={`${styles.message} ${styles.botMessage}`}>
                  <div className={styles.messageContent}>
                    <div className={styles.typingIndicator}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatMessagesEndRef} />
            </div>
            
            {/* Chat Input */}
            <div className={styles.chatInputContainer}>
              <input
                type="text"
                placeholder="Type your message..."
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className={styles.chatInput}
              />
              <button 
                onClick={handleSendMessage}
                className={styles.sendButton}
                disabled={!userMessage.trim() || isTyping}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Email Form - Right Side */}
        <div className={styles.formContainer}>
          <div className={styles.optionHeader}>
            <h3>Send Detailed Message</h3>
            <p>For complex issues or detailed explanations</p>
          </div>
          
          {submitSuccess && (
            <div className={styles.successMessage}>
              <Shield size={18} />
              <div>
                <strong>Message Received!</strong>
                <p>We'll respond within 12 hours. For urgent issues, use Live Chat.</p>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <form onSubmit={handleContactSubmit} className={styles.contactForm}>
            <div className={styles.formCompact}>
              {/* First Row: Name and Email */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Your Name *</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={styles.formInput}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email *</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={styles.formInput}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Second Row: Order ID and Issue Type */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Order ID (if applicable)</label>
                  <input
                    type="text"
                    placeholder="e.g., F2T-12345"
                    value={contactForm.orderId}
                    onChange={(e) => handleInputChange('orderId', e.target.value)}
                    className={styles.formInput}
                    disabled={isSubmitting}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Issue Type *</label>
                  {/* Custom Dropdown for Issue Type */}
                  <div className={styles.dropdownContainer} ref={issueTypeRef}>
                    <button 
                      type="button"
                      className={styles.dropdownButton}
                      onClick={() => setIsIssueTypeOpen(!isIssueTypeOpen)}
                      disabled={isSubmitting}
                    >
                      <span>{getSelectedIssueTypeLabel()}</span>
                      <span className={`${styles.arrow} ${isIssueTypeOpen ? styles.arrowUp : styles.arrowDown}`}></span>
                    </button>
                    
                    {isIssueTypeOpen && (
                      <div className={styles.dropdownList}>
                        {issueTypes.map(issueType => (
                          <button
                            key={issueType.value}
                            type="button"
                            className={`${styles.dropdownItem} ${contactForm.issueType === issueType.value ? styles.selected : ''}`}
                            onClick={() => handleIssueTypeSelect(issueType.value as any)}
                          >
                            <span>{issueType.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Single Column Fields */}
              <div className={styles.formGroup}>
                <label>Subject *</label>
                <input
                  type="text"
                  placeholder="Brief description of your issue"
                  value={contactForm.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className={styles.formInput}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Message *</label>
                <textarea
                  placeholder="Please describe your issue in detail. For freshness concerns, mention delivery time and product condition."
                  value={contactForm.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  className={styles.formTextarea}
                  rows={3}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner />
                    Sending Message...
                  </>
                ) : (
                  "Send Message"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <p className={styles.sectionSubtitle}>
            Everything about ordering, delivery, and our local farms
          </p>
        </div>

        {/* Category Filter */}
        <div className={styles.categoryFilter}>
          {categories.map(category => (
            <button
              key={category.id}
              className={`${styles.categoryButton} ${activeCategory === category.id ? styles.active : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              <span className={styles.categoryIcon}>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className={styles.faqList}>
          {loadingFaqs ? (
            <div className={styles.loadingState}>
              <LoadingSpinner />
              <p>Loading FAQs...</p>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No questions found matching your search.</p>
              <p className={styles.emptySubtext}>
                Try different keywords or browse all categories.
              </p>
            </div>
          ) : (
            filteredFaqs.map(faq => (
              <div key={faq.id} id={`faq-${faq.id}`} className={styles.faqItem}>
                <button
                  className={styles.faqQuestion}
                  onClick={() => toggleFaq(faq.id)}
                >
                  <span className={styles.faqIcon}>{faq.icon}</span>
                  <span className={styles.faqText}>{faq.question}</span>
                  {expandedFaq === faq.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {expandedFaq === faq.id && (
                  <div className={styles.faqAnswer}>
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}