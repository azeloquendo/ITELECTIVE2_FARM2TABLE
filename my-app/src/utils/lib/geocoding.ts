// utils/lib/geocoding.ts

// Barangay coordinates fallback (your existing function)
import { getBarangayCoordinates } from './brgyCoordinates';

export interface GeocodingResult {
  lat: number;
  lng: number;
  accuracy: 'exact' | 'approximate' | 'barangay';
  address: string;
}

export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=ph`
    );
    
    if (!response.ok) throw new Error('Geocoding failed');
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        accuracy: 'exact',
        address: data[0].display_name
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

export const geocodeFarmAddress = async (formData: any): Promise<GeocodingResult> => {
  const { houseNo, building, streetName, barangay, city, province } = formData;
  
  // Try different address formats for best accuracy
  const addressFormats = [
    `${houseNo} ${building} ${streetName}, ${barangay}, ${city}, ${province}, Philippines`,
    `${houseNo} ${streetName}, ${barangay}, ${city}, ${province}, Philippines`,
    `${streetName}, ${barangay}, ${city}, ${province}, Philippines`,
  ];
  
  for (const address of addressFormats) {
    const coordinates = await geocodeAddress(address);
    if (coordinates) {
      console.log(`✅ Geocoded successfully: ${address}`);
      return coordinates;
    }
  }
  
  // Try barangay-level geocoding
  const barangayAddress = `${barangay}, ${city}, ${province}, Philippines`;
  const barangayCoordinates = await geocodeAddress(barangayAddress);
  
  if (barangayCoordinates) {
    console.log('✅ Geocoded to barangay level');
    return {
      ...barangayCoordinates,
      accuracy: 'approximate'
    };
  }
  
  // Final fallback to static barangay coordinates
  console.log('❌ Geocoding failed, using static barangay coordinates');
  const staticCoords = getBarangayCoordinates(city, barangay);
  return {
    lat: staticCoords.lat,
    lng: staticCoords.lng,
    accuracy: 'barangay',
    address: `${barangay}, ${city}, ${province}, Philippines`
  };
};