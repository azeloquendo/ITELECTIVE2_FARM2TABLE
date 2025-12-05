import { Coordinates } from './brgyCoordinates';

// Haversine formula to calculate distance between two coordinates
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
}

// Calculate delivery fee based on distance
export function calculateDeliveryFee(distance: number): number {
  const baseFee = 40;
  const perKmFee = 5;
  return baseFee + (distance * perKmFee);
}

// Calculate ETA based on distance  
export function calculateETA(distance: number): number {
  const baseMinutes = 15;
  const perKmMinutes = 3;
  return baseMinutes + (distance * perKmMinutes);
}

// Interface for delivery information
export interface DeliveryInfo {
  distance: number;
  deliveryFee: number;
  etaMinutes: number;
}

// Calculate complete delivery information
export function calculateDeliveryInfo(
  buyerCoords: Coordinates, 
  farmerCoords: Coordinates
): DeliveryInfo {
  const distance = calculateDistance(
    buyerCoords.lat, buyerCoords.lng,
    farmerCoords.lat, farmerCoords.lng
  );
  
  const deliveryFee = calculateDeliveryFee(distance);
  const etaMinutes = calculateETA(distance);
  
  return {
    distance: parseFloat(distance.toFixed(1)),
    deliveryFee: Math.round(deliveryFee),
    etaMinutes: Math.round(etaMinutes)
  };
}