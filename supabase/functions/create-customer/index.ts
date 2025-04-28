// supabase/functions/create-customer/index.ts
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

console.log("[Create-Customer] Function loaded with Stripe API version 2023-10-16");

Deno.serve(async (req) => {
  console.log(`[Create-Customer] Request received: ${req.method}`);
  
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
      console.log(`[Create-Customer] Method not allowed: ${req.method}`);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    // Parse request body
    let requestData;
    try {
      const bodyText = await req.text();
      console.log(`[Create-Customer] Request body received, length: ${bodyText.length}`);
      requestData = JSON.parse(bodyText);
    } catch (e) {
      console.error(`[Create-Customer] Error parsing request body:`, e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: e.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { store_id, email } = requestData;
    console.log(`[Create-Customer] Processing request for store ${store_id}, email: ${email ? 'provided' : 'not provided'}`);

    // Validate required parameters
    if (!store_id) {
      console.log(`[Create-Customer] Missing required parameter: store_id`);
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: store_id' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!email) {
      console.log(`[Create-Customer] Missing required parameter: email`);
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: email' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get store details
    console.log(`[Create-Customer] Getting store details for ${store_id}`);
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id, owner_id, name, stripe_customer_id')
      .eq('id', store_id)
      .single();

    if (storeError) {
      console.error(`[Create-Customer] Error getting store: ${storeError.message}`);
      return new Response(
        JSON.stringify({ error: `Failed to get store: ${storeError.message}` }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Check if store already has a customer ID
    if (storeData.stripe_customer_id) {
      console.log(`[Create-Customer] Store ${store_id} already has customer ID: ${storeData.stripe_customer_id}`);
      
      try {
        // Verify the customer exists in Stripe
        const customer = await stripe.customers.retrieve(storeData.stripe_customer_id);
        if (!customer.deleted) {
          console.log(`[Create-Customer] Existing customer verified in Stripe: ${storeData.stripe_customer_id}`);
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Store already has a valid customer ID',
              customer_id: storeData.stripe_customer_id,
              exists: true
            }),
            { status: 200, headers: corsHeaders }
          );
        }
      } catch (retrieveError) {
        console.log(`[Create-Customer] Existing customer ID invalid, will create a new one`, retrieveError);
        // Continue to create new customer as the existing one is invalid
      }
    }

    // Create a new customer in Stripe
    console.log(`[Create-Customer] Creating new Stripe customer for email: ${email}`);
    try {
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          store_id: store_id,
        },
        name: storeData.name || undefined
      });
      
      console.log(`[Create-Customer] Customer created: ${customer.id}`);
      
      // Update store with customer ID
      const { error: updateError } = await supabase
        .from('stores')
        .update({
          stripe_customer_id: customer.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', store_id);
        
      if (updateError) {
        console.error(`[Create-Customer] Error updating store: ${updateError.message}`);
        // Don't return error here as we've already created the customer
      } else {
        console.log(`[Create-Customer] Store updated with customer ID: ${customer.id}`);
      }
      
      // Create stripe_customers record if it doesn't exist
      const { data: customerData, error: customerCheckError } = await supabase
        .from('stripe_customers')
        .select('id')
        .eq('customer_id', customer.id)
        .maybeSingle();
        
      if (customerCheckError) {
        console.error(`[Create-Customer] Error checking customer record: ${customerCheckError.message}`);
      } else if (!customerData) {
        // Create new customer record
        const { error: insertError } = await supabase
          .from('stripe_customers')
          .insert({
            user_id: storeData.owner_id,
            customer_id: customer.id
          });
          
        if (insertError) {
          console.error(`[Create-Customer] Error creating customer record: ${insertError.message}`);
        } else {
          console.log(`[Create-Customer] Created customer record for user ${storeData.owner_id}`);
        }
      }
      
      // Create a blank subscription record if subscription status is active
      const { data: storeWithStatus, error: statusError } = await supabase
        .from('stores')
        .select('subscription_status')
        .eq('id', store_id)
        .single();
        
      if (!statusError && storeWithStatus?.subscription_status === 'active') {
        const { data: subscriptionData, error: subscriptionCheckError } = await supabase
          .from('stripe_subscriptions')
          .select('id')
          .eq('customer_id', customer.id)
          .maybeSingle();
          
        if (subscriptionCheckError) {
          console.error(`[Create-Customer] Error checking subscription record: ${subscriptionCheckError.message}`);
        } else if (!subscriptionData) {
          // Create blank subscription record
          const { error: insertError } = await supabase
            .from('stripe_subscriptions')
            .insert({
              customer_id: customer.id,
              status: 'active',
              price_id: storeWithStatus.price_id || null,
              current_period_start: Math.floor(Date.now() / 1000) - 86400, // 24 hours ago
              current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days from now
              cancel_at_period_end: false
            });
            
          if (insertError) {
            console.error(`[Create-Customer] Error creating subscription record: ${insertError.message}`);
          } else {
            console.log(`[Create-Customer] Created subscription record for customer ${customer.id}`);
          }
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          customer_id: customer.id,
          exists: false
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (stripeError: any) {
      console.error(`[Create-Customer] Stripe API error: ${stripeError.message}`);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Stripe API error: ${stripeError.message}` 
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error(`[Create-Customer] Unhandled error: ${error.message}`);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Unhandled error: ${error.message}` 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});