"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  location: string;
  price: number;
  unit: string;
  quantity: number;
  notes: string;
  image?: string;
  imageUrls?: string[]; // ✅ From your backend code
  farmName?: string;
  sellerId?: string; // ✅ From your backend code - crucial for orders
  category?: string; // ✅ Consider adding for better organization
  stock?: number; // ✅ Consider adding for stock validation
  // 🟢 ADDED: MOQ field
  minimumOrderQuantity?: number;
  // 🟢 ADDED: Farmer data for smart matching distance calculation
  farmer?: {
    location?: {
      lat: number;
      lng: number;
    };
    barangay?: string;
    displayName?: string;
    fullName?: string;
  };
  // ✅ ADDED: Cold chain properties
  requiresColdChain?: boolean;
  coldChain?: boolean;
  tags?: string[];
  productType?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  addToCart: (product: any, quantity?: number) => void; // ✅ UPDATED: Added quantity parameter
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateNotes: (id: string, notes: string) => void;
  openCart: () => void;
  closeCart: () => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  // ✅ Consider adding these useful methods:
  getItemQuantity: (id: string) => number;
  isInCart: (id: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 🟢 ADDED: Debug cart updates
  useEffect(() => {
    console.log("🛒 Cart Items Updated:", cartItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      id: item.id,
      price: item.price,
      total: item.price * item.quantity,
      farmer: item.farmer,
      minimumOrderQuantity: item.minimumOrderQuantity,
      // ✅ ADDED: Cold chain debug
      requiresColdChain: item.requiresColdChain,
      coldChain: item.coldChain,
      tags: item.tags,
      productType: item.productType
    })));
  }, [cartItems]);

  // ✅ UPDATED: addToCart now accepts quantity as separate parameter
  const addToCart = (product: any, quantity: number = 1) => {
    console.log('🛒 Adding to cart - product data:', {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity, // ✅ Now using the quantity parameter
      moq: product.minimumOrderQuantity, // ✅ ADDED: MOQ debug
      image: product.image,
      imageUrls: product.imageUrls,
      farmName: product.farmName,
      sellerId: product.sellerId,
      stock: product.stock,
      farmer: product.farmer,
      location: product.location,
      // ✅ ADDED: Cold chain debug
      requiresColdChain: product.requiresColdChain,
      coldChain: product.coldChain,
      tags: product.tags,
      productType: product.productType
    });
    
    // ✅ Stock validation (optional enhancement)
    if (product.stock !== undefined && product.stock <= 0) {
      console.warn('⚠️ Cannot add out-of-stock product:', product.name);
      return;
    }

    // ✅ Validate quantity - use the quantity parameter
    const incomingQuantity = quantity;
    if (incomingQuantity < 1) {
      console.warn('⚠️ Invalid quantity:', incomingQuantity);
      return;
    }

    // ✅ MOQ Validation (optional - you can remove if you prefer validation elsewhere)
    const moq = product.minimumOrderQuantity || 1;
    if (incomingQuantity < moq) {
      console.warn(`⚠️ Quantity ${incomingQuantity} is below MOQ ${moq} for ${product.name}`);
      // You can choose to block the add or just warn
      // return; // Uncomment to block adding below MOQ
    }

    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      
      if (existingItem) {
        // 🟢 FIXED: Add incoming quantity to existing quantity instead of replacing
        const newQuantity = existingItem.quantity + incomingQuantity;
        
        // ✅ Stock validation for existing items
        if (product.stock !== undefined && newQuantity > product.stock) {
          console.warn('⚠️ Cannot exceed available stock:', product.name);
          return prev;
        }
        
        console.log('✅ Updated existing item quantity from', existingItem.quantity, 'to:', newQuantity);
        return prev.map(item =>
          item.id === product.id
            ? { 
                ...item, 
                quantity: newQuantity, // 🟢 FIX: Add to existing quantity
                // 🟢 ADDED: Update farmer data if it changes
                farmer: product.farmer || item.farmer,
                // 🟢 ADDED: Update other fields that might change
                price: parseFloat(product.price) || item.price,
                stock: product.stock || item.stock,
                location: product.location || item.location,
                // ✅ ADDED: Update MOQ if available
                minimumOrderQuantity: product.minimumOrderQuantity || item.minimumOrderQuantity,
                // ✅ ADDED: Update cold chain properties
                requiresColdChain: product.requiresColdChain !== undefined ? product.requiresColdChain : item.requiresColdChain,
                coldChain: product.coldChain !== undefined ? product.coldChain : item.coldChain,
                tags: product.tags || item.tags,
                productType: product.productType || item.productType
              }
            : item
        );
      } else {
        console.log('✅ Added new item with quantity:', incomingQuantity);
        
        // 🟢 ENHANCED: Ensure farmer data is properly structured
        const farmerData = product.farmer || {
          location: product.farmer?.location,
          barangay: product.farmerBarangay || product.location,
          displayName: product.farmName,
          fullName: product.farmName
        };
        
        console.log('🛒 Farmer data being saved:', farmerData);
        
        return [...prev, {
          id: product.id,
          name: product.name,
          location: product.location || 'Unknown Location',
          price: parseFloat(product.price) || 0,
          unit: product.unit || 'pc',
          quantity: incomingQuantity, // ✅ Now using the quantity parameter
          notes: product.notes || '',
          image: product.image || product.imageUrls?.[0],
          imageUrls: product.imageUrls,
          farmName: product.farmName || 'Unknown Farm',
          sellerId: product.sellerId || product.farmer_id || 'unknown',
          category: product.category,
          stock: product.stock,
          // ✅ ADDED: MOQ field
          minimumOrderQuantity: product.minimumOrderQuantity || 1,
          // ✅ ADDED: Cold chain properties
          requiresColdChain: product.requiresColdChain || false,
          coldChain: product.coldChain || false,
          tags: product.tags || [],
          productType: product.productType,
          farmer: farmerData
        }];
      }
    });
    
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    console.log('🗑️ Removing item from cart:', id);
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    console.log('📦 Updating quantity for item:', id, 'to:', quantity);
    
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    
    // ✅ Optional: Add stock validation here too
    const item = cartItems.find(item => item.id === id);
    if (item?.stock !== undefined && quantity > item.stock) {
      console.warn('⚠️ Cannot exceed available stock');
      return;
    }

    // ✅ MOQ Validation for quantity updates
    const moq = item?.minimumOrderQuantity || 1;
    if (quantity < moq) {
      console.warn(`⚠️ Quantity ${quantity} is below MOQ ${moq} for ${item?.name}`);
      // You can choose to block or just warn
      // return; // Uncomment to block setting below MOQ
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const updateNotes = (id: string, notes: string) => {
    console.log('📝 Updating notes for item:', id, 'notes:', notes);
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, notes } : item
      )
    );
  };

  // ✅ Useful helper methods
  const getItemQuantity = (id: string): number => {
    const item = cartItems.find(item => item.id === id);
    return item?.quantity || 0;
  };

  const isInCart = (id: string): boolean => {
    return cartItems.some(item => item.id === id);
  };

  const openCart = () => {
    console.log('🛒 Opening cart sidebar');
    setIsCartOpen(true);
  };

  const closeCart = () => {
    console.log('🛒 Closing cart sidebar');
    setIsCartOpen(false);
  };

  const clearCart = () => {
    console.log('🛒 Clearing entire cart');
    setCartItems([]);
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // 🟢 ADDED: Enhanced cart logging with farmer data
  useEffect(() => {
    console.log("💰 Cart Totals - Items:", totalItems, "Amount: ₱", totalAmount.toFixed(2));
    console.log("📍 Farmer data in cart:", cartItems.map(item => ({
      name: item.name,
      farmer: item.farmer,
      hasLocation: !!item.farmer?.location,
      barangay: item.farmer?.barangay,
      moq: item.minimumOrderQuantity,
      // ✅ ADDED: Cold chain debug
      requiresColdChain: item.requiresColdChain,
      coldChain: item.coldChain,
      tags: item.tags,
      productType: item.productType
    })));
  }, [totalItems, totalAmount, cartItems]);

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateNotes,
      openCart,
      closeCart,
      clearCart,
      totalItems,
      totalAmount,
      getItemQuantity, // ✅ New helper
      isInCart // ✅ New helper
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};