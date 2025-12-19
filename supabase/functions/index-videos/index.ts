import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

const BASE_URL = 'https://www.thebulletinbriefs.in';

// Submit to IndexNow (Bing, Yandex, etc.)
async function submitToIndexNow(urls: string[]): Promise<boolean> {
  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'thebulletinbriefs.in',
        key: 'e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0',
        keyLocation: `${BASE_URL}/e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0.txt`,
        urlList: urls
      })
    });

    if (response.ok || response.status === 200) {
      console.log(`✅ IndexNow submitted ${urls.length} URL(s)`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ IndexNow error:', error);
    return false;
  }
}

// Ping Google sitemap
async function pingGoogleSitemap(): Promise<boolean> {
  try {
    const videosSitemapUrl = `${BASE_URL}/api/videos-sitemap.xml`;
    const response = await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(videosSitemapUrl)}`
    );
    console.log(`✅ Google sitemap ping: ${response.ok ? 'Success' : 'Failed'}`);
    return response.ok;
  } catch (error) {
    console.error('❌ Google sitemap ping error:', error);
    return false;
  }
}

// Ping Bing sitemap
async function pingBingSitemap(): Promise<boolean> {
  try {
    const videosSitemapUrl = `${BASE_URL}/api/videos-sitemap.xml`;
    await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(videosSitemapUrl)}`);
    console.log('✅ Bing sitemap pinged');
    return true;
  } catch (error) {
    console.error('❌ Bing sitemap ping error:', error);
    return false;
  }
}

// Ping sitemap index (unified sitemap for all content)
async function pingSitemapIndex(): Promise<boolean> {
  try {
    const sitemapIndexUrl = `${BASE_URL}/sitemap-index.xml`;
    await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapIndexUrl)}`);
    await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapIndexUrl)}`);
    console.log('✅ Sitemap index pinged (Google + Bing)');
    return true;
  } catch (error) {
    console.error('❌ Sitemap index ping error:', error);
    return false;
  }
}

// Submit video URL to YouTube for indexing (if video is hosted on their channel)
async function notifyYouTube(videoUrl: string): Promise<boolean> {
  try {
    // Extract video ID from YouTube URL
    const videoIdMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (videoIdMatch && videoIdMatch[1]) {
      console.log(`📺 YouTube video ID detected: ${videoIdMatch[1]}`);
      // YouTube automatically handles indexing for their videos
      // We just log this for awareness
    }
    return true;
  } catch (error) {
    console.error('❌ YouTube notification error:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId, mode = 'single' } = await req.json();
    
    console.log(`🚀 Starting Video indexing - Mode: ${mode}, Video ID: ${videoId || 'batch'}`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let videos: any[] = [];
    let urlsToIndex: string[] = [];

    if (mode === 'single' && videoId) {
      // Index single video
      const { data } = await supabase
        .from('homepage_videos')
        .select('id, title, youtube_url, category')
        .eq('id', videoId)
        .eq('is_active', true)
        .single();

      if (data) {
        videos = [data];
        // Notify YouTube about the video
        await notifyYouTube(data.youtube_url);
        console.log(`📄 Indexing single video: ${data.title}`);
      }
    } else {
      // Batch mode - index all active videos
      const { data } = await supabase
        .from('homepage_videos')
        .select('id, title, youtube_url, category')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(100); // Limit to recent 100 videos for batch

      if (data) {
        videos = data;
        // Notify YouTube about each video
        for (const video of data) {
          await notifyYouTube(video.youtube_url);
        }
        console.log(`📚 Batch indexing ${data.length} videos`);
      }
    }

    // Always include homepage (where videos are displayed) and sitemap
    urlsToIndex.push(`${BASE_URL}/`); // Homepage with videos section
    urlsToIndex.push(`${BASE_URL}/api/videos-sitemap.xml`);

    // If there are category-specific video pages, add them
    const uniqueCategories = [...new Set(videos.map(v => v.category))];
    uniqueCategories.forEach(category => {
      if (category && category !== 'all') {
        // Add category-specific pages if they exist
        urlsToIndex.push(`${BASE_URL}/?category=${category}`);
      }
    });

    if (urlsToIndex.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No videos found to index' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      indexNow: false,
      googleSitemap: false,
      bingSitemap: false,
      sitemapIndex: false,
      youtubeNotified: videos.length,
      urlsSubmitted: urlsToIndex.length
    };

    // Run indexing tasks in background
    const backgroundTask = async () => {
      // 1. Submit to IndexNow (Bing, Yandex) - batch submission
      results.indexNow = await submitToIndexNow(urlsToIndex);

      // 2. Ping Google sitemap
      results.googleSitemap = await pingGoogleSitemap();

      // 3. Ping Bing sitemap
      results.bingSitemap = await pingBingSitemap();

      // 4. Ping unified sitemap index
      results.sitemapIndex = await pingSitemapIndex();

      // 5. Log the indexing attempt
      await supabase
        .from('seo_automation_logs')
        .insert({
          article_id: videoId || null,
          action_type: mode === 'batch' ? 'video_batch_indexing' : 'video_instant_indexing',
          service_name: 'multi_search_engine',
          status: results.indexNow || results.googleSitemap ? 'success' : 'partial',
          retry_count: 0
        });

      console.log('✅ Video indexing complete:', results);
    };

    // Use EdgeRuntime.waitUntil for proper background task handling
    // @ts-ignore
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(backgroundTask());
    } else {
      backgroundTask().catch(err => console.error('❌ Background task error:', err));
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Video indexing request submitted for ${videos.length} video(s)`,
        urls: urlsToIndex,
        videosProcessed: videos.length,
        mode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Video indexing error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to submit indexing request', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
