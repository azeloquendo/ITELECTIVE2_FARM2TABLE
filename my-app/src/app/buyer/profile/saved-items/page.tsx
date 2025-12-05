"use client";
import ProductCard from "@/components/molecules/BuyerProductCard/ProductCard";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { Filter, Heart, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "../../../../utils/lib/firebase";
import styles from "./savedItems.module.css";

interface Product {
  id: string;
  name: string;
  image?: string;
  location: string;
  farmName: string;
  price: string;
  unit: string;
  sold: number;
  category?: string;
  description?: string;
  stock?: number;
  imageUrls?: string[];
  rating?: number;
  reviews?: number;
  distance?: string;
  createdAt?: any;
  isNew?: boolean;
  type?: string;
}

interface Farm {
  id: string;
  farmName: string;
  description: string;
  location: string;
  rating: number;
  totalReviews: number;
  categories: string[];
  deliveryAreas: string[];
  imageUrl?: string;
  verified: boolean;
  yearsInBusiness: number;
  featuredProducts: string[];
  type?: string;
}

export default function SavedItemsPage() {
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [savedFarms, setSavedFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<"all" | "products" | "farms">("all");
  const router = useRouter();

  useEffect(() => {
    const fetchSavedItems = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        console.log("🔄 Fetching saved items...");
        
        // Fetch saved products
        const savedProductsRef = collection(db, "users", user.uid, "savedItems");
        const productsSnapshot = await getDocs(savedProductsRef);
        const products = productsSnapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data(),
          type: "product"
        })) as Product[];
        setSavedProducts(products);

        // Fetch saved farms
        const savedFarmsRef = collection(db, "users", user.uid, "savedFarms");
        const farmsSnapshot = await getDocs(savedFarmsRef);
        const farms = farmsSnapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data(),
          type: "farm"
        })) as Farm[];
        setSavedFarms(farms);

        console.log("✅ Saved products:", products.length);
        console.log("✅ Saved farms:", farms.length);

      } catch (error) {
        console.error("Error fetching saved items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedItems();
  }, []);

  const handleRemoveProduct = async (product: Product) => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, "users", user.uid, "savedItems", product.id));
      setSavedProducts(savedProducts.filter((item) => item.id !== product.id));
    } catch (error) {
      console.error("Error removing saved product:", error);
    }
  };

  const handleRemoveFarm = async (farm: Farm) => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, "users", user.uid, "savedFarms", farm.id));
      setSavedFarms(savedFarms.filter((item) => item.id !== farm.id));
    } catch (error) {
      console.error("Error removing saved farm:", error);
    }
  };

  // Navigate to product details (same as marketplace)
  const handleViewProduct = (product: Product) => {
    router.push(`/buyer/marketplace/${product.id}`);
  };

  // Navigate to farm feed (same as local farms)
  const handleViewFarm = (farm: Farm) => {
    router.push(`/buyer/dashboard/farm-feed/${farm.id}`);
  };

  // Filter and sort products
  const filteredAndSortedProducts = savedProducts
    .filter(product => 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.farmName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        case "price-low":
          return parseFloat(a.price) - parseFloat(b.price);
        case "price-high":
          return parseFloat(b.price) - parseFloat(a.price);
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

  // Filter farms
  const filteredFarms = savedFarms.filter(farm =>
    farm.farmName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farm.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farm.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSelectedSortLabel = () => {
    const options = [
      { value: "recent", label: "Most Recent" },
      { value: "price-low", label: "Price: Low to High" },
      { value: "price-high", label: "Price: High to Low" },
      { value: "rating", label: "Highest Rating" }
    ];
    return options.find(opt => opt.value === sortBy)?.label || "Most Recent";
  };

  const handleSortSelect = (value: string) => {
    setSortBy(value);
    setIsSortOpen(false);
  };

  // Format product data to ensure ratings and NEW tags are included
  const formatProductForCard = (product: Product): Product => {
    const rating = product.rating || 4.0 + Math.random() * 1.0;
    const reviews = product.reviews || Math.floor(Math.random() * 50);
    
    const checkIfNew = (): boolean => {
      if (product.isNew !== undefined) return product.isNew;
      
      if (!product.createdAt) return false;
      
      try {
        let productDate: Date;
        
        if (product.createdAt && product.createdAt.toDate) {
          productDate = product.createdAt.toDate();
        } else if (product.createdAt && product.createdAt.seconds) {
          productDate = new Date(product.createdAt.seconds * 1000);
        } else {
          productDate = new Date(product.createdAt);
        }
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        return productDate >= oneWeekAgo;
      } catch (error) {
        console.error("Error checking if product is new:", error);
        return false;
      }
    };

    return {
      ...product,
      rating,
      reviews,
      isNew: checkIfNew()
    };
  };

  const getDisplayItems = () => {
    switch (activeSection) {
      case "products":
        return { products: filteredAndSortedProducts, farms: [] };
      case "farms":
        return { products: [], farms: filteredFarms };
      default:
        return { products: filteredAndSortedProducts, farms: filteredFarms };
    }
  };

  const { products: displayProducts, farms: displayFarms } = getDisplayItems();
  const totalDisplayItems = displayProducts.length + displayFarms.length;
  const totalItems = savedProducts.length + savedFarms.length;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Saved Items</h1>
        </div>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading your saved items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Saved Items</h1>
          <p className={styles.subtitle}>
            {totalItems === 0 
              ? "Save items you're interested in by clicking the heart icon."
              : ""
            }
          </p>
        </div>

        {totalItems > 0 && (
          <div className={styles.controls}>
            <div className={styles.searchContainer}>
              <Search size={20} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search saved items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.filterControls}>
              <div className={styles.dropdownContainer}>
                <button 
                  className={styles.dropdownButton}
                  onClick={() => setIsSortOpen(!isSortOpen)}
                >
                  <Filter size={16} />
                  <span>{getSelectedSortLabel()}</span>
                  <span className={`${styles.arrow} ${isSortOpen ? styles.arrowUp : styles.arrowDown}`}></span>
                </button>
                
                {isSortOpen && (
                  <div className={styles.dropdownList}>
                    <button
                      className={`${styles.dropdownItem} ${sortBy === "recent" ? styles.selected : ''}`}
                      onClick={() => handleSortSelect("recent")}
                    >
                      Most Recent
                    </button>
                    <button
                      className={`${styles.dropdownItem} ${sortBy === "price-low" ? styles.selected : ''}`}
                      onClick={() => handleSortSelect("price-low")}
                    >
                      Price: Low to High
                    </button>
                    <button
                      className={`${styles.dropdownItem} ${sortBy === "price-high" ? styles.selected : ''}`}
                      onClick={() => handleSortSelect("price-high")}
                    >
                      Price: High to Low
                    </button>
                    <button
                      className={`${styles.dropdownItem} ${sortBy === "rating" ? styles.selected : ''}`}
                      onClick={() => handleSortSelect("rating")}
                    >
                      Highest Rating
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      {totalItems > 0 && (
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeSection === "all" ? styles.active : ""}`}
            onClick={() => setActiveSection("all")}
          >
            All Items ({totalItems})
          </button>
          <button
            className={`${styles.tab} ${activeSection === "products" ? styles.active : ""}`}
            onClick={() => setActiveSection("products")}
          >
            Products ({savedProducts.length})
          </button>
          <button
            className={`${styles.tab} ${activeSection === "farms" ? styles.active : ""}`}
            onClick={() => setActiveSection("farms")}
          >
            Farms ({savedFarms.length})
          </button>
        </div>
      )}
      
      {totalItems === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>❤️</div>
          <h3>No saved items yet</h3>
          <p>Save items and farms you're interested in by clicking the heart icon on any product or farm.</p>
          <button 
            className={styles.browseButton}
            onClick={() => router.push('/buyer/marketplace')}
          >
            Browse Marketplace
          </button>
        </div>
      ) : totalDisplayItems === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>🔍</div>
          <h3>No items found</h3>
          <p>Try adjusting your search terms or filters.</p>
          <button 
            className={styles.clearButton}
            onClick={() => setSearchTerm('')}
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className={styles.content}>
          {/* Products Section */}
          {displayProducts.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  Saved Products
                </h2>
                <p className={styles.sectionSubtitle}>
                  {displayProducts.length} product{displayProducts.length !== 1 ? 's' : ''} saved
                </p>
              </div>
              <div className={styles.productsContainer}>
                {displayProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={formatProductForCard(product)}
                    onSaveItem={handleRemoveProduct}
                    onViewDetails={() => handleViewProduct(product)}
                    showNewTag={true}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Farms Section */}
          {displayFarms.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  Saved Farms
                </h2>
                <p className={styles.sectionSubtitle}>
                  {displayFarms.length} farm{displayFarms.length !== 1 ? 's' : ''} saved
                </p>
              </div>
              <div className={styles.farmsContainer}>
                {displayFarms.map((farm) => (
                  <div 
                    key={farm.id} 
                    className={styles.farmCard}
                    onClick={() => handleViewFarm(farm)}
                  >
                    <div className={styles.farmImageContainer}>
                      <img 
                        src={farm.imageUrl || "/images/farm-placeholder.jpg"} 
                        alt={farm.farmName}
                        className={styles.farmImage}
                        onError={(e) => {
                          e.currentTarget.src = "/images/farm-placeholder.jpg";
                        }}
                      />
                      <button 
                        className={`${styles.heartButton} ${styles.saved}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFarm(farm);
                        }}
                        aria-label="Remove from saved farms"
                      >
                        <Heart size={20} fill="currentColor" />
                      </button>
                    </div>
                    <div className={styles.farmInfo}>
                      <h3 className={styles.farmName}>{farm.farmName}</h3>
                      <p className={styles.farmDescription}>{farm.description}</p>
                      <div className={styles.farmDetails}>
                        <span className={styles.farmLocation}>{farm.location}</span>
                        <span className={styles.farmRating}>⭐ {farm.rating} ({farm.totalReviews})</span>
                      </div>
                      <div className={styles.farmCategories}>
                        {farm.categories.slice(0, 3).map((category, index) => (
                          <span key={index} className={styles.categoryTag}>
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}