import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  canonicalUrl?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
  structuredData?: object;
  content?: string; // Add content for auto-keyword generation
}

// Auto-generate SEO keywords from content
export function generateSEOKeywords(title: string, content?: string, tags?: string[]): string[] {
  const keywords: string[] = [];
  
  // Add tags if available
  if (tags) {
    keywords.push(...tags);
  }
  
  // Extract keywords from title
  const titleWords = title.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);
  keywords.push(...titleWords);
  
  // Extract keywords from content if available
  if (content) {
    const contentText = content.replace(/<[^>]*>/g, ' ').toLowerCase();
    const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'may', 'she', 'use'];
    const words = contentText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4 && !commonWords.includes(word));
    
    // Get word frequency
    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Get top keywords by frequency
    const topWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
    
    keywords.push(...topWords);
  }
  
  // Remove duplicates and limit to 15 keywords
  return [...new Set(keywords)].slice(0, 15);
}

// Auto-generate meta description from content
export function generateMetaDescription(excerpt?: string, content?: string): string {
  if (excerpt && excerpt.length > 50) {
    return excerpt.length > 160 ? excerpt.substring(0, 157) + '...' : excerpt;
  }
  
  if (content) {
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return plainText.length > 160 ? plainText.substring(0, 157) + '...' : plainText;
  }
  
  return "Stay informed with the latest breaking news and in-depth analysis from TheBulletinBriefs.";
}

// Normalize canonical URL to always use www and strip query params
function normalizeCanonicalUrl(url?: string): string {
  if (!url) {
    // Default to current page with www
    const cleanPath = window.location.pathname;
    return `https://www.thebulletinbriefs.in${cleanPath}`;
  }
  
  try {
    // Parse URL and strip query parameters
    const urlObj = new URL(url);
    const cleanPath = urlObj.pathname;
    
    // Always use www subdomain
    return `https://www.thebulletinbriefs.in${cleanPath}`;
  } catch {
    // Fallback if URL parsing fails
    const cleanPath = url.split('?')[0].split('#')[0];
    return cleanPath.startsWith('http') ? cleanPath : `https://www.thebulletinbriefs.in${cleanPath}`;
  }
}

