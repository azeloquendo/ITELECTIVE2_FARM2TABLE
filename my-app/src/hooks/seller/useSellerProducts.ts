// Custom hook for managing seller products

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { Product } from "../../interface/seller";
import {
    calculateAverageRating,
    fetchProductReviews,
    fetchSellerData,
    subscribeToSellerProducts,
} from "../../services/seller/productService";
import { auth } from "../../utils/lib/firebase";

export const useSellerProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchFarmerProducts(user.uid);
      } else {
        setLoading(false);
        setError("Please log in to view your products");
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchFarmerProducts = async (farmerId: string) => {
    setLoading(true);
    setError(null);

    try {
      const unsubscribe = subscribeToSellerProducts(farmerId, async (productsData) => {
        const enhancedProducts: Product[] = [];

        // Process each product and fetch additional data
        for (const product of productsData) {
          try {
            // Fetch real reviews for this product
            const reviews = await fetchProductReviews(product.id);
            
            // Calculate average rating from real reviews
            const averageRating = calculateAverageRating(reviews);

            // Fetch seller data for location information
            const sellerData = await fetchSellerData(farmerId);

            // Enhanced product data with real metrics
            const enhancedProduct: Product = {
              ...product,
              reviews: reviews as any,
              reviewsCount: reviews.length,
              rating: averageRating,
              farmer: sellerData ? {
                location: sellerData.address?.location,
                barangay: sellerData.address?.barangay,
                displayName: sellerData.displayName,
                fullName: sellerData.fullName
              } : undefined,
              stock: product.quantity_available || product.stock || 0,
              imageUrls: product.imageUrls || (product.image ? [product.image] : []),
              image: product.imageUrls?.[0] || product.image
            };

            enhancedProducts.push(enhancedProduct);
          } catch (productError) {
            console.error(`Error processing product ${product.id}:`, productError);
            // Fallback: push basic product data without reviews
            enhancedProducts.push({
              ...product,
              reviews: [],
              reviewsCount: 0,
              rating: 0,
              stock: product.quantity_available || product.stock || 0,
              imageUrls: product.imageUrls || (product.image ? [product.image] : []),
              image: product.imageUrls?.[0] || product.image
            });
          }
        }

        console.log(`✅ Loaded ${enhancedProducts.length} products with REAL data for farmer ${farmerId}`);
        setProducts(enhancedProducts);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error setting up product listener:", error);
      setError("Failed to load products. Please try again.");
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    currentUser,
    refetch: () => currentUser && fetchFarmerProducts(currentUser.uid),
  };
};

