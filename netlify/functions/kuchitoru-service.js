// netlify/functions/kuchitoru-service.js
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase credentials missing');
  // ここでエラーを投げるか、デフォルト値を設定するか、処理を中断するか検討
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event, context) => {
  // CORS headers (必要に応じて環境変数でオリジンを制御)
  const headers = {
    'Access-Control-Allow-Origin': '*', // 本番環境では具体的なオリジンに限定推奨
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  // Handle POST request
  if (event.httpMethod !== 'POST') {
    console.warn(`Method Not Allowed: ${event.httpMethod}`);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const payload = JSON.parse(event.body);
    const { action, data } = payload;

    if (!action) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, error: 'Missing action parameter' })
        };
    }

    console.log(`[Serverless Function] Received Action: ${action}`);

    // Handle different actions
    // ★★★ インタビューチャット関連の case を削除 ★★★
    switch (action) {
      case 'register-account':
        return await handleRegisterAccount(data, headers);
      case 'select-plan':
        return await handleSelectPlan(data, headers);
      case 'analyze-website':
        return await handleAnalyzeWebsite(data, headers);
      case 'update-store-settings':
        return await handleUpdateStoreSettings(data, headers);
      case 'save-chat-settings': // AIのトーン設定などは残す
        return await handleSaveChatSettings(data, headers);
      case 'save-coupon-settings':
        return await handleSaveCouponSettings(data, headers);
      case 'generate-qr-code':
        return await handleGenerateQRCode(data, headers);
      // case 'generate-chat-response': // 削除
      //   // return await handleGenerateChatResponse(data, headers);
      //   console.warn("Action 'generate-chat-response' is deprecated. Use Supabase Edge Function '/streaming-chat' instead.");
      //   return { statusCode: 410, headers, body: JSON.stringify({ success: false, error: "Action 'generate-chat-response' is deprecated."})};
      // case 'generate-review': // 削除
      //   // return await handleGenerateReview(data, headers);
      //    console.warn("Action 'generate-review' is deprecated. Use Supabase Edge Function '/streaming-chat' instead.");
      //   return { statusCode: 410, headers, body: JSON.stringify({ success: false, error: "Action 'generate-review' is deprecated."})};
      case 'create-payment-intent': // 残す（別のStripe Functionに移行する可能性も）
        return await handleCreatePaymentIntent(data, headers);
      default:
        console.warn(`Unknown action: ${action}`);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: `Unknown action: ${action}` })
        };
    }
  } catch (error) {
    console.error('Function error:', error);
    // エラーの詳細をログには出すが、クライアントには汎用的なメッセージを返す
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        // error: `Server error: ${error.message}` // 本番では詳細なエラーメッセージを返さない方が良い場合も
        error: 'An unexpected server error occurred.'
      })
    };
  }
};

// --- Action Handlers (Chat/Review 関連以外) ---

// Handle account registration
async function handleRegisterAccount(data, headers) {
  // ... (変更なし) ...
  const { storeName, email, password, industry } = data;

  if (!email || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Email and password are required'
      })
    };
  }

  try {
    // 1. Create a new user with Supabase Auth
    const { data: userData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: storeName || email.split('@')[0]
        }
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      // ユーザーに返すエラーメッセージを調整
      const errorMessage = authError.message.includes("User already registered")
        ? "このメールアドレスは既に使用されています。"
        : "アカウント登録中にエラーが発生しました。";
      return {
        statusCode: 400, // 既に登録済みは 409 Conflict でも良い
        headers,
        body: JSON.stringify({
          success: false,
          error: errorMessage
        })
      };
    }

    if (!userData.user) {
       // 通常、authError がなければ user は存在するはずだが念のため
      console.error('User creation failed unexpectedly after successful signup.');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'アカウント登録に失敗しました。管理者に連絡してください。'
        })
      };
    }

    const userId = userData.user.id;

    // 2. Create a store for the new user
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .insert({
        owner_id: userId,
        name: storeName || email.split('@')[0], // デフォルト名を生成
        industry: industry || null
      })
      .select()
      .single();

    if (storeError) {
      console.error('Store creation error:', storeError);
      // ここでユーザー削除を試みるのは難しい（Admin権限が必要なため）
      // 運用で後からクリーンアップするか、エラーログを監視して手動対応
      console.error(`Failed to create store for user ${userId}. Manual cleanup might be required.`);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: `店舗情報の作成に失敗しました: ${storeError.message}` // 詳細メッセージはログに記録し、ユーザーには汎用メッセージを返すことも検討
        })
      };
    }

    console.log(`Account registered successfully for user ${userId}, store ${storeData.id}`);
    return {
      statusCode: 201, // Created
      headers,
      body: JSON.stringify({
        success: true,
        message: 'アカウント登録が完了しました。確認メールをご確認ください。', // メッセージ調整
        data: {
          userId,
          storeId: storeData.id
        },
        store: storeData // 必要であれば店舗情報も返す
      })
    };
  } catch (error) {
    console.error('Registration process error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `アカウント登録処理中に予期せぬエラーが発生しました。`
      })
    };
  }
}


