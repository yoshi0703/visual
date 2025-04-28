// supabase/functions/streaming-chat/index.ts
import { OpenAI } from "npm:openai@4.20.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, stripe-signature",
  "Content-Type": "application/json"
};

// Initialize OpenAI client
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY environment variable");
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

console.log("[Streaming-Chat] Function loaded");

// 接続カウンター（接続追跡用）
let connectionCounter = 0;
// アクティブな接続を追跡
const activeConnections = new Map<number, {
  socket: WebSocket;
  status: string;
  storeInfo?: any;
  conversation?: Message[];
  lastActivity: number;
  keepAlive: boolean;
}>();

// 定期的に接続状態をチェックするための関数
setInterval(() => {
  const now = Date.now();
  activeConnections.forEach((conn, id) => {
    // 5分以上活動がない接続を切断
    if (now - conn.lastActivity > 5 * 60 * 1000 && conn.keepAlive) {
      console.log(`[Streaming-Chat] Closing inactive connection ${id} (idle for ${Math.round((now - conn.lastActivity)/1000)}s)`);
      try {
        conn.socket.close(1000, "Connection inactive");
      } catch (err) {
        console.error(`[Streaming-Chat] Error closing inactive connection ${id}:`, err);
      } finally {
        activeConnections.delete(id);
      }
    }
  });
}, 60000); // 1分ごとに実行

// Common interfaces
interface Message {
  role: "user" | "bot" | "system" | "assistant";
  text?: string;
  content?: string;
  timestamp?: string;
}

interface StoreInfo {
  id?: string;
  name?: string;
  industry?: string;
  description?: string;
  features?: string[];
  location?: string;
  website_url?: string;
  ai_tone?: string;
  welcome_message?: string;
  thanks_message?: string;
  [key: string]: any;
}

