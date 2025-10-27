import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[NEWSLETTER-DIGEST] ${step}${detailsStr}`);
};

interface NewsletterData {
  articleId: string;
  type: 'new_article' | 'breaking_news' | 'daily_digest' | 'weekly_digest';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Newsletter digest function started");

    const { articleId, type }: NewsletterData = await req.json();
    logStep("Request data parsed", { articleId, type });

    // Get article details
    const { data: article, error: articleError } = await supabaseClient
      .from('articles')
      .select(`
        id,
        title,
        excerpt,
        slug,
        image_url,
        author,
        published_at,
        categories (name, slug)
      `)
      .eq('id', articleId)
      .single();

    if (articleError || !article) {
      throw new Error(`Article not found: ${articleError?.message}`);
    }

    logStep("Article retrieved", { title: article.title });

    // Get active newsletter subscribers based on type
    let subscriberQuery = supabaseClient
      .from('newsletter_preferences')
      .select('email, frequency, categories')
      .eq('active', true);

    // Filter by frequency preference
    if (type === 'breaking_news') {
      subscriberQuery = subscriberQuery.in('frequency', ['breaking', 'daily']);
    } else if (type === 'daily_digest') {
      subscriberQuery = subscriberQuery.in('frequency', ['daily']);
    } else if (type === 'weekly_digest') {
      subscriberQuery = subscriberQuery.in('frequency', ['weekly']);
    } else {
      subscriberQuery = subscriberQuery.in('frequency', ['breaking', 'daily']);
    }

    const { data: subscribers, error: subscribersError } = await subscriberQuery;

    if (subscribersError) {
      throw new Error(`Failed to fetch subscribers: ${subscribersError.message}`);
    }

    logStep("Subscribers retrieved", { count: subscribers?.length || 0 });

    if (!subscribers || subscribers.length === 0) {
      logStep("No subscribers found for this type");
      return new Response(JSON.stringify({ message: "No subscribers found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate email content
    const baseUrl = "https://b75f9e8b-e12f-4b37-b43f-61e7d9c20aff.lovableproject.com";
    const articleUrl = `${baseUrl}/article/${article.slug}`;
    const unsubscribeUrl = `${baseUrl}/unsubscribe`;

    const emailSubject = type === 'breaking_news' 
      ? `🚨 Breaking: ${article.title}`
      : type === 'daily_digest'
      ? `📰 Daily Digest: ${article.title}`
      : type === 'weekly_digest'
      ? `📅 Weekly Roundup: ${article.title}`
      : `📰 New Article: ${article.title}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${emailSubject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 30px 20px; }
            .article-card { border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden; margin-bottom: 20px; }
            .article-image { width: 100%; height: 200px; object-fit: cover; }
            .article-content { padding: 20px; }
            .article-title { font-size: 22px; font-weight: bold; margin-bottom: 10px; color: #333; text-decoration: none; }
            .article-excerpt { color: #666; line-height: 1.6; margin-bottom: 15px; }
            .article-meta { color: #999; font-size: 14px; margin-bottom: 15px; }
            .read-more { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: 500; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .footer a { color: #667eea; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">📰 TheBulletinBriefs</div>
              <p>Your trusted source for breaking news</p>
            </div>
            
            <div class="content">
              ${type === 'breaking_news' ? '<h2 style="color: #dc3545; margin-top: 0;">🚨 Breaking News</h2>' : ''}
              
              <div class="article-card">
                ${article.image_url ? `<img src="${article.image_url}" alt="${article.title}" class="article-image">` : ''}
                <div class="article-content">
                  <h2 class="article-title">${article.title}</h2>
                  <div class="article-meta">
                    By ${article.author} • ${new Date(article.published_at).toLocaleDateString()}
                    ${article.categories && Array.isArray(article.categories) && article.categories[0] ? ` • ${article.categories[0].name}` : ''}
                  </div>
                  <p class="article-excerpt">${article.excerpt || 'Click to read the full article'}</p>
                  <a href="${articleUrl}" class="read-more">Read Full Article</a>
                </div>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Thank you for staying informed with TheBulletinBriefs. 
                We deliver the news that matters most.
              </p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} TheBulletinBriefs. All rights reserved.</p>
              <p>
                <a href="${unsubscribeUrl}">Unsubscribe</a> | 
                <a href="${baseUrl}/newsletter-preferences">Manage Preferences</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send emails to all subscribers
    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        const { error } = await resend.emails.send({
          from: 'TheBulletinBriefs <news@thebulletinbriefs.com>',
          to: [subscriber.email],
          subject: emailSubject,
          html: emailHtml,
        });

        if (error) {
          console.error(`Failed to send email to ${subscriber.email}:`, error);
          return { email: subscriber.email, success: false, error };
        }

        return { email: subscriber.email, success: true };
      } catch (error) {
        console.error(`Error sending email to ${subscriber.email}:`, error);
        return { email: subscriber.email, success: false, error };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    logStep("Newsletter digest sent", { 
      total: subscribers.length, 
      success: successCount, 
      failed: failCount 
    });

    return new Response(JSON.stringify({
      message: "Newsletter digest sent successfully",
      stats: {
        total: subscribers.length,
        success: successCount,
        failed: failCount
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    logStep("ERROR in newsletter digest", { message: error.message });
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);