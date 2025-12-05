// Buyer marketplace interfaces
export interface UserLocation {
  lat: number;
  lng: number;
}

export interface Farmer {
  location?: UserLocation;
  barangay?: string;
  displayName?: string;
  fullName?: string;
}

export interface Seller {
  id: string;
  address?: {
    city?: string;
    barangay?: string;
    location?: UserLocation;
  };
  fullName?: string;
  displayName?: string;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  price?: number;
  displayPrice?: string;
  category?: string;
  status?: string;
  farmName?: string;
  description?: string;
  imageUrls?: string[];
  image?: string;
  sold?: number;
  quantity_available?: number;
  stock?: number;
  deliveryFee?: number;
  deliveryTime?: string;
  sellerId?: string;
  farmer_id?: string;
  farmerBarangay?: string;
  minimumOrderQuantity?: number;
  unit?: string;
  farmer?: Farmer;
  reviews?: any[];
  reviewsCount?: number;
  rating?: number;
  createdAt?: any;
  smartScore?: number;
  matchReason?: string;
  isSmartMatch?: boolean;
  distance?: number;
}

export interface UserProfile {
  fullName?: string;
  contact?: string;
  address?: {
    city?: string;
    houseNo?: string;
    streetName?: string;
    barangay?: string;
    province?: string;
    postalCode?: string;
    location?: UserLocation;
  };
  deliveryAddress?: {
    city?: string;
    houseNo?: string;
    streetName?: string;
    barangay?: string;
    province?: string;
    postalCode?: string;
    location?: UserLocation;
  };
}

export interface SmartMatchingScores {
  proximity: number;
  price: number;
  demand: number;
  rating: number;
}

export interface ProductFilters {
  searchTerm: string;
  sortBy: string;
  category: string;
}

