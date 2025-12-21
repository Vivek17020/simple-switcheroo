import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Article {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  updated_at: string;
  published_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Fetch articles
    const { data: articles, error: articlesError } = await supabaseClient
      .from("articles")
      .select("id, title, slug, published, updated_at, published_at, category_id")
      .eq("published", true)
      .order("published_at", { ascending: false });

    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
      throw articlesError;
    }

    // Fetch categories
    const { data: categories, error: categoriesError } = await supabaseClient
      .from("categories")
      .select("id, name, slug, parent_id")
      .order("name");

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      throw categoriesError;
    }

    // Fetch web stories with category
    const { data: webStories, error: webStoriesError } = await supabaseClient
      .from("web_stories")
      .select("slug, category, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false });

    if (webStoriesError) {
      console.error('Error fetching web stories:', webStoriesError);
    }

    // Fetch Web3 learning paths
    const { data: learningPaths, error: learningPathsError } = await supabaseClient
      .from("web3_learning_paths")
      .select("slug, updated_at")
      .eq("is_published", true)
      .order("updated_at", { ascending: false });

    if (learningPathsError) {
      console.error('Error fetching learning paths:', learningPathsError);
    }

    const sitemapXml = generateSitemap(
      articles as Article[], 
      categories as Category[], 
      webStories || [], 
      learningPaths || []
    );

    return new Response(sitemapXml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });

  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate sitemap' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateSitemap(articles: Article[], categories: Category[], webStories: any[], learningPaths: any[]) {
  const baseUrl = "https://www.thebulletinbriefs.in";
  const today = new Date().toISOString().split("T")[0];

  let urls = `
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/news</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

  // Static pages
  const staticPages = [
    { path: '/about', changefreq: 'monthly', priority: '0.7' },
    { path: '/contact', changefreq: 'monthly', priority: '0.7' },
    { path: '/editorial-guidelines', changefreq: 'monthly', priority: '0.6' },
    { path: '/subscription', changefreq: 'weekly', priority: '0.8' },
    { path: '/privacy', changefreq: 'monthly', priority: '0.5' },
    { path: '/terms', changefreq: 'monthly', priority: '0.5' },
    { path: '/cookies', changefreq: 'monthly', priority: '0.5' },
    { path: '/disclaimer', changefreq: 'monthly', priority: '0.5' },
    { path: '/government-exams', changefreq: 'weekly', priority: '0.8' },
    { path: '/admit-cards', changefreq: 'daily', priority: '0.8' },
    { path: '/previous-year-papers', changefreq: 'weekly', priority: '0.7' }
  ];

  // Tool pages
  const toolPages = [
    { path: '/tools', changefreq: 'weekly', priority: '0.8' },
    { path: '/tools/pdf-tools', changefreq: 'weekly', priority: '0.7' },
    { path: '/tools/image-tools', changefreq: 'weekly', priority: '0.7' },
    { path: '/tools/video-tools', changefreq: 'weekly', priority: '0.7' },
    { path: '/tools/jpg-to-pdf', changefreq: 'monthly', priority: '0.7' },
    { path: '/tools/pdf-to-word', changefreq: 'monthly', priority: '0.7' },
    { path: '/tools/word-to-pdf', changefreq: 'monthly', priority: '0.7' },
    { path: '/tools/merge-pdf', changefreq: 'monthly', priority: '0.7' },
    { path: '/tools/split-pdf', changefreq: 'monthly', priority: '0.7' },
    { path: '/tools/compress-pdf', changefreq: 'monthly', priority: '0.7' },
    { path: '/tools/excel-to-pdf', changefreq: 'monthly', priority: '0.7' },
    { path: '/tools/pdf-to-excel', changefreq: 'monthly', priority: '0.7' },
    { path: '/tools/ppt-to-pdf', changefreq: 'monthly', priority: '0.7' },
    { path: '/tools/pdf-to-ppt', changefreq: 'monthly', priority: '0.7' },
    { path: '/tools/pdf-to-jpg', changefreq: 'monthly', priority: '0.7' },
    { path: '/tools/jpg-to-png', changefreq: 'monthly', priority: '0.7' },
    { path: '/tools/png-to-jpg', changefreq: 'monthly', priority: '0.7' },
    { path: '/tools/convert-to-webp', changefreq: 'monthly', priority: '0.7' },
    { path: '/tools/image-compressor', changefreq: 'monthly', priority: '0.7' },
    { path: '/tools/image-resizer', changefreq: 'monthly', priority: '0.7' },
    { path: '/tools/image-cropper', changefreq: 'monthly', priority: '0.7' },
    { path: '/tools/youtube-shorts-downloader', changefreq: 'monthly', priority: '0.7' },
    { path: '/tools/instagram-video-downloader', changefreq: 'monthly', priority: '0.7' },
    { path: '/tools/pdf-watermark', changefreq: 'monthly', priority: '0.7' }
  ];

  staticPages.forEach(page => {
    urls += `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  });

  // Add tool pages to sitemap
  toolPages.forEach(page => {
    urls += `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  });

  // Category pages
  categories.forEach(category => {
    // For subcategories, use nested URL structure with parent slug
    if (category.parent_id) {
      const parent = categories.find(c => c.id === category.parent_id);
      if (parent) {
        urls += `
  <url>
    <loc>${baseUrl}/${parent.slug}/${category.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
    } else {
      // Parent categories - only add if not filtering them out
      urls += `
  <url>
    <loc>${baseUrl}/category/${category.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
  });

  // Article pages
  articles
    .filter(article => article.published)
    .forEach(article => {
      const lastmod = article.updated_at 
        ? new Date(article.updated_at).toISOString().split("T")[0] 
        : today;
      
      urls += `
  <url>
    <loc>${baseUrl}/article/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

  // Web Stories index page
  urls += `
  <url>
    <loc>${baseUrl}/web-stories</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

  // Individual Web Stories
  webStories.forEach(story => {
    const lastmod = story.updated_at 
      ? new Date(story.updated_at).toISOString().split("T")[0] 
      : today;
    const storyCategory = story.category || 'general';
    
    urls += `
  <url>
    <loc>${baseUrl}/webstories/${storyCategory}/${story.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  // RSS Feed
  urls += `
  <url>
    <loc>${baseUrl}/rss</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.5</priority>
  </url>`;

  // Web3 for India Section
  urls += `
  <url>
    <loc>${baseUrl}/web3forindia</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/web3forindia/dashboard</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/web3forindia/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/web3forindia/playground</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;

  // Web3 category pages (blockchain-basics, smart-contracts, defi, nfts, crypto-fundamentals, web3-development)
  const web3Categories = categories.filter(c => 
    c.slug === 'web3forindia' || 
    categories.some(parent => parent.slug === 'web3forindia' && parent.id === c.parent_id)
  );

  web3Categories.forEach(category => {
    if (category.slug !== 'web3forindia') {
      urls += `
  <url>
    <loc>${baseUrl}/web3forindia/${category.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
  });

  // Web3 articles
  const web3CategoryIds = web3Categories.map(c => c.id);
  articles
    .filter(article => article.published && web3CategoryIds.includes((article as any).category_id))
    .forEach(article => {
      const lastmod = article.updated_at 
        ? new Date(article.updated_at).toISOString().split("T")[0] 
        : today;
      
      urls += `
  <url>
    <loc>${baseUrl}/web3forindia/article/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

  // Web3 Learning Paths
  learningPaths.forEach(path => {
    const lastmod = path.updated_at 
      ? new Date(path.updated_at).toISOString().split("T")[0] 
      : today;
    
    urls += `
  <url>
    <loc>${baseUrl}/web3forindia/learning-path/${path.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}
