// netlify/functions/save-feedback.js
const { createClient } = require('@supabase/supabase-js');

// Supabaseの初期化
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Supabase credentials missing");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  // OPTIONS リクエスト（CORS プリフライト）の処理
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }
  
  try {
    // リクエストの検証
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'メソッドが許可されていません。POSTのみ受け付けています。' 
        })
      };
    }

    const { interviewId, feedback } = JSON.parse(event.body);
    
    // 入力検証
    if (!interviewId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'インタビューIDが必要です'
        })
      };
    }
    
    // フィードバックが空の場合は早期リターン（エラーではなく成功として扱う）
    if (!feedback || !feedback.trim()) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'フィードバックなし'
        })
      };
    }
    
    console.log(`[Save Feedback] Saving feedback for interview ${interviewId}`);

    // interview_feedbackテーブルの存在を確認
    const { error: tableError } = await supabase
      .from('interview_feedback')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') { // 42P01: undefined_table
      console.log('[Save Feedback] テーブルが見つかりません。作成します');
      
      // テーブル作成（実際にはマイグレーションを使用することを推奨）
      await supabase.rpc('create_feedback_table');
    } else if (tableError) {
      console.error('[Save Feedback] テーブル確認エラー:', tableError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: `テーブル確認エラー: ${tableError.message}`
        })
      };
    }
    
    // フィードバックを保存
    const { data, error: insertError } = await supabase
      .from('interview_feedback')
      .insert({
        interview_id: interviewId,
        feedback_text: feedback.trim(),
        created_at: new Date().toISOString()
      })
      .select();
    
    if (insertError) {
      console.error('[Save Feedback] 保存エラー:', insertError);
      
      // テーブルがない場合のフォールバック対応
      if (insertError.code === '42P01') {
        console.log('[Save Feedback] テーブルが見つかりませんでした。フォールバックとしてログに記録します');
        console.log(`[Save Feedback] インタビューID: ${interviewId}, フィードバック: ${feedback}`);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'フィードバックをログに記録しました',
            fallback: true
          })
        };
      }
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: `フィードバック保存エラー: ${insertError.message}`
        })
      };
    }
    
    console.log('[Save Feedback] フィードバック保存成功');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'フィードバックを保存しました',
        data: data
      })
    };
  } catch (error) {
    console.error('[Save Feedback] 予期しないエラー:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `サーバーエラー: ${error.message}`
      })
    };
  }
};