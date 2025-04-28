// netlify/functions/openai-chat.js - DEPRECATED
// This file is kept for backward compatibility only.
// All functionality has been moved to Supabase Edge Functions.

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  // OPTIONS request handling (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }
  
  // Return a deprecated notice and redirect information
  return {
    statusCode: 410, // Gone
    headers,
    body: JSON.stringify({
      success: false,
      error: 'This endpoint has been deprecated. Please use Supabase Edge Function "streaming-chat" instead.',
      redirect: 'supabase_functions'
    })
  };
};