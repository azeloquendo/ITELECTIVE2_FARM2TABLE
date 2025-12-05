// Buyer profile service functions
import { doc, updateDoc } from 'firebase/firestore';
import { Address, BuyerProfile } from '../../interface/buyer/profile';
import { auth, db } from '../../utils/lib/firebase';
import { getUserProfile, updateProfilePicture, updateUserProfile } from '../../utils/lib/profileService';

export { getUserProfile, updateProfilePicture, updateUserProfile };

// Fetch buyer profile
export const fetchBuyerProfile = async (): Promise<BuyerProfile | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const userData = await getUserProfile();
    if (!userData) {
      return null;
    }

    return {
      id: user.uid,
      fullName: userData.fullName,
      email: userData.email || user.email || '',
      contact: userData.contact,
      address: userData.address,
      deliveryAddress: userData.deliveryAddress,
      profilePic: userData.profilePic,
      avatar: userData.avatar,
      role: 'buyer',
    };
  } catch (error) {
    console.error('Error fetching buyer profile:', error);
    throw error;
  }
};

// Update buyer profile
export const updateBuyerProfile = async (
  profileData: Partial<BuyerProfile>
): Promise<void> => {
  try {
    await updateUserProfile(profileData);
  } catch (error) {
    console.error('Error updating buyer profile:', error);
    throw error;
  }
};

// Update buyer address
export const updateBuyerAddress = async (
  address: Address,
  isDeliveryAddress: boolean = false
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const userRef = doc(db, 'users', user.uid);
    const updateData = isDeliveryAddress
      ? { deliveryAddress: address }
      : { address: address };

    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error updating buyer address:', error);
    throw error;
  }
};

