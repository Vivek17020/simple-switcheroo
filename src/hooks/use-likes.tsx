import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useLikes(articleId: string) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkIfLiked();
  }, [articleId]);

  const checkIfLiked = async () => {
    try {
      // Get engagement counts using secure function
      const { data: engagementData, error: engagementError } = await supabase
        .rpc('get_article_engagement', { article_uuid: articleId });

      if (engagementError) {
        console.error('Error fetching engagement:', engagementError);
        return;
      }

      setLikesCount(engagementData?.[0]?.likes_count || 0);

      // Check if current user has liked (only for authenticated users)
      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id;
      
      if (userId) {
        const { data } = await supabase
          .from('article_likes')
          .select('id')
          .eq('article_id', articleId)
          .eq('user_id', userId)
          .limit(1);

        setIsLiked(!!data && data.length > 0);
      } else {
        // For anonymous users, check by IP address
        const clientIP = await getClientIP();
        const { data } = await supabase
          .from('article_likes')
          .select('id')
          .eq('article_id', articleId)
          .eq('ip_address', clientIP)
          .is('user_id', null)
          .limit(1);

        setIsLiked(!!data && data.length > 0);
      }
    } catch (error) {
      console.error('Error checking likes:', error);
    }
  };

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json', {
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });
      if (!response.ok) throw new Error('Failed to fetch IP');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Could not fetch client IP, using fallback:', error);
      return 'unknown';
    }
  };

  const toggleLike = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id;
      const clientIP = await getClientIP();

      if (isLiked) {
        // Unlike
        await supabase
          .from('article_likes')
          .delete()
          .eq('article_id', articleId)
          .or(userId ? `user_id.eq.${userId}` : `ip_address.eq.${clientIP}`);
        
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        toast({
          title: "Removed like",
          description: "You've unliked this article.",
        });
      } else {
        // Like
        await supabase
          .from('article_likes')
          .insert({
            article_id: articleId,
            user_id: userId,
            ip_address: userId ? null : clientIP
          });
        
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        toast({
          title: "Liked!",
          description: "Thanks for liking this article!",
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLiked,
    likesCount,
    toggleLike,
    isLoading
  };
}