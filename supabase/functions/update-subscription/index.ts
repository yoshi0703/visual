// supabase/functions/update-subscription/index.ts
import Stripe from 'npm:stripe@12.14.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.6';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

// Initialize Stripe with the secret key
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) {
  console.error("STRIPE_SECRET_KEY environment variable is not set or empty!");
  throw new Error("Stripe secret key is missing");
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Required Supabase environment variables are missing");
  throw new Error("Supabase configuration is missing");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

console.log("[Update-Subscription] Function loaded with Stripe API version 2023-10-16");

Deno.serve(async (req) => {
  // CORS preflight handling
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log(`[Update-Subscription] Method not allowed: ${req.method}`);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    // Parse request body
    let requestData;
    try {
      const bodyText = await req.text();
      console.log(`[Update-Subscription] Request body received, length: ${bodyText.length}`);
      requestData = JSON.parse(bodyText);
    } catch (e) {
      console.error(`[Update-Subscription] Error parsing request body:`, e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: e.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { store_id, cancel_at_period_end } = requestData;
    console.log(`[Update-Subscription] Processing request for store ${store_id}, cancel_at_period_end: ${cancel_at_period_end}`);

    // Validate required parameters
    if (!store_id) {
      console.log(`[Update-Subscription] Missing required parameter: store_id`);
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: store_id' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get store details to find Stripe customer ID
    console.log(`[Update-Subscription] Getting store details for ${store_id}`);
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id, stripe_customer_id, subscription_status, plan_id')
      .eq('id', store_id)
      .single();

    if (storeError) {
      console.error(`[Update-Subscription] Error getting store: ${storeError.message}`);
      return new Response(
        JSON.stringify({ error: `Failed to get store: ${storeError.message}` }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!storeData.stripe_customer_id) {
      console.error(`[Update-Subscription] Store ${store_id} has no Stripe customer ID`);
      return new Response(
        JSON.stringify({ error: 'Store has no associated Stripe customer' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get subscription for customer
    console.log(`[Update-Subscription] Getting subscription for customer ${storeData.stripe_customer_id}`);
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('stripe_subscriptions')
      .select('subscription_id')
      .eq('customer_id', storeData.stripe_customer_id)
      .maybeSingle();

    if (subscriptionError) {
      console.error(`[Update-Subscription] Error getting subscription: ${subscriptionError.message}`);
      return new Response(
        JSON.stringify({ error: `Failed to get subscription: ${subscriptionError.message}` }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!subscriptionData || !subscriptionData.subscription_id) {
      console.error(`[Update-Subscription] No subscription found for customer ${storeData.stripe_customer_id}`);
      return new Response(
        JSON.stringify({ error: 'No subscription found for this customer' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Update the subscription with Stripe
    try {
      console.log(`[Update-Subscription] Updating Stripe subscription ${subscriptionData.subscription_id}, cancel_at_period_end: ${cancel_at_period_end}`);
      
      const updatedSubscription = await stripe.subscriptions.update(subscriptionData.subscription_id, {
        cancel_at_period_end: cancel_at_period_end
      });
      
      console.log(`[Update-Subscription] Stripe subscription updated successfully, new status: ${updatedSubscription.status}`);

      // Update the subscription record in the database
      const { error: updateError } = await supabase
        .from('stripe_subscriptions')
        .update({
          status: updatedSubscription.status,
          cancel_at_period_end: updatedSubscription.cancel_at_period_end,
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', subscriptionData.subscription_id);

      if (updateError) {
        console.error(`[Update-Subscription] Error updating subscription record: ${updateError.message}`);
        // Don't return error here, as the Stripe update was successful
      } else {
        console.log(`[Update-Subscription] Subscription record updated in database`);
      }

      // Update the store record
      const storeStatus = cancel_at_period_end ? 'canceling' : 'active';
      const { error: storeUpdateError } = await supabase
        .from('stores')
        .update({
          subscription_status: storeStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', store_id);

      if (storeUpdateError) {
        console.error(`[Update-Subscription] Error updating store record: ${storeUpdateError.message}`);
        // Don't return error here, as the Stripe update was successful
      } else {
        console.log(`[Update-Subscription] Store record updated with status: ${storeStatus}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          subscription: {
            id: updatedSubscription.id,
            status: updatedSubscription.status,
            cancel_at_period_end: updatedSubscription.cancel_at_period_end,
            current_period_end: updatedSubscription.current_period_end
          }
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (stripeError: any) {
      console.error(`[Update-Subscription] Stripe error: ${stripeError.message}`);
      return new Response(
        JSON.stringify({ error: `Stripe API error: ${stripeError.message}` }),
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error(`[Update-Subscription] Unhandled error: ${error.message}`);
    return new Response(
      JSON.stringify({ error: `Unhandled error: ${error.message}` }),
      { status: 500, headers: corsHeaders }
    );
  }
});