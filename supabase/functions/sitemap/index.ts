import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Article {
  slug: string;
  updated_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('VITE_SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Fetch published articles
    const { data: articles, error } = await supabaseClient
      .from("articles")
      .select("slug, updated_at")
      .eq("published", true)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }

    const sitemapXml = generateSitemap(articles as Article[]);

    return new Response(sitemapXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });

  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(generateFallbackSitemap(), {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });
  }
});

function generateSitemap(articles: Article[]) {
  const baseUrl = "https://thebulletinbriefs.in";
  const today = new Date().toISOString().split("T")[0];

  // Static pages
  const staticPages = [
    { path: '/', changefreq: 'daily', priority: '1.0' },
    { path: '/about', changefreq: 'monthly', priority: '0.7' },
    { path: '/contact', changefreq: 'monthly', priority: '0.7' },
    { path: '/editorial-guidelines', changefreq: 'monthly', priority: '0.7' },
    { path: '/subscription', changefreq: 'weekly', priority: '0.7' },
    { path: '/privacy', changefreq: 'monthly', priority: '0.7' },
    { path: '/terms', changefreq: 'monthly', priority: '0.7' },
    { path: '/cookies', changefreq: 'monthly', priority: '0.7' },
    { path: '/disclaimer', changefreq: 'monthly', priority: '0.7' },
    { path: '/rss', changefreq: 'daily', priority: '0.5' }
  ];

  let urls = '';
  
  // Add static pages
  staticPages.forEach(page => {
    urls += `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  });

  // Add article pages
  articles.forEach(article => {
    const lastmod = article.updated_at 
      ? new Date(article.updated_at).toISOString().split("T")[0] 
      : today;
    
    urls += `  <url>
    <loc>${baseUrl}/article/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}</urlset>`;
}

function generateFallbackSitemap() {
  const baseUrl = "https://thebulletinbriefs.in";
  const today = new Date().toISOString().split("T")[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;
}
