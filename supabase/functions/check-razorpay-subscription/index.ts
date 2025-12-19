import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-RAZORPAY-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check from our database first
    const { data: dbSubscription } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (dbSubscription && dbSubscription.subscribed) {
      // Verify with Razorpay if we have a subscription ID
      if (dbSubscription.razorpay_subscription_id) {
        const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
        
        const response = await fetch(`https://api.razorpay.com/v1/subscriptions/${dbSubscription.razorpay_subscription_id}`, {
          headers: {
            "Authorization": `Basic ${auth}`,
          },
        });

        if (response.ok) {
          const subscription = await response.json();
          
          // Update database with latest status
          await supabaseClient
            .from("subscribers")
            .upsert({
              email: user.email,
              user_id: user.id,
              razorpay_customer_id: subscription.customer_id,
              razorpay_subscription_id: subscription.id,
              subscribed: subscription.status === 'active',
              subscription_tier: dbSubscription.subscription_tier,
              subscription_end: subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

          return new Response(JSON.stringify({
            subscribed: subscription.status === 'active',
            subscription_tier: dbSubscription.subscription_tier,
            subscription_end: subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
    }

    // No active subscription found
    await supabaseClient
      .from("subscribers")
      .upsert({
        email: user.email,
        user_id: user.id,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    return new Response(JSON.stringify({ subscribed: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-razorpay-subscription", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});