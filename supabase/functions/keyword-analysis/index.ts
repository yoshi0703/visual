// supabase/functions/keyword-analysis/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2.39.6';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Required environment variables SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY are missing");
  throw new Error("Supabase configuration missing");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log("[Keyword-Analysis] Function loaded");

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
      console.log(`[Keyword-Analysis] Method not allowed: ${req.method}`);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    // Parse request body
    let requestData;
    try {
      const bodyText = await req.text();
      console.log(`[Keyword-Analysis] Request body received, length: ${bodyText.length}`);
      requestData = JSON.parse(bodyText);
    } catch (e) {
      console.error(`[Keyword-Analysis] Error parsing request body:`, e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: e.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { store_id, limit = 20, since = null } = requestData;
    
    if (!store_id) {
      return new Response(
        JSON.stringify({ error: 'store_id is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Build the query
    let query = supabase
      .from('interviews')
      .select('*')
      .eq('store_id', store_id)
      .eq('status', 'completed')
      .not('generated_review', 'is', null);
      
    // Add time filter if provided
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        query = query.gte('created_at', sinceDate.toISOString());
      }
    }
    
    const { data: interviews, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error(`[Keyword-Analysis] Database error:`, error);
      return new Response(
        JSON.stringify({ error: `Database error: ${error.message}` }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Process the interviews to extract keywords
    const keywords = extractKeywordsFromInterviews(interviews, limit);
    
    return new Response(
      JSON.stringify({
        success: true,
        keywords,
        interviewsAnalyzed: interviews.length,
        topKeywords: keywords.slice(0, 5) // Return top 5 keywords separately
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error(`[Keyword-Analysis] Unhandled error:`, error);
    return new Response(
      JSON.stringify({ error: `Server error: ${error.message}` }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// Function to extract keywords from interviews
function extractKeywordsFromInterviews(interviews: any[], limit: number = 20) {
  // Word count map
  const wordCounts: Record<string, number> = {};
  
  // Common Japanese stopwords to ignore
  const stopwords = [
    'は', 'が', 'の', 'に', 'を', 'で', 'と', 'も', 'から', 'へ', 'より', 'や',
    'な', 'た', 'です', 'ます', 'でした', 'ました', 'これ', 'それ', 'あれ',
    'この', 'その', 'あの', 'ここ', 'そこ', 'あそこ', 'こちら', 'そちら',
    'あちら', 'どこ', 'だれ', 'なに', 'なん', 'どの', 'どれ', 'いつ', 'どう',
    'そう', 'さん', 'まで', 'など', 'いる', 'ある', 'れる', 'られる', 'など',
    'ため', 'ゆえ', 'のみ', 'ほか', 'など'
  ];
  
  // Process each interview
  interviews.forEach(interview => {
    if (interview.generated_review) {
      // Clean the text - remove punctuation, special characters, etc.
      const cleanText = interview.generated_review
        .toLowerCase()
        .replace(/[、。「」『』（）！？―…・]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
        
      // Split into words
      const words = cleanText.split(' ');
      
      // Count word frequencies
      words.forEach(word => {
        if (word.length >= 2 && !stopwords.includes(word)) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
    }
  });
  
  // Convert to array of {text, count} objects and sort
  const keywords = Object.entries(wordCounts)
    .map(([text, count]) => ({ text, count }))
    .filter(item => item.count > 1) // Only include words that appear more than once
    .sort((a, b) => b.count - a.count) // Sort by frequency, descending
    .slice(0, limit); // Limit to specified number of keywords
    
  return keywords;
}