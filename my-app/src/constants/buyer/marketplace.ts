// Buyer marketplace constants

export const SMART_MATCHING_WEIGHTS: {
  proximity: number;
  price: number;
  demand: number;
  rating: number;
} = {
  proximity: 0.4,
  price: 0.3,
  demand: 0.2,
  rating: 0.1,
};

export const SMART_THRESHOLDS = {
  maxDistance: 50,
  priceVariation: 0.3,
  minRating: 3.0,
};

export const SORT_OPTIONS = [
  { value: 'smart', label: 'Smart Match' },
  { value: 'proximity', label: 'Nearest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'stock', label: 'Highest Stock' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
] as const;

export const MATCH_REASONS = {
  proximity: 'Near your location',
  price: 'Great value',
  demand: 'Popular choice',
  rating: 'Highly rated',
  balanced: 'Well-balanced match',
} as const;

