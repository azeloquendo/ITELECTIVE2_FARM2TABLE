# Seller Panel

This directory contains the seller panel pages and components. The seller panel follows the **Atomic Design** pattern, with components, services, hooks, interfaces, and constants organized outside the `/app` folder for project-wide reuse.

## 📁 Directory Structure

```
seller/
├── dashboard/              # Dashboard pages
│   ├── delivery/
│   ├── inventory/
│   └── topSelling/
├── orders/                 # Orders management
│   ├── components/         # Order-specific components
│   └── page.tsx
├── products/               # Products management
│   ├── components/         # Product-specific components
│   └── page.tsx
├── profile/                # Seller profile pages
│   ├── feed/
│   ├── helpCenter/
│   ├── messages/
│   └── notification/
├── layout.tsx              # Seller layout wrapper
└── page.tsx                # Main seller dashboard
```

## 🏗️ Project Structure

All shared resources are located outside the `/app` folder:

### Components (Atomic Design)
Located in `src/components/`:
- **Atoms**: `StatusBadge`, `StockBadge`, `Button`
- **Molecules**: `ProductCard`
- **Organisms**: `OrderList`, `DeleteConfirmationModal`

### Services
Located in `src/services/seller/`:
- `productService.ts` - Product-related Firebase operations
- `orderService.ts` - Order-related Firebase operations
- `dashboardService.ts` - Dashboard data operations

### Hooks
Located in `src/hooks/seller/`:
- `useSellerProducts` - Product state management
- `useSellerOrders` - Order state management
- `useSellerDashboard` - Dashboard state management

### Interfaces
Located in `src/interface/seller/`:
- Type definitions for `Product`, `Order`, `OrderProduct`, `SellerInfo`, `PaymentInfo`, `DeliveryInfo`, `DashboardStats`, etc.

### Constants
Located in `src/constants/seller/`:
- `ORDER_STATUSES` - Order status constants
- `ORDER_STATUS_CONFIG` - Status badge styling config
- `STOCK_STATUS_CONFIG` - Stock badge styling config
- `PRODUCT_TAGS` - Available product tags
- `PRODUCT_CATEGORIES` - Product categories
- `CHART_COLORS` - Chart color scheme
- `DATE_RANGES` - Date range constants
- `SORT_ORDERS` - Sort order constants

## 🚀 Usage Examples

### Using a Hook
```typescript
import { useSellerProducts } from '../../../hooks/seller';

function ProductsPage() {
  const { products, loading, error } = useSellerProducts();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>{/* Render products */}</div>;
}
```

### Using a Service
```typescript
import { fetchSellerProducts } from '../../../services/seller';

async function loadProducts() {
  try {
    const products = await fetchSellerProducts(sellerId);
    // Handle products
  } catch (error) {
    // Handle error
  }
}
```

### Using Components
```typescript
import { StatusBadge, ProductCard, DeleteConfirmationModal } from '../../../components';

function OrderRow({ order }) {
  return (
    <div>
      <StatusBadge status={order.status} />
      {/* ... */}
    </div>
  );
}
```

## 📋 Notes

- All shared components, services, hooks, interfaces, and constants are located outside the `/app` folder for project-wide reuse
- Seller-specific page components remain in `app/seller/`
- The atomic design structure ensures components are reusable across the entire application
