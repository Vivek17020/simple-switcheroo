// api/news-sitemap.xml.js
// Vercel serverless function for Google News sitemap

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Supabase client with server-side env vars
    const supabaseUrl = 'https://tadcyglvsjycpgsjkywj.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date for 48 hours ago (Google News requirement)
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);
    const twoDaysAgoISO = twoDaysAgo.toISOString();

    // Query articles from last 48 hours (limit to 1000 per Google News requirements)
    const { data: articles, error } = await supabase
      .from('articles')
      .select('slug, title, excerpt, image_url, tags, published_at, created_at, categories(name)')
      .eq('published', true)
      .gte('published_at', twoDaysAgoISO)
      .order('published_at', { ascending: false })
      .limit(1000);

    // If no recent articles, get the latest published articles instead
    if (!articles || articles.length === 0) {
      const { data: latestArticles, error: latestError } = await supabase
        .from('articles')
        .select('slug, title, excerpt, image_url, tags, published_at, created_at, categories(name)')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(10);
      
      if (latestError) {
        console.error('Supabase query error for latest articles:', latestError);
      } else if (latestArticles && latestArticles.length > 0) {
        // Use latest articles if no recent ones found
        articles = latestArticles;
      }
    }

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Database query failed' });
    }

    // Generate Google News sitemap XML
    const baseUrl = 'https://www.thebulletinbriefs.in';
    
    const urlEntries = (articles || []).map(article => {
      const publishDate = article.published_at ? new Date(article.published_at) : new Date(article.created_at);
      const formattedDate = publishDate.toISOString();
      const keywords = article.tags?.join(', ') || article.categories?.name || 'news';
      const imageUrl = article.image_url || `${baseUrl}/default-article-image.jpg`;
      
      return `  <url>
    <loc>${baseUrl}/article/${article.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>TheBulletinBriefs</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${formattedDate}</news:publication_date>
      <news:title><![CDATA[${article.title}]]></news:title>
      <news:keywords><![CDATA[${keywords}]]></news:keywords>
    </news:news>
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:title><![CDATA[${article.title}]]></image:title>
      <image:caption><![CDATA[${article.excerpt || article.title}]]></image:caption>
    </image:image>
    <lastmod>${formattedDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;

    // Set proper headers
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    
    return res.status(200).send(xml);

  } catch (error) {
    console.error('News sitemap generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
