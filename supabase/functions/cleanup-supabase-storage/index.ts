import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Timeout tracking
const MAX_EXECUTION_TIME = 40000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { mode = 'status', bucket = 'article-images', batchSize = 50, dryRun = true } = await req.json();

    // Create Supabase client with service role for storage access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Mode: status - Check storage usage and what can be cleaned
    if (mode === 'status') {
      // List files in bucket
      const { data: files, error: listError } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1000 });

      if (listError) throw listError;

      // Get all referenced URLs from database
      const { data: articles } = await supabase
        .from('articles')
        .select('image_url, content');

      const { data: webStories } = await supabase
        .from('web_stories')
        .select('featured_image, slides');

      // Build set of referenced file names
      const referencedFiles = new Set<string>();
      const supabaseStoragePrefix = `${supabaseUrl}/storage/v1/object/public/${bucket}/`;

      // Check article featured images
      articles?.forEach(a => {
        if (a.image_url?.includes(supabaseStoragePrefix)) {
          const fileName = a.image_url.replace(supabaseStoragePrefix, '');
          referencedFiles.add(fileName);
        }
        // Check embedded images in content
        const contentMatches = a.content?.match(new RegExp(`${supabaseStoragePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"'\\s]+`, 'g')) || [];
        contentMatches.forEach((url: string) => {
          const fileName = url.replace(supabaseStoragePrefix, '');
          referencedFiles.add(fileName);
        });
      });

      // Check web story images
      webStories?.forEach(s => {
        if (s.featured_image?.includes(supabaseStoragePrefix)) {
          const fileName = s.featured_image.replace(supabaseStoragePrefix, '');
          referencedFiles.add(fileName);
        }
        // Check slide images
        if (Array.isArray(s.slides)) {
          s.slides.forEach((slide: any) => {
            if (slide.image?.includes(supabaseStoragePrefix)) {
              const fileName = slide.image.replace(supabaseStoragePrefix, '');
              referencedFiles.add(fileName);
            }
          });
        }
      });

      // Find unreferenced files
      const unreferencedFiles: { name: string; size: number }[] = [];
      let totalSize = 0;
      let unreferencedSize = 0;

      files?.forEach(file => {
        const fileSize = file.metadata?.size || 0;
        totalSize += fileSize;
        
        if (!referencedFiles.has(file.name)) {
          unreferencedFiles.push({ name: file.name, size: fileSize });
          unreferencedSize += fileSize;
        }
      });

      return new Response(JSON.stringify({
        success: true,
        bucket,
        totalFiles: files?.length || 0,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        referencedFiles: referencedFiles.size,
        unreferencedFiles: unreferencedFiles.length,
        unreferencedSizeMB: (unreferencedSize / (1024 * 1024)).toFixed(2),
        potentialSavingsMB: (unreferencedSize / (1024 * 1024)).toFixed(2),
        sampleUnreferencedFiles: unreferencedFiles.slice(0, 10).map(f => f.name)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mode: cleanup - Delete unreferenced files
    if (mode === 'cleanup') {
      console.log(`🧹 Starting cleanup of ${bucket} bucket (dryRun: ${dryRun})`);

      // List files in bucket
      const { data: files, error: listError } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1000 });

      if (listError) throw listError;

      // Get all referenced URLs from database
      const { data: articles } = await supabase
        .from('articles')
        .select('image_url, content');

      const { data: webStories } = await supabase
        .from('web_stories')
        .select('featured_image, slides');

      // Build set of referenced file names
      const referencedFiles = new Set<string>();
      const supabaseStoragePrefix = `${supabaseUrl}/storage/v1/object/public/${bucket}/`;

      articles?.forEach(a => {
        if (a.image_url?.includes(supabaseStoragePrefix)) {
          const fileName = a.image_url.replace(supabaseStoragePrefix, '');
          referencedFiles.add(fileName);
        }
        const contentMatches = a.content?.match(new RegExp(`${supabaseStoragePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"'\\s]+`, 'g')) || [];
        contentMatches.forEach((url: string) => {
          const fileName = url.replace(supabaseStoragePrefix, '');
          referencedFiles.add(fileName);
        });
      });

      webStories?.forEach(s => {
        if (s.featured_image?.includes(supabaseStoragePrefix)) {
          const fileName = s.featured_image.replace(supabaseStoragePrefix, '');
          referencedFiles.add(fileName);
        }
        if (Array.isArray(s.slides)) {
          s.slides.forEach((slide: any) => {
            if (slide.image?.includes(supabaseStoragePrefix)) {
              const fileName = slide.image.replace(supabaseStoragePrefix, '');
              referencedFiles.add(fileName);
            }
          });
        }
      });

      // Find and delete unreferenced files
      const filesToDelete: string[] = [];
      let deletedCount = 0;
      let deletedSize = 0;
      const errors: string[] = [];

      for (const file of files || []) {
        if (Date.now() - startTime > MAX_EXECUTION_TIME) {
          console.log(`⏱️ Timeout approaching, stopping cleanup`);
          break;
        }

        if (!referencedFiles.has(file.name)) {
          filesToDelete.push(file.name);
          
          if (filesToDelete.length >= batchSize) {
            break; // Process in batches
          }
        }
      }

      if (dryRun) {
        console.log(`🔍 Dry run - would delete ${filesToDelete.length} files`);
        return new Response(JSON.stringify({
          success: true,
          dryRun: true,
          wouldDelete: filesToDelete.length,
          sampleFiles: filesToDelete.slice(0, 20),
          message: 'Set dryRun=false to actually delete files'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Actually delete files
      for (const fileName of filesToDelete) {
        if (Date.now() - startTime > MAX_EXECUTION_TIME) {
          console.log(`⏱️ Timeout approaching, stopping deletion`);
          break;
        }

        try {
          const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove([fileName]);

          if (deleteError) {
            console.log(`❌ Failed to delete ${fileName}: ${deleteError.message}`);
            errors.push(fileName);
          } else {
            console.log(`✅ Deleted: ${fileName}`);
            deletedCount++;
          }
        } catch (e) {
          console.log(`❌ Error deleting ${fileName}: ${e}`);
          errors.push(fileName);
        }
      }

      // Get remaining unreferenced count
      const { data: remainingFiles } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1000 });

      let remainingUnreferenced = 0;
      remainingFiles?.forEach(file => {
        if (!referencedFiles.has(file.name)) {
          remainingUnreferenced++;
        }
      });

      return new Response(JSON.stringify({
        success: true,
        deletedCount,
        remainingUnreferenced,
        errors: errors.length > 0 ? errors : undefined,
        elapsedTime: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid mode. Use "status" or "cleanup"' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Cleanup error:', errMsg);
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
