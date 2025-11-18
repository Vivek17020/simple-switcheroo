import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebStory {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  featured_image: string;
  published_at: string;
  updated_at: string;
  slides: Array<{ image: string; text: string }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📰 Generating web stories sitemap...');

    // Fetch all published web stories
    const { data: stories, error } = await supabase
      .from('web_stories')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching web stories:', error);
      throw error;
    }

    console.log(`✅ Found ${stories?.length || 0} published web stories`);

    const baseUrl = 'https://www.thebulletinbriefs.in';
    const now = new Date().toISOString();

    // Generate XML sitemap for web stories
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${(stories as WebStory[] || []).map(story => {
  const categorySlug = story.category.toLowerCase();
  const storyUrl = `${baseUrl}/webstories/${categorySlug}/${story.slug}`;
  const publishDate = new Date(story.published_at).toISOString();
  
  // Get all images from slides
  const images = story.slides
    .filter((slide: any) => slide.image)
    .map((slide: any) => `    <image:image>
      <image:loc>${slide.image}</image:loc>
      <image:title>${escapeXml(slide.text || story.title)}</image:title>
    </image:image>`
    ).join('\n');

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
${images}
  </url>`;
}).join('\n')}
</urlset>`;

    console.log('✅ Web stories sitemap generated successfully');

    return new Response(sitemapXml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error: any) {
    console.error('❌ Error generating web stories sitemap:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
