// supabase/functions/website-analysis/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2.39.6';
import axios from 'npm:axios@1.6.7';
import { load } from 'npm:cheerio@1.0.0-rc.12';
import { OpenAI } from 'npm:openai@4.25.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

// 環境変数の読み込み
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

// クライアントの初期化
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Required environment variables SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY are missing");
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');
const openai = new OpenAI({
  apiKey: openaiApiKey || '',
});

// Jina Reader APIの設定
const JINA_READER_BASE_URL = 'https://r.jina.ai/';

console.log("[Website-Analysis] Function loaded");

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
      console.log(`[Website-Analysis] Method not allowed: ${req.method}`);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    // Parse request body
    let requestData;
    try {
      const bodyText = await req.text();
      console.log(`[Website-Analysis] Request body received, length: ${bodyText.length}`);
      requestData = JSON.parse(bodyText);
    } catch (e) {
      console.error(`[Website-Analysis] Error parsing request body:`, e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: e.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { storeId, url } = requestData;
    console.log(`[Website-Analysis] Processing request for store ${storeId}, url: ${url}`);

    // Validate required parameters
    if (!storeId || !url) {
      console.log(`[Website-Analysis] Missing required parameters`);
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: storeId and url are required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get store details
    console.log(`[Website-Analysis] Getting store details for ${storeId}`);
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (storeError) {
      console.error(`[Website-Analysis] Error getting store: ${storeError.message}`);
      return new Response(
        JSON.stringify({ error: `Failed to get store: ${storeError.message}` }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Update store with the website URL
    console.log(`[Website-Analysis] Updating store ${storeId} with website URL: ${url}`);
    const { data: updatedStore, error: updateError } = await supabase
      .from('stores')
      .update({ 
        website_url: url,
        updated_at: new Date().toISOString() 
      })
      .eq('id', storeId)
      .select();

    if (updateError) {
      console.error(`[Website-Analysis] Error updating store: ${updateError.message}`);
      return new Response(
        JSON.stringify({ error: `Failed to update store: ${updateError.message}` }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 初期化: 抽出データ、ログ、詳細情報
    let logs = [];
    let extractedData = {
      name: storeData.name || '',
      description: storeData.description || '',
      features: storeData.features || [],
      location: storeData.location || ''
    };
    let details = { 
      fallback: false,
      method: 'unknown',
      bytesAnalyzed: 0,
      url,
      processingTime: 0
    };
    
    const startTime = Date.now();
    
    try {
      // ステップ1: JinaのReader APIを使用してウェブサイトコンテンツを取得
      console.log(`[Website-Analysis] Using Jina Reader API to fetch content from ${url}`);
      logs.push(`Jina Reader API: Fetching content from ${url}`);

      // Jina Reader APIのURLを構築
      const encodedUrl = encodeURIComponent(url);
      const jinaReaderUrl = `${JINA_READER_BASE_URL}${encodedUrl}`;
      
      // APIリクエストヘッダー
      const headers = {
        'Accept': 'application/json',
        'x-with-generated-alt': 'true',  // 画像のalt属性を生成
        'Content-Type': 'application/json'
      };
      
      // Jina Reader APIを呼び出し
      const jinaResponse = await axios.get(jinaReaderUrl, {
        headers,
        timeout: 15000 // 15秒タイムアウト
      });
      
      // 応答をチェック
      if (jinaResponse.data && jinaResponse.data.content) {
        const content = jinaResponse.data.content;
        details.bytesAnalyzed = content.length;
        details.method = 'jina';
        
        logs.push(`Jina Reader API: Successfully received content (${content.length} characters)`);
        
        // タイトルが存在する場合は店舗名として使用
        if (jinaResponse.data.title) {
          extractedData.name = jinaResponse.data.title.trim();
          logs.push(`Extracted title from Jina: ${extractedData.name}`);
        }
        
        // ステップ2: OpenAI APIを使用してコンテンツから情報を抽出
        const aiResult = await extractInfoWithAI(content, url);
        
        if (aiResult.success) {
          // AIの抽出結果を元のデータとマージ
          extractedData = {
            ...extractedData,
            ...aiResult.data
          };
          
          details.aiConfidence = aiResult.confidence || 0;
          logs.push(`AI Extraction: Successfully extracted information using AI (confidence: ${details.aiConfidence})`);
        } else {
          logs.push(`AI Extraction: Partial failure - ${aiResult.error}`);
          // 部分的に失敗した場合でも取得できたデータは使用
          details.fallback = true;
        }
      } else {
        logs.push('Jina Reader API: No content received');
        throw new Error('No content received from Jina Reader API');
      }
    } catch (jinaError) {
      console.error(`[Website-Analysis] Jina Reader API error: ${jinaError.message}`);
      logs.push(`Jina Reader API Error: ${jinaError.message}`);
      
      // フォールバック: 直接アクセスを試みる
      try {
        logs.push('Attempting direct fetch as fallback...');
        
        const directResponse = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
          }
        });
        
        const html = directResponse.data;
        
        if (html && typeof html === 'string') {
          logs.push(`Direct fetch: Successfully fetched website HTML (${html.length} bytes)`);
          details.bytesAnalyzed = html.length;
          details.method = 'direct';
          
          // Cheerioを使用して基本的な情報を抽出
          const $ = load(html);
          
          // タイトル抽出
          extractedData.name = $('title').text().trim() || extractedData.name;
          logs.push(`Direct fetch: Extracted title: ${extractedData.name}`);
          
          // メタディスクリプション抽出
          const metaDescription = $('meta[name="description"]').attr('content');
          if (metaDescription) {
            extractedData.description = metaDescription.trim();
            logs.push(`Direct fetch: Extracted description: ${extractedData.description}`);
          }
          
          // キーワード抽出
          const metaKeywords = $('meta[name="keywords"]').attr('content');
          if (metaKeywords) {
            extractedData.features = metaKeywords.split(',').map(item => item.trim()).filter(item => item.length > 0);
            logs.push(`Direct fetch: Extracted keywords: ${extractedData.features.join(', ')}`);
          }
          
          // 住所抽出の試み (日本の住所パターン)
          const addressPattern = /〒\d{3}-\d{4}[^<>\r\n]+[都道府県][^<>\r\n]+[市区町村][^<>\r\n]+/;
          const bodyText = $('body').text();
          const addressMatch = bodyText.match(addressPattern);
          if (addressMatch) {
            extractedData.location = addressMatch[0].trim();
            logs.push(`Direct fetch: Extracted location: ${extractedData.location}`);
          }
          
          // AI抽出も試みる
          try {
            const aiResult = await extractInfoWithAI(html, url);
            if (aiResult.success) {
              // 直接抽出した値とAI抽出の値をマージ
              // 空の値はAI抽出値で上書き
              extractedData = {
                name: extractedData.name || aiResult.data.name || '',
                description: extractedData.description || aiResult.data.description || '',
                features: extractedData.features.length > 0 ? extractedData.features : (aiResult.data.features || []),
                location: extractedData.location || aiResult.data.location || ''
              };
              
              details.aiConfidence = aiResult.confidence || 0;
              logs.push(`Direct fetch + AI: Enhanced extraction with AI (confidence: ${details.aiConfidence})`);
            }
          } catch (aiError) {
            logs.push(`Direct fetch: AI enhancement failed - ${aiError.message}`);
          }
          
          details.fallback = true;
        } else {
          throw new Error('Invalid HTML received from direct fetch');
        }
      } catch (directError) {
        console.error(`[Website-Analysis] Direct fetch also failed: ${directError.message}`);
        logs.push(`Direct fetch also failed: ${directError.message}`);
        
        // 完全に失敗した場合はフォールバックデータを使用
        details.fallback = true;
        details.method = 'complete_fallback';
        
        // 最終手段: すでに保存されているストアデータを使用
        logs.push('Using existing store data as complete fallback');
      }
    } finally {
      // 処理時間の計算
      const endTime = Date.now();
      details.processingTime = endTime - startTime;
      logs.push(`Total processing time: ${details.processingTime}ms`);
    }

    console.log(`[Website-Analysis] Analysis completed for ${url}`);

    // Return the extracted data
    return new Response(
      JSON.stringify({
        success: true,
        extractedData,
        store: updatedStore[0],
        details,
        logs
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error(`[Website-Analysis] Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Server error: ${error instanceof Error ? error.message : String(error)}` 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});

/**
 * OpenAI APIを使用してコンテンツから情報を抽出する関数
 * @param {string} content - 分析対象のコンテンツ
 * @param {string} url - 対象のURL
 * @returns {Promise<{success: boolean, data?: object, confidence?: number, error?: string}>}
 */
async function extractInfoWithAI(content: string, url: string) {
  try {
    // 長すぎるコンテンツの場合は切り詰め
    const truncatedContent = content.length > 15000 ? content.substring(0, 15000) + '...' : content;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `あなたはウェブサイトから店舗情報を抽出するAIアシスタントです。以下のウェブサイトコンテンツから店舗に関する以下の情報を抽出してください:
          
1. 店舗名（name）- 明確な店舗名が見つからない場合はウェブサイトのタイトルを使用
2. 店舗の説明・概要（description）- 100〜300文字程度で店舗の主な特徴や提供するサービスをまとめてください
3. 特徴・キーワード（features）- 店舗の特徴を表すキーワードを抽出してください（5〜10個程度）
4. 場所・住所（location）- 店舗の所在地・住所を抽出してください

レスポンスは必ずJSON形式で返してください。JSONスキーマは次の通りです:
{
  "name": "string",
  "description": "string",
  "features": ["string"],
  "location": "string"
}

情報が見つからない場合は空文字列または空の配列を返してください。推測は最小限に留め、サイトに明示的に記載されている情報を優先してください。

また、それぞれの情報について、1〜10のスケールで信頼度も評価してください（10が最も信頼度が高い）。信頼度の評価は別のJSONフィールドに含めてください:
{
  "confidence": {
    "name": number,
    "description": number,
    "features": number,
    "location": number
  }
}`
        },
        {
          role: "user",
          content: `URL: ${url}\n\nコンテンツ:\n${truncatedContent}`
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0].message.content;
    
    if (responseContent) {
      try {
        const extractedInfo = JSON.parse(responseContent);
        
        // 必要なフィールドを抽出
        const data = {
          name: typeof extractedInfo.name === 'string' ? extractedInfo.name : '',
          description: typeof extractedInfo.description === 'string' ? extractedInfo.description : '',
          features: Array.isArray(extractedInfo.features) ? extractedInfo.features : [],
          location: typeof extractedInfo.location === 'string' ? extractedInfo.location : ''
        };
        
        // 信頼度情報の抽出と正規化
        let confidence = 0.75; // デフォルト値
        
        if (extractedInfo.confidence) {
          // 各フィールドの信頼度の平均値を算出（1-10スケールから0-1スケールに変換）
          const confidenceValues = [
            'name', 'description', 'features', 'location'
          ].map(field => {
            const value = extractedInfo.confidence[field];
            return typeof value === 'number' ? value / 10 : 0.5;
          });
          
          confidence = confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
        }
        
        return {
          success: true,
          data,
          confidence
        };
      } catch (parseError) {
        console.error(`[extractInfoWithAI] Error parsing AI response: ${parseError.message}`);
        return {
          success: false,
          error: 'AIレスポンスのパースに失敗しました',
          data: {
            name: '',
            description: '',
            features: [],
            location: ''
          }
        };
      }
    }
    
    return {
      success: false,
      error: 'AIから有効なレスポンスを受信できませんでした',
      data: {
        name: '',
        description: '',
        features: [],
        location: ''
      }
    };
  } catch (error) {
    console.error(`[extractInfoWithAI] AI extraction error: ${error.message}`);
    return {
      success: false,
      error: `AI抽出エラー: ${error.message}`,
      data: {
        name: '',
        description: '',
        features: [],
        location: ''
      }
    };
  }
}