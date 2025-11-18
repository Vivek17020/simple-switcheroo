// Replace the entire file with this corrected version:

import { useArticles } from "@/hooks/use-articles";
import { useEffect, useState } from "react";

export default function NewsSitemapXML() {
  const { data: articlesData, isLoading } = useArticles(undefined, 1, 1000);
  const [xmlGenerated, setXmlGenerated] = useState(false);

  useEffect(() => {
    if (articlesData?.articles && !xmlGenerated) {
      const newsSitemapXml = generateNewsSitemap(articlesData.articles);
      
      // Create a blob with the XML content
      const blob = new Blob([newsSitemapXml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      
      // Replace the current page with the XML
      window.location.replace(url);
      
      // Clean up the URL after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
      
      setXmlGenerated(true);
    }
  }, [articlesData, xmlGenerated]);

  if (isLoading || !xmlGenerated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Generating Google News Sitemap...</h1>
          <p className="text-muted-foreground">
            Please wait while we generate your Google News sitemap.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

function generateNewsSitemap(articles: any[]) {
  const baseUrl = "https://thebulletinbriefs.in";
  
  // Filter articles from the last 2 days (Google News requirement)
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const recentArticles = articles.filter(article => {
    const publishDate = new Date(article.published_at || article.created_at);
    return publishDate >= twoDaysAgo;
  });

  const urlEntries = recentArticles.map(article => {
    const publishDate = article.published_at ? new Date(article.published_at) : new Date(article.created_at);
    const formattedDate = publishDate.toISOString();
    
    return `  <url>
    <loc>${baseUrl}/article/${article.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>TheBulletinBriefs</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${formattedDate}</news:publication_date>
      <news:title><![CDATA[${article.title}]]></news:title>
      <news:keywords><![CDATA[${article.tags?.join(', ') || article.categories?.name || 'news'}]]></news:keywords>
      <news:stock_tickers></news:stock_tickers>
    </news:news>
    <image:image>
      <image:loc>${article.image_url || `${baseUrl}/default-article-image.jpg`}</image:loc>
      <image:title><![CDATA[${article.title}]]></image:title>
      <image:caption><![CDATA[${article.excerpt || article.title}]]></image:caption>
    </image:image>
    <lastmod>${formattedDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;
}
