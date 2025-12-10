import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-RAZORPAY-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials not configured");
    }
    logStep("Razorpay credentials verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { planId, planName, planPrice } = await req.json();
    logStep("Request data parsed", { planId, planName, planPrice });

    // Create Razorpay subscription
    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    // Create customer first
    const customerResponse = await fetch("https://api.razorpay.com/v1/customers", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        email: user.email,
        contact: user.user_metadata?.phone || "",
        notes: {
          user_id: user.id
        }
      }),
    });

    if (!customerResponse.ok) {
      const errorData = await customerResponse.text();
      throw new Error(`Failed to create customer: ${errorData}`);
    }

    const customer = await customerResponse.json();
    logStep("Customer created", { customerId: customer.id });

    // Create subscription
    const subscriptionResponse = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: planId,
        customer_id: customer.id,
        customer_notify: 1,
        quantity: 1,
        notes: {
          user_id: user.id,
          plan_name: planName
        }
      }),
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.text();
      throw new Error(`Failed to create subscription: ${errorData}`);
    }

    const subscription = await subscriptionResponse.json();
    logStep("Subscription created", { subscriptionId: subscription.id });

    return new Response(JSON.stringify({ 
      subscriptionId: subscription.id,
      customerId: customer.id,
      status: subscription.status,
      razorpayKey: razorpayKeyId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-razorpay-subscription", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});