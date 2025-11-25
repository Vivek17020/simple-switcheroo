import { Helmet } from "react-helmet-async";

/**
 * Preload critical resources for better Core Web Vitals
 */
export function PreloadCriticalResources() {
  return (
    <Helmet>
      {/* Preload critical fonts */}
      <link
        rel="preload"
        href="/fonts/inter-var.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      
      {/* Preconnect to important third-party origins */}
      <link rel="preconnect" href="https://tadcyglvsjycpgsjkywj.supabase.co" />
      <link rel="dns-prefetch" href="https://tadcyglvsjycpgsjkywj.supabase.co" />
      
      {/* Resource hints for better performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Prefetch important pages */}
      <link rel="prefetch" href="/news" />
      <link rel="prefetch" href="/subscription" />
    </Helmet>
  );
}
