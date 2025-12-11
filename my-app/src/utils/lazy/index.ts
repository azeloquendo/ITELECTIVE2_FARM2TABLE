// Lazy-loaded component exports for code splitting
import { lazy } from 'react';

// Lazy load heavy components
export const LazyCartSidebar = lazy(() => 
  import('../../components/organisms/cart/CartSidebar').then(module => ({ default: module.default }))
);

export const LazyOrderSuccessModal = lazy(() =>
  import('../../components/organisms/modals/OrderModal/OrderSuccessModal').then(module => ({ default: module.default }))
);

export const LazyCreateProductForm = lazy(() =>
  import('../../components/organisms/CreateProductForm/CreateProductForm').then(module => ({ default: module.default }))
);

export const LazyUpdateProductForm = lazy(() =>
  import('../../components/organisms/UpdateProductForm/UpdateProductForm').then(module => ({ default: module.default }))
);

export const LazyFeaturedProducts = lazy(() =>
  import('../../components/organisms/feed/FeaturedProducts/FeaturedProducts').then(module => ({ default: module.default }))
);

export const LazyGallery = lazy(() =>
  import('../../components/organisms/feed/Gallery/Gallery').then(module => ({ default: module.default }))
);

export const LazyFarmerProfiles = lazy(() =>
  import('../../components/organisms/feed/FarmerProfiles/FarmerProfiles').then(module => ({ default: module.default }))
);

