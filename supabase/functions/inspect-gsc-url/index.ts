import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GSC_API_URL = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';
const GSC_INDEXING_API_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, triggerBatch } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Fetch GSC configuration
    const { data: gscConfig, error: configError } = await supabaseClient
      .from('gsc_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !gscConfig) {
      console.log('GSC API not configured. Skipping external verification.');
      return new Response(JSON.stringify({ 
        success: true,
        message: 'GSC API not configured',
        inspected: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Refresh access token if expired
    let accessToken = gscConfig.access_token;
    if (new Date(gscConfig.token_expires_at) <= new Date()) {
      accessToken = await refreshAccessToken(supabaseClient, gscConfig);
    }

    let urlsToInspect: any[] = [];

    if (triggerBatch) {
      // Fetch URLs that passed internal verification but haven't been GSC verified
      const { data: verifications, error: fetchError } = await supabaseClient
        .from('seo_autofix_verification')
        .select('url, id, issue_type')
        .eq('internal_status', 'passed')
        .in('gsc_status', ['pending', 'not_indexed'])
        .lt('retry_count', 3)
        .order('fix_applied_at', { ascending: true })
        .limit(20);

      if (fetchError) throw fetchError;
      urlsToInspect = verifications || [];
    } else if (url) {
      urlsToInspect = [{ url, id: null, issue_type: 'manual' }];
    }

    if (urlsToInspect.length === 0) {
      return new Response(JSON.stringify({ 
        success: true,
        message: 'No URLs to inspect',
        inspected: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Inspecting ${urlsToInspect.length} URLs with GSC API...`);
    let indexedCount = 0;
    let notIndexedCount = 0;

    for (const item of urlsToInspect) {
      try {
        // Call GSC URL Inspection API
        const inspectionResponse = await fetch(GSC_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inspectionUrl: item.url,
            siteUrl: gscConfig.site_url
          })
        });

        if (!inspectionResponse.ok) {
          const errorText = await inspectionResponse.text();
          console.error(`GSC API error for ${item.url}:`, errorText);
          
          // Update retry count
          if (item.id) {
            await supabaseClient
              .from('seo_autofix_verification')
              .update({ 
                retry_count: supabaseClient.rpc('increment', { x: 1 }),
                last_error: `GSC API error: ${inspectionResponse.status}`
              })
              .eq('id', item.id);
          }
          continue;
        }

        const result = await inspectionResponse.json();
        const indexStatus = result.inspectionResult?.indexStatusResult;

        let gscStatus = 'not_indexed';
        let recheckNotes = 'GSC inspection completed';

        if (indexStatus) {
          const verdict = indexStatus.verdict;
          const coverageState = indexStatus.coverageState;

          if (verdict === 'PASS' || coverageState === 'Submitted and indexed') {
            gscStatus = 'indexed';
            indexedCount++;
            recheckNotes = `GSC Verdict: ${verdict}. Coverage: ${coverageState}`;
          } else {
            notIndexedCount++;
            recheckNotes = `GSC Verdict: ${verdict || 'N/A'}. Coverage: ${coverageState || 'N/A'}`;
            
            // Trigger reindexing request for not indexed URLs
            if (item.issue_type !== 'manual') {
              await requestIndexing(accessToken, item.url);
            }
          }
        }

        // Update verification record
        if (item.id) {
          await supabaseClient
            .from('seo_autofix_verification')
            .update({
              gsc_status: gscStatus,
              recheck_notes: recheckNotes,
              rechecked_at: new Date().toISOString(),
              retry_count: supabaseClient.rpc('increment', { x: 1 })
            })
            .eq('id', item.id);
        }

      } catch (error) {
        console.error(`Failed to inspect ${item.url}:`, error);
        
        if (item.id) {
          await supabaseClient
            .from('seo_autofix_verification')
            .update({ 
              last_error: error instanceof Error ? error.message : 'Unknown error',
              retry_count: supabaseClient.rpc('increment', { x: 1 })
            })
            .eq('id', item.id);
        }
      }

      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`GSC inspection complete. Indexed: ${indexedCount}, Not indexed: ${notIndexedCount}`);

    return new Response(JSON.stringify({
      success: true,
      inspected: urlsToInspect.length,
      indexed: indexedCount,
      not_indexed: notIndexedCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('GSC inspection error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to inspect URLs with GSC',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function refreshAccessToken(supabaseClient: any, config: any): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.client_id,
      client_secret: config.client_secret,
      refresh_token: config.refresh_token,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to refresh GSC access token');
  }

  const data = await response.json();
  const newAccessToken = data.access_token;
  const expiresIn = data.expires_in || 3600;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  // Update stored token
  await supabaseClient
    .from('gsc_config')
    .update({ 
      access_token: newAccessToken,
      token_expires_at: expiresAt
    })
    .eq('id', config.id);

  return newAccessToken;
}

async function requestIndexing(accessToken: string, url: string): Promise<void> {
  try {
    const response = await fetch(GSC_INDEXING_API_URL, {
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

    if (response.ok) {
      console.log(`Reindexing requested for ${url}`);
    } else {
      console.error(`Failed to request reindexing for ${url}:`, await response.text());
    }
  } catch (error) {
    console.error(`Error requesting reindexing for ${url}:`, error);
  }
}
