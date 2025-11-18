import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

// Helper function to retry with exponential backoff
async function retryWithBackoff(
  fn: () => Promise<Response>,
  serviceName: string,
  maxRetries = MAX_RETRIES
): Promise<{ success: boolean; retries: number; error?: string }> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fn();
      if (response.ok || response.status === 200) {
        console.log(`${serviceName} ping successful on attempt ${attempt + 1}`);
        return { success: true, retries: attempt };
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err as Error;
      console.error(`${serviceName} ping failed (attempt ${attempt + 1}):`, err);
    }
    
    if (attempt < maxRetries) {
      const delay = BASE_DELAY * Math.pow(2, attempt);
      console.log(`Retrying ${serviceName} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { 
    success: false, 
    retries: maxRetries, 
    error: lastError?.message || 'Unknown error' 
  };
}

// Helper function to log to database
async function logPing(
  supabaseClient: any,
  articleId: string,
  serviceName: string,
  actionType: string,
  status: 'success' | 'failed',
  retryCount: number,
  errorMessage?: string
) {
  try {
    await supabaseClient
      .from('seo_automation_logs')
      .insert({
        article_id: articleId,
        action_type: actionType,
        service_name: serviceName,
        status,
        retry_count: retryCount,
        error_message: errorMessage || null,
      });
  } catch (err) {
    console.error('Failed to log ping:', err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleId, isUpdate } = await req.json();
    
    console.log(`Starting search engine notification for article ${articleId} (${isUpdate ? 'UPDATE' : 'NEW PUBLISH'})`);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Fetch the article
    const { data: article, error } = await supabaseClient
      .from("articles")
      .select("slug")
      .eq("id", articleId)
      .eq("published", true)
      .single();

    if (error || !article) {
      console.error('Article not found:', error);
      throw new Error('Article not found');
    }

    const baseUrl = "https://thebulletinbriefs.in";
    const articleUrl = `${baseUrl}/article/${article.slug}`;
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    const newsSitemapUrl = `${baseUrl}/news-sitemap.xml`;

    // Run all pings in background (don't block response)
    const backgroundTask = async () => {
      console.log(`Background task started for article ${articleId}`);
      const results = {
        google: false,
        googleNews: false,
        bing: false,
        yandex: false,
        indexnow: false,
      };

      // 1. Ping Google's main sitemap
      const googleResult = await retryWithBackoff(
        () => fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`),
        'Google Sitemap'
      );
      results.google = googleResult.success;
      await logPing(
        supabaseClient,
        articleId,
        'google',
        'sitemap_ping',
        googleResult.success ? 'success' : 'failed',
        googleResult.retries,
        googleResult.error
      );

      // 2. Ping Google News sitemap
      const googleNewsResult = await retryWithBackoff(
        () => fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(newsSitemapUrl)}`),
        'Google News Sitemap'
      );
      results.googleNews = googleNewsResult.success;
      await logPing(
        supabaseClient,
        articleId,
        'google',
        'news_sitemap_ping',
        googleNewsResult.success ? 'success' : 'failed',
        googleNewsResult.retries,
        googleNewsResult.error
      );

      // 3. Submit to IndexNow (Bing, Yandex, etc.)
      const indexnowResult = await retryWithBackoff(
        () => fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: 'thebulletinbriefs.in',
            key: 'e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0',
            keyLocation: `${baseUrl}/e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0.txt`,
            urlList: [articleUrl]
          })
        }),
        'IndexNow'
      );
      results.indexnow = indexnowResult.success;
      await logPing(
        supabaseClient,
        articleId,
        'indexnow',
        'url_submit',
        indexnowResult.success ? 'success' : 'failed',
        indexnowResult.retries,
        indexnowResult.error
      );

      // 4. Ping Bing directly
      const bingResult = await retryWithBackoff(
        () => fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`),
        'Bing'
      );
      results.bing = bingResult.success;
      await logPing(
        supabaseClient,
        articleId,
        'bing',
        'sitemap_ping',
        bingResult.success ? 'success' : 'failed',
        bingResult.retries,
        bingResult.error
      );

      // 5. Ping Yandex
      const yandexResult = await retryWithBackoff(
        () => fetch(`https://yandex.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`),
        'Yandex'
      );
      results.yandex = yandexResult.success;
      await logPing(
        supabaseClient,
        articleId,
        'yandex',
        'sitemap_ping',
        yandexResult.success ? 'success' : 'failed',
        yandexResult.retries,
        yandexResult.error
      );

      console.log('All pings completed:', results);
    };

    // Use EdgeRuntime.waitUntil for proper background task handling
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(backgroundTask());
    } else {
      // Fallback for local development
      backgroundTask().catch(err => {
        console.error('Background task error:', err);
      });
    }

    // Return immediate response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Search engine notifications started for ${isUpdate ? 'updated' : 'new'} article`,
        articleUrl,
        isUpdate 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Notify search engines error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to notify search engines' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
