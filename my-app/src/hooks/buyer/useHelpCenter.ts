// Custom hook for managing buyer help center
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import { FAQ_DATA, INITIAL_CHAT_MESSAGE, ISSUE_TYPES } from '../../constants/buyer/helpCenter';
import { ChatMessage, ContactForm } from '../../interface/buyer/helpCenter';
import { submitSupportTicket } from '../../services/buyer/helpCenterService';
import { auth } from '../../utils/lib/firebase';

export const useHelpCenter = () => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([INITIAL_CHAT_MESSAGE]);
  const [userMessage, setUserMessage] = useState("");
  const [isIssueTypeOpen, setIsIssueTypeOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const issueTypeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setContactForm(prev => ({
          ...prev,
          name: user.displayName || prev.name,
          email: user.email || prev.email
        }));
      }
    });
    return () => unsubscribe();
  }, []);

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

  // Filter FAQs based on search and category
  const filteredFaqs = FAQ_DATA.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Suggested FAQs based on search (top 3 matches)
  const suggestedFaqs = searchTerm ? 
    FAQ_DATA.filter(faq => 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 3) : [];

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await submitSupportTicket(contactForm, currentUser?.uid || '');
      
      setSubmitSuccess(true);
      setContactForm({
        name: "",
        email: "",
        orderId: "",
        issueType: "general",
        subject: "",
        message: ""
      });
      
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error: any) {
      console.error("❌ Error submitting support ticket:", error);
      alert(`There was an error sending your message: ${error.message}`);
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
    return ISSUE_TYPES.find(opt => opt.value === contactForm.issueType)?.label || "General Inquiry";
  };

  const handleSendMessage = () => {
    if (!userMessage.trim()) return;
    
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      text: userMessage,
      sender: "user",
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, newUserMessage]);
    setUserMessage("");

    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I understand you're looking for buyer support. Let me connect you with our dedicated support team who can assist you with your orders and account!",
        sender: "bot",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  return {
    searchTerm,
    setSearchTerm,
    expandedFaq,
    toggleFaq,
    activeCategory,
    setActiveCategory,
    contactForm,
    handleInputChange,
    handleIssueTypeSelect,
    getSelectedIssueTypeLabel,
    isSubmitting,
    submitSuccess,
    handleContactSubmit,
    chatMessages,
    userMessage,
    setUserMessage,
    handleSendMessage,
    isIssueTypeOpen,
    setIsIssueTypeOpen,
    issueTypeRef,
    filteredFaqs,
    suggestedFaqs,
    currentUser
  };
};

