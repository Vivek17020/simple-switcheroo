import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { supabase } from '@/integrations/supabase/client';

interface AdSlotProps {
  id: string;
  format?: 'banner' | 'rectangle' | 'leaderboard' | 'skyscraper' | 'native';
  className?: string;
  lazy?: boolean;
}

export const AdSlot = ({ id, format = 'rectangle', className, lazy = true }: AdSlotProps) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: true,
  });

  const adDimensions = {
    banner: { width: 728, height: 90 },
    rectangle: { width: 300, height: 250 },
    leaderboard: { width: 970, height: 90 },
    skyscraper: { width: 160, height: 600 },
    native: { width: '100%', height: 'auto' },
  };

  const trackAdImpression = async () => {
    try {
      await supabase.from('monetization_analytics').insert({
        event_type: 'ad_impression',
        article_id: null, // Can be set if ad is on article page
        metadata: { ad_id: id, ad_format: format }
      });
    } catch (error) {
      console.error('Failed to track ad impression:', error);
    }
  };

  const trackAdClick = async () => {
    try {
      await supabase.from('monetization_analytics').insert({
        event_type: 'ad_click', 
        article_id: null,
        metadata: { ad_id: id, ad_format: format }
      });
    } catch (error) {
      console.error('Failed to track ad click:', error);
    }
  };

  useEffect(() => {
    if ((!lazy || inView) && !isLoaded && adRef.current) {
      // AdSense initialization would go here
      // For now, we'll show a placeholder
      setIsLoaded(true);
      trackAdImpression();
    }
  }, [inView, lazy, isLoaded, id]);

  const setRefs = (node: HTMLDivElement | null) => {
    adRef.current = node;
    inViewRef(node);
  };

  return (
    <div
      ref={setRefs}
      className={`ad-slot ${className || ''} ${format === 'native' ? 'native-ad' : ''}`}
      style={{
        width: adDimensions[format].width,
        height: adDimensions[format].height,
        minHeight: format === 'native' ? '150px' : adDimensions[format].height,
        backgroundColor: '#f5f5f5',
        border: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
        margin: '16px auto',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={trackAdClick}
    >
      {isLoaded ? (
        <>
          {/* Google AdSense - Replace with actual AdSense code */}
          <div className="ad-content text-center text-muted-foreground">
            <ins className="adsbygoogle"
                 style={{ display: 'inline-block', width: `${adDimensions[format].width}px`, height: `${adDimensions[format].height}px` }}
                 data-ad-client="ca-pub-XXXXXXXXXX" // Replace with your AdSense publisher ID
                 data-ad-slot="XXXXXXXXXX"         // Replace with your ad unit ID
                 data-ad-format="auto"
                 data-full-width-responsive="true">
            </ins>
            <div className="text-xs text-muted-foreground mt-2">
              Advertisement
            </div>
          </div>
          
          {/* AdSense script insertion point */}
          <script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
          ></script>
        </>
      ) : (
        <div className="text-muted-foreground text-xs">Loading Ad...</div>
      )}
    </div>
  );
};