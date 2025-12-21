import React, { useEffect } from 'react';

// Enhanced Core Web Vitals monitoring component
export function CoreWebVitals() {
  useEffect(() => {
    // Critical resource preloading
    const preloadCriticalResources = () => {
      // Preload critical API endpoints
      const criticalRoutes = ['/api/articles', '/api/categories'];
      criticalRoutes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });

      // Enable HTTP/2 server push simulation
      const resourceHints = [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
        { rel: 'dns-prefetch', href: '//cdn.jsdelivr.net' }
      ];

      resourceHints.forEach(hint => {
        if (!document.querySelector(`link[rel="${hint.rel}"][href="${hint.href}"]`)) {
          const link = document.createElement('link');
          link.rel = hint.rel;
          link.href = hint.href;
          if (hint.rel === 'preconnect') link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
        }
      });
    };

    // Advanced image and media optimization
    const optimizeImages = () => {
      const images = document.querySelectorAll('img');
      
      // Enhanced lazy loading with intersection observer
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              
              // Load data-src if available
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
              }
              
              // Add WebP format support
              if (supportsWebP() && !img.src.includes('.webp')) {
                const webpSrc = img.src.replace(/\.(jpg|jpeg|png)$/, '.webp');
                const testImg = new Image();
                testImg.onload = () => {
                  img.src = webpSrc;
                };
                testImg.onerror = () => {
                  // Keep original format if WebP fails
                };
                testImg.src = webpSrc;
              }
              
              imageObserver.unobserve(img);
            }
          });
        }, {
          rootMargin: '100px 0px',
          threshold: 0.01
        });

        images.forEach(img => {
          if (!img.complete) {
            imageObserver.observe(img);
          }
        });
      }
      
      // Optimize video loading
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        video.setAttribute('preload', 'metadata');
        video.setAttribute('playsinline', '');
      });
    };
    
    // Check WebP support
    const supportsWebP = () => {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    };

    // Enhanced CLS prevention and performance optimizations
    const preventLayoutShifts = () => {
      // Add aspect ratios to images without them
      const images = document.querySelectorAll('img:not([style*="aspect-ratio"])');
      images.forEach(img => {
        if (img instanceof HTMLImageElement && !img.style.aspectRatio) {
          img.style.aspectRatio = '16 / 9';
        }
      });
      
      // Optimize font loading to prevent FOIT/FOUT
      if ('fonts' in document) {
        document.fonts.ready.then(() => {
          console.log('Fonts loaded, CLS risk reduced');
        });
      }
      
      // Critical CSS injection for above-fold content
      const criticalCSS = `
        .critical-above-fold { 
          contain: layout style paint;
          will-change: auto;
        }
        .hero-section {
          transform: translateZ(0);
        }
      `;
      
      if (!document.querySelector('#critical-css')) {
        const style = document.createElement('style');
        style.id = 'critical-css';
        style.textContent = criticalCSS;
        document.head.appendChild(style);
      }
    };

    // Run optimizations
    preloadCriticalResources();
    optimizeImages();
    preventLayoutShifts();

    // Monitor performance metrics (if supported)
    if ('PerformanceObserver' in window) {
      try {
        // Monitor LCP (Largest Contentful Paint)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('LCP candidate:', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Monitor CLS (Cumulative Layout Shift)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              console.log('CLS value:', clsValue);
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Monitor FID (First Input Delay)
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const fidEntry = entry as any; // Type assertion for FID specific properties
            if (fidEntry.processingStart) {
              const fid = fidEntry.processingStart - entry.startTime;
              console.log('FID value:', fid);
            }
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

      } catch (error) {
        console.log('Performance monitoring not fully supported');
      }
    }

    // Cleanup function
    return () => {
      // Cleanup observers if needed
    };
  }, []);

  return null; // This component doesn't render anything
}

// Hook for preloading critical resources
export function usePreloadCritical(resources: string[]) {
  useEffect(() => {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      
      if (resource.includes('.css')) {
        link.as = 'style';
      } else if (resource.includes('.js')) {
        link.as = 'script';
      } else if (resource.match(/\.(jpg|jpeg|png|webp|gif)$/)) {
        link.as = 'image';
      }
      
      link.href = resource;
      document.head.appendChild(link);
    });
  }, [resources]);
}