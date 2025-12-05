"use client";
import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  MapPin, 
  Star, 
  Store,
  Award,
  CheckCircle,
  Heart,
  Sprout,
  Egg,
  Mountain,
  Fish,
  Users,
  Leaf,
  Trees
} from "lucide-react";
import { collection, getDocs, query, where, doc, setDoc, deleteDoc, getDoc, orderBy } from "firebase/firestore";
import { db, auth } from "../../../../utils/lib/firebase";
import styles from "./localFarms.module.css";

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
  address?: {
    city?: string;
    barangay?: string;
    province?: string;
  };
}

interface DropdownOption {
  value: string;
  label: string;
}

// All Zambales cities and municipalities
const zambalesCitiesMunicipalities = [
  { city: "Olongapo City", city_code: "037109000" },
  { city: "Botolan", city_code: "037101000" },
  { city: "Cabangan", city_code: "037102000" },
  { city: "Candelaria", city_code: "037103000" },
  { city: "Castillejos", city_code: "037104000" },
  { city: "Iba", city_code: "037105000" },
  { city: "Masinloc", city_code: "037106000" },
  { city: "Palauig", city_code: "037107000" },
  { city: "San Antonio", city_code: "037108000" },
  { city: "San Felipe", city_code: "037110000" },
  { city: "San Marcelino", city_code: "037111000" },
  { city: "San Narciso", city_code: "037112000" },
  { city: "Santa Cruz", city_code: "037113000" },
  { city: "Subic", city_code: "037114000" }
];

// Category icons mapping
const getCategoryIcon = (category: string) => {
  const iconProps = { size: 20 };
  switch (category.toLowerCase()) {
    case 'organic certified':
      return <Leaf {...iconProps} />;
    case 'family-owned':
      return <Users {...iconProps} />;
    case 'sustainable farming':
      return <Sprout {...iconProps} />;
    case 'poultry':
      return <Egg {...iconProps} />;
    case 'mountain grown':
      return <Mountain {...iconProps} />;
    case 'dairy':
      return <Trees {...iconProps} />;
    case 'aquaculture':
    case 'seafood':
      return <Fish {...iconProps} />;
    case 'livestock':
      return <Users {...iconProps} />;
    case 'produce':
      return <Sprout {...iconProps} />;
    case 'vegetables':
      return <Sprout {...iconProps} />;
    case 'fruits':
      return <Sprout {...iconProps} />;
    default:
      return <Sprout {...iconProps} />;
  }
};

