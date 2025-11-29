import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📅 Running scheduled web story publisher...');

    // Get current time
    const now = new Date();

    // Find stories scheduled to be published
    const { data: queueItems, error: queueError } = await supabase
      .from('web_stories_queue')
      .select(`
        *,
        web_stories (*)
      `)
      .eq('review_status', 'approved')
      .eq('auto_publish', true)
      .lte('scheduled_at', now.toISOString())
      .order('priority', { ascending: false })
      .limit(10);

    if (queueError) {
      console.error('❌ Error fetching queue:', queueError);
      throw queueError;
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('✅ No stories to publish at this time');
      return new Response(
        JSON.stringify({ 
          message: 'No stories to publish',
          published: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`📤 Publishing ${queueItems.length} stories...`);

    const results = await Promise.all(
      queueItems.map(async (item: any) => {
        try {
          const story = item.web_stories;
          
          if (!story) {
            console.warn(`⚠️ Story not found for queue item ${item.id}`);
            return { success: false, storyId: null, error: 'Story not found' };
          }

          // Update story status to published
          const { error: updateError } = await supabase
            .from('web_stories')
            .update({
              status: 'published',
              published_at: new Date().toISOString()
            })
            .eq('id', story.id);

          if (updateError) {
            console.error(`❌ Failed to publish story ${story.id}:`, updateError);
            return { success: false, storyId: story.id, error: updateError.message };
          }

          // Remove from queue
          await supabase
            .from('web_stories_queue')
            .delete()
            .eq('id', item.id);

          // Trigger indexing
          try {
            await supabase.functions.invoke('google-index-now', {
              body: {
                storyId: story.id,
                pageType: 'webstory',
                action: 'update'
              }
            });
            console.log(`✅ Indexing triggered for story ${story.id}`);
          } catch (indexError) {
            console.warn(`⚠️ Indexing failed for story ${story.id}:`, indexError);
          }

          console.log(`✅ Published story: ${story.title}`);
          return { success: true, storyId: story.id, title: story.title };

        } catch (error: any) {
          console.error(`❌ Error processing queue item ${item.id}:`, error);
          return { success: false, storyId: item.story_id, error: error.message };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log(`✅ Published ${successCount} stories, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        published: successCount,
        failed: failedCount,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in auto-publish function:', error);
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
