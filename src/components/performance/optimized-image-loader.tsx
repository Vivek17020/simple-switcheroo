import React, { useState, useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  aspectRatio?: string;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/placeholder.svg',
  className,
  aspectRatio = '16/9',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [imageSrc, setImageSrc] = useState(priority ? src : '');
  const imgRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate responsive image URLs (if using a CDN)
  const generateResponsiveSrc = (baseSrc: string, width: number) => {
    // This would integrate with your CDN/image service
    // For now, just return the original src
    return baseSrc;
  };

  const srcSet = [
    `${generateResponsiveSrc(src, 400)} 400w`,
    `${generateResponsiveSrc(src, 800)} 800w`,
    `${generateResponsiveSrc(src, 1200)} 1200w`,
    `${generateResponsiveSrc(src, 1600)} 1600w`
  ].join(', ');

  useEffect(() => {
    if (priority || !('IntersectionObserver' in window)) {
      setImageSrc(src);
      return;
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setImageSrc(src);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setImageSrc(fallbackSrc);
    onError?.();
  };

  return (
    <div 
      ref={imgRef}
      className={cn(
        "relative overflow-hidden bg-muted",
        aspectRatio === '16/9' && "aspect-[16/9]",
        aspectRatio === '4/3' && "aspect-[4/3]", 
        aspectRatio === '1/1' && "aspect-square",
        aspectRatio === '3/2' && "aspect-[3/2]",
        className
      )}
      data-dynamic-content="true"
    >
      {/* Optimized loading skeleton */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse"
          style={{
            background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted)/0.5) 50%, hsl(var(--muted)) 75%)',
            backgroundSize: '200% 100%',
            animation: 'loading-shimmer 1.5s ease-in-out infinite'
          }}
        />
      )}
      
      {/* Actual optimized image */}
      {(isInView || priority) && imageSrc && (
        <img
          src={imageSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width="1200"
          height="675"
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            contentVisibility: 'auto',
            containIntrinsicSize: '1200px 675px'
          }}
          {...props}
        />
      )}
      
      {/* Enhanced error state */}
      {hasError && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg 
                className="h-6 w-6 text-primary" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">Image unavailable</p>
          </div>
        </div>
      )}
    </div>
  );
});

// Add CSS for loading animation
if (typeof document !== 'undefined' && !document.querySelector('#optimized-image-css')) {
  const style = document.createElement('style');
  style.id = 'optimized-image-css';
  style.textContent = `
    @keyframes loading-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(style);
}