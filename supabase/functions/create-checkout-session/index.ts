// supabase/functions/create-checkout-session/index.ts
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

console.log("[Create-Checkout] Function loaded with Stripe API version 2023-10-16");

Deno.serve(async (req) => {
  console.log(`[Create-Checkout] Request received: ${req.method}`);
  
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
      console.log(`[Create-Checkout] Method not allowed: ${req.method}`);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    // Parse request body
    let requestData;
    try {
      const bodyText = await req.text();
      console.log(`[Create-Checkout] Request body received, length: ${bodyText.length}`);
      requestData = JSON.parse(bodyText);
    } catch (e) {
      console.error(`[Create-Checkout] Error parsing request body:`, e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: e.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { price_id, store_id, success_url, cancel_url, mode = 'subscription', user_email, customer_id } = requestData;
    console.log(`[Create-Checkout] Processing request for store ${store_id}, price ${price_id}, mode ${mode}, email: ${user_email ? 'provided' : 'not provided'}`);

    // Validate required parameters
    if (!price_id || !store_id) {
      console.log(`[Create-Checkout] Missing required parameters`);
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: price_id and store_id are required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create and configure a new checkout session options
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: mode === 'payment' ? 'payment' : 'subscription',
      success_url: success_url || `${Deno.env.get('VITE_BASE_URL') || 'http://localhost:5173'}/onboarding?checkout_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${Deno.env.get('VITE_BASE_URL') || 'http://localhost:5173'}/onboarding?checkout_cancelled=true`,
      metadata: {
        store_id,
        plan_id: price_id // 価格IDをプランIDとして使用
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    };

    // メールアドレスがある場合は新しい顧客として作成
    if (user_email) {
      console.log(`[Create-Checkout] Creating new customer with email: ${user_email}`);
      try {
        // Try to check if customer ID exists and is valid first (if provided)
        if (customer_id && !customer_id.includes('mock')) {
          try {
            const existingCustomer = await stripe.customers.retrieve(customer_id);
            if (existingCustomer && !existingCustomer.deleted) {
              console.log(`[Create-Checkout] Using existing customer: ${customer_id}`);
              sessionOptions.customer = customer_id;
            } else {
              throw new Error('Customer exists but is deleted');
            }
          } catch (customerError) {
            console.log(`[Create-Checkout] Customer ID invalid or not found, creating new customer`);
            const customer = await stripe.customers.create({
              email: user_email,
              metadata: {
                store_id: store_id,
              }
            });
            
            console.log(`[Create-Checkout] New customer created: ${customer.id}`);
            sessionOptions.customer = customer.id;
          }
        } else {
          // No customer ID or mock customer ID - create a new one
          const customer = await stripe.customers.create({
            email: user_email,
            metadata: {
              store_id: store_id,
            }
          });
          
          console.log(`[Create-Checkout] New customer created: ${customer.id}`);
          sessionOptions.customer = customer.id;
        }
      } catch (customerCreationError) {
        console.error(`[Create-Checkout] Error creating/checking customer:`, customerCreationError);
        // Continue without customer ID if there's an error
        console.log(`[Create-Checkout] Proceeding without customer ID due to error`);
      }
    } else {
      console.log(`[Create-Checkout] No customer_email provided, Stripe will prompt for email`);
    }

    // Create the checkout session
    console.log(`[Create-Checkout] Creating checkout session with options:`, JSON.stringify(sessionOptions, null, 2));
    
    try {
      const session = await stripe.checkout.sessions.create(sessionOptions);

      console.log(`[Create-Checkout] Checkout session created: ${session.id}`);
      console.log(`[Create-Checkout] Checkout URL generated: ${session.url ? 'Yes' : 'No'}`);

      if (!session.url) {
        throw new Error('Stripe did not return a checkout URL');
      }

      // Return success response with URL and session ID
      return new Response(
        JSON.stringify({ 
          success: true, 
          sessionId: session.id, 
          url: session.url 
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (stripeError: any) {
      console.error(`[Create-Checkout] Stripe API error:`, stripeError);
      
      // インタラクティブな連携デバッグ情報
      try {
        // 現在のAPIキー状態を確認
        const accountInfo = await stripe.account.retrieve();
        console.log(`[Create-Checkout] Current Stripe account:`, {
          id: accountInfo.id,
          email: accountInfo.email ? `${accountInfo.email.substring(0, 3)}...` : null,
          country: accountInfo.country,
        });
      } catch (accountError) {
        console.error(`[Create-Checkout] Could not retrieve account info:`, accountError);
      }
      
      // 詳細なエラー情報を返す
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Stripe API error: ${stripeError.message}`,
          errorType: stripeError.type,
          errorCode: stripeError.code,
          isTestEnv: stripeSecretKey.startsWith('sk_test_')
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error("[Create-Checkout] General error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Error creating checkout session: ${error.message}` 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});