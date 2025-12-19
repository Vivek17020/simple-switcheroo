import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * This function is triggered by database events when Web3 articles are published
 * It immediately submits them for search engine indexing
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleId } = await req.json();
    
    if (!articleId) {
      return new Response(
        JSON.stringify({ error: 'Article ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔔 Triggered Web3 indexing for article: ${articleId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Call the index-web3-articles function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/index-web3-articles`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          articleId,
          mode: 'single'
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to trigger indexing:', error);
      throw new Error(`Indexing failed: ${error}`);
    }

    const result = await response.json();
    console.log('✅ Web3 indexing triggered successfully:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Web3 indexing triggered',
        result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Trigger Web3 indexing error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to trigger indexing', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