// Plan selection - redirects to Supabase Edge Function (or handles locally if needed)
async function handleSelectPlan(data, headers) {
  // ... (変更なし) ...
    const { storeId, planId } = data;

  if (!storeId || !planId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Store ID and plan ID are required'
      })
    };
  }

  try {
    // Update store with selected plan
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .update({ plan_id: planId, updated_at: new Date().toISOString() }) // updated_at も更新
      .eq('id', storeId)
      .select()
      .single();

    if (storeError) {
      console.error('Plan selection error:', storeError);
      return {
        statusCode: 500, // DBエラーは500
        headers,
        body: JSON.stringify({
          success: false,
          error: `Plan selection failed: ${storeError.message}` // エラーメッセージ確認
        })
      };
    }
    if (!storeData) {
         return {
            statusCode: 404, // Store が見つからない場合
            headers,
            body: JSON.stringify({ success: false, error: 'Store not found.' })
        };
    }

    // ここではプランを選択したことをDBに記録するだけ
    // Stripe Checkout などへのリダイレクト指示はフロントエンドで行うか、
    // もしくは別の専用 Function (e.g., /create-checkout-session) を呼び出す
    console.log(`Plan ${planId} selected for store ${storeId}`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Plan selected successfully.',
        // redirectToStripe: true, // このFunctionの責務ではないかも
        store: storeData // 更新後の店舗情報を返す
      })
    };
  } catch (error) {
    console.error('Plan selection process error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `An unexpected error occurred during plan selection.`
      })
    };
  }
}

