// supabase/functions/get-checkout-session/index.ts
import Stripe from 'npm:stripe@12.14.0';

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

// Create Stripe instance
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

console.log("[Get-Checkout] Function loaded with Stripe API version 2023-10-16");

Deno.serve(async (req) => {
  console.log(`[Get-Checkout] Request received: ${req.method}`);
  
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
      console.log(`[Get-Checkout] Method not allowed: ${req.method}`);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    // Parse request body
    let requestData;
    try {
      const bodyText = await req.text();
      console.log(`[Get-Checkout] Request body received, length: ${bodyText.length}`);
      requestData = JSON.parse(bodyText);
    } catch (e) {
      console.error(`[Get-Checkout] Error parsing request body:`, e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: e.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { session_id } = requestData;
    console.log(`[Get-Checkout] Processing request for session ${session_id}`);

    // Validate required parameters
    if (!session_id) {
      console.log(`[Get-Checkout] Missing required parameter: session_id`);
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: session_id' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get checkout session
    try {
      console.log(`[Get-Checkout] Retrieving session ${session_id} from Stripe`);
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['subscription', 'payment_intent', 'customer', 'line_items']
      });
      
      console.log(`[Get-Checkout] Retrieved session ${session_id}`);

      // Extract important data
      const planId = session.metadata?.plan_id || 'standard';
      const storeId = session.metadata?.store_id;
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
      const subscription = session.subscription;
      const paymentStatus = session.payment_status;

      return new Response(
        JSON.stringify({ 
          success: true,
          session: {
            id: session.id,
            customer: customerId,
            payment_status: paymentStatus,
            subscription: subscription ? {
              id: typeof subscription === 'string' ? subscription : subscription.id,
              status: typeof subscription !== 'string' ? subscription.status : null
            } : null,
          },
          plan_id: planId,
          store_id: storeId,
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (error) {
      console.error(`[Get-Checkout] Error retrieving session:`, error);
      return new Response(
        JSON.stringify({ error: `Failed to retrieve checkout session: ${error.message}` }),
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error("[Get-Checkout] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Error retrieving checkout session: ${error.message}` 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});