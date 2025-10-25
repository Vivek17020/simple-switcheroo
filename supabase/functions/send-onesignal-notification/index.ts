import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleId, isTest = false } = await req.json();
    
    console.log(`Sending OneSignal notification for article ${articleId} (test: ${isTest})`);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    let notificationData;

    if (isTest) {
      // Test notification
      notificationData = {
        title: '📰 Test Notification',
        url: 'https://thebulletinbriefs.in',
        message: 'This is a test notification from The Bulletin Briefs!'
      };
    } else {
      // Fetch the article
      const { data: article, error } = await supabaseClient
        .from("articles")
        .select("title, slug, excerpt")
        .eq("id", articleId)
        .eq("published", true)
        .single();

      if (error || !article) {
        console.error('Article not found:', error);
        throw new Error('Article not found');
      }

      notificationData = {
        title: `📰 New Article: ${article.title}`,
        url: `https://thebulletinbriefs.in/article/${article.slug}`,
        message: article.excerpt || article.title
      };
    }

    // Send OneSignal notification
    const oneSignalApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
    if (!oneSignalApiKey) {
      throw new Error('ONESIGNAL_REST_API_KEY not configured');
    }

    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${oneSignalApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: '1ace9244-6c2b-4b2c-852f-1583c1ff0f72',
        included_segments: ['Subscribed Users'],
        contents: { 
          en: notificationData.message 
        },
        headings: {
          en: notificationData.title
        },
        url: notificationData.url,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('OneSignal API error:', result);
      throw new Error(`OneSignal API error: ${JSON.stringify(result)}`);
    }

    console.log('OneSignal notification sent successfully:', result);

    // Log the notification
    if (!isTest) {
      await supabaseClient
        .from('seo_automation_logs')
        .insert({
          article_id: articleId,
          action_type: 'push_notification',
          service_name: 'onesignal',
          status: 'success',
          retry_count: 0,
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OneSignal notification sent successfully',
        recipients: result.recipients || 0,
        id: result.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Send OneSignal notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
