import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RAZORPAY-WEBHOOK] ${step}${detailsStr}`);
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
    logStep("Webhook received");

    const payload = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    
    if (!signature) {
      throw new Error("No signature provided");
    }

    // Parse the payload
    const event = JSON.parse(payload);
    logStep("Event parsed", { event: event.event, entity: event.payload?.subscription?.entity?.id });

    // Handle subscription events
    if (event.event === "subscription.activated" || 
        event.event === "subscription.charged" ||
        event.event === "subscription.cancelled" ||
        event.event === "subscription.paused") {
      
      const subscription = event.payload.subscription.entity;
      const payment = event.payload.payment?.entity;
      
      // Get user from subscription notes
      const userId = subscription.notes?.user_id;
      const planName = subscription.notes?.plan_name;
      
      if (!userId) {
        logStep("No user ID found in subscription notes");
        return new Response("OK", { status: 200 });
      }

      // Determine subscription status
      const isActive = event.event === "subscription.activated" || event.event === "subscription.charged";
      const subscriptionEnd = subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null;

      // Determine tier based on plan name or amount
      let subscriptionTier = "Basic";
      if (planName) {
        if (planName.toLowerCase().includes("premium")) {
          subscriptionTier = "Premium";
        } else if (planName.toLowerCase().includes("pro")) {
          subscriptionTier = "Pro";
        }
      }

      // Update user subscription in database
      const { error } = await supabaseClient
        .from("subscribers")
        .upsert({
          user_id: userId,
          email: "", // Will be updated from user profile
          razorpay_customer_id: subscription.customer_id,
          razorpay_subscription_id: subscription.id,
          subscribed: isActive,
          subscription_tier: isActive ? subscriptionTier : null,
          subscription_end: subscriptionEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        logStep("Database update error", { error: error.message });
        throw error;
      }

      logStep("Subscription updated successfully", {
        userId,
        subscribed: isActive,
        tier: subscriptionTier,
        end: subscriptionEnd
      });
    }

    return new Response("OK", {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in razorpay-webhook", { message: errorMessage });
    
    return new Response("Internal Server Error", {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
      status: 500,
    });
  }
});