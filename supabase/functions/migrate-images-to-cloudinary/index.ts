import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base64 encode helper
function toBase64(data: Uint8Array): string {
  const binString = Array.from(data, (byte) => String.fromCodePoint(byte)).join("");
  return btoa(binString);
}

// Timeout tracking - stop before hitting CPU limit (50s limit, stop at 35s)
const MAX_EXECUTION_TIME = 35000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Reduced default batch size from 10 to 2 for reliability
    const { mode, batchSize = 2, offset = 0, type = 'articles' } = await req.json();
    
    // Get Cloudinary credentials
    let apiKey = Deno.env.get('CLOUDINARY_API_KEY')?.trim();
    let apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')?.trim();
    let cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')?.trim();

    // Parse from CLOUDINARY_URL if needed
    if (!apiKey || !apiSecret || !cloudName) {
      const cloudinaryUrl = Deno.env.get('CLOUDINARY_URL')?.trim();
      if (cloudinaryUrl && cloudinaryUrl.startsWith('cloudinary://')) {
        const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
        if (match) {
          apiKey = match[1];
          apiSecret = match[2];
          cloudName = match[3];
        }
      }
    }

    if (!apiKey || !apiSecret || !cloudName) {
      throw new Error('Cloudinary credentials not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Mode: status - Get migration status
    if (mode === 'status') {
      return await getMigrationStatus(supabase, corsHeaders);
    }

    // Mode: migrate - Migrate batch of images
    if (mode === 'migrate') {
      if (type === 'articles') {
        return await migrateArticleImages(supabase, cloudName, apiKey, apiSecret, batchSize, offset, corsHeaders, startTime);
      } else if (type === 'webstories') {
        return await migrateWebStoryImages(supabase, cloudName, apiKey, apiSecret, batchSize, offset, corsHeaders, startTime);
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid mode' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Migration error:', errMsg);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errMsg,
      partialSuccess: true, // Indicate partial success even on error
      elapsedTime: Date.now() - startTime
    }), {
      status: 200, // Return 200 to prevent client-side error handling issues
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getMigrationStatus(supabase: any, corsHeaders: any) {
  // Count articles with Supabase URLs vs Cloudinary URLs
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('id, image_url')
    .not('image_url', 'is', null);

  if (articlesError) throw articlesError;

  const supabaseArticles = articles?.filter((a: any) => 
    a.image_url?.includes('supabase.co/storage') || 
    a.image_url?.includes('supabase.co/object')
  ) || [];
  
  const cloudinaryArticles = articles?.filter((a: any) => 
    a.image_url?.includes('cloudinary.com') || 
    a.image_url?.includes('res.cloudinary')
  ) || [];

  // Count web stories with Supabase URLs
  const { data: webStories, error: storiesError } = await supabase
    .from('web_stories')
    .select('id, slides, featured_image');

  if (storiesError) throw storiesError;

  let supabaseStoryImages = 0;
  let cloudinaryStoryImages = 0;

  webStories?.forEach((story: any) => {
    // Check featured image
    if (story.featured_image?.includes('supabase.co')) supabaseStoryImages++;
    if (story.featured_image?.includes('cloudinary.com')) cloudinaryStoryImages++;

    // Check slides - the field is 'image' not 'imageUrl'
    if (story.slides && Array.isArray(story.slides)) {
      story.slides.forEach((slide: any) => {
        if (slide.image?.includes('supabase.co')) supabaseStoryImages++;
        if (slide.image?.includes('cloudinary.com')) cloudinaryStoryImages++;
      });
    }
  });

  return new Response(JSON.stringify({
    success: true,
    articles: {
      total: articles?.length || 0,
      supabase: supabaseArticles.length,
      cloudinary: cloudinaryArticles.length,
      pending: supabaseArticles.length,
    },
    webStories: {
      total: webStories?.length || 0,
      supabaseImages: supabaseStoryImages,
      cloudinaryImages: cloudinaryStoryImages,
      pending: supabaseStoryImages,
    },
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function migrateArticleImages(
  supabase: any, 
  cloudName: string, 
  apiKey: string, 
  apiSecret: string, 
  batchSize: number, 
  offset: number,
  corsHeaders: any,
  startTime: number
) {
  console.log(`📦 Migrating articles batch: offset=${offset}, size=${batchSize}`);

  // Get articles with Supabase URLs
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, image_url, slug')
    .not('image_url', 'is', null)
    .or('image_url.ilike.%supabase.co/storage%,image_url.ilike.%supabase.co/object%')
    .range(offset, offset + batchSize - 1);

  if (error) throw error;

  if (!articles || articles.length === 0) {
    return new Response(JSON.stringify({
      success: true,
      message: 'No more articles to migrate',
      migrated: 0,
      remaining: 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const results: any[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (const article of articles) {
    // Check if we're approaching timeout
    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_EXECUTION_TIME) {
      console.log(`⏱️ Approaching timeout (${elapsed}ms), stopping early with partial results`);
      break;
    }

    try {
      console.log(`🔄 Migrating: ${article.title}`);
      
      // Download image from Supabase
      const imageResponse = await fetch(article.image_url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download: ${imageResponse.status}`);
      }

      const imageBlob = await imageResponse.blob();
      const imageBuffer = await imageBlob.arrayBuffer();
      const base64Image = toBase64(new Uint8Array(imageBuffer));
      const mimeType = imageBlob.type || 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      // Upload to Cloudinary
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = 'articles';
      const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
      
      const encoder = new TextEncoder();
      const data = encoder.encode(paramsToSign + apiSecret);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const formData = new FormData();
      formData.append('file', dataUrl);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!cloudinaryResponse.ok) {
        const errorText = await cloudinaryResponse.text();
        throw new Error(`Cloudinary error: ${errorText}`);
      }

      const cloudinaryData = await cloudinaryResponse.json();
      const newUrl = cloudinaryData.secure_url;

      // Update article with new URL
      const { error: updateError } = await supabase
        .from('articles')
        .update({ image_url: newUrl })
        .eq('id', article.id);

      if (updateError) throw updateError;

      console.log(`✅ Migrated: ${article.title} -> ${newUrl}`);
      successCount++;
      results.push({ id: article.id, title: article.title, status: 'success', newUrl });

    } catch (err: any) {
      console.error(`❌ Failed: ${article.title}:`, err.message);
      errorCount++;
      results.push({ id: article.id, title: article.title, status: 'error', error: err.message });
    }
  }

  // Get remaining count
  const { count: remainingCount } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .not('image_url', 'is', null)
    .or('image_url.ilike.%supabase.co/storage%,image_url.ilike.%supabase.co/object%');

  return new Response(JSON.stringify({
    success: true,
    migrated: successCount,
    errors: errorCount,
    remaining: remainingCount || 0,
    results,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function migrateWebStoryImages(
  supabase: any,
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  batchSize: number,
  offset: number,
  corsHeaders: any,
  startTime: number
) {
  console.log(`📦 Migrating web stories batch: size=${batchSize}`);

  // Get ALL web stories first, then filter for ones with Supabase URLs
  const { data: allStories, error } = await supabase
    .from('web_stories')
    .select('id, title, slug, featured_image, slides');

  if (error) throw error;

  // Filter stories that have Supabase URLs - check 'image' field in slides
  const storiesNeedingMigration = allStories?.filter((story: any) => {
    if (story.featured_image?.includes('supabase.co')) return true;
    if (story.slides && Array.isArray(story.slides)) {
      return story.slides.some((slide: any) => slide.image?.includes('supabase.co'));
    }
    return false;
  }) || [];

  console.log(`Found ${storiesNeedingMigration.length} stories needing migration`);

  // Take only batchSize stories to process
  const storiesToMigrate = storiesNeedingMigration.slice(0, batchSize);

  if (storiesToMigrate.length === 0) {
    return new Response(JSON.stringify({
      success: true,
      message: 'No more web stories to migrate',
      migrated: 0,
      remaining: 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const results: any[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (const story of storiesToMigrate) {
    // Check if we're approaching timeout
    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_EXECUTION_TIME) {
      console.log(`⏱️ Approaching timeout (${elapsed}ms), stopping early with partial results`);
      break;
    }

    try {
      console.log(`🔄 Migrating story: ${story.title}`);
      
      let updatedFeaturedImage = story.featured_image;
      let updatedSlides = story.slides ? [...story.slides] : [];
      let imagesUpdated = 0;

      // Migrate featured image
      if (story.featured_image?.includes('supabase.co')) {
        // Check timeout before each image
        if (Date.now() - startTime > MAX_EXECUTION_TIME) {
          console.log(`⏱️ Timeout approaching, saving partial progress for story`);
          break;
        }
        try {
          const newUrl = await uploadImageToCloudinary(
            story.featured_image, cloudName, apiKey, apiSecret, 'web-stories'
          );
          updatedFeaturedImage = newUrl;
          imagesUpdated++;
          console.log(`  ✓ Migrated featured image`);
        } catch (err: any) {
          console.error(`  ✗ Failed to migrate featured image:`, err.message);
        }
      }

      // Migrate slide images - use 'image' field not 'imageUrl'
      for (let i = 0; i < updatedSlides.length; i++) {
        // Check timeout before each slide
        if (Date.now() - startTime > MAX_EXECUTION_TIME) {
          console.log(`⏱️ Timeout approaching at slide ${i + 1}, saving partial progress`);
          break;
        }
        
        if (updatedSlides[i].image?.includes('supabase.co')) {
          try {
            const newUrl = await uploadImageToCloudinary(
              updatedSlides[i].image, cloudName, apiKey, apiSecret, 'web-stories'
            );
            updatedSlides[i] = { ...updatedSlides[i], image: newUrl };
            imagesUpdated++;
            console.log(`  ✓ Migrated slide ${i + 1} image`);
          } catch (err: any) {
            console.error(`  ✗ Failed to migrate slide ${i + 1}:`, err.message);
          }
        }
      }

      // Update story with featured_image (not cover_image)
      const { error: updateError } = await supabase
        .from('web_stories')
        .update({ 
          featured_image: updatedFeaturedImage, 
          slides: updatedSlides 
        })
        .eq('id', story.id);

      if (updateError) throw updateError;

      console.log(`✅ Migrated story: ${story.title} (${imagesUpdated} images)`);
      successCount++;
      results.push({ id: story.id, title: story.title, status: 'success', imagesUpdated });

    } catch (err: any) {
      console.error(`❌ Failed story: ${story.title}:`, err.message);
      errorCount++;
      results.push({ id: story.id, title: story.title, status: 'error', error: err.message });
    }
  }

  // Get remaining count
  const { data: remainingStories } = await supabase
    .from('web_stories')
    .select('id, featured_image, slides');
  
  let remainingCount = 0;
  remainingStories?.forEach((story: any) => {
    if (story.featured_image?.includes('supabase.co')) remainingCount++;
    if (story.slides && Array.isArray(story.slides)) {
      story.slides.forEach((slide: any) => {
        if (slide.image?.includes('supabase.co')) remainingCount++;
      });
    }
  });

  return new Response(JSON.stringify({
    success: true,
    migrated: successCount,
    errors: errorCount,
    remaining: remainingCount,
    results,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function uploadImageToCloudinary(
  imageUrl: string,
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  folder: string
): Promise<string> {
  // Download image
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  
  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  const base64 = toBase64(new Uint8Array(buffer));
  const mimeType = blob.type || 'image/jpeg';
  const dataUrl = `data:${mimeType};base64,${base64}`;

  // Generate signature
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(paramsToSign + apiSecret);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const signature = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  // Upload
  const formData = new FormData();
  formData.append('file', dataUrl);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`Cloudinary error: ${error}`);
  }

  const result = await uploadResponse.json();
  return result.secure_url;
}
