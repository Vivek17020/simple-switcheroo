// api/web-stories-sitemap.xml.js
// Vercel serverless function for web stories sitemap with AMP alternates

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

    // Fetch all published web stories
    const { data: stories, error } = await supabase
      .from('web_stories')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Database query failed' });
    }

    const baseUrl = 'https://www.thebulletinbriefs.in';

    // Helper function to escape XML
    const escapeXml = (unsafe) => {
      if (!unsafe) return '';
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    // Calculate priority based on recency
    const calculatePriority = (publishedAt) => {
      const now = new Date();
      const published = new Date(publishedAt);
      const daysDiff = Math.floor((now - published) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) return '1.0';
      if (daysDiff <= 7) return '0.9';
      if (daysDiff <= 30) return '0.8';
      if (daysDiff <= 90) return '0.7';
      return '0.6';
    };

    // Calculate changefreq based on recency for faster crawling of new stories
    const calculateChangefreq = (publishedAt) => {
      const now = new Date();
      const published = new Date(publishedAt);
      const hoursDiff = Math.floor((now - published) / (1000 * 60 * 60));
      
      if (hoursDiff <= 24) return 'hourly';
      if (hoursDiff <= 168) return 'daily'; // 7 days
      return 'weekly';
    };

    // Generate XML entries for each web story - use AMP URL as primary for Google indexing
    const urlEntries = (stories || []).map(story => {
      const categorySlug = story.category ? story.category.toLowerCase() : 'general';
      // Primary URL is the AMP version for proper Google Web Stories indexing
      const storyUrl = `${baseUrl}/amp-story/${categorySlug}/${story.slug}`;
      const reactUrl = `${baseUrl}/webstories/${categorySlug}/${story.slug}`;
      const publishDate = new Date(story.published_at).toISOString();
      const priority = calculatePriority(story.published_at);
      
      // Get all images from slides
      const imageEntries = story.slides
        ?.filter(slide => slide?.image)
        .map(slide => `    <image:image>
      <image:loc>${escapeXml(slide.image)}</image:loc>
      <image:title>${escapeXml(slide.text || story.title)}</image:title>
    </image:image>`)
        .join('\n') || '';

      return `  <url>
    <loc>${storyUrl}</loc>
    <xhtml:link rel="alternate" href="${reactUrl}"/>
    <lastmod>${publishDate}</lastmod>
    <changefreq>${calculateChangefreq(story.published_at)}</changefreq>
    <priority>${priority}</priority>
    <news:news>
      <news:publication>
        <news:name>TheBulletinBriefs</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${publishDate}</news:publication_date>
      <news:title>${escapeXml(story.title)}</news:title>
    </news:news>
${imageEntries}
  </url>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
<!-- Web Stories Sitemap - Generated ${new Date().toISOString()} -->
<!-- Total stories: ${stories?.length || 0} -->
${urlEntries}
</urlset>`;

    // Set proper headers - reduced cache for near real-time updates
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    
    return res.status(200).send(xml);

  } catch (error) {
    console.error('Web stories sitemap generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
