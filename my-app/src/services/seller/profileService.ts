// Profile-related service functions
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { DEFAULT_FARMER_ROLE, PLACEHOLDER_IMAGES } from '../../constants/seller/profile';
import { Farmer, SellerData } from '../../interface/seller/profile';
import { db } from '../../utils/lib/firebase';

// Helper function to format location from address fields
export const formatLocation = (address: any): string => {
  if (!address) return 'Add your location';
  
  const parts = [
    address.barangay,
    address.city, 
    address.province,
    address.region
  ].filter(part => part && part.trim() !== '');
  
  return parts.join(', ') || 'Add your location';
};

// Helper function to format farmers array from seller data
export const formatFarmers = (firestoreData: any): Farmer[] => {
  // Create farmer profile from the main seller
  const mainFarmer: Farmer = {
    id: '1',
    name: firestoreData.fullName || 'Farm Owner',
    role: DEFAULT_FARMER_ROLE,
    bio: firestoreData.farm?.description || 'Passionate about sustainable farming.',
    photo: PLACEHOLDER_IMAGES.FARMER
  };
  return [mainFarmer];
};

// Transform Firestore data to SellerData format
export const transformSellerData = (firestoreData: any, userId: string): SellerData => {
  return {
    id: userId,
    farmName: firestoreData.farmName || firestoreData.farm?.farmName || 'Your Farm',
    logo: firestoreData.logo || firestoreData.farm?.logo || PLACEHOLDER_IMAGES.LOGO,
    coverPhoto: firestoreData.coverPhoto || PLACEHOLDER_IMAGES.COVER,
    location: firestoreData.location || formatLocation(firestoreData.address),
    description: firestoreData.description || firestoreData.farm?.description || 'Tell your farm story...',
    rating: firestoreData.rating || 4.8,
    followerCount: firestoreData.followerCount || 0,
    isVerified: firestoreData.isVerified !== undefined ? firestoreData.isVerified : true,
    gallery: firestoreData.gallery || [],
    featuredProducts: firestoreData.featuredProducts || [],
    farmers: firestoreData.farmers || formatFarmers(firestoreData)
  };
};

// Transform Firestore data for buyer view
export const transformFarmData = (firestoreData: any, farmSellerId: string): SellerData => {
  return {
    id: farmSellerId,
    sellerId: farmSellerId,
    farmName: firestoreData.farmName || firestoreData.farm?.farmName || 'Farm',
    logo: firestoreData.logo || firestoreData.farm?.logo || PLACEHOLDER_IMAGES.LOGO,
    coverPhoto: firestoreData.coverPhoto || PLACEHOLDER_IMAGES.COVER,
    location: firestoreData.location || formatLocation(firestoreData.address),
    description: firestoreData.description || firestoreData.farm?.description || 'Farm description...',
    rating: firestoreData.rating || 0,
    followerCount: firestoreData.followerCount || 0,
    isVerified: firestoreData.isVerified !== undefined ? firestoreData.isVerified : false,
    gallery: firestoreData.gallery || [],
    featuredProducts: firestoreData.featuredProducts || [],
    farmers: firestoreData.farmers || formatFarmers(firestoreData)
  };
};

// Fetch seller's own data from Firestore (for seller view)
export const fetchSellerData = async (userId: string): Promise<SellerData> => {
  try {
    const sellerDoc = await getDoc(doc(db, 'sellers', userId));
    
    if (sellerDoc.exists()) {
      const firestoreData = sellerDoc.data();
      console.log('📥 Fetched Firestore data:', firestoreData);
      return transformSellerData(firestoreData, userId);
    } else {
      console.log('❌ No seller profile found');
      throw new Error('No seller profile found. Please complete your profile.');
    }
  } catch (error: any) {
    console.error('Error fetching seller data:', error);
    throw new Error(`Failed to load farm profile: ${error.message}`);
  }
};

// Fetch farm data for buyer view
export const fetchFarmData = async (farmSellerId: string): Promise<SellerData> => {
  try {
    const sellerDoc = await getDoc(doc(db, 'sellers', farmSellerId));
    
    if (sellerDoc.exists()) {
      const firestoreData = sellerDoc.data();
      console.log('📥 Fetched Farm data for buyer:', firestoreData);
      return transformFarmData(firestoreData, farmSellerId);
    } else {
      console.log('❌ Farm not found');
      throw new Error('Farm not found.');
    }
  } catch (error: any) {
    console.error('Error fetching farm data:', error);
    throw new Error(`Failed to load farm profile: ${error.message}`);
  }
};

// Update seller profile data
export const updateSellerProfile = async (userId: string, sellerData: SellerData): Promise<void> => {
  try {
    const sellerRef = doc(db, 'sellers', userId);
    await setDoc(sellerRef, {
      ...sellerData,
      userId: userId,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Seller profile updated successfully');
  } catch (error: any) {
    console.error('❌ Error updating seller profile:', error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }
};

