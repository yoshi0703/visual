// supabase/functions/create-manage-link/index.ts
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

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

console.log("[Create-Manage-Link] Function loaded with Stripe API version 2023-10-16");

Deno.serve(async (req) => {
  console.log(`[Create-Manage-Link] Request received: ${req.method}`);
  
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
      console.log(`[Create-Manage-Link] Method not allowed: ${req.method}`);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    // Parse request body
    let requestData;
    try {
      const bodyText = await req.text();
      console.log(`[Create-Manage-Link] Request body received, length: ${bodyText.length}`);
      requestData = JSON.parse(bodyText);
    } catch (e) {
      console.error(`[Create-Manage-Link] Error parsing request body:`, e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: e.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { customer_id, return_url } = requestData;
    console.log(`[Create-Manage-Link] Processing request for customer ${customer_id}`);

    // Validate required parameters
    if (!customer_id) {
      console.log(`[Create-Manage-Link] Missing required parameter: customer_id`);
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: customer_id' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create a customer portal session
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customer_id,
        return_url: return_url || `${Deno.env.get('VITE_BASE_URL') || 'http://localhost:5173'}/subscription`,
      });

      console.log(`[Create-Manage-Link] Created customer portal session: ${session.id}`);
      console.log(`[Create-Manage-Link] Portal URL: ${session.url}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          url: session.url 
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (stripeError: any) {
      console.error(`[Create-Manage-Link] Stripe API error:`, stripeError);
      return new Response(
        JSON.stringify({ error: `Stripe API error: ${stripeError.message}` }),
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error(`[Create-Manage-Link] Unhandled error:`, error);
    return new Response(
      JSON.stringify({ error: `Server error: ${error.message}` }),
      { status: 500, headers: corsHeaders }
    );
  }
});