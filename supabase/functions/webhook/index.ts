// supabase/functions/webhook/index.ts
import Stripe from 'npm:stripe@12.14.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.6';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
  "Content-Type": "application/json"
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

// Check environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("[Webhook] Required Supabase environment variables are missing");
  throw new Error("Supabase configuration is missing");
}

if (!stripeSecretKey) {
  console.error("[Webhook] Required Stripe environment variables are missing");
  throw new Error("Stripe configuration is missing");
}

// Initialize clients
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

console.log("[Webhook] Function initialized with Stripe API version 2023-10-16");

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    });
  }
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405, 
      headers: corsHeaders 
    });
  }
  
  // Get request body as text
  const body = await req.text();
  console.log(`[Webhook] Received payload, size: ${body.length} bytes`);
  
  // For development environments, we can skip signature verification
  const isDev = !stripeWebhookSecret || stripeWebhookSecret === 'whsec_test' || stripeWebhookSecret === 'whsec_development';
  let event;
  
  try {
    if (isDev) {
      // Development mode - just parse the JSON
      console.log("[Webhook] DEVELOPMENT MODE: Skipping signature verification");
      event = JSON.parse(body);
    } else {
      // Production mode - verify the webhook signature
      const signature = req.headers.get('stripe-signature');
      if (!signature) {
        return new Response(JSON.stringify({ error: 'No signature found' }), {
          status: 400,
          headers: corsHeaders
        });
      }
      
      try {
        event = await stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
      } catch (sigError) {
        console.error(`[Webhook] Signature verification failed:`, sigError);
        return new Response(JSON.stringify({ 
          error: `Webhook signature verification failed: ${sigError.message}`
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
    }
    
    console.log(`[Webhook] Event received: ${event.type}`);
    
    // Process the event
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          console.log('[Webhook] Processing checkout.session.completed');
          const session = event.data.object;
          
          // Extract store ID from metadata
          const storeId = session.metadata?.store_id;
          if (!storeId) {
            console.error('[Webhook] No store_id found in session metadata');
            break;
          }
          
          // Get customer ID (might be newly created)
          const customerId = session.customer;
          
          // Get plan ID from metadata (or default)
          const planId = session.metadata?.plan_id || 'standard';
          
          console.log(`[Webhook] Session details - Store: ${storeId}, Customer: ${customerId}, Plan: ${planId}`);
          
          // Update store with the customer ID and plan ID
          const { data: store, error: storeError } = await supabase
            .from('stores')
            .update({
              stripe_customer_id: customerId,
              plan_id: planId,
              subscription_status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', storeId)
            .select();
          
          if (storeError) {
            console.error('[Webhook] Failed to update store:', storeError);
          } else {
            console.log(`[Webhook] Updated store ${storeId} with customer ID ${customerId}`);
          }
          
          // Check if we need to create a customer record
          const { data: customerData, error: customerError } = await supabase
            .from('stripe_customers')
            .select('id')
            .eq('customer_id', customerId)
            .maybeSingle();
          
          if (customerError) {
            console.error('[Webhook] Error checking for existing customer:', customerError);
          } else if (!customerData) {
            // Get store owner ID
            const { data: ownerData, error: ownerError } = await supabase
              .from('stores')
              .select('owner_id')
              .eq('id', storeId)
              .single();
            
            if (ownerError) {
              console.error('[Webhook] Error getting store owner:', ownerError);
            } else if (ownerData?.owner_id) {
              // Create customer record
              const { error: insertError } = await supabase
                .from('stripe_customers')
                .insert({
                  user_id: ownerData.owner_id,
                  customer_id: customerId
                });
              
              if (insertError) {
                console.error('[Webhook] Failed to create customer record:', insertError);
              } else {
                console.log(`[Webhook] Created customer record for user ${ownerData.owner_id}`);
              }
            }
          }
          
          // Handle subscription if present
          if (session.subscription) {
            console.log('[Webhook] Session includes a subscription');
            
            const subscriptionId = typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;
            
            // Fetch subscription details
            try {
              const subscription = await stripe.subscriptions.retrieve(subscriptionId);
              
              // Create or update subscription record
              const { data: subData, error: subError } = await supabase
                .from('stripe_subscriptions')
                .select('id')
                .eq('customer_id', customerId)
                .maybeSingle();
              
              if (subError) {
                console.error('[Webhook] Error checking for existing subscription:', subError);
              } else if (subData) {
                // Update existing record
                const { error: updateError } = await supabase
                  .from('stripe_subscriptions')
                  .update({
                    subscription_id: subscriptionId,
                    price_id: planId,
                    status: subscription.status,
                    current_period_start: subscription.current_period_start,
                    current_period_end: subscription.current_period_end,
                    cancel_at_period_end: subscription.cancel_at_period_end,
                    updated_at: new Date().toISOString()
                  })
                  .eq('customer_id', customerId);
                
                if (updateError) {
                  console.error('[Webhook] Error updating subscription record:', updateError);
                } else {
                  console.log(`[Webhook] Updated subscription record for customer ${customerId}`);
                }
              } else {
                // Create new subscription record
                const { error: insertError } = await supabase
                  .from('stripe_subscriptions')
                  .insert({
                    customer_id: customerId,
                    subscription_id: subscriptionId,
                    price_id: planId,
                    status: subscription.status,
                    current_period_start: subscription.current_period_start,
                    current_period_end: subscription.current_period_end,
                    cancel_at_period_end: subscription.cancel_at_period_end
                  });
                
                if (insertError) {
                  console.error('[Webhook] Error creating subscription record:', insertError);
                } else {
                  console.log(`[Webhook] Created subscription record for customer ${customerId}`);
                }
              }
            } catch (subError) {
              console.error('[Webhook] Error retrieving subscription:', subError);
            }
          }
          break;
        }
          
        case 'customer.subscription.updated': {
          console.log('[Webhook] Processing customer.subscription.updated');
          const subscription = event.data.object;
          const customerId = subscription.customer;
          
          // Update subscription record
          const { error: updateError } = await supabase
            .from('stripe_subscriptions')
            .update({
              status: subscription.status,
              current_period_start: subscription.current_period_start,
              current_period_end: subscription.current_period_end,
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString()
            })
            .eq('customer_id', customerId);
          
          if (updateError) {
            console.error('[Webhook] Error updating subscription:', updateError);
          } else {
            console.log(`[Webhook] Updated subscription for customer ${customerId}`);
          }
          
          // Update store subscription status
          const { data: customerData, error: customerError } = await supabase
            .from('stripe_customers')
            .select('user_id')
            .eq('customer_id', customerId)
            .maybeSingle();
          
          if (customerError) {
            console.error('[Webhook] Error finding customer:', customerError);
          } else if (customerData?.user_id) {
            const { data: storeData, error: storeError } = await supabase
              .from('stores')
              .select('id')
              .eq('owner_id', customerData.user_id)
              .maybeSingle();
            
            if (storeError) {
              console.error('[Webhook] Error finding store:', storeError);
            } else if (storeData?.id) {
              // Update store subscription status
              const { error: updateStoreError } = await supabase
                .from('stores')
                .update({
                  subscription_status: subscription.status,
                  subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', storeData.id);
              
              if (updateStoreError) {
                console.error('[Webhook] Error updating store subscription status:', updateStoreError);
              } else {
                console.log(`[Webhook] Updated subscription status for store ${storeData.id}`);
              }
            }
          }
          break;
        }
        
        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }
      
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: corsHeaders
      });
    } catch (processError) {
      console.error('[Webhook] Error processing event:', processError);
      return new Response(JSON.stringify({ error: `Error processing webhook: ${processError.message}` }), {
        status: 500,
        headers: corsHeaders
      });
    }
  } catch (parseError) {
    console.error('[Webhook] Error parsing webhook payload:', parseError);
    return new Response(JSON.stringify({ error: `Error parsing webhook: ${parseError.message}` }), {
      status: 400,
      headers: corsHeaders
    });
  }
});