'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from './FarmFeed.module.css';
import FeedHeader from '../../../../../components/organisms/feed/FeedHeader/FeedHeader';
import FarmDescription from '../../../../../components/molecules/FarmDescription/FarmDescription';
import Gallery from '../../../../../components/organisms/feed/Gallery/Gallery';
import FeaturedProducts from '../../../../../components/organisms/feed/FeaturedProducts/FeaturedProducts';
import FarmerProfiles from '../../../../../components/organisms/feed/FarmerProfiles/FarmerProfiles';

// Firebase imports
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../../../../utils/lib/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// TypeScript interfaces (same as seller feed)
interface Farmer {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
}

interface SellerData {
  id: string;
  farmName: string;
  logo: string;
  coverPhoto: string;
  location: string;
  description: string;
  rating: number;
  followerCount: number;
  isVerified: boolean;
  gallery: string[];
  featuredProducts: any[];
  farmers: Farmer[];
  sellerId?: string;
}

export default function BuyerFarmFeed() {
  const params = useParams();
  const farmId = params.farmId as string;
  
  const [sellerData, setSellerData] = useState<SellerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  // Check if user is authenticated and get their ID
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        await checkIfFollowing(user.uid);
      } else {
        setCurrentUserId(null);
        setIsFollowing(false);
      }
    });

    return () => unsubscribe();
  }, [farmId]);

  // ✅ FIXED: Check if current user is following this farm - ONLY check buyers collection
  const checkIfFollowing = async (userId: string) => {
    try {
      // ✅ CRITICAL FIX: Only check in 'buyers' collection, not 'users'
      const buyerDoc = await getDoc(doc(db, 'buyers', userId));
      if (buyerDoc.exists()) {
        const buyerData = buyerDoc.data();
        const following = buyerData.followingFarms || [];
        setIsFollowing(following.includes(farmId));
      } else {
        // Buyer profile doesn't exist yet, so they're not following
        console.log('Buyer profile not found, user cannot follow farms yet');
        setIsFollowing(false);
      }
    } catch (err) {
      console.error('Error checking follow status:', err);
      setIsFollowing(false);
    }
  };

  // ✅ FIXED: Safe buyer document check - ONLY check buyers collection
  const checkBuyerDocument = async (userId: string) => {
    try {
      const buyerRef = doc(db, 'buyers', userId);
      const buyerDoc = await getDoc(buyerRef);
      
      if (buyerDoc.exists()) {
        console.log('✅ Buyer document exists, proceeding with follow action');
        return buyerRef;
      } else {
        console.log('❌ Buyer document does not exist - user must complete buyer profile first');
        return null;
      }
    } catch (err) {
      console.error('Error checking buyer document:', err);
      return null;
    }
  };

  // Fetch seller data from Firestore
  const fetchSellerData = async () => {
    try {
      setLoading(true);
      const sellerDoc = await getDoc(doc(db, 'sellers', farmId));
      
      if (sellerDoc.exists()) {
        const firestoreData = sellerDoc.data();
        
        console.log('📥 Fetched Farm Data for Buyer:', firestoreData);
        
        // Transform Firestore data to match your component structure
        const transformedData: SellerData = {
          id: farmId,
          sellerId: farmId, // Important for buyer view
          farmName: firestoreData.farmName || firestoreData.farm?.farmName || 'Farm',
          logo: firestoreData.logo || firestoreData.farm?.logo || '/api/placeholder/100/100',
          coverPhoto: firestoreData.coverPhoto || '/api/placeholder/1200/400',
          location: firestoreData.location || 'Farm Location',
          description: firestoreData.description || firestoreData.farm?.description || 'Farm description...',
          rating: firestoreData.rating || 4.8,
          followerCount: firestoreData.followerCount || 0,
          isVerified: firestoreData.isVerified !== undefined ? firestoreData.isVerified : true,
          gallery: firestoreData.gallery || [],
          featuredProducts: firestoreData.featuredProducts || [],
          farmers: firestoreData.farmers || []
        };
        
        console.log('🔄 Transformed farm data for buyer:', transformedData);
        setSellerData(transformedData);
      } else {
        console.log('❌ Farm not found');
        setError('Farm profile not found.');
      }
    } catch (err) {
      console.error('Error fetching farm data:', err);
      setError('Failed to load farm profile.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Handle follow/unfollow action - UPDATED to use buyers collection
  const handleFollowToggle = async () => {
    if (!currentUserId) {
      alert('Please sign in to follow farms');
      return;
    }

    if (!sellerData) return;

    setFollowLoading(true);
    try {
      // ✅ CRITICAL FIX: Check if BUYER document exists WITHOUT creating it
      const buyerRef = await checkBuyerDocument(currentUserId);
      
      if (!buyerRef) {
        alert('Please complete your buyer profile setup before following farms');
        setFollowLoading(false);
        return;
      }

      const sellerRef = doc(db, 'sellers', farmId);

      if (isFollowing) {
        // Unfollow: Remove from buyer's following list and decrement farm's follower count
        await updateDoc(buyerRef, {
          followingFarms: arrayRemove(farmId),
          updatedAt: new Date()
        });
        await updateDoc(sellerRef, {
          followerCount: (sellerData.followerCount > 0 ? sellerData.followerCount - 1 : 0)
        });
        
        setIsFollowing(false);
        setSellerData(prev => prev ? {
          ...prev,
          followerCount: prev.followerCount > 0 ? prev.followerCount - 1 : 0
        } : null);
        
        console.log('✅ Unfollowed farm');
      } else {
        // Follow: Add to buyer's following list and increment farm's follower count
        await updateDoc(buyerRef, {
          followingFarms: arrayUnion(farmId),
          updatedAt: new Date()
        });
        await updateDoc(sellerRef, {
          followerCount: sellerData.followerCount + 1
        });
        
        setIsFollowing(true);
        setSellerData(prev => prev ? {
          ...prev,
          followerCount: prev.followerCount + 1
        } : null);
        
        console.log('✅ Followed farm');
      }
    } catch (err) {
      console.error('Error updating follow status:', err);
      alert('Failed to update follow status. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    if (farmId) {
      fetchSellerData();
    } else {
      setError('Farm ID not provided');
      setLoading(false);
    }
  }, [farmId]);

  if (loading) {
    return (
      <div className={styles.feedPage}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading farm profile...</p>
        </div>
      </div>
    );
  }

  if (error || !sellerData) {
    return (
      <div className={styles.feedPage}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h3>Unable to load farm profile</h3>
          <p>{error || 'Farm not found'}</p>
          <button 
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.feedPage}>
      {/* Header for Buyer View */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1>{sellerData.farmName}</h1>
            <p>Farm Profile & Products</p>
          </div>
          <div className={styles.followContainer}>
            <button 
              className={`${styles.followButton} ${
                isFollowing ? styles.following : styles.notFollowing
              }`}
              onClick={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading ? (
                '...'
              ) : isFollowing ? (
                '✓ Following'
              ) : (
                '❤️ Follow Farm'
              )}
            </button>
            <div className={styles.followerCount}>
              {sellerData.followerCount} followers
            </div>
          </div>
        </div>
      </div>

      {/* Feed Container - Using viewerRole="buyer" instead of isReadOnly */}
      <div className={styles.feedContainer}>
        <FeedHeader 
          profile={sellerData} 
          viewerRole="buyer"
        />
        
        <FeaturedProducts 
          viewerRole="buyer"
          farmId={sellerData.id} // Pass the farm ID for buyer view
        />
        
        <FarmDescription 
          description={sellerData.description} 
          viewerRole="buyer"
        />
        
        <Gallery 
          images={sellerData.gallery} 
          viewerRole="buyer"
        />
        
        <FarmerProfiles 
          farmers={sellerData.farmers} 
          viewerRole="buyer"
        />
      </div>
    </div>
  );
}