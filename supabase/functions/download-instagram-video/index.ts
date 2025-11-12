import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || !url.includes('instagram.com')) {
      return new Response(
        JSON.stringify({ error: 'Invalid Instagram URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract Instagram post ID from URL
    const postIdMatch = url.match(/\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
    if (!postIdMatch) {
      return new Response(
        JSON.stringify({ error: 'Could not extract post ID from URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const postId = postIdMatch[1];

    // Note: Instagram's API requires authentication and has strict rate limits
    // For production use, you would need to:
    // 1. Register an Instagram app and get API credentials
    // 2. Implement OAuth authentication
    // 3. Use Instagram Graph API or a third-party service
    
    // This is a demonstration endpoint
    // In production, integrate with services like:
    // - RapidAPI Instagram endpoints
    // - Instagram Basic Display API
    // - Third-party Instagram video download services

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Instagram video download requires API credentials',
        info: 'Please configure Instagram API access or use a third-party service',
        postId: postId,
        steps: [
          '1. Get Instagram API credentials from Meta Developers',
          '2. Add INSTAGRAM_ACCESS_TOKEN to Lovable secrets',
          '3. Implement Instagram Graph API integration',
          'Alternative: Use third-party services like RapidAPI Instagram endpoints'
        ]
      }),
      { 
        status: 501, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
