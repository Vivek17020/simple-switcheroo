import { useEffect } from 'react';

/**
 * Real-time Core Web Vitals monitoring
 * Reports metrics to console in development
 * Can be extended to send to analytics in production
 */
export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Monitor LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          
          console.log('🎯 LCP:', lastEntry.renderTime || lastEntry.loadTime, 'ms');
          
          // Good: < 2.5s, Needs improvement: 2.5-4s, Poor: > 4s
          const lcp = lastEntry.renderTime || lastEntry.loadTime;
          if (lcp > 4000) {
            console.warn('⚠️ LCP is poor (>4s). Consider optimizing hero images.');
          } else if (lcp > 2500) {
            console.info('📊 LCP needs improvement (2.5-4s).');
          } else {
            console.log('✅ LCP is good (<2.5s)');
          }
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Monitor FID (First Input Delay)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            console.log('⚡ FID:', entry.processingStart - entry.startTime, 'ms');
            
            const fid = entry.processingStart - entry.startTime;
            if (fid > 300) {
              console.warn('⚠️ FID is poor (>300ms). Consider code splitting.');
            } else if (fid > 100) {
              console.info('📊 FID needs improvement (100-300ms).');
            } else {
              console.log('✅ FID is good (<100ms)');
            }
          });
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Monitor CLS (Cumulative Layout Shift)
        let clsScore = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsScore += entry.value;
            }
          }
          
          console.log('📐 CLS:', clsScore.toFixed(3));
          
          // Good: < 0.1, Needs improvement: 0.1-0.25, Poor: > 0.25
          if (clsScore > 0.25) {
            console.warn('⚠️ CLS is poor (>0.25). Add explicit width/height to images.');
          } else if (clsScore > 0.1) {
            console.info('📊 CLS needs improvement (0.1-0.25).');
          } else {
            console.log('✅ CLS is good (<0.1)');
          }
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Monitor resource loading
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            // Flag large resources
            if (entry.transferSize > 500000) { // > 500KB
              console.warn(`⚠️ Large resource: ${entry.name} (${(entry.transferSize / 1024 / 1024).toFixed(2)}MB)`);
            }
            
            // Flag slow resources
            if (entry.duration > 3000) { // > 3s
              console.warn(`⏱️ Slow resource: ${entry.name} (${(entry.duration / 1000).toFixed(2)}s)`);
            }
          });
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });

        return () => {
          lcpObserver.disconnect();
          fidObserver.disconnect();
          clsObserver.disconnect();
          resourceObserver.disconnect();
        };
      } catch (error) {
        console.error('Performance monitoring error:', error);
      }
    }

    // Monitor page load time
    window.addEventListener('load', () => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const domContentLoadedTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
      
      console.log('📄 Page Load Time:', (pageLoadTime / 1000).toFixed(2), 's');
      console.log('🏗️ DOM Content Loaded:', (domContentLoadedTime / 1000).toFixed(2), 's');
      
      if (pageLoadTime > 3000) {
        console.warn('⚠️ Page load time is slow (>3s)');
      }
    });
  }, []);

  return null;
}
