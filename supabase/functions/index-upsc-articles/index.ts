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
      console.log(`✅ IndexNow submitted ${urls.length} UPSC URL(s)`);
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
    const upscSitemapUrl = `${BASE_URL}/upsc-sitemap.xml`;
    console.log(`📍 UPSC Sitemap URL: ${upscSitemapUrl}`);
    
    const response = await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(upscSitemapUrl)}`,
      { method: 'GET' }
    );
    
    console.log(`ℹ️ Google sitemap ping attempted (status: ${response.status})`);
    return true;
  } catch (error) {
    console.error('❌ Google sitemap ping error:', error);
    return true;
  }
}

// Ping Bing sitemap
async function pingBingSitemap(): Promise<boolean> {
  try {
    const upscSitemapUrl = `${BASE_URL}/upsc-sitemap.xml`;
    await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(upscSitemapUrl)}`);
    console.log('✅ Bing sitemap pinged for UPSC');
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
    const { articleId, mode = 'single' } = await req.json();
    
    console.log(`🚀 Starting UPSC indexing - Mode: ${mode}, Article ID: ${articleId || 'batch'}`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch UPSC parent category
    const { data: upscCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'upscbriefs')
      .single();

    if (!upscCategory) {
      throw new Error('UPSC category not found');
    }

    // Fetch UPSC subcategories
    const { data: subcategories } = await supabase
      .from('categories')
      .select('id, slug')
      .eq('parent_id', upscCategory.id);

    const subcatIds = subcategories?.map((s) => s.id) || [];

    let articles: any[] = [];
    let urlsToIndex: string[] = [];

    if (mode === 'single' && articleId) {
      // Index single article
      const { data } = await supabase
        .from('articles')
        .select(`
          slug,
          category_id,
          categories:category_id(slug)
        `)
        .eq('id', articleId)
        .eq('published', true)
        .single();

      if (data) {
        articles = [data];
        const categorySlug = (data.categories as any)?.slug || 'uncategorized';
        const articleUrl = `${BASE_URL}/upscbriefs/${categorySlug}/${data.slug}`;
        urlsToIndex.push(articleUrl);
        
        // Also index the category page
        urlsToIndex.push(`${BASE_URL}/upscbriefs/${categorySlug}`);
        console.log(`📄 Indexing single UPSC article: ${articleUrl}`);
      }
    } else {
      // Batch mode - index all UPSC articles
      const { data } = await supabase
        .from('articles')
        .select(`
          slug,
          category_id,
          categories:category_id(slug)
        `)
        .in('category_id', subcatIds)
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(100);

      if (data) {
        articles = data;
        data.forEach((article: any) => {
          const categorySlug = article.categories?.slug || 'uncategorized';
          urlsToIndex.push(`${BASE_URL}/upscbriefs/${categorySlug}/${article.slug}`);
        });
        console.log(`📚 Batch indexing ${urlsToIndex.length} UPSC articles`);
      }
    }

    if (urlsToIndex.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No UPSC articles found to index' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Always include UPSC homepage and sitemap
    urlsToIndex.unshift(`${BASE_URL}/upscbriefs`);
    urlsToIndex.push(`${BASE_URL}/upsc-sitemap.xml`);

    const results: {
      indexNow: boolean;
      googleSitemap: boolean;
      bingSitemap: boolean;
      sitemapIndex: boolean;
      urlsSubmitted: number;
    } = {
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
          article_id: articleId || null,
          action_type: mode === 'batch' ? 'upsc_batch_indexing' : 'upsc_instant_indexing',
          service_name: 'multi_search_engine',
          status: results.indexNow || results.googleSitemap ? 'success' : 'partial',
          retry_count: 0
        });

      console.log('✅ UPSC indexing complete:', results);
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
        message: `UPSC indexing request submitted for ${urlsToIndex.length} URLs`,
        urls: urlsToIndex.slice(0, 10),
        totalUrls: urlsToIndex.length,
        mode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ UPSC indexing error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to submit indexing request', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});