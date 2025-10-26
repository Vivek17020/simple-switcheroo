import { Helmet } from "react-helmet-async";

/**
 * Inline critical CSS for instant above-the-fold rendering
 * This eliminates render-blocking CSS and improves FCP/LCP
 */
export function CriticalCSSInline() {
  const criticalCSS = `
    /* Critical above-the-fold styles - HSL colors only */
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",Roboto,sans-serif;line-height:1.6;color:hsl(210 40% 98%);background:hsl(222 84% 4.9%);-webkit-font-smoothing:antialiased}
    .light body{color:hsl(222.2 84% 4.9%);background:hsl(0 0% 100%)}
    
    /* Header and navigation - immediate visibility */
    header{background:hsl(222 47% 11%);border-bottom:1px solid hsl(217 32% 17%);position:sticky;top:0;z-index:50}
    .light header{background:hsl(0 0% 100%);border-bottom:1px solid hsl(214.3 31.8% 91.4%)}
    nav{display:flex;align-items:center;justify-content:space-between;padding:1rem;max-width:1280px;margin:0 auto}
    
    /* Logo optimization */
    .logo{height:2.5rem;width:auto;object-fit:contain}
    
    /* Hero section - critical for LCP */
    .hero{min-height:40vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,hsl(217 91% 60%),hsl(266 85% 58%))}
    
    /* Article cards - prevent layout shift */
    .article-card{display:flex;flex-direction:column;min-height:400px;background:hsl(222 47% 11%);border-radius:0.75rem;overflow:hidden;border:1px solid hsl(217 32% 17%)}
    .light .article-card{background:hsl(0 0% 100%);border:1px solid hsl(214.3 31.8% 91.4%)}
    
    /* Image placeholders - prevent CLS */
    .article-image{aspect-ratio:16/9;width:100%;height:auto;object-fit:cover;background:hsl(217 32% 17%)}
    .light .article-image{background:hsl(210 40% 96%)}
    
    /* Grid layout - prevent shifts */
    .articles-grid{display:grid;gap:1.5rem;grid-template-columns:1fr}
    @media(min-width:768px){.articles-grid{grid-template-columns:repeat(2,1fr)}}
    @media(min-width:1024px){.articles-grid{grid-template-columns:repeat(3,1fr)}}
    
    /* Typography - immediate rendering */
    h1{font-size:2.25rem;font-weight:700;line-height:1.2;margin-bottom:1rem;color:hsl(210 40% 98%)}
    .light h1{color:hsl(0 0% 6.7%)}
    h2{font-size:1.875rem;font-weight:600;line-height:1.3;color:hsl(210 40% 98%)}
    .light h2{color:hsl(0 0% 6.7%)}
    
    /* Loading skeleton - better UX */
    .skeleton{background:linear-gradient(90deg,hsl(217 32% 17%),hsl(217 32% 20%),hsl(217 32% 17%));background-size:200% 100%;animation:skeleton 1.5s ease-in-out infinite}
    @keyframes skeleton{0%,100%{background-position:200% 0}50%{background-position:-200% 0}}
    
    /* Container */
    .container{max-width:1280px;margin:0 auto;padding:0 1rem}
  `;

  return (
    <Helmet>
      <style type="text/css">{criticalCSS}</style>
    </Helmet>
  );
}
