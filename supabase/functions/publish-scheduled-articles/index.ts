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

    console.log('📰 Checking for scheduled articles to publish...');

    const now = new Date().toISOString();

    // Find articles that are scheduled and past their publish time
    const { data: scheduledArticles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, slug, published_at')
      .eq('published', false)
      .eq('status', 'scheduled')
      .lte('published_at', now);

    if (fetchError) {
      throw fetchError;
    }

    if (!scheduledArticles || scheduledArticles.length === 0) {
      console.log('✅ No articles to publish at this time');
      return new Response(
        JSON.stringify({ success: true, published: 0, message: 'No scheduled articles' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📝 Found ${scheduledArticles.length} articles to publish`);

    const publishedArticles: any[] = [];

    for (const article of scheduledArticles) {
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          published: true,
          status: 'published',
          updated_at: new Date().toISOString(),
        })
        .eq('id', article.id);

      if (updateError) {
        console.error(`❌ Failed to publish: ${article.title}`, updateError);
      } else {
        publishedArticles.push(article);
        console.log(`✅ Published: ${article.title}`);

        // Notify search engines (optional - ping sitemap)
        try {
          await fetch(`https://www.google.com/ping?sitemap=https://www.thebulletinbriefs.in/sitemap.xml`);
        } catch (e) {
          console.warn('Sitemap ping failed:', e);
        }
      }
    }

    console.log(`✅ Published ${publishedArticles.length} articles`);

    return new Response(
      JSON.stringify({
        success: true,
        published: publishedArticles.length,
        articles: publishedArticles.map(a => ({ id: a.id, title: a.title, slug: a.slug }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in publish-scheduled-articles:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
