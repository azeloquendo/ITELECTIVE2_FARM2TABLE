import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from './firebase';

// Import pricing services
import { PricingCalculator, type PriceCalculation, type ShippingCalculation } from './pricingService';

// ✅ Added helper function for updating stock
export async function updateStock(productId: string, newStock: number) {
  try {
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, { 
      stock: newStock,
      updatedAt: serverTimestamp()
    });
    console.log(`✅ Stock updated for product ${productId}: ${newStock}`);
  } catch (error: any) {
    console.error("❌ Failed to update stock:", error);
    throw new Error(`Failed to update stock: ${error.message}`);
  }
}

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  minStock: number; 
  minimumOrderQuantity: number; // Minimum Order Quantity
  category: string;
  unit: string;
  imageUrls: string[];
  createdAt?: any;
  updatedAt?: any;
  isActive: boolean;
  sellerId: string;
  farmName: string;
  location: string;
  
  // 🔥 STEP 8: Add cold chain field
  requiresColdChain?: boolean; // For temperature-sensitive products
  
  // 🟢 ADDED: Product tags field
  tags?: string[]; // Array of product tags like ["Organic", "Fresh Harvest", etc.]
  
  // 🟢 ADDED: Rating and reviews fields for proper data structure
  rating?: number;
  reviews?: number;
  sold?: number;

  // 🟢 ADDED: New pricing transparency fields
  farmerPrice?: number;          // Price set by farmer
  marketPrice?: number;          // Calculated market reference price
  platformFee?: number;          // 5% service fee
  shippingFee?: number;          // Calculated delivery cost
  vatAmount?: number;            // 12% VAT
  finalPrice?: number;           // Total price (farmerPrice + platformFee + shippingFee + vatAmount)
  
  // 🟢 ADDED: Shipping calculation fields
  shippingBaseRate?: number;
  shippingRatePerKm?: number;
  estimatedDistance?: number;
  estimatedDeliveryTime?: string;
  
  // 🟢 ADDED: Complete price breakdown
  priceBreakdown?: PriceCalculation;
}

export interface ProductData {
  name: string;
  description: string;
  price: number;
  stock: number;
  minStock: number; // ADDED: minStock field
  // ✅ ADDED: MOQ field
  minimumOrderQuantity: number; // Minimum Order Quantity
  category: string;
  unit: string;
  images: File[];
  farmName: string;
  location: string;
  
  // 🔥 STEP 8: Add cold chain field
  requiresColdChain?: boolean; // For temperature-sensitive products
  
  // 🟢 ADDED: Product tags field
  tags?: string[]; // Array of product tags like ["Organic", "Fresh Harvest", etc.]

  // 🟢 ADDED: New pricing fields
  farmerPrice?: number;
  shippingBaseRate?: number;
  shippingRatePerKm?: number;
}

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Helper function to compress images before upload
const compressImage = (file: File, maxWidth = 800, quality = 0.7): Promise<File> => {
  return new Promise((resolve, reject) => {
    // If file is already small, return as is
    if (file.size < 500 * 1024) { // 500KB
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              console.log(`✅ Image compressed: ${file.size} → ${compressedFile.size} bytes`);
              resolve(compressedFile);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Image loading failed'));
    };
    
    reader.onerror = () => reject(new Error('File reading failed'));
  });
};

// 🟢 ADDED: Function to calculate initial pricing for new products
const calculateInitialPricing = (
  farmerPrice: number,
  category: string,
  unit: string,
  location: string
): PriceCalculation => {
  // Default shipping calculation (will be updated when user location is available)
  const defaultShipping: ShippingCalculation = {
    distance: 5, // Default distance in km
    baseRate: 20,
    ratePerKm: 5,
    estimatedTime: '30-45 min',
    total: 45 // 20 + (5 * 5)
  };

  return PricingCalculator.calculateProductPricing(
    farmerPrice,
    category,
    unit,
    defaultShipping
  );
};

