import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current date for context
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    console.log(`🔍 Finding today's breaking news articles for web story generation on ${dateStr}...`);

    // Get today's start timestamp (IST)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Get the 3 most recent published articles from TODAY (the breaking news articles)
    const { data: recentArticles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, content, slug')
      .eq('published', true)
      .gte('published_at', todayStart.toISOString())
      .order('published_at', { ascending: false })
      .limit(3);

    if (articlesError) {
      console.error('❌ Failed to fetch articles:', articlesError);
      throw new Error('Failed to fetch recent articles');
    }

    if (!recentArticles || recentArticles.length === 0) {
      console.log('⚠️ No articles published today for web story generation');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No articles published today for web story generation',
          storiesCreated: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Found ${recentArticles.length} articles published today`);

    // Check existing stories to avoid duplicates
    const { data: existingStories } = await supabase
      .from('web_stories')
      .select('source_article_id')
      .gte('created_at', todayStart.toISOString());

    const existingArticleIds = new Set(existingStories?.map(s => s.source_article_id).filter(Boolean) || []);

    // Filter out articles that already have web stories
    const selectedArticles = recentArticles.filter(article => !existingArticleIds.has(article.id));
    console.log(`📝 Selected ${selectedArticles.length} articles for web story generation (after filtering duplicates)`);

    // Generate web stories from selected articles
    const results = await Promise.all(
      selectedArticles.map(async (article, index) => {
          try {
            console.log(`📝 Generating web story for article: ${article.title}`);

            // Generate web story from the article content (reuses existing content - no extra credits!)
            const { data: storyData, error: storyError } = await supabase.functions.invoke('generate-web-story', {
              body: {
                articleId: article.id,
                autoPublish: false // We'll schedule it
              }
            });

            if (storyError) {
              console.error(`❌ Story generation failed for ${article.title}:`, storyError);
              return { success: false, article: article.title, error: storyError.message };
            }

            // Schedule for publishing (stagger throughout the day: 0, 8, 16 hours)
            const hoursDelay = index * 8;
            const scheduledTime = new Date(Date.now() + hoursDelay * 60 * 60 * 1000);

            const { error: queueError } = await supabase
              .from('web_stories_queue')
              .insert({
                story_id: storyData.story.id,
                scheduled_at: scheduledTime.toISOString(),
                auto_publish: true,
                review_status: 'approved',
                priority: 85
              });

            if (queueError) {
              console.warn(`⚠️ Failed to schedule story ${article.title}:`, queueError);
            }

            console.log(`✅ Created and scheduled story: ${article.title} for ${scheduledTime.toISOString()}`);
            return { 
              success: true, 
              article: article.title, 
              storyId: storyData.story.id,
              scheduledFor: scheduledTime.toISOString()
            };

          } catch (error: any) {
            console.error(`❌ Error processing article ${article.title}:`, error);
            return { success: false, article: article.title, error: error.message };
          }
        })
    );

    // Clean up old web stories (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const { data: oldStories } = await supabase
      .from('web_stories')
      .select('id, title')
      .eq('auto_generated', true)
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (oldStories && oldStories.length > 0) {
      console.log(`🗑️ Deleting ${oldStories.length} old auto-generated stories...`);
      
      const { error: deleteError } = await supabase
        .from('web_stories')
        .delete()
        .in('id', oldStories.map(s => s.id));

      if (deleteError) {
        console.warn('⚠️ Failed to delete old stories:', deleteError);
      } else {
        console.log(`✅ Deleted ${oldStories.length} old stories`);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log(`✅ Automation complete: ${successCount} stories created, ${failedCount} failed, ${oldStories?.length || 0} old stories deleted`);

    return new Response(
      JSON.stringify({
        success: true,
        articlesProcessed: selectedArticles.length,
        storiesCreated: successCount,
        storiesFailed: failedCount,
        oldStoriesDeleted: oldStories?.length || 0,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in auto-generate-trending-webstories:', error);
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
