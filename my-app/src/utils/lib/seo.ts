// SEO utility functions for consistent metadata across pages
import { Metadata } from 'next';

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'book' | 'profile' | 'music' | 'video'; // Note: 'product' is not a valid OpenGraph type, use 'website' instead
  noindex?: boolean;
  nofollow?: boolean;
}

const defaultConfig: Partial<SEOConfig> = {
  title: 'Farm2Table - Fresh Food Delivery from Local Farms',
  description: 'Order fresh produce directly from local farms. Farm2Table connects you with certified local farmers for the freshest fruits, vegetables, and farm products delivered to your door.',
  keywords: ['farm fresh', 'local produce', 'fresh food delivery', 'organic vegetables', 'local farms', 'farm to table', 'Philippines'],
  image: '/Farm2Table_Logo.png',
  url: 'https://farm2table.com',
  type: 'website',
};

/**
 * Generate metadata object for Next.js pages
 */
export function generateMetadata(config: SEOConfig = {}): Metadata {
  const merged = { ...defaultConfig, ...config };
  const fullTitle = config.title 
    ? `${config.title} | Farm2Table`
    : defaultConfig.title;

  return {
    title: fullTitle,
    description: merged.description,
    keywords: merged.keywords?.join(', '),
    authors: [{ name: 'Farm2Table' }],
    creator: 'Farm2Table',
    publisher: 'Farm2Table',
    robots: {
      index: !merged.noindex,
      follow: !merged.nofollow,
      googleBot: {
        index: !merged.noindex,
        follow: !merged.nofollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: merged.type || 'website', // OpenGraph only supports: website, article, book, profile, music, video
      title: fullTitle,
      description: merged.description,
      url: merged.url,
      siteName: 'Farm2Table',
      images: [
        {
          url: merged.image || defaultConfig.image!,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: merged.description,
      images: [merged.image || defaultConfig.image!],
    },
    alternates: {
      canonical: merged.url,
    },
  };
}

/**
 * Generate structured data (JSON-LD) for SEO
 */
export function generateStructuredData(type: 'Organization' | 'Product' | 'BreadcrumbList', data: any): object {
  const baseStructuredData = {
    '@context': 'https://schema.org',
  };

  switch (type) {
    case 'Organization':
      return {
        ...baseStructuredData,
        '@type': 'Organization',
        name: 'Farm2Table',
        url: 'https://farm2table.com',
        logo: 'https://farm2table.com/Farm2Table_Logo.png',
        description: 'Fresh food delivery service connecting local farms with consumers',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+63-2-1234-5678',
          contactType: 'Customer Service',
          email: 'support@farm2table.com',
        },
        sameAs: [
          // Add social media links if available
        ],
        ...data,
      };

    case 'Product':
      return {
        ...baseStructuredData,
        '@type': 'Product',
        ...data,
      };

    case 'BreadcrumbList':
      return {
        ...baseStructuredData,
        '@type': 'BreadcrumbList',
        itemListElement: data.items.map((item: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      };

    default:
      return baseStructuredData;
  }
}

