import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') || 'sk_test_51Pb8uPKqDZhXaFgVhZMpOPfJTELUbhjg5ZoHjr1MXJhfvHDIukDY97RORnUARSxbKsukwkU3jA1dKXXMYZwqP3Nt00vVbPCrJl';
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || 'whsec_fdb09f91dcf42ea72db59e37f90e6bae1a8b69eeb1bd4d11c35ddd29d5c1ea3c';
const stripe = new Stripe(stripeSecret);

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// 環境変数をチェック
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Required environment variables SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY are missing');
}

const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
);

// 開発環境用のダミーレスポンス
const isDevelopment = !stripeWebhookSecret || stripeWebhookSecret.includes('dummy') || stripeWebhookSecret.includes('test');

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
        } 
      });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // 開発環境では署名検証をスキップ
    if (isDevelopment) {
      console.log('[Development] Webhook signature verification skipped');
      return Response.json({ received: true, environment: 'development' });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    console.log(`Webhook received: ${event.type}`);

    // Process webhook event asynchronously
    EdgeRuntime.waitUntil(handleWebhookEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleWebhookEvent(event: Stripe.Event) {
  const eventObject = event.data.object as any;

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('Processing checkout.session.completed event');

        const session = eventObject as Stripe.Checkout.Session;
        
        // 店舗IDをメタデータから取得
        const storeId = session.metadata?.store_id;
        if (!storeId) {
          console.error('No store_id found in session metadata');
          return;
        }
        
        // プランIDまたはサブスクリプション情報を取得
        let planId = session.metadata?.plan_id;
        
        if (session.mode === 'subscription' && session.subscription) {
          // サブスクリプションIDを文字列として取得
          const subscriptionId = typeof session.subscription === 'string' 
            ? session.subscription 
            : session.subscription.id;
            
          try {
            // サブスクリプション情報を取得
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            
            // 店舗情報を更新
            await supabase.from('stores').update({
              subscription_status: subscription.status,
              plan_id: planId || 'standard', // デフォルト値を設定
              subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString()
            }).eq('id', storeId);
            
            console.log(`Updated store ${storeId} with subscription info`);
          } catch (err) {
            console.error('Error processing subscription:', err);
          }
        } else {
          // 非サブスクリプションモードの処理
          await supabase.from('stores').update({
            plan_id: planId || 'standard'
          }).eq('id', storeId);
          
          console.log(`Updated store ${storeId} with plan info (non-subscription)`);
        }
        
        break;
      }
      
      case 'customer.subscription.updated': {
        console.log('Processing customer.subscription.updated event');
        
        const subscription = eventObject as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // カスタマーIDから店舗を検索
        const { data: stores, error } = await supabase
          .from('stores')
          .select('id')
          .eq('stripe_customer_id', customerId);
        
        if (error || !stores || stores.length === 0) {
          console.error(`Failed to find store for customer ${customerId}:`, error);
          return;
        }

        const storeId = stores[0].id;

        // サブスクリプションの状態に応じて店舗情報を更新
        await supabase.from('stores').update({
          subscription_status: subscription.status,
          subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString()
        }).eq('id', storeId);
        
        console.log(`Subscription updated for store ${storeId}, status: ${subscription.status}`);

        // Update subscription record in the database
        const { error: updateSubscriptionError } = await supabase
          .from('stripe_subscriptions')
          .update({
            status: subscription.status as any, // Type casting to match ENUM
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            updated_at: new Date().toISOString()
          })
          .eq('customer_id', customerId);
        
        if (updateSubscriptionError) {
          console.error(`Error updating subscription record:`, updateSubscriptionError);
        } else {
          console.log(`Updated subscription record for customer ${customerId}`);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        console.log('Processing customer.subscription.deleted event');
        
        const subscription = eventObject as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // カスタマーIDから店舗を検索
        const { data: stores, error } = await supabase
          .from('stores')
          .select('id')
          .eq('stripe_customer_id', customerId);
        
        if (error || !stores || stores.length === 0) {
          console.error(`Failed to find store for customer ${customerId}:`, error);
          return;
        }

        const storeId = stores[0].id;

        // 店舗情報の更新: サブスクリプションがキャンセルされた
        await supabase.from('stores').update({
          subscription_status: 'canceled',
          updated_at: new Date().toISOString()
        }).eq('id', storeId);
        
        console.log(`Subscription canceled for store ${storeId}`);

        // サブスクリプションレコードも更新
        const { error: updateSubscriptionError } = await supabase
          .from('stripe_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('customer_id', customerId);
        
        if (updateSubscriptionError) {
          console.error(`Error updating subscription record:`, updateSubscriptionError);
        } else {
          console.log(`Updated subscription record for customer ${customerId}`);
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling webhook event:', error);
  }
}