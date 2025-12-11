// Review service using Firebase Client SDK
import { collection, addDoc, query, where, getDocs, orderBy, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface ReviewData {
  orderId: string;
  rating: number;
  review?: string;
  buyerId: string;
  sellerId?: string;
  productNames?: string[];
}

export interface Review extends ReviewData {
  id: string;
  createdAt: Date;
}

/**
 * Submit a review for an order
 */
export const submitReview = async (orderId: string, rating: number, review?: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Get the order to extract buyer and seller info
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    const orderData = orderDoc.data();

    // Create review document
    const reviewData: ReviewData = {
      orderId: orderId,
      rating: rating,
      review: review || '',
      buyerId: orderData.buyerId,
      sellerId: orderData.sellers?.[0]?.sellerId,
      productNames: orderData.products?.map((p: any) => p.name) || []
    };

    // Add review to reviews collection
    await addDoc(collection(db, 'reviews'), {
      ...reviewData,
      createdAt: serverTimestamp()
    });

    // Update order status to completed
    await updateDoc(orderRef, {
      status: 'completed',
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      message: 'Review submitted successfully'
    };
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error instanceof Error ? error : new Error('Failed to submit review');
  }
};

/**
 * Get reviews for a specific order
 */
export const getOrderReviews = async (orderId: string): Promise<Review[]> => {
  try {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('orderId', '==', orderId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(reviewsQuery);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as Review;
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch reviews');
  }
};

/**
 * Get reviews for a seller
 */
export const getSellerReviews = async (sellerId: string): Promise<Review[]> => {
  try {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(reviewsQuery);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as Review;
    });
  } catch (error) {
    console.error('Error fetching seller reviews:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch seller reviews');
  }
};

