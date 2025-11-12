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

// Extract primary keyword from title
export function extractPrimaryKeyword(title: string): string {
  // Remove special characters and get the most meaningful phrase
  const cleaned = title.toLowerCase().replace(/[^\w\s-]/g, '');
  const words = cleaned.split(/\s+/).filter(w => w.length > 2);
  
  // Return first 2-4 words as primary keyword
  return words.slice(0, Math.min(4, words.length)).join(' ');
}

// Generate keyword variations for partial ranking
export function generateKeywordVariations(title: string): string[] {
  const variations: string[] = [];
  const words = title.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);
  
  // Add full title
  variations.push(words.join(' '));
  
  // Generate 2-word combinations
  for (let i = 0; i < words.length - 1; i++) {
    variations.push(`${words[i]} ${words[i + 1]}`);
  }
  
  // Generate 3-word combinations
  for (let i = 0; i < words.length - 2; i++) {
    variations.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  
  // Add individual important words (length > 4)
  variations.push(...words.filter(w => w.length > 4));
  
  return [...new Set(variations)];
}

// Extract noun phrases (multi-word keywords)
export function extractNounPhrases(text: string): string[] {
  const phrases: string[] = [];
  const cleaned = text.toLowerCase().replace(/<[^>]*>/g, ' ');
  
  // Match capitalized phrases (likely proper nouns or important terms)
  const capitalizedMatches = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
  phrases.push(...capitalizedMatches.map(p => p.toLowerCase()));
  
  // Match common noun patterns: adjective + noun, noun + noun
  const words = cleaned.split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].length > 3 && words[i + 1].length > 3) {
      phrases.push(`${words[i]} ${words[i + 1]}`);
    }
  }
  
  return [...new Set(phrases)].slice(0, 10);
}

// Auto-generate SEO keywords with advanced NLP-like analysis
// Prefers database keywords if available
export function generateSEOKeywords(
  title: string, 
  content?: string, 
  tags?: string[],
  dbKeywords?: {
    primary_keyword?: string;
    secondary_keywords?: string[];
    lsi_keywords?: string[];
    target_queries?: string[];
  }
): string[] {
  const keywords: string[] = [];
  
  // PRIORITY 1: Use database keywords if available (from analyze-keywords)
  if (dbKeywords) {
    if (dbKeywords.primary_keyword) keywords.push(dbKeywords.primary_keyword);
    if (dbKeywords.secondary_keywords) keywords.push(...dbKeywords.secondary_keywords);
    if (dbKeywords.lsi_keywords) keywords.push(...dbKeywords.lsi_keywords);
    if (dbKeywords.target_queries) keywords.push(...dbKeywords.target_queries);
    
    // If we have enough keywords from DB, return them
    if (keywords.length >= 10) {
      return [...new Set(keywords)].slice(0, 20);
    }
  }
  
  // FALLBACK: Generate keywords if DB data is insufficient
  // Add tags if available
  if (tags) {
    keywords.push(...tags);
  }
  
  // Add keyword variations from title
  keywords.push(...generateKeywordVariations(title));
  
  // Extract noun phrases from title
  keywords.push(...extractNounPhrases(title));
  
  // Extract keywords from content if available
  if (content) {
    const contentText = content.replace(/<[^>]*>/g, ' ').toLowerCase();
    const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'may', 'she', 'use', 'this', 'that', 'with', 'from', 'have', 'been', 'will', 'would', 'there', 'their', 'what', 'about', 'which', 'when', 'make', 'than', 'into', 'time', 'year', 'some', 'could', 'them', 'other'];
    
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
      .slice(0, 15)
      .map(([word]) => word);
    
    keywords.push(...topWords);
    
    // Extract noun phrases from content
    keywords.push(...extractNounPhrases(content));
  }
  
  // Remove duplicates and limit to 20 keywords
  return [...new Set(keywords)].slice(0, 20);
}

// Generate FAQ schema from content
export function generateFAQSchemaFromContent(content: string) {
  const faqs: Array<{ question: string; answer: string }> = [];
  
  // Match H3 tags that are questions
  const h3Regex = /<h3[^>]*>(.*?\?)<\/h3>/gi;
  let match;
  
  while ((match = h3Regex.exec(content)) !== null) {
    const question = match[1].replace(/<[^>]*>/g, '').trim();
    
    // Get the next paragraph after the question
    const afterQuestion = content.substring(match.index + match[0].length);
    const pMatch = afterQuestion.match(/<p[^>]*>(.*?)<\/p>/i);
    
    if (pMatch) {
      const answer = pMatch[1].replace(/<[^>]*>/g, '').trim();
      if (answer.length > 20) {
        faqs.push({ question, answer });
      }
    }
  }
  
  if (faqs.length === 0) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

// Auto-generate meta description from content with long-tail keyword optimization
export function generateMetaDescription(
  excerpt?: string, 
  content?: string,
  primaryKeyword?: string,
  secondaryKeywords?: string[]
): string {
  // Use excerpt if available and descriptive
  if (excerpt && excerpt.length > 50) {
    let description = excerpt.length > 160 ? excerpt.substring(0, 157) + '...' : excerpt;
    
    // Enhance with keyword if not present
    if (primaryKeyword && !description.toLowerCase().includes(primaryKeyword.toLowerCase())) {
      // Try to naturally insert keyword
      if (description.length < 120) {
        description = description.replace(/\.\.\.$/, '');
        description += ` Learn about ${primaryKeyword}.`;
        if (description.length > 160) {
          description = description.substring(0, 157) + '...';
        }
      }
    }
    
    return description;
  }
  
  // Generate from content
  if (content) {
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Try to find a sentence containing the primary keyword
    if (primaryKeyword) {
      const sentences = plainText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 30);
      const keywordSentence = sentences.find(s => 
        s.toLowerCase().includes(primaryKeyword.toLowerCase())
      );
      
      if (keywordSentence) {
        let description = keywordSentence;
        
        // Add secondary keyword if space allows
        if (secondaryKeywords && secondaryKeywords.length > 0 && description.length < 120) {
          const secondary = secondaryKeywords[0];
          if (!description.toLowerCase().includes(secondary.toLowerCase())) {
            description += ` Includes ${secondary}.`;
          }
        }
        
        return description.length > 160 ? description.substring(0, 157) + '...' : description;
      }
    }
    
    // Fallback to first 160 characters
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
  
  // Extract database keywords if passed via tags
  const dbKeywords = tags && Array.isArray(tags) && tags.length > 0 ? {
    primary_keyword: tags[0],
    secondary_keywords: tags.slice(1, 4),
  } : undefined;
  
  // Auto-generate keywords and description if needed
  const autoKeywords = generateSEOKeywords(title, content, tags);
  const autoDescription = description || generateMetaDescription(
    undefined, 
    content,
    dbKeywords?.primary_keyword,
    dbKeywords?.secondary_keywords
  );

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
      email: "contact@thebulletinbriefs.com",
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