// Website analysis (mock implementation - should be replaced with actual analysis if needed)
async function handleAnalyzeWebsite(data, headers) {
  // ... (変更なし、ただしモック実装であることに注意) ...
  const { storeId, url } = data;

  if (!storeId || !url) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Store ID and URL are required'
      })
    };
  }

  // URL形式のバリデーションを追加するとより良い
  try {
    new URL(url);
  } catch (_) {
    return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid URL format.' })
    };
  }

  try {
    // Update the website URL in the database
    const { data: updatedStore, error: updateError } = await supabase
      .from('stores')
      .update({ website_url: url, updated_at: new Date().toISOString() })
      .eq('id', storeId)
      .select()
      .single();

    if (updateError) {
      console.error('Website URL update error:', updateError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Website URL update failed: ${updateError.message}`
        })
      };
    }
     if (!updatedStore) {
         return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ success: false, error: 'Store not found.' })
        };
    }

    // --- Website Analysis Logic ---
    // ここで実際にウェブサイトを分析する処理を入れる (例: Puppeteer や Cheerio を使う Function を呼び出すなど)
    // 現在はモック実装
    console.log(`Mock analysis for URL: ${url} for store ${storeId}`);
    // DBから取得した情報や固定値を返す
    const extractedData = {
      name: updatedStore.name || '分析された店舗名', // DBの値を使う
      description: updatedStore.description || 'ウェブサイトから抽出された店舗の説明文 (モック)',
      features: updatedStore.features || ['特徴1 (モック)', '特徴2 (モック)'],
      location: updatedStore.location || '分析された場所 (モック)'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Website URL updated and mock analysis performed.',
        extractedData, // 分析結果 (モック)
        store: updatedStore // 更新後の店舗情報
      })
    };
  } catch (error) {
    console.error('Website analysis/update error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `An unexpected error occurred during website analysis.`
      })
    };
  }
}

// Store settings update
async function handleUpdateStoreSettings(data, headers) {
  // ... (変更なし) ...
  const { storeId, updates } = data;

  if (!storeId || !updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Store ID and a non-empty updates object are required'
      })
    };
  }

  try {
    console.log('Attempting to update store settings:', { storeId, updates });

    // --- Data Validation and Sanitization ---
    // updates オブジェクトの内容をバリデーション・サニタイズする
    // 例: name は文字列、features は文字列配列、など
    let processedUpdates = { ...updates };

    // features が文字列で来た場合に配列に変換 (元のロジックを踏襲)
    if (processedUpdates.features && !Array.isArray(processedUpdates.features)) {
      if (typeof processedUpdates.features === 'string') {
        processedUpdates.features = processedUpdates.features
          .split(',')
          .map(f => f.trim())
          .filter(Boolean); // 空文字列を除去
      } else {
        console.warn(`Invalid features format received for store ${storeId}. Setting to empty array.`);
        processedUpdates.features = []; // 不正な形式なら空配列に
      }
    }
    // 他のフィールドも必要に応じてバリデーション

    // 更新可能なフィールドを制限する (不正なキーでの更新を防ぐ)
    const allowedFields = ['name', 'industry', 'description', 'features', 'location', 'website_url', /* 他の設定項目 */];
    const finalUpdates: Record<string, any> = {};
    for (const key of Object.keys(processedUpdates)) {
        if (allowedFields.includes(key)) {
            finalUpdates[key] = processedUpdates[key];
        } else {
            console.warn(`Store update ignored invalid field: ${key}`);
        }
    }

    if (Object.keys(finalUpdates).length === 0) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, error: 'No valid fields to update.' })
        };
    }

    // Add updated_at timestamp
    finalUpdates.updated_at = new Date().toISOString();

    // Update store settings in Supabase
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .update(finalUpdates)
      .eq('id', storeId)
      .select()
      .single();

    if (storeError) {
      console.error('Store update error:', storeError);
      // エラーコードによってレスポンスを分ける (例: P0001 など RLS 関連)
      return {
        statusCode: 500, // または 403 Forbidden など
        headers,
        body: JSON.stringify({
          success: false,
          error: `Store update failed: ${storeError.message}`
        })
      };
    }
     if (!storeData) {
         return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ success: false, error: 'Store not found or no changes detected.' })
        };
    }

    console.log('Store updated successfully:', storeData.id);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Store settings updated successfully.',
        store: storeData // 更新後の店舗情報を返す
      })
    };
  } catch (error) {
    console.error('Store settings update process error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `An unexpected error occurred while updating store settings.`
      })
    };
  }
}

// AI chat settings (Tone, Welcome/Thanks messages)
async function handleSaveChatSettings(data, headers) {
  // ... (変更なし) ...
    const { storeId, settings } = data;

  if (!storeId || !settings || typeof settings !== 'object' || Object.keys(settings).length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Store ID and a non-empty settings object are required'
      })
    };
  }

  // 更新可能なチャット設定フィールドを定義
  const allowedChatFields = ['ai_tone', 'welcome_message', 'thanks_message'];
  const finalSettings: Record<string, any> = {};

  for (const key of Object.keys(settings)) {
      if (allowedChatFields.includes(key)) {
          // バリデーション (例: ai_tone が指定の値か)
          if (key === 'ai_tone' && !['friendly', 'formal', 'casual'].includes(settings[key])) {
              console.warn(`Invalid ai_tone value: ${settings[key]}. Ignoring.`);
              continue;
          }
          // 簡単なサニタイズ (例: メッセージの前後の空白削除)
          if (typeof settings[key] === 'string') {
              finalSettings[key] = settings[key].trim();
          } else {
               finalSettings[key] = settings[key]; // そのまま
          }
      } else {
          console.warn(`Chat settings update ignored invalid field: ${key}`);
      }
  }

   if (Object.keys(finalSettings).length === 0) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, error: 'No valid chat settings fields to update.' })
        };
    }

  // Add updated_at timestamp
  finalSettings.updated_at = new Date().toISOString();

  try {
    // Update chat settings in the stores table
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .update(finalSettings)
      .eq('id', storeId)
      .select() // 更新後の全情報を取得
      .single();

    if (storeError) {
      console.error('Chat settings update error:', storeError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Chat settings update failed: ${storeError.message}`
        })
      };
    }
     if (!storeData) {
         return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ success: false, error: 'Store not found.' })
        };
    }

    console.log(`Chat settings updated for store ${storeId}`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Chat settings saved successfully.',
        store: storeData // 更新後の店舗情報を返す
      })
    };
  } catch (error) {
    console.error('Chat settings save process error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `An unexpected error occurred while saving chat settings.`
      })
    };
  }
}

