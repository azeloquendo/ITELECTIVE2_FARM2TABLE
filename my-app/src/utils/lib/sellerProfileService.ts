import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface SellerProfile {
  // Personal Info
  id: string;
  uid: string;
  userId: string;
  fullName: string;
  email: string;
  contact: string;
  age: number;
  birthday: string;
  role: string;
  
  // Farm Info
  farm: {
    farmName: string;
    description: string;
    logo: string;
  };
  
  // Location
  address: {
    barangay: string;
    building: string;
    city: string;
    houseNo: string;
    postalCode: string;
    province: string;
    region: string;
    streetName: string;
    location: {
      lat: number;
      lng: number;
    };
  };
  
  // 🟢 UPDATED: ID Verification Data to match signup form
  idVerification: {
    idType: string;
    idNumber: string;
    idFront: string; // CHANGED: from frontImage to idFront
    idBack: string;  // CHANGED: from backImage to idBack
    selfieWithId: string; // CHANGED: from selfieImage to selfieWithId
    submittedAt: any;
    status: "pending" | "approved" | "rejected";
    reviewedBy?: string;
    reviewedAt?: any;
    rejectionReason?: string;
  };
  
  // 🟢 UPDATED: Account Status field name
  accountStatus: "pending" | "active" | "suspended"; // CHANGED: from status to accountStatus
  
  // Images
  profilePic: string;
  coverPhoto: string;
  gallery: string[];
  
  // Farm Details
  farmers: Array<{
    id: string;
    name: string;
    role: string;
    photo: string;
    bio: string;
  }>;
  
  // Stats
  rating: number;
  followerCount: number;
  isVerified: boolean;
  
  // Timestamps
  createdAt: any;
  updatedAt: any;
  emailVerified: boolean;
  verificationSentAt: any;
}

export const getSellerProfile = async (): Promise<SellerProfile | null> => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      console.log("❌ No authenticated user");
      return null;
    }

    console.log("🔄 Fetching seller profile for UID:", user.uid);
    
    const docRef = doc(db, "sellers", user.uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("✅ Seller profile found - raw data:", {
        farmName: data.farm?.farmName,
        logo: data.farm?.logo,
        fullName: data.fullName,
        email: data.email,
        contact: data.contact,
        idVerification: data.idVerification, // 🟢 UPDATED: Log ID verification data
        accountStatus: data.accountStatus // 🟢 UPDATED: Log account status
      });
      
      // 🟢 UPDATED: Correct data mapping based on new database structure
      const sellerProfile: SellerProfile = {
        id: data.id || user.uid,
        uid: data.uid || user.uid,
        userId: data.userId || user.uid,
        fullName: data.fullName || "",
        email: data.email || user.email || "",
        contact: data.contact || "",
        age: data.age || 0,
        birthday: data.birthday || "",
        role: data.role || "seller",
        
        // 🟢 UPDATED: Farm data is now nested under farm object
        farm: {
          farmName: data.farm?.farmName || "", // Nested under farm
          description: data.farm?.description || "", // Nested under farm  
          logo: data.farm?.logo || "" // 🟢 Nested under farm - Cloudinary logo
        },
        
        address: {
          barangay: data.address?.barangay || "",
          building: data.address?.building || "",
          city: data.address?.city || "",
          houseNo: data.address?.houseNo || "",
          postalCode: data.address?.postalCode || "",
          province: data.address?.province || "",
          region: data.address?.region || "",
          streetName: data.address?.streetName || "",
          location: data.address?.location || { lat: 0, lng: 0 }
        },
        
        // 🟢 UPDATED: ID Verification data with new field names
        idVerification: data.idVerification || {
          idType: "",
          idNumber: "",
          idFront: "", // CHANGED: from frontImage to idFront
          idBack: "",  // CHANGED: from backImage to idBack
          selfieWithId: "", // CHANGED: from selfieImage to selfieWithId
          submittedAt: null,
          status: "pending"
        },
        
        // 🟢 UPDATED: Account status field name
        accountStatus: data.accountStatus || "pending", // CHANGED: from status to accountStatus
        
        // 🟢 UPDATED: Use the nested farm logo
        profilePic: data.farm?.logo || "", // This gets your Cloudinary logo URL from farm object
        coverPhoto: data.coverPhoto || "",
        gallery: data.gallery || [],
        
        farmers: data.farmers || [],
        rating: data.rating || 0,
        followerCount: data.followerCount || 0,
        isVerified: data.isVerified || false,
        
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        emailVerified: data.emailVerified || false,
        verificationSentAt: data.verificationSentAt
      };

      console.log("📸 Logo URL being used:", sellerProfile.farm.logo);
      console.log("🏠 Farm name being used:", sellerProfile.farm.farmName);
      console.log("👤 Full name being used:", sellerProfile.fullName);
      console.log("🆔 ID Verification Status:", sellerProfile.idVerification.status);
      console.log("📋 Account Status:", sellerProfile.accountStatus);
      console.log("✅ Final seller profile:", sellerProfile);
      
      return sellerProfile;
    } else {
      console.log("❌ No seller profile found for UID:", user.uid);
      throw new Error("Seller profile not found in sellers collection");
    }
  } catch (error: any) {
    console.error("❌ Error fetching seller profile:", error);
    throw error;
  }
};

