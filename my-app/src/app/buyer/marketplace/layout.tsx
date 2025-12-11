import { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/utils/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Marketplace - Browse Fresh Produce',
  description: 'Browse our marketplace of fresh fruits, vegetables, and farm products from certified local farms. Filter by category, farm, and location. Order fresh produce delivered to your door.',
  keywords: ['fresh produce', 'farm products', 'local vegetables', 'organic fruits', 'farm marketplace'],
  url: 'https://farm2table.com/buyer/marketplace',
});

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

