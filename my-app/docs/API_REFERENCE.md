# API Reference — Interfaces, Hooks, and Component Props

This reference lists the main TypeScript interfaces, React hooks, and component props found under `src/` for the Farm2Table app. It describes properties, types, and usage notes to prevent misuse.

---

## Table of contents
- Interfaces
  - `Product`
  - `ProductData`
  - `UserProfile` (buyer)
  - `SellerProfile`
  - `CartItem`
  - `DeliveryInfo`
  - `Coordinates` / `BarangayCoordinates`
  - `CreateOrderResponse` / `ApiOrderData`
  - `MarketPriceData`, `PriceCalculation`, `ShippingCalculation`
- Hooks
  - `useContactForm`
  - `useCart`
  - `useCategory`
  - `useAuth`
- Component Props
  - `LocationPickerProps`
  - `MapPreviewProps`
  - `PriceBreakdownProps`
  - `ProductCardProps`
  - `CartSidebarProps`
  - `SubmenuSidebarProps`

---

## Interfaces

### Product
Source: `src/utils/lib/productService.ts`, `src/components/ui/ProductCard.tsx`

- `id?: string` — product id assigned by the database after creation.
- `name: string` — display name.
- `description: string` — product description.
- `price: number` — canonical numeric price (UI sometimes accepts `string` for display; normalize before sending to APIs).
- `stock: number` — available quantity in inventory.
- `minStock: number` — threshold to flag low-stock.
- `minimumOrderQuantity: number` — MOQ (minimum order quantity buyers may place).
- `category: string` — product category key.
- `unit: string` — measurement unit (e.g., `kg`, `pc`).
- `imageUrls: string[]` — uploaded image URLs (Cloudinary or similar).
- `createdAt?: any`, `updatedAt?: any` — Firestore timestamps (serverTimestamp possible).
- `isActive: boolean` — whether product is published.
- `sellerId: string` — seller user id.
- `farmName: string` — farm/store display name.
- `location: string | object` — display location string or structured location object.
- `requiresColdChain?: boolean` — if product requires temperature-controlled delivery.
- `tags?: string[]` — optional tags like `['Organic', 'Fresh']`.
- `rating?: number`, `reviews?: number`, `sold?: number` — optional metrics.
- Pricing transparency fields (optional): `farmerPrice?: number`, `marketPrice?: number`, `platformFee?: number`, `shippingFee?: number`, `vatAmount?: number`, `finalPrice?: number`.
- Shipping metadata: `shippingBaseRate?: number`, `shippingRatePerKm?: number`, `estimatedDistance?: number`, `estimatedDeliveryTime?: string`.
- `priceBreakdown?: PriceCalculation` — detailed breakdown (see Pricing section).

Usage notes: prefer numeric `price` in services and server payloads. When passing product to UI components that accept `price` as `string`, format for display but keep canonical numeric values for calculations.

---

### ProductData
Source: `src/utils/lib/productService.ts` — used when creating/updating a product.

- `name: string`
- `description: string`
- `price: number`
- `stock: number`
- `minStock: number`
- `minimumOrderQuantity: number`
- `category: string`
- `unit: string`
- `images: File[]` — File objects to be uploaded; service converts to `imageUrls`.
- `farmName: string`
- `location: string`
- Optional: `requiresColdChain?: boolean`, `tags?: string[]`, `farmerPrice?: number`, `shippingBaseRate?: number`, `shippingRatePerKm?: number`.

Usage: pass `ProductData` to `addProduct(...)`. Do not pass `imageUrls` in the input — images are uploaded by the service and returned as `imageUrls` on the stored `Product`.

---

### UserProfile (buyer)
Source: `src/utils/lib/profileService.ts` and `src/app/context/AuthContext.tsx`

- `uid` / `id`: `string` — user id.
- `fullName: string`
- `email: string`
- `contact: string`
- `address`: object with:
  - `streetName: string`
  - `building: string`
  - `houseNo: string`
  - `barangay: string`
  - `city: string`
  - `province: string`
  - `region: string`
  - `postalCode: string`
- `profilePic: string` — URL
- `role: 'buyer' | 'seller'`
- `emailVerified: boolean`
- `createdAt?: any`, `updatedAt?: any`

Usage: canonical buyer shape stored in `buyers` collection. Some older code uses `deliveryAddress` — prefer `address` and the structured fields.

---

### SellerProfile
Source: `src/utils/lib/sellerProfileService.ts`

- `id`, `uid`, `userId`: `string`
- `fullName`, `email`, `contact`: `string`
- `age: number`, `birthday: string`, `role: string`
- `farm`: `{ farmName: string; description: string; logo: string }`
- `address`: structured fields plus `location: { lat: number; lng: number }`
- `profilePic`, `coverPhoto`: `string`
- `gallery: string[]`
- `farmers: Array<{ id: string; name: string; role: string; photo: string; bio: string }>`
- `rating: number`, `followerCount: number`, `isVerified: boolean`
- `createdAt?: any`, `updatedAt?: any`

