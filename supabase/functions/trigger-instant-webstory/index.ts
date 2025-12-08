import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

// This function is triggered automatically when an article is published
// It instantly generates a web story from the article content
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { articleId } = await req.json();
    
    if (!articleId) {
      throw new Error('articleId is required');
    }

    console.log(`⚡ Instant web story generation triggered for article: ${articleId}`);

    // Get the article details
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, title, content, slug')
      .eq('id', articleId)
      .single();

    if (articleError || !article) {
      throw new Error(`Article not found: ${articleId}`);
    }

    // Check if web story already exists for this article
    const { data: existingStory } = await supabase
      .from('web_stories')
      .select('id')
      .eq('source_article_id', articleId)
      .single();

    if (existingStory) {
      console.log(`⚠️ Web story already exists for article: ${article.title}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Web story already exists',
          skipped: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate web story instantly
    console.log(`📝 Generating instant web story for: ${article.title}`);
    
    const { data: storyData, error: storyError } = await supabase.functions.invoke('generate-web-story', {
      body: {
        articleId: article.id,
        autoPublish: true // Publish immediately for speed
      }
    });

    if (storyError) {
      console.error(`❌ Web story generation failed:`, storyError);
      throw storyError;
    }

    console.log(`✅ Instant web story created and published: ${article.title}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Web story generated and published instantly',
        storyId: storyData.story.id,
        articleTitle: article.title
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in trigger-instant-webstory:', error);
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
