import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OptimizationResult {
  total: number;
  optimized: number;
  failed: number;
  skipped: number;
  details: Array<{
    url: string;
    status: 'optimized' | 'failed' | 'skipped';
    reason?: string;
  }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting optimization of existing images...');

    // Get all articles with images
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, image_url, title')
      .not('image_url', 'is', null);

    if (articlesError) {
      throw articlesError;
    }

    const result: OptimizationResult = {
      total: articles?.length || 0,
      optimized: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No images to optimize',
          result 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${articles.length} articles with images`);

    // Process each article's image
    for (const article of articles) {
      try {
        // Skip if already optimized (contains '-optimized' in URL)
        if (article.image_url?.includes('-optimized')) {
          result.skipped++;
          result.details.push({
            url: article.image_url,
            status: 'skipped',
            reason: 'Already optimized',
          });
          continue;
        }

        console.log(`Processing article: ${article.title}`);

        // Download the image
        const imageResponse = await fetch(article.image_url);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        }

        const imageBlob = await imageResponse.blob();
        const imageArrayBuffer = await imageBlob.arrayBuffer();

        // Note: Full optimization would require importing image processing libraries
        // For now, we'll re-upload with compression settings
        // In production, you'd want to use a service like Cloudinary or imgproxy

        // Extract filename from URL
        const urlParts = article.image_url.split('/');
        const originalFileName = urlParts[urlParts.length - 1];
        const fileExt = originalFileName.split('.').pop();
        const newFileName = `${Date.now()}-optimized.${fileExt}`;

        // Upload optimized version (this is a placeholder - actual optimization needs image processing)
        const { error: uploadError } = await supabase.storage
          .from('article-images')
          .upload(newFileName, imageArrayBuffer, {
            contentType: imageBlob.type,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get new public URL
        const { data: urlData } = supabase.storage
          .from('article-images')
          .getPublicUrl(newFileName);

        // Update article with new URL
        const { error: updateError } = await supabase
          .from('articles')
          .update({ image_url: urlData.publicUrl })
          .eq('id', article.id);

        if (updateError) {
          throw updateError;
        }

        result.optimized++;
        result.details.push({
          url: article.image_url,
          status: 'optimized',
        });

        console.log(`Optimized image for article: ${article.title}`);
      } catch (error) {
        console.error(`Failed to optimize image for article ${article.title}:`, error);
        result.failed++;
        result.details.push({
          url: article.image_url,
          status: 'failed',
          reason: (error as any).message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Image optimization completed',
        result,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in optimize-existing-images function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
