import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db, auth } from "./firebase";

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  contact: string;
  address: {  // ← CHANGE THIS FROM deliveryAddress TO address
    streetName: string;
    building: string;
    houseNo: string;
    barangay: string;
    city: string;
    province: string;
    region: string;
    postalCode: string;
  };
  profilePic: string;
  role: 'buyer' | 'seller';
  emailVerified: boolean;
  createdAt: any;
  updatedAt: any;
}

// Add this function to create a default profile
export const createDefaultProfile = async (): Promise<UserProfile> => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    console.log("📝 Creating default profile for user:", currentUser.uid);

    const defaultProfile: UserProfile = {
      uid: currentUser.uid,
      fullName: currentUser.displayName || "",
      email: currentUser.email || "",
      contact: "",
      address: {  // ← CHANGE THIS FROM deliveryAddress TO address
        streetName: "",
        building: "",
        houseNo: "",
        barangay: "",
        city: "",
        province: "",
        region: "Region III - Central Luzon",
        postalCode: ""
      },
      profilePic: "",
      role: 'buyer',
      emailVerified: currentUser.emailVerified || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const userRef = doc(db, "buyers", currentUser.uid);
    await setDoc(userRef, defaultProfile);

    console.log("✅ Default profile created successfully");
    return defaultProfile;
  } catch (error) {
    console.error('Error creating default profile:', error);
    throw error;
  }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    console.log("🔍 Looking for user in buyers collection with UID:", currentUser.uid);

    const userDoc = await getDoc(doc(db, "buyers", currentUser.uid));
    
    if (userDoc.exists()) {
      console.log("✅ Found user in buyers collection");
      const userData = userDoc.data();
      console.log("📊 User data from Firestore:", userData);
      
      return {
        uid: userDoc.id,
        ...userData
      } as UserProfile;
    }

    // Instead of throwing an error, create a default profile
    console.log("🆕 Profile not found, creating default profile...");
    return await createDefaultProfile();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (profileData: any) => {  // ← Change to any for flexibility
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const userRef = doc(db, "buyers", currentUser.uid);
    
    // First, check if the document exists
    const userDoc = await getDoc(userRef);
    
    console.log("💾 Updating profile with data:", profileData);

    const updateData: any = {
      updatedAt: new Date()
    };

    // Handle different data structures
    if (profileData.fullName !== undefined) {
      updateData.fullName = profileData.fullName;
    }
    
    if (profileData.contact !== undefined) {
      updateData.contact = profileData.contact;
    }

    if (profileData.address) {
      // If address is provided directly
      updateData.address = profileData.address;
    } else if (profileData.deliveryAddress) {
      // If deliveryAddress is provided (backward compatibility)
      updateData.address = profileData.deliveryAddress;
    }

    console.log("📤 Firestore update data:", updateData);

    if (userDoc.exists()) {
      // Update existing document
      await updateDoc(userRef, updateData);
      console.log("✅ Profile updated in Firestore");
    } else {
      // Create new document with the provided data
      const newProfile: UserProfile = {
        uid: currentUser.uid,
        fullName: profileData.fullName || "",
        email: currentUser.email || "",
        contact: profileData.contact || "",
        address: profileData.address || profileData.deliveryAddress || {
          streetName: "",
          building: "",
          houseNo: "",
          barangay: "",
          city: "",
          province: "",
          region: "Region III - Central Luzon",
          postalCode: ""
        },
        profilePic: "",
        role: 'buyer',
        emailVerified: currentUser.emailVerified || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await setDoc(userRef, newProfile);
      console.log("✅ New profile created in Firestore");
    }

    // Return the updated profile
    const updatedDoc = await getDoc(userRef);
    if (updatedDoc.exists()) {
      const userData = updatedDoc.data();
      console.log("📥 Updated profile data:", userData);
      return {
        uid: updatedDoc.id,
        ...userData
      } as UserProfile;
    }

    return null;
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    throw error;
  }
};

// Cloudinary upload function
export const uploadToCloudinary = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'profile_pictures');
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
    
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// Update profile picture in Firestore with Cloudinary URL
export const updateProfilePicture = async (file: File): Promise<string> => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Upload to Cloudinary
    const cloudinaryUrl = await uploadToCloudinary(file);
    
    // Update Firestore with Cloudinary URL
    const userRef = doc(db, "buyers", currentUser.uid);
    
    // Check if document exists first
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        profilePic: cloudinaryUrl,
        updatedAt: new Date()
      });
    } else {
      // Create a new profile with the picture
      await createDefaultProfile();
      await updateDoc(userRef, {
        profilePic: cloudinaryUrl,
        updatedAt: new Date()
      });
    }

    return cloudinaryUrl;
  } catch (error) {
    console.error('Error updating profile picture:', error);
    throw error;
  }
};

// Helper function to get optimized Cloudinary URL
export const getOptimizedImageUrl = (url: string, width: number = 200, height: number = 200): string => {
  if (!url) return "/default-avatar.jpg";
  
  console.log("🖼️ Original image URL from Firestore:", url);
  
  // If it's already a complete Cloudinary URL
  if (url.includes('cloudinary.com')) {
    try {
      // Parse the URL to handle it properly
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Find the index of 'upload' in the path
      const uploadIndex = pathParts.indexOf('upload');
      
      if (uploadIndex !== -1 && uploadIndex < pathParts.length - 1) {
        // Insert transformations after 'upload'
        pathParts.splice(uploadIndex + 1, 0, `w_${width},h_${height},c_fill`);
        urlObj.pathname = pathParts.join('/');
        const optimizedUrl = urlObj.toString();
        console.log("✅ Optimized Cloudinary URL:", optimizedUrl);
        return optimizedUrl;
      }
      
      // If we can't insert transformations, return original
      console.log("⚠️ Could not insert transformations, returning original:", url);
      return url;
    } catch (error) {
      console.error("❌ Error parsing Cloudinary URL:", error);
      return url;
    }
  }
  
  // If it's just a filename (like "unis.jpg"), construct the Cloudinary URL
  if (url && !url.startsWith('http') && url.includes('.')) {
    const cloudinaryUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},h_${height},c_fill/${url}`;
    console.log("🔧 Constructed Cloudinary URL from filename:", cloudinaryUrl);
    return cloudinaryUrl;
  }
  
  // If it's still not a valid URL, return default
  console.log("❌ Invalid image URL, using default avatar");
  return "/default-avatar.jpg";
};