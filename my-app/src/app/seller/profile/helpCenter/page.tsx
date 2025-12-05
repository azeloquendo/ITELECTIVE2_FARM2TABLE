"use client";
import { ChevronDown, ChevronUp, Search, Send, Shield } from "lucide-react";
import { FAQ_CATEGORIES, ISSUE_TYPES, RESPONSE_TIME, SUPPORT_HOURS } from "../../../../constants/seller/helpCenter";
import { useHelpCenter } from "../../../../hooks/seller";
import styles from "./helpCenter.module.css";

export default function SellerHelpCenterPage() {
  const {
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
    suggestedFaqs
  } = useHelpCenter();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Seller Help Center</h1>
        <p className={styles.subtitle}>
          Get support for your farm operations, products, and account management
        </p>
      </div>

      {/* Search Section */}
      <div className={styles.searchSection}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Ask about products, payments, delivery, or account..."
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
                  toggleFaq(faq.id);
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

      {/* Support Info with 3D Images */}
      <div className={styles.highlightedSupport}>
        <div className={`${styles.supportFeature} ${styles.supportHours}`}>
          <div className={styles.supportContent}>
            <h3>Seller Support Hours</h3>
            <p>{SUPPORT_HOURS.days}<br/>{SUPPORT_HOURS.time}</p>
          </div>
        </div>
        <div className={`${styles.supportFeature} ${styles.responseTime}`}>
          <div className={styles.supportContent}>
            <h3>{RESPONSE_TIME.priority}</h3>
            <p>{RESPONSE_TIME.time}<br/>{RESPONSE_TIME.for}</p>
          </div>
        </div>
      </div>

      {/* Two Column Contact Options */}
      <div className={styles.contactGrid}>
        {/* Live Chat - Left Side */}
        <div className={styles.chatContainer}>
          <div className={styles.optionHeader}>
            <h3>Live Chat with FarmAssist</h3>
            <p>Your dedicated seller support assistant</p>
          </div>
          
          {/* Messenger-style Chat */}
          <div className={styles.chatWindow}>
            <div className={styles.chatMessages}>
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
                disabled={!userMessage.trim()}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Email Form - Right Side */}
        <div className={styles.formContainer}>
          <div className={styles.optionHeader}>
            <h3>Send Detailed Message to Admin</h3>
            <p>For farm operations, account, or technical issues</p>
          </div>
          
          {submitSuccess && (
            <div className={styles.successMessage}>
              <Shield size={18} />
              <div>
                <strong>Message Sent to Admin!</strong>
                <p>Your support ticket has been created and our team will respond within 2 hours.</p>
              </div>
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
                  />
                </div>
              </div>

              {/* Second Row: Farm ID and Issue Type */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Farm ID (optional)</label>
                  <input
                    type="text"
                    placeholder="Your farm identification"
                    value={contactForm.farmId}
                    onChange={(e) => handleInputChange('farmId', e.target.value)}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Issue Type *</label>
                  <div className={styles.dropdownContainer} ref={issueTypeRef}>
                    <button 
                      type="button"
                      className={styles.dropdownButton}
                      onClick={() => setIsIssueTypeOpen(!isIssueTypeOpen)}
                    >
                      <span>{getSelectedIssueTypeLabel()}</span>
                      <span className={`${styles.arrow} ${isIssueTypeOpen ? styles.arrowUp : styles.arrowDown}`}></span>
                    </button>
                    
                    {isIssueTypeOpen && (
                      <div className={styles.dropdownList}>
                        {ISSUE_TYPES.map(issueType => (
                          <button
                            key={issueType.value}
                            type="button"
                            className={`${styles.dropdownItem} ${contactForm.issueType === issueType.value ? styles.selected : ''}`}
                            onClick={() => handleIssueTypeSelect(issueType.value)}
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
                />
              </div>
              <div className={styles.formGroup}>
                <label>Message *</label>
                <textarea
                  placeholder="Please describe your issue in detail. Include product IDs, order numbers, or specific error messages if applicable."
                  value={contactForm.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  className={styles.formTextarea}
                  rows={3}
                  required
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
                    <div className={styles.spinner}></div>
                    Sending to Admin...
                  </>
                ) : (
                  "Send Message to Admin"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Seller FAQs</h2>
          <p className={styles.sectionSubtitle}>
            Everything about farm operations, products, and account management
          </p>
        </div>

        {/* Category Filter */}
        <div className={styles.categoryFilter}>
          {FAQ_CATEGORIES.map(category => (
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
          {filteredFaqs.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No questions found matching your search.</p>
              <p className={styles.emptySubtitle}>
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
