import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Crown, DollarSign, Eye } from 'lucide-react';

interface ArticlePremiumControlsProps {
  articleId: string;
  isPremium: boolean;
  premiumPreviewLength: number;
  adsEnabled: boolean;
  affiliateProductsEnabled: boolean;
  onUpdate: () => void;
}

export function ArticlePremiumControls({
  articleId,
  isPremium,
  premiumPreviewLength,
  adsEnabled,
  affiliateProductsEnabled,
  onUpdate
}: ArticlePremiumControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localIsPremium, setLocalIsPremium] = useState(isPremium);
  const [localPreviewLength, setLocalPreviewLength] = useState(premiumPreviewLength);
  const [localAdsEnabled, setLocalAdsEnabled] = useState(adsEnabled);
  const [localAffiliateEnabled, setLocalAffiliateEnabled] = useState(affiliateProductsEnabled);

  const updateArticleMonetization = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('articles')
        .update({
          is_premium: localIsPremium,
          premium_preview_length: localPreviewLength,
          ads_enabled: localAdsEnabled,
          affiliate_products_enabled: localAffiliateEnabled
        })
        .eq('id', articleId);

      if (error) throw error;

      toast.success('Monetization settings updated successfully');
      onUpdate();
    } catch (error) {
      console.error('Error updating monetization settings:', error);
      toast.error('Failed to update monetization settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          Monetization Settings
        </CardTitle>
        <CardDescription>
          Configure premium access and monetization features for this article
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Premium Status */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Premium Article</Label>
            <p className="text-sm text-muted-foreground">
              Require subscription to read full content
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={localIsPremium}
              onCheckedChange={setLocalIsPremium}
            />
            <Badge variant={localIsPremium ? 'default' : 'secondary'}>
              {localIsPremium ? 'Premium' : 'Free'}
            </Badge>
          </div>
        </div>

        {/* Preview Length */}
        {localIsPremium && (
          <div className="space-y-2">
            <Label htmlFor="preview-length" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview Length (characters)
            </Label>
            <Input
              id="preview-length"
              type="number"
              min="100"
              max="1000"
              step="50"
              value={localPreviewLength}
              onChange={(e) => setLocalPreviewLength(parseInt(e.target.value) || 300)}
              placeholder="300"
            />
            <p className="text-xs text-muted-foreground">
              Number of characters to show before requiring subscription
            </p>
          </div>
        )}

        {/* Ads Settings */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Display Ads</Label>
            <p className="text-sm text-muted-foreground">
              Show advertisements on this article
            </p>
          </div>
          <Switch
            checked={localAdsEnabled}
            onCheckedChange={setLocalAdsEnabled}
          />
        </div>

        {/* Affiliate Products */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Affiliate Products
            </Label>
            <p className="text-sm text-muted-foreground">
              Enable affiliate product recommendations
            </p>
          </div>
          <Switch
            checked={localAffiliateEnabled}
            onCheckedChange={setLocalAffiliateEnabled}
          />
        </div>

        {/* Save Button */}
        <Button 
          onClick={updateArticleMonetization}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Saving...' : 'Save Monetization Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}