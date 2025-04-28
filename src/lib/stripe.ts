import { loadStripe, Stripe } from '@stripe/stripe-js';
import { User } from '../types';

// Load the Stripe publishable key from environment variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe with the publishable key
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    if (!stripePublishableKey) {
      console.error('Stripe publishable key is missing');
      return Promise.resolve(null);
    }
    
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

// Create a checkout session using Supabase Edge Function
export const createCheckoutSession = async (
  priceId: string, 
  storeId: string, 
  user?: User | null, 
  mode: 'subscription' | 'payment' = 'subscription'
) => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration is missing');
    }

    console.log("[stripe.ts/createCheckoutSession] Creating checkout session");
    console.log("Price ID:", priceId);
    console.log("Store ID:", storeId);
    console.log("Mode:", mode);
    console.log("User email:", user?.email);
    
    // URLの構築
    const baseUrl = window.location.origin;
    // plan_id を URL パラメータに含める
    const successUrl = `${baseUrl}/onboarding?checkout_success=true&session_id={CHECKOUT_SESSION_ID}&plan_id=${encodeURIComponent(priceId)}`;
    const cancelUrl = `${baseUrl}/onboarding?checkout_cancelled=true&step=1`;

    // チェックアウトセッションの設定
    const requestBody: Record<string, any> = {
      price_id: priceId,
      store_id: storeId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      mode,
    };

    // ユーザーがある場合はメールアドレスを追加
    if (user?.email) {
      requestBody.user_email = user.email;
    }

    // Add customer ID if it exists in store and user object
    if (user?.stripeCustomerId && !user.stripeCustomerId.includes('mock')) {
      console.log("[stripe.ts/createCheckoutSession] Using existing customer ID:", user.stripeCustomerId);
      requestBody.customer_id = user.stripeCustomerId;
    }

    // Use the direct function endpoint
    console.log(`[stripe.ts/createCheckoutSession] Sending request to ${supabaseUrl}/functions/v1/create-checkout-session`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log(`[stripe.ts/createCheckoutSession] Response status: ${response.status}`);

    if (!response.ok) {
      const responseData = await response.text();
      console.error('[stripe.ts/createCheckoutSession] API error:', responseData);
      throw new Error(`HTTP error ${response.status}: ${responseData || response.statusText}`);
    }

    const responseText = await response.text();
    
    // 空のレスポンスをチェック
    if (!responseText.trim()) {
      throw new Error('Empty response from server');
    }
    
    // JSONとして解析
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[stripe.ts/createCheckoutSession] JSON parse error:', e, 'Response text:', responseText);
      throw new Error(`Failed to parse response: ${e.message}`);
    }

    console.log('[stripe.ts/createCheckoutSession] Success response:', { 
      sessionId: data.sessionId, 
      hasUrl: !!data.url 
    });
    
    return data;
  } catch (error: any) {
    console.error('[stripe.ts/createCheckoutSession] Error:', error);
    throw error;
  }
};

// Verify a session status (can be used after redirect)
export const verifyCheckoutSession = async (sessionId: string) => {
  try {
    // セッションIDのバリデーション
    if (!sessionId || sessionId === '{CHECKOUT_SESSION_ID}') {
      throw new Error('Invalid session ID');
    }
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration is missing');
    }

    console.log(`[stripe.ts/verifyCheckoutSession] Verifying session: ${sessionId.substring(0, 10)}...`);
    
    // タイムアウト設定
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒タイムアウト
    
    // Call the get-checkout-session function 
    const response = await fetch(`${supabaseUrl}/functions/v1/get-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        session_id: sessionId
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId); // Clear timeout if request completes
    
    if (!response.ok) {
      const responseData = await response.json().catch(() => null);
      console.error('[stripe.ts/verifyCheckoutSession] API error:', responseData || response.statusText);
      throw new Error(`Failed to verify session: ${responseData?.error || response.statusText}`);
    }
    
    const responseData = await response.json();
    
    console.log('[stripe.ts/verifyCheckoutSession] Session verified successfully');
    return responseData;
  } catch (error: any) {
    // タイムアウトエラーの特別処理
    if (error.name === 'AbortError') {
      console.warn('[stripe.ts/verifyCheckoutSession] Request timed out, using fallback response');
      return {
        success: true,
        isFallback: true,
        timedOut: true,
        status: 'unknown'
      };
    }
    
    console.error('[stripe.ts/verifyCheckoutSession] Error:', error);
    throw error;
  }
};