import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export interface MarketPriceData {
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  source: 'platform_history' | 'manual_research' | 'farmer_input';
}

export interface PriceCalculation {
  marketPrice: number;
  farmerMarkup: number;
  platformFee: number;
  shippingFee: number;
  vatAmount: number;
  subtotal: number;
  finalPrice: number;
}

export interface ShippingCalculation {
  distance: number;
  baseRate: number;
  ratePerKm: number;
  estimatedTime: string;
  total: number;
}

export class PricingService {
  // Calculate market-based price
  static calculateMarketBasedPrice(
    category: string,
    unit: string,
    quality: 'premium' | 'standard' | 'economy' = 'standard'
  ): MarketPriceData {
    
    const priceBenchmarks: { [key: string]: { standard: number, range: { min: number, max: number } } } = {
      'vegetables': { standard: 60, range: { min: 40, max: 120 } },
      'fruits': { standard: 80, range: { min: 50, max: 150 } },
      'rice': { standard: 45, range: { min: 35, max: 80 } },
      'grains': { standard: 50, range: { min: 30, max: 90 } },
      'poultry': { standard: 160, range: { min: 120, max: 220 } },
      'livestock': { standard: 200, range: { min: 150, max: 300 } },
      'seafood': { standard: 180, range: { min: 120, max: 250 } },
      'herbs': { standard: 100, range: { min: 70, max: 180 } }
    };

    const benchmark = priceBenchmarks[category] || priceBenchmarks['vegetables'];
    let basePrice = benchmark.standard;
    
    if (quality === 'premium') basePrice *= 1.3;
    if (quality === 'economy') basePrice *= 0.8;
    
    return {
      averagePrice: Math.round(basePrice),
      priceRange: benchmark.range,
      source: 'platform_history'
    };
  }

  // Get actual average prices from Firestore
  static async getPlatformAveragePrice(category: string): Promise<number> {
    try {
      const salesQuery = query(
        collection(db, "products"),
        where("category", "==", category),
        where("status", "==", "active"),
        where("price", ">", 0)
      );
      
      const snapshot = await getDocs(salesQuery);
      if (snapshot.empty) return this.calculateMarketBasedPrice(category).averagePrice;
      
      const prices = snapshot.docs.map(doc => doc.data().price).filter(Boolean);
      const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      
      return Math.round(average);
    } catch (error) {
      console.error("Error getting platform average price:", error);
      return this.calculateMarketBasedPrice(category).averagePrice;
    }
  }
}

export class PricingCalculator {
  // Calculate complete price breakdown
  static calculateProductPricing(
    farmerInputPrice: number,
    category: string,
    unit: string,
    shippingCalculation: ShippingCalculation,
    platformFeePercentage: number = 0.05
  ): PriceCalculation {
    
    const marketPrice = this.calculateMarketPrice(category, unit, farmerInputPrice);
    const farmerMarkup = Math.max(0, farmerInputPrice - marketPrice);
    const platformFee = farmerInputPrice * platformFeePercentage;
    const subtotal = farmerInputPrice + platformFee + shippingCalculation.total;
    const vatAmount = subtotal * 0.12;
    const finalPrice = subtotal + vatAmount;

    return {
      marketPrice,
      farmerMarkup,
      platformFee: Math.round(platformFee),
      shippingFee: shippingCalculation.total,
      vatAmount: Math.round(vatAmount * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100
    };
  }

  private static calculateMarketPrice(
    category: string, 
    unit: string, 
    farmerPrice: number
  ): number {
    const marketData = PricingService.calculateMarketBasedPrice(category, unit);
    const validation = this.validateFarmerPrice(farmerPrice, category, unit);
    return validation.isValid ? farmerPrice : marketData.averagePrice;
  }

  static validateFarmerPrice(
    farmerPrice: number,
    category: string,
    unit: string
  ): { isValid: boolean; suggestion?: number; reason: string } {
    
    const marketData = PricingService.calculateMarketBasedPrice(category, unit);
    const marketAverage = marketData.averagePrice;
    const minAllowed = marketAverage * 0.6;
    const maxAllowed = marketAverage * 1.4;
    
    if (farmerPrice < minAllowed) {
      return {
        isValid: false,
        suggestion: minAllowed,
        reason: `Price is below market average. Suggested: ₱${minAllowed}`
      };
    }
    
    if (farmerPrice > maxAllowed) {
      return {
        isValid: false,
        suggestion: maxAllowed,
        reason: `Price exceeds market average. Suggested: ₱${maxAllowed}`
      };
    }
    
    return {
      isValid: true,
      reason: "Price is within market range"
    };
  }

  // Calculate shipping with Philippine context
  static calculateShipping(
    distance: number,
    barangay: string,
    vehicleType: 'motorcycle' | 'tricycle' | 'van' = 'motorcycle'
  ): ShippingCalculation {
    
    const baseRates = {
      motorcycle: 20,
      tricycle: 30,
      van: 50
    };
    
    const kmRates = {
      motorcycle: 5,
      tricycle: 7,
      van: 10
    };
    
    const baseRate = baseRates[vehicleType];
    const ratePerKm = kmRates[vehicleType];
    const total = baseRate + (distance * ratePerKm);
    const estimatedTime = this.estimateDeliveryTime(distance, barangay);

    return {
      distance,
      baseRate,
      ratePerKm,
      estimatedTime,
      total: Math.round(total)
    };
  }

  private static estimateDeliveryTime(distance: number, barangay: string): string {
    if (distance <= 2) return "15-25 min";
    if (distance <= 5) return "25-40 min";
    if (distance <= 10) return "40-60 min";
    return "1-2 hours";
  }

  // Calculate distance between coordinates (Haversine formula)
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}