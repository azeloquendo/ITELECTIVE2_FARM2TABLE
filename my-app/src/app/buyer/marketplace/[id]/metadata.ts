// Dynamic metadata generation for product pages
import { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/utils/lib/seo';

export async function generateProductMetadata(productData: any): Promise<Metadata> {
  if (!productData) {
    return generateSEOMetadata({
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
      noindex: true,
    });
  }

  return generateSEOMetadata({
    title: `${productData.name} - Farm2Table`,
    description: `${productData.description || `Buy fresh ${productData.name} from ${productData.farmName || 'local farms'}. ${productData.unit ? `Available in ${productData.unit}.` : ''} Order now for fast delivery.`,
    keywords: [
      productData.name,
      productData.farmName || 'local farm',
      productData.category || 'fresh produce',
      'farm fresh',
      'local produce',
    ],
    url: `https://farm2table.com/buyer/marketplace/${productData.id}`,
    type: 'website', // OpenGraph doesn't support 'product' type, use 'website'
    image: productData.image || '/Farm2Table_Logo.png',
  });
}

export function generateProductStructuredData(productData: any) {
  if (!productData) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productData.name,
    description: productData.description,
    image: productData.image,
    brand: {
      '@type': 'Brand',
      name: productData.farmName || 'Local Farm',
    },
    offers: {
      '@type': 'Offer',
      price: productData.price,
      priceCurrency: 'PHP',
      availability: productData.stock > 0 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: productData.farmName || 'Local Farm',
      },
    },
    aggregateRating: productData.rating > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: productData.rating,
      reviewCount: productData.reviews || 0,
    } : undefined,
  };
}

