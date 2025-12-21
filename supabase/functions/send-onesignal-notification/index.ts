import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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

    let notificationData: any;

    if (isTest) {
      // Test notification
      notificationData = {
        title: '📰 Test Notification',
        url: 'https://thebulletinbriefs.in',
        message: 'This is a test notification from The Bulletin Briefs!',
        imageUrl: 'https://thebulletinbriefs.in/og-image.jpg'
      };
    } else {
      // Check throttling - max 1 notification per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentNotifications } = await supabaseClient
        .from('seo_automation_logs')
        .select('created_at')
        .eq('action_type', 'push_notification')
        .eq('service_name', 'onesignal')
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentNotifications && recentNotifications.length > 0) {
        console.log('Notification throttled - less than 1 hour since last notification');
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Notification throttled - too soon since last notification',
            throttled: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch the article with image
      const { data: article, error } = await supabaseClient
        .from("articles")
        .select("title, slug, excerpt, image_url")
        .eq("id", articleId)
        .eq("published", true)
        .single();

      if (error || !article) {
        console.error('Article not found:', error);
        throw new Error('Article not found');
      }

      notificationData = {
        title: `📰 ${article.title}`,
        url: `https://thebulletinbriefs.in/article/${article.slug}`,
        message: article.excerpt || article.title,
        imageUrl: article.image_url || 'https://thebulletinbriefs.in/og-image.jpg'
      };
    }

    // Send OneSignal notification with rich media
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
        large_icon: 'https://thebulletinbriefs.in/logo.png',
        chrome_web_icon: 'https://thebulletinbriefs.in/tb-briefs-favicon.png',
        chrome_web_badge: 'https://thebulletinbriefs.in/tb-briefs-favicon.png',
        chrome_web_image: notificationData.imageUrl,
        buttons: [
          { id: 'read', text: 'Read Now', icon: 'ic_menu_view' },
          { id: 'save', text: 'Save for Later', icon: 'ic_menu_save' }
        ],
        ttl: 86400, // 24 hours
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

      // Update push analytics
      const today = new Date().toISOString().split('T')[0];
      const recipients = result.recipients || 0;
      
      // Try to update existing record or insert new one
      const { data: existingRecord } = await supabaseClient
        .from('push_analytics')
        .select('*')
        .eq('date', today)
        .single();

      if (existingRecord) {
        await supabaseClient
          .from('push_analytics')
          .update({
            delivered: (existingRecord.delivered || 0) + recipients,
            subscribers: recipients, // Update latest subscriber count
          })
          .eq('date', today);
      } else {
        await supabaseClient
          .from('push_analytics')
          .insert({
            date: today,
            delivered: recipients,
            subscribers: recipients,
          });
      }
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

  } catch (error: any) {
    console.error('Send OneSignal notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
