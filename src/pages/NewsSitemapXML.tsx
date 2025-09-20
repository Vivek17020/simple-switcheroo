// Replace the entire file with this corrected version:

import { useArticles } from "@/hooks/use-articles";
import { Helmet } from "react-helmet-async";

export default function NewsSitemapXML() {
  const { data: articlesData } = useArticles(undefined, 1, 1000);

  if (!articlesData?.articles) {
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

  const newsSitemapXml = generateNewsSitemap(articlesData.articles);

  return (
    <>
      <Helmet>
        <meta httpEquiv="Content-Type" content="application/xml; charset=utf-8" />
      </Helmet>
      <pre 
        style={{ 
          fontFamily: 'monospace', 
          whiteSpace: 'pre-wrap', 
          margin: 0, 
          padding: 0,
          backgroundColor: 'white',
          color: 'black'
        }}
        dangerouslySetInnerHTML={{ __html: newsSitemapXml }}
      />
    </>
  );
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
