import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useShares(articleId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json', {
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) throw new Error('Failed to fetch IP');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Could not fetch client IP, using fallback:', error);
      return 'unknown';
    }
  };

  const trackShare = async (platform: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id;
      const clientIP = await getClientIP();

      await supabase
        .from('article_shares')
        .insert({
          article_id: articleId,
          platform,
          user_id: userId,
          ip_address: userId ? null : clientIP
        });

      toast({
        title: "Shared!",
        description: `Article shared on ${platform}`,
      });
    } catch (error) {
      console.error('Error tracking share:', error);
      toast({
        title: "Error",
        description: "Failed to track share. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    trackShare,
    isLoading
  };
}