// Coupon settings
async function handleSaveCouponSettings(data, headers) {
  // ... (変更なし) ...
  const { storeId, settings } = data;

  if (!storeId || !settings || typeof settings !== 'object' || Object.keys(settings).length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Store ID and a non-empty settings object are required'
      })
    };
  }

  // 更新可能なクーポン設定フィールド
  const allowedCouponFields = [
      'coupon_enabled',
      'coupon_type', // 'percent', 'fixed', 'free_item', 'none' など
      'coupon_value', // number or null
      'coupon_free_item_desc', // string or null
      'coupon_condition', // string or null
      'coupon_code' // string or null
  ];
  const finalSettings: Record<string, any> = {};

   // Process and validate settings
  for (const key of Object.keys(settings)) {
    if (allowedCouponFields.includes(key)) {
        finalSettings[key] = settings[key]; // まずコピー
    } else {
        console.warn(`Coupon settings update ignored invalid field: ${key}`);
    }
  }

  // タイプに応じた値の調整とバリデーション
  const couponType = finalSettings.coupon_type;
  if (couponType === 'percent' || couponType === 'fixed') {
      let numValue = parseFloat(finalSettings.coupon_value);
      if (isNaN(numValue) || numValue < 0) {
          // エラーを返すか、デフォルト値にするか
          console.warn(`Invalid coupon_value for type ${couponType}: ${finalSettings.coupon_value}. Setting to null.`);
          finalSettings.coupon_value = null;
          // return { statusCode: 400, headers, body: JSON.stringify({success: false, error: 'Invalid coupon value'}) };
      } else {
          finalSettings.coupon_value = numValue;
      }
      finalSettings.coupon_free_item_desc = null; // 不要なフィールドをクリア
  } else if (couponType === 'free_item') {
      finalSettings.coupon_value = null; // 不要なフィールドをクリア
      if (typeof finalSettings.coupon_free_item_desc !== 'string' || finalSettings.coupon_free_item_desc.trim() === '') {
           console.warn(`Missing or empty coupon_free_item_desc for type ${couponType}.`);
           // return { statusCode: 400, headers, body: JSON.stringify({success: false, error: 'Free item description is required'}) };
      } else {
          finalSettings.coupon_free_item_desc = finalSettings.coupon_free_item_desc.trim();
      }
  } else { // 'none' or other types
      finalSettings.coupon_value = null;
      finalSettings.coupon_free_item_desc = null;
      finalSettings.coupon_condition = null;
      finalSettings.coupon_code = null;
      // 'coupon_enabled' を false にする方が良いかも
      // finalSettings.coupon_enabled = false;
  }

  // enabled フラグの確認
  if (typeof finalSettings.coupon_enabled !== 'boolean') {
      finalSettings.coupon_enabled = false; // デフォルトは無効
  }

  // Add updated_at timestamp
  finalSettings.updated_at = new Date().toISOString();

  console.log('Processed coupon settings to update:', finalSettings);

  try {
    // Update coupon settings in the stores table
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .update(finalSettings)
      .eq('id', storeId)
      .select()
      .single();

    if (storeError) {
      console.error('Coupon settings update error:', storeError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Coupon settings update failed: ${storeError.message}`
        })
      };
    }
     if (!storeData) {
         return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ success: false, error: 'Store not found.' })
        };
    }

    console.log(`Coupon settings updated for store ${storeId}`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Coupon settings saved successfully.',
        store: storeData
      })
    };
  } catch (error) {
    console.error('Coupon settings save process error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `An unexpected error occurred while saving coupon settings.`
      })
    };
  }
}

// QR code generation
async function handleGenerateQRCode(data, headers) {
  // ... (変更なし) ...
    const { storeId } = data;
  console.log(`[QR Generation] Starting QR generation for store: ${storeId}`);

  if (!storeId) {
    console.error(`[QR Generation] Missing storeId parameter`);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Store ID is required' })
    };
  }

  try {
    // Get store data first to ensure it exists
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id, name') // 必要なカラムだけ取得
      .eq('id', storeId)
      .single();

    if (storeError || !storeData) {
      console.error('[QR Generation] Store fetch error or not found:', storeError);
      const statusCode = storeError && storeError.code === 'PGRST116' ? 404 : 500; // PostgRESTのエラーコード確認
      const errorMessage = statusCode === 404 ? 'Store not found.' : `Store fetch failed: ${storeError?.message}`;
      return {
        statusCode,
        headers,
        body: JSON.stringify({ success: false, error: errorMessage })
      };
    }
    console.log(`[QR Generation] Store data fetched successfully: ${storeData.name}`);

    // Generate interview URL
    // Base URL は環境変数から取得すべき
    const baseUrl = process.env.VITE_BASE_URL || 'https://yourapp.com'; // デフォルト値を設定
    if (baseUrl === 'https://yourapp.com') {
        console.warn("[QR Generation] VITE_BASE_URL environment variable is not set. Using default.");
    }
    console.log(`[QR Generation] Using base URL: ${baseUrl}`);
    const interviewUrl = `${baseUrl}/interview/${storeId}`;
    console.log(`[QR Generation] Interview URL created: ${interviewUrl}`);

    // Generate QR code URL using QR Server API (他のサービスやライブラリも検討可能)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(interviewUrl)}`;
    console.log(`[QR Generation] QR Code URL generated`);

    // Update store with QR code URL and interview URL
    const { data: updatedStore, error: updateError } = await supabase
      .from('stores')
      .update({
        qr_code_url: qrCodeUrl,
        interview_url: interviewUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', storeId)
      .select() // 更新後の全情報を返す
      .single();

    if (updateError) {
      console.error('[QR Generation] QR code update error:', updateError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: `QR code update failed: ${updateError.message}`
        })
      };
    }
     if (!updatedStore) {
         // update が成功しても select で null が返るケースは考えにくいが念のため
         return {
            statusCode: 404, // or 500
            headers,
            body: JSON.stringify({ success: false, error: 'Failed to retrieve updated store data after QR generation.' })
        };
    }

    console.log(`[QR Generation] Store ${storeId} updated with QR code URL successfully.`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'QR code generated and saved successfully.',
        qrCodeUrl,
        interviewUrl,
        store: updatedStore // 更新後の店舗情報を返す
      })
    };
  } catch (error) {
    console.error('[QR Generation] QR code generation process error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `An unexpected error occurred during QR code generation.`
      })
    };
  }
}

