# Farm2Table API Reference

## Overview
This document provides a comprehensive reference for all main interfaces, hooks, and component props in the Farm2Table application. Use this to prevent API misuse and ensure type safety.

---

## Table of Contents
1. [Buyer Interfaces](#buyer-interfaces)
2. [Seller Interfaces](#seller-interfaces)
3. [Context APIs](#context-apis)
4. [Buyer Hooks](#buyer-hooks)
5. [Seller Hooks](#seller-hooks)

---

## Buyer Interfaces

### MarketplaceProduct
**File:** `src/interface/buyer/marketplace.ts`

Represents a product available in the marketplace with all its details and seller information.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✓ | Unique product identifier |
| `name` | string | ✓ | Product name |
| `price` | number | ✗ | Price in local currency |
| `displayPrice` | string | ✗ | Formatted price string for UI display |
| `category` | string | ✗ | Product category (e.g., "vegetables", "fruits") |
| `status` | string | ✗ | Product status (e.g., "active", "inactive") |
| `farmName` | string | ✗ | Name of the farm/seller |
| `description` | string | ✗ | Detailed product description |
| `imageUrls` | string[] | ✗ | Array of product image URLs |
| `image` | string | ✗ | Primary product image URL |
| `sold` | number | ✗ | Total units sold |
| `quantity_available` | number | ✗ | Available stock quantity |
| `stock` | number | ✗ | Current stock level |
| `deliveryFee` | number | ✗ | Delivery cost |
| `deliveryTime` | string | ✗ | Estimated delivery time (e.g., "2-3 days") |
| `sellerId` | string | ✗ | ID of the seller |
| `farmer_id` | string | ✗ | ID of the farmer |
| `farmerBarangay` | string | ✗ | Barangay location of the farmer |
| `minimumOrderQuantity` | number | ✗ | Minimum quantity to order |
| `unit` | string | ✗ | Unit of measurement (e.g., "kg", "pieces") |
| `farmer` | Farmer | ✗ | Farmer/seller details object |
| `reviews` | any[] | ✗ | Array of product reviews |
| `reviewsCount` | number | ✗ | Total number of reviews |
| `rating` | number | ✗ | Average rating (0-5) |
| `createdAt` | any | ✗ | Product creation timestamp |
| `smartScore` | number | ✗ | AI-calculated match score (0-100) |
| `matchReason` | string | ✗ | Reason for smart matching (e.g., "Closest proximity") |
| `isSmartMatch` | boolean | ✗ | Whether product is smart-matched |
| `distance` | number | ✗ | Distance from buyer in kilometers |

**Usage Example:**
```typescript
const product: MarketplaceProduct = {
  id: "prod_123",
  name: "Fresh Tomatoes",
  price: 50,
  category: "vegetables",
  stock: 100,
  farmName: "Green Valley Farm",
  sellerId: "seller_456",
  rating: 4.5,
  reviewsCount: 12,
  imageUrls: ["https://..."],
};
```

---

### UserLocation
**File:** `src/interface/buyer/marketplace.ts`

Represents geographical coordinates.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `lat` | number | ✓ | Latitude coordinate |
| `lng` | number | ✓ | Longitude coordinate |

**Usage Example:**
```typescript
const location: UserLocation = {
  lat: 14.5995,
  lng: 120.9842
};
```

---

### Address
**File:** `src/interface/buyer/profile.ts`

Complete address structure for buyers.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `streetName` | string | ✓ | Street name |
| `building` | string | ✓ | Building name or number |
| `houseNo` | string | ✓ | House number |
| `barangay` | string | ✓ | Barangay (subdivision) |
| `city` | string | ✓ | City/Municipality |
| `province` | string | ✓ | Province |
| `region` | string | ✓ | Region |
| `postalCode` | string | ✓ | Postal code |
| `location` | UserLocation | ✗ | Geographical coordinates |

**Usage Example:**
```typescript
const address: Address = {
  streetName: "Rizal Street",
  building: "Unit 5",
  houseNo: "123",
  barangay: "Poblacion",
  city: "Quezon City",
  province: "NCR",
  region: "Region IV-A",
  postalCode: "1000",
  location: { lat: 14.5995, lng: 120.9842 }
};
```

---

### BuyerProfile
**File:** `src/interface/buyer/profile.ts`

Complete buyer profile with personal and delivery information.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✓ | Unique buyer identifier |
| `fullName` | string | ✗ | Full name of the buyer |
| `email` | string | ✗ | Email address |
| `contact` | string | ✗ | Phone number |
| `address` | Address | ✗ | Primary address |
| `deliveryAddress` | Address | ✗ | Separate delivery address |
| `profilePic` | string | ✗ | Profile picture URL |
| `avatar` | string | ✗ | Avatar image URL |
| `role` | 'buyer' | ✗ | User role (always 'buyer' for this interface) |

**Usage Example:**
```typescript
const buyerProfile: BuyerProfile = {
  id: "buyer_789",
  fullName: "Juan Dela Cruz",
  email: "juan@example.com",
  contact: "09123456789",
  address: { /* Address object */ },
  deliveryAddress: { /* Address object */ },
  role: "buyer"
};
```

---

## Seller Interfaces

### Product
**File:** `src/interface/seller/index.ts`

Represents a product managed by a seller.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✓ | Unique product identifier |
| `name` | string | ✓ | Product name |
| `image` | string | ✗ | Primary image URL |
| `location` | string | ✓ | Product location/source |
| `farmName` | string | ✓ | Farm name |
| `price` | string | ✓ | Price as string (formatted) |
| `unit` | string | ✓ | Unit of measurement |
| `sold` | number | ✓ | Units sold |
| `category` | string | ✗ | Product category |
| `description` | string | ✗ | Product description |
| `stock` | number | ✗ | Current stock quantity |
| `imageUrls` | string[] | ✗ | Array of image URLs |
| `rating` | number | ✗ | Average rating |
| `reviews` | number | ✗ | Review count |
| `distance` | string | ✗ | Distance from reference point |
| `createdAt` | any | ✗ | Creation timestamp |
| `isNew` | boolean | ✗ | Whether product is newly listed |
| `requiresColdChain` | boolean | ✗ | Requires refrigerated storage |
| `tags` | string[] | ✗ | Product tags for filtering |
| `sellerId` | string | ✗ | Seller/farmer ID |
| `productId` | string | ✗ | Alternative product ID |
| `quantity_available` | number | ✗ | Available quantity |
| `reviewsCount` | number | ✗ | Total reviews |

**Usage Example:**
```typescript
const product: Product = {
  id: "prod_001",
  name: "Fresh Mango",
  location: "Quezon City",
  farmName: "Sunset Farm",
  price: "150.00",
  unit: "kg",
  sold: 25,
  stock: 100,
  category: "fruits",
  rating: 4.8,
  reviewsCount: 45,
  requiresColdChain: false,
  tags: ["organic", "fresh"],
  sellerId: "seller_001"
};
```

---

### Order
**File:** `src/interface/seller/index.ts`

Represents an order received by the seller.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✓ | Unique order identifier |
| `buyerName` | string | ✓ | Name of the buyer |
| `products` | OrderProduct[] | ✓ | Array of ordered products |
| `totalPrice` | number | ✓ | Total order amount |
| `orderDate` | string | ✓ | Order creation date |
| `status` | string | ✓ | Order status (pending, processing, shipped, etc.) |
| `contact` | string | ✓ | Buyer's contact number |
| `address` | string | ✓ | Delivery address |
| `deliveryMethod` | string | ✓ | Delivery method (pickup, delivery, courier) |
| `specialInstructions` | string | ✗ | Special handling instructions |
| `sellers` | SellerInfo[] | ✗ | Multiple sellers' information |
| `isForCurrentSeller` | boolean | ✓ | Whether order includes items from current seller |
| `currentSellerItems` | OrderProduct[] | ✗ | Items from current seller only |
| `currentSellerSubtotal` | number | ✗ | Subtotal for current seller's items |
| `payment` | PaymentInfo | ✗ | Payment details |
| `delivery` | DeliveryInfo | ✗ | Delivery details |
| `deliveryTime` | string | ✗ | Estimated delivery time |

**Usage Example:**
```typescript
const order: Order = {
  id: "order_001",
  buyerName: "Maria Santos",
  products: [/* OrderProduct[] */],
  totalPrice: 500,
  orderDate: "2025-12-05",
  status: "processing",
  contact: "09876543210",
  address: "123 Main St, Quezon City",
  deliveryMethod: "courier",
  isForCurrentSeller: true,
  payment: { method: "online", status: "paid" },
  delivery: { method: "courier", time: "2-3 days" }
};
```

---

### OrderProduct
**File:** `src/interface/seller/index.ts`

Represents a single product item in an order.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | ✓ | Product name |
| `quantity` | number | ✓ | Quantity ordered |
| `unitPrice` | number | ✓ | Price per unit |
| `unit` | string | ✓ | Unit of measurement |
| `sellerId` | string | ✗ | Seller ID |
| `productId` | string | ✗ | Product ID |
| `image` | string | ✗ | Product image URL |
| `notes` | string | ✗ | Special notes for this item |

**Usage Example:**
```typescript
const orderProduct: OrderProduct = {
  name: "Tomatoes",
  quantity: 5,
  unitPrice: 50,
  unit: "kg",
  productId: "prod_123",
  sellerId: "seller_456",
  notes: "Keep refrigerated"
};
```

---

### DashboardStats
**File:** `src/interface/seller/index.ts`

Aggregated statistics for seller dashboard.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `today` | number | ✓ | Orders received today |
| `thisWeek` | number | ✓ | Orders this week |
| `thisMonth` | number | ✓ | Orders this month |
| `pendingOrders` | number | ✓ | Current pending orders |
| `todayRevenue` | number | ✓ | Revenue today |
| `weekRevenue` | number | ✓ | Revenue this week |
| `monthRevenue` | number | ✓ | Revenue this month |
| `revenueTrend` | string | ✓ | Trend direction ("up" or "down") |
| `lowStockItems` | number | ✓ | Products with low stock |
| `outOfStockItems` | number | ✓ | Out of stock products |
| `todaysDeliveries` | number | ✓ | Scheduled deliveries today |
| `completedDeliveries` | number | ✓ | Completed deliveries |

**Usage Example:**
```typescript
const stats: DashboardStats = {
  today: 5,
  thisWeek: 28,
  thisMonth: 120,
  pendingOrders: 3,
  todayRevenue: 1500,
  weekRevenue: 8000,
  monthRevenue: 35000,
  revenueTrend: "up",
  lowStockItems: 2,
  outOfStockItems: 0,
  todaysDeliveries: 4,
  completedDeliveries: 2
};
```

---

### SalesReport
**File:** `src/interface/seller/orders.ts`

Sales analytics report with key metrics.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `totalOrders` | number | ✓ | Total orders in period |
| `totalRevenue` | number | ✓ | Total revenue |
| `completedOrders` | number | ✓ | Successfully completed orders |
| `pendingOrders` | number | ✓ | Orders awaiting processing |
| `canceledOrders` | number | ✓ | Cancelled orders |
| `averageOrderValue` | number | ✓ | Average order amount |
| `topProducts` | object[] | ✓ | Top-selling products with stats |

**Top Product Structure:**
```typescript
{
  name: string;          // Product name
  quantity: number;      // Units sold
  revenue: number;       // Revenue from this product
}
```

**Usage Example:**
```typescript
const report: SalesReport = {
  totalOrders: 50,
  totalRevenue: 25000,
  completedOrders: 48,
  pendingOrders: 2,
  canceledOrders: 0,
  averageOrderValue: 500,
  topProducts: [
    { name: "Tomatoes", quantity: 200, revenue: 10000 },
    { name: "Lettuce", quantity: 150, revenue: 4500 }
  ]
};
```

---

## Context APIs

### AuthContext
**File:** `src/app/context/AuthContext.tsx`

Provides authentication state and user profile information throughout the application.

#### AuthContextType Interface

| Property | Type | Description |
|----------|------|-------------|
| `user` | User \| null | Firebase User object (null if not authenticated) |
| `userProfile` | UserProfile \| null | Extended user profile with role and details |
| `loading` | boolean | Whether authentication is being checked |
| `refreshUserProfile()` | Promise\<void\> | Manually refresh user profile from database |
| `logout()` | Promise\<void\> | Log out current user |
| `userRole` | 'seller' \| 'buyer' \| 'admin' \| null | Current user's role |

#### UserProfile Type (in AuthContext)

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | User ID |
| `email` | string | Email address |
| `fullName` | string | Full name |
| `contact` | string | Phone number |
| `address` | string | Address string |
| `role` | 'seller' \| 'buyer' \| 'admin' | User role |
| `farmName` | string | Farm name (for sellers) |
| `logo` | string | Farm logo URL |
| `deliveryAddress` | object | Delivery address details |

**Usage Example:**
```typescript
import { useAuth } from '@/app/context/AuthContext';

export function MyComponent() {
  const { user, userProfile, loading, logout } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  
  if (!user) return <LoginPrompt />;
  
  return (
    <div>
      <h1>Welcome, {userProfile?.fullName}</h1>
      <p>Role: {userProfile?.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

### CartContext
**File:** `src/app/context/CartContext.tsx`

Manages shopping cart state and operations.

#### CartContextType Interface

| Property | Type | Description |
|----------|------|-------------|
| `cartItems` | CartItem[] | Array of items in cart |
| `isCartOpen` | boolean | Whether cart sidebar is visible |
| `addToCart(product, quantity?)` | void | Add product to cart (default quantity: 1) |
| `removeFromCart(id)` | void | Remove product from cart |
| `updateQuantity(id, quantity)` | void | Update item quantity |
| `updateNotes(id, notes)` | void | Update special notes for item |
| `openCart()` | void | Open cart sidebar |
| `closeCart()` | void | Close cart sidebar |
| `clearCart()` | void | Empty entire cart |
| `totalItems` | number | Total items in cart |
| `totalAmount` | number | Total cart value |
| `getItemQuantity(id)` | number | Get quantity of specific item |
| `isInCart(id)` | boolean | Check if item is in cart |

#### CartItem Interface

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✓ | Product ID |
| `name` | string | ✓ | Product name |
| `location` | string | ✓ | Product location |
| `price` | number | ✓ | Unit price |
| `unit` | string | ✓ | Unit of measurement |
| `quantity` | number | ✓ | Quantity in cart |
| `notes` | string | ✓ | Special handling notes |
| `image` | string | ✗ | Product image URL |
| `imageUrls` | string[] | ✗ | Multiple image URLs |
| `farmName` | string | ✗ | Farm/seller name |
| `sellerId` | string | ✗ | Seller ID (crucial for orders) |
| `category` | string | ✗ | Product category |
| `stock` | number | ✗ | Available stock |
| `minimumOrderQuantity` | number | ✗ | Minimum order quantity |
| `farmer` | object | ✗ | Farmer details with location |
| `requiresColdChain` | boolean | ✗ | Requires refrigeration |
| `coldChain` | boolean | ✗ | Cold chain flag |
| `tags` | string[] | ✗ | Product tags |
| `productType` | string | ✗ | Product type classification |

**Usage Example:**
```typescript
import { useCart } from '@/app/context/CartContext';

export function ProductCard({ product }) {
  const { addToCart, isInCart, getItemQuantity } = useCart();
  
  const handleAddToCart = () => {
    addToCart(product, 5); // Add with quantity 5
  };
  
  const quantityInCart = getItemQuantity(product.id);
  
  return (
    <div>
      <h3>{product.name}</h3>
      {isInCart(product.id) && (
        <p>Already in cart: {quantityInCart} units</p>
      )}
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
```

---

## Buyer Hooks

### useMarketplace
**File:** `src/hooks/buyer/useMarketplace.ts`

Fetches and manages marketplace products with smart matching and filtering.

**Parameters:**
- `selectedCategory` (string, optional): Filter by category (default: 'all')

**Return Type:**
```typescript
{
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  products: MarketplaceProduct[];
  loading: boolean;
  locationFilteredProducts: MarketplaceProduct[];
  locationLoading: boolean;
  categoryAverages: Record<string, number>;
  currentUserLocation: UserLocation | null;
  // Additional methods for product fetching and filtering
}
```

**Features:**
- ✓ Smart product matching based on location and preferences
- ✓ Real-time review fetching
- ✓ Category-based filtering
- ✓ Sort by proximity, price, rating, demand
- ✓ Location-aware product filtering

**Usage Example:**
```typescript
import { useMarketplace } from '@/hooks/buyer/useMarketplace';

export function MarketplaceComponent() {
  const {
    products,
    loading,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    locationFilteredProducts
  } = useMarketplace('vegetables');
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      <input 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search products..."
      />
      
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
        <option value="smart">Smart Match</option>
        <option value="price">Price</option>
        <option value="rating">Rating</option>
      </select>
      
      {locationFilteredProducts.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

## Seller Hooks

### useSellerProducts
**File:** `src/hooks/seller/useSellerProducts.ts`

Manages seller's product inventory with real-time updates.

**Return Type:**
```typescript
{
  products: Product[];
  loading: boolean;
  error: string | null;
  currentUser: any;
  refetch: () => void;
}
```

**Features:**
- ✓ Real-time product subscription
- ✓ Review fetching for each product
- ✓ Rating calculation from reviews
- ✓ Automatic data enrichment with seller information
- ✓ Error handling with fallback data

**Usage Example:**
```typescript
import { useSellerProducts } from '@/hooks/seller/useSellerProducts';

export function ProductsManagement() {
  const { products, loading, error, refetch } = useSellerProducts();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div>
      <h2>My Products ({products.length})</h2>
      <button onClick={refetch}>Refresh</button>
      
      {products.map(product => (
        <ProductRow key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

## Component Props Reference

### OrderDetails Props
**File:** `src/interface/seller/orders.ts`

Props for the OrderDetails component.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `order` | OrderDetailsData | ✓ | Complete order data to display |
| `onClose` | () => void | ✓ | Callback when closing the component |
| `onStatusUpdate` | (orderId: string, newStatus: string) => void | ✓ | Callback for status updates |

---

### GenerateReportModal Props
**File:** `src/interface/seller/orders.ts`

Props for the sales report generation modal.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onClose` | () => void | ✓ | Close modal callback |
| `onGenerateReport` | (filters: ReportFilters) => Promise\<SalesReport\> | ✓ | Generate report function |
| `onExportCSV` | (report: SalesReport, filters: ReportFilters) => void | ✓ | Export to CSV function |
| `generatingReport` | boolean | ✓ | Loading state |
| `reportData` | SalesReport \| null | ✓ | Current report data |

---

## Common Patterns & Best Practices

### 1. Type Safety with Product Data
```typescript
// ✓ GOOD: Use explicit types
const product: MarketplaceProduct = {
  id: "prod_123",
  name: "Tomatoes",
  price: 50,
  farmName: "Farm A",
  // ... required fields
};

// ✗ AVOID: Using any type
const product: any = { /* ... */ };
```

### 2. Handling Optional Fields
```typescript
// ✓ GOOD: Check optional fields before using
if (product.farmer?.location?.lat) {
  calculateDistance(product.farmer.location);
}

// ✗ AVOID: Direct access without checking
const lat = product.farmer.location.lat; // May throw error
```

### 3. Cart Operations
```typescript
// ✓ GOOD: Always provide quantity
cart.addToCart(product, 5);

// ✗ AVOID: Forgetting quantity parameter
cart.addToCart(product); // Uses default 1
```

### 4. API Calls in Hooks
```typescript
// ✓ GOOD: Handle loading and error states
if (loading) return <Spinner />;
if (error) return <ErrorMessage />;
return <Content data={data} />;

// ✗ AVOID: Not handling states
return <Content data={data} />;
```

---

## Troubleshooting Guide

### Issue: Product not displaying in cart
**Check:**
- Ensure `sellerId` is populated in the product object
- Verify `id` is unique
- Check if `price` is a valid number

### Issue: Location filtering not working
**Check:**
- Verify `userProfile.address.location` or `deliveryAddress.location` exists
- Ensure coordinates are valid latitude/longitude values
- Check if farmer data includes location information

### Issue: Smart matching scores not calculating
**Check:**
- Verify all products have required fields (price, rating, distance)
- Check category averages are properly calculated
- Ensure user profile includes address data

---

## Version & Updates

**Last Updated:** December 5, 2025  
**Application:** Farm2Table v1.0  
**API Stability:** Production Ready

