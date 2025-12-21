// sitemap-server.js
// Express server to serve a dynamic sitemap.xml using Supabase

// 1) Imports
// - express: HTTP server and routing
// - @supabase/supabase-js: Supabase client to query the database
// - date-fns/formatISO: to format dates as ISO strings for <lastmod>
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { formatISO } from 'date-fns';
import dotenv from 'dotenv';

// Load environment variables from .env (server-side only)
dotenv.config();

// 2) Create an Express app
const app = express();

// 3) Read environment variables
// - VITE_SUPABASE_URL: Supabase project URL (shared with client env naming)
// - SUPABASE_SERVICE_ROLE_KEY: server-only secret for full DB access
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // Fail fast if required env vars are missing
  console.error('Missing required env vars: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key (do NOT expose this to client-side code)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 4) GET /sitemap.xml route
// - Queries Supabase table `articles` where published = true
// - Selects slug and updated_at
// - Generates a valid XML sitemap
app.get('/sitemap.xml', async (req, res) => {
  try {
    // Query all published articles
    const { data, error } = await supabase
      .from('articles')
      .select('slug, updated_at')
      .eq('published', true);

    if (error) {
      throw error;
    }

    // 5) Generate sitemap XML
    const baseUrl = 'https://thebulletinbriefs.in';
    const today = formatISO(new Date(), { representation: 'date' });

    // Static pages
    const staticPages = [
      { path: '/', changefreq: 'daily', priority: '1.0' },
      { path: '/about', changefreq: 'monthly', priority: '0.7' },
      { path: '/contact', changefreq: 'monthly', priority: '0.7' },
      { path: '/subscription', changefreq: 'weekly', priority: '0.7' },
      { path: '/privacy', changefreq: 'monthly', priority: '0.7' },
      { path: '/terms', changefreq: 'monthly', priority: '0.7' },
      { path: '/rss', changefreq: 'daily', priority: '0.5' },
    ];

    const staticUrls = staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');

    // Dynamic article URLs
    const articleUrls = (data || []).map((row) => {
      const safeSlug = String(row.slug || '').replace(/^\/+/, '');
      const lastModDate = row.updated_at ? new Date(row.updated_at) : new Date();
      const lastmod = formatISO(lastModDate, { representation: 'date' });

      return `  <url>
    <loc>${baseUrl}/article/${safeSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${articleUrls}
</urlset>`;

    // 6) Set Content-Type and return XML with caching headers
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(xml);
  } catch (err) {
    console.error('Error generating sitemap:', err);
    res.status(500).send('Internal Server Error');
  }
});

// 7) Start the server on port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Sitemap server listening on http://localhost:${PORT}/sitemap.xml`);
});