Usage: seller metadata and farm info for seller pages. `farm.logo` commonly stores Cloudinary URLs.

---

### CartItem
Source: `src/app/context/CartContext.tsx`

- `id: string` — product id
- `name: string`
- `location: string | object`
- `price: number`
- `unit: string`
- `quantity: number`
- `notes: string`
- Optional fields: `image?: string`, `imageUrls?: string[]`, `farmName?: string`, `sellerId?: string`, `category?: string`, `stock?: number`
- `minimumOrderQuantity?: number` — used for MOQ validation
- `farmer?: { location?: { lat: number; lng: number }; barangay?: string; displayName?: string; fullName?: string }`

Usage: internal cart state. Keep `sellerId` to group items by seller when creating orders. Validate `stock` and `minimumOrderQuantity` both client- and server-side.

---

### DeliveryInfo
Source: `src/utils/lib/distanceCalculator.ts`

- `distance: number` — kilometers, returned rounded to one decimal place.
- `deliveryFee: number` — calculated numeric fee (site-specific formula).
- `etaMinutes: number` — estimated minutes.

Returned by `calculateDeliveryInfo(buyerCoords, farmerCoords)`. Use for UI ETA and fee display.

---

### Coordinates / BarangayCoordinates
Source: `src/utils/lib/brgyCoordinates.ts`

- `Coordinates` — `{ lat: number; lng: number }`.
- `BarangayCoordinates` — mapping `{ [city: string]: { [barangay: string]: Coordinates } }`.

Helper functions: `getBarangayCoordinates(city, barangay)`, `getBarangaysByCity(city)`, `isValidCity(city)`, `isValidBarangay(city, barangay)`.

---

### CreateOrderResponse / ApiOrderData
Source: `src/utils/lib/orderApiService.ts`

- `CreateOrderResponse`:
  - `success: boolean`
  - `orderId: string`
  - `orderNumber: string`
  - `message: string`

- `ApiOrderData` (order payload) — key fields:
  - `id: string`, `orderNumber: string`
  - `buyerId: string` and `buyerInfo: { id, name, address, contact?, email? }`
  - Compatibility fields: `buyerName`, `contact`, `address`
  - `deliveryMethod: 'Delivery' | 'Pickup'`, `deliveryDate: string`, `deliveryTime: string`
  - `deliveryAddress: string | null`, `pickupLocation: string | null`, `deliveryFee: number`, `deliveryOption: string | null`
  - `paymentMethod: string`, `paymentType: 'cash' | 'digital'`, `paymentStatus: string`
  - `products: Array<{ name, quantity, unitPrice, unit }>`
  - `sellers: Array<{ sellerId, sellerName, items: [{ productId, name, price, quantity, notes, unit, image }], subtotal }>`
  - `subtotal: number`, `totalPrice: number`, `specialInstructions: string`
  - `itemCount: number`, `productCount: number`
  - optional `logistics?: { courier: string; tracking_number: string; cold_chain: boolean; delivery_status: string }`

Usage: include `orderNumber` in request payloads and validate server response contains `orderNumber`. The client code will retry order-number generation on collisions.

---

### Pricing-related interfaces
Source: `src/utils/lib/pricingService.ts`

- `MarketPriceData`:
  - `averagePrice: number`
  - `priceRange: { min: number; max: number }`
  - `source: 'platform_history' | 'manual_research' | 'farmer_input'`

- `PriceCalculation`:
  - `marketPrice: number`
  - `farmerMarkup: number`
  - `platformFee: number`
  - `shippingFee: number`
  - `vatAmount: number`
  - `subtotal: number`
  - `finalPrice: number`

- `ShippingCalculation`:
  - `distance: number`
  - `baseRate: number`
  - `ratePerKm: number`
  - `estimatedTime: string`
  - `total: number`

Usage: `PricingCalculator.calculateProductPricing(...)` returns `PriceCalculation`. Use these values for the `PriceBreakdown` UI and consistency between product listing and cart/order flows.

---

## Hooks

### useContactForm
Source: `src/hooks/useContactForm.ts`

Signature: `useContactForm({ endpoint: string, onSuccess?: () => void })`

Returns:
- `isSubmitting: boolean` — request in progress
- `submitSuccess: boolean` — toggles true briefly on success
- `error: string` — error message
- `submitForm(formData: any): Promise<any>` — POST JSON to `endpoint`; attaches `submittedAt` timestamp
- `setError` — setter for the error state

Usage: suitable for contact or simple JSON-form forms. Important: caller should `try/catch` `submitForm` because it throws on non-2xx responses.

---

### useCart
Source: `src/app/context/CartContext.tsx`

