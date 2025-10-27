import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AffiliateProductCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  affiliateUrl: string;
  provider: string;
  category: string;
  commissionRate?: number;
  className?: string;
}

export const AffiliateProductCard = ({
  id,
  title,
  description,
  imageUrl,
  price,
  affiliateUrl,
  provider,
  category,
  commissionRate,
  className,
}: AffiliateProductCardProps) => {
  const trackAffiliateClick = async () => {
    try {
      await supabase.from('monetization_analytics').insert({
        event_type: 'affiliate_click',
        revenue_amount: commissionRate ? (price * (commissionRate / 100)) : 0,
        metadata: { 
          product_id: id,
          product_name: title,
          affiliate_url: affiliateUrl,
          commission_rate: commissionRate
        }
      });
    } catch (error) {
      console.error('Failed to track affiliate click:', error);
    }
  };

  const handleAffiliateClick = () => {
    trackAffiliateClick();
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className={`affiliate-product-card overflow-hidden hover:shadow-lg transition-shadow ${className || ''}`}>
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        <Badge variant="secondary" className="absolute top-2 right-2">
          {category}
        </Badge>
        {commissionRate && (
          <Badge variant="outline" className="absolute top-2 left-2 bg-background/80">
            {commissionRate}% off
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {description}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <Star className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground ml-1">4.2</span>
            </div>
            <span className="text-sm text-muted-foreground">by {provider}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-primary">
              ${price.toFixed(2)}
            </div>
            <Button 
              onClick={handleAffiliateClick}
              className="gap-2"
              size="sm"
            >
              Buy Now
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            <a 
              href={affiliateUrl} 
              target="_blank" 
              rel="sponsored noopener noreferrer"
              onClick={trackAffiliateClick}
              className="hover:underline"
            >
              This is an affiliate link. We may earn a commission.
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};