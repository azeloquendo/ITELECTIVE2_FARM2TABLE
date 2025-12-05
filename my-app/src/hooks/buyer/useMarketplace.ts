// Buyer marketplace hook
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../app/context/AuthContext';
import { MarketplaceProduct, UserLocation } from '../../interface/buyer/marketplace';
import {
  calculateCategoryAverages,
  calculateSmartScore,
  filterProductsBySearch,
  sortProducts
} from '../../services/buyer/marketplaceService';
import { db } from '../../utils/lib/firebase';

export const useMarketplace = (selectedCategory: string = 'all') => {
  const { user, userProfile } = useAuth() as {
    user: any;
    userProfile: any;
    loading: boolean;
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('smart');
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationFilteredProducts, setLocationFilteredProducts] = useState<MarketplaceProduct[]>([]);
  const [locationLoading, setLocationLoading] = useState(true);
  const [categoryAverages, setCategoryAverages] = useState<Record<string, number>>({});

  // Get current user location
  const currentUserLocation = useMemo((): UserLocation | null => {
    if (!userProfile) return null;
    
    const location = userProfile.address?.location || userProfile.deliveryAddress?.location;
    if (location?.lat && location?.lng) {
      return location;
    }
    
    return null;
  }, [userProfile]);

  // Fetch product reviews
  const fetchProductReviews = async (productId: string) => {
    try {
      const { collection: col, query: q, where: w, orderBy: ob, getDocs: gd } = await import('firebase/firestore');
      const reviewsQuery = q(
        col(db, 'reviews'),
        w('productId', '==', productId),
        w('isActive', '==', true),
        ob('createdAt', 'desc')
      );
      
      const reviewsSnapshot = await gd(reviewsQuery);
      return reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  };

  // Enhanced product fetching with smart matching
  useEffect(() => {
    const fetchProductsWithSmartMatching = async () => {
      try {
        setLocationLoading(true);
        
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData: MarketplaceProduct[] = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const productData = {
              id: doc.id,
              ...doc.data(),
            } as MarketplaceProduct;
            
            try {
              const reviews = await fetchProductReviews(doc.id);
              const averageRating = reviews.length > 0 
                ? reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / reviews.length
                : 0;
              return {
                ...productData,
                reviews: reviews,
                reviewsCount: reviews.length,
                rating: parseFloat(averageRating.toFixed(1)),
              } as MarketplaceProduct;
            } catch (reviewError) {
              console.error(`Error fetching reviews for product ${doc.id}:`, reviewError);
              return {
                ...productData,
                reviews: [],
                reviewsCount: 0,
                rating: 0,
              } as MarketplaceProduct;
            }
          })
        );

        const averages = await calculateCategoryAverages(productsData);
        setCategoryAverages(averages);

        if (!user || !userProfile) {
          setProducts(productsData);
          setLocationFilteredProducts(productsData);
          setLoading(false);
          setLocationLoading(false);
          return;
        }

        const buyerCity = userProfile.address?.city || userProfile.deliveryAddress?.city;
        if (!buyerCity) {
          setProducts(productsData);
          setLocationFilteredProducts(productsData);
          setLoading(false);
          setLocationLoading(false);
          return;
        }

        // Fetch sellers and match by city
        const sellersQuery = await getDocs(collection(db, 'sellers'));
        const sellersData = sellersQuery.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const sellerDataMap: { [sellerId: string]: any } = {};
        sellersData.forEach(seller => {
          sellerDataMap[seller.id] = seller;
        });

        const sameCityProducts = productsData.filter(product => {
          const sellerId = product.sellerId || product.farmer_id;
          if (!sellerId) return false;
          const sellerData = sellerDataMap[sellerId];
          if (!sellerData) return false;
          const sellerCity = sellerData.address?.city;
          if (!sellerCity) return false;
          return sellerCity === buyerCity;
        });

        const productsWithFarmerData = sameCityProducts.map(product => {
          const sellerId = product.sellerId || product.farmer_id;
          const sellerData = sellerDataMap[sellerId];
          
          if (sellerData) {
            return {
              ...product,
              farmer: {
                location: sellerData.address?.location,
                barangay: sellerData.address?.barangay || product.farmerBarangay,
                displayName: product.farmName,
                fullName: sellerData.fullName || product.farmName
              },
              farmerBarangay: sellerData.address?.barangay || product.farmerBarangay
            };
          }
          
          return product;
        });

        // Apply smart matching
        const smartMatchedProducts = productsWithFarmerData.map(product => {
          const avgPrice = averages[product.category || ''] || 0;
          const { score, reason, distance } = calculateSmartScore(
            product,
            currentUserLocation,
            avgPrice
          );
          
          return {
            ...product,
            smartScore: score,
            matchReason: reason,
            isSmartMatch: score > 0.6,
            distance: distance,
          };
        });

        setProducts(productsData);
        setLocationFilteredProducts(smartMatchedProducts);
      } catch (error) {
        console.error('Error fetching products with smart matching:', error);
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productList: MarketplaceProduct[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          reviews: [],
          reviewsCount: 0,
          rating: 0,
        } as MarketplaceProduct));
        setProducts(productList);
        setLocationFilteredProducts(productList);
      } finally {
        setLoading(false);
        setLocationLoading(false);
      }
    };

    fetchProductsWithSmartMatching();
  }, [user, userProfile, currentUserLocation]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = locationFilteredProducts;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by search term
    filtered = filterProductsBySearch(filtered, searchTerm);

    // Filter by status
    filtered = filtered.filter(product => {
      return product.status ? product.status === 'active' : true;
    });

    // Sort products
    filtered = sortProducts(filtered, sortBy);

    return filtered;
  }, [locationFilteredProducts, selectedCategory, searchTerm, sortBy]);

  return {
    products,
    filteredProducts,
    loading,
    locationLoading,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    categoryAverages,
  };
};

