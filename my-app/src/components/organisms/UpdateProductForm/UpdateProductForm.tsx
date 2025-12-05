"use client";
import { doc, getDoc } from "firebase/firestore";
import { Bot, ChevronLeft, ChevronRight, Copy, Edit, MapPin, Send, Snowflake, Sparkles, Store, Tag, Upload, User, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { auth, db } from "../../../utils/lib/firebase";
import { Product, updateProduct } from "../../../utils/lib/productService";
import styles from "./UpdateProductForm.module.css";

interface UpdateProductFormProps {
    onClose: () => void;
    product: Product;
    onUpdate: (updatedProduct: Product) => void;
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

export default function UpdateProductForm({ onClose, product, onUpdate }: UpdateProductFormProps) {
    const [formData, setFormData] = useState({
        name: product.name,
        price: product.price,
        stock: product.stock,
        minStock: product.minStock || 10,
        description: product.description || "",
        category: product.category || "Fresh Produce",
        unit: product.unit || "kg",
    });
    const [requiresColdChain, setRequiresColdChain] = useState(product.requiresColdChain || false);
    const [selectedTags, setSelectedTags] = useState<string[]>(product.tags || []);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>(product.imageUrls || []);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [sellerData, setSellerData] = useState<SellerData | null>(null);
    const [fetchingSellerData, setFetchingSellerData] = useState(true);
    
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
                    id: '1',
                    text: "Hello! I'm your Farm2Table AI assistant. Tell me about your product and I'll generate description options for you!",
                    isUser: false,
                    timestamp: new Date()
                }
            ]);
        }
    }, [showAIChat]);

    // Fetch seller data on component mount
    useEffect(() => {
        const fetchSellerData = async () => {
            try {
                setFetchingSellerData(true);
                const currentUser = auth.currentUser;
                const sellerId = currentUser?.uid;

                if (!sellerId) {
                    setError("You must be logged in to update a product");
                    setFetchingSellerData(false);
                    return;
                }

                // Fetch seller data from Firestore
                const sellerDoc = await getDoc(doc(db, "sellers", sellerId));
                
                if (sellerDoc.exists()) {
                    const data = sellerDoc.data();
                    setSellerData({
                        farmName: data.farm?.farmName || "My Farm",
                        location: formatLocation(data.address),
                        address: data.address
                    });
                } else {
                    setSellerData({
                        farmName: "My Farm",
                        location: "Farm Location"
                    });
                }
            } catch (error) {
                console.error("Error fetching seller data:", error);
                setSellerData({
                    farmName: "My Farm",
                    location: "Farm Location"
                });
            } finally {
                setFetchingSellerData(false);
            }
        };

        fetchSellerData();
    }, []);

    // Helper function to format location from address fields
    const formatLocation = (address: any): string => {
        if (!address) return "Farm Location";
        
        const parts = [
            address.barangay,
            address.city, 
            address.province,
            address.region
        ].filter(part => part && part.trim() !== '');
        
        return parts.join(', ') || "Farm Location";
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

    // ⭐ NEW: AI through API route (from first component)
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
            const productContext = {
                farmName: sellerData?.farmName || "Your Farm",
                category: formData.category || "General",
                unit: formData.unit || "piece"
            };

            console.log("🔄 Sending request to AI API...", { userMessage, productContext });

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

            console.log("✅ AI Response received:", aiText);

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
            setFormData(prev => ({
                ...prev,
                description: description
            }));
            alert("Description copied to your product form! 🎉");
        });
    };

    const parseAIOptions = (aiText: string) => {
        const options: { option: string; text: string }[] = [];
        const lines = aiText.split('\n');
        let currentOption = '';
        let currentText = '';
        lines.forEach(line => {
            if (line.startsWith('OPTION')) {
                if (currentOption && currentText) {
                    options.push({ option: currentOption, text: currentText.trim() });
                }
                currentOption = line.split(':')[0].trim();
                currentText = line.split(':').slice(1).join(':').trim();
            } else if (line.trim() && currentOption) {
                currentText += ' ' + line.trim();
            }
        });
        if (currentOption && currentText) {
            options.push({ option: currentOption, text: currentText.trim() });
        }
        return options.length > 0 ? options : [{ option: 'OPTION 1', text: aiText }];
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        console.log('🔄 Starting product update for ID:', product.id);
        console.log('📝 Current product data:', product);

        if (previews.length === 0) {
            setError("Please upload at least one image");
            setLoading(false);
            return;
        }

        setError("");

        try {
            // Create the proper update data structure
            const updatedProductData = {
                name: formData.name,
                description: formData.description,
                price: typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price,
                stock: typeof formData.stock === 'string' ? parseInt(formData.stock) : formData.stock,
                minStock: typeof formData.minStock === 'string' ? parseInt(formData.minStock) : formData.minStock,
                category: formData.category,
                unit: formData.unit,
                farmName: sellerData?.farmName || product.farmName || "My Farm",
                location: sellerData?.location || product.location || "Farm Location",
                requiresColdChain: requiresColdChain,
                tags: selectedTags.slice(0, 4) // Include tags from second component
            };

            console.log('📤 Calling updateProduct with:', {
                id: product.id,
                productData: updatedProductData,
                newImagesCount: newImages.length,
                tags: selectedTags.slice(0, 4)
            });

            // Call Firebase service to update product
            const updatedProduct = await updateProduct(
                product.id!, 
                updatedProductData, 
                newImages
            );
            
            console.log('✅ Update successful:', updatedProduct);
            onUpdate(updatedProduct);
            onClose();
            
        } catch (error: any) {
            console.error("❌ Error updating product:", error);
            setError(error.message || "Failed to update product. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const newFiles = Array.from(e.target.files);
        const updatedFiles = [...newImages, ...newFiles].slice(0, 10);
        setNewImages(updatedFiles);

        setError("");

        // Create previews for new images only
        const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
        
        // Combine existing image URLs with new previews
        const allPreviews = [...previews, ...newPreviews].slice(0, 10);
        setPreviews(allPreviews);
        setCurrentIndex(0);
    };

    const removeCurrentImage = useCallback(() => {
        if (previews.length === 0) return;
        
        const isExistingImage = currentIndex < (product.imageUrls?.length || 0);
        
        if (isExistingImage) {
            // Remove from existing images - update the product.imageUrls
            const updatedImageUrls = product.imageUrls?.filter((_, i) => i !== currentIndex) || [];
            const updatedPreviews = previews.filter((_, i) => i !== currentIndex);
            
            // Update the product's imageUrls directly since we're modifying existing images
            product.imageUrls = updatedImageUrls;
            setPreviews(updatedPreviews);
        } else {
            // Remove from new images
            const newImageIndex = currentIndex - (product.imageUrls?.length || 0);
            const updatedNewImages = newImages.filter((_, i) => i !== newImageIndex);
            const updatedPreviews = previews.filter((_, i) => i !== currentIndex);
            
            // Revoke the object URL
            URL.revokeObjectURL(previews[currentIndex]);
            
            setNewImages(updatedNewImages);
            setPreviews(updatedPreviews);
        }
        
        setCurrentIndex((prev) =>
            prev >= previews.length - 1 ? Math.max(0, previews.length - 2) : prev
        );

        if (previews.length === 1) {
            setError("Please upload at least one image");
        }
    }, [previews, newImages, currentIndex, product.imageUrls, product]);

    const prevImage = useCallback(() => {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }, []);

    const nextImage = useCallback(() => {
        setCurrentIndex((prev) => Math.min(prev + 1, previews.length - 1));
    }, [previews.length]);

    return (
        <div className={styles.formOverlay}>
            <div className={styles.formContainer}>
                <button className={styles.exitBtn} onClick={onClose}>
                    <X size={18} />
                </button>

                <h2 className={styles.title}>Update Product</h2>
                <p className={styles.subtitle}>Edit the product details below.</p>
        
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
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g., Organic Apples, Fresh Tilapia Fish"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>
                                    Price (₱) <span className={styles.required}>*</span>
                                </label>
                                <input
                                    name="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    required
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
                                    name="stock"
                                    type="number"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    placeholder="0"
                                    min="0"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>
                                    Minimum Stock
                                </label>
                                <input
                                    name="minStock"
                                    type="number"
                                    value={formData.minStock}
                                    onChange={handleChange}
                                    placeholder="10"
                                    min="1"
                                />
                            </div>
                        </div>

                        {/* Category and Unit */}
                        <div className={styles.inlineFormGroup}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>
                                    Category
                                </label>
                                <select 
                                    name="category" 
                                    value={formData.category} 
                                    onChange={handleChange}
                                >
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
                                <select 
                                    name="unit" 
                                    value={formData.unit} 
                                    onChange={handleChange}
                                >
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
                            >
                                <Sparkles size={14} />
                                {showAIChat ? 'Close AI Assistant' : 'Get AI Description Help'}
                            </button>
                        </div>
                        <textarea 
                            name="description" 
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe your farm product..." 
                            rows={4}
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
                                        disabled={aiGenerating}
                                    />
                                    <button onClick={handleSendMessage} disabled={!userInput.trim() || aiGenerating}>
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Product Tags (from second component) */}
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
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedTags.includes(tag)}
                                        onChange={() => handleTagToggle(tag)}
                                        disabled={selectedTags.length >= 4 && !selectedTags.includes(tag)}
                                    />
                                    <span className={styles.tagLabel}>{tag}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Upload Images and Update Button at Bottom */}
                    <div className={styles.bottomSection}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                                Product Images
                            </label>
                            <label className={styles.fileLabel}>
                                <Upload size={20} />
                                <span className={styles.uploadText}>Upload New Images</span>
                                <span className={styles.uploadSubtext}>Click to browse or drag and drop</span>
                                <input
                                    type="file"
                                    name="image"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                />
                            </label>
                        </div>

                        <div className={styles.submitSection}>
                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={previews.length === 0 || loading || fetchingSellerData}
                            >
                                <Edit size={18} />
                                {loading ? "Updating Product..." : 
                                 fetchingSellerData ? "Loading Farm Info..." : "Update Product"}
                            </button>
                        </div>
                    </div>

                    {error && <div className={styles.errorMessage}>{error}</div>}
                </form>
            </div>
        </div>
    );
}