// Add new product - UPDATED VERSION with pricing transparency
export const addProduct = async (productData: ProductData, sellerId: string): Promise<Product> => {
  try {
    let imageUrls: string[] = [];
    
    // Upload all images if provided using Cloudinary
    if (productData.images && productData.images.length > 0) {
      console.log('🔄 Starting image upload for', productData.images.length, 'images');
      
      const imageUploads = productData.images.map(async (imageFile, index) => {
        try {
          console.log(`📤 Processing image ${index + 1}:`, imageFile.name, 'Size:', imageFile.size, 'bytes');
          
          // Compress image before upload to reduce size
          const compressedFile = await compressImage(imageFile);
          
          const base64Data = await fileToBase64(compressedFile);
          
          const imagePayload = {
            base64Data,
            fileName: compressedFile.name
          };

          console.log('📨 Sending to Cloudinary API...');
          
          const response = await fetch('/api/upload-cloudinary', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              images: [imagePayload]
            }),
          });

          console.log('📩 API Response status:', response.status);
          
          if (!response.ok) {
            if (response.status === 413) {
              throw new Error('Image too large even after compression. Please use a smaller image.');
            }
            throw new Error(`Upload failed with status: ${response.status}`);
          }

          const result = await response.json();
          console.log('✅ Upload successful:', result);
          
          if (!result.success) {
            throw new Error(result.error || 'Image upload failed');
          }

          return result.imageUrls[0];
        } catch (error: any) {
          console.error(`❌ Failed to upload image ${index + 1}:`, error);
          throw error;
        }
      });

      imageUrls = await Promise.all(imageUploads);
      console.log('🎉 All images uploaded successfully');
    }

    // 🟢 ADDED: Calculate price breakdown
    const farmerPrice = productData.farmerPrice || productData.price;
    const priceBreakdown = calculateInitialPricing(
      farmerPrice,
      productData.category,
      productData.unit,
      productData.location
    );

    const productWithMetadata: Omit<Product, 'id'> = {
      name: productData.name,
      description: productData.description,
      price: productData.price, // Keep original price for backward compatibility
      stock: productData.stock,
      minStock: productData.minStock, // ADDED: minStock field
      // ✅ ADDED: MOQ field with default value
      minimumOrderQuantity: productData.minimumOrderQuantity || 1,
      category: productData.category,
      unit: productData.unit,
      farmName: productData.farmName,
      location: productData.location,
      imageUrls: imageUrls,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      sellerId: sellerId, // ← USE THE ACTUAL SELLER ID
      // 🔥 STEP 8: Add cold chain field
      requiresColdChain: productData.requiresColdChain || false,
      // 🟢 ADDED: Product tags with validation
      tags: productData.tags ? productData.tags.slice(0, 4) : [], // Limit to 4 tags
      // 🟢 ADDED: Initialize rating and review fields
      rating: 0,
      reviews: 0,
      sold: 0,
      // 🟢 ADDED: New pricing transparency fields
      farmerPrice: farmerPrice,
      marketPrice: priceBreakdown.marketPrice,
      platformFee: priceBreakdown.platformFee,
      shippingFee: priceBreakdown.shippingFee,
      vatAmount: priceBreakdown.vatAmount,
      finalPrice: priceBreakdown.finalPrice,
      // 🟢 ADDED: Shipping calculation fields
      shippingBaseRate: productData.shippingBaseRate || 20,
      shippingRatePerKm: productData.shippingRatePerKm || 5,
      estimatedDistance: 5, // Default, will be updated
      estimatedDeliveryTime: '30-45 min',
      // 🟢 ADDED: Complete price breakdown
      priceBreakdown: priceBreakdown
    };

    console.log('💾 Saving product to Firestore for seller:', sellerId);
    console.log('🏠 Farm details:', { 
      farmName: productData.farmName, 
      location: productData.location 
    });
    console.log('📊 Stock details:', {
      stock: productData.stock,
      minStock: productData.minStock,
      minimumOrderQuantity: productData.minimumOrderQuantity || 1 // ✅ ADDED: MOQ logging
    });
    console.log('💰 Pricing details:', {
      farmerPrice: farmerPrice,
      marketPrice: priceBreakdown.marketPrice,
      platformFee: priceBreakdown.platformFee,
      shippingFee: priceBreakdown.shippingFee,
      vatAmount: priceBreakdown.vatAmount,
      finalPrice: priceBreakdown.finalPrice
    });
    console.log('❄️ Cold Chain:', productData.requiresColdChain ? 'Yes' : 'No');
    console.log('🏷️ Product Tags:', productData.tags || []);
    
    const docRef = await addDoc(collection(db, 'products'), productWithMetadata);
    console.log('✅ Product created with ID:', docRef.id);
    
    return { 
      id: docRef.id, 
      ...productWithMetadata
    };
  } catch (error: any) {
    console.error('❌ Error adding product:', error);
    throw new Error(`Failed to add product: ${error.message}`);
  }
};

