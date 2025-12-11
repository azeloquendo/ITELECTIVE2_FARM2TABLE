import { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/utils/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Buyer Dashboard',
  description: 'Your Farm2Table buyer dashboard. View fresh arrivals, local farms, order history, and manage your account.',
  url: 'https://farm2table.com/buyer/dashboard',
  noindex: true, // Dashboard pages shouldn't be indexed
});

export default function BuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

