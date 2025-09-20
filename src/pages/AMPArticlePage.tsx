import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AMPArticleGenerator } from '@/components/amp/amp-generator';
import { sanitizeHtml } from '@/lib/sanitize';

export default function AMPArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          categories (name, slug)
        `)
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (error) throw error;
      setArticle(data);
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground">The article you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Generate AMP HTML and serve it directly
  const generateAMPHTML = () => {
    const baseUrl = window.location.origin;
    const canonical = `${baseUrl}/article/${article.slug}`;
    
    // Clean content for AMP
    // Security: Sanitize content before processing
    const cleanContent = sanitizeHtml(article.content || '')
      ?.replace(/<script[^>]*>.*?<\/script>/gi, '')
      ?.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      ?.replace(/<img([^>]*)>/gi, (match: string, attrs: string) => {
        const srcMatch = attrs.match(/src="([^"]*)"/);
        const altMatch = attrs.match(/alt="([^"]*)"/);
        const src = srcMatch ? srcMatch[1] : '';
        const alt = altMatch ? altMatch[1] : '';
        
        return `<amp-img src="${src}" alt="${alt}" width="800" height="400" layout="responsive"></amp-img>`;
      });

    return `<!doctype html>
<html amp lang="en">
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <title>${article.title} - TheBulletinBriefs</title>
  <link rel="canonical" href="${canonical}">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <meta name="description" content="${article.excerpt || article.meta_description || ''}">
  
  <style amp-custom>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem;
      text-align: center;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
      background: white;
      min-height: 80vh;
    }
    
    .article-title {
      font-size: 2rem;
      font-weight: bold;
      line-height: 1.2;
      margin-bottom: 1rem;
      color: #1a1a1a;
    }
    
    .article-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    
    .article-content {
      line-height: 1.7;
      color: #333;
    }
    
    .article-content h2 {
      font-size: 1.5rem;
      font-weight: bold;
      margin: 2rem 0 1rem 0;
    }
    
    .article-content h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 1.5rem 0 1rem 0;
    }
    
    .article-content p {
      margin-bottom: 1.5rem;
    }
    
    .article-content blockquote {
      border-left: 4px solid #667eea;
      padding-left: 1rem;
      margin: 1.5rem 0;
      font-style: italic;
      color: #555;
    }
    
    .article-content ul, .article-content ol {
      margin-bottom: 1.5rem;
      padding-left: 2rem;
    }
    
    .footer {
      background: #1a1a1a;
      color: white;
      text-align: center;
      padding: 2rem 1rem;
      margin-top: 3rem;
    }
    
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 0.5rem;
      }
      
      .article-title {
        font-size: 1.5rem;
      }
      
      .article-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  </style>
  
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "${canonical}"
    },
    "headline": "${article.title}",
    "description": "${article.excerpt || ''}",
    "image": "${article.image_url || ''}",
    "author": {
      "@type": "Person",
      "name": "${article.author}"
    },
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": "TheBulletinBriefs",
      "logo": {
        "@type": "ImageObject",
        "url": "${baseUrl}/logo.png"
      }
    },
    "datePublished": "${article.published_at}",
    "dateModified": "${article.updated_at}",
    "articleSection": "${article.categories?.name || 'News'}",
    "inLanguage": "en-US"
  }
  </script>
</head>
<body>
  <header class="header">
    <h1>📰 TheBulletinBriefs</h1>
    <p>Your trusted source for breaking news</p>
  </header>

  <main class="container">
    <header>
      <h1 class="article-title">${article.title}</h1>
      
      <div class="article-meta">
        <span>By ${article.author}</span>
        <span>•</span>
        <time datetime="${article.published_at}">
          ${new Date(article.published_at || article.created_at).toLocaleDateString()}
        </time>
        ${article.categories ? `<span>•</span><span>${article.categories.name}</span>` : ''}
      </div>
      
      ${article.excerpt ? `<p style="font-size: 1.1rem; color: #555; margin-bottom: 2rem;">${article.excerpt}</p>` : ''}
    </header>

    ${article.image_url ? `
    <amp-img 
      src="${article.image_url}" 
      alt="${article.title}"
      width="800" 
      height="400" 
      layout="responsive"
      style="margin-bottom: 2rem; border-radius: 0.5rem;">
    </amp-img>
    ` : ''}

    <article class="article-content">
      ${cleanContent || article.excerpt || ''}
    </article>
  </main>

  <footer class="footer">
    <p>&copy; ${new Date().getFullYear()} TheBulletinBriefs. All rights reserved.</p>
    <p>
      <a href="${baseUrl}">Home</a> | 
      <a href="${baseUrl}/about">About</a> | 
      <a href="${baseUrl}/contact">Contact</a>
    </p>
  </footer>
</body>
</html>`;
  };

  // Serve AMP HTML directly by replacing document content
  useEffect(() => {
    if (article) {
      const ampHtml = generateAMPHTML();
      
      // Security: Use safe DOM manipulation instead of innerHTML
      const parser = new DOMParser();
      const ampDoc = parser.parseFromString(ampHtml, 'text/html');
      
      // Safely clear and replace document content
      while (document.documentElement.firstChild) {
        document.documentElement.removeChild(document.documentElement.firstChild);
      }
      
      // Safely append sanitized content
      Array.from(ampDoc.documentElement.children).forEach(child => {
        document.documentElement.appendChild(document.importNode(child, true));
      });
      
      // Ensure AMP library loads
      const ampScript = document.createElement('script');
      ampScript.async = true;
      ampScript.src = 'https://cdn.ampproject.org/v0.js';
      document.head.appendChild(ampScript);
    }
  }, [article]);

  return null; // Component doesn't render anything as it replaces the entire document
}