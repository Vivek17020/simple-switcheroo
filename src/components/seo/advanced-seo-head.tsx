import { Helmet } from "react-helmet-async";

interface AdvancedSEOProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
  noindex?: boolean;
  nofollow?: boolean;
  schemas?: object[];
}

export function AdvancedSEOHead({
  title,
  description,
  canonical,
  image = "https://www.thebulletinbriefs.in/og-image.jpg",
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  tags,
  noindex = false,
  nofollow = false,
  schemas = []
}: AdvancedSEOProps) {
  const baseUrl = "https://www.thebulletinbriefs.in";
  const canonicalUrl = canonical || (typeof window !== 'undefined' ? window.location.href : baseUrl);
  
  // Normalize canonical URL - ensure www prefix and remove trailing slash
  const normalizedCanonical = canonicalUrl
    .replace(/^https?:\/\//, 'https://') // Ensure https
    .replace(/^https:\/\/(?!www\.)/, 'https://www.') // Add www if missing
    .split('?')[0] // Remove query params
    .split('#')[0] // Remove fragments
    .replace(/\/$/, ''); // Remove trailing slash

  // Optimize title for keyword ranking (primary keyword should be at start if possible)
  const optimizedTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
  
  // Ensure description contains keywords from tags (SEO boost)
  const keywordEnhancedDescription = description || 
    (tags && tags.length > 0 ? `${title}. ${tags.slice(0, 3).join(', ')}.` : title);

  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow',
    'max-snippet:-1',
    'max-image-preview:large',
    'max-video-preview:-1'
  ].join(', ');

  return (
    <Helmet>
      {/* Primary Meta Tags - Optimized for keyword ranking */}
      <title>{optimizedTitle}</title>
      <meta name="title" content={optimizedTitle} />
      <meta name="description" content={keywordEnhancedDescription} />
      <link rel="canonical" href={normalizedCanonical} />
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <meta name="bingbot" content={robotsContent} />
      
      {/* Keywords - Critical for search engines */}
      {tags && tags.length > 0 && (
        <>
          <meta name="keywords" content={tags.join(', ')} />
          <meta name="news_keywords" content={tags.slice(0, 10).join(', ')} />
        </>
      )}

      {/* Open Graph / Facebook - Keyword optimized */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={normalizedCanonical} />
      <meta property="og:title" content={optimizedTitle} />
      <meta property="og:description" content={keywordEnhancedDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={`${title} - TheBulletinBriefs`} />
      <meta property="og:site_name" content="TheBulletinBriefs" />
      <meta property="og:locale" content="en_IN" />
      
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
      {tags?.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Twitter - Keyword optimized */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={normalizedCanonical} />
      <meta name="twitter:title" content={optimizedTitle} />
      <meta name="twitter:description" content={keywordEnhancedDescription} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={`${title} - TheBulletinBriefs`} />
      <meta name="twitter:site" content="@thebulletinbriefs" />
      
      {/* Additional SEO Tags */}
      <meta name="author" content={author || "TheBulletinBriefs"} />
      <meta name="publisher" content="TheBulletinBriefs" />
      <meta httpEquiv="content-language" content="en-IN" />
      <meta name="geo.region" content="IN" />
      <meta name="geo.placename" content="India" />
      
      {/* Preconnect for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://tadcyglvsjycpgsjkywj.supabase.co" />
      
      {/* Structured Data */}
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
