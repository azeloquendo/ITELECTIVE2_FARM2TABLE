import { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/utils/lib/seo';

// This will be set dynamically per product in the page component
export const metadata: Metadata = generateSEOMetadata({
  title: 'Product Details',
  description: 'View product details, pricing, and order fresh produce from local farms.',
  url: 'https://farm2table.com/buyer/marketplace',
  type: 'website', // OpenGraph doesn't support 'product' type, use 'website'
});

export default function ProductDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