// Get all products
export const getProducts = async (sellerId: string | null = null): Promise<Product[]> => {
  try {
    let q;
    if (sellerId) {
      q = query(
        collection(db, 'products'),
        where('sellerId', '==', sellerId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'products'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];

    return products;
  } catch (error: any) {
    console.error('Error getting products:', error);
    throw new Error(`Failed to get products: ${error.message}`);
  }
};

// Get product by ID
export const getProductById = async (id: string): Promise<Product> => {
  try {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    } else {
      throw new Error('Product not found');
    }
  } catch (error: any) {
    console.error('Error getting product:', error);
    throw new Error(`Failed to get product: ${error.message}`);
  }
};

// Update product - UPDATED with pricing fields
export const updateProduct = async (
  id: string, 
  productData: Partial<Product>, 
  newImages: File[] = []
): Promise<Product> => {
  try {
    console.log('🔄 Starting product update for ID:', id);
    
    // 🔥 TEMPORARY FIX FOR MOCK DATA - Skip Firebase check for simple IDs
    if (id && id.length < 10) { // Simple IDs are usually short (like "1", "2", "7")
      console.log('🎭 Mock data detected, returning simulated update for ID:', id);
      
      // Simulate successful update for mock data
      const mockUpdatedProduct = {
        id,
        name: productData.name || '',
        description: productData.description || '',
        price: productData.price || 0,
        stock: productData.stock || 0,
        minStock: productData.minStock || 10, // ADDED: minStock field
        // ✅ ADDED: MOQ field
        minimumOrderQuantity: productData.minimumOrderQuantity || 1,
        category: productData.category || '',
        unit: productData.unit || '',
        farmName: productData.farmName || '',
        location: productData.location || '',
        imageUrls: productData.imageUrls || [],
        updatedAt: new Date(),
        createdAt: new Date(), // Fallback
        isActive: true,
        sellerId: 'current-user-id',
        // 🔥 STEP 8: Add cold chain field
        requiresColdChain: productData.requiresColdChain || false,
        // 🟢 ADDED: Product tags
        tags: productData.tags || [],
        rating: productData.rating || 0,
        reviews: productData.reviews || 0,
        sold: productData.sold || 0,
        // 🟢 ADDED: New pricing fields
        farmerPrice: productData.farmerPrice || productData.price || 0,
        marketPrice: productData.marketPrice || productData.price || 0,
        platformFee: productData.platformFee || 0,
        shippingFee: productData.shippingFee || 0,
        vatAmount: productData.vatAmount || 0,
        finalPrice: productData.finalPrice || productData.price || 0
      } as Product;
      
      console.log('✅ Mock update successful:', mockUpdatedProduct);
      return mockUpdatedProduct;
    }
    
    // For real Firebase IDs, do the normal check
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.error('❌ Document not found for ID:', id);
      throw new Error(`Product with ID "${id}" not found. It may have been deleted.`);
    }

    console.log('✅ Document exists, current data:', docSnap.data());

    const existingData = docSnap.data();
    let imageUrls = existingData.imageUrls || []; // Start with existing images
    
    // Upload new images if provided using Cloudinary
    if (newImages && newImages.length > 0) {
      console.log('📤 Uploading', newImages.length, 'new images');
      
      const imageUploads = newImages.map(async (imageFile, index) => {
        try {
          console.log(`📤 Uploading new image ${index + 1}:`, imageFile.name, 'Size:', imageFile.size, 'bytes');
          
          // Compress image before upload to reduce size
          const compressedFile = await compressImage(imageFile);
          
          const base64Data = await fileToBase64(compressedFile);
          
          const imagePayload = {
            base64Data,
            fileName: compressedFile.name
          };

          console.log('📨 Sending to Cloudinary API...');
          
          const response = await fetch('/api/upload-cloudinary', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              images: [imagePayload]
            }),
          });

          console.log('📩 API Response status:', response.status);
          
          if (!response.ok) {
            if (response.status === 413) {
              throw new Error('Image too large even after compression. Please use a smaller image.');
            }
            throw new Error(`Upload failed with status: ${response.status}`);
          }

          const result = await response.json();
          console.log('✅ New image upload successful:', result);
          
          if (!result.success) {
            throw new Error(result.error || 'Image upload failed');
          }

          return result.imageUrls[0];
        } catch (error: any) {
          console.error(`❌ Failed to upload new image ${index + 1}:`, error);
          throw error;
        }
      });

      const newImageUrls = await Promise.all(imageUploads);
      imageUrls = [...newImageUrls]; // Replace existing images with new ones
      console.log('✅ New images uploaded, replacing existing ones:', imageUrls);
    } else {
      console.log('🔄 No new images provided, keeping existing images:', imageUrls);
    }

    // 🟢 ADDED: Recalculate pricing if farmer price changes
    let priceBreakdown = existingData.priceBreakdown;
    const farmerPriceToUse = productData.farmerPrice !== undefined 
      ? productData.farmerPrice 
      : (productData.price !== undefined ? productData.price : existingData.farmerPrice || existingData.price);
    
    if (productData.farmerPrice !== undefined && productData.farmerPrice !== existingData.farmerPrice) {
      const shipping: ShippingCalculation = {
        distance: existingData.estimatedDistance || 5,
        baseRate: existingData.shippingBaseRate || 20,
        ratePerKm: existingData.shippingRatePerKm || 5,
        estimatedTime: existingData.estimatedDeliveryTime || '30-45 min',
        total: existingData.shippingFee || 45
      };

      priceBreakdown = PricingCalculator.calculateProductPricing(
        farmerPriceToUse,
        productData.category || existingData.category,
        productData.unit || existingData.unit,
        shipping
      );
    }

    // Helper function to filter out undefined values
    const filterUndefined = (obj: any) => {
      const filtered: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          filtered[key] = obj[key];
        }
      }
      return filtered;
    };

    const updateData = filterUndefined({
      name: productData.name,
      description: productData.description,
      price: productData.price,
      stock: productData.stock,
      minStock: productData.minStock, // ADDED: minStock field
      // ✅ ADDED: MOQ field
      minimumOrderQuantity: productData.minimumOrderQuantity !== undefined 
        ? productData.minimumOrderQuantity 
        : existingData.minimumOrderQuantity || 1,
      category: productData.category,
      unit: productData.unit,
      farmName: productData.farmName,
      location: productData.location,
      imageUrls: imageUrls,
      updatedAt: serverTimestamp(),
      // 🔥 STEP 8: Add cold chain field
      requiresColdChain: productData.requiresColdChain,
      // 🟢 ADDED: Product tags with validation
      tags: productData.tags ? productData.tags.slice(0, 4) : existingData.tags || [],
      // 🟢 ADDED: Preserve or update farmerPrice - never set to undefined
      farmerPrice: farmerPriceToUse,
      // 🟢 ADDED: Update pricing fields if recalculated
      ...(priceBreakdown && {
        marketPrice: priceBreakdown.marketPrice,
        platformFee: priceBreakdown.platformFee,
        shippingFee: priceBreakdown.shippingFee,
        vatAmount: priceBreakdown.vatAmount,
        finalPrice: priceBreakdown.finalPrice,
        priceBreakdown: priceBreakdown
      })
    });

    console.log('💾 Updating document with:', updateData);

    await updateDoc(docRef, updateData);
    console.log('✅ Product updated successfully');
    
    return { 
      id, 
      ...updateData,
      createdAt: existingData.createdAt, // Keep original creation date
      isActive: existingData.isActive !== undefined ? existingData.isActive : true,
      sellerId: existingData.sellerId || 'current-user-id',
      rating: existingData.rating || 0,
      reviews: existingData.reviews || 0,
      sold: existingData.sold || 0,
      // 🟢 ADDED: Include pricing fields in return
      farmerPrice: priceBreakdown ? priceBreakdown.marketPrice : existingData.farmerPrice,
      marketPrice: priceBreakdown ? priceBreakdown.marketPrice : existingData.marketPrice,
      platformFee: priceBreakdown ? priceBreakdown.platformFee : existingData.platformFee,
      shippingFee: priceBreakdown ? priceBreakdown.shippingFee : existingData.shippingFee,
      vatAmount: priceBreakdown ? priceBreakdown.vatAmount : existingData.vatAmount,
      finalPrice: priceBreakdown ? priceBreakdown.finalPrice : existingData.finalPrice,
      priceBreakdown: priceBreakdown || existingData.priceBreakdown
    } as Product;
  } catch (error: any) {
    console.error('❌ Error updating product:', error);
    throw new Error(`Failed to update product: ${error.message}`);
  }
};

