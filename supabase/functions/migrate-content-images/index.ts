import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binString = '';
  for (let i = 0; i < bytes.length; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  return btoa(binString);
}

// Timeout tracking - stop before hitting CPU limit
const MAX_EXECUTION_TIME = 35000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { mode = 'status', batchSize = 2 } = await req.json();

    // Get Cloudinary credentials
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY')?.trim();
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')?.trim();
    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')?.trim();

    if (!apiKey || !apiSecret || !cloudName) {
      throw new Error('Cloudinary credentials not configured');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Mode: status - Check how many articles have embedded Supabase URLs
    if (mode === 'status') {
      const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, content')
        .like('content', '%supabase.co/storage%');

      if (error) throw error;

      const articlesWithSupabaseUrls = articles?.filter(a => 
        a.content?.includes('supabase.co/storage')
      ) || [];

      // Count embedded images per article
      const details = articlesWithSupabaseUrls.map(a => {
        const matches = a.content?.match(/https:\/\/[^"'\s]+supabase\.co\/storage[^"'\s]+/g) || [];
        return {
          id: a.id,
          title: a.title,
          embeddedImageCount: matches.length
        };
      });

      const totalImages = details.reduce((sum, d) => sum + d.embeddedImageCount, 0);

      return new Response(JSON.stringify({
        success: true,
        articlesWithEmbeddedImages: articlesWithSupabaseUrls.length,
        totalEmbeddedImages: totalImages,
        details
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mode: migrate - Migrate embedded images
    if (mode === 'migrate') {
      const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, content, slug')
        .like('content', '%supabase.co/storage%')
        .limit(batchSize);

      if (error) throw error;

      const articlesToMigrate = articles?.filter(a => 
        a.content?.includes('supabase.co/storage')
      ) || [];

      if (articlesToMigrate.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          message: 'All embedded images already migrated!',
          migrated: 0,
          remaining: 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`📦 Migrating embedded images from ${articlesToMigrate.length} articles`);

      let migratedArticles = 0;
      let migratedImages = 0;
      let errors: string[] = [];

      for (const article of articlesToMigrate) {
        // Check timeout
        if (Date.now() - startTime > MAX_EXECUTION_TIME) {
          console.log(`⏱️ Timeout approaching, stopping with partial results`);
          break;
        }

        try {
          console.log(`🔄 Processing: ${article.title}`);
          
          // Find all Supabase storage URLs in content
          const supabaseUrlPattern = /https:\/\/[^"'\s]+supabase\.co\/storage\/v1\/object\/public\/[^"'\s]+/g;
          const matches = article.content?.match(supabaseUrlPattern) || [];
          
          if (matches.length === 0) {
            console.log(`✅ No embedded images found in: ${article.title}`);
            continue;
          }

          console.log(`📸 Found ${matches.length} embedded images`);
          
          let updatedContent = article.content;
          let articleImagesMigrated = 0;

          for (const imageUrl of matches) {
            // Check timeout before each image
            if (Date.now() - startTime > MAX_EXECUTION_TIME) {
              console.log(`⏱️ Timeout approaching during image processing`);
              break;
            }

            try {
              console.log(`  📤 Uploading: ${imageUrl.substring(0, 80)}...`);
              
              // Fetch the image
              const imageResponse = await fetch(imageUrl);
              if (!imageResponse.ok) {
                console.log(`  ⚠️ Failed to fetch image: ${imageResponse.status}`);
                continue;
              }

              const imageBuffer = await imageResponse.arrayBuffer();
              const base64Image = arrayBufferToBase64(imageBuffer);
              const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

              // Upload to Cloudinary
              const timestamp = Math.floor(Date.now() / 1000);
              const folder = 'content';
              
              // Create signature
              const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
              const encoder = new TextEncoder();
              const data = encoder.encode(signatureString);
              const hashBuffer = await crypto.subtle.digest('SHA-1', data);
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

              const formData = new FormData();
              formData.append('file', `data:${contentType};base64,${base64Image}`);
              formData.append('api_key', apiKey);
              formData.append('timestamp', timestamp.toString());
              formData.append('signature', signature);
              formData.append('folder', folder);

              const uploadResponse = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                { method: 'POST', body: formData }
              );

              if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.log(`  ❌ Cloudinary upload failed: ${errorText}`);
                continue;
              }

              const uploadResult = await uploadResponse.json();
              const cloudinaryUrl = uploadResult.secure_url;

              console.log(`  ✅ Uploaded to: ${cloudinaryUrl}`);

              // Replace URL in content
              updatedContent = updatedContent.replace(imageUrl, cloudinaryUrl);
              articleImagesMigrated++;
              migratedImages++;

            } catch (imgError) {
              console.log(`  ❌ Error processing image: ${imgError}`);
              errors.push(`Image error in ${article.title}: ${imgError}`);
            }
          }

          // Update article content if any images were migrated
          if (articleImagesMigrated > 0) {
            const { error: updateError } = await supabase
              .from('articles')
              .update({ content: updatedContent })
              .eq('id', article.id);

            if (updateError) {
              console.log(`❌ Failed to update article: ${updateError.message}`);
              errors.push(`Update error: ${article.title}`);
            } else {
              console.log(`✅ Updated article: ${article.title} (${articleImagesMigrated} images)`);
              migratedArticles++;
            }
          }

        } catch (articleError) {
          console.log(`❌ Error processing article: ${articleError}`);
          errors.push(`Article error: ${article.title}`);
        }
      }

      // Get remaining count
      const { data: remainingArticles } = await supabase
        .from('articles')
        .select('id')
        .like('content', '%supabase.co/storage%');

      const remaining = remainingArticles?.filter(a => a.id)?.length || 0;

      return new Response(JSON.stringify({
        success: true,
        migratedArticles,
        migratedImages,
        remaining,
        errors: errors.length > 0 ? errors : undefined,
        elapsedTime: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid mode' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Migration error:', errMsg);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errMsg,
      elapsedTime: Date.now() - startTime
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
