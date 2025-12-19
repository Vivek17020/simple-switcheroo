import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

interface RegenerateSitemapRequest {
  articleId?: string;
  sitemapType: 'web3' | 'upsc' | 'main' | 'tools' | 'webstories' | 'all';
  submitToGSC?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleId, sitemapType = 'all', submitToGSC = true }: RegenerateSitemapRequest = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`🔄 Regenerating sitemap(s): ${sitemapType}`, { articleId });

    const sitemapsToRegenerate: string[] = [];
    
    if (sitemapType === 'all') {
      sitemapsToRegenerate.push('web3', 'upsc', 'main', 'tools', 'webstories');
    } else {
      sitemapsToRegenerate.push(sitemapType);
    }

    const results: any[] = [];

    // Regenerate each sitemap by calling the respective edge functions
    for (const type of sitemapsToRegenerate) {
      try {
        let endpoint = '';
        
        switch (type) {
          case 'web3':
            endpoint = `${supabaseUrl}/functions/v1/web3-sitemap`;
            break;
          case 'upsc':
            // UPSC sitemap is served via Vercel API route
            endpoint = 'https://www.thebulletinbriefs.in/api/upsc-sitemap.xml';
            break;
          case 'webstories':
            endpoint = `${supabaseUrl}/functions/v1/web-stories-sitemap`;
            break;
          case 'tools':
            endpoint = `${supabaseUrl}/functions/v1/tools-sitemap`;
            break;
          case 'main':
            endpoint = `${supabaseUrl}/functions/v1/sitemap`;
            break;
        }

        if (endpoint) {
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            console.log(`✅ ${type} sitemap regenerated successfully`);
            results.push({ type, status: 'success' });
          } else {
            console.warn(`⚠️ ${type} sitemap regeneration failed:`, response.status);
            results.push({ type, status: 'failed', error: response.statusText });
          }
        }
      } catch (error) {
        console.error(`❌ Error regenerating ${type} sitemap:`, error);
        results.push({ type, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    // Submit to Google Search Console if requested
    if (submitToGSC) {
      try {
        console.log('📤 Submitting sitemaps to Google Search Console...');

        const baseUrl = 'https://www.thebulletinbriefs.in';
        
        // Primary: Submit sitemap index (contains all sitemaps)
        const sitemapIndexUrl = `${baseUrl}/sitemap-index.xml`;
        
        // Also submit individual sitemaps for redundancy
        const sitemapUrls = [
          sitemapIndexUrl, // Sitemap index first (most important)
          `${baseUrl}/sitemap.xml`,
          `${baseUrl}/web3-sitemap.xml`,
          `${baseUrl}/upsc-sitemap.xml`, // Added UPSC sitemap
          `${baseUrl}/sitemap-tools.xml`,
          `${baseUrl}/news-sitemap.xml`,
          `${baseUrl}/web-stories-sitemap.xml`,
          `${baseUrl}/videos-sitemap.xml`
        ];

        // Ping Google to reindex sitemaps
        for (const sitemapUrl of sitemapUrls) {
          try {
            const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
            await fetch(pingUrl);
            console.log(`✅ Pinged Google for: ${sitemapUrl}`);
          } catch (pingError) {
            console.warn(`⚠️ Failed to ping Google for ${sitemapUrl}:`, pingError);
          }
        }

        // Also ping Bing
        for (const sitemapUrl of sitemapUrls) {
          try {
            const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
            await fetch(bingPingUrl);
            console.log(`✅ Pinged Bing for: ${sitemapUrl}`);
          } catch (pingError) {
            console.warn(`⚠️ Failed to ping Bing for ${sitemapUrl}:`, pingError);
          }
        }

        results.push({ 
          type: 'search_engine_notification', 
          status: 'success',
          message: 'Sitemaps submitted to Google and Bing'
        });
      } catch (gscError) {
        console.error('❌ Error submitting to search engines:', gscError);
        results.push({ 
          type: 'search_engine_notification', 
          status: 'failed', 
          error: gscError instanceof Error ? gscError.message : 'Unknown error'
        });
      }
    }

    // If specific article, also trigger indexing for that article
    if (articleId && submitToGSC) {
      try {
        await supabase.functions.invoke('google-index-now', {
          body: {
            articleId,
            pageType: 'article',
            action: 'update'
          }
        });
        console.log(`✅ Triggered indexing for article: ${articleId}`);
        results.push({ type: 'article_indexing', status: 'success', articleId });
      } catch (indexError) {
        console.warn(`⚠️ Failed to trigger article indexing:`, indexError);
        results.push({ type: 'article_indexing', status: 'failed', error: indexError instanceof Error ? indexError.message : 'Unknown error' });
      }
    }

    console.log('✅ Sitemap regeneration complete');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sitemaps regenerated and submitted',
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in regenerate-sitemap:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
