import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeHtml } from '@/lib/sanitize';

interface AMPArticleProps {
  article?: any;
}

export function AMPArticleGenerator({ article }: AMPArticleProps) {
  const [ampHtml, setAmpHtml] = useState<string>('');

  useEffect(() => {
    if (article) {
      generateAMPHTML(article);
    }
  }, [article]);

  const generateAMPHTML = (articleData: any) => {
    const baseUrl = window.location.origin;
    const canonical = `${baseUrl}/article/${articleData.slug}`;
    
    // Clean content for AMP (remove unsupported elements)
    // Security: Sanitize content before processing
    const cleanContent = sanitizeHtml(articleData.content || '')
      ?.replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
      ?.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes (use amp-iframe instead)  
      ?.replace(/<img([^>]*)>/gi, (match: string, attrs: string) => {
        // Convert img to amp-img
        const srcMatch = attrs.match(/src="([^"]*)"/);
        const altMatch = attrs.match(/alt="([^"]*)"/);
        const src = srcMatch ? srcMatch[1] : '';
        const alt = altMatch ? altMatch[1] : '';
        
        return `<amp-img src="${src}" alt="${alt}" width="800" height="400" layout="responsive"></amp-img>`;
      });

    const ampTemplate = `<!doctype html>
<html amp lang="en">
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <title>${articleData.title} - TheBulletinBriefs</title>
  <link rel="canonical" href="${canonical}">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <meta name="description" content="${articleData.excerpt || articleData.meta_description || ''}">
  
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
    
    .article-content p {
      margin-bottom: 1.5rem;
    }
    
    .footer {
      background: #1a1a1a;
      color: white;
      text-align: center;
      padding: 2rem 1rem;
      margin-top: 3rem;
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 0.5rem;
      }
      
      .article-title {
        font-size: 1.5rem;
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
    "headline": "${articleData.title}",
    "description": "${articleData.excerpt || ''}",
    "image": "${articleData.image_url || ''}",
    "author": {
      "@type": "Person",
      "name": "${articleData.author}"
    },
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": "TheBulletinBriefs",
      "logo": {
        "@type": "ImageObject",
        "url": "${baseUrl}/logo.png"
      }
    },
    "datePublished": "${articleData.published_at}",
    "dateModified": "${articleData.updated_at}",
    "articleSection": "News",
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
      <h1 class="article-title">${articleData.title}</h1>
      
      <div class="article-meta">
        <span>By ${articleData.author}</span>
        <time datetime="${articleData.published_at}">
          ${new Date(articleData.published_at || articleData.created_at).toLocaleDateString()}
        </time>
      </div>
    </header>

    ${articleData.image_url ? `
    <amp-img 
      src="${articleData.image_url}" 
      alt="${articleData.title}"
      width="800" 
      height="400" 
      layout="responsive">
    </amp-img>
    ` : ''}

    <article class="article-content">
      ${cleanContent || articleData.excerpt || ''}
    </article>
  </main>

  <footer class="footer">
    <p>&copy; ${new Date().getFullYear()} TheBulletinBriefs. All rights reserved.</p>
    <p>
      <a href="${baseUrl}/about">About</a> | 
      <a href="${baseUrl}/contact">Contact</a>
    </p>
  </footer>
</body>
</html>`;

    setAmpHtml(ampTemplate);
  };

  const downloadAMP = () => {
    if (!ampHtml) return;
    
    const blob = new Blob([ampHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${article?.slug || 'article'}.amp.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!article) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">No article data available for AMP generation</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AMP Version</h3>
        <button
          onClick={downloadAMP}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Download AMP HTML
        </button>
      </div>
      
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          AMP version generated successfully. The AMP page will be optimized for mobile viewing 
          and fast loading. It includes structured data and follows AMP best practices.
        </p>
      </div>
      
      <details className="border rounded-lg">
        <summary className="p-4 cursor-pointer">View AMP HTML Preview</summary>
        <pre className="p-4 text-xs bg-muted overflow-auto max-h-96">
          <code>{ampHtml}</code>
        </pre>
      </details>
    </div>
  );
}