export function SEOHead({
  title,
  description,
  image,
  url,
  canonicalUrl: providedCanonicalUrl,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  tags,
  structuredData,
  content,
}: SEOProps) {
  const siteTitle = "TheBulletinBriefs";
  const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;
  
  // Use provided canonical URL or normalize from url
  const canonicalUrl = providedCanonicalUrl || normalizeCanonicalUrl(url);
  
  // Auto-generate keywords and description if needed
  const autoKeywords = generateSEOKeywords(title, content, tags);
  const autoDescription = description || generateMetaDescription(undefined, content);

  return (
    <Helmet>
      {/* Basic meta tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={autoDescription} />
      <meta name="keywords" content={autoKeywords.join(", ")} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Google Discover optimization */}
      <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1, index, follow" />
      
      {/* Core Web Vitals optimizations */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="//images.unsplash.com" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      
      {/* Performance hints */}
      {image && <link rel="preload" as="image" href={image} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={autoDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content="en_US" />
      {image && <meta property="og:image" content={image} />}
      {image && <meta property="og:image:alt" content={title} />}
      {image && <meta property="og:image:width" content="1200" />}
      {image && <meta property="og:image:height" content="630" />}
      
      {/* Article specific */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === "article" && author && (
        <meta property="article:author" content={author} />
      )}
      {type === "article" && (
        <meta property="article:publisher" content="TheBulletinBriefs" />
      )}
      {type === "article" && autoKeywords?.map((keyword) => (
        <meta key={keyword} property="article:tag" content={keyword} />
      ))}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={autoDescription} />
      <meta name="twitter:site" content="@TheBulletinBriefs" />
      <meta name="twitter:creator" content="@TheBulletinBriefs" />
      {image && <meta name="twitter:image" content={image} />}
      {image && <meta name="twitter:image:alt" content={title} />}

      {/* Additional SEO meta tags */}
      <meta name="author" content={author || siteTitle} />
      <meta name="publisher" content={siteTitle} />
      <meta name="theme-color" content="#000000" />
      
      {/* News-specific meta tags */}
      {type === "article" && (
        <>
          <meta name="news_keywords" content={autoKeywords.slice(0, 10).join(", ")} />
          <meta name="original-source" content={canonicalUrl} />
          {publishedTime && <meta name="DC.date.issued" content={publishedTime} />}
        </>
      )}

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}

export function generateArticleStructuredData(article: {
  title: string;
  description: string;
  author: string;
  authorUsername?: string;
  authorBio?: string;
  authorJobTitle?: string;
  publishedTime: string;
  modifiedTime: string;
  image?: string;
  url: string;
  keywords?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": article.url,
    },
    "headline": article.title.length > 110 ? article.title.substring(0, 107) + "..." : article.title,
    "description": article.description,
    "image": article.image ? {
      "@type": "ImageObject",
      "url": article.image,
      "width": 1200,
      "height": 630
    } : undefined,
    "author": {
      "@type": "Person",
      "name": article.author,
      "alternateName": article.authorUsername,
      "jobTitle": article.authorJobTitle || "Journalist",
      "description": article.authorBio || "Contributing writer at TheBulletinBriefs",
      "url": article.authorUsername ? `${window.location.origin}/author/${article.authorUsername}` : undefined,
      "affiliation": {
        "@type": "NewsMediaOrganization",
        "name": "TheBulletinBriefs"
      }
    },
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": "TheBulletinBriefs",
      "url": window.location.origin,
      "logo": {
        "@type": "ImageObject",
        "url": `${window.location.origin}/logo.png`,
        "width": 200,
        "height": 60,
      },
      "publishingPrinciples": `${window.location.origin}/editorial-guidelines`,
      "ethicsPolicy": `${window.location.origin}/editorial-guidelines`,
      "foundingDate": "2024"
    },
    "datePublished": article.publishedTime,
    "dateModified": article.modifiedTime,
    "articleSection": "News",
    "url": article.url,
    "inLanguage": "en-US",
    "isAccessibleForFree": true,
    "backstory": "Original reporting from TheBulletinBriefs newsroom",
    "creditText": article.author,
    "copyrightHolder": {
      "@type": "NewsMediaOrganization",
      "name": "TheBulletinBriefs"
    },
    "copyrightYear": new Date(article.publishedTime).getFullYear(),
    ...(article.keywords && {
      "keywords": article.keywords.join(", "),
    }),
  };
}

// Generate Organization structured data for homepage
export function generateOrganizationStructuredData() {
  const baseUrl = window.location.origin;
  
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: "TheBulletinBriefs",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: "Your trusted source for breaking news, in-depth analysis, and comprehensive coverage of events that matter.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "US",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-555-123-4567",
      contactType: "customer service",
      email: "contact@thebulletinbriefs.in",
    },
    sameAs: [
      "https://twitter.com/TheBulletinBriefs",
      "https://facebook.com/TheBulletinBriefs",
      "https://linkedin.com/company/thebulletinbriefs",
    ],
    publishingPrinciples: `${baseUrl}/editorial-guidelines`,
    diversityPolicy: `${baseUrl}/diversity-policy`,
    ethicsPolicy: `${baseUrl}/ethics-policy`,
  };
}

// WebSite Schema with Sitelinks Search Box
export function generateWebSiteStructuredData() {
  const baseUrl = window.location.origin;
  
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "TheBulletinBriefs",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

// Category Page Schema
export function generateCategoryStructuredData(category: {
  name: string;
  description?: string;
  slug: string;
}) {
  const baseUrl = window.location.origin;
  
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${category.name} News - TheBulletinBriefs`,
    "description": category.description || `Latest ${category.name} news and updates`,
    "url": `${baseUrl}/category/${category.slug}`,
    "mainEntity": {
      "@type": "ItemList",
      "name": `${category.name} Articles`
    }
  };
}