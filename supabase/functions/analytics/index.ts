// supabase/functions/analytics/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2.39.6';
import { GoogleGenerativeAI, GenerateContentRequest } from 'npm:@google/generative-ai@0.2.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

// Initialize Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Supabase credentials missing");
  throw new Error("Supabase configuration missing");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Gemini API
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY missing");
  throw new Error("Gemini API key is required");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

Deno.serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }),
      {
        status: 405,
        headers: corsHeaders
      }
    );
  }

  try {
    // Parse request body
    const body = await req.json();
    const { storeId, analysisType } = body;

    if (!storeId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Store ID is required'
        }),
        {
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Get interviews for the store
    const { data: interviews, error: interviewsError } = await supabase
      .from('interviews')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (interviewsError) {
      console.error('Error fetching interviews:', interviewsError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to fetch interviews: ${interviewsError.message}`
        }),
        {
          status: 500,
          headers: corsHeaders
        }
      );
    }

    if (!interviews || interviews.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No interviews found for analysis'
        }),
        {
          status: 404,
          headers: corsHeaders
        }
      );
    }

    let result;
    switch (analysisType) {
      case 'topics':
        result = await analyzeTopics(interviews);
        break;
      case 'improvements':
        result = await analyzeImprovements(interviews);
        break;
      case 'sentiment':
        result = await analyzeSentiment(interviews);
        break;
      case 'all':
      default:
        // Run all analyses in parallel
        const [topicResult, improvementResult, sentimentResult] = await Promise.all([
          analyzeTopics(interviews),
          analyzeImprovements(interviews),
          analyzeSentiment(interviews)
        ]);
        
        result = {
          topics: topicResult,
          improvements: improvementResult,
          sentiment: sentimentResult
        };
        break;
    }

    // Return analysis results
    return new Response(
      JSON.stringify({
        success: true,
        analysisType,
        result,
        interviewCount: interviews.length,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );

  } catch (error) {
    console.error('Analytics function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Analytics function error: ${error.message || 'Unknown error'}`
      }),
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
});

// Function to analyze topics using Gemini API
async function analyzeTopics(interviews: any[]) {
  // Prepare data for analysis - extract conversations and reviews
  const data = interviews.map(interview => ({
    id: interview.id,
    conversation: interview.conversation || [],
    review: interview.generated_review || '',
    rating: interview.rating
  }));

  // Get a sample of conversations (to avoid token limits)
  const sampleSize = Math.min(data.length, 10);
  const sampleData = data.slice(0, sampleSize);
  
  // Combine all reviews for analysis
  const reviewTexts = data
    .filter(d => d.review)
    .map(d => d.review)
    .join("\n-----\n");

  const prompt = `
あなたは店舗のインタビューデータを分析する専門家です。以下の複数のレビューテキストを分析して、最も言及されている主要なトピックを特定してください。

【分析の目的】
店舗オーナーがお客様の関心事や意見を理解し、サービス改善に活かすための洞察を得ること。

【分析してほしいこと】
1. 主要トピック：レビュー内で最も頻繁に言及されているトピックを5〜8個抽出し、それぞれの言及回数や重要度を示す「値」を1〜100の間で算出してください。
2. キーワード分析：各レビューで使用されている特徴的な単語やフレーズを抽出し、それぞれの出現回数を計算してください。

【分析データ】
${reviewTexts}

【返答形式】
結果は必ず以下のJSON形式で返してください。コメントや追加テキストは含めないでください。

{
  "topics": [
    {"name": "トピック名", "value": 数値},
    ...
  ],
  "keywords": [
    {"text": "キーワード", "count": 出現回数},
    ...
  ]
}
`;

  try {
    const genResult = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.1,
        topK: 20,
        maxOutputTokens: 1024,
      }
    });

    const responseText = genResult.response.text().trim();
    
    try {
      // Parse the JSON response
      const analysisResult = JSON.parse(responseText);
      return analysisResult;
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      return {
        topics: [],
        keywords: [],
        error: "Response parsing error",
        rawResponse: responseText
      };
    }
  } catch (error) {
    console.error('Gemini API error during topic analysis:', error);
    return {
      topics: [],
      keywords: [],
      error: error.message
    };
  }
}