Deno.serve(async (req) => {
  console.log(`[Streaming-Chat] Request received: ${req.method}, URL: ${req.url}`);
  
  // Add response headers helper function
  const addCorsHeaders = (response: Response): Response => {
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  };

  // CORS preflight handling
  if (req.method === 'OPTIONS') {
    console.log("[Streaming-Chat] Handling CORS preflight request");
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // WebSocket handling
  if (req.headers.get("upgrade")?.toLowerCase() === "websocket") {
    try {
      console.log("[Streaming-Chat] WebSocket upgrade request detected");
      
      // クライアント情報を取得して接続診断に使用
      const userAgent = req.headers.get("User-Agent") || "Unknown";
      const origin = req.headers.get("Origin") || "Unknown";
      const referer = req.headers.get("Referer") || "Unknown";
      
      console.log(`[Streaming-Chat] Client info: UA=${userAgent.substring(0, 50)}..., Origin=${origin}, Referer=${referer}`);
      
      // 接続IDを割り当て
      const connectionId = ++connectionCounter;
      
      try {
        // WebSocket接続をアップグレード
        const { socket, response } = Deno.upgradeWebSocket(req);
        console.log(`[Streaming-Chat] WebSocket connection ${connectionId} upgraded successfully`);
        
        let sessionData = {
          conversation: [] as Message[],
          storeInfo: null as StoreInfo | null,
        };
        
        let pingIntervalId: number | null = null;
        let lastPingTime = Date.now();
        let lastPongTime: number | null = null;
        let connectionOpen = false;
        
        // セッション開始時間を記録
        const sessionStartTime = Date.now();
        
        // 接続をアクティブ接続マップに追加
        activeConnections.set(connectionId, {
          socket,
          status: "connecting",
          lastActivity: Date.now(),
          keepAlive: true
        });
        
        socket.onopen = () => {
          console.log(`[Streaming-Chat] WebSocket connection ${connectionId} opened`);
          connectionOpen = true;
          
          // 接続状態を更新
          if (activeConnections.has(connectionId)) {
            activeConnections.set(connectionId, {
              ...activeConnections.get(connectionId)!,
              status: "connected",
              lastActivity: Date.now()
            });
          }
          
          // Send immediate ready signal
          try {
            socket.send(JSON.stringify({ 
              type: "connection_established", 
              timestamp: Date.now(),
              connectionId
            }));
          } catch (err) {
            console.error(`[Streaming-Chat] Error sending initial connection message for connection ${connectionId}:`, err);
          }
          
          // Set up keep-alive ping with more frequent pings initially
          pingIntervalId = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              try {
                const now = Date.now();
                const timeSinceLastPing = now - lastPingTime;
                const timeSinceLastPong = lastPongTime ? now - lastPongTime : null;
                lastPingTime = now;
                
                socket.send(JSON.stringify({ 
                  type: "ping", 
                  timestamp: now,
                  timeSinceLastPing,
                  timeSinceLastPong,
                  connectionId,
                  sessionDuration: now - sessionStartTime
                }));
              } catch (err) {
                console.error(`[Streaming-Chat] Error sending ping for connection ${connectionId}:`, err);
                
                // 接続が切れていると判断してインターバルをクリア
                if (pingIntervalId !== null) {
                  clearInterval(pingIntervalId);
                  pingIntervalId = null;
                }
                
                // アクティブ接続マップから削除
                activeConnections.delete(connectionId);
              }
            } else {
              // 接続が閉じられていればインターバルをクリア
              if (pingIntervalId !== null) {
                clearInterval(pingIntervalId);
                pingIntervalId = null;
              }
              
              // アクティブ接続マップから削除
              activeConnections.delete(connectionId);
            }
          }, 12000); // 12秒ごとにping（前は15秒）
        };
        
        socket.onmessage = async (event) => {
          try {
            // 最終アクティビティ時間を更新
            if (activeConnections.has(connectionId)) {
              activeConnections.set(connectionId, {
                ...activeConnections.get(connectionId)!,
                lastActivity: Date.now()
              });
            }
            
            // データが文字列であることを確認
            let dataStr = '';
            if (typeof event.data === 'string') {
              dataStr = event.data;
            } else if (event.data instanceof ArrayBuffer) {
              dataStr = new TextDecoder().decode(event.data);
            } else {
              throw new Error(`Unexpected message data type: ${typeof event.data}`);
            }
            
            const data = JSON.parse(dataStr);
            console.log(`[Streaming-Chat] Connection ${connectionId} received message type: ${data.type}`);
            
            // Handle ping/pong
            if (data.type === "ping") {
              socket.send(JSON.stringify({ 
                type: "pong", 
                timestamp: Date.now(),
                connectionId
              }));
              return;
            }
            
            if (data.type === "pong") {
              // Client responded to our ping
              lastPongTime = Date.now();
              console.log(`[Streaming-Chat] Received pong from client ${connectionId}`);
              return;
            }
            
            // Handle initialization
            if (data.type === "init") {
              sessionData.storeInfo = data.storeInfo || null;
              sessionData.conversation = data.conversation || [];
              
              // ストア情報をセッションに保存
              if (activeConnections.has(connectionId)) {
                activeConnections.set(connectionId, {
                  ...activeConnections.get(connectionId)!,
                  storeInfo: data.storeInfo,
                  conversation: data.conversation,
                  lastActivity: Date.now()
                });
              }
              
              console.log(`[Streaming-Chat] Session ${connectionId} initialized for store: ${sessionData.storeInfo?.name || 'Unknown'}`);
              
              // Send a more detailed ready response
              socket.send(JSON.stringify({ 
                type: "ready",
                timestamp: Date.now(),
                connectionId,
                sessionInfo: {
                  storeNameReceived: !!sessionData.storeInfo?.name,
                  conversationLength: sessionData.conversation.length
                }
              }));
              return;
            }
            
            // Handle chat messages
            if (data.type === "message") {
              const userMessage = data.message || "";
              
              // Add user message to conversation
              sessionData.conversation.push({
                role: "user",
                text: userMessage,
                timestamp: new Date().toISOString()
              });
              
              // 会話データを更新
              if (activeConnections.has(connectionId)) {
                activeConnections.set(connectionId, {
                  ...activeConnections.get(connectionId)!,
                  conversation: sessionData.conversation,
                  lastActivity: Date.now()
                });
              }
              
              // Build system prompt
              const systemPrompt = buildSystemPrompt(
                sessionData.storeInfo, 
                sessionData.conversation.length
              );
              
              // Convert messages to OpenAI format
              const messages = [
                { role: "system", content: systemPrompt },
                ...sessionData.conversation.map(msg => ({
                  role: msg.role === "bot" ? "assistant" : "user",
                  content: msg.text || msg.content || ""
                }))
              ];
              
              try {
                // Generate streaming response
                const stream = await openai.chat.completions.create({
                  model: "gpt-4.1",
                  messages,
                  stream: true,
                  temperature: 0.7,
                  max_tokens: 400,
                });
                
                let fullResponse = "";
                
                // Stream chunks to client
                for await (const chunk of stream) {
                  const content = chunk.choices[0]?.delta?.content || "";
                  if (content) {
                    fullResponse += content;
                    
                    // Send chunk through WebSocket if still open
                    if (socket.readyState === WebSocket.OPEN) {
                      try {
                        socket.send(JSON.stringify({
                          type: "chunk",
                          content: content,
                          timestamp: Date.now(),
                        }));
                      } catch (wsError) {
                        console.error(`[Streaming-Chat] Error sending chunk for connection ${connectionId}:`, wsError);
                        break; // Stop streaming if we can't send
                      }
                    } else {
                      console.error(`[Streaming-Chat] WebSocket not open when trying to send chunk for connection ${connectionId}`);
                      break;
                    }
                  }
                }
                
                // Add response to conversation history
                sessionData.conversation.push({
                  role: "bot",
                  text: fullResponse,
                  timestamp: new Date().toISOString()
                });
                
                // 会話データを更新
                if (activeConnections.has(connectionId)) {
                  activeConnections.set(connectionId, {
                    ...activeConnections.get(connectionId)!,
                    conversation: sessionData.conversation,
                    lastActivity: Date.now()
                  });
                }
                
                // Determine if conversation is complete
                const isCompleted = determineIfConversationCompleted(sessionData.conversation);
                
                // Extract topic options for first message
                let topicOptions: string[] = [];
                if (sessionData.conversation.filter(msg => msg.role === "bot").length === 1) {
                  topicOptions = extractTopicOptions(sessionData.storeInfo);
                }
                
                // Send completion message
                if (socket.readyState === WebSocket.OPEN) {
                  socket.send(JSON.stringify({
                    type: "complete",
                    fullResponse,
                    isCompleted,
                    topicOptions: topicOptions.length > 0 ? topicOptions : undefined,
                    conversation: sessionData.conversation,
                    timestamp: Date.now()
                  }));
                } else {
                  console.error(`[Streaming-Chat] WebSocket not open when trying to send completion for connection ${connectionId}`);
                }
              } catch (apiError) {
                console.error(`[Streaming-Chat] OpenAI API Error for connection ${connectionId}:`, apiError);
                
                // Generate fallback response
                const fallbackResponse = generateFallbackResponse(
                  sessionData.conversation, 
                  sessionData.storeInfo
                );
                
                if (socket.readyState === WebSocket.OPEN) {
                  try {
                    socket.send(JSON.stringify({
                      type: "error",
                      error: `応答生成中にエラーが発生しました: ${apiError instanceof Error ? apiError.message : String(apiError)}`,
                      timestamp: Date.now()
                    }));
                    
                    // Add fallback to conversation and send
                    const fallbackMessage = {
                      role: "bot",
                      text: fallbackResponse.message,
                      timestamp: new Date().toISOString()
                    };
                    
                    sessionData.conversation.push(fallbackMessage);
                    
                    // 会話データを更新
                    if (activeConnections.has(connectionId)) {
                      activeConnections.set(connectionId, {
                        ...activeConnections.get(connectionId)!,
                        conversation: sessionData.conversation,
                        lastActivity: Date.now()
                      });
                    }
                    
                    socket.send(JSON.stringify({
                      type: "complete",
                      fullResponse: fallbackResponse.message,
                      isCompleted: fallbackResponse.isCompleted,
                      conversation: sessionData.conversation,
                      timestamp: Date.now()
                    }));
                  } catch (sendError) {
                    console.error(`[Streaming-Chat] Error sending fallback response for connection ${connectionId}:`, sendError);
                  }
                }
              }
              return;
            }
            
            // Handle review generation
            if (data.type === "generate_review") {
              try {
                const reviewText = await generateReview(sessionData.conversation, sessionData.storeInfo);
                
                if (socket.readyState === WebSocket.OPEN) {
                  socket.send(JSON.stringify({
                    type: "review",
                    reviewText: reviewText,
                    timestamp: Date.now()
                  }));
                }
              } catch (reviewError) {
                console.error(`[Streaming-Chat] Review Generation Error for connection ${connectionId}:`, reviewError);
                
                // Generate fallback review
                const fallbackReview = generateFallbackReview(sessionData.conversation, sessionData.storeInfo?.name || 'お店');
                
                if (socket.readyState === WebSocket.OPEN) {
                  try {
                    socket.send(JSON.stringify({
                      type: "error",
                      error: `レビュー生成中にエラーが発生しました: ${reviewError instanceof Error ? reviewError.message : String(reviewError)}`,
                      timestamp: Date.now()
                    }));
                    
                    socket.send(JSON.stringify({
                      type: "review",
                      reviewText: fallbackReview,
                      timestamp: Date.now()
                    }));
                  } catch (sendError) {
                    console.error(`[Streaming-Chat] Error sending fallback review for connection ${connectionId}:`, sendError);
                  }
                }
              }
              return;
            }
            
            // Unknown message type
            console.warn(`[Streaming-Chat] Unknown message type for connection ${connectionId}: ${data.type}`);
            if (socket.readyState === WebSocket.OPEN) {
              try {
                socket.send(JSON.stringify({
                  type: "error",
                  error: `Unknown message type: ${data.type}`,
                  timestamp: Date.now()
                }));
              } catch (sendError) {
                console.error(`[Streaming-Chat] Error sending unknown type error for connection ${connectionId}:`, sendError);
              }
            }
          } catch (error) {
            console.error(`[Streaming-Chat] Error processing message for connection ${connectionId}:`, error);
            if (socket.readyState === WebSocket.OPEN) {
              try {
                socket.send(JSON.stringify({
                  type: "error",
                  error: `メッセージ処理中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
                  timestamp: Date.now()
                }));
              } catch (sendError) {
                console.error(`[Streaming-Chat] Error sending process error for connection ${connectionId}:`, sendError);
              }
            }
          }
        };
        
        socket.onerror = (error) => {
          console.error(`[Streaming-Chat] WebSocket error for connection ${connectionId}:`, error);
          
          // Try to send back error details if possible
          if (socket.readyState === WebSocket.OPEN) {
            try {
              socket.send(JSON.stringify({
                type: "error",
                error: "サーバー側でWebSocketエラーが発生しました",
                details: String(error),
                timestamp: Date.now()
              }));
            } catch (sendError) {
              console.error(`[Streaming-Chat] Error sending error message for connection ${connectionId}:`, sendError);
            }
          }
          
          // 接続状態を更新
          if (activeConnections.has(connectionId)) {
            activeConnections.set(connectionId, {
              ...activeConnections.get(connectionId)!,
              status: "error",
              lastActivity: Date.now(),
              keepAlive: false
            });
          }
        };
        
        socket.onclose = (event) => {
          // クローズコードとリーズンの詳細なログ
          let closeReason = "Unknown reason";
          switch (event.code) {
            case 1000: closeReason = "Normal closure"; break;
            case 1001: closeReason = "Going away"; break;
            case 1002: closeReason = "Protocol error"; break;
            case 1003: closeReason = "Unsupported data"; break;
            case 1005: closeReason = "No status received"; break;
            case 1006: closeReason = "Abnormal closure"; break;
            case 1007: closeReason = "Invalid frame payload data"; break;
            case 1008: closeReason = "Policy violation"; break;
            case 1009: closeReason = "Message too big"; break;
            case 1010: closeReason = "Missing extension"; break;
            case 1011: closeReason = "Internal error"; break;
            case 1012: closeReason = "Service restart"; break;
            case 1013: closeReason = "Try again later"; break;
            case 1014: closeReason = "Bad gateway"; break;
            case 1015: closeReason = "TLS handshake"; break;
            case 4000: closeReason = "Connection timeout"; break;
          }
          
          console.log(`[Streaming-Chat] WebSocket connection ${connectionId} closed (code: ${event.code}, reason: ${event.reason || 'No reason provided'}, closeReason: ${closeReason}, wasClean: ${event.wasClean})`);
          connectionOpen = false;
          
          // キープアライブタイマーをクリア
          if (pingIntervalId !== null) {
            clearInterval(pingIntervalId);
            pingIntervalId = null;
          }
          
          // アクティブ接続マップから削除
          activeConnections.delete(connectionId);
        };
        
        return addCorsHeaders(response);
      } catch (wsUpgradeError) {
        console.error(`[Streaming-Chat] WebSocket upgrade error for connection ${connectionId}:`, wsUpgradeError);
        // ヘッダー情報を詳細に記録
        console.error(`[Streaming-Chat] Headers for failed connection ${connectionId}:`, Object.fromEntries([...req.headers.entries()]));
        
        // ステータス情報を含むエラーレスポンスを返す
        return addCorsHeaders(new Response(JSON.stringify({
          success: false,
          error: `WebSocket接続を確立できませんでした: ${wsUpgradeError instanceof Error ? wsUpgradeError.message : String(wsUpgradeError)}`,
          details: {
            userAgent,
            origin,
            headers: Object.fromEntries([...req.headers.entries()].filter(([key]) => 
              !['authorization', 'cookie'].includes(key.toLowerCase())
            ))
          }
        }), {
          status: 500,
          headers: corsHeaders
        }));
      }
    } catch (outerError) {
      console.error("[Streaming-Chat] Outer error in WebSocket handling:", outerError);
      return addCorsHeaders(new Response(JSON.stringify({
        success: false,
        error: `WebSocket接続の処理中にエラーが発生しました: ${outerError instanceof Error ? outerError.message : String(outerError)}`
      }), {
        status: 500,
        headers: corsHeaders
      }));
    }
  }

  // REST API handling for fallback
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const reqId = crypto.randomUUID();
      console.log(`[Streaming-Chat] REST API request ${reqId}:`, body.action || body.functionName || "unknown");
      
      const { action, data, functionName, conversation = [], storeInfo = {} } = body;
      
      // Process based on action or function name
      if (action === "generate-chat-response" || functionName === "interviewChat") {
        // Handle chat response
        const response = await processChatResponse(conversation, storeInfo, reqId);
        return addCorsHeaders(new Response(JSON.stringify(response), {
          status: 200,
          headers: corsHeaders
        }));
      }
      
      if (action === "generate-review" || functionName === "generateReview") {
        // Handle review generation
        const reviewText = await generateReview(conversation, storeInfo, reqId);
        return addCorsHeaders(new Response(JSON.stringify({
          success: true,
          reviewText
        }), {
          status: 200,
          headers: corsHeaders
        }));
      }
      
      // Unknown action
      return addCorsHeaders(new Response(JSON.stringify({
        success: false,
        error: `Unknown action or function: ${action || functionName}`
      }), {
        status: 400,
        headers: corsHeaders
      }));
    } catch (error) {
      console.error("[Streaming-Chat] REST API error:", error);
      return addCorsHeaders(new Response(JSON.stringify({
        success: false,
        error: `Server error: ${error instanceof Error ? error.message : String(error)}`
      }), {
        status: 500,
        headers: corsHeaders
      }));
    }
  }

  // Method not supported
  return addCorsHeaders(new Response(JSON.stringify({
    success: false,
    error: "Method not supported. Use WebSocket or POST request."
  }), {
    status: 405,
    headers: corsHeaders
  }));
});

// --- Helper Functions ---

// Process chat response using OpenAI
async function processChatResponse(conversation: Message[], storeInfo: any, requestId = 'unknown') {
  console.log(`[Streaming-Chat] Processing chat response for request ${requestId} with conversation length ${conversation.length}`);
  
  // Use gpt-4.1 for better quality responses
  const model = "gpt-4.1";
  const systemPrompt = buildSystemPrompt(storeInfo, conversation.length);
  
  // Format messages for OpenAI
  const messages = [
    { role: "system", content: systemPrompt },
    ...conversation.map(msg => ({
      role: msg.role === "bot" ? "assistant" : "user",
      content: msg.text || msg.content || ""
    }))
  ];
  
  try {
    // OpenAI API呼び出しにタイムアウトを適用
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('OpenAI API timeout after 18 seconds'));
      }, 18000);
    });
    
    // Call OpenAI with timeout
    const completionPromise = openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 400
    });
    
    // 競合するプロミスを実行
    const completion = await Promise.race([completionPromise, timeoutPromise]) as any;
    
    const responseText = completion.choices[0].message.content || "";
    const isCompleted = determineIfConversationCompleted(conversation);
    
    // Extract topic options for first message
    const isFirstMessage = !conversation.some(msg => msg.role === "bot");
    const topicOptions = isFirstMessage ? extractTopicOptions(storeInfo) : [];
    
    console.log(`[Streaming-Chat] Successfully generated chat response for request ${requestId}`);
    
    return {
      success: true,
      message: responseText,
      isCompleted,
      topicOptions: isFirstMessage ? topicOptions : []
    };
  } catch (error) {
    console.error(`[Streaming-Chat] OpenAI API error for request ${requestId}:`, error);
    
    // Fallback response
    const fallback = generateFallbackResponse(conversation, storeInfo);
    return {
      success: true, // Still return success to avoid breaking the UI
      message: fallback.message,
      isCompleted: fallback.isCompleted,
      error: `AI生成エラー: ${error instanceof Error ? error.message : String(error)}`,
      _isFallback: true
    };
  }
}

// Generate review using OpenAI
async function generateReview(conversation: Message[], storeInfo: any, requestId = 'unknown') {
  console.log(`[Streaming-Chat] Generating review for request ${requestId}`);
  
  // Extract user messages
  const userMessages = conversation.filter(msg => msg.role === "user");
  const storeName = storeInfo?.name || 'このお店';
  
  // Build review prompt
  const reviewPrompt = `
あなたは${storeName}のレビュー生成AIです。以下の会話履歴をもとに、自然で説得力のあるレビューを生成してください。

【ガイドライン】
- 一人称視点で書いてください）
- 必要な場合は、店舗名（${storeName}）を正確に含めてください
- 具体的な商品名や体験内容に言及してください
- 商品名や固有名詞をクチコミに含める際は、（${storeInfo}）を参照して正確に表現してください。
- 自然で説得力のある表現を使ってください
- 最後は前向きな印象で締めくくってください
- 適切な長さは150〜250文字程度です
- クチコミは、薬機法や景品法表示法等に触れないように注意してください。

【店舗情報】
${storeInfo?.description ? `店舗概要: ${storeInfo.description}\n` : ''}
${storeInfo?.features?.length ? `特徴: ${storeInfo.features.join('、')}\n` : ''}
${storeInfo?.industry ? `業種: ${storeInfo.industry}\n` : ''}

【会話履歴】
${userMessages.map(msg => `お客様: ${msg.text || msg.content || ""}`).join('\n')}
`;

  try {
    // OpenAI API呼び出しにタイムアウトを適用
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('OpenAI API timeout after 18 seconds'));
      }, 18000);
    });
    
    // Call OpenAI with timeout
    const completionPromise = openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: reviewPrompt }
      ],
      temperature: 0.7,
      max_tokens: 400
    });
    
    // 競合するプロミスを実行
    const completion = await Promise.race([completionPromise, timeoutPromise]) as any;
    
    console.log(`[Streaming-Chat] Successfully generated review for request ${requestId}`);
    
    return completion.choices[0].message.content || generateFallbackReview(conversation, storeName);
  } catch (error) {
    console.error(`[Streaming-Chat] OpenAI review generation error for request ${requestId}:`, error);
    return generateFallbackReview(conversation, storeName);
  }
}

// Generate fallback response when API fails
function generateFallbackResponse(conversation: Message[], storeInfo: any) {
  console.log("[Streaming-Chat] Generating fallback response");
  
  const storeName = storeInfo?.name || 'お店';
  
  // First-time conversation
  if (conversation.length === 0 || !conversation.some(msg => msg.role === "bot")) {
    return {
      message: `こんにちは！${storeName}の評価にご協力いただきありがとうございます。以下のトピックから気になるものを選んでください。`,
      isCompleted: false,
      topicOptions: ["店内の雰囲気", "スタッフの対応", "商品・サービスの品質", "価格", "その他の感想"]
    };
  }
  
  // Get last user message
  const lastUserMessage = [...conversation]
    .reverse()
    .find(msg => msg.role === "user");
  
  if (!lastUserMessage) {
    return {
      message: `${storeName}についてのご感想をお聞かせください。`,
      isCompleted: false
    };
  }
  
  const messageText = lastUserMessage.text || lastUserMessage.content || "";
  
  // Check for completion keywords
  if (messageText.match(/([いい]えいい|終わり|完了|終了|もう(いい|大丈夫)|特にない)/)) {
    return {
      message: `ご意見ありがとうございました。${storeName}の改善に役立てます。`,
      isCompleted: true
    };
  }
  
  // Count user messages
  const userMessageCount = conversation.filter(msg => msg.role === "user").length;
  
  // Generic responses based on conversation stage
  if (userMessageCount === 1) {
    return {
      message: `ありがとうございます。もう少し詳しく教えていただけますか？具体的に${storeName}のどのような点が印象に残りましたか？`,
      isCompleted: false
    };
  } else if (userMessageCount === 2) {
    return {
      message: `なるほど、そのような体験をされたのですね。他に${storeName}について何か気づいた点はありますか？`,
      isCompleted: false
    };
  } else {
    return {
      message: `貴重なご意見をありがとうございます。もし他にないようでしたら、「完了」とお伝えください。`,
      isCompleted: false
    };
  }
}

// Generate fallback review when API fails
function generateFallbackReview(conversation: Message[], storeName: string) {
  // Extract user messages
  const userMessages = conversation
    .filter(msg => msg.role === "user")
    .map(msg => msg.text || msg.content || "");
  
  // Default fallback
  if (userMessages.length <= 1) {
    return `${storeName}を利用しました。また機会があれば利用したいと思います。`;
  }
  
  // Extract sentiment
  const positiveWords = ["良い", "素晴らしい", "美味しい", "親切", "丁寧", "満足", "快適", "清潔"];
  const positiveMatches = userMessages.filter(msg => 
    positiveWords.some(word => msg.includes(word))
  ).length;
  
  const negativeWords = ["悪い", "残念", "不満", "まずい", "不快", "不親切", "不潔"];
  const negativeMatches = userMessages.filter(msg => 
    negativeWords.some(word => msg.includes(word))
  ).length;
  
  // Generic review based on sentiment
  if (positiveMatches > negativeMatches) {
    return `${storeName}での体験は非常に良かったです。スタッフの対応も丁寧で、全体的に満足しました。特に店内の雰囲気が印象的でした。また利用したいと思います。`;
  } else if (negativeMatches > positiveMatches) {
    return `${storeName}での体験はいくつか改善点がありました。ただ、全体としては悪くなかったです。機会があれば、また利用するかもしれません。`;
  } else {
    return `${storeName}での体験は普通でした。良い点もあれば、改善できる点もありました。機会があれば、また利用したいと思います。`;
  }
}

// Build system prompt for chat
function buildSystemPrompt(storeInfo: any, conversationLength: number) {
  const storeName = storeInfo?.name || "お店";
  const aiTone = storeInfo?.ai_tone || "friendly";
  const storeFeatures = storeInfo?.features || [];
  const industry = storeInfo?.industry || "";
  
  // Stage-specific guidance
  let stageGuidance = "";
  if (conversationLength === 0) {
    stageGuidance = "最初のメッセージでは、ユーザーを歓迎し、店舗での体験について聞きましょう。";
  } else if (conversationLength <= 2) {
    stageGuidance = "ユーザーの回答に共感し、具体的な体験について掘り下げる質問をしましょう。";
  } else if (conversationLength <= 4) {
    stageGuidance = "ユーザーの回答を深め、改善点や要望について聞きましょう。";
  } else {
    stageGuidance = "そろそろ会話を終了させ、貴重な意見を感謝して締めくくりましょう。";
  }
  
  // AI tone guidance
  let toneGuidance = "";
  switch (aiTone) {
    case "formal":
      toneGuidance = "フォーマルで丁寧な敬語を使用してください。";
      break;
    case "casual":
      toneGuidance = "カジュアルでフレンドリーな口調を使用してください。「〜だよ」「〜だね」などの表現を使いましょう。";
      break;
    case "friendly":
    default:
      toneGuidance = "親しみやすいが丁寧な口調を使用してください。";
  }
  
  // Use custom welcome message if available
  const welcomeMessage = storeInfo?.welcome_message
    ? `最初のメッセージでは次のウェルカムメッセージを使用してください: "${storeInfo.welcome_message}"`
    : "";
  
  return `
あなたは${storeName}のレビュー収集AIアシスタントです。お客様に店舗体験について自然な会話形式でインタビューし、価値あるフィードバックを収集してください。

【店舗情報】
- 店舗名: ${storeName}
- 業種: ${industry}
- 特徴: ${storeFeatures.join(", ")}

【会話ガイドライン】
- ${toneGuidance}
- ${stageGuidance}
- ${welcomeMessage}
- ユーザーの発言内容を分析し、共感しながら自然な会話を続けてください。
- 質問は1回に1つだけ行い、簡潔かつ具体的にしてください。
- 店舗の特徴や商品情報に言及して、会話に深みを持たせてください。
- 会話の目的はクチコミに使える具体的なフィードバックを集めることです。
- 長文の回答は避け、簡潔で自然な対話を心がけてください。

ユーザーの発言に応じて、適切な質問や応答を返してください。フィードバックはすべて店舗改善のために活用されます。
`;
}

// Determine if conversation is completed
function determineIfConversationCompleted(conversation: Message[]): boolean {
  const userMessages = conversation.filter(msg => msg.role === "user");
  
  // Complete after 4 or more user messages
  if (userMessages.length >= 4) {
    return true;
  }
  
  // Check for completion keywords in the last message
  if (userMessages.length > 0) {
    const lastMessage = userMessages[userMessages.length - 1];
    const text = lastMessage.text || lastMessage.content || "";
    
    return !!text.match(/([いい]えいい|終わり|もう(いい|大丈夫)|特にない|完了|終了)/);
  }
  
  return false;
}

// Extract topic options based on store info
function extractTopicOptions(storeInfo: any): string[] {
  // Basic topics
  const baseTopics = ['味や品質について', '接客・サービスについて', '雰囲気・内装について'];
  
  // Customize based on industry
  if (storeInfo?.industry) {
    const industry = storeInfo.industry.toLowerCase();
    
    if (industry.includes('飲食') || industry.includes('レストラン') || industry.includes('カフェ')) {
      return ['料理の味について', 'メニューの多様性について', 'スタッフの接客について', 'お店の雰囲気について'];
    } else if (industry.includes('美容') || industry.includes('サロン')) {
      return ['施術の満足度について', 'スタッフの対応について', '店内の雰囲気について', '価格と価値について'];
    } else if (industry.includes('小売') || industry.includes('ショップ')) {
      return ['商品の品質について', 'スタッフの対応について', '店内の雰囲気について', '価格について'];
    }
  }
  
  return baseTopics;
}