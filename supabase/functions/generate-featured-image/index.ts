import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, excerpt, category } = await req.json();
    
    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Article title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎨 Generating featured image for:', title);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Google Discover requires minimum 1200px width
    // Using 1200x675 (16:9 aspect ratio) for optimal display
    const imagePrompt = `Create a professional, high-quality featured image for a news article.

CRITICAL REQUIREMENTS:
- Resolution: Exactly 1200x675 pixels (16:9 aspect ratio)
- Style: Modern editorial photography, photorealistic
- Quality: Ultra high resolution, sharp details, no blur
- Composition: Clear focal point, balanced layout, visually compelling

Article Title: "${title}"
${excerpt ? `Context: ${excerpt.substring(0, 200)}` : ''}
${category ? `Category: ${category}` : ''}

The image must be:
- Eye-catching and scroll-stopping for social media feeds
- Relevant to the article topic
- Professional news/editorial quality
- Vibrant colors with good contrast
- No text overlays or watermarks
- Suitable for Google Discover and social sharing`;

    console.log('📝 Image prompt created for Google Discover compatibility');

    // Call Lovable AI image generation with specific dimensions
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: imagePrompt
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Image generation response received');

    // Extract the generated image
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      throw new Error('No image generated in response');
    }

    console.log('🖼️ Image generated successfully - Google Discover compatible (1200x675)');

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: imageUrl, // base64 data URL
        message: 'Featured image generated successfully',
        dimensions: { width: 1200, height: 675 },
        googleDiscoverReady: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error generating featured image:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate featured image',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
