"use client";
import { doc, getDoc } from "firebase/firestore";
import {
    Bot,
    ChevronLeft,
    ChevronRight,
    Copy,
    MapPin,
    Plus,
    Send,
    ShieldAlert,
    Snowflake,
    Sparkles,
    Store,
    Tag,
    Upload,
    User,
    X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { auth, db } from "../../../utils/lib/firebase";
import { addProduct, ProductData } from "../../../utils/lib/productService";
import styles from "./CreateProductForm.module.css";

interface CreateProductFormProps {
  onClose: () => void;
  onCreate: (product: any) => void;
  sellerId?: string;
}

interface SellerData {
  farmName?: string;
  location?: string;
  address?: {
    region?: string;
    province?: string;
    city?: string;
    barangay?: string;
  };
  idVerification?: {
    status?: string;
  };
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Available product tags
const AVAILABLE_TAGS = [
  "Fresh Harvest",
  "Premium Quality", 
  "Grade A",
  "Organic",
  "Natural",
  "Chemical-Free",
  "Pesticide-Free",
  "Non-GMO"
];

export default function CreateProductForm({
  onClose,
  onCreate,
  sellerId,
}: CreateProductFormProps) {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sellerData, setSellerData] = useState<SellerData | null>(null);
  const [fetchingSellerData, setFetchingSellerData] = useState(true);
  const [requiresColdChain, setRequiresColdChain] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // ✅ ADDED: Verification states
  const [isVerified, setIsVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("pending");
  
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (showAIChat && chatMessages.length === 0) {
      setChatMessages([
        {
          id: "1",
          text: "Hello! I'm your Farm2Table AI assistant. Tell me about your product and I'll generate description options for you!",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  }, [showAIChat]);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        setFetchingSellerData(true);
        const currentUser = auth.currentUser;
        const finalSellerId = sellerId || currentUser?.uid;
        if (!finalSellerId) {
          setError("You must be logged in to create a product");
          setFetchingSellerData(false);
          return;
        }
        const sellerDoc = await getDoc(doc(db, "sellers", finalSellerId));
        if (sellerDoc.exists()) {
          const data = sellerDoc.data();
          setSellerData({
            farmName: data.farm?.farmName || "My Farm",
            location: formatLocation(data.address),
            address: data.address,
            idVerification: data.idVerification || { status: "pending" }
          });
          
          // ✅ ADDED: Check verification status
          const verificationStatus = data.idVerification?.status || "pending";
          setVerificationStatus(verificationStatus);
          setIsVerified(verificationStatus === "approved");
          
        } else {
          setSellerData({
            farmName: "My Farm",
            location: "Farm Location",
            idVerification: { status: "pending" }
          });
        }
      } catch (error) {
        console.error("Error fetching seller data:", error);
        setSellerData({
          farmName: "My Farm",
          location: "Farm Location",
          idVerification: { status: "pending" }
        });
      } finally {
        setFetchingSellerData(false);
      }
    };
    fetchSellerData();
  }, [sellerId]);

  const formatLocation = (address: any): string => {
    if (!address) return "Farm Location";
    const parts = [
      address.barangay,
      address.city,
      address.province,
      address.region,
    ].filter((part) => part && part.trim() !== "");
    return parts.join(", ") || "Farm Location";
  };

  // Handle tag selection with 4-tag limit
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        // Limit to maximum 4 tags
        if (prev.length >= 4) {
          setError("Maximum 4 tags allowed per product");
          return prev;
        }
        setError(""); // Clear any previous tag limit errors
        return [...prev, tag];
      }
    });
  };

  // AI through API route
  const handleSendMessage = async () => {
    if (!userInput.trim() || aiGenerating) return;
    const userMessage = userInput.trim();
    setUserInput("");
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      text: userMessage,
      isUser: true,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, newUserMessage]);
    setAiGenerating(true);
    try {
      const form = document.querySelector("form") as HTMLFormElement;
      const formData = new FormData(form);
      const productContext = {
        farmName: sellerData?.farmName || "Your Farm",
        category: (formData.get("category") as string) || "General",
        unit: (formData.get("unit") as string) || "piece",
      };
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage, productContext }),
      });
      if (!res.ok) {
        throw new Error(`API responded with status: ${res.status}`);
      }
      const data = await res.json();
      const aiText = data.reply || "Sorry, I couldn't generate a description. Please try again.";
      const newAIMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        isUser: false,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, newAIMessage]);
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCopyDescription = (description: string) => {
    navigator.clipboard.writeText(description).then(() => {
      const descriptionTextarea = document.querySelector(
        'textarea[name="description"]'
      ) as HTMLTextAreaElement;
      if (descriptionTextarea) {
        descriptionTextarea.value = description;
      }
      alert("Description copied to your product form! 🎉");
    });
  };

  const parseAIOptions = (aiText: string) => {
    const options: { option: string; text: string }[] = [];
    const lines = aiText.split("\n");
    let currentOption = "";
    let currentText = "";
    lines.forEach((line) => {
      if (line.startsWith("OPTION")) {
        if (currentOption && currentText) {
          options.push({ option: currentOption, text: currentText.trim() });
        }
        currentOption = line.split(":")[0].trim();
        currentText = line.split(":").slice(1).join(":").trim();
      } else if (line.trim() && currentOption) {
        currentText += " " + line.trim();
      }
    });
    if (currentOption && currentText) {
      options.push({ option: currentOption, text: currentText.trim() });
    }
    return options.length > 0
      ? options
      : [{ option: "OPTION 1", text: aiText }];
  };

  // ✅ ADDED: Verification check before form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // ✅ ADDED: Check if seller is verified
    if (!isVerified) {
      setError("You must complete ID verification before creating products. Please check your verification status.");
      return;
    }
    
    setLoading(true);
    if (images.length === 0) {
      setError("Please upload at least one image");
      setLoading(false);
      return;
    }
    const currentUser = auth.currentUser;
    const finalSellerId = sellerId || currentUser?.uid;
    if (!finalSellerId) {
      setError("You must be logged in to create a product");
      setLoading(false);
      return;
    }
    if (!sellerData) {
      setError("Unable to load farm information. Please try again.");
      setLoading(false);
      return;
    }
    setError("");
    try {
      const formData = new FormData(e.currentTarget);
      
      const productData: ProductData = {
        name: formData.get("productName") as string,
        price: parseFloat(formData.get("price") as string),
        stock: parseInt(formData.get("quantity") as string),
        minStock: parseInt(formData.get("minStock") as string) || 10,
        // ✅ ADDED: MOQ field
        minimumOrderQuantity: parseInt(formData.get("minimumOrderQuantity") as string) || 1,
        description: (formData.get("description") as string) || "",
        category: (formData.get("category") as string) || "General",
        unit: (formData.get("unit") as string) || "kg",
        farmName: sellerData.farmName || "My Farm",
        location: sellerData.location || "Farm Location",
        images: images,
        requiresColdChain: requiresColdChain,
        tags: selectedTags.slice(0, 4)
      };
      console.log("🔄 Creating product...");
      const newProduct = await addProduct(productData, finalSellerId);
      console.log("✅ Product created successfully:", newProduct);
      
      // ✅ FIXED: Call onCreate callback immediately - like CartSidebar calls onOrderSuccess
      if (onCreate) {
        onCreate({
          id: newProduct.id,
          name: productData.name,
          price: productData.price,
          stock: productData.stock,
          category: productData.category,
          unit: productData.unit,
          farmName: productData.farmName,
          location: productData.location,
          requiresColdChain: productData.requiresColdChain,
          tags: productData.tags,
          // ✅ ADDED: MOQ to callback
          minimumOrderQuantity: productData.minimumOrderQuantity
        });
      }
      
    } catch (error: any) {
      console.error("Error creating product:", error);
      setError(error.message || "Failed to create product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const updatedFiles = [...images, ...newFiles].slice(0, 10);
    setImages(updatedFiles);
    setError("");
    previews.forEach((url) => URL.revokeObjectURL(url));
    const newPreviews = updatedFiles.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);
    setCurrentIndex(0);
  };

  const removeCurrentImage = useCallback(() => {
    if (images.length === 0) return;
    const newImages = images.filter((_, i) => i !== currentIndex);
    const newPreviews = previews.filter((_, i) => i !== currentIndex);
    URL.revokeObjectURL(previews[currentIndex]);
    setImages(newImages);
    setPreviews(newPreviews);
    setCurrentIndex((prev) =>
      prev >= newImages.length ? Math.max(0, newImages.length - 1) : prev
    );
    if (newImages.length === 0) {
      setError("Please upload at least one image");
    }
  }, [images, previews, currentIndex]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, previews.length - 1));
  }, [previews.length]);

  // ✅ ADDED: Handle overlay click to close modal
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // ✅ ADDED: Get verification status text and color
  const getVerificationStatusInfo = () => {
    switch (verificationStatus) {
      case "approved":
        return { text: "Verified", color: "#10b981", bgColor: "#ecfdf5" };
      case "pending":
        return { text: "Verification Pending", color: "#f59e0b", bgColor: "#fffbeb" };
      case "rejected":
        return { text: "Verification Rejected", color: "#ef4444", bgColor: "#fef2f2" };
      default:
        return { text: "Not Verified", color: "#6b7280", bgColor: "#f9fafb" };
    }
  };

  const statusInfo = getVerificationStatusInfo();

  return (
    <>
      {/* Main Form Modal - This should always show when the component is rendered */}
      <div className={styles.formOverlay} onClick={handleOverlayClick}>
        <div className={styles.formContainer}>
          <button className={styles.exitBtn} onClick={onClose}>
            <X size={18} />
          </button>
          <h2 className={styles.title}>Create Product</h2>
          <p className={styles.subtitle}>Fill out the product details below.</p>
          
          {/* ✅ ADDED: Verification Status Banner */}
          {!fetchingSellerData && (
            <div 
              className={styles.verificationBanner}
              style={{ 
                backgroundColor: statusInfo.bgColor,
                border: `1px solid ${statusInfo.color}20`
              }}
            >
              <ShieldAlert size={18} color={statusInfo.color} />
              <div className={styles.verificationText}>
                <strong style={{ color: statusInfo.color }}>
                  ID Verification: {statusInfo.text}
                </strong>
                {!isVerified && (
                  <span style={{ color: statusInfo.color }}>
                    {verificationStatus === "pending" 
                      ? " Your account is under review. You'll be able to create products once approved."
                      : verificationStatus === "rejected"
                      ? " Your verification was rejected. Please contact support."
                      : " Please complete ID verification to create products."}
                  </span>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.productForm}>
            {/* Image Preview at Top */}
            <div className={styles.imagePreviewSection}>
              <h4 className={styles.previewTitle}>Image Preview</h4>
              <div className={styles.carouselContainer}>
                {previews.length > 0 ? (
                  <>
                    <button
                      type="button"
                      className={`${styles.carouselArrow} ${styles.leftArrow}`}
                      onClick={prevImage}
                      disabled={currentIndex === 0}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <img
                      src={previews[currentIndex]}
                      alt={`Preview ${currentIndex + 1}`}
                      className={styles.carouselImage}
                    />
                    <button
                      type="button"
                      className={`${styles.carouselArrow} ${styles.rightArrow}`}
                      onClick={nextImage}
                      disabled={currentIndex === previews.length - 1}
                    >
                      <ChevronRight size={20} />
                    </button>
                    <button
                      type="button"
                      className={styles.removeCurrentBtn}
                      onClick={removeCurrentImage}
                    >
                      <X size={16} />
                    </button>
                    <div className={styles.carouselDots}>
                      {previews.map((_, index) => (
                        <span
                          key={index}
                          className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ""}`}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className={styles.placeholderBox}>
                    <p>No image uploaded</p>
                    <p className={styles.placeholderSubtext}>
                      Upload at least one product image
                    </p>
                  </div>
                )}
              </div>
            </div>
            {/* Farm Information */}
            <div className={styles.farmInfoSection}>
              <h3 className={styles.farmInfoTitle}>Your Farm Information</h3>
              <div className={styles.farmInfo}>
                <div className={styles.farmInfoItem}>
                  <Store size={16} className={styles.farmInfoIcon} />
                  <span className={styles.farmInfoLabel}>Farm Name:</span>
                  <span className={styles.farmInfoValue}>
                    {fetchingSellerData ? "Loading..." : sellerData?.farmName}
                  </span>
                </div>
                <div className={styles.farmInfoItem}>
                  <MapPin size={16} className={styles.farmInfoIcon} />
                  <span className={styles.farmInfoLabel}>Location:</span>
                  <span className={styles.farmInfoValue}>
                    {fetchingSellerData ? "Loading..." : sellerData?.location}
                  </span>
                </div>
              </div>
            </div>
            {/* Text Fields */}
            <div className={styles.textFieldsSection}>
              {/* Product Name and Price */}
              <div className={styles.inlineFormGroup}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Product Name <span className={styles.required}>*</span>
                  </label>
                  <input 
                    type="text" 
                    name="productName" 
                    placeholder="e.g., Organic Apples, Fresh Tilapia Fish" 
                    required 
                    disabled={!isVerified}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Price (₱) <span className={styles.required}>*</span>
                  </label>
                  <input 
                    type="number" 
                    name="price" 
                    placeholder="0.00" 
                    min="0"
                    step="0.01"
                    required 
                    disabled={!isVerified}
                  />
                </div>
              </div>
              {/* Stock Quantity and Minimum Stock */}
              <div className={styles.inlineFormGroup}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Stock Quantity <span className={styles.required}>*</span>
                  </label>
                  <input 
                    type="number" 
                    name="quantity" 
                    placeholder="0" 
                    min="0"
                    required 
                    disabled={!isVerified}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Minimum Stock
                  </label>
                  <input 
                    type="number" 
                    name="minStock" 
                    placeholder="10" 
                    min="1"
                    defaultValue="10"
                    disabled={!isVerified}
                  />
                </div>
              </div>
              {/* ✅ ADDED: MOQ Field - Placed after stock fields */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Minimum Order Quantity (MOQ) <span className={styles.required}>*</span>
                </label>
                <input 
                  type="number" 
                  name="minimumOrderQuantity" 
                  placeholder="1" 
                  min="1"
                  defaultValue="1"
                  required 
                  disabled={!isVerified}
                />
                <small className={styles.helpText}>
                  Buyers must order at least this quantity. Set to 1 for no minimum requirement.
                </small>
              </div>
              {/* Category and Unit */}
              <div className={styles.inlineFormGroup}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Category
                  </label>
                  <select name="category" defaultValue="Fresh Produce" disabled={!isVerified}>
                    <option value="Fresh Produce">Fresh Produce</option>
                    <option value="Dairy & Eggs">Dairy & Eggs</option>
                    <option value="Livestock & Poultry">Livestock & Poultry</option>
                    <option value="Fishery">Fishery</option>
                    <option value="Grains & Staples">Grains & Staples</option>
                    <option value="Specialty Products">Specialty Products</option>
                    <option value="Value-added">Value-added</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Unit
                  </label>
                  <select name="unit" defaultValue="kg" disabled={!isVerified}>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lb">lb</option>
                    <option value="piece">piece</option>
                    <option value="dozen">dozen</option>
                    <option value="bunch">bunch</option>
                    <option value="pack">pack</option>
                    <option value="liter">liter</option>
                    <option value="bottle">bottle</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Cold Chain */}
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={requiresColdChain}
                  onChange={(e) => setRequiresColdChain(e.target.checked)}
                  disabled={!isVerified}
                />
                <Snowflake size={16} />
                <span>Requires Cold Chain Delivery</span>
              </label>
              <small className={styles.helpText}>
                For temperature-sensitive products (perishables, frozen items, dairy, etc.)
              </small>
            </div>
            {/* Description */}
            <div className={styles.formGroup}>
              <div className={styles.descriptionHeader}>
                <label className={styles.formLabel}>
                  Description
                </label>
                <button 
                  type="button"
                  onClick={() => setShowAIChat(!showAIChat)}
                  className={styles.aiHelpButton}
                  disabled={!isVerified}
                >
                  <Sparkles size={14} />
                  {showAIChat ? 'Close AI Assistant' : 'Get AI Description Help'}
                </button>
              </div>
              <textarea 
                name="description" 
                placeholder="Describe your farm product..." 
                rows={4}
                disabled={!isVerified}
              />
              {/* AI Chat Assistant */}
              {showAIChat && (
                <div className={styles.aiChatSection}>
                  <div className={styles.aiChatHeader}>
                    <Bot size={16} />
                    <span>AI Description Assistant</span>
                  </div>
                  <div className={styles.aiChatMessages}>
                    {chatMessages.map((message) => (
                      <div key={message.id} className={styles.chatMessage}>
                        <div className={styles.messageAvatar}>
                          {message.isUser ? <User size={12} /> : <Bot size={12} />}
                        </div>
                        <div className={styles.messageContent}>
                          {!message.isUser ? (
                            <div>
                              {parseAIOptions(message.text).map((option, index) => (
                                <div key={index} className={styles.aiOption}>
                                  <div className={styles.optionTitle}>{option.option}</div>
                                  <div className={styles.optionText}>{option.text}</div>
                                  <button
                                    onClick={() => handleCopyDescription(option.text)}
                                    className={styles.copyButton}
                                    disabled={!isVerified}
                                  >
                                    <Copy size={12} />
                                    Use This Description
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            message.text
                          )}
                        </div>
                      </div>
                    ))}
                    {aiGenerating && (
                      <div className={styles.chatMessage}>
                        <div className={styles.messageAvatar}>
                          <Bot size={12} />
                        </div>
                        <div className={styles.messageContent}>
                          AI is thinking...
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className={styles.aiChatInput}>
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask for product description help..."
                      disabled={aiGenerating || !isVerified}
                    />
                    <button onClick={handleSendMessage} disabled={!userInput.trim() || aiGenerating || !isVerified}>
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Product Tags */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <Tag size={16} />
                Product Tags ({selectedTags.length}/4)
              </label>
              <small className={styles.helpText}>
                Select up to 4 tags that describe your product quality and characteristics
              </small>
              <div className={styles.tagsContainer}>
                {AVAILABLE_TAGS.map((tag) => (
                  <label 
                    key={tag} 
                    className={`${styles.tagCheckbox} ${
                      selectedTags.length >= 4 && !selectedTags.includes(tag) ? styles.disabled : ''
                    } ${!isVerified ? styles.disabled : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => handleTagToggle(tag)}
                      disabled={selectedTags.length >= 4 && !selectedTags.includes(tag) || !isVerified}
                    />
                    <span className={styles.tagLabel}>{tag}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Upload Images and Create Button at Bottom */}
            <div className={styles.bottomSection}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Product Images
                </label>
                <label className={styles.fileLabel}>
                  <Upload size={20} />
                  <span className={styles.uploadText}>Upload Images</span>
                  <span className={styles.uploadSubtext}>Click to browse or drag and drop</span>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    disabled={!isVerified}
                  />
                </label>
              </div>
              <div className={styles.submitSection}>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={images.length === 0 || loading || fetchingSellerData || !isVerified}
                >
                  <Plus size={18} />
                  {loading ? "Creating Product..." : 
                   fetchingSellerData ? "Loading Farm Info..." : 
                   !isVerified ? "ID Verification Required" : "Create Product"}
                </button>
              </div>
            </div>
            {error && <div className={styles.errorMessage}>{error}</div>}
          </form>
        </div>
      </div>
    </>
  );
}

