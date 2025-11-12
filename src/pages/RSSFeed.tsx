import { useEffect } from "react";
import { useArticles } from "@/hooks/use-articles";

export default function RSSFeed() {
  const { data } = useArticles(undefined, 1, 20);

  useEffect(() => {
    if (data?.articles) {
      const rssXml = generateRSSFeed(data.articles);
      
      // Set response headers for RSS
      const response = new Response(rssXml, {
        headers: {
          'Content-Type': 'application/rss+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
      });

      // Replace the current page with the RSS feed
      window.location.replace(`data:application/rss+xml;charset=utf-8,${encodeURIComponent(rssXml)}`);
    }
  }, [data]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Generating RSS Feed...</h1>
        <p className="text-muted-foreground">
          Please wait while we generate your RSS feed.
        </p>
      </div>
    </div>
  );
}

function generateRSSFeed(articles: any[]) {
  const baseUrl = window.location.origin;
  const pubDate = new Date().toUTCString();

  const rssItems = articles.map(article => {
    const articleUrl = `${baseUrl}/article/${article.slug}`;
    const publishDate = article.published_at ? new Date(article.published_at).toUTCString() : new Date(article.created_at).toUTCString();
    const plainTextContent = article.content ? article.content.replace(/<[^>]*>/g, '').substring(0, 300) : article.excerpt || '';
    
    return `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <description><![CDATA[${article.excerpt || plainTextContent}]]></description>
      <content:encoded><![CDATA[${article.content || article.excerpt || ''}]]></content:encoded>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <pubDate>${publishDate}</pubDate>
      <dc:creator><![CDATA[${article.author}]]></dc:creator>
      <category domain="${baseUrl}/category/${article.categories?.slug || ''}">${article.categories?.name || 'General'}</category>
      ${article.image_url ? `
      <enclosure url="${article.image_url}" type="image/jpeg" />
      <media:content url="${article.image_url}" type="image/jpeg" medium="image">
        <media:title type="plain">${article.title}</media:title>
        <media:description type="plain">${article.excerpt || ''}</media:description>
      </media:content>` : ''}
      <dc:date>${publishDate}</dc:date>
      <source url="${baseUrl}/rss">TheBulletinBriefs RSS</source>
    </item>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>TheBulletinBriefs - Latest News &amp; Articles</title>
    <description>Stay updated with the latest news in politics, technology, education, world events, sports, and business.</description>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/rss" rel="self" type="application/rss+xml" />
    <language>en-US</language>
    <copyright>© ${new Date().getFullYear()} TheBulletinBriefs. All rights reserved.</copyright>
    <lastBuildDate>${pubDate}</lastBuildDate>
    <pubDate>${pubDate}</pubDate>
    <managingEditor>editor@thebulletinbriefs.com (TheBulletinBriefs Editorial Team)</managingEditor>
    <webMaster>webmaster@thebulletinbriefs.com (TheBulletinBriefs Technical Team)</webMaster>
    <generator>TheBulletinBriefs RSS Generator v2.0</generator>
    <docs>https://www.rssboard.org/rss-specification</docs>
    <ttl>60</ttl>
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>TheBulletinBriefs</title>
      <link>${baseUrl}</link>
      <width>144</width>
      <height>144</height>
      <description>TheBulletinBriefs Logo</description>
    </image>
    ${rssItems}
  </channel>
</rss>`;
}