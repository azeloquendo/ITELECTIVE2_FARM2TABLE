const axios = require('axios');
require('dotenv').config(); // Load environment variables

// LocationIQ Geocoding function
async function geocodeAddress(address) {
  const API_KEY = process.env.LOCATIONIQ_API_KEY;
  
  // Validate API key
  if (!API_KEY || API_KEY === 'pk.your_actual_api_key_here') {
    throw new Error('LocationIQ API key not configured. Please check your .env file');
  }

  try {
    console.log(`📍 Geocoding: "${address}"`);
    
    const response = await axios.get(
      `https://us1.locationiq.com/v1/search.php?key=${API_KEY}&q=${encodeURIComponent(address)}&format=json&limit=1`
    );

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      console.log(`✅ Found: ${result.display_name} at (${result.lat}, ${result.lon})`);
      
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formattedAddress: result.display_name,
        type: result.type,
        importance: result.importance
      };
    } else {
      console.log('❌ No results found for address:', address);
      return null;
    }
  } catch (error) {
    console.error('🚨 Geocoding error:', error.response?.data?.error || error.message);
    
    // Handle specific LocationIQ errors
    if (error.response?.status === 429) {
      console.log('⚠️ Rate limit exceeded - try again later');
    } else if (error.response?.status === 401) {
      console.log('❌ Invalid API key - check your LOCATIONIQ_API_KEY in .env file');
    } else if (error.response?.status === 404) {
      console.log('❌ Address not found');
    }
    
    return null;
  }
}

// Enhanced geocoding with retry logic
async function geocodeAddressWithRetry(address, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} for: ${address}`);
      const result = await geocodeAddress(address);
      
      if (result) return result;
      
      // Wait before retry
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) throw error;
    }
  }
  return null;
}

// Batch geocoding with rate limiting (respects 5,000/day limit)
async function geocodeMultipleAddresses(addresses, delayMs = 500) {
  const results = [];
  
  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    console.log(`🔄 Processing ${i + 1}/${addresses.length}: ${address}`);
    
    try {
      const location = await geocodeAddress(address);
      results.push({
        address,
        success: true,
        location: location
      });
    } catch (error) {
      results.push({
        address,
        success: false,
        error: error.message
      });
    }
    
    // Rate limiting delay
    if (i < addresses.length - 1) {
      console.log(`⏳ Waiting ${delayMs}ms before next request...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  const successful = results.filter(r => r.success).length;
  console.log(`🎉 Batch complete: ${successful}/${addresses.length} successful`);
  
  return results;
}

// Distance calculation function (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2, unit = 'km') {
  // Validate inputs
  if (!isValidCoordinate(lat1, lng1) || !isValidCoordinate(lat2, lng2)) {
    throw new Error('Invalid coordinates provided to calculateDistance');
  }

  const R = unit === 'km' ? 6371 : 3959; // Earth radius in km or miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

// Validate coordinates
function isValidCoordinate(lat, lng) {
  return (
    typeof lat === 'number' && 
    typeof lng === 'number' &&
    !isNaN(lat) && !isNaN(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}

// Calculate distance between two locations (object format)
function calculateDistanceBetween(location1, location2, unit = 'km') {
  if (!location1 || !location2) {
    throw new Error('Both locations are required');
  }
  
  return calculateDistance(
    location1.lat, location1.lng,
    location2.lat, location2.lng,
    unit
  );
}

// Export all functions
module.exports = {
  geocodeAddress,
  geocodeAddressWithRetry,
  geocodeMultipleAddresses,
  calculateDistance,
  calculateDistanceBetween,
  isValidCoordinate
};