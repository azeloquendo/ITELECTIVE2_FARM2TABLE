// Custom hook for managing seller profile data
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { DEFAULT_SELLER_DATA } from '../../constants/seller/profile';
import { SellerData } from '../../interface/seller/profile';
import { fetchFarmData, fetchSellerData } from '../../services/seller/profileService';
import { auth } from '../../utils/lib/firebase';

interface UseSellerProfileOptions {
  viewerRole?: 'seller' | 'buyer';
  farmId?: string;
}

export const useSellerProfile = ({ viewerRole = 'seller', farmId }: UseSellerProfileOptions = {}) => {
  const [sellerData, setSellerData] = useState<SellerData>(DEFAULT_SELLER_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const isBuyerView = viewerRole === 'buyer';

  useEffect(() => {
    if (isBuyerView && farmId) {
      // Buyer view - fetch specific farm's data
      const loadFarmData = async () => {
        try {
          setLoading(true);
          setError('');
          const data = await fetchFarmData(farmId);
          setSellerData(data);
        } catch (err: any) {
          console.error('Error fetching farm data:', err);
          setError(err.message || 'Failed to load farm profile.');
        } finally {
          setLoading(false);
        }
      };
      loadFarmData();
    } else {
      // Seller view - fetch their own data
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setCurrentUserId(user.uid);
          try {
            setLoading(true);
            setError('');
            const data = await fetchSellerData(user.uid);
            setSellerData(data);
          } catch (err: any) {
            console.error('Error fetching seller data:', err);
            setError(err.message || 'Failed to load farm profile.');
          } finally {
            setLoading(false);
          }
        } else {
          setError('Please sign in to view your farm profile.');
          setLoading(false);
        }
      });
      return () => unsubscribe();
    }
  }, [isBuyerView, farmId]);

  const updateSellerData = async (newData: SellerData) => {
    console.log('💾 Updating seller data:', newData);
    
    // Immediately update local state for better UX
    setSellerData(newData);
    
    // Also refetch from Firestore to ensure consistency
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const data = await fetchSellerData(currentUser.uid);
        setSellerData(data);
      } catch (err: any) {
        console.error('Error refetching seller data:', err);
      }
    }
  };

  return {
    sellerData,
    loading,
    error,
    currentUserId,
    updateSellerData,
    isBuyerView
  };
};