Provided by `CartProvider`. Returns `CartContextType` with:
- `cartItems: CartItem[]`
- `isCartOpen: boolean`
- `addToCart(product: any, quantity?: number)` — defaults to `1`; enforces stock warnings and MOQ checks (may warn but not always block).
- `removeFromCart(id: string)`
- `updateQuantity(id: string, quantity: number)`
- `updateNotes(id: string, notes: string)`
- `openCart()`, `closeCart()`, `clearCart()`
- `totalItems: number`, `totalAmount: number`
- Helpers: `getItemQuantity(id: string)`, `isInCart(id: string)`

Usage: must be used inside `CartProvider`. For server-side order creation, re-validate stock and MOQ on server.

---

### useCategory
Source: `src/app/context/CategoryContext.tsx`

Returns `{ selectedCategory: string, setSelectedCategory: (category: string) => void }`.

Usage: simple provider for selected category; must be used within `CategoryProvider`.

---

### useAuth
Source: `src/app/context/AuthContext.tsx`

Returns:
- `user: FirebaseUser | null`
- `userProfile: UserProfile | null`
- `loading: boolean`
- `refreshUserProfile(): Promise<void>`
- `logout(): Promise<void>`
- `userRole: 'seller'|'buyer'|'admin' | null`

Usage: must be used inside `AuthProvider`. `userRole` is detected by checking `sellers`, `buyers`, and `admins` Firestore collections in parallel.

---

## Component Props

### LocationPickerProps
Source: `src/components/LocationPicker.tsx`

- `onLocationSelect: (lat: number, lng: number) => void` — required callback
- `initialLocation?: { lat: number; lng: number } | null` — optional initial marker
- `address?: string` — optional address to geocode and center the map

Important: `onLocationSelect` is required — parent must handle coordinates.

---

### MapPreviewProps
Source: `src/components/MapPreview.tsx`

- `lat: number` — required
- `lng: number` — required
- `accuracy: 'exact' | 'approximate' | 'barangay'` — required; affects badge color/text
- `address: string` — required for display
- `className?: string`

Usage: readonly map embed; ensure `lat` and `lng` are valid numbers.

---

### PriceBreakdownProps
Source: `src/components/ui/PriceBreakdown.tsx`

- `marketPrice: number`
- `farmerMarkup: number`
- `platformFee: number`
- `shippingFee: number`
- `vatAmount: number`
- `finalPrice: number`
- `className?: string`

Usage: pass numbers produced by `PricingCalculator` to display a transparent breakdown.

---

### ProductCardProps
Source: `src/components/ui/ProductCard.tsx`

- `product: Product` — required product object
- `onAddToCart?: (product: Product) => void`
- `onSaveItem?: (product: Product) => void`
- `onViewDetails?: (product: Product) => void`
- `showNewTag?: boolean` — default `true`
- `currentUserLocation?: { lat: number; lng: number } | null` — used for delivery calculations
- `showDeliveryInfo?: boolean` — default `true`
- `showPriceBreakdown?: boolean` — toggles breakdown view

Important: for delivery estimation ensure `product.farmer?.location` exists; otherwise delivery info will be omitted.

---

### CartSidebarProps
Source: `src/components/cart/CartSidebar.tsx`

- `isOpen: boolean`
- `onClose: () => void`
- `cartItems: any[]` — prefer `CartItem[]`
- `onUpdateQuantity: (id: string, quantity: number) => void`
- `onRemoveItem: (id: string) => void`
- `onUpdateNotes: (id: string, notes: string) => void`
- `onPlaceOrder: (orderData: any) => void`
- `onOrderSuccess?: (orderData: any) => void`
- `buyerInfo: { name: string; address: string; contact?: string; id?: string }`
- `currentUserLocation?: { lat: number; lng: number }`

Notes: component contains client-side MOQ validation and order-number generation logic; still re-validate server-side.

---

### SubmenuSidebarProps
Source: `src/components/layouts/SubmenuSidebar.tsx`

- `title: string`
- `items: SubmenuItem[]` where `SubmenuItem` is `{ href: string; label: string; icon: LucideIcon; category?: string }`
- `selectedCategory?: string`
- `onCategoryChange?: (category: string) => void`
- `type?: 'navigation' | 'category'`
- `isMobileOpen?: boolean`
- `onMobileClose?: () => void`

Usage: provide items and optional callbacks; `onMobileClose` is recommended for mobile behavior.

---

## Quick misuse-prevention checklist

- Always include `farmer.location` (`{ lat, lng }`) when expecting distance/delivery calculations.
- Normalize `price` to `number` in services and payloads; format to `string` only for UI display.
- Enforce `stock` and `minimumOrderQuantity` on the server even if client performs checks.
- When creating products, pass `images: File[]` (use `ProductData`) — do not provide `imageUrls` directly.
- When submitting orders, include `orderNumber` and check server response for `orderNumber` to avoid mismatches.
- Catch and handle throws from `submitForm` returned by `useContactForm`.

---

If you want this exported as JSON (machine-readable) or a different format (single-file TypeScript declarations or Markdown split by folder), tell me and I will generate it and add it to the repository.
