"use client";
import ProductCard from "@/components/molecules/BuyerProductCard/ProductCard";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { db } from "../../../../utils/lib/firebase";
import { useAuth } from "../../../context/AuthContext";
import styles from "./freshArrivals.module.css";

interface Product {
  id: string;
  name: string;
  imageUrls?: string[];
  location: string;
  farmName: string;
  price: number;
  unit: string;
  sold?: number;
  category?: string;
  description?: string;
  stock: number;
  isActive: boolean;
  sellerId: string;
  createdAt: any;
  updatedAt: any;
  rating?: number;
  reviews?: number;
  deliveryFee?: number;
  deliveryTime?: string;
  // ✅ ADDED: Fields for real reviews
  reviewCount?: number;
  reviewList?: any[];
}

type ViewMode = "new" | "all";

export default function FreshArrivalsPage() {
  const [freshProducts, setFreshProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [indexCreating, setIndexCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("new");
  const [locationFilteredProducts, setLocationFilteredProducts] = useState<Product[]>([]);
  const [locationLoading, setLocationLoading] = useState(true);
  const sortRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  // ✅ ADDED: Function to fetch real reviews from Firebase
  const fetchProductReviews = async (productId: string) => {
    try {
      const reviewsQuery = query(
        collection(db, "reviews"),
        where("productId", "==", productId),
        where("isActive", "==", true),
        orderBy("createdAt", "desc")
      );
      
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return reviewsData;
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return [];
    }
  };

  // ✅ UPDATED: Enhanced city matching logic to match marketplace
  const fetchProductsWithRatingsAndLocation = async () => {
    try {
      setLoading(true);
      setLocationLoading(true);
      
      const productsRef = collection(db, "products");
      const q = query(
        productsRef,
        where("isActive", "==", true),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      
      // Fetch reviews for each product to calculate real ratings
      const productsWithRatings = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const productData = doc.data();
          const productId = doc.id;
          
          const realReviews = await fetchProductReviews(productId);
          
          const averageRating = realReviews.length > 0 
            ? realReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / realReviews.length
            : 0;

          return {
            id: productId,
            ...productData,
            rating: parseFloat(averageRating.toFixed(1)),
            reviewCount: realReviews.length,
            reviewList: realReviews,
          } as Product;
        })
      );
      
      console.log("🔄 All products fetched:", productsWithRatings.length);

      // ✅ UPDATED: Enhanced location filtering to match marketplace
      if (!user || !userProfile) {
        console.log("🔄 No user logged in, showing ALL products");
        setFreshProducts(productsWithRatings);
        setLocationFilteredProducts(productsWithRatings);
        setError("");
        return;
      }

      // ✅ UPDATED: Get buyer's city from both address and deliveryAddress (like marketplace)
      const buyerCity = userProfile.address?.city || userProfile.deliveryAddress?.city;
      console.log("🔄 Buyer city:", buyerCity);

      if (!buyerCity) {
        console.log("🔄 No buyer city found, showing ALL products");
        setFreshProducts(productsWithRatings);
        setLocationFilteredProducts(productsWithRatings);
        setError("");
        return;
      }

      // ✅ UPDATED: Fetch ALL sellers and create a map (like marketplace)
      const sellersQuery = await getDocs(collection(db, "sellers"));
      const sellerDataMap: { [sellerId: string]: any } = {};
      
      sellersQuery.docs.forEach(doc => {
        sellerDataMap[doc.id] = {
          id: doc.id,
          ...doc.data()
        };
      });

      console.log("🔄 Seller data map:", Object.keys(sellerDataMap).length);

      // ✅ UPDATED: Apply SAME-CITY MATCHING RULE (like marketplace)
      const sameCityProducts = productsWithRatings.filter(product => {
        const sellerId = product.sellerId;
        
        if (!sellerId) {
          console.log("🔄 Product has no seller ID, excluding:", product.id);
          return false;
        }

        const sellerData = sellerDataMap[sellerId];
        
        if (!sellerData) {
          console.log("🔄 Seller data not found for seller:", sellerId);
          return false;
        }

        const sellerCity = sellerData.address?.city;
        
        if (!sellerCity) {
          console.log("🔄 Seller city not found for seller:", sellerId);
          return false;
        }

        // 🟢 SAME-CITY MATCHING: Only include if seller city matches buyer city
        const isSameCity = sellerCity === buyerCity;
        
        if (isSameCity) {
          console.log(`✅ MATCH: Product ${product.name} from ${sellerCity} matches buyer in ${buyerCity}`);
        } else {
          console.log(`❌ NO MATCH: Product ${product.name} from ${sellerCity} doesn't match buyer in ${buyerCity}`);
        }
        
        return isSameCity;
      });

      console.log("🔄 Products before city filter:", productsWithRatings.length);
      console.log("🔄 Products after SAME-CITY matching:", sameCityProducts.length);

      // ✅ UPDATED: Set both product arrays correctly
      setFreshProducts(productsWithRatings); // All products (for debugging)
      setLocationFilteredProducts(sameCityProducts); // Same-city products only (for display)
      setError("");
      
    } catch (error: any) {
      console.error("Error fetching fresh arrivals:", error);
      
      if (error.code === 'failed-precondition') {
        setError("Index is being created. Please wait a few minutes and refresh.");
        setIndexCreating(true);
      } else {
        setError("Failed to load fresh arrivals. Please try again.");
      }
    } finally {
      setLoading(false);
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsWithRatingsAndLocation();
  }, [user, userProfile]);

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

  const handleAddToCart = async (product: any) => {
    console.log("Adding to cart:", product.name);
  };

  const handleViewDetails = (product: any) => {
    console.log("Viewing details:", product.name);
    router.push(`/buyer/marketplace/${product.id}`);
  };

  const handleSortSelect = (value: string) => {
    setSortBy(value);
    setIsSortOpen(false);
  };

  const getSelectedSortLabel = () => {
    const options = [
      { value: "newest", label: "Newest First" },
      { value: "rating", label: "Highest Rating" },
      { value: "price-low", label: "Price: Low to High" },
      { value: "price-high", label: "Price: High to Low" }
    ];
    return options.find(opt => opt.value === sortBy)?.label || "Newest First";
  };

  // ✅ UPDATED: Filter products that were created in the last 7 days (using locationFilteredProducts)
  const getNewProducts = (products: Product[]) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return products.filter(product => {
      let productDate: Date;
      
      if (product.createdAt && product.createdAt.toDate) {
        productDate = product.createdAt.toDate();
      } else if (product.createdAt && product.createdAt.seconds) {
        productDate = new Date(product.createdAt.seconds * 1000);
      } else {
        productDate = new Date();
      }
      
      return productDate >= oneWeekAgo;
    });
  };

  // ✅ UPDATED: Use ONLY locationFilteredProducts for all display logic
  const filteredProducts = locationFilteredProducts
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          let dateA: Date, dateB: Date;
          
          if (a.createdAt && a.createdAt.toDate) {
            dateA = a.createdAt.toDate();
          } else if (a.createdAt && a.createdAt.seconds) {
            dateA = new Date(a.createdAt.seconds * 1000);
          } else {
            dateA = new Date(0);
          }
          
          if (b.createdAt && b.createdAt.toDate) {
            dateB = b.createdAt.toDate();
          } else if (b.createdAt && b.createdAt.seconds) {
            dateB = new Date(b.createdAt.seconds * 1000);
          } else {
            dateB = new Date(0);
          }
          
          return dateB.getTime() - dateA.getTime();
          
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
          
        case "price-low":
          return a.price - b.price;
          
        case "price-high":
          return b.price - a.price;
          
        default: 
          return a.name.localeCompare(b.name);
      }
    });

  // ✅ UPDATED: Get new products from the location-filtered array
  const newProducts = getNewProducts(locationFilteredProducts);
  
  // ✅ UPDATED: Use location-filtered products for display
  const displayProducts = viewMode === "new" ? getNewProducts(filteredProducts) : filteredProducts;

  // Format product data
  const formatProductForCard = (product: Product) => {
    return {
      ...product,
      image: product.imageUrls?.[0] || "",
      price: product.price.toString(),
      sold: product.sold || 0,
      stock: product.stock || 0,
      rating: product.rating || 0,
      reviews: product.reviewCount || 0,
      deliveryFee: product.deliveryFee || Math.floor(Math.random() * 50) + 15,
      deliveryTime: product.deliveryTime || `${Math.floor(Math.random() * 30) + 15}-${Math.floor(Math.random() * 30) + 45} min`
    };
  };

  // Function to create the index (redirect to Firebase Console)
  const createIndex = () => {
    window.open("https://console.firebase.google.com/v1/r/project/farm2table-a06db/firestore/indexes?create_composite=Clxwcm9qZWN0cy9mYXJtMnRhYmxlLWEwNmRiL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9wcm9kdWN0cy9pbmRleGVzL0NJQ0FnTmlhdjRBSxABGgwKCGlzQWN0aXZlEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg", "_blank");
  };

  if (authLoading || locationLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Checking authentication and location...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading fresh products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>{error}</p>
          {indexCreating ? (
            <div className={styles.indexInfo}>
              <p>Firestore is creating the required index. This usually takes 2-5 minutes.</p>
              <button 
                onClick={() => window.location.reload()} 
                className={styles.retryButton}
              >
                Check Again
              </button>
              <button 
                onClick={createIndex}
                className={styles.indexButton}
              >
                Open Index Creation Page
              </button>
            </div>
          ) : (
            <button 
              onClick={() => window.location.reload()} 
              className={styles.retryButton}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* View Mode Toggle Buttons */}
      <div className={styles.viewToggle}>
        <button
          className={`${styles.toggleButton} ${viewMode === "new" ? styles.active : ""}`}
          onClick={() => setViewMode("new")}
        >
          New This Week ({getNewProducts(locationFilteredProducts).length})
        </button>
        <button
          className={`${styles.toggleButton} ${viewMode === "all" ? styles.active : ""}`}
          onClick={() => setViewMode("all")}
        >
          All Recent Arrivals ({locationFilteredProducts.length})
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search fresh products, farms, or descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterControls}>
          <div className={styles.dropdownContainer} ref={sortRef}>
            <button 
              className={`${styles.dropdownButton} ${sortBy !== "newest" ? styles.active : ''}`}
              onClick={() => setIsSortOpen(!isSortOpen)}
            >
              <span>{getSelectedSortLabel()}</span>
              <span className={`${styles.arrow} ${isSortOpen ? styles.arrowUp : styles.arrowDown}`}></span>
            </button>
            
            {isSortOpen && (
              <div className={styles.dropdownList}>
                <button
                  className={`${styles.dropdownItem} ${sortBy === "newest" ? styles.selected : ''}`}
                  onClick={() => handleSortSelect("newest")}
                >
                  <span>Newest First</span>
                </button>
                <button
                  className={`${styles.dropdownItem} ${sortBy === "rating" ? styles.selected : ''}`}
                  onClick={() => handleSortSelect("rating")}
                >
                  <span>Highest Rating</span>
                </button>
                <button
                  className={`${styles.dropdownItem} ${sortBy === "price-low" ? styles.selected : ''}`}
                  onClick={() => handleSortSelect("price-low")}
                >
                  <span>Price: Low to High</span>
                </button>
                <button
                  className={`${styles.dropdownItem} ${sortBy === "price-high" ? styles.selected : ''}`}
                  onClick={() => handleSortSelect("price-high")}
                >
                  <span>Price: High to Low</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {displayProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <p>
            {viewMode === "new" 
              ? "No new products this week from farmers in your city." 
              : "No products found matching your criteria."}
          </p>
          <p className={styles.emptySubtext}>
            {viewMode === "new"
              ? "Check back later for new arrivals from farmers in your area."
              : "Try adjusting your search or filters."}
          </p>
          {/* ✅ UPDATED: Better debug info */}
          {userProfile?.address?.city || userProfile?.deliveryAddress?.city ? (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
              💡 SAME-CITY RULE: Only showing products from farmers in {userProfile?.address?.city || userProfile?.deliveryAddress?.city}
              <br />
              Total products in your city: {locationFilteredProducts.length}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
              Showing all products - no city filter applied
            </div>
          )}
        </div>
      ) : (
        <div className={styles.productsContainer}>
          {displayProducts.map((product) => (
            <div key={product.id} className={styles.gridItem}>
              {/* Show NEW badge only for new products in "all" view mode */}
              {viewMode === "all" && getNewProducts([product]).length > 0 && (
                <div className={styles.newBookmark}></div>
              )}
              {/* Always show NEW badge in "new" view mode */}
              {viewMode === "new" && (
                <div className={styles.newBookmark}></div>
              )}
              <ProductCard
                product={formatProductForCard(product)}
                onAddToCart={handleAddToCart}
                onViewDetails={handleViewDetails}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}