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
    const webStoriesSitemapUrl = `${BASE_URL}/api/web-stories-sitemap.xml`;
    const response = await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(webStoriesSitemapUrl)}`
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
    const webStoriesSitemapUrl = `${BASE_URL}/api/web-stories-sitemap.xml`;
    await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(webStoriesSitemapUrl)}`);
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storyId, mode = 'single' } = await req.json();
    
    console.log(`🚀 Starting Web Story indexing - Mode: ${mode}, Story ID: ${storyId || 'batch'}`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let stories: any[] = [];
    let urlsToIndex: string[] = [];

    if (mode === 'single' && storyId) {
      // Index single web story
      const { data } = await supabase
        .from('web_stories')
        .select('slug, category')
        .eq('id', storyId)
        .eq('status', 'published')
        .single();

      if (data) {
        stories = [data];
        // Use AMP story URL for proper Google indexing
        const storyUrl = `${BASE_URL}/amp-story/${(data.category || 'general').toLowerCase()}/${data.slug}`;
        urlsToIndex.push(storyUrl);
        
        // Also index the category page and web stories homepage
        urlsToIndex.push(`${BASE_URL}/web-stories`);
        console.log(`📄 Indexing single AMP web story: ${storyUrl}`);
      }
    } else {
      // Batch mode - index all published web stories
      const { data } = await supabase
        .from('web_stories')
        .select('slug, category')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(100); // Limit to recent 100 stories for batch

      if (data) {
        stories = data;
        data.forEach((story: any) => {
          // Use AMP story URL for proper Google indexing
          urlsToIndex.push(`${BASE_URL}/amp-story/${(story.category || 'general').toLowerCase()}/${story.slug}`);
        });
        console.log(`📚 Batch indexing ${urlsToIndex.length} AMP web stories`);
      }
    }

    if (urlsToIndex.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No web stories found to index' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Always include web stories homepage and sitemap
    urlsToIndex.unshift(`${BASE_URL}/web-stories`);
    urlsToIndex.push(`${BASE_URL}/api/web-stories-sitemap.xml`);

    const results = {
      indexNow: false,
      googleSitemap: false,
      bingSitemap: false,
      sitemapIndex: false,
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
          article_id: storyId || null,
          action_type: mode === 'batch' ? 'webstory_batch_indexing' : 'webstory_instant_indexing',
          service_name: 'multi_search_engine',
          status: results.indexNow || results.googleSitemap ? 'success' : 'partial',
          retry_count: 0
        });

      console.log('✅ Web Story indexing complete:', results);
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
        message: `Web Story indexing request submitted for ${urlsToIndex.length} URLs`,
        urls: urlsToIndex.slice(0, 10), // Return first 10 URLs for preview
        totalUrls: urlsToIndex.length,
        mode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Web Story indexing error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to submit indexing request', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