// Delete product (soft delete)
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    // 🔥 TEMPORARY FIX FOR MOCK DATA - Skip Firebase for simple IDs
    if (id && id.length < 10) {
      console.log('🎭 Mock data detected, skipping Firebase delete for ID:', id);
      return; // Just return without doing anything for mock data
    }
    
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    throw new Error(`Failed to delete product: ${error.message}`);
  }
};

// Get products by category
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, 'products'), 
      where('category', '==', category),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  } catch (error: any) {
    console.error('Error getting products by category:', error);
    throw new Error(`Failed to get products by category: ${error.message}`);
  }
};

// Search products by name
export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
  try {
    const allProducts = await getProducts();
    
    // Since Firestore doesn't support full-text search, we filter client-side
    return allProducts.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // 🟢 ADDED: Search by tags
      (product.tags && product.tags.some(tag => 
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
  } catch (error: any) {
    console.error('Error searching products:', error);
    throw new Error(`Failed to search products: ${error.message}`);
  }
};

// 🟢 ADDED: Get products by tags
export const getProductsByTags = async (tags: string[]): Promise<Product[]> => {
  try {
    const allProducts = await getProducts();
    
    // Filter products that have at least one of the specified tags
    return allProducts.filter(product => 
      product.tags && product.tags.some(tag => 
        tags.includes(tag)
      )
    );
  } catch (error: any) {
    console.error('Error getting products by tags:', error);
    throw new Error(`Failed to get products by tags: ${error.message}`);
  }
};

// 🟢 ADDED: Function to update product pricing with actual distance
export const updateProductPricingWithDistance = async (
  productId: string,
  userLocation: { lat: number; lng: number },
  farmerLocation: { lat: number; lng: number },
  farmerBarangay: string
): Promise<PriceCalculation> => {
  try {
    const docRef = doc(db, "products", productId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Product not found');
    }

    const product = docSnap.data() as Product;
    
    // Calculate actual distance
    const distance = PricingCalculator.calculateDistance(
      userLocation.lat,
      userLocation.lng,
      farmerLocation.lat,
      farmerLocation.lng
    );
    
    // Calculate shipping with actual distance
    const shipping = PricingCalculator.calculateShipping(
      distance,
      farmerBarangay,
      'motorcycle'
    );
    
    // Recalculate complete price breakdown
    const priceBreakdown = PricingCalculator.calculateProductPricing(
      product.farmerPrice || product.price || 0,
      product.category,
      product.unit,
      shipping
    );

    // Update product with new pricing
    await updateDoc(docRef, {
      estimatedDistance: distance,
      shippingFee: shipping.total,
      estimatedDeliveryTime: shipping.estimatedTime,
      priceBreakdown: priceBreakdown,
      marketPrice: priceBreakdown.marketPrice,
      platformFee: priceBreakdown.platformFee,
      vatAmount: priceBreakdown.vatAmount,
      finalPrice: priceBreakdown.finalPrice,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Product pricing updated with actual distance:', {
      productId,
      distance: `${distance.toFixed(1)} km`,
      shippingFee: shipping.total,
      finalPrice: priceBreakdown.finalPrice
    });

    return priceBreakdown;
  } catch (error: any) {
    console.error('❌ Error updating product pricing with distance:', error);
    throw new Error(`Failed to update product pricing: ${error.message}`);
  }
};

// 🟢 ADDED: Function to validate and update farmer price
export const validateAndUpdateFarmerPrice = async (
  productId: string,
  newFarmerPrice: number
): Promise<{ isValid: boolean; suggestion?: number; reason: string; priceBreakdown?: PriceCalculation }> => {
  try {
    const docRef = doc(db, "products", productId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Product not found');
    }

    const product = docSnap.data() as Product;
    
    // Validate the new price
    const validation = PricingCalculator.validateFarmerPrice(
      newFarmerPrice,
      product.category,
      product.unit
    );

    if (validation.isValid) {
      // Get current shipping data
      const shipping: ShippingCalculation = {
        distance: product.estimatedDistance || 5,
        baseRate: product.shippingBaseRate || 20,
        ratePerKm: product.shippingRatePerKm || 5,
        estimatedTime: product.estimatedDeliveryTime || '30-45 min',
        total: product.shippingFee || 45
      };

      // Recalculate price breakdown
      const priceBreakdown = PricingCalculator.calculateProductPricing(
        newFarmerPrice,
        product.category,
        product.unit,
        shipping
      );

      // Update the product
      await updateDoc(docRef, {
        farmerPrice: newFarmerPrice,
        priceBreakdown: priceBreakdown,
        marketPrice: priceBreakdown.marketPrice,
        platformFee: priceBreakdown.platformFee,
        vatAmount: priceBreakdown.vatAmount,
        finalPrice: priceBreakdown.finalPrice,
        updatedAt: serverTimestamp()
      });

      return {
        isValid: true,
        reason: validation.reason,
        priceBreakdown: priceBreakdown
      };
    }

    return validation;
  } catch (error: any) {
    console.error('❌ Error validating farmer price:', error);
    throw new Error(`Failed to validate farmer price: ${error.message}`);
  }
};

// ✅ ADDED: MOQ Validation Helper Functions
export const validateMOQ = (product: Product, quantity: number): { isValid: boolean; message: string } => {
  const moq = product.minimumOrderQuantity || 1;
  
  if (quantity < moq) {
    return {
      isValid: false,
      message: `Minimum order quantity for ${product.name} is ${moq} ${product.unit}.`
    };
  }
  
  return {
    isValid: true,
    message: `Quantity meets minimum order requirement.`
  };
};

export const validateCartItemsMOQ = (cartItems: Array<{ product: Product; quantity: number }>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  cartItems.forEach(item => {
    const validation = validateMOQ(item.product, item.quantity);
    if (!validation.isValid) {
      errors.push(validation.message);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};