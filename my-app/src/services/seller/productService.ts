// Product-related service functions for API/Firebase interactions

import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    where
} from "firebase/firestore";
import { Product } from "../../interface/seller";
import { db } from "../../utils/lib/firebase";

/**
 * Fetch all products for a specific seller
 */
export const fetchSellerProducts = async (sellerId: string): Promise<Product[]> => {
  try {
    // Remove orderBy to avoid composite index requirement - we'll sort client-side
    const productsQuery = query(
      collection(db, "products"),
      where("sellerId", "==", sellerId)
    );
    
    const querySnapshot = await getDocs(productsQuery);
    const products: Product[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      products.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        stock: data.quantity_available || data.stock || 0,
        imageUrls: data.imageUrls || (data.image ? [data.image] : []),
        image: data.imageUrls?.[0] || data.image,
      } as Product);
    });
    
    // Sort by createdAt descending on client-side
    products.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    });
    
    return products;
  } catch (error) {
    console.error("Error fetching seller products:", error);
    throw error;
  }
};

/**
 * Set up real-time listener for seller products
 */
export const subscribeToSellerProducts = (
  sellerId: string,
  callback: (products: Product[]) => void
): (() => void) => {
  try {
    const productsQuery = query(
      collection(db, "products"),
      where("sellerId", "==", sellerId),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(
      productsQuery,
      (querySnapshot) => {
        const products: Product[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          products.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            stock: data.quantity_available || data.stock || 0,
            imageUrls: data.imageUrls || (data.image ? [data.image] : []),
            image: data.imageUrls?.[0] || data.image,
          } as Product);
        });
        callback(products);
      },
      (error) => {
        console.error("Error in product listener:", error);
        throw error;
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error("Error setting up product listener:", error);
    throw error;
  }
};

/**
 * Fetch product reviews and calculate rating
 */
export const fetchProductReviews = async (productId: string) => {
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

/**
 * Fetch seller data
 */
export const fetchSellerData = async (sellerId: string) => {
  try {
    const sellerDoc = await getDoc(doc(db, "sellers", sellerId));
    if (sellerDoc.exists()) {
      return sellerDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching seller data:", error);
    return null;
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "products", productId));
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

/**
 * Calculate average rating from reviews
 */
export const calculateAverageRating = (reviews: any[]): number => {
  if (reviews.length === 0) return 0;
  const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
  return parseFloat((totalRating / reviews.length).toFixed(1));
};

