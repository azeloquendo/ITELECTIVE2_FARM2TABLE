"use client";

import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { ChevronLeft, ChevronRight, Heart, Image, Info, MapPin, MessageCircle, Minus, Plus, ShoppingCart, Snowflake, Star, Store } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import OrderSuccessModal from "../../../../components/organisms/auth/modals/OrderModal/OrderSuccessModal";
import CartSidebar from "../../../../components/organisms/cart/CartSidebar";
import PriceBreakdown from "../../../../components/molecules/PriceBreakdown";
import { auth, db } from "../../../../utils/lib/firebase";
import { PricingCalculator } from "../../../../utils/lib/pricingService";
import { updateStock } from "../../../../utils/lib/productService";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";
import styles from "./product.module.css";

type ActiveTab = 'description' | 'reviews' | 'pricing';

// ✅ FIXED: Enhanced formatLocation function
const formatLocation = (location: any): string => {
  // If it's already a string, return it
  if (typeof location === 'string') return location;
  
  // If it's an object with address properties, format it properly
  if (location && typeof location === 'object') {
    // Handle address object structure
    if (location.province || location.city || location.barangay) {
      const addressParts = [
        location.barangay,
        location.city,
        location.province,
        location.region
      ].filter(Boolean);
      
      return addressParts.length > 0 ? addressParts.join(', ') : 'Location not available';
    }
    
    // Handle simple location object
    if (location.lat && location.lng) {
      return `Coordinates: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
    }
    
    // If it's any other object, return a default message
    return 'Location available';
  }
  
  // Fallback
  return 'Location not available';
};

// ✅ FIXED: Enhanced extractBarangayFromAddress function
const extractBarangayFromAddress = (address: any): string => {
  if (!address) return "Unknown Barangay";
  
  // If address is an object with barangay property
  if (typeof address === 'object' && address.barangay) {
    return address.barangay;
  }
  
  // If address is a string, try to extract barangay
  if (typeof address === 'string') {
    const barangayMatch = address.match(/(\w+ Barangay)|(Brgy\.?\s*\w+)/i);
    return barangayMatch ? barangayMatch[0] : "Unknown Barangay";
  }
  
  return "Unknown Barangay";
};

// ✅ ADDED: Safe rendering helper function
const safeRender = (value: any, fallback: string = 'Not available'): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  if (value === null || value === undefined) return fallback;
  return fallback;
};

interface Review {
  id: string;
  buyerName: string;
  buyerId: string;
  rating: number;
  reviewText: string;
  createdAt: any;
  productId: string;
  productName: string;
  orderId: string;
  buyerEmail?: string;
  farmName?: string;
  productImage?: string;
  buyerProfilePic?: string;
  buyerFullName?: string;
}

interface Seller {
  id: string;
  name: string;
  logo: string;
  activeTime: string;
  address: string;
  rating: number;
  totalProducts: number;
  email?: string;
  farmName?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

interface Product {
  id: string;
  name: string;
  images: string[];
  imageUrls?: string[];
  location: string | any;
  farmName: string;
  price: number;
  unit: string;
  sold: number;
  category: string;
  description: string;
  stock: number;
  rating: number;
  reviewCount: number;
  additionalInfo?: {
    farmSize?: string;
    farmingMethod?: string;
    harvestDate?: string;
    shelfLife?: string;
    certifications?: string[];
  };
  reviewList: Review[];
  seller: Seller;
  sellerId?: string;
  status?: string;
  deliveryFee?: number;
  deliveryTime?: string;
  farmer?: {
    location?: {
      lat: number;
      lng: number;
    };
    barangay?: string;
    displayName?: string;
    fullName?: string;
  };
  
  // 🟢 ADDED: New pricing transparency fields
  farmerPrice?: number;
  marketPrice?: number;
  platformFee?: number;
  shippingFee?: number;
  vatAmount?: number;
  finalPrice?: number;
  priceBreakdown?: any;
  estimatedDistance?: number;
  estimatedDeliveryTime?: string;
  // ✅ ADDED: MOQ field
  minimumOrderQuantity?: number;
  // 🟢 ADDED: Cold chain and tags fields
  requiresColdChain?: boolean;
  tags?: string[];
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { 
    addToCart, 
    openCart, 
    cartItems, 
    isCartOpen, 
    closeCart, 
    updateQuantity, 
    removeFromCart, 
    updateNotes,
    clearCart
  } = useCart();
  const { user, userProfile } = useAuth();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<ActiveTab>('description');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);
  const [sellerData, setSellerData] = useState<any>(null);
  const [calculatedPriceBreakdown, setCalculatedPriceBreakdown] = useState<any>(null);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState<any>(null);

  const currentUserLocation = useMemo(() => {
    if (!userProfile) return null;
    
    const location = userProfile.address?.location || userProfile.deliveryAddress?.location;
    if (location?.lat && location?.lng) {
      return location;
    }
    return null;
  }, [userProfile]);

  // 🟢 ADDED: Calculate price breakdown when product and locations are available
  useEffect(() => {
    if (product && currentUserLocation && sellerData?.location) {
      calculatePriceBreakdown();
    }
  }, [product, currentUserLocation, sellerData]);

  const calculatePriceBreakdown = async () => {
    if (!product || !currentUserLocation || !sellerData?.location) return;

    try {
      // Calculate distance between user and seller
      const distance = PricingCalculator.calculateDistance(
        currentUserLocation.lat,
        currentUserLocation.lng,
        sellerData.location.lat,
        sellerData.location.lng
      );

      // Calculate shipping
      const shipping = PricingCalculator.calculateShipping(
        distance,
        sellerData.address?.barangay || extractBarangayFromAddress(sellerData.address),
        'motorcycle'
      );

      // Calculate complete price breakdown
      const priceBreakdown = PricingCalculator.calculateProductPricing(
        product.farmerPrice || product.price,
        product.category,
        product.unit,
        shipping
      );

      setCalculatedPriceBreakdown(priceBreakdown);

      // Update product with calculated pricing if needed
      if (!product.priceBreakdown) {
        setProduct(prev => prev ? {
          ...prev,
          priceBreakdown: priceBreakdown,
          shippingFee: shipping.total,
          estimatedDistance: distance,
          estimatedDeliveryTime: shipping.estimatedTime,
          finalPrice: priceBreakdown.finalPrice
        } : null);
      }

    } catch (error) {
      console.error("❌ Error calculating price breakdown:", error);
    }
  };

  useEffect(() => {
    console.log("🔍 USER PROFILE FULL STRUCTURE:", userProfile);
  }, [userProfile]);

  useEffect(() => {
    if (cartItems.length > 0) {
      console.log("🧑‍🌾 Farmer data in cart items:", cartItems.map(item => ({
        name: item.name,
        hasFarmer: !!item.farmer,
        farmerLocation: item.farmer?.location,
        farmerBarangay: item.farmer?.barangay,
        farmName: item.farmName,
        moq: item.minimumOrderQuantity
      })));
    }
  }, [cartItems]);

  const fetchBuyerProfile = async (buyerId: string) => {
    try {
      const buyerDoc = await getDoc(doc(db, "buyers", buyerId));
      
      if (buyerDoc.exists()) {
        const buyerData = buyerDoc.data();
        return {
          profilePic: buyerData.profilePic || "/images/buyer-profile.jpg",
          fullName: buyerData.fullName || buyerData.name || "Buyer"
        };
      }
      
      const userDoc = await getDoc(doc(db, "users", buyerId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          profilePic: userData.profilePic || "/images/buyer-profile.jpg",
          fullName: userData.fullName || userData.name || "Buyer"
        };
      }
      
    } catch (error) {
      console.error("Error fetching buyer profile:", error);
    }
    
    return {
      profilePic: "/images/buyer-profile.jpg",
      fullName: "Buyer"
    };
  };

  const fetchProductReviews = async (productId: string) => {
    try {
      const reviewsQuery = query(
        collection(db, "reviews"),
        where("productId", "==", productId),
        where("isActive", "==", true),
        orderBy("createdAt", "desc")
      );
      
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      const reviewsData = await Promise.all(
        reviewsSnapshot.docs.map(async (doc) => {
          const reviewData = doc.data();
          
          let buyerProfile = {
            profilePic: "/images/buyer-profile.jpg",
            fullName: reviewData.buyerName || "Buyer"
          };
          
          if (reviewData.buyerId) {
            buyerProfile = await fetchBuyerProfile(reviewData.buyerId);
          }
          
          return {
            id: doc.id,
            ...reviewData,
            buyerProfilePic: buyerProfile.profilePic,
            buyerFullName: buyerProfile.fullName
          };
        })
      ) as Review[];
      
      return reviewsData;
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return [];
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Recent";
    
    try {
      let date: Date;
      
      if (timestamp.toDate) {
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        date = new Date(timestamp);
      }
      
      return date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return "Recent";
    }
  };

  useEffect(() => {
    const checkIfSaved = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser || !product) return;
      
      try {
        const savedItemRef = doc(db, "users", currentUser.uid, "savedItems", product.id);
        const snap = await getDoc(savedItemRef);
        setIsWishlisted(snap.exists());
      } catch (error) {
        console.error("Error checking saved status:", error);
      }
    };
    checkIfSaved();
  }, [product]);

  // ✅ ENHANCED: fetchSellerData with better location extraction
  const fetchSellerData = async (sellerId: string) => {
    try {
      const sellerDoc = await getDoc(doc(db, "sellers", sellerId));
      
      if (sellerDoc.exists()) {
        const sellerData = sellerDoc.data();
        
        const sellerLogo = sellerData.logo || 
                          sellerData.farm?.logo || 
                          sellerData.profilePicture || 
                          sellerData.profileImage || 
                          sellerData.image || 
                          sellerData.businessLogo ||
                          "/images/farm-logo-placeholder.jpg";
        
        const sellerName = sellerData.farmName || 
                          sellerData.farm?.farmName || 
                          sellerData.businessName || 
                          sellerData.name || 
                          sellerData.fullName ||
                          "Seller";
        
        let sellerAddress = "Location available";
        if (sellerData.address) {
          sellerAddress = formatLocation(sellerData.address);
        } else if (sellerData.barangay && sellerData.city) {
          sellerAddress = `${sellerData.barangay}, ${sellerData.city}, ${sellerData.province || ''}`;
        } else if (sellerData.location) {
          sellerAddress = formatLocation(sellerData.location);
        }
        
        // ✅ FIXED: Extract location coordinates properly
        let sellerLocation = null;
        if (sellerData.location?.lat && sellerData.location?.lng) {
          sellerLocation = sellerData.location;
        } else if (sellerData.address?.location?.lat && sellerData.address?.location?.lng) {
          sellerLocation = sellerData.address.location;
        } else if (sellerData.coordinates?.lat && sellerData.coordinates?.lng) {
          sellerLocation = sellerData.coordinates;
        }
        
        console.log("📍 Seller Location Data:", {
          sellerId: sellerId,
          hasLocation: !!sellerLocation,
          location: sellerLocation,
          address: sellerData.address,
          coordinates: sellerData.coordinates
        });
        
        const sellerWithLocation = {
          id: sellerId,
          name: sellerName,
          logo: sellerLogo,
          address: sellerAddress,
          rating: sellerData.rating || 0,
          email: sellerData.email,
          farmName: sellerData.farmName || sellerData.farm?.farmName || sellerName,
          location: sellerLocation, // ✅ Now properly set
          // ✅ ADDED: Raw address data for barangay extraction
          address: sellerData.address
        };
        
        setSellerData(sellerWithLocation);
      } else {
        console.warn("❌ Seller document not found:", sellerId);
        setSellerData({
          id: sellerId,
          name: "Unknown Seller",
          logo: "/images/farm-logo-placeholder.jpg",
          address: "Location available",
          rating: 0,
          farmName: "Unknown Farm"
        });
      }
    } catch (error) {
      console.error("❌ Error fetching seller data:", error);
      setSellerData({
        id: sellerId,
        name: "Seller",
        logo: "/images/farm-logo-placeholder.jpg",
        address: "Location available",
        rating: 0,
        farmName: "Farm"
      });
    }
  };

  useEffect(() => {
    const fetchProductData = async () => {
      const productId = params?.id;
      
      if (!productId) {
        router.push('/buyer/marketplace');
        return;
      }
      const id = Array.isArray(productId) ? productId[0] : productId;
      
      if (!id) {
        router.push('/buyer/marketplace');
        return;
      }
      try {
        const productDoc = await getDoc(doc(db, "products", id));
        
        if (!productDoc.exists()) {
          router.push('/buyer/marketplace');
          return;
        }
        const productData = productDoc.data();
        
        if (productData.sellerId) {
          await fetchSellerData(productData.sellerId);
        }
        
        const realReviews = await fetchProductReviews(id);
        
        const averageRating = realReviews.length > 0 
          ? realReviews.reduce((sum, review) => sum + review.rating, 0) / realReviews.length
          : 0;
        
        const formattedLocation = formatLocation(productData.location);
        
        const transformedProduct: Product = {
          id: productDoc.id,
          name: productData.name || "Product",
          images: productData.imageUrls || [productData.image] || ["/images/placeholder.jpg"],
          imageUrls: productData.imageUrls,
          location: formattedLocation,
          farmName: productData.farmName || "Unknown Farm",
          price: parseFloat(productData.price) || 0,
          unit: productData.unit || "unit",
          sold: productData.sold || 0,
          category: productData.category || "uncategorized",
          description: productData.description || "No description available",
          stock: productData.quantity_available || productData.stock || 0,
          rating: averageRating,
          reviewCount: realReviews.length,
          additionalInfo: {
            farmSize: productData.farmSize || "Not specified",
            farmingMethod: productData.farmingMethod || "Not specified",
            harvestDate: productData.harvestDate || "Not specified",
            shelfLife: productData.shelfLife || "Not specified",
            certifications: productData.certifications || []
          },
          reviewList: realReviews,
          seller: {
            id: productData.sellerId || "unknown",
            name: productData.farmName || "Seller",
            logo: productData.sellerLogo || "/images/farm-logo-placeholder.jpg",
            activeTime: "recently",
            address: formattedLocation,
            rating: productData.sellerRating || 0,
            totalProducts: 0,
            email: productData.sellerEmail
          },
          sellerId: productData.sellerId,
          status: productData.status,
          deliveryFee: productData.deliveryFee,
          deliveryTime: productData.deliveryTime,
          farmer: productData.farmer || {
            location: productData.farmer?.location,
            barangay: productData.farmerBarangay,
            displayName: productData.farmName,
            fullName: productData.farmName
          },
          // 🟢 ADDED: New pricing fields
          farmerPrice: productData.farmerPrice,
          marketPrice: productData.marketPrice,
          platformFee: productData.platformFee,
          shippingFee: productData.shippingFee,
          vatAmount: productData.vatAmount,
          finalPrice: productData.finalPrice,
          priceBreakdown: productData.priceBreakdown,
          estimatedDistance: productData.estimatedDistance,
          estimatedDeliveryTime: productData.estimatedDeliveryTime,
          // ✅ ADDED: MOQ field
          minimumOrderQuantity: productData.minimumOrderQuantity || 1,
          // 🟢 ADDED: Cold chain and tags fields
          requiresColdChain: productData.requiresColdChain || false,
          tags: productData.tags || []
        };
        setProduct(transformedProduct);
        setFilteredReviews(realReviews);
        
        if (productData.sellerId) {
          await fetchSellerProducts(productData.sellerId, id);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        router.push('/buyer/marketplace');
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, [params, router]);

  const fetchSellerProducts = async (sellerId: string, currentProductId: string) => {
    try {
      const q = query(
        collection(db, "products"),
        where("sellerId", "==", sellerId),
        where("status", "==", "active")
      );
      
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(product => product.id !== currentProductId)
        .slice(0, 4);
      setSellerProducts(products);
      
      if (product) {
        setProduct(prev => prev ? {
          ...prev,
          seller: {
            ...prev.seller,
            totalProducts: querySnapshot.size
          }
        } : null);
      }
    } catch (error) {
      console.error("Error fetching seller products:", error);
    }
  };

  useEffect(() => {
    if (product) {
      if (selectedRating === null) {
        setFilteredReviews(product.reviewList);
      } else {
        const filtered = product.reviewList.filter(review => 
          Math.floor(review.rating) === selectedRating
        );
        setFilteredReviews(filtered);
      }
    }
  }, [selectedRating, product]);

  const getRatingDistribution = () => {
    if (!product) return [0, 0, 0, 0, 0];
    
    const distribution = [0, 0, 0, 0, 0];
    
    product.reviewList.forEach(review => {
      const rating = Math.floor(review.rating);
      if (rating >= 1 && rating <= 5) {
        distribution[rating - 1]++;
      }
    });
    
    return distribution;
  };

  const nextImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  // ✅ FIXED: Enhanced handleAddToCart with proper farmer data
  const handleAddToCart = () => {
    if (product) {
      console.log("🛒 Adding to cart from Product Page - Seller Data:", sellerData);
      console.log("🛒 Product Farmer Data:", product.farmer);
      console.log("🛒 Current User Location:", currentUserLocation);
      
      // ✅ FIXED: Get farmer location from sellerData first, then product.farmer
      const farmerLocation = sellerData?.location || 
                            product.farmer?.location;
      
      // ✅ FIXED: Get barangay from seller address or product data
      const farmerBarangay = sellerData?.address?.barangay || 
                            product.farmer?.barangay || 
                            extractBarangayFromAddress(sellerData?.address || formatLocation(product.location));
      
      console.log("📍 Final Farmer Location Data:", {
        location: farmerLocation,
        barangay: farmerBarangay,
        sellerDataLocation: sellerData?.location,
        productFarmerLocation: product.farmer?.location
      });
      
      const cartItem = {
        id: product.id,
        name: product.name,
        location: formatLocation(product.location),
        price: product.price,
        unit: product.unit,
        quantity: quantity,
        notes: '',
        image: product.images[0],
        imageUrls: product.imageUrls,
        farmName: product.farmName,
        sellerId: product.sellerId,
        // ✅ FIXED: Proper farmer data structure
        farmer: {
          location: farmerLocation,
          barangay: farmerBarangay,
          displayName: product.farmName,
          fullName: sellerData?.name || product.farmName
        },
        // ✅ ADDED: MOQ field for cart validation
        minimumOrderQuantity: product.minimumOrderQuantity || 1,
        // 🟢 ADDED: Pricing fields for cart
        farmerPrice: product.farmerPrice,
        marketPrice: product.marketPrice,
        platformFee: product.platformFee,
        shippingFee: product.shippingFee,
        vatAmount: product.vatAmount,
        finalPrice: product.finalPrice,
        priceBreakdown: product.priceBreakdown || calculatedPriceBreakdown,
        // 🟢 ADDED: Cold chain field for cart
        requiresColdChain: product.requiresColdChain || false
      };
      
      console.log("🎯 Final Cart Item Data:", {
        name: cartItem.name,
        quantity: cartItem.quantity,
        farmer: cartItem.farmer,
        hasLocation: !!cartItem.farmer?.location,
        moq: cartItem.minimumOrderQuantity,
        requiresColdChain: cartItem.requiresColdChain
      });
      
      addToCart(cartItem, quantity); // ✅ Make sure to pass quantity
    }
  };

  // ✅ FIXED: Enhanced handleBuyNow with same fixes
  const handleBuyNow = () => {
    if (product) {
      console.log("🛒 Buy Now from Product Page - Seller Data:", sellerData);
      
      // ✅ FIXED: Get farmer location from sellerData first, then product.farmer
      const farmerLocation = sellerData?.location || 
                            product.farmer?.location;
      
      // ✅ FIXED: Get barangay from seller address or product data
      const farmerBarangay = sellerData?.address?.barangay || 
                            product.farmer?.barangay || 
                            extractBarangayFromAddress(sellerData?.address || formatLocation(product.location));
      
      const cartItem = {
        id: product.id,
        name: product.name,
        location: formatLocation(product.location),
        price: product.price,
        unit: product.unit,
        quantity: quantity,
        notes: '',
        image: product.images[0],
        imageUrls: product.imageUrls,
        farmName: product.farmName,
        sellerId: product.sellerId,
        // ✅ FIXED: Proper farmer data structure
        farmer: {
          location: farmerLocation,
          barangay: farmerBarangay,
          displayName: product.farmName,
          fullName: sellerData?.name || product.farmName
        },
        // ✅ ADDED: MOQ field for cart validation
        minimumOrderQuantity: product.minimumOrderQuantity || 1,
        // 🟢 ADDED: Pricing fields for cart
        farmerPrice: product.farmerPrice,
        marketPrice: product.marketPrice,
        platformFee: product.platformFee,
        shippingFee: product.shippingFee,
        vatAmount: product.vatAmount,
        finalPrice: product.finalPrice,
        priceBreakdown: product.priceBreakdown || calculatedPriceBreakdown,
        // 🟢 ADDED: Cold chain field for cart
        requiresColdChain: product.requiresColdChain || false
      };
      
      console.log("🎯 Buy Now Cart Item Data:", {
        name: cartItem.name,
        quantity: cartItem.quantity,
        farmer: cartItem.farmer,
        hasLocation: !!cartItem.farmer?.location,
        moq: cartItem.minimumOrderQuantity,
        requiresColdChain: cartItem.requiresColdChain
      });
      
      addToCart(cartItem, quantity); // ✅ Make sure to pass quantity
      openCart();
    }
  };

  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleOrderSuccess = (orderData: any) => {
    console.log("🎉 Order success received:", orderData);
    
    setOrderSuccessData({
      id: orderData.id,
      totalPrice: orderData.totalPrice,
      deliveryMethod: orderData.deliveryMethod,
      deliveryTime: orderData.deliveryTime,
      deliveryDate: orderData.deliveryDate,
      itemCount: orderData.itemCount
    });
    
    setShowSuccessModal(true);
    
    clearCart();
    closeCart();
  };

  const handlePlaceOrder = async (orderData: any) => {
    if (!user) {
      alert("Please log in to place an order");
      return;
    }
    
    console.log("🛒 Placing order from product page:", orderData);
    try {
      const sellerOrders = orderData.ordersBySeller || orderData.sellers || [];
      console.log("✅ Order documents saved via API — updating stock...");
      
      for (const sellerOrder of sellerOrders) {
        for (const item of sellerOrder.items || []) {
          const productId = item.productId || item.id;
          if (!productId) {
            console.warn("⚠️ Missing product ID, skipping stock update for:", item.name);
            continue;
          }
          const productRef = doc(db, "products", productId);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const currentStock =
              productSnap.data().quantity_available ??
              productSnap.data().stock ??
              0;
            const newStock = Math.max(currentStock - item.quantity, 0);
            await updateStock(productId, newStock);
            console.log(`🔻 Deducted ${item.quantity} from ${item.name} (new stock: ${newStock})`);
          } else {
            console.warn("⚠️ Product not found:", productId);
          }
        }
      }
      
      console.log("✅ Stock updated successfully!");
      
    } catch (error) {
      console.error("❌ Error in post-order cleanup:", error);
      alert("Order was placed, but there was an error updating inventory.");
    }
  };

  const handleWishlist = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Please log in to save items to your wishlist");
      return;
    }
    if (!product) return;
    try {
      const savedItemRef = doc(db, "users", currentUser.uid, "savedItems", product.id);
      if (!isWishlisted) {
        await setDoc(savedItemRef, {
          id: product.id,
          name: product.name,
          image: product.images[0],
          imageUrls: product.images,
          location: formatLocation(product.location),
          farmName: product.farmName,
          price: product.price.toString(),
          unit: product.unit,
          sold: product.sold || 0,
          stock: product.stock,
          rating: product.rating,
          reviews: product.reviewCount,
          distance: "5 km away",
          description: product.description,
          savedAt: new Date().toISOString(),
          requiresColdChain: product.requiresColdChain,
          tags: product.tags
        });
        console.log("✅ Added to wishlist with correct data structure");
        setIsWishlisted(true);
      } else {
        await deleteDoc(savedItemRef);
        console.log("✅ Removed from wishlist");
        setIsWishlisted(false);
      }
    } catch (error) {
      console.error("❌ Error updating wishlist:", error);
      alert("Failed to update wishlist");
    }
  };

  const handleVisitSeller = () => {
    if (product && product.sellerId) {
      router.push(`/buyer/dashboard/farm-feed/${product.sellerId}`);
    } else {
      console.error("Seller ID not available");
      alert("Seller information not available");
    }
  };

  const handleChatWithSeller = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Please log in to chat with sellers");
      return;
    }
    if (!product || !product.sellerId) {
      alert("Seller information not available");
      return;
    }
    try {
      const conversationsQuery = query(
        collection(db, "conversations"),
        where("participants.buyerId", "==", currentUser.uid),
        where("participants.sellerId", "==", product.sellerId)
      );
      
      const conversationSnapshot = await getDocs(conversationsQuery);
      
      let conversationId: string;
      if (!conversationSnapshot.empty) {
        conversationId = conversationSnapshot.docs[0].id;
        console.log("✅ Found existing conversation:", conversationId);
      } else {
        const newConversation = {
          participants: {
            buyerId: currentUser.uid,
            buyerName: userProfile?.fullName || currentUser.displayName || "Buyer",
            sellerId: product.sellerId,
            sellerName: sellerData?.name || product.seller.name,
            sellerFarmName: sellerData?.farmName || product.farmName
          },
          lastMessage: `Hello! I'm interested in your product: ${product.name}`,
          lastMessageTime: serverTimestamp(),
          unreadCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          productInfo: {
            productId: product.id,
            productName: product.name,
            productImage: product.images[0],
            price: product.price
          }
        };
        const docRef = await addDoc(collection(db, "conversations"), newConversation);
        conversationId = docRef.id;
        
        const firstMessage = {
          conversationId: conversationId,
          senderId: currentUser.uid,
          senderName: userProfile?.fullName || currentUser.displayName || "Buyer",
          senderRole: 'buyer',
          content: `Hello! I'm interested in your product: ${product.name}`,
          timestamp: serverTimestamp(),
          read: false,
          type: 'text'
        };
        await addDoc(collection(db, "messages"), firstMessage);
        console.log("✅ Created new conversation with first message");
      }
      router.push(`/buyer/profile/messages?farmId=${product.sellerId}`);
      
    } catch (error) {
      console.error("❌ Error starting chat:", error);
      alert("Failed to start chat with seller. Please try again.");
    }
  };

  const getTotalReviewsWithMedia = () => {
    if (!product) return 0;
    return product.reviewList.filter(review => 
      review.productImage
    ).length;
  };

  const handleRatingFilter = (rating: number) => {
    if (selectedRating === rating) {
      setSelectedRating(null);
    } else {
      setSelectedRating(rating);
    }
  };

  const getReviewMediaCount = (review: Review) => {
    return review.productImage ? 1 : 0;
  };

  const getBuyerInfo = () => {
    if (!user) return { name: "Guest", address: "Please log in to see address" };
    
    return {
      id: user.uid,
      name: userProfile?.fullName || user.displayName || user.email?.split('@')[0] || "Customer",
      address: userProfile?.deliveryAddress
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
        : userProfile?.address || "No address provided",
      contact: userProfile?.contact || "No contact provided",
    };
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setOrderSuccessData(null);
  };

  // 🟢 ADDED: Get current price breakdown data
  const getCurrentPriceBreakdown = () => {
    return calculatedPriceBreakdown || product?.priceBreakdown;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.notFound}>
        <h2>Product Not Found</h2>
        <p>The product you're looking for doesn't exist or has been removed.</p>
        <button 
          className={styles.backButton}
          onClick={() => router.push('/buyer/marketplace')}
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  const ratingDistribution = getRatingDistribution();
  const totalReviewsWithMedia = getTotalReviewsWithMedia();
  const buyerInfo = getBuyerInfo();
  const priceBreakdown = getCurrentPriceBreakdown();

  return (
    <div className={styles.container}>
      <button 
        className={styles.backButton}
        onClick={() => router.back()}
      >
        <ChevronLeft size={20} />
        <span>Back to Marketplace</span>
      </button>
      
      <div className={styles.productContainer}>
        <div className={styles.imageSection}>
          <div className={styles.mainImageContainer}>
            <img 
              src={product.images[currentImageIndex]} 
              alt={product.name}
              className={styles.mainImage}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/images/placeholder.jpg";
              }}
            />
            <button 
              className={`${styles.navButton} ${styles.prevButton}`}
              onClick={prevImage}
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              className={`${styles.navButton} ${styles.nextButton}`}
              onClick={nextImage}
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          
          <div className={styles.thumbnailContainer}>
            {product.images.slice(0, 4).map((image: string, index: number) => (
              <button
                key={index}
                className={`${styles.thumbnail} ${currentImageIndex === index ? styles.activeThumbnail : ''}`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <img 
                  src={image} 
                  alt={`${product.name} view ${index + 1}`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/placeholder.jpg";
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.header}>
            <h1 className={styles.productName}>{safeRender(product.name, 'Product Name')}</h1>
          </div>
          
          <div className={styles.ratingStockContainer}>
            <div className={styles.rating}>
              <Star size={18} fill="#fbbf24" color="#fbbf24" />
              <span className={styles.ratingValue}>{product.rating.toFixed(1)}</span>
              <span className={styles.reviewCount}>({product.reviewCount} reviews)</span>
            </div>
            <div className={`${styles.stock} ${product.stock < 10 ? styles.lowStock : ''}`}>
              {product.stock} in stock
            </div>
          </div>
          
          {/* 🟢 UPDATED: Enhanced Tags Section matching Product Card */}
          <div className={styles.tagsContainer}>
            {/* Delivery Info Tags */}
            {product.estimatedDistance && (
              <div className={styles.deliveryTags}>
                <span className={styles.distanceBadge}>
                  🚗 {product.estimatedDistance.toFixed(1)}km away
                </span>
                <span className={styles.deliveryFee}>
                  📦 ₱{product.shippingFee || calculatedPriceBreakdown?.shippingFee || 47}
                </span>
                <span className={styles.eta}>
                  ⏱️ {product.estimatedDeliveryTime || '19min'}
                </span>
              </div>
            )}
            
            {/* Product Tags - Horizontal Scrollable */}
            <div className={styles.productTags}>
              {product.requiresColdChain && (
                <div className={`${styles.tag} ${styles.coldChainTag}`}>
                  <Snowflake size={12} />
                  <span>Cold Chain</span>
                </div>
              )}
              {/* Example tags - you can replace with actual product tags from your data */}
              <div className={styles.tag}>Fresh Harvest</div>
              <div className={styles.tag}>Organic</div>
              <div className={styles.tag}>Chemical-Free</div>
              {/* Add more tags based on your product data */}
              {product.tags && product.tags.map((tag, index) => (
                <div key={index} className={styles.tag}>
                  {tag}
                </div>
              ))}
            </div>
          </div>
          
          <div className={styles.priceContainer}>
            <div className={styles.priceSection}>
              <span className={styles.price}>₱{product.finalPrice || product.price}</span>
              <span className={styles.unit}>/{safeRender(product.unit, 'unit')}</span>
            </div>
            
            {/* 🟢 ADDED: Price breakdown preview */}
            {priceBreakdown && (
              <div className={styles.priceBreakdownPreview}>
                <button 
                  className={styles.breakdownToggle}
                  onClick={() => setActiveTab('pricing')}
                >
                  <Info size={14} />
                  <span>See price breakdown</span>
                </button>
              </div>
            )}
          </div>
          
          <div className={styles.description}>
            <p>{safeRender(product.description, 'No description available')}</p>
          </div>
          
          <div className={styles.actionContainer}>
            <div className={styles.quantitySection}>
              <label className={styles.quantityLabel}>Quantity:</label>
              <div className={styles.quantityControls}>
                <button 
                  className={styles.quantityButton}
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span className={styles.quantityDisplay}>{quantity}</span>
                <button 
                  className={styles.quantityButton}
                  onClick={increaseQuantity}
                  disabled={quantity >= product.stock}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className={styles.actionButtons}>
              <button 
                className={styles.buyNowButton}
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                <ShoppingCart size={18} />
                Buy Now
              </button>
              <button 
                className={`${styles.wishlistButton} ${isWishlisted ? styles.wishlisted : ''}`}
                onClick={handleWishlist}
              >
                <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.sellerSection}>
        <div className={styles.sellerProfile}>
          <div className={styles.sellerMainInfo}>
            <div className={styles.sellerLeft}>
              <div className={styles.sellerLogo}>
                <img 
                  src={sellerData?.logo || product.seller.logo || "/images/farm-logo-placeholder.jpg"} 
                  alt={sellerData?.name || product.seller.name}
                  className={styles.sellerLogoImage}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/farm-logo-placeholder.jpg";
                  }}
                />
              </div>
              <div className={styles.sellerBasicInfo}>
                <h3 className={styles.sellerName}>
                  {safeRender(sellerData?.name || product.seller.name, 'Seller')}
                </h3>
                <div className={styles.sellerActive}>
                  <span>Active {product.seller.activeTime || "recently"}</span>
                </div>
                <div className={styles.sellerAddress}>
                  <MapPin size={14} />
                  <span>
                    {/* ✅ FIXED: No more "Address not available" */}
                    {sellerData?.address ? 
                      safeRender(sellerData.address, 'Location available') : 
                      'Location available'
                    }
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.sellerActions}>
              <button 
                className={styles.visitButton}
                onClick={handleVisitSeller}
                disabled={!product.sellerId}
              >
                <Store size={16} />
                Visit Store
              </button>
              <button 
                className={styles.chatButton}
                onClick={handleChatWithSeller}
                disabled={!product.sellerId}
              >
                <MessageCircle size={16} />
                Chat
              </button>
            </div>
          </div>
          
          <div className={styles.sellerStats}>
            <div className={styles.sellerRating}>
              <span>{sellerData?.rating || product.seller.rating || 0} Rating</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tabsSection}>
        <nav className={styles.tabsNavigation}>
          <button 
            className={`${styles.tab} ${activeTab === 'description' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'reviews' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews ({product.reviewCount})
          </button>
          {/* 🟢 ADDED: Pricing tab */}
          <button 
            className={`${styles.tab} ${activeTab === 'pricing' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            Price Breakdown
          </button>
        </nav>
        
        <div className={styles.tabContent}>
          {activeTab === 'description' && (
            <div className={styles.descriptionContent}>
              <p>{safeRender(product.description, 'No description available')}</p>
            </div>
          )}
          
          {activeTab === 'reviews' && (
            <div className={styles.reviewsContent}>
              <div className={styles.reviewsSummary}>
                <div className={styles.averageRating}>
                  <span className={styles.ratingNumber}>{product.rating.toFixed(1)}</span>
                  <div className={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={20} 
                        fill={star <= Math.floor(product.rating) ? "#fbbf24" : "none"}
                        color="#fbbf24"
                      />
                    ))}
                  </div>
                  <span className={styles.totalReviews}>{product.reviewCount} reviews</span>
                </div>
                
                {totalReviewsWithMedia > 0 && (
                  <button className={styles.visualReviewsButton}>
                    <Image size={16} />
                    <span>Includes visual ({totalReviewsWithMedia})</span>
                  </button>
                )}
              </div>
              
              <div className={styles.ratingDistribution}>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <button 
                    key={rating} 
                    className={`${styles.ratingFilterButton} ${
                      selectedRating === rating ? styles.ratingFilterButtonActive : ''
                    }`}
                    onClick={() => handleRatingFilter(rating)}
                  >
                    <div className={styles.ratingStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={14} 
                          fill={star <= rating ? "#fbbf24" : "#e5e7eb"}
                          color={star <= rating ? "#fbbf24" : "#e5e7eb"}
                        />
                      ))}
                    </div>
                    <span className={styles.ratingCount}>({ratingDistribution[rating-1]})</span>
                  </button>
                ))}
                
                {selectedRating !== null && (
                  <button 
                    className={styles.clearFilterButton}
                    onClick={() => setSelectedRating(null)}
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              
              {selectedRating !== null && (
                <div className={styles.filterInfo}>
                  <span>
                    Showing {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''} with {selectedRating} star{selectedRating !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              
              <div className={styles.reviewsList}>
                {filteredReviews.length === 0 ? (
                  <div className={styles.noReviews}>
                    <p>No reviews yet for this product.</p>
                  </div>
                ) : (
                  filteredReviews.map((review) => (
                    <div key={review.id} className={styles.reviewItem}>
                      <div className={styles.reviewHeader}>
                        <div className={styles.reviewerInfo}>
                          <img 
                            src={review.buyerProfilePic || "/images/buyer-profile.jpg"} 
                            alt={review.buyerFullName || review.buyerName}
                            className={styles.reviewerAvatar}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/images/buyer-profile.jpg";
                            }}
                          />
                          <div className={styles.reviewerDetails}>
                            <span className={styles.reviewerName}>
                              {safeRender(review.buyerFullName || review.buyerName, 'Buyer')}
                            </span>
                            <div className={styles.reviewRating}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  size={14} 
                                  fill={star <= review.rating ? "#fbbf24" : "none"}
                                  color="#fbbf24"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        {getReviewMediaCount(review) > 0 && (
                          <button className={styles.reviewMediaButton}>
                            <div className={styles.mediaIcons}>
                              <Image size={14} />
                            </div>
                            <span>{getReviewMediaCount(review)}</span>
                          </button>
                        )}
                      </div>
                      <p className={styles.reviewComment}>{safeRender(review.reviewText, 'No review text')}</p>
                      
                      {review.productImage && (
                        <div className={styles.reviewMediaPreview}>
                          <div className={styles.mediaThumbnail}>
                            <img 
                              src={review.productImage} 
                              alt="Review image"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/images/placeholder.jpg";
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <span className={styles.reviewDate}>
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 🟢 ADDED: Pricing breakdown tab */}
          {activeTab === 'pricing' && (
            <div className={styles.pricingContent}>
              {priceBreakdown ? (
                <div className={styles.priceBreakdownContainer}>
                  <PriceBreakdown
                    marketPrice={priceBreakdown.marketPrice}
                    farmerMarkup={priceBreakdown.farmerMarkup}
                    platformFee={priceBreakdown.platformFee}
                    shippingFee={priceBreakdown.shippingFee}
                    vatAmount={priceBreakdown.vatAmount}
                    finalPrice={priceBreakdown.finalPrice}
                  />
                  
                  {/* Additional pricing information */}
                  <div className={styles.pricingDetails}>
                    <h4>📦 Delivery Information</h4>
                    <div className={styles.deliveryInfo}>
                      <div className={styles.deliveryItem}>
                        <span>Estimated Distance:</span>
                        <span>{product.estimatedDistance ? `${product.estimatedDistance.toFixed(1)} km` : 'Calculating...'}</span>
                      </div>
                      <div className={styles.deliveryItem}>
                        <span>Delivery Time:</span>
                        <span>{product.estimatedDeliveryTime || '30-45 min'}</span>
                      </div>
                      <div className={styles.deliveryItem}>
                        <span>From Location:</span>
                        <span>{safeRender(sellerData?.address || formatLocation(product.location), 'Location available')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.noPricingData}>
                  <p>Price breakdown information is being calculated...</p>
                  {!currentUserLocation && (
                    <p className={styles.locationWarning}>
                      💡 Enable location services for accurate shipping calculations
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <CartSidebar
        isOpen={isCartOpen}
        onClose={closeCart}
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onUpdateNotes={updateNotes}
        onPlaceOrder={handlePlaceOrder}
        onOrderSuccess={handleOrderSuccess}
        buyerInfo={buyerInfo}
        currentUserLocation={currentUserLocation}
      />

      <OrderSuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        orderData={orderSuccessData}
        buyerInfo={buyerInfo}
      />
    </div>
  );
}