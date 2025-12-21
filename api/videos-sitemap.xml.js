import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://tadcyglvsjycpgsjkywj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  throw new Error('Missing Supabase service role key');
}

const supabase = createClient(supabaseUrl, supabaseKey);

function extractYouTubeId(url) {
  if (!url) return null;
  
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
    /youtube\.com\/shorts\/([^&\?\/]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📹 Generating videos sitemap...');

    // Fetch all active videos
    const { data: videos, error } = await supabase
      .from('homepage_videos')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('❌ Error fetching videos:', error);
      throw error;
    }

    console.log(`✅ Found ${videos?.length || 0} active videos`);

    const baseUrl = 'https://www.thebulletinbriefs.in';
    const now = new Date().toISOString();

    // Generate video sitemap XML
    // Using homepage URL with VideoObject schema since videos are embedded on homepage
    // This is the correct approach for embedded videos without dedicated pages
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now.split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
${(videos || []).map(video => {
  const videoId = extractYouTubeId(video.youtube_url);
  
  if (!videoId) {
    console.warn(`⚠️ Could not extract video ID from: ${video.youtube_url}`);
    return '';
  }

  // YouTube thumbnail - use hqdefault as it's always available
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  
  // YouTube embed URL
  const playerUrl = `https://www.youtube.com/embed/${videoId}`;
  
  // Original video URL for content_loc
  const contentUrl = video.youtube_url;
  
  // Use created_at or current date
  const publicationDate = video.created_at ? new Date(video.created_at).toISOString() : now;

  return `    <video:video>
      <video:thumbnail_loc>${escapeXml(thumbnailUrl)}</video:thumbnail_loc>
      <video:title>${escapeXml(video.title)}</video:title>
      <video:description>${escapeXml(video.description || video.title)}</video:description>
      <video:content_loc>${escapeXml(contentUrl)}</video:content_loc>
      <video:player_loc allow_embed="yes">${escapeXml(playerUrl)}</video:player_loc>
      <video:publication_date>${publicationDate}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:requires_subscription>no</video:requires_subscription>
      <video:uploader info="${escapeXml(baseUrl)}">TheBulletinBriefs</video:uploader>
      <video:live>no</video:live>${video.category && video.category !== 'all' ? `
      <video:tag>${escapeXml(video.category)}</video:tag>` : ''}
    </video:video>`;
}).filter(Boolean).join('\n')}
  </url>
</urlset>`;

    console.log('✅ Videos sitemap generated successfully');

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate');
    res.status(200).send(sitemapXml);

  } catch (error) {
    console.error('❌ Error generating videos sitemap:', error);
    res.status(500).json({ error: error.message });
  }
}
