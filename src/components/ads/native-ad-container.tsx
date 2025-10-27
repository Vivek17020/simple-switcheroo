import { AdSlot } from './ad-slot';
import { AffiliateProductCard } from '@/components/monetization/affiliate-product-card';
import { Card, CardContent } from '@/components/ui/card';
import React, { useState, useEffect } from 'react';

interface NativeAdContainerProps {
  position: 'between-articles' | 'sidebar' | 'in-article';
  articleIndex?: number;
  className?: string;
}

// Sample affiliate products for demo
const sampleProducts = [
  {
    id: '1',
    title: 'Premium News App',
    description: 'Get unlimited access to breaking news and exclusive content',
    imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=200&h=150&fit=crop',
    price: 9.99,
    affiliateUrl: 'https://example.com/news-app',
    provider: 'NewsApp Inc',
    category: 'Apps',
    commissionRate: 5.00
  },
  {
    id: '2', 
    title: 'Financial Planning Guide',
    description: 'Master your personal finances with expert insights',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=150&fit=crop',
    price: 19.99,
    affiliateUrl: 'https://example.com/finance-guide',
    provider: 'FinanceGuru',
    category: 'Education',
    commissionRate: 15.00
  },
  {
    id: '3',
    title: 'Tech Gadget Bundle', 
    description: 'Latest smartphone accessories and wireless chargers',
    imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200&h=150&fit=crop',
    price: 49.99,
    affiliateUrl: 'https://example.com/tech-bundle',
    provider: 'TechStore',
    category: 'Technology',
    commissionRate: 10.00
  }
];

export const NativeAdContainer = ({ 
  position, 
  articleIndex = 0,
  className 
}: NativeAdContainerProps) => {
  const [adType, setAdType] = useState<'banner' | 'affiliate' | 'native'>('native');
  const [selectedProduct, setSelectedProduct] = useState(sampleProducts[0]);

  useEffect(() => {
    // Rotate ad types and products based on position and index
    const typeRotation = articleIndex % 3;
    if (typeRotation === 0) {
      setAdType('affiliate');
      setSelectedProduct(sampleProducts[articleIndex % sampleProducts.length]);
    } else if (typeRotation === 1) {
      setAdType('native');
    } else {
      setAdType('banner');
    }
  }, [articleIndex]);

  const getAdSlotId = () => `${position}-${articleIndex}-${adType}`;

  const getAdFormat = () => {
    switch (position) {
      case 'sidebar':
        return 'rectangle';
      case 'in-article':
        return 'native';
      case 'between-articles':
        return adType === 'banner' ? 'leaderboard' : 'native';
      default:
        return 'native';
    }
  };

  return (
    <div className={`native-ad-container my-6 ${className || ''}`}>
      {position === 'between-articles' && (
        <div className="text-center mb-4">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Advertisement
          </span>
        </div>
      )}

      {adType === 'affiliate' ? (
        <AffiliateProductCard
          id={selectedProduct.id}
          title={selectedProduct.title}
          description={selectedProduct.description}
          imageUrl={selectedProduct.imageUrl}
          price={selectedProduct.price}
          affiliateUrl={selectedProduct.affiliateUrl}
          provider={selectedProduct.provider}
          category={selectedProduct.category}
          commissionRate={selectedProduct.commissionRate}
          className="max-w-sm mx-auto"
        />
      ) : (
        <AdSlot
          id={getAdSlotId()}
          format={getAdFormat()}
          className={position === 'sidebar' ? 'sticky top-20' : ''}
          lazy={position !== 'sidebar'}
        />
      )}

      {position === 'in-article' && (
        <div className="text-center mt-2">
          <span className="text-xs text-muted-foreground">
            {adType === 'affiliate' ? 'Recommended Product' : 'Sponsored Content'}
          </span>
        </div>
      )}
    </div>
  );
};