// Handle payment intent creation (Mock - should integrate with Stripe or similar)
async function handleCreatePaymentIntent(data, headers) {
  // ... (変更なし、ただしモック実装であることに注意) ...
    const { storeId, amount, currency = 'jpy', description = 'Service Fee' } = data;

  if (!storeId || amount === undefined || amount === null || typeof amount !== 'number' || amount <= 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Store ID and a valid positive amount are required'
      })
    };
  }

  // ここで実際に Stripe API を呼び出す処理を入れる
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  try {
     // --- Stripe Integration ---
     // 1. Get store information (e.g., customer ID if stored)
     /*
     const { data: storeData, error: storeError } = await supabase
       .from('stores')
       .select('stripe_customer_id, name') // 例
       .eq('id', storeId)
       .single();
     if (storeError || !storeData) { ... handle error ... }
     */

     // 2. Create Payment Intent using Stripe SDK
     /*
     const paymentIntent = await stripe.paymentIntents.create({
       amount: amount, // Stripe は最小通貨単位 (例: JPYならそのまま、USDならセント)
       currency: currency,
       // customer: storeData.stripe_customer_id, // 既存顧客の場合
       description: description,
       metadata: { store_id: storeId },
       // payment_method_types: ['card'], // 必要に応じて
     });
     const clientSecret = paymentIntent.client_secret;
     */
     // --- Mock Implementation ---
     console.log(`[Mock Payment Intent] Creating for store ${storeId}, amount ${amount} ${currency}`);
     const mockClientSecret = `pi_mock_${Date.now()}_secret_${Math.random().toString(16).slice(2)}`;


    return {
      statusCode: 200, // または 201 Created
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Mock Payment Intent created successfully.',
        clientSecret: mockClientSecret, // clientSecret を返す
        amount: amount,
        currency: currency,
        description: description
      })
    };
  } catch (error) {
    console.error('[Payment Intent] Creation error:', error);
    // Stripe エラーの場合、エラータイプに応じて処理を変える
    // if (error.type === 'StripeCardError') { ... }
    return {
      statusCode: 500, // Stripe API エラーは 500 or 400
      headers,
      body: JSON.stringify({
        success: false,
        error: `Payment Intent creation failed: ${error.message}` // 本番ではエラーメッセージを精査
      })
    };
  }
}


// ★★★ 削除された関数 ★★★
// handleGenerateChatResponse
// generateTopicQuestion
// generateFollowUpQuestion
// generatePoliteResponse
// handleGenerateReview
// convertToReviewStyle