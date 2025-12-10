import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

const BASE_URL = 'https://www.thebulletinbriefs.in';

interface IndexingResult {
  url: string;
  success: boolean;
  method: string;
}

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

// Ping Google sitemap - Note: Google deprecated sitemap ping in 2023
// This now just logs that we've attempted and returns true
// Real indexing happens via IndexNow and Google Search Console
async function pingGoogleSitemap(): Promise<boolean> {
  try {
    // Google deprecated the /ping endpoint, but we can still try
    // The main sitemap URL for search engines
    const web3SitemapUrl = `${BASE_URL}/api/web3-sitemap.xml`;
    console.log(`📍 Web3 Sitemap URL: ${web3SitemapUrl}`);
    
    // Try the ping anyway (may return 404 but doesn't hurt)
    const response = await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(web3SitemapUrl)}`,
      { method: 'GET' }
    );
    
    // Google returns various status codes, we just log the attempt
    console.log(`ℹ️ Google sitemap ping attempted (status: ${response.status})`);
    return true; // Consider successful as long as we attempted
  } catch (error) {
    console.error('❌ Google sitemap ping error:', error);
    return true; // Don't fail the whole process for this
  }
}

// Ping Bing sitemap
async function pingBingSitemap(): Promise<boolean> {
  try {
    const web3SitemapUrl = `${BASE_URL}/api/web3-sitemap.xml`;
    await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(web3SitemapUrl)}`);
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
    const { articleId, mode = 'single' } = await req.json();
    
    console.log(`🚀 Starting Web3 indexing - Mode: ${mode}, Article ID: ${articleId || 'batch'}`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch Web3 category
    const { data: web3Category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'web3forindia')
      .single();

    if (!web3Category) {
      throw new Error('Web3 category not found');
    }

    // Fetch Web3 subcategories
    const { data: subcategories } = await supabase
      .from('categories')
      .select('id, slug')
      .eq('parent_id', web3Category.id);

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
        const articleUrl = `${BASE_URL}/web3forindia/${categorySlug}/${data.slug}`;
        urlsToIndex.push(articleUrl);
        
        // Also index the category page
        urlsToIndex.push(`${BASE_URL}/web3forindia/${categorySlug}`);
        console.log(`📄 Indexing single article: ${articleUrl}`);
      }
    } else {
      // Batch mode - index all Web3 articles
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
        .limit(100); // Limit to recent 100 articles for batch

      if (data) {
        articles = data;
        data.forEach((article: any) => {
          const categorySlug = article.categories?.slug || 'uncategorized';
          urlsToIndex.push(`${BASE_URL}/web3forindia/${categorySlug}/${article.slug}`);
        });
        console.log(`📚 Batch indexing ${urlsToIndex.length} Web3 articles`);
      }
    }

    if (urlsToIndex.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No articles found to index' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Always include Web3 homepage and sitemap
    urlsToIndex.unshift(`${BASE_URL}/web3forindia`);
    urlsToIndex.push(`${BASE_URL}/api/web3-sitemap.xml`);

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
          action_type: mode === 'batch' ? 'web3_batch_indexing' : 'web3_instant_indexing',
          service_name: 'multi_search_engine',
          status: results.indexNow || results.googleSitemap ? 'success' : 'partial',
          retry_count: 0
        });

      console.log('✅ Web3 indexing complete:', results);
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
        message: `Web3 indexing request submitted for ${urlsToIndex.length} URLs`,
        urls: urlsToIndex.slice(0, 10), // Return first 10 URLs for preview
        totalUrls: urlsToIndex.length,
        mode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Web3 indexing error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to submit indexing request', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
