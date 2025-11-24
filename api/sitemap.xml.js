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
    const supabaseUrl = 'https://tadcyglvsjycpgsjkywj.supabase.co';
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

    // Query all categories and subcategories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id')
      .order('name');

    if (categoriesError) {
      console.error('Categories query error:', categoriesError);
    }

    // Query all published web stories
    const { data: webStories, error: webStoriesError } = await supabase
      .from('web_stories')
      .select('slug, category, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false });

    if (webStoriesError) {
      console.error('Web stories query error:', webStoriesError);
    }

    // Query all published private jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('private_jobs')
      .select('slug, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    if (jobsError) {
      console.error('Jobs query error:', jobsError);
    }

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
      { path: '/private-jobs', changefreq: 'daily', priority: '0.8' },
    ];

    // Generate static page URLs
    const staticUrls = staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');

    // Generate category URLs
    const parentCategories = (categories || []).filter(cat => !cat.parent_id);
    const childCategories = (categories || []).filter(cat => cat.parent_id);

    const categoryUrls = parentCategories.map(category => `  <url>
    <loc>${baseUrl}/category/${category.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');

    // Generate subcategory URLs with proper parent/child structure
    const subcategoryUrls = childCategories.map(subcat => {
      const parent = parentCategories.find(p => p.id === subcat.parent_id);
      if (!parent) return '';
      
      return `  <url>
    <loc>${baseUrl}/${parent.slug}/${subcat.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }).filter(Boolean).join('\n');

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

    // Generate web stories index URL
    const webStoriesIndexUrl = `  <url>
    <loc>${baseUrl}/web-stories</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

    // Generate individual web story URLs
    const webStoryUrls = (webStories || []).map(story => {
      const lastmod = story.updated_at 
        ? new Date(story.updated_at).toISOString().split('T')[0]
        : today;
      const categorySlug = story.category ? story.category.toLowerCase() : 'general';

      return `  <url>
    <loc>${baseUrl}/webstories/${categorySlug}/${story.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }).join('\n');

    // Generate job URLs
    const jobUrls = (jobs || []).map(job => {
      const lastmod = job.updated_at 
        ? new Date(job.updated_at).toISOString().split('T')[0]
        : today;

      return `  <url>
    <loc>${baseUrl}/private-jobs/${job.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }).join('\n');

    // Combine all URLs
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${categoryUrls}
${subcategoryUrls}
${articleUrls}
${webStoriesIndexUrl}
${webStoryUrls}
${jobUrls}
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
