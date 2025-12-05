"use client";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import OrderSuccessModal from "../../../components/organisms/auth/modals/OrderModal/OrderSuccessModal";
import { useCategory } from "../../../components/organisms/buyer-submenus/MarketplaceSubmenu";
import CartSidebar from "../../../components/organisms/cart/CartSidebar";
import ProductCard from "../../../components/molecules/BuyerProductCard/ProductCard";
import { SORT_OPTIONS } from "../../../constants/buyer/marketplace";
import { useMarketplace } from "../../../hooks/buyer";
import { MarketplaceProduct, UserLocation } from "../../../interface/buyer/marketplace";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import styles from "./marketplace.module.css";

export default function MarketplacePage() {
  const categoryContext = useCategory();
  const selectedCategory = categoryContext?.selectedCategory || "all";
  const router = useRouter();
  const sortRef = useRef<HTMLDivElement>(null);
  
  // Use the marketplace hook
  const {
    products,
    filteredProducts,
    loading,
    locationLoading,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
  } = useMarketplace(selectedCategory);
  
  // Local UI state
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [showMOQModal, setShowMOQModal] = useState(false);
  const [moqProduct, setMoqProduct] = useState<MarketplaceProduct | null>(null);
  const [moqError, setMoqError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState<any>(null);
  
  const { user, userProfile } = useAuth() as {
    user: any;
    userProfile: any;
    loading: boolean;
  };

  const {
    cartItems,
    isCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateNotes,
    closeCart,
    clearCart,
  } = useCart();

  // Get current user location
  const currentUserLocation = useMemo((): UserLocation | null => {
    if (!userProfile) return null;
    const location = userProfile.address?.location || userProfile.deliveryAddress?.location;
    if (location?.lat && location?.lng) {
      return location;
    }
    return null;
  }, [userProfile]);

  // ✅ ADDED: MOQ Validation Function
  const validateMOQ = (product: MarketplaceProduct, quantity: number = 1): { isValid: boolean; message: string } => {
    const moq = product.minimumOrderQuantity || 1;
    
    if (quantity < moq) {
      return {
        isValid: false,
        message: `Minimum order quantity for ${product.name} is ${moq} ${product.unit || 'unit'}. Please add at least ${moq} to your cart.`
      };
    }
    
    return {
      isValid: true,
      message: `Quantity meets minimum order requirement.`
    };
  };

  // ✅ ADDED: MOQ Modal Handler
  const handleMOQModal = (product: MarketplaceProduct) => {
    setMoqProduct(product);
    setMoqError(`Minimum order: ${product.minimumOrderQuantity} ${product.unit || 'unit'}`);
    setShowMOQModal(true);
  };

  // ✅ ADDED: MOQ Add to Cart Handler
  const handleMOQAddToCart = (quantity: number) => {
    if (!moqProduct) return;
    
    const validation = validateMOQ(moqProduct, quantity);
    if (!validation.isValid) {
      setMoqError(validation.message);
      return;
    }
    
    const productWithFarmerData = {
      ...moqProduct,
      farmer: moqProduct.farmer ? {
        ...moqProduct.farmer,
        location: moqProduct.farmer.location,
        barangay: moqProduct.farmer.barangay || moqProduct.farmerBarangay,
        displayName: moqProduct.farmer.displayName || moqProduct.farmName,
        fullName: moqProduct.farmer.fullName || moqProduct.farmName
      } : {
        location: undefined,
        barangay: moqProduct.farmerBarangay,
        displayName: moqProduct.farmName,
        fullName: moqProduct.farmName
      }
    };
    
    addToCart(productWithFarmerData, quantity);
    setShowMOQModal(false);
    setMoqProduct(null);
    setMoqError("");
    
    console.log(`✅ Added ${quantity} ${moqProduct.unit || 'units'} (MOQ: ${moqProduct.minimumOrderQuantity}) to cart`);
  };

  // ✅ FIXED: Order success handler with proper orderNumber
  const handleOrderSuccess = (orderData: any) => {
    console.log("🎉 PARENT COMPONENT - Order success received:", {
      id: orderData.id,
      orderNumber: orderData.orderNumber,
      totalPrice: orderData.totalPrice,
      deliveryMethod: orderData.deliveryMethod,
      deliveryTime: orderData.deliveryTime,
      deliveryDate: orderData.deliveryDate,
      itemCount: orderData.itemCount,
      paymentMethod: orderData.paymentMethod,
      status: orderData.status
    });
    
    // ✅ FIXED: Include ALL order data including orderNumber
    setOrderSuccessData({
      id: orderData.id,
      orderNumber: orderData.orderNumber, // ← THIS WAS MISSING!
      totalPrice: orderData.totalPrice,
      deliveryMethod: orderData.deliveryMethod,
      deliveryTime: orderData.deliveryTime,
      deliveryDate: orderData.deliveryDate,
      itemCount: orderData.itemCount,
      paymentMethod: orderData.paymentMethod,
      status: orderData.status || 'pending'
    });
    
    setShowSuccessModal(true);
    clearCart();
    closeCart();
  };

  // ✅ ADDED: Debug useEffect to verify data
  useEffect(() => {
    if (orderSuccessData) {
      console.log("🔍 DEBUG - orderSuccessData state:", orderSuccessData);
      console.log("📦 Order Number in state:", orderSuccessData.orderNumber);
      console.log("🆔 Order ID in state:", orderSuccessData.id);
    }
  }, [orderSuccessData]);

  // ✅ ADDED: Close modal handler
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setOrderSuccessData(null);
  };

  // ✅ ADDED: Close MOQ modal handler
  const handleCloseMOQModal = () => {
    setShowMOQModal(false);
    setMoqProduct(null);
    setMoqError("");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayCategory = useMemo(() => {
    return selectedCategory === "all"
      ? "All Products"
      : selectedCategory
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
  }, [selectedCategory]);

  // Enhanced filtering

  // Format product data for ProductCard
  const formatProductForCard = (product: MarketplaceProduct) => {
    const checkIfNew = () => {
      if (!product.createdAt) return false;
      
      try {
        let productDate: Date;
        
        if (product.createdAt && (product.createdAt as any).toDate) {
          productDate = (product.createdAt as any).toDate();
        } else if (product.createdAt && (product.createdAt as any).seconds) {
          productDate = new Date((product.createdAt as any).seconds * 1000);
        } else {
          productDate = new Date(product.createdAt as any);
        }
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        return productDate >= oneWeekAgo;
      } catch (error) {
        console.error("Error checking if product is new:", error);
        return false;
      }
    };
    
    // Format location for ProductCard
    const formatLocation = () => {
      const barangay = product.farmer?.barangay || product.farmerBarangay;
      const city =
        (product.farmer as any)?.city ||
        (product.farmer as any)?.address?.city ||
        (product as any)?.city;
      const province =
        (product.farmer as any)?.province ||
        (product.farmer as any)?.address?.province ||
        (product as any)?.province;

      const addressParts = [barangay, city, province].filter(Boolean);
      if (addressParts.length) {
        return addressParts.join(", ");
      }

      const rawLocation = product.farmer?.location;
      if (typeof rawLocation === "string") return rawLocation;

      if (product.farmName) return product.farmName;

      return "Location not available";
    };
    
    return {
      ...product,
      id: product.id || "",
      name: product.name || "",
      image: product.imageUrls?.[0] || product.image || "",
      location: formatLocation(),
      farmName: product.farmName || "",
      price: product.price?.toString() || "0", // ProductCard expects string
      unit: product.unit || "unit",
      sold: product.sold || 0,
      stock: product.quantity_available || product.stock || 0,
      rating: product.rating || 0,
      reviews: product.reviewsCount || 0,
      isNew: checkIfNew(),
      deliveryFee: product.deliveryFee || 0,
      deliveryTime: product.deliveryTime || "15-45 min",
      farmerBarangay: product.farmerBarangay,
      farmer: product.farmer ? {
        ...product.farmer,
        location: product.farmer.location,
        barangay: product.farmer.barangay || product.farmerBarangay,
        displayName: product.farmer.displayName || product.farmName,
        fullName: product.farmer.fullName || product.farmName
      } : {
        location: undefined,
        barangay: product.farmerBarangay,
        displayName: product.farmName,
        fullName: product.farmName
      },
      smartScore: product.smartScore,
      matchReason: product.matchReason,
      isSmartMatch: product.isSmartMatch,
      minimumOrderQuantity: product.minimumOrderQuantity || 1,
      distance: product.distance?.toString() || undefined
    };
  };

  // Enhanced add to cart with MOQ validation
  const handleAddToCart = (product: any) => {
    // Check MOQ requirement
    const moq = product.minimumOrderQuantity || 1;
    
    if (moq > 1) {
      // Show MOQ modal for products with minimum order requirement
      handleMOQModal(product);
      return;
    }
    
    // Normal add to cart for products with MOQ = 1
    const productWithFarmerData = {
      ...product,
      farmer: product.farmer ? {
        ...product.farmer,
        location: product.farmer.location,
        barangay: product.farmer.barangay || product.farmerBarangay,
        displayName: product.farmer.displayName || product.farmName,
        fullName: product.farmer.fullName || product.farmName
      } : {
        location: undefined,
        barangay: product.farmerBarangay,
        displayName: product.farmName,
        fullName: product.farmName
      }
    };
    
    addToCart(productWithFarmerData);
  };

  const handleSaveItem = (product: any) => {
    console.log("Saving item:", product.name);
  };

  const handleViewDetails = (product: any) => {
    console.log("Viewing details:", product.name);
    router.push(`/buyer/marketplace/${product.id}`);
  };

  // Sort options
  const handleSortSelect = (value: string) => {
    setSortBy(value);
    setIsSortOpen(false);
  };

  const getSelectedSortLabel = () => {
    const selected = SORT_OPTIONS.find(opt => opt.value === sortBy);
    return (
      <div className={styles.sortLabel}>
        <span>{selected?.label || 'Smart Match'}</span>
      </div>
    );
  };

  // Handle place order
  const handlePlaceOrder = async (orderData: any) => {
    if (!user) {
      alert("Please log in to place an order");
      return;
    }
    
    setIsPlacingOrder(true);
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../../utils/lib/firebase');
      const { updateStock } = await import('../../../utils/lib/productService');
      
      const sellerOrders = orderData.ordersBySeller || orderData.sellers || [];
      
      for (const sellerOrder of sellerOrders) {
        for (const item of sellerOrder.items || []) {
          const productId = item.productId || item.id;
          if (!productId) continue;
          
          const productRef = doc(db, "products", productId);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const currentStock =
              productSnap.data().quantity_available ??
              productSnap.data().stock ??
              0;
            const newStock = Math.max(currentStock - item.quantity, 0);
            await updateStock(productId, newStock);
          }
        }
      }
      
      clearCart();
      closeCart();
      
      console.log("✅ Order placed successfully!");
      
    } catch (error) {
      console.error("❌ Error in post-order cleanup:", error);
      alert("Order was placed, but there was an error updating inventory.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (locationLoading) {
    return (
      <div className={styles.emptyState}>
        <p>Loading products...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Search and Filter Controls */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search products, farms, or descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterControls}>
          <div className={styles.dropdownContainer} ref={sortRef}>
            <button 
              className={`${styles.dropdownButton} ${sortBy !== "smart" ? styles.active : styles.smartActive}`}
              onClick={() => setIsSortOpen(!isSortOpen)}
            >
              {getSelectedSortLabel()}
              <span className={`${styles.arrow} ${isSortOpen ? styles.arrowUp : styles.arrowDown}`}></span>
            </button>
            
            {isSortOpen && (
              <div className={styles.dropdownList}>
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    className={`${styles.dropdownItem} ${sortBy === option.value ? styles.selected : ''}`}
                    onClick={() => handleSortSelect(option.value)}
                  >
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No products found matching your criteria.</p>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className={styles.productsContainer}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={formatProductForCard(product)}
              onAddToCart={handleAddToCart}
              onSaveItem={handleSaveItem}
              onViewDetails={handleViewDetails}
              showNewTag={true}
              currentUserLocation={currentUserLocation || undefined}
            />
          ))}
        </div>
      )}

      {/* ✅ ADDED: MOQ Modal */}
      {showMOQModal && moqProduct && (
        <div className={styles.modalOverlay}>
          <div className={styles.moqModal}>
            <div className={styles.moqModalHeader}>
              <h3>Minimum Order Required</h3>
              <button onClick={handleCloseMOQModal} className={styles.closeButton}>
                ×
              </button>
            </div>
            <div className={styles.moqModalContent}>
              <p>{moqProduct.name} has a minimum order quantity of <strong>{moqProduct.minimumOrderQuantity} {moqProduct.unit || 'units'}</strong>.</p>
              <p>Please select how many you'd like to add to cart:</p>
              
              <div className={styles.moqQuantitySelector}>
                <button 
                  onClick={() => handleMOQAddToCart(moqProduct.minimumOrderQuantity || 1)}
                  className={styles.moqAddButton}
                >
                  Add {moqProduct.minimumOrderQuantity} {moqProduct.unit || 'units'} (₱{((moqProduct.price || 0) * (moqProduct.minimumOrderQuantity || 1)).toFixed(2)})
                </button>
                
                <div className={styles.customQuantity}>
                  <p>Or add custom quantity:</p>
                  <div className={styles.quantityInputGroup}>
                    <input
                      type="number"
                      min={moqProduct.minimumOrderQuantity || 1}
                      max={moqProduct.stock || 100}
                      defaultValue={moqProduct.minimumOrderQuantity || 1}
                      className={styles.quantityInput}
                      id="moqQuantityInput"
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('moqQuantityInput') as HTMLInputElement;
                        const quantity = parseInt(input.value) || (moqProduct.minimumOrderQuantity || 1);
                        handleMOQAddToCart(quantity);
                      }}
                      className={styles.customAddButton}
                    >
                      Add Custom Quantity
                    </button>
                  </div>
                </div>
              </div>
              
              {moqError && (
                <div className={styles.moqError}>
                  {moqError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ UPDATED: CartSidebar with onOrderSuccess prop */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={closeCart}
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onUpdateNotes={updateNotes}
        onPlaceOrder={handlePlaceOrder}
        onOrderSuccess={handleOrderSuccess} // ✅ Added this prop
        buyerInfo={{
          id: user?.uid || "",
          name: userProfile?.fullName || user?.displayName || user?.email?.split('@')[0] || "Customer",
          address: userProfile?.address
            ? [
                userProfile.address.houseNo,
                userProfile.address.streetName,
                userProfile.address.barangay,
                userProfile.address.city,
                userProfile.address.province,
                userProfile.address.postalCode,
              ]
                .filter(Boolean)
                .join(", ")
            : userProfile?.deliveryAddress 
            ? [
                userProfile.deliveryAddress.houseNo,
                userProfile.deliveryAddress.streetName,
                userProfile.deliveryAddress.barangay,
                userProfile.deliveryAddress.city,
                userProfile.deliveryAddress.province,
                userProfile.deliveryAddress.postalCode,
              ]
                .filter(Boolean)
                .join(", ")
            : "No address provided",
          contact: userProfile?.contact || "No contact provided",
        }}
              currentUserLocation={currentUserLocation || undefined}
      />

      {/* ✅ UPDATED: OrderSuccessModal without buyerInfo */}
      <OrderSuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        orderData={orderSuccessData}
      />
    </div>
  );
}