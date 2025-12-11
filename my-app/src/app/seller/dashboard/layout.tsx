import { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/utils/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Seller Dashboard',
  description: 'Manage your farm products, orders, inventory, and sales on Farm2Table.',
  url: 'https://farm2table.com/seller/dashboard',
  noindex: true, // Dashboard pages shouldn't be indexed
});

export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

