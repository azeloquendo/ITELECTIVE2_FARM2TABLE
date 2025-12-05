// Profile-related type definitions

export interface Farmer {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
}

export interface SellerData {
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

export interface FeedProps {
  viewerRole?: 'seller' | 'buyer';
  farmId?: string;
}

export interface FeedHeaderProps {
  profile: SellerData;
  viewerRole: 'seller' | 'buyer';
  currentUserId?: string | null;
  profileOwnerId?: string;
}

export interface FarmDescriptionProps {
  description: string;
  viewerRole?: 'seller' | 'buyer';
}

export interface GalleryProps {
  images: string[];
  viewerRole: 'seller' | 'buyer';
  currentUserId?: string | null;
  profileOwnerId?: string;
}

export interface FeaturedProductsProps {
  viewerRole: 'seller' | 'buyer';
  farmId?: string;
}

export interface FarmerProfilesProps {
  farmers: Farmer[];
  viewerRole: 'seller' | 'buyer';
}

export interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerData: SellerData;
  onSave: (updatedData: SellerData) => void;
}

