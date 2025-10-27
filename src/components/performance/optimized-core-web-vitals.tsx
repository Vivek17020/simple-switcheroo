import React, { useEffect } from 'react';

export function OptimizedCoreWebVitals() {
  useEffect(() => {
    // Optimize Critical Resource Loading
    const optimizeResourceLoading = () => {
      // Preload critical fonts
      const fontPreloads = [
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
      ];
      
      fontPreloads.forEach(font => {
        if (!document.querySelector(`link[href="${font}"]`)) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'style';
          link.href = font;
          link.onload = () => {
            link.rel = 'stylesheet';
          };
          document.head.appendChild(link);
        }
      });

      // DNS prefetch for external domains
      const domains = [
        '//fonts.googleapis.com',
        '//fonts.gstatic.com',
        '//cdn.jsdelivr.net'
      ];
      
      domains.forEach(domain => {
        if (!document.querySelector(`link[rel="dns-prefetch"][href="${domain}"]`)) {
          const link = document.createElement('link');
          link.rel = 'dns-prefetch';
          link.href = domain;
          document.head.appendChild(link);
        }
      });
    };

    // Enhanced Image Optimization
    const optimizeImages = () => {
      const images = document.querySelectorAll('img[data-src], img:not([loading])');
      
      if ('IntersectionObserver' in window && 'loading' in HTMLImageElement.prototype) {
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              
              // Handle lazy loading with data-src
              if (img.dataset.src && !img.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
              }
              
              // Set loading attribute if not set
              if (!img.hasAttribute('loading')) {
                img.loading = 'lazy';
              }
              
              // Set decoding for better performance
              img.decoding = 'async';
              
              imageObserver.unobserve(img);
            }
          });
        }, {
          rootMargin: '100px 0px',
          threshold: 0.01
        });

        images.forEach(img => imageObserver.observe(img));
      } else {
        // Fallback for browsers without IntersectionObserver
        images.forEach(img => {
          const htmlImg = img as HTMLImageElement;
          if (htmlImg.dataset.src) {
            htmlImg.src = htmlImg.dataset.src;
            htmlImg.removeAttribute('data-src');
          }
          htmlImg.loading = 'lazy';
          htmlImg.decoding = 'async';
        });
      }
    };

    // Prevent Layout Shifts (CLS Optimization)
    const preventLayoutShifts = () => {
      // Add aspect ratios to images without explicit dimensions
      const images = document.querySelectorAll('img:not([style*="aspect-ratio"]):not([width]):not([height])');
      images.forEach(img => {
        const htmlImg = img as HTMLImageElement;
        if (!htmlImg.style.aspectRatio && !htmlImg.width && !htmlImg.height) {
          htmlImg.style.aspectRatio = '16 / 9';
          htmlImg.style.width = '100%';
          htmlImg.style.height = 'auto';
        }
      });

      // Reserve space for dynamic content
      const dynamicContainers = document.querySelectorAll('[data-dynamic-content]');
      dynamicContainers.forEach(container => {
        const htmlContainer = container as HTMLElement;
        if (!htmlContainer.style.minHeight) {
          htmlContainer.style.minHeight = '200px';
        }
      });

      // Optimize font loading to prevent FOIT/FOUT
      if ('fonts' in document) {
        document.fonts.ready.then(() => {
          document.body.classList.add('fonts-loaded');
        });
      }
    };

    // Performance monitoring and optimization
    const monitorPerformance = () => {
      if ('PerformanceObserver' in window) {
        try {
          // Monitor LCP (Largest Contentful Paint)
          let lcpValue = 0;
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            lcpValue = lastEntry.startTime;
            
            // Optimize based on LCP
            if (lcpValue > 2500) {
              // LCP is poor, apply optimizations
              const lcpElement = (lastEntry as any).element as HTMLElement;
              if (lcpElement && lcpElement.tagName === 'IMG') {
                lcpElement.style.willChange = 'auto';
                lcpElement.style.containIntrinsicSize = '1200px 630px';
              }
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // Monitor CLS (Cumulative Layout Shift)
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const clsEntry = entry as any;
              if (!clsEntry.hadRecentInput) {
                clsValue += clsEntry.value;
                
                // If CLS is getting high, apply fixes
                if (clsValue > 0.1) {
                  document.body.classList.add('prevent-layout-shift');
                }
              }
            }
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // Monitor FID (First Input Delay)
          const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const fidEntry = entry as any;
              if (fidEntry.processingStart) {
                const fid = fidEntry.processingStart - entry.startTime;
                
                // If FID is poor, optimize interactions
                if (fid > 100) {
                  document.body.classList.add('optimize-interactions');
                }
              }
            }
          });
          fidObserver.observe({ entryTypes: ['first-input'] });

        } catch (error) {
          console.log('Performance monitoring partially supported');
        }
      }
    };

    // Critical CSS injection
    const injectCriticalCSS = () => {
      if (!document.querySelector('#core-web-vitals-css')) {
        const style = document.createElement('style');
        style.id = 'core-web-vitals-css';
        style.textContent = `
          .prevent-layout-shift * {
            contain: layout style paint;
          }
          
          .optimize-interactions button,
          .optimize-interactions a {
            will-change: transform;
          }
          
          .fonts-loaded {
            font-display: swap;
          }
          
          @media (prefers-reduced-motion: no-preference) {
            .lazy-image {
              transition: opacity 0.3s ease-in-out;
            }
          }
          
          .aspect-ratio-16-9 {
            aspect-ratio: 16 / 9;
          }
          
          .aspect-ratio-4-3 {
            aspect-ratio: 4 / 3;
          }
          
          .aspect-ratio-1-1 {
            aspect-ratio: 1 / 1;
          }
        `;
        document.head.appendChild(style);
      }
    };

    // Run all optimizations
    optimizeResourceLoading();
    setTimeout(optimizeImages, 100); // Slight delay for DOM to be ready
    preventLayoutShifts();
    injectCriticalCSS();
    monitorPerformance();

    // Cleanup function
    return () => {
      // Cleanup observers if needed
    };
  }, []);

  return null;
}

// Hook for preloading specific resources
export function usePreloadResources(resources: string[]) {
  useEffect(() => {
    resources.forEach(resource => {
      if (document.querySelector(`link[href="${resource}"]`)) return;
      
      const link = document.createElement('link');
      link.rel = 'preload';
      
      if (resource.includes('.css')) {
        link.as = 'style';
      } else if (resource.includes('.js')) {
        link.as = 'script';
      } else if (resource.match(/\.(jpg|jpeg|png|webp|gif|svg)$/)) {
        link.as = 'image';
      } else if (resource.includes('.woff') || resource.includes('.woff2')) {
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
      }
      
      link.href = resource;
      document.head.appendChild(link);
    });
  }, [resources]);
}