export default function LocalFarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [filteredFarms, setFilteredFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [savedFarms, setSavedFarms] = useState<Set<string>>(new Set());

  const categoryRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  const PLACEHOLDER_IMAGE = "https://via.placeholder.com/400x300?text=Farm+Image";

  // Category options
  const categoryOptions: DropdownOption[] = [
    { value: "all", label: "All Farms" },
    { value: "Organic Certified", label: "Organic Certified" },
    { value: "Family-Owned", label: "Family-Owned" },
    { value: "Sustainable Farming", label: "Sustainable Farming" },
    { value: "Livestock", label: "Livestock" },
    { value: "Produce", label: "Produce" },
    { value: "Dairy", label: "Dairy" },
    { value: "Poultry", label: "Poultry" },
    { value: "Vegetables", label: "Vegetables" },
    { value: "Fruits", label: "Fruits" }
  ];

  // ✅ UPDATED: Use all Zambales cities for location options
  const locationOptions: DropdownOption[] = [
    { value: "all", label: "All Areas" },
    ...zambalesCitiesMunicipalities.map(city => ({ 
      value: city.city, 
      label: city.city 
    }))
  ];

  // ✅ ADDED: Function to count farms in each city
  const getFarmCountByCity = (city: string) => {
    if (city === "all") return farms.length;
    
    return farms.filter(farm => {
      const farmCity = farm.address?.city || farm.location;
      return farmCity === city;
    }).length;
  };

  // ✅ ADDED: Function to fetch real reviews for a seller's products
  const fetchSellerReviews = async (sellerId: string) => {
    try {
      const productsRef = collection(db, "products");
      const productsQuery = query(
        productsRef,
        where("sellerId", "==", sellerId),
        where("isActive", "==", true)
      );
      
      const productsSnapshot = await getDocs(productsQuery);
      const productIds = productsSnapshot.docs.map(doc => doc.id);
      
      if (productIds.length === 0) {
        return { averageRating: 0, totalReviews: 0 };
      }

      const reviewsRef = collection(db, "reviews");
      const reviewsQuery = query(
        reviewsRef,
        where("productId", "in", productIds),
        where("isActive", "==", true)
      );
      
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (reviewsData.length === 0) {
        return { averageRating: 0, totalReviews: 0 };
      }

      const totalRating = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0);
      const averageRating = totalRating / reviewsData.length;

      return {
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews: reviewsData.length
      };

    } catch (error) {
      console.error("Error fetching seller reviews:", error);
      return { averageRating: 0, totalReviews: 0 };
    }
  };

  // ✅ UPDATED: SIMPLIFIED backend logic from working version
  useEffect(() => {
    const fetchAllSellers = async () => {
      try {
        setLoading(true);
        console.log("🔄 Fetching ALL sellers from Firebase...");
        
        const sellersRef = collection(db, "sellers");
        const querySnapshot = await getDocs(sellersRef);
        
        console.log("📥 RAW SELLERS DATA:", querySnapshot.docs.length, "documents found");
        
        const farmsList: Farm[] = [];
        
        for (const doc of querySnapshot.docs) {
          const sellerData = doc.data();
          console.log("🔍 PROCESSING SELLER:", {
            id: doc.id,
            farmName: sellerData.farmName,
            hasFarmName: !!sellerData.farmName,
            address: sellerData.address,
            location: sellerData.location,
            farm: sellerData.farm
          });

          // ✅ SHOW ALL SELLERS THAT HAVE farmName OR farm.farmName
          const farmName = sellerData.farmName || sellerData.farm?.farmName;
          
          if (farmName) {
            // Get location from address or farm data
            const location = sellerData.address?.city || 
                           sellerData.location || 
                           sellerData.farm?.location || 
                           "Zambales";
            
            // Get description from farm data or use default
            const description = sellerData.description || 
                              sellerData.farm?.description || 
                              "A local farm providing fresh products";

            // Get image from various possible fields
            const imageUrl = sellerData.farmImage || 
                           sellerData.logo || 
                           sellerData.coverPhoto || 
                           sellerData.farm?.logo ||
                           PLACEHOLDER_IMAGE;

            // ✅ GET REAL RATINGS FROM REVIEWS
            const realRatings = await fetchSellerReviews(doc.id);

            const farm: Farm = {
              id: doc.id,
              farmName: farmName,
              description: description,
              location: location,
              rating: realRatings.averageRating > 0 ? realRatings.averageRating : 4.5,
              totalReviews: realRatings.totalReviews,
              categories: sellerData.categories || ["Local Farm"],
              deliveryAreas: sellerData.deliveryAreas || [location],
              verified: sellerData.verified || false,
              yearsInBusiness: sellerData.yearsInBusiness || 1,
              featuredProducts: sellerData.featuredProducts || [],
              imageUrl: imageUrl,
              address: sellerData.address
            };

            console.log("✅ ADDED FARM:", farm.farmName, "in", farm.location);
            farmsList.push(farm);
          } else {
            console.log("❌ SKIPPING - No farm name:", doc.id, sellerData);
          }
        }

        console.log("🎯 FINAL FARMS LIST:", farmsList);
        console.log("📍 ALL FARM LOCATIONS:", farmsList.map(f => `${f.farmName} - ${f.location}`));
        
        setFarms(farmsList);
        setFilteredFarms(farmsList);

      } catch (error) {
        console.error("❌ ERROR FETCHING SELLERS:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllSellers();
  }, []);

  // ✅ FIXED: Check if farms are already saved when component loads
  useEffect(() => {
    const checkSavedFarms = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const newSavedFarms = new Set<string>();
      
      for (const farm of farms) {
        try {
          const savedItemRef = doc(db, "users", user.uid, "savedFarms", farm.id);
          const snap = await getDoc(savedItemRef);
          if (snap.exists()) {
            newSavedFarms.add(farm.id);
          }
        } catch (error) {
          console.error("Error checking saved farm:", error);
        }
      }
      
      setSavedFarms(newSavedFarms);
    };

    if (farms.length > 0) {
      checkSavedFarms();
    }
  }, [farms]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ UPDATED: SIMPLIFIED filtering - show ALL farms by default
  useEffect(() => {
    console.log("🔄 APPLYING FILTERS...", {
      totalFarms: farms.length,
      searchTerm,
      selectedCategory,
      selectedLocation
    });

    let result = [...farms]; // Start with ALL farms

    // Search filter
    if (searchTerm) {
      result = result.filter(farm =>
        farm.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        farm.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (farm.categories && farm.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter(farm => 
        farm.categories && farm.categories.includes(selectedCategory)
      );
    }

    // Location filter
    if (selectedLocation !== "all") {
      result = result.filter(farm => {
        const farmCity = farm.address?.city || farm.location;
        console.log(`📍 Checking: ${farm.farmName} - City: ${farmCity} vs Filter: ${selectedLocation}`);
        return farmCity === selectedLocation;
      });
    }

    console.log("🎯 FILTERED RESULT:", result.length, "farms");
    setFilteredFarms(result);
  }, [farms, searchTerm, selectedCategory, selectedLocation]);

  // Save farm function
  const handleSaveFarm = async (farmId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to save farms.");
      return;
    }

    const savedFarmRef = doc(db, "users", user.uid, "savedFarms", farmId);

    try {
      if (!savedFarms.has(farmId)) {
        const farm = farms.find(f => f.id === farmId);
        if (farm) {
          await setDoc(savedFarmRef, {
            id: farm.id,
            farmName: farm.farmName,
            description: farm.description,
            location: farm.location,
            rating: farm.rating,
            totalReviews: farm.totalReviews,
            categories: farm.categories,
            deliveryAreas: farm.deliveryAreas,
            imageUrl: farm.imageUrl,
            verified: farm.verified,
            yearsInBusiness: farm.yearsInBusiness,
            featuredProducts: farm.featuredProducts,
            savedAt: new Date().toISOString(),
            type: "farm"
          });
        }
      } else {
        await deleteDoc(savedFarmRef);
      }

      setSavedFarms(prev => {
        const newSaved = new Set(prev);
        if (newSaved.has(farmId)) {
          newSaved.delete(farmId);
        } else {
          newSaved.add(farmId);
        }
        return newSaved;
      });

    } catch (error) {
      console.error("Error saving farm:", error);
      alert("Failed to save farm. Please try again.");
    }
  };

  const handleCategorySelect = (value: string) => {
    setSelectedCategory(value);
    setIsCategoryOpen(false);
  };

  const handleLocationSelect = (value: string) => {
    setSelectedLocation(value);
    setIsLocationOpen(false);
  };

  const handleViewFarm = (farmId: string) => {
    window.location.href = `/buyer/dashboard/farm-feed/${farmId}`;
  };

  const getSelectedCategoryLabel = () => {
    return categoryOptions.find(opt => opt.value === selectedCategory)?.label || "All Farms";
  };

  const getSelectedLocationLabel = () => {
    return locationOptions.find(opt => opt.value === selectedLocation)?.label || "All Areas";
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading all farms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header REMOVED */}

      {/* Stats Overview */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <h3>{farms.length}</h3>
            <p>Total Farms</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <h3>{farms.filter(f => f.rating >= 4.5 && f.totalReviews > 0).length}</h3>
            <p>Highly Rated</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <h3>{farms.filter(f => f.verified).length}</h3>
            <p>Verified Farms</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <h3>{farms.filter(f => f.totalReviews > 0).length}</h3>
            <p>Farms with Reviews</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search farms, specialties, or locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          {/* Category Dropdown */}
          <div className={styles.dropdownContainer} ref={categoryRef}>
            <button 
              className={`${styles.dropdownButton} ${selectedCategory !== "all" ? styles.active : ''}`}
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            >
              <span>{getSelectedCategoryLabel()}</span>
              <span className={`${styles.arrow} ${isCategoryOpen ? styles.arrowUp : styles.arrowDown}`}></span>
            </button>
            
            {isCategoryOpen && (
              <div className={styles.dropdownList}>
                {categoryOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`${styles.dropdownItem} ${selectedCategory === option.value ? styles.selected : ''}`}
                    onClick={() => handleCategorySelect(option.value)}
                  >
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location Dropdown */}
          <div className={styles.dropdownContainer} ref={locationRef}>
            <button 
              className={`${styles.dropdownButton} ${selectedLocation !== "all" ? styles.active : ''}`}
              onClick={() => setIsLocationOpen(!isLocationOpen)}
            >
              <span>{getSelectedLocationLabel()}</span>
              <span className={`${styles.arrow} ${isLocationOpen ? styles.arrowUp : styles.arrowDown}`}></span>
            </button>
            
            {isLocationOpen && (
              <div className={styles.dropdownList}>
                {locationOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`${styles.dropdownItem} ${selectedLocation === option.value ? styles.selected : ''}`}
                    onClick={() => handleLocationSelect(option.value)}
                  >
                    <span>{option.label}</span>
                    {option.value !== "all" && (
                      <span className={styles.farmCount}>
                        ({getFarmCountByCity(option.value)})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Farms Grid */}
      {filteredFarms.length === 0 ? (
        <div className={styles.emptyState}>
          <Store size={48} className={styles.emptyIcon} />
          <p>No farms found matching your criteria.</p>
          <p>Try adjusting your search or filters.</p>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Total farms in database: {farms.length} | 
            Search: "{searchTerm}" | Category: "{selectedCategory}" | Location: "{selectedLocation}"
          </div>
        </div>
      ) : (
        <div className={styles.farmsGrid}>
          {filteredFarms.map((farm) => (
            <div key={farm.id} className={styles.farmCard}>
              {/* Rating on top right */}
              <div className={styles.farmRating}>
                <div className={styles.rating}>
                  <Star size={14} fill="#fbbf24" color="#fbbf24" />
                  <span>{farm.rating}</span>
                  <span className={styles.reviewCount}>({farm.totalReviews})</span>
                </div>
              </div>

              {/* Farm Image as Circle */}
              <div className={styles.farmImageContainer}>
                <img 
                  src={farm.imageUrl || PLACEHOLDER_IMAGE} 
                  alt={farm.farmName}
                  className={styles.farmImage}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = PLACEHOLDER_IMAGE;
                  }}
                />
              </div>

              {/* Farm Name and Location - Centered */}
              <div className={styles.farmHeader}>
                <h3 className={styles.farmName}>{farm.farmName}</h3>
                <div className={styles.farmLocation}>
                  <MapPin size={16} />
                  <span>{farm.location}</span>
                  {farm.address?.city && farm.address.city !== farm.location && (
                    <span className={styles.cityBadge}>({farm.address.city})</span>
                  )}
                </div>
              </div>

              {/* Category Tags as Circles with Different Colors */}
              <div className={styles.categories}>
                {farm.categories.slice(0, 3).map((category, index) => {
                  const getCategoryClass = (cat: string) => {
                    const lowerCat = cat.toLowerCase();
                    if (lowerCat.includes('organic')) return 'organic';
                    if (lowerCat.includes('family')) return 'family';
                    if (lowerCat.includes('sustainable')) return 'sustainable';
                    if (lowerCat.includes('poultry')) return 'poultry';
                    if (lowerCat.includes('dairy')) return 'dairy';
                    if (lowerCat.includes('aquaculture') || lowerCat.includes('seafood')) return 'aquaculture';
                    if (lowerCat.includes('livestock')) return 'livestock';
                    if (lowerCat.includes('produce') || lowerCat.includes('vegetables') || lowerCat.includes('fruits')) return 'produce';
                    return 'organic';
                  };

                  const categoryClass = getCategoryClass(category);
                  
                  return (
                    <div key={index} className={styles.categoryCircleContainer}>
                      <div className={`${styles.categoryCircle} ${styles[categoryClass]}`}>
                        {getCategoryIcon(category)}
                      </div>
                      <div className={styles.categoryTooltip}>
                        {category}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Description */}
              <p className={styles.farmDescription}>
                {farm.description}
              </p>

              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                <button 
                  className={`${styles.heartButton} ${savedFarms.has(farm.id) ? styles.saved : ''}`}
                  onClick={(e) => handleSaveFarm(farm.id, e)}
                  type="button"
                  aria-label={savedFarms.has(farm.id) ? "Remove from saved farms" : "Save farm"}
                >
                  <Heart 
                    size={18} 
                    fill={savedFarms.has(farm.id) ? "currentColor" : "none"}
                  />
                  <span>{savedFarms.has(farm.id) ? "Saved" : "Save"}</span>
                </button>
                <button 
                  className={styles.viewFarmBtn}
                  onClick={() => handleViewFarm(farm.id)}
                >
                  View Farm
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}