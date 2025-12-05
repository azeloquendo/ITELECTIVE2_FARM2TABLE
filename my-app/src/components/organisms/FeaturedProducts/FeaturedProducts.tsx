'use client';
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Product } from "../../../interface/seller";
import { FeaturedProductsProps } from "../../../interface/seller/profile";
import ProductCard from "../../../components/molecules/BuyerProductCard/ProductCard";
import { auth, db } from "../../../utils/lib/firebase";
import styles from './FeaturedProducts.module.css';

export default function FeaturedProducts({ viewerRole = 'seller', farmId }: FeaturedProductsProps) {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [farmName, setFarmName] = useState("");

  const title = viewerRole === 'seller' ? 'Featured Products' : 'Farm Products';
  const subtitle = viewerRole === 'seller' ? 'Your latest products' : 'Latest products from this farm';

  useEffect(() => {
    if (viewerRole === 'seller') {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          await fetchSellerProducts(user.uid);
        } else {
          setLoading(false);
          setError("Please sign in to view featured products");
        }
      });
      return () => unsubscribe();
    } else {
      if (farmId) {
        fetchFarmProducts(farmId);
      } else {
        setLoading(false);
        setError("Farm ID not provided");
      }
    }
  }, [viewerRole, farmId]);

  const fetchSellerProducts = async (sellerId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const productsQuery = query(
        collection(db, "products"),
        where("sellerId", "==", sellerId),
        where("isActive", "==", true),
        orderBy("createdAt", "desc"),
        limit(4)
      );
      
      const querySnapshot = await getDocs(productsQuery);
      const products: Product[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        const product: Product = {
          id: doc.id,
          name: data.name || "Unnamed Product",
          price: data.price?.toString() || "0",
          image: data.imageUrls && data.imageUrls.length > 0 
            ? data.imageUrls[0] 
            : '/api/placeholder/200/200',
          unit: data.unit || "piece",
          location: data.location || "Location not set",
          farmName: data.farmName || "My Farm",
          sold: data.sold || 0,
          stock: data.quantity_available || data.stock || Math.floor(Math.random() * 50) + 10,
          rating: data.rating || (4.0 + Math.random() * 1.0),
          reviews: data.reviews || Math.floor(Math.random() * 50),
          description: data.description || "Fresh product from our farm",
          category: data.category || "vegetables",
          createdAt: data.createdAt,
          deliveryFee: data.deliveryFee || Math.floor(Math.random() * 50) + 15,
          deliveryTime: data.deliveryTime || `${Math.floor(Math.random() * 30) + 15}-${Math.floor(Math.random() * 30) + 45} min`,
          distance: data.distance || `${(Math.random() * 10 + 1).toFixed(1)} km`,
          isFeatured: true,
          imageUrls: data.imageUrls || []
        };
        products.push(product);
      });
      
      console.log(`✅ Loaded ${products.length} featured products for seller ${sellerId}`);
      setFeaturedProducts(products);
      
    } catch (err) {
      console.error("Error fetching featured products:", err);
      setError("Failed to load featured products");
    } finally {
      setLoading(false);
    }
  };

  const fetchFarmProducts = async (farmSellerId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const farmDoc = await getDoc(doc(db, "sellers", farmSellerId));
      if (farmDoc.exists()) {
        const farmData = farmDoc.data();
        setFarmName(farmData.farmName || "Farm");
      }
      
      const productsQuery = query(
        collection(db, "products"),
        where("sellerId", "==", farmSellerId),
        where("isActive", "==", true),
        orderBy("createdAt", "desc"),
        limit(4)
      );
      
      const querySnapshot = await getDocs(productsQuery);
      const products: Product[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        const product: Product = {
          id: doc.id,
          name: data.name || "Unnamed Product",
          price: data.price?.toString() || "0",
          image: data.imageUrls && data.imageUrls.length > 0 
            ? data.imageUrls[0] 
            : '/api/placeholder/200/200',
          unit: data.unit || "piece",
          location: data.location || "Location not set",
          farmName: data.farmName || "Farm",
          sold: data.sold || 0,
          stock: data.quantity_available || data.stock || Math.floor(Math.random() * 50) + 10,
          rating: data.rating || (4.0 + Math.random() * 1.0),
          reviews: data.reviews || Math.floor(Math.random() * 50),
          description: data.description || "Fresh product from this farm",
          category: data.category || "vegetables",
          createdAt: data.createdAt,
          deliveryFee: data.deliveryFee || Math.floor(Math.random() * 50) + 15,
          deliveryTime: data.deliveryTime || `${Math.floor(Math.random() * 30) + 15}-${Math.floor(Math.random() * 30) + 45} min`,
          distance: data.distance || `${(Math.random() * 10 + 1).toFixed(1)} km`,
          isFeatured: true,
          imageUrls: data.imageUrls || []
        };
        products.push(product);
      });
      
      console.log(`✅ Loaded ${products.length} products for farm ${farmSellerId}`);
      setFeaturedProducts(products);
      
    } catch (err) {
      console.error("Error fetching farm products:", err);
      setError("Failed to load farm products");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    console.log("Adding to cart:", product.name);
  };

  const handleSaveItem = (product: Product) => {
    console.log("Saving item:", product.name);
  };

  const handleViewDetails = (product: Product) => {
    console.log("Viewing details:", product.name);
  };

  if (loading) {
    return (
      <div className={styles.featuredProducts}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.sectionSubtitle}>{subtitle}</p>
        </div>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.featuredProducts}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.sectionSubtitle}>{subtitle}</p>
        </div>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>⚠️</div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.featuredProducts}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionSubtitle}>{subtitle}</p>
      </div>
      
      <div className={styles.productsContainer}>
        {featuredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
            onSaveItem={handleSaveItem}
            onViewDetails={handleViewDetails}
            showNewTag={true}
          />
        ))}
        
        {featuredProducts.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <h3>No products yet</h3>
            <p>
              {viewerRole === 'seller' 
                ? 'Create your first product to see it featured here' 
                : 'This farm has no products available yet'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

