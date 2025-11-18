import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BASE_URL = 'https://www.thebulletinbriefs.in';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting bulk indexing of all pages...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Collect all URLs to index
    const allUrls: string[] = [];

    // 1. Homepage and main pages
    allUrls.push(`${BASE_URL}`);
    allUrls.push(`${BASE_URL}/news`);
    allUrls.push(`${BASE_URL}/about`);
    allUrls.push(`${BASE_URL}/contact`);
    allUrls.push(`${BASE_URL}/subscription`);
    allUrls.push(`${BASE_URL}/editorial-guidelines`);

    // 2. All published articles
    const { data: articles } = await supabaseClient
      .from("articles")
      .select("slug")
      .eq("published", true)
      .order("published_at", { ascending: false });

    if (articles) {
      articles.forEach(article => {
        allUrls.push(`${BASE_URL}/article/${article.slug}`);
      });
      console.log(`Found ${articles.length} published articles`);
    }

    // 3. All categories
    const { data: categories } = await supabaseClient
      .from("categories")
      .select("slug, parent_id");

    if (categories) {
      categories.forEach((category: any) => {
        if (category.parent_id) {
          // Subcategory - needs parent slug
          const parent = categories.find((c: any) => c.id === category.parent_id);
          if (parent) {
            allUrls.push(`${BASE_URL}/${parent.slug}/${category.slug}`);
          }
        } else {
          // Parent category
          allUrls.push(`${BASE_URL}/category/${category.slug}`);
        }
      });
      console.log(`Found ${categories.length} categories`);
    }

    // 4. Jobs/Exam pages
    allUrls.push(`${BASE_URL}/government-exams`);
    allUrls.push(`${BASE_URL}/admit-cards`);
    allUrls.push(`${BASE_URL}/jobs/previous-year-papers`);

    // 5. Sitemaps
    allUrls.push(`${BASE_URL}/sitemap.xml`);
    allUrls.push(`${BASE_URL}/news-sitemap.xml`);

    console.log(`Total URLs to index: ${allUrls.length}`);

    const results = {
      total: allUrls.length,
      googlePing: false,
      bingPing: false,
      indexNow: false,
      indexNowBatches: 0
    };

    // Run in background
    const backgroundTask = async () => {
      // 1. Ping Google sitemap
      try {
        const googleResponse = await fetch(
          `https://www.google.com/ping?sitemap=${encodeURIComponent(BASE_URL + '/sitemap.xml')}`
        );
        results.googlePing = googleResponse.ok;
        console.log(`Google sitemap ping: ${results.googlePing ? 'Success' : 'Failed'}`);
      } catch (error) {
        console.error('Google ping error:', error);
      }

      // 2. Ping Bing sitemap
      try {
        const bingResponse = await fetch(
          `https://www.bing.com/ping?sitemap=${encodeURIComponent(BASE_URL + '/sitemap.xml')}`
        );
        results.bingPing = bingResponse.ok;
        console.log(`Bing sitemap ping: ${results.bingPing ? 'Success' : 'Failed'}`);
      } catch (error) {
        console.error('Bing ping error:', error);
      }

      // 3. Submit to IndexNow in batches (max 10,000 URLs per request)
      const batchSize = 10000;
      for (let i = 0; i < allUrls.length; i += batchSize) {
        const batch = allUrls.slice(i, i + batchSize);
        
        try {
          const response = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              host: 'thebulletinbriefs.in',
              key: 'e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0',
              keyLocation: `${BASE_URL}/e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0.txt`,
              urlList: batch
            })
          });

          if (response.ok || response.status === 200) {
            results.indexNowBatches++;
            results.indexNow = true;
            console.log(`IndexNow batch ${results.indexNowBatches} submitted: ${batch.length} URLs`);
          }
          
          // Rate limiting - wait between batches
          if (i + batchSize < allUrls.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`IndexNow batch error:`, error);
        }
      }

      // Log completion
      await supabaseClient
        .from('seo_automation_logs')
        .insert({
          action_type: 'bulk_indexing',
          service_name: 'all',
          status: 'success',
          retry_count: 0,
          error_message: JSON.stringify(results)
        });

      console.log('Bulk indexing complete:', results);
    };

    // @ts-ignore
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(backgroundTask());
    } else {
      backgroundTask().catch(err => console.error('Background task error:', err));
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Bulk indexing started for ${allUrls.length} URLs`,
        stats: {
          totalUrls: allUrls.length,
          articles: articles?.length || 0,
          categories: categories?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Bulk indexing error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to start bulk indexing' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
