// Buyer marketplace service functions
import {
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    where
} from 'firebase/firestore';
import { MATCH_REASONS, SMART_MATCHING_WEIGHTS, SMART_THRESHOLDS } from '../../constants/buyer/marketplace';
import { MarketplaceProduct, SmartMatchingScores, UserLocation } from '../../interface/buyer/marketplace';
import { db } from '../../utils/lib/firebase';

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate proximity score
export const calculateProximityScore = (
  distance: number,
  maxDistance: number = SMART_THRESHOLDS.maxDistance
): number => {
  if (distance > maxDistance) return 0;
  return Math.max(0, 1 - (distance / maxDistance));
};

// Calculate price score
export const calculatePriceScore = (
  productPrice: number,
  avgCategoryPrice: number
): number => {
  if (!avgCategoryPrice || avgCategoryPrice === 0) return 0.5;
  
  const priceRatio = productPrice / avgCategoryPrice;
  if (priceRatio < 0.7) return 0.7;
  if (priceRatio > 1.3) return 0.3;
  return 1 - (priceRatio - 0.7) / 0.6;
};

// Calculate demand score
export const calculateDemandScore = (soldCount: number, stock: number): number => {
  if (stock === 0) return 0;
  const sellThroughRate = soldCount / (soldCount + stock);
  return Math.min(1, sellThroughRate * 2);
};

// Calculate rating score
export const calculateRatingScore = (rating: number): number => {
  return rating / 5;
};

// Get match reason
export const getMatchReason = (scores: SmartMatchingScores): string => {
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === scores.proximity) return MATCH_REASONS.proximity;
  if (maxScore === scores.price) return MATCH_REASONS.price;
  if (maxScore === scores.demand) return MATCH_REASONS.demand;
  if (maxScore === scores.rating) return MATCH_REASONS.rating;
  return MATCH_REASONS.balanced;
};

// Calculate smart matching score
export const calculateSmartScore = (
  product: MarketplaceProduct,
  userLocation: UserLocation | null,
  avgCategoryPrice: number
): { score: number; reason: string; distance?: number } => {
  const scores: SmartMatchingScores = {
    proximity: 0,
    price: 0,
    demand: 0,
    rating: 0,
  };

  // Proximity score
  if (userLocation && product.farmer?.location) {
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      product.farmer.location.lat,
      product.farmer.location.lng
    );
    scores.proximity = calculateProximityScore(distance);
    product.distance = distance;
  } else {
    scores.proximity = 0.5; // Default if no location
  }

  // Price score
  if (product.price && avgCategoryPrice) {
    scores.price = calculatePriceScore(product.price, avgCategoryPrice);
  } else {
    scores.price = 0.5;
  }

  // Demand score
  const soldCount = product.sold || 0;
  const stock = product.stock || product.quantity_available || 0;
  scores.demand = calculateDemandScore(soldCount, stock);

  // Rating score
  const rating = product.rating || 0;
  scores.rating = calculateRatingScore(rating);

  // Calculate weighted score
  const smartScore =
    scores.proximity * SMART_MATCHING_WEIGHTS.proximity +
    scores.price * SMART_MATCHING_WEIGHTS.price +
    scores.demand * SMART_MATCHING_WEIGHTS.demand +
    scores.rating * SMART_MATCHING_WEIGHTS.rating;

  const reason = getMatchReason(scores);

  return {
    score: smartScore,
    reason,
    distance: product.distance,
  };
};

// Fetch products from Firestore
export const fetchProducts = async (category: string = 'all'): Promise<MarketplaceProduct[]> => {
  try {
    let productsQuery;
    
    // Remove orderBy to avoid composite index requirement - we'll sort client-side
    if (category === 'all') {
      productsQuery = query(
        collection(db, 'products'),
        where('status', '==', 'active')
      );
    } else {
      productsQuery = query(
        collection(db, 'products'),
        where('status', '==', 'active'),
        where('category', '==', category)
      );
    }

    const snapshot = await getDocs(productsQuery);
    const products: MarketplaceProduct[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      // Fetch seller/farmer data
      let farmerData = null;
      if (data.farmer_id) {
        try {
          const farmerDoc = await getDoc(doc(db, 'sellers', data.farmer_id));
          if (farmerDoc.exists()) {
            farmerData = farmerDoc.data();
          }
        } catch (error) {
          console.error(`Error fetching farmer data for ${data.farmer_id}:`, error);
        }
      }

      products.push({
        id: docSnap.id,
        ...data,
        farmer: farmerData ? {
          location: farmerData.farm?.location,
          barangay: farmerData.farm?.barangay,
          displayName: farmerData.farm?.farmName,
          fullName: farmerData.fullName,
        } : undefined,
      } as MarketplaceProduct);
    }

    // Sort by createdAt descending on client-side
    products.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
      const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
      return bTime - aTime;
    });

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Calculate category averages
export const calculateCategoryAverages = (
  products: MarketplaceProduct[]
): Record<string, number> => {
  const categoryTotals: Record<string, { sum: number; count: number }> = {};

  products.forEach((product) => {
    if (product.price && product.category) {
      if (!categoryTotals[product.category]) {
        categoryTotals[product.category] = { sum: 0, count: 0 };
      }
      categoryTotals[product.category].sum += product.price;
      categoryTotals[product.category].count += 1;
    }
  });

  const averages: Record<string, number> = {};
  Object.keys(categoryTotals).forEach((category) => {
    averages[category] =
      categoryTotals[category].sum / categoryTotals[category].count;
  });

  return averages;
};

// Sort products
export const sortProducts = (
  products: MarketplaceProduct[],
  sortBy: string
): MarketplaceProduct[] => {
  const sorted = [...products];

  switch (sortBy) {
    case 'proximity':
      return sorted.sort((a, b) => {
        const aDistance = typeof a.distance === 'number' ? a.distance : Number.POSITIVE_INFINITY;
        const bDistance = typeof b.distance === 'number' ? b.distance : Number.POSITIVE_INFINITY;
        return aDistance - bDistance;
      });
    case 'price-low':
      return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    case 'price-high':
      return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    case 'stock':
      return sorted.sort((a, b) => {
        const aStock = a.stock || a.quantity_available || 0;
        const bStock = b.stock || b.quantity_available || 0;
        return bStock - aStock;
      });
    case 'rating':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'newest':
      return sorted.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
    case 'popular':
      return sorted.sort((a, b) => (b.sold || 0) - (a.sold || 0));
    case 'smart':
    default:
      return sorted.sort((a, b) => (b.smartScore || 0) - (a.smartScore || 0));
  }
};

// Filter products by search term
export const filterProductsBySearch = (
  products: MarketplaceProduct[],
  searchTerm: string
): MarketplaceProduct[] => {
  if (!searchTerm.trim()) return products;

  const term = searchTerm.toLowerCase();
  return products.filter(
    (product) =>
      product.name?.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term) ||
      product.farmName?.toLowerCase().includes(term) ||
      product.category?.toLowerCase().includes(term)
  );
};

