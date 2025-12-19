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
  
  // Normalize canonical URL
  // Normalize canonical URL - ensure www prefix and remove trailing slash
  const normalizedCanonical = canonicalUrl
    .replace(/^https?:\/\//, 'https://') // Ensure https
    .replace(/^https:\/\/(?!www\.)/, 'https://www.') // Add www if missing
    .split('?')[0] // Remove query params
    .split('#')[0] // Remove fragments
    .replace(/\/$/, ''); // Remove trailing slash

  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow',
    'max-snippet:-1',
    'max-image-preview:large',
    'max-video-preview:-1'
  ].join(', ');

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <link rel="canonical" href={normalizedCanonical} />
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      
      {/* Keywords */}
      {tags && tags.length > 0 && (
        <meta name="keywords" content={tags.join(', ')} />
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={normalizedCanonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="TheBulletinBriefs" />
      <meta property="og:locale" content="en_IN" />
      
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
      {tags?.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={normalizedCanonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
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
