import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized responsive image component
 * - WebP/AVIF support with fallbacks
 * - Lazy loading for non-priority images
 * - Proper aspect ratio to prevent CLS
 * - Intersection Observer for performance
 */
export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  aspectRatio = '16/9',
  priority = false,
  className,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  onLoad,
  onError,
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px 0px', // Load 100px before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate responsive URLs for Supabase Storage
  const generateResponsiveUrls = (baseUrl: string) => {
    if (!baseUrl.includes('supabase.co/storage')) {
      return { webp: baseUrl, avif: baseUrl, original: baseUrl };
    }

    // For Supabase, we can add transformation parameters
    const url = new URL(baseUrl);
    return {
      webp: `${baseUrl}?format=webp&quality=85`,
      avif: `${baseUrl}?format=avif&quality=80`,
      original: baseUrl,
    };
  };

  const urls = generateResponsiveUrls(src);

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        className
      )}
      style={{
        aspectRatio: aspectRatio,
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
      }}
    >
      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse" />
      )}

      {/* Actual image with modern formats */}
      {isInView && !hasError && (
        <picture>
          {/* AVIF - best compression, newer browsers */}
          <source srcSet={urls.avif} type="image/avif" />
          
          {/* WebP - excellent compression, wide support */}
          <source srcSet={urls.webp} type="image/webp" />
          
          {/* Fallback - original format */}
          <img
            src={urls.original}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />
        </picture>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-primary text-2xl">📰</span>
            </div>
            <p className="text-xs text-muted-foreground">Image unavailable</p>
          </div>
        </div>
      )}
    </div>
  );
}
