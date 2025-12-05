// Profile-related constants

export const DEFAULT_SELLER_DATA = {
  id: '',
  farmName: 'Loading Farm...',
  logo: '/api/placeholder/100/100',
  coverPhoto: '/api/placeholder/1200/400',
  location: 'Loading location...',
  description: 'Loading farm description...',
  rating: 0,
  followerCount: 0,
  isVerified: false,
  gallery: [],
  featuredProducts: [],
  farmers: []
};

export const VIEWER_ROLES = {
  SELLER: 'seller',
  BUYER: 'buyer',
} as const;

export const PLACEHOLDER_IMAGES = {
  LOGO: '/api/placeholder/100/100',
  COVER: '/api/placeholder/1200/400',
  FARMER: '/images/farmer1.jpg',
} as const;

export const DEFAULT_FARMER_ROLE = 'Farm Owner';

