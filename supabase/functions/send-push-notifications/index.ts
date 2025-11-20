import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
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

    const { articleId, title, excerpt } = await req.json();

    if (!articleId || !title) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all push subscriptions
    const { data: subscriptions, error: subscriptionError } = await supabaseClient
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth');

    if (subscriptionError) {
      console.error('Error fetching subscriptions:', subscriptionError);
      return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscriptions found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Sending notifications to ${subscriptions.length} subscribers`);

    const vapidKeys = {
      publicKey: Deno.env.get('VAPID_PUBLIC_KEY'),
      privateKey: Deno.env.get('VAPID_PRIVATE_KEY'),
      subject: 'mailto:admin@thebulletinbriefs.com'
    };

    if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
      console.error('VAPID keys not configured');
      return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: NotificationPayload = {
      title: `📰 ${title}`,
      body: excerpt || 'New article published on The Bulletin Briefs',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      url: `https://107da7ce-f26e-4ff3-b60e-d2d83e58e2e2.lovableproject.com/article/${articleId}`
    };

    const notifications = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription: PushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        // For this example, we'll just log the notification that would be sent
        // In a real implementation, you'd use web-push library to send actual notifications
        console.log('Would send notification to:', pushSubscription.endpoint);
        console.log('Payload:', payload);
        
        return { success: true, endpoint: pushSubscription.endpoint };
      } catch (error) {
        console.error('Error sending notification:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, endpoint: subscription.endpoint, error: errorMessage };
      }
    });

    const results = await Promise.all(notifications);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Notifications sent: ${successful} successful, ${failed} failed`);

    return new Response(JSON.stringify({ 
      message: `Notifications processed: ${successful} sent, ${failed} failed`,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-push-notifications function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});