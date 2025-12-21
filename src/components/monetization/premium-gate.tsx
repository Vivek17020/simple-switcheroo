import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Check } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';

interface PremiumGateProps {
  children: React.ReactNode;
  isPremium: boolean;
  previewContent?: string;
  previewLength?: number;
  onSubscribe?: () => void;
}

export const PremiumGate = ({ 
  children, 
  isPremium, 
  previewContent, 
  previewLength = 200,
  onSubscribe 
}: PremiumGateProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && isPremium) {
      checkSubscriptionStatus();
    } else {
      setIsLoading(false);
    }
  }, [user, isPremium]);

  const checkSubscriptionStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        setIsSubscribed(false);
        return;
      }

      setIsSubscribed(data.subscribed || false);
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };

  // If not premium content, show full content
  if (!isPremium) {
    return <>{children}</>;
  }

  // If user is subscribed, show full content
  if (isSubscribed) {
    return <>{children}</>;
  }

  // Show premium gate with preview
  const preview = previewContent ? 
    previewContent.substring(0, previewLength) + '...' : 
    '';

  return (
    <div className="relative">
      {preview && (
        <div className="mb-6 text-muted-foreground">
          {preview}
        </div>
      )}
      
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="flex items-center gap-2 justify-center">
            <Lock className="h-5 w-5" />
            Premium Content
          </CardTitle>
          <Badge variant="outline" className="mx-auto">
            Subscribers Only
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Unlock this article and get access to:
            </p>
            
            <div className="space-y-2 text-sm">
              {[
                'Unlimited premium articles',
                'Ad-free reading experience',
                'Exclusive interviews & reports',
                'Early access to breaking news',
                'Premium newsletters'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2 justify-center">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col gap-3 pt-4">
            {user ? (
              <Button 
                onClick={onSubscribe}
                className="w-full"
                size="lg"
              >
                Upgrade to Premium
              </Button>
            ) : (
              <>
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full"
                size="lg"
              >
                Sign In to Subscribe
              </Button>
                <p className="text-xs text-center text-muted-foreground">
                  New to our platform? Sign up for free and then upgrade
                </p>
              </>
            )}
          </div>
          
          <div className="text-center text-xs text-muted-foreground pt-2 border-t">
            Starting at $9.99/month • Cancel anytime
          </div>
        </CardContent>
      </Card>
    </div>
  );
};