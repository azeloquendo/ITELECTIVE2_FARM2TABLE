// Buyer profile interfaces
export interface UserLocation {
  lat: number;
  lng: number;
}

export interface Address {
  streetName: string;
  building: string;
  houseNo: string;
  barangay: string;
  city: string;
  province: string;
  region: string;
  postalCode: string;
  location?: UserLocation;
}

export interface ProfileFormData {
  fullName: string;
  email: string;
  contact: string;
  address: string;
}

export interface BuyerProfile {
  id: string;
  fullName?: string;
  email?: string;
  contact?: string;
  address?: Address;
  deliveryAddress?: Address;
  profilePic?: string;
  avatar?: string;
  role?: 'buyer';
}

export interface Province {
  province: string;
  province_code: string;
}

export interface City {
  city: string;
  city_code: string;
}

export interface Barangay {
  brgy: string;
  brgy_code: string;
}

export interface Region {
  region: string;
  region_code: string;
}

