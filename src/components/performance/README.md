# 🚀 Performance Components

This directory contains all performance optimization components for TheBulletinBriefs.

## Components Overview

### 1. `critical-css-inline.tsx`
Inlines critical above-the-fold CSS to eliminate render-blocking stylesheets.

**Usage:**
```tsx
import { CriticalCSSInline } from '@/components/performance/critical-css-inline';

// In App.tsx (already added)
<HelmetProvider>
  <CriticalCSSInline />
  ...
</HelmetProvider>
```

**What it does:**
- Reduces First Contentful Paint (FCP)
- Eliminates render-blocking CSS
- Improves Largest Contentful Paint (LCP)
- Uses HSL colors only (design system compliant)

---

### 2. `optimized-fonts.tsx`
Optimizes font loading to prevent Flash of Invisible Text (FOIT).

**Usage:**
```tsx
import { OptimizedFonts } from '@/components/performance/optimized-fonts';

// In App.tsx (already added)
<HelmetProvider>
  <OptimizedFonts />
  ...
</HelmetProvider>
```

**What it does:**
- Preconnects to Google Fonts
- Preloads critical font files
- Uses `font-display: swap`
- Loads fonts asynchronously

---

### 3. `responsive-image.tsx`
Modern image component with WebP/AVIF support and lazy loading.

**Usage:**
```tsx
import { ResponsiveImage } from '@/components/performance/responsive-image';

// Hero image (load immediately)
<ResponsiveImage
  src="/hero.jpg"
  alt="Hero Image"
  priority={true}
  aspectRatio="21/9"
  width={1920}
  height={823}
/>

// Article card image (lazy load)
<ResponsiveImage
  src={article.image_url}
  alt={article.title}
  aspectRatio="16/9"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

**Props:**
- `src` (required): Image URL
- `alt` (required): Alt text for accessibility
- `width`: Image width in pixels
- `height`: Image height in pixels
- `aspectRatio`: Aspect ratio (default: "16/9")
- `priority`: Load immediately vs lazy load (default: false)
- `className`: Additional CSS classes
- `sizes`: Responsive sizes attribute
- `onLoad`: Callback when image loads
- `onError`: Callback on error

**What it does:**
- WebP/AVIF with fallbacks
- Lazy loading with Intersection Observer
- Prevents layout shift (CLS)
- Loading skeleton while loading
- Error state handling

---

### 4. `performance-monitor.tsx`
Real-time Core Web Vitals monitoring and reporting.

**Usage:**
```tsx
import { PerformanceMonitor } from '@/components/performance/performance-monitor';

// In App.tsx (already added)
<HelmetProvider>
  <PerformanceMonitor />
  ...
</HelmetProvider>
```

**What it does:**
- Monitors LCP, FID, CLS in real-time
- Logs metrics to browser console
- Warns about poor metrics
- Tracks resource loading
- Identifies large/slow resources

**Console Output:**
```
🎯 LCP: 1245 ms
✅ LCP is good (<2.5s)
⚡ FID: 45 ms
✅ FID is good (<100ms)
📐 CLS: 0.05
✅ CLS is good (<0.1)
```

---

### 5. `preload-critical-resources.tsx`
Preloads critical resources for faster page loads.

**Usage:**
```tsx
import { PreloadCriticalResources } from '@/components/performance/preload-critical-resources';

// In specific pages
<PreloadCriticalResources />
```

**What it does:**
- Preloads critical fonts
- Preconnects to important origins
- DNS prefetching
- Prefetches important pages

---

### 6. `image-lazy-loader.tsx`
Alternative lazy loading image component (simpler version).

**Usage:**
```tsx
import { LazyImage } from '@/components/performance/image-lazy-loader';

<LazyImage
  src={article.image}
  alt={article.title}
  aspectRatio="16/9"
/>
```

---

## Utility Functions

### `src/utils/image-optimizer.ts`

Utilities for image optimization:

```tsx
import {
  getOptimizedImageUrl,
  generateSrcSet,
  supportsWebP,
  supportsAVIF,
} from '@/utils/image-optimizer';

// Get optimized URL
const webpUrl = getOptimizedImageUrl(imageUrl, {
  width: 800,
  quality: 85,
  format: 'webp',
});

// Generate srcset
const srcset = generateSrcSet(imageUrl);

// Check format support
const hasWebP = await supportsWebP(); // true/false
const hasAVIF = await supportsAVIF(); // true/false
```

---

## Best Practices

### Images

1. **Always use `ResponsiveImage` for article images:**
   ```tsx
   <ResponsiveImage src={url} alt="description" aspectRatio="16/9" />
   ```

2. **Use `priority={true}` for above-the-fold images:**
   ```tsx
   <ResponsiveImage src={heroUrl} alt="hero" priority={true} />
   ```

3. **Specify aspect ratio to prevent CLS:**
   ```tsx
   aspectRatio="16/9"  // or "4/3", "1/1", etc.
   ```

4. **Optimize images before upload:**
   - Max width: 1920px
   - Format: WebP
   - Quality: 85

### Fonts

1. **Use system fonts as fallbacks:**
   ```css
   font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
   ```

2. **Preload only critical fonts:**
   - Only preload fonts used above the fold
   - Use `font-display: swap`

### Scripts

1. **Defer non-critical scripts:**
   ```html
   <script src="..." defer></script>
   ```

2. **Load heavy scripts after page load:**
   ```javascript
   window.addEventListener('load', () => {
     // Load heavy script
   });
   ```

### CSS

1. **Inline critical CSS:**
   - Already handled by `CriticalCSSInline`
   - Only above-the-fold styles

2. **Use HSL colors only:**
   ```tsx
   // ✅ Good
   className="bg-background text-foreground"
   
   // ❌ Bad
   className="bg-white text-black"
   ```

---

## Performance Monitoring

### Browser Console
Open DevTools and check console for real-time metrics:
- LCP scores
- FID measurements
- CLS warnings
- Resource loading times

### Lighthouse
```bash
npx lighthouse https://thebulletinbriefs.in --view
```

### PageSpeed Insights
Visit: https://pagespeed.web.dev/?url=https://thebulletinbriefs.in

---

## Troubleshooting

### Images not loading
1. Check Supabase storage permissions
2. Verify image URLs in browser console
3. Check CORS settings

### Fonts not loading
1. Check Google Fonts URL
2. Verify CORS headers
3. Check browser console for errors

### Performance scores low
1. Check console for warnings
2. Run Lighthouse audit
3. Verify service worker is active
4. Check network tab for large resources

---

## Future Improvements

- [ ] Add image blur placeholder
- [ ] Implement progressive JPEG loading
- [ ] Add video lazy loading
- [ ] Create iframe lazy loader
- [ ] Add WebP/AVIF conversion service
- [ ] Implement image CDN

---

**Questions?** Check browser console for performance insights!
