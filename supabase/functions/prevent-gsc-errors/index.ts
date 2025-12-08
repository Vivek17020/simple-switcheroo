import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('🔍 Starting proactive GSC error prevention scan...');

    const baseUrl = "https://www.thebulletinbriefs.in";
    let preventedErrors = 0;
    let indexingRequested = 0;

    // Fetch all published articles
    const { data: articles, error: articlesError } = await supabaseClient
      .from("articles")
      .select("id, slug, title, canonical_url, published_at")
      .eq("published", true);

    if (articlesError) throw articlesError;

    for (const article of articles || []) {
      const articleUrl = `${baseUrl}/article/${article.slug}`;
      
      // 1. PREVENT "Page with redirect" errors
      // Ensure no redirect chains by checking the actual URL
      try {
        const response = await fetch(articleUrl, { 
          method: 'HEAD',
          redirect: 'manual'
        });
        
        if (response.status >= 300 && response.status < 400) {
          console.log(`⚠️ Redirect detected for ${article.slug}, logging for manual review`);
          
          await supabaseClient.from('seo_health_log').insert({
            url: articleUrl,
            issue_type: 'page_with_redirect',
            severity: 'warning',
            notes: `Page redirects (${response.status}). Update internal links to point to final URL.`,
            article_id: article.id,
            status: 'open'
          });
        }
      } catch (error) {
        console.error(`Failed to check redirect for ${article.slug}:`, error);
      }

      // 2. PREVENT "Duplicate without user-selected canonical" errors
      if (!article.canonical_url || article.canonical_url !== articleUrl) {
        await supabaseClient
          .from('articles')
          .update({ canonical_url: articleUrl })
          .eq('id', article.id);
        
        preventedErrors++;
        console.log(`✅ Fixed canonical for ${article.slug}`);
      }

      // 3. PREVENT "Discovered - currently not indexed" errors
      // Request indexing for articles published in the last 48 hours
      const hoursSincePublish = (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60 * 60);
      
      if (hoursSincePublish <= 48) {
        await requestGoogleIndexing(articleUrl);
        indexingRequested++;
        console.log(`📤 Indexing requested for recent article: ${article.slug}`);
      }
    }

    // 4. Check for and fix soft 404s
    const { data: recentSoft404s } = await supabaseClient
      .from('seo_health_log')
      .select('article_id, url')
      .eq('issue_type', 'soft_404')
      .eq('status', 'open')
      .limit(10);

    for (const issue of recentSoft404s || []) {
      // Re-request indexing after content has been fixed
      await requestGoogleIndexing(issue.url);
      console.log(`🔄 Re-indexing requested for fixed soft 404: ${issue.url}`);
    }

    console.log(`✅ GSC prevention complete. Fixed: ${preventedErrors}, Indexing requests: ${indexingRequested}`);

    return new Response(JSON.stringify({
      success: true,
      preventedErrors,
      indexingRequested,
      message: 'GSC error prevention scan completed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('GSC prevention error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to complete GSC prevention scan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function requestGoogleIndexing(url: string): Promise<void> {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: gscConfig } = await supabaseClient
      .from('gsc_config')
      .select('access_token, token_expires_at, client_id, client_secret, refresh_token')
      .eq('is_active', true)
      .single();

    if (!gscConfig) {
      console.log('GSC not configured');
      return;
    }

    let accessToken = gscConfig.access_token;
    if (new Date(gscConfig.token_expires_at) <= new Date()) {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: gscConfig.client_id,
          client_secret: gscConfig.client_secret,
          refresh_token: gscConfig.refresh_token,
          grant_type: 'refresh_token'
        })
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        accessToken = tokenData.access_token;
      }
    }

    const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        type: 'URL_UPDATED'
      })
    });

    if (!response.ok) {
      console.error(`Failed to request indexing: ${await response.text()}`);
    }
  } catch (error) {
    console.error(`Indexing request error:`, error);
  }
}
