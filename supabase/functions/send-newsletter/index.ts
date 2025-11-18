import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsletterRequest {
  articleId: string;
  type: 'new_article' | 'breaking_news';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { articleId, type }: NewsletterRequest = await req.json();

    if (!articleId) {
      return new Response(JSON.stringify({ error: 'Article ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get article details
    const { data: article, error: articleError } = await supabaseClient
      .from('articles')
      .select(`
        *,
        categories:category_id (
          name,
          color
        )
      `)
      .eq('id', articleId)
      .single();

    if (articleError || !article) {
      console.error('Error fetching article:', articleError);
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get newsletter subscribers
    const { data: subscribers, error: subscribersError } = await supabaseClient
      .from('newsletter_subscribers')
      .select('email')
      .eq('is_active', true);

    if (subscribersError) {
      console.error('Error fetching subscribers:', subscribersError);
      return new Response(JSON.stringify({ error: 'Failed to fetch subscribers' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ message: 'No active subscribers found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Sending newsletter to ${subscribers.length} subscribers for article: ${article.title}`);

    const isBreaking = type === 'breaking_news';
    const subject = isBreaking 
      ? `🚨 BREAKING: ${article.title}`
      : `📰 New Article: ${article.title}`;

    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        const emailResponse = await resend.emails.send({
          from: "The Bulletin Briefs <newsletter@thebulletinbriefs.com>",
          to: [subscriber.email],
          subject,
          html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;">
              ${isBreaking ? `
                <div style="background: #dc2626; color: white; padding: 15px; text-align: center; font-weight: bold; font-size: 18px;">
                  🚨 BREAKING NEWS ALERT
                </div>
              ` : ''}
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; ${isBreaking ? '' : 'border-radius: 8px 8px 0 0;'}">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">The Bulletin Briefs</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Your daily dose of news</p>
              </div>
              
              <div style="background: white; padding: 30px 20px; ${isBreaking ? '' : 'border-radius: 0 0 8px 8px;'} box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${article.image_url ? `
                  <img src="${article.image_url}" alt="${article.title}" 
                       style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 6px; margin-bottom: 20px;">
                ` : ''}
                
                <div style="background: ${article.categories?.color || '#e5e7eb'}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block; margin-bottom: 15px;">
                  ${article.categories?.name || 'News'}
                </div>
                
                <h2 style="color: #333; margin: 15px 0; line-height: 1.3; font-size: 22px;">
                  ${article.title}
                </h2>
                
                <p style="color: #555; line-height: 1.6; font-size: 16px; margin: 15px 0;">
                  ${article.excerpt || article.summary || 'Read the full article to stay informed on this developing story.'}
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://107da7ce-f26e-4ff3-b60e-d2d83e58e2e2.lovableproject.com/article/${article.slug}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Read Full Article
                  </a>
                </div>
                
                <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                  <p style="color: #666; font-size: 14px; margin: 10px 0;">
                    📅 Published: ${new Date(article.published_at || article.created_at).toLocaleDateString()}
                  </p>
                  <p style="color: #666; font-size: 14px; margin: 10px 0;">
                    ⏱️ Reading time: ${article.reading_time || 5} min
                  </p>
                </div>
                
                <p style="color: #888; font-size: 12px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                  You're receiving this newsletter because you subscribed to The Bulletin Briefs.<br>
                  <a href="#" style="color: #667eea;">Manage preferences</a> | 
                  <a href="#" style="color: #667eea;">Unsubscribe</a>
                </p>
              </div>
            </div>
          `,
        });

        return { success: true, email: subscriber.email, messageId: emailResponse.data?.id };
      } catch (error) {
        console.error(`Failed to send email to ${subscriber.email}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, email: subscriber.email, error: errorMessage };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Newsletter sent: ${successful} successful, ${failed} failed`);

    return new Response(JSON.stringify({ 
      message: `Newsletter sent: ${successful} successful, ${failed} failed`,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-newsletter function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});