// Function to analyze improvements/negative points using Gemini API
async function analyzeImprovements(interviews: any[]) {
  // Extract reviews and conversations
  const reviewTexts = interviews
    .filter(interview => interview.generated_review)
    .map(interview => interview.generated_review)
    .join("\n-----\n");
  
  const prompt = `
あなたは店舗改善点の分析専門家です。以下のレビューテキストから、お客様が指摘している改善点や問題点、不満点を特定してください。

【分析の目的】
店舗オーナーがサービス品質を向上させるために、お客様からの具体的なフィードバックや不満点を理解すること。

【分析してほしいこと】
1. ネガティブな意見やフィードバック：お客様が不満を表明している点や改善を求めている内容
2. 問題点の具体的な内容：何が、どのように問題だったのかの詳細
3. 深刻度：それぞれの問題点の深刻さ（1-10のスケール、10が最も深刻）

【分析データ】
${reviewTexts}

【返答形式】
結果は必ず以下のJSON形式で返してください。コメントや追加テキストは含めないでください。
改善点が見つからない場合は空の配列を返してください。

{
  "improvements": [
    {"id": "imp1", "text": "改善点の説明", "severity": 数値, "category": "カテゴリ"},
    ...
  ]
}
`;

  try {
    const genResult = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        topP: 0.1,
        topK: 20,
        maxOutputTokens: 1024,
      }
    });

    const responseText = genResult.response.text().trim();
    
    try {
      // Parse the JSON response
      const analysisResult = JSON.parse(responseText);
      
      // Add resolved status to each improvement
      if (analysisResult.improvements) {
        analysisResult.improvements = analysisResult.improvements.map(imp => ({
          ...imp,
          resolved: false
        }));
      }
      
      return analysisResult;
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      return {
        improvements: [],
        error: "Response parsing error",
        rawResponse: responseText
      };
    }
  } catch (error) {
    console.error('Gemini API error during improvements analysis:', error);
    return {
      improvements: [],
      error: error.message
    };
  }
}

// Function to analyze sentiment and overall trends
async function analyzeSentiment(interviews: any[]) {
  // Extract reviews, ratings, and dates for trend analysis
  const reviewData = interviews
    .filter(interview => interview.rating && interview.created_at)
    .map(interview => ({
      id: interview.id,
      rating: interview.rating,
      date: interview.created_at,
      review: interview.generated_review || ''
    }));
  
  // Sort by date
  reviewData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Extract a sample of the reviews for sentiment analysis
  const reviewSample = reviewData.slice(-15).map(r => r.review).join("\n-----\n");
  
  const prompt = `
あなたは顧客フィードバック分析の専門家です。以下のレビューから全体的な感情傾向と経時的な変化を分析してください。

【分析の目的】
お客様の満足度と感情の傾向を理解し、店舗サービスの効果を測定すること。

【分析してほしいこと】
1. 感情分析：全体的な顧客の感情（ポジティブ/ネガティブ/中立）の割合
2. 主要な肯定的評価ポイント：顧客が最も評価している点（最大5つ）
3. 顧客満足度スコア：0-100のスケールでの総合的な評価

【分析データ】
${reviewSample}

【返答形式】
結果は必ず以下のJSON形式で返してください。コメントや追加テキストは含めないでください。

{
  "sentiment": {
    "positive": 数値(0-100),
    "neutral": 数値(0-100),
    "negative": 数値(0-100)
  },
  "positivePoints": [
    {"point": "肯定的評価ポイント", "strength": 数値(1-10)},
    ...
  ],
  "satisfactionScore": 数値(0-100)
}
`;

  try {
    const genResult = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        topP: 0.1,
        topK: 16,
        maxOutputTokens: 1024,
      }
    });

    const responseText = genResult.response.text().trim();
    
    try {
      // Parse the JSON response
      const sentimentResult = JSON.parse(responseText);
      
      // Calculate rating trends
      const ratingTrends = calculateRatingTrends(reviewData);
      
      return {
        ...sentimentResult,
        trends: ratingTrends
      };
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      return {
        sentiment: { positive: 0, neutral: 0, negative: 0 },
        positivePoints: [],
        satisfactionScore: 0,
        trends: calculateRatingTrends(reviewData),
        error: "Response parsing error",
        rawResponse: responseText
      };
    }
  } catch (error) {
    console.error('Gemini API error during sentiment analysis:', error);
    return {
      sentiment: { positive: 0, neutral: 0, negative: 0 },
      positivePoints: [],
      satisfactionScore: 0,
      trends: calculateRatingTrends(reviewData),
      error: error.message
    };
  }
}

// Helper function to calculate rating trends
function calculateRatingTrends(reviewData: any[]) {
  if (!reviewData.length) return [];
  
  // Group by month
  const monthlyData: Record<string, { count: number, totalRating: number }> = {};
  
  reviewData.forEach(review => {
    const date = new Date(review.date);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { count: 0, totalRating: 0 };
    }
    
    monthlyData[monthKey].count += 1;
    monthlyData[monthKey].totalRating += review.rating;
  });
  
  // Convert to array and calculate averages
  const trends = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      avgRating: data.count > 0 ? data.totalRating / data.count : 0,
      reviewCount: data.count
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
  
  return trends;
}