// 🟢 UPDATED: Function to check if seller is fully verified
export const isSellerVerified = (profile: SellerProfile): boolean => {
  return (
    profile.emailVerified &&
    profile.idVerification.status === "approved" &&
    profile.accountStatus === "active" // CHANGED: from status to accountStatus
  );
};

// 🟢 UPDATED: Function to get seller verification status
export const getSellerVerificationStatus = (profile: SellerProfile): {
  emailVerified: boolean;
  idVerified: boolean;
  accountActive: boolean;
  fullyVerified: boolean;
} => {
  return {
    emailVerified: profile.emailVerified,
    idVerified: profile.idVerification.status === "approved",
    accountActive: profile.accountStatus === "active", // CHANGED: from status to accountStatus
    fullyVerified: isSellerVerified(profile)
  };
};

// 🟢 UPDATED: Function to get seller by ID (for admin purposes)
export const getSellerById = async (sellerId: string): Promise<SellerProfile | null> => {
  try {
    console.log("🔄 Fetching seller profile for ID:", sellerId);
    
    const docRef = doc(db, "sellers", sellerId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      const sellerProfile: SellerProfile = {
        id: data.id || sellerId,
        uid: data.uid || sellerId,
        userId: data.userId || sellerId,
        fullName: data.fullName || "",
        email: data.email || "",
        contact: data.contact || "",
        age: data.age || 0,
        birthday: data.birthday || "",
        role: data.role || "seller",
        
        farm: {
          farmName: data.farm?.farmName || "",
          description: data.farm?.description || "",
          logo: data.farm?.logo || ""
        },
        
        address: {
          barangay: data.address?.barangay || "",
          building: data.address?.building || "",
          city: data.address?.city || "",
          houseNo: data.address?.houseNo || "",
          postalCode: data.address?.postalCode || "",
          province: data.address?.province || "",
          region: data.address?.region || "",
          streetName: data.address?.streetName || "",
          location: data.address?.location || { lat: 0, lng: 0 }
        },
        
        idVerification: data.idVerification || {
          idType: "",
          idNumber: "",
          idFront: "", // CHANGED
          idBack: "",  // CHANGED
          selfieWithId: "", // CHANGED
          submittedAt: null,
          status: "pending"
        },
        
        accountStatus: data.accountStatus || "pending", // CHANGED
        profilePic: data.farm?.logo || "",
        coverPhoto: data.coverPhoto || "",
        gallery: data.gallery || [],
        farmers: data.farmers || [],
        rating: data.rating || 0,
        followerCount: data.followerCount || 0,
        isVerified: data.isVerified || false,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        emailVerified: data.emailVerified || false,
        verificationSentAt: data.verificationSentAt
      };

      console.log("✅ Seller profile found for ID:", sellerId);
      return sellerProfile;
    } else {
      console.log("❌ No seller profile found for ID:", sellerId);
      return null;
    }
  } catch (error: any) {
    console.error("❌ Error fetching seller by ID:", error);
    throw error;
  }
};

// 🟢 UPDATED: Function to check if seller can perform actions
export const canSellerSell = (profile: SellerProfile): {
  canSell: boolean;
  reasons: string[];
} => {
  const reasons: string[] = [];
  
  if (!profile.emailVerified) {
    reasons.push("Email not verified");
  }
  
  if (profile.idVerification.status !== "approved") {
    reasons.push("ID verification pending or rejected");
  }
  
  if (profile.accountStatus !== "active") { // CHANGED: from status to accountStatus
    reasons.push("Account not active");
  }
  
  return {
    canSell: reasons.length === 0,
    reasons
  };
};

// 🟢 UPDATED: Function to get verification progress
export const getVerificationProgress = (profile: SellerProfile): {
  percentage: number;
  steps: Array<{ step: string; completed: boolean; description: string }>;
} => {
  const steps = [
    {
      step: "Email Verification",
      completed: profile.emailVerified,
      description: "Verify your email address"
    },
    {
      step: "ID Verification",
      completed: profile.idVerification.status === "approved",
      description: "Submit and approve ID documents"
    },
    {
      step: "Account Activation",
      completed: profile.accountStatus === "active", // CHANGED: from status to accountStatus
      description: "Account review and activation"
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const percentage = Math.round((completedSteps / steps.length) * 100);

  return {
    percentage,
    steps
  };
};