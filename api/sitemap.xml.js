// api/sitemap.xml.js
// Vercel serverless function for dynamic sitemap

// Load environment variables
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Supabase client with server-side env vars
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query all published articles
    const { data: articles, error } = await supabase
      .from('articles')
      .select('slug, updated_at')
      .eq('published', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Database query failed' });
    }

    // Generate sitemap XML
    const baseUrl = 'https://www.thebulletinbriefs.in';
    const today = new Date().toISOString().split('T')[0];

    // Static pages
    const staticPages = [
      { path: '/', changefreq: 'daily', priority: '1.0' },
      { path: '/about', changefreq: 'monthly', priority: '0.7' },
      { path: '/contact', changefreq: 'monthly', priority: '0.7' },
      { path: '/subscription', changefreq: 'weekly', priority: '0.7' },
      { path: '/privacy', changefreq: 'monthly', priority: '0.7' },
      { path: '/terms', changefreq: 'monthly', priority: '0.7' },
      { path: '/cookies', changefreq: 'monthly', priority: '0.7' },
      { path: '/disclaimer', changefreq: 'monthly', priority: '0.7' },
      { path: '/editorial-guidelines', changefreq: 'monthly', priority: '0.7' },
      { path: '/rss', changefreq: 'daily', priority: '0.5' },
    ];

    // Generate static page URLs
    const staticUrls = staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');

    // Generate article URLs
    const articleUrls = (articles || []).map(article => {
      const lastmod = article.updated_at 
        ? new Date(article.updated_at).toISOString().split('T')[0]
        : today;

      return `  <url>
    <loc>${baseUrl}/article/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    }).join('\n');

    // Combine all URLs
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${articleUrls}
</urlset>`;

    // Set proper headers
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    
    return res.status(200).send(xml);

  } catch (error) {
    console.error('Sitemap generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
