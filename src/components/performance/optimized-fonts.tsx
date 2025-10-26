import { Helmet } from "react-helmet-async";

/**
 * Optimized font loading strategy
 * - Preload critical fonts for instant text rendering
 * - Use font-display: swap to prevent invisible text
 * - Subset fonts to reduce file size
 */
export function OptimizedFonts() {
  return (
    <Helmet>
      {/* Preconnect to font providers - DNS resolution happens early */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Preload critical font files directly - faster than CSS @font-face */}
      <link
        rel="preload"
        as="font"
        type="font/woff2"
        href="https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
        crossOrigin="anonymous"
      />
      
      {/* Load fonts with display=swap to prevent FOIT (Flash of Invisible Text) */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap"
        media="print"
        onLoad={(e) => { (e.target as HTMLLinkElement).media = 'all'; }}
      />
      
      {/* Fallback for no-JS */}
      <noscript>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap"
        />
      </noscript>
    </Helmet>
  );
}
