// Buyer profile hook
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import { DEFAULT_AVATAR_SVG } from '../../constants/buyer/profile';
import { Address, ProfileFormData } from '../../interface/buyer/profile';
import {
    fetchBuyerProfile,
    updateBuyerAddress,
    updateBuyerProfile,
    updateProfilePicture,
} from '../../services/buyer/profileService';
import { auth } from '../../utils/lib/firebase';
import { getOptimizedImageUrl } from '../../utils/lib/profileService';

export const useBuyerProfile = () => {
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    email: '',
    contact: '',
    address: '',
  });
  const [deliveryAddress, setDeliveryAddress] = useState<Address>({
    streetName: '',
    building: '',
    houseNo: '',
    barangay: '',
    city: '',
    province: '',
    region: '',
    postalCode: '',
  });
  const [profileImage, setProfileImage] = useState(DEFAULT_AVATAR_SVG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageLoading, setImageLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [completeUserData, setCompleteUserData] = useState<any>(null);

  // Address dropdown states
  const [provinces, setProvinces] = useState<Array<{ province: string; province_code: string }>>([]);
  const [cities, setCities] = useState<Array<{ city: string; city_code: string }>>([]);
  const [barangays, setBarangays] = useState<Array<{ brgy: string; brgy_code: string }>>([]);

  // Store original data to track changes
  const [originalFormData, setOriginalFormData] = useState<ProfileFormData>({
    fullName: '',
    email: '',
    contact: '',
    address: '',
  });
  const [originalDeliveryAddress, setOriginalDeliveryAddress] = useState<Address>({
    streetName: '',
    building: '',
    houseNo: '',
    barangay: '',
    city: '',
    province: '',
    region: '',
    postalCode: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if image exists
  const checkImageExists = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (url === DEFAULT_AVATAR_SVG) {
        resolve(true);
        return;
      }
      const img = new Image();
      const timeout = setTimeout(() => {
        img.onload = img.onerror = null;
        resolve(false);
      }, 5000);
      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
      img.src = url;
    });
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      setImageLoading(true);
      
      const user = auth.currentUser;
      if (!user) {
        setError('No user logged in');
        setIsLoading(false);
        return;
      }

      const userData = await fetchBuyerProfile();
      
      if (userData) {
        setCompleteUserData(userData);
        
        const newFormData: ProfileFormData = {
          fullName: userData.fullName || '',
          email: userData.email || user.email || '',
          contact: userData.contact || '',
          address: '',
        };
        
        setFormData(newFormData);
        setOriginalFormData(newFormData);
        
        let addressData: Address = {
          streetName: '',
          building: '',
          houseNo: '',
          barangay: '',
          city: '',
          province: '',
          region: '',
          postalCode: '',
        };

        if (userData.address) {
          const address = userData.address;
          addressData = {
            streetName: address.streetName || '',
            building: address.building || '',
            houseNo: address.houseNo || '',
            barangay: address.barangay || '',
            city: address.city || '',
            province: address.province || '',
            region: address.region || '',
            postalCode: address.postalCode || '',
          };
        }

        setDeliveryAddress(addressData);
        setOriginalDeliveryAddress(addressData);

        // Set profile image
        if (userData.profilePic) {
          const imageExists = await checkImageExists(userData.profilePic);
          if (imageExists) {
            setProfileImage(userData.profilePic);
          } else {
            setProfileImage(DEFAULT_AVATAR_SVG);
          }
        } else {
          setProfileImage(DEFAULT_AVATAR_SVG);
        }
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setError(error.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
      setImageLoading(false);
    }
  };

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchUserProfile();
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Check for changes
  useEffect(() => {
    const formChanged = 
      formData.fullName !== originalFormData.fullName ||
      formData.contact !== originalFormData.contact ||
      formData.email !== originalFormData.email;

    const addressChanged =
      deliveryAddress.streetName !== originalDeliveryAddress.streetName ||
      deliveryAddress.building !== originalDeliveryAddress.building ||
      deliveryAddress.houseNo !== originalDeliveryAddress.houseNo ||
      deliveryAddress.barangay !== originalDeliveryAddress.barangay ||
      deliveryAddress.city !== originalDeliveryAddress.city ||
      deliveryAddress.province !== originalDeliveryAddress.province ||
      deliveryAddress.region !== originalDeliveryAddress.region ||
      deliveryAddress.postalCode !== originalDeliveryAddress.postalCode;

    setHasChanges(formChanged || addressChanged);
  }, [formData, deliveryAddress, originalFormData, originalDeliveryAddress]);

  // Handle image change
  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setError("");
      setSuccess("");
      setImageLoading(true);
      
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      // Use Cloudinary for upload
      const imageUrl = await updateProfilePicture(file);
      const optimizedUrl = getOptimizedImageUrl(imageUrl, 200, 200);
      
      try {
        const imageExists = await checkImageExists(optimizedUrl);
        if (imageExists) {
          setProfileImage(optimizedUrl);
          console.log("✅ Image uploaded and loaded successfully:", optimizedUrl);
          setSuccess("Profile picture updated successfully!");
          setHasChanges(true); // Image change counts as a change
        } else {
          setError('Image uploaded but failed to load. Please try again.');
          setProfileImage(DEFAULT_AVATAR_SVG);
        }
      } catch (error) {
        console.error('Failed to load uploaded image:', error);
        setError('Image uploaded but failed to load. Please try again.');
        setProfileImage(DEFAULT_AVATAR_SVG);
      }
      
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload profile image');
      setProfileImage(DEFAULT_AVATAR_SVG);
    } finally {
      setImageLoading(false);
    }
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");
      
      const user = auth.currentUser;
      if (!user) {
        setError("No user logged in");
        return;
      }

      // Prepare update data - ONLY include changed fields
      const updateData: any = {
        updatedAt: new Date()
      };

      // Check which fields have changed and only include those
      if (formData.fullName !== originalFormData.fullName) {
        updateData.fullName = formData.fullName;
      }

      if (formData.contact !== originalFormData.contact) {
        updateData.contact = formData.contact;
      }

      // Check if any address fields changed
      const addressChanged = 
        deliveryAddress.streetName !== originalDeliveryAddress.streetName ||
        deliveryAddress.building !== originalDeliveryAddress.building ||
        deliveryAddress.houseNo !== originalDeliveryAddress.houseNo ||
        deliveryAddress.barangay !== originalDeliveryAddress.barangay ||
        deliveryAddress.city !== originalDeliveryAddress.city ||
        deliveryAddress.province !== originalDeliveryAddress.province ||
        deliveryAddress.region !== originalDeliveryAddress.region ||
        deliveryAddress.postalCode !== originalDeliveryAddress.postalCode;

      if (addressChanged) {
        // Preserve existing location data if it exists
        const existingLocation = completeUserData?.address?.location;
        
        updateData.address = {
          ...deliveryAddress,
          // Preserve the location data if it exists in the original data
          ...(existingLocation && { location: existingLocation })
        };
      }

      console.log("💾 Saving only changed fields:", updateData);

      // If no fields changed except updatedAt, don't send the request
      const fieldsToUpdate = Object.keys(updateData).filter(key => key !== 'updatedAt');
      if (fieldsToUpdate.length === 0) {
        setSuccess("No changes to save.");
        setIsSaving(false);
        return;
      }

      await updateBuyerProfile(updateData);
      
      // Update all original data
      setOriginalFormData({
        fullName: formData.fullName,
        email: formData.email,
        contact: formData.contact,
        address: ""
      });
      
      setOriginalDeliveryAddress(deliveryAddress);
      
      // Update the complete user data with the changes
      if (completeUserData) {
        setCompleteUserData({
          ...completeUserData,
          ...updateData
        });
      }
      
      setHasChanges(false);
      setSuccess("Profile updated successfully!");
      
      console.log("✅ Only changed fields saved successfully!");
      
      // Clear welcome messages
      if (error.includes("Welcome") || error.includes("complete your profile")) {
        setError("");
      }
      
    } catch (err) {
      console.error('❌ Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel all changes
  const handleCancelAll = () => {
    // Reset all data to original
    setFormData(originalFormData);
    setDeliveryAddress(originalDeliveryAddress);
    setError("");
    setSuccess("");
    setHasChanges(false);
  };

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn("❌ Image failed to load, using default avatar");
    const target = e.target as HTMLImageElement;
    
    if (target.src !== DEFAULT_AVATAR_SVG) {
      target.src = DEFAULT_AVATAR_SVG;
    }
    
    target.onerror = null;
    setImageLoading(false);
  };

  // Handle image load
  const handleImageLoad = () => {
    setImageLoading(false);
    console.log("✅ Profile image loaded successfully");
  };

  // Handle image click
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  return {
    formData,
    setFormData,
    deliveryAddress,
    setDeliveryAddress,
    profileImage,
    setProfileImage,
    isLoading,
    isSaving,
    setIsSaving,
    error,
    setError,
    success,
    setSuccess,
    imageLoading,
    hasChanges,
    provinces,
    setProvinces,
    cities,
    setCities,
    barangays,
    setBarangays,
    originalFormData,
    originalDeliveryAddress,
    completeUserData,
    fileInputRef,
    fetchUserProfile,
    updateBuyerProfile,
    updateBuyerAddress,
    checkImageExists,
    handleImageChange,
    handleSaveChanges,
    handleCancelAll,
    handleImageError,
    handleImageLoad,
    handleImageClick,
  };
};

