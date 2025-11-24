// api/web-stories-sitemap.xml.js
// Vercel serverless function for web stories sitemap

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

    // Generate XML entries for each web story
    const urlEntries = (stories || []).map(story => {
      const categorySlug = story.category ? story.category.toLowerCase() : 'general';
      const storyUrl = `${baseUrl}/webstories/${categorySlug}/${story.slug}`;
      const publishDate = new Date(story.published_at).toISOString();
      
      // Get all images from slides
      const imageEntries = story.slides
        ?.filter(slide => slide?.image)
        .map(slide => `    <image:image>
      <image:loc>${slide.image}</image:loc>
      <image:title>${escapeXml(slide.text || story.title)}</image:title>
    </image:image>`)
        .join('\n') || '';

      return `  <url>
    <loc>${storyUrl}</loc>
    <lastmod>${publishDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
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
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;

    // Set proper headers
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    
    return res.status(200).send(xml);

  } catch (error) {
    console.error('Web stories sitemap generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
