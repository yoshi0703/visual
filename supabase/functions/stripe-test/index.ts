// supabase/functions/stripe-test/index.ts
import Stripe from 'npm:stripe@12.14.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

Deno.serve(async (req) => {
  // CORS preflight handling
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Get Stripe API key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'STRIPE_SECRET_KEY is not set' 
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 環境変数のデバッグ情報（値は表示せずに存在チェックのみ）
    const envDebug = {
      STRIPE_SECRET_KEY: !!stripeSecretKey,
      STRIPE_WEBHOOK_SECRET: !!Deno.env.get('STRIPE_WEBHOOK_SECRET'),
      VITE_STRIPE_PUBLISHABLE_KEY: !!Deno.env.get('VITE_STRIPE_PUBLISHABLE_KEY'),
      SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
      SUPABASE_ANON_KEY: !!Deno.env.get('SUPABASE_ANON_KEY'),
      SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      VITE_BASE_URL: !!Deno.env.get('VITE_BASE_URL')
    };

    // Stripeに接続してテスト
    let stripeInfo = {
      connected: false,
      isTestKey: stripeSecretKey.startsWith('sk_test_'),
      keyPrefix: stripeSecretKey.substring(0, 7) + '...',
      error: null,
      accountInfo: null,
      productsAndPrices: null
    };
    
    try {
      console.log('[StripeTest] Initializing Stripe client');
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });
      
      // アカウント情報取得
      console.log('[StripeTest] Retrieving account information');
      const account = await stripe.account.retrieve();
      stripeInfo.connected = true;
      stripeInfo.accountInfo = {
        id: account.id,
        country: account.country,
        email: account.email ? `${account.email.substring(0, 3)}...` : null,
        type: account.type
      };
      
      // プロダクトとプライス情報取得
      console.log('[StripeTest] Retrieving products and prices');
      const products = await stripe.products.list({ limit: 5, active: true });
      const prices = await stripe.prices.list({ limit: 5, active: true });
      
      // 製品と価格の概要情報
      stripeInfo.productsAndPrices = {
        productCount: products.data.length,
        priceCount: prices.data.length,
        sampleProducts: products.data.slice(0, 3).map(p => ({
          id: p.id,
          name: p.name,
          active: p.active
        })),
        samplePrices: prices.data.slice(0, 3).map(p => ({
          id: p.id,
          productId: typeof p.product === 'string' ? p.product : 'object',
          amount: p.unit_amount,
          currency: p.currency
        }))
      };
      
    } catch (stripeError) {
      console.error('[StripeTest] Stripe error:', stripeError);
      stripeInfo.error = stripeError.message;
    }

    // レスポンス作成
    return new Response(
      JSON.stringify({
        success: stripeInfo.connected,
        version: "1.1.0",
        timestamp: new Date().toISOString(),
        environment: envDebug,
        stripe: stripeInfo
      }),
      { status: stripeInfo.connected ? 200 : 500, headers: corsHeaders }
    );
  } catch (error) {
    console.error('[StripeTest] General error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Test failed: ${error.message}` 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});