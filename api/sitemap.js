// api/sitemap.js
// Dynamic sitemap API that queries Supabase and returns XML

// 1) Load environment variables early
import 'dotenv/config';

// 2) Imports: Express server and Supabase client
import express from 'express';
import { createClient } from '@supabase/supabase-js';

// 3) Initialize Express app (can be mounted or run standalone)
const app = express();

// 4) Configure Supabase client using server-side env vars
//    - Do NOT expose these in client bundles
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('[sitemap] Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceRoleKey || '');

// 5) Helper to format YYYY-MM-DD from a date-like value
function toYMD(dateLike) {
  const d = dateLike ? new Date(dateLike) : new Date();
  return d.toISOString().split('T')[0];
}

// 6) Build static URLs (extend as needed)
function buildStaticUrls(baseUrl) {
  const today = toYMD(new Date());
  const pages = [
    { path: '/', changefreq: 'daily', priority: '1.0' },
    { path: '/about', changefreq: 'monthly', priority: '0.7' },
    { path: '/contact', changefreq: 'monthly', priority: '0.7' },
    { path: '/editorial-guidelines', changefreq: 'monthly', priority: '0.7' },
    { path: '/subscription', changefreq: 'weekly', priority: '0.7' },
    { path: '/privacy', changefreq: 'monthly', priority: '0.7' },
    { path: '/terms', changefreq: 'monthly', priority: '0.7' },
    { path: '/cookies', changefreq: 'monthly', priority: '0.7' },
    { path: '/disclaimer', changefreq: 'monthly', priority: '0.7' },
    { path: '/rss', changefreq: 'daily', priority: '0.5' },
  ];

  return pages.map(p => `  <url>
    <loc>${baseUrl}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');
}

// 7) GET /sitemap.xml route: query published articles and render XML
app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = 'https://thebulletinbriefs.in';

    // Query all published articles; adjust table/column names as needed
    const { data: articles, error } = await supabase
      .from('articles')
      .select('slug, updated_at')
      .eq('published', true);

    if (error) {
      console.error('[sitemap] Supabase query error:', error);
      return res.status(500).send('Error fetching articles');
    }

    // Static pages
    const staticXml = buildStaticUrls(baseUrl);

    // Dynamic article URLs (per spec, path is /articles/{slug})
    const articleXml = (articles || []).map(a => `  <url>
    <loc>${baseUrl}/articles/${a.slug}</loc>
    <lastmod>${toYMD(a.updated_at)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml}
${articleXml}
</urlset>`;

    // Set caching and content type headers
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).send(xml);
  } catch (e) {
    console.error('[sitemap] Unexpected error:', e);
    return res.status(500).send('Internal Server Error');
  }
});

// 8) If this file is executed directly (node api/sitemap.js), start a server
if (process.argv[1] && process.argv[1].endsWith('sitemap.js')) {
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
  app.listen(PORT, () => {
    console.log(`Sitemap API listening on http://localhost:${PORT}/sitemap.xml`);
  });
}

export default app;


