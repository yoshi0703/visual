// src/lib/api.ts
import axios, { AxiosResponse, AxiosError } from 'axios';
import { supabase } from './supabase';
import { 
  ChatResponseData, 
  ReviewGenerationResponse, 
  WebsiteAnalysisResponse,
  JinaReaderResponse,
  WebsiteExtractedData
} from '../types';

// ベースURLの設定
// Netlify Functions はデプロイ中のベースURLで、ローカル開発時は .netlify/functions で
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/.netlify/functions';

// Supabase Functions URL
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Jina AI Reader API のベースURL
const JINA_READER_BASE_URL = 'https://r.jina.ai/';

// Error types
enum ApiErrorType {
  FETCH_ERROR = 'fetch_error',
  TIMEOUT = 'timeout',
  SERVER_ERROR = 'server_error',
  NETWORK_ERROR = 'network_error',
  CANCELLED = 'cancelled',
  UNKNOWN = 'unknown'
}

// API options
interface ApiOptions {
  timeout?: number;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  withCredentials?: boolean;
  onProgress?: (progress: number) => void;
}

// Jina AI specific options
interface JinaOptions extends ApiOptions {
  withGeneratedAlt?: boolean;
  withLinksButtons?: boolean;
  withImagesSummary?: boolean;
  processingLevel?: 'basic' | 'standard' | 'enhanced';
  browserEngine?: 'direct' | 'headless' | 'static';
}

// Fetch wrapper with better error handling
export async function fetchApi<T = any>(
  path: string,
  method: string = 'GET',
  data?: any,
  options: ApiOptions = {}
): Promise<T> {
  const isAbsoluteUrl = path.startsWith('http://') || path.startsWith('https://');
  const url = isAbsoluteUrl ? path : `${apiBaseUrl}/${path}`;
  
  const { 
    timeout = 30000, // 30 seconds default
    headers = {},
    params = {},
    withCredentials = false,
    onProgress
  } = options;
  
  try {
    // Add authorization header for Supabase endpoints
    const authHeaders = url.includes(supabaseUrl) && supabaseKey
      ? { 'Authorization': `Bearer ${supabaseKey}` }
      : {};
    
    // Set up request config
    const config = {
      url,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers
      },
      params,
      timeout,
      withCredentials,
      data: data ? JSON.stringify(data) : undefined,
      onUploadProgress: onProgress ? (progressEvent: any) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      } : undefined
    };
    
    // Log request (development only)
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${method} ${url}`, config);
    }
    
    const response = await axios(config) as AxiosResponse<T>;
    
    // Log successful response (development only)
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${method} ${url}`, response.status);
    }
    
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError, method, url);
    throw error; // Re-throw after logging
  }
}

// Error handling helper
function handleApiError(error: AxiosError, method: string, url: string): void {
  let errorType = ApiErrorType.UNKNOWN;
  let errorMessage = 'Unknown error occurred';

  if (axios.isCancel(error)) {
    errorType = ApiErrorType.CANCELLED;
    errorMessage = 'Request was cancelled';
  } else if (error.response) {
    // Server responded with an error status code
    errorType = ApiErrorType.SERVER_ERROR;
    errorMessage = `HTTP Error: ${error.response.status}`;
    
    console.error(
      `[API Error] ${method} ${url} - Status: ${error.response.status}`,
      error.response.data
    );
  } else if (error.request) {
    // Request was made but no response received
    if (error.code === 'ECONNABORTED') {
      errorType = ApiErrorType.TIMEOUT;
      errorMessage = 'Request timed out';
    } else if (error.message.includes('Network Error')) {
      errorType = ApiErrorType.NETWORK_ERROR;
      errorMessage = 'Network error';
    } else {
      errorType = ApiErrorType.FETCH_ERROR;
      errorMessage = 'No response received';
    }
    
    console.error(
      `[API Error] ${method} ${url} - ${errorType}: ${error.message}`
    );
  } else {
    // Error setting up the request
    console.error(
      `[API Error] ${method} ${url} - Setup Error: ${error.message}`
    );
  }

  // Record error for analytics (if needed)
  // logErrorToAnalytics(errorType, errorMessage, method, url);
}

// Specific API endpoint wrappers

/**
 * クチトル API サービス関数へのリクエストを送信
 */
export async function serviceApiRequest<T = any>(action: string, data: any): Promise<T> {
  if (!action) {
    throw new Error('Action is required');
  }
  
  try {
    // First try using Supabase Edge Function
    if (supabaseUrl && supabaseKey) {
      try {
        const result = await supabaseEdgeFunctionRequest<T>(
          'kuchitoru-service',  // SupabaseのEdge Function名
          { action, data },
          { timeout: 15000 }
        );
        return result;
      } catch (supabaseError) {
        console.warn(`[Supabase Edge Function failed] Falling back to Netlify Function for action "${action}"`, supabaseError);
        // Fall through to Netlify function
      }
    }

    // Fall back to Netlify function
    const result = await fetchApi<T>(
      'kuchitoru-service',
      'POST',
      { action, data }
    );
    return result;
  } catch (error) {
    console.error(`[API Call Failed] Action: "${action}" at URL "${apiBaseUrl}/kuchitoru-service"`, error);
    throw error;
  }
}

/**
 * Supabase Edge Function へのリクエストを送信
 */
export async function supabaseEdgeFunctionRequest<T = any>(
  functionName: string, 
  data: any, 
  options: ApiOptions = {}
): Promise<T> {
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL is not defined in environment variables');
  }
  
  if (!supabaseKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY is not defined in environment variables');
  }
  
  try {
    const result = await fetchApi<T>(
      `${supabaseUrl}/functions/v1/${functionName}`,
      'POST',
      data,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
        },
        ...options
      }
    );
    return result;
  } catch (error) {
    console.error(`[API Call Failed] Supabase Function: "${functionName}"`, error);
    throw error;
  }
}

// --- ストリーミングチャットクライアント実装 ---

// WebSocket接続の状態タイプ
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'fallback';

// コールバック関数の型定義
interface StreamingCallbacks {
  onReady?: () => void;
  onChunk?: (content: string) => void;
  onComplete?: (fullResponse: string, isCompleted: boolean, updatedConversation: any[]) => void;
  onReview?: (reviewText: string) => void;
  onError?: (error: any) => void;
  onConnectionStatus?: (status: ConnectionStatus) => void;
}

/**
 * ストリーミングチャットクライアントを作成
 * WebSocketベースで双方向通信を行い、チャンク単位でレスポンスを受信
 */
export function createStreamingChatClient(storeInfo: any, initialConversation: any[] = []) {
  // 状態変数
  let wsConnection: WebSocket | null = null;
  let connectionStatus: ConnectionStatus = 'disconnected';
  let callbacks: StreamingCallbacks = {};
  let conversation = [...initialConversation];
  let fullResponse = '';
  let reconnectAttempts = 0;
  let consecutiveFailures = 0;
  const MAX_RECONNECT_ATTEMPTS = 3;
  let backoffTime = 1000; // msec
  
  // WebSocketエンドポイントの構築
  const getWebSocketUrl = () => {
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL is not defined');
    }
    return `wss://${supabaseUrl.split('//')[1]}/functions/v1/streaming-chat`;
  };

  // クライアントへのエラー報告関数
  const reportErrorToClient = (error: Error | string) => {
    console.error('[Streaming] Error:', error);
    if (callbacks.onError) {
      if (typeof error === 'string') {
        callbacks.onError(new Error(error));
      } else {
        callbacks.onError(error);
      }
    }
  };
  
  // WebSocket接続の初期化
  const initConnection = () => {
    try {
      if (wsConnection && 
          (wsConnection.readyState === WebSocket.OPEN || 
           wsConnection.readyState === WebSocket.CONNECTING)) {
        console.log('[Streaming] WebSocket connection already exists');
        return true;
      }
      
      updateConnectionStatus('connecting');
      const wsUrl = getWebSocketUrl();
      console.log(`[Streaming] Connecting to WebSocket at ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('[Streaming] WebSocket connection opened');
        updateConnectionStatus('connected');
        reconnectAttempts = 0;
        consecutiveFailures = 0;
        backoffTime = 1000;
        
        // Send initialization message
        const initMessage = {
          type: 'init',
          storeInfo,
          conversation
        };
        ws.send(JSON.stringify(initMessage));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
          switch (data.type) {
            case 'ready':
              console.log('[Streaming] Server ready');
              if (callbacks.onReady) callbacks.onReady();
              break;
              
            case 'connection_established':
              console.log('[Streaming] Connection established with server');
              break;
              
            case 'chunk':
              if (data.content && callbacks.onChunk) {
                callbacks.onChunk(data.content);
              }
              break;
              
            case 'complete':
              console.log('[Streaming] Response completed');
              fullResponse = data.fullResponse || '';
              
              // Update conversation
              if (data.conversation) {
                conversation = data.conversation;
              } else if (fullResponse) {
                // Add bot message if not already in conversation
                conversation.push({
                  role: 'bot',
                  text: fullResponse,
                  timestamp: new Date().toISOString()
                });
              }
              
              if (callbacks.onComplete) {
                callbacks.onComplete(
                  fullResponse, 
                  data.isCompleted || false,
                  conversation
                );
              }
              break;
              
            case 'review':
              console.log('[Streaming] Review generated');
              if (callbacks.onReview) {
                callbacks.onReview(data.reviewText || '');
              }
              break;
              
            case 'error':
              console.error('[Streaming] Server error:', data.error);
              reportErrorToClient(data.error || 'Unknown server error');
              break;
              
            case 'ping':
              // Reply with pong
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
              break;
              
            case 'pong':
              // Server responded to our ping, connection is alive
              break;
              
            default:
              console.warn(`[Streaming] Unknown message type: ${data.type}`);
          }
        } catch (parseError) {
          console.error('[Streaming] Error parsing message:', parseError);
          reportErrorToClient(`メッセージの解析に失敗しました: ${parseError}`);
        }
      };
      
      ws.onerror = (error) => {
        // Create a detailed object with connection diagnostic information
        const connectionDetails = {
          readyState: ws.readyState,
          errorDetail: `Event type: ${error.type}, bubbles: ${error.bubbles}, cancelable: ${error.cancelable}, target type: ${(error.target as any)?.constructor?.name || 'unknown'}`,
          timestamp: new Date().toISOString(),
          url: wsUrl,
          networkStatus: navigator.onLine ? 'online' : 'offline',
          networkInfo: {
            online: navigator.onLine,
            type: (navigator as any)?.connection?.type || 'unknown',
            effectiveType: (navigator as any)?.connection?.effectiveType || 'unknown',
            downlink: (navigator as any)?.connection?.downlink || 'unknown',
            rtt: (navigator as any)?.connection?.rtt || 'unknown'
          },
          connectionAge: Date.now() - (wsConnection as any)?._creationTime || Date.now(),
          timeSinceLastConnection: 'never connected',
          attemptNumber: reconnectAttempts + 1,
          consecutiveFailures: consecutiveFailures + 1
        };
        
        console.error('[Streaming] WebSocket error:', error);
        console.error('[Streaming] WebSocket error details:', connectionDetails);
        
        handleConnectionFailure(connectionDetails);
      };
      
      ws.onclose = (event) => {
        console.log(`[Streaming] WebSocket closed (code: ${event.code}, reason: ${event.reason})`);
        
        if (connectionStatus === 'connected') {
          // Only notify if we were previously connected (not during initial connection failures)
          reportErrorToClient('接続が予期せず終了しました。バックアップシステムに切り替えます。');
        }
        
        handleConnectionFailure(event);
      };
      
      // Set the websocket connection with creation timestamp for diagnostic purposes
      wsConnection = ws;
      (wsConnection as any)._creationTime = Date.now();
      return true;
    } catch (error) {
      console.error('[Streaming] Connection initialization error:', error);
      handleConnectionFailure(error);
      return false;
    }
  };
  
  // 接続状態の更新
  const updateConnectionStatus = (newStatus: ConnectionStatus) => {
    connectionStatus = newStatus;
    if (callbacks.onConnectionStatus) {
      callbacks.onConnectionStatus(newStatus);
    }
  };
  
  // 接続失敗時の処理
  const handleConnectionFailure = (error: any) => {
    // If the connection was never established or was closed
    if (!wsConnection || 
        wsConnection.readyState === WebSocket.CLOSED || 
        wsConnection.readyState === WebSocket.CLOSING) {
      updateConnectionStatus('disconnected');
      
      // Increment consecutive failures count
      consecutiveFailures++;
      
      // Try to reconnect
      handleReconnect();
    }
  };
  
  // 再接続処理
  const handleReconnect = () => {
    reconnectAttempts++;
    
    if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
      console.log(`[Streaming] Trying to reconnect (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}, consecutive failures: ${consecutiveFailures})...`);
      
      // With exponential backoff
      const reconnectDelay = backoffTime * Math.pow(1.5, reconnectAttempts - 1);
      backoffTime = reconnectDelay;
      
      setTimeout(() => {
        initConnection();
      }, reconnectDelay);
    } else {
      console.warn('[Streaming] Maximum reconnection attempts reached. Switching to HTTP fallback.');
      updateConnectionStatus('fallback');
      
      if (consecutiveFailures >= 2) {
        reportErrorToClient('リアルタイム接続を確立できません。標準モードに切り替えます。');
      }
    }
  };
  
  // メッセージ送信
  const sendMessage = (message: string): boolean => {
    if (!wsConnection || wsConnection.readyState !== WebSocket.OPEN) {
      if (!initConnection()) {
        console.error('[Streaming] Cannot send message - connection failed');
        return false;
      }
      
      // Wait for connection to establish
      setTimeout(() => {
        sendMessage(message);
      }, 500);
      return true;
    }
    
    try {
      // Add user message to conversation
      conversation.push({
        role: 'user',
        text: message,
        timestamp: new Date().toISOString()
      });
      
      // Send message to server
      wsConnection.send(JSON.stringify({
        type: 'message',
        message
      }));
      
      return true;
    } catch (error) {
      console.error('[Streaming] Error sending message:', error);
      return false;
    }
  };
  
  // レビュー生成リクエスト
  const generateReview = (): boolean => {
    if (!wsConnection || wsConnection.readyState !== WebSocket.OPEN) {
      console.error('[Streaming] Cannot generate review - no connection');
      return false;
    }
    
    try {
      wsConnection.send(JSON.stringify({
        type: 'generate_review'
      }));
      
      return true;
    } catch (error) {
      console.error('[Streaming] Error requesting review generation:', error);
      return false;
    }
  };
  
  // 接続終了
  const close = () => {
    if (wsConnection) {
      try {
        wsConnection.close();
      } catch (error) {
        console.error('[Streaming] Error closing connection:', error);
      }
      wsConnection = null;
    }
  };
  
  // コールバック設定
  const setCallbacks = (newCallbacks: StreamingCallbacks) => {
    callbacks = { ...callbacks, ...newCallbacks };
  };
  
  // 接続状態取得
  const getConnectionStatus = (): ConnectionStatus => {
    return connectionStatus;
  };
  
  // 初期接続
  initConnection();
  
  // Public API
  return {
    sendMessage,
    generateReview,
    close,
    setCallbacks,
    getConnectionStatus
  };
}

// --- API Wrappers ---

/**
 * ウェブサイト解析API
 */
export async function analyzeWebsiteApi(storeId: string, url: string): Promise<WebsiteAnalysisResponse> {
  console.log('[API] Calling website-analysis Edge Function');
  return supabaseEdgeFunctionRequest<WebsiteAnalysisResponse>(
    'website-analysis',
    { storeId, url }
  );
}

/**
 * Jina Reader APIを直接呼び出す関数
 * フロントエンドから直接使用する場合（CORSが許可されている場合）
 */
export async function jinaReaderApi(url: string, options: JinaOptions = {}): Promise<JinaReaderResponse> {
  try {
    if (!url) {
      throw new Error('URL is required');
    }
    
    // URLをエンコード
    const encodedUrl = encodeURIComponent(url);
    const jinaUrl = `${JINA_READER_BASE_URL}${encodedUrl}`;
    
    // リクエストヘッダーの設定
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };
    
    // 追加オプションの設定
    if (options.withGeneratedAlt) {
      headers['x-with-generated-alt'] = 'true';
    }
    
    if (options.withLinksButtons) {
      headers['x-with-links-buttons'] = 'true';
    }
    
    if (options.withImagesSummary) {
      headers['x-with-images-summary'] = 'true';
    }
    
    const response = await axios.get(jinaUrl, {
      headers,
      timeout: options.timeout || 15000
    });
    
    return {
      success: true,
      url: url,
      title: response.data.title || '',
      content: response.data.content || '',
      timestamp: response.data.timestamp || new Date().toISOString()
    };
  } catch (error) {
    console.error('[Jina Reader API] Error:', error);
    
    // エラーメッセージをユーザーフレンドリーにする
    let errorMessage = 'Jina Reader APIの呼び出し中にエラーが発生しました';
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // サーバーからエラーレスポンスがあった場合
        errorMessage = `サーバーエラー: ${error.response.status} ${error.response.statusText}`;
      } else if (error.request) {
        // リクエストは送られたがレスポンスがなかった場合
        errorMessage = 'サーバーからの応答がありませんでした';
        
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'リクエストがタイムアウトしました';
        }
      } else {
        // リクエスト設定中にエラーが発生した場合
        errorMessage = `リクエストエラー: ${error.message}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      url: url,
      title: '',
      content: '',
      error: errorMessage
    };
  }
}

/**
 * OpenAI APIを使用してコンテンツから情報を抽出する関数
 */
export async function extractInfoWithAI(
  content: string, 
  url: string, 
  options: ApiOptions = {}
): Promise<{ 
  success: boolean; 
  data?: WebsiteExtractedData; 
  confidence?: number;
  error?: string; 
}> {
  try {
    // Supabase Edge Function経由でAI抽出を行う
    // 実際の実装では、外部APIキーをフロントエンドで使用するべきではない
    return await supabaseEdgeFunctionRequest(
      'ai-extraction', // 別のエンドポイントを使用（実装が必要）
      {
        content,
        url
      },
      options
    );
  } catch (error) {
    console.error('[AI Extraction] Error:', error);
    
    let errorMessage = 'AI抽出中にエラーが発生しました';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * 代替情報源を検索する関数
 */
export async function searchAlternativeSources(
  url: string, 
  name: string, 
  options: ApiOptions = {}
): Promise<any[]> {
  try {
    // 実際の実装ではバックエンドAPIを呼び出す
    return await supabaseEdgeFunctionRequest(
      'search-alternatives',
      {
        url,
        name
      },
      options
    );
  } catch (error) {
    console.error('[Alternative Sources] Error:', error);
    return [];
  }
}

/**
 * QRコード生成API
 */
export async function generateQrCodeApi(storeId: string): Promise<any> {
  return serviceApiRequest('generate-qr-code', { storeId });
}

/**
 * サービス設定API
 */
export async function updateStoreSettingsApi(storeId: string, updates: any): Promise<any> {
  return serviceApiRequest('update-store-settings', { storeId, updates });
}

/**
 * チャット設定保存API
 */
export async function saveChatSettingsApi(storeId: string, settings: any): Promise<any> {
  return serviceApiRequest('save-chat-settings', { storeId, settings });
}

/**
 * クーポン設定保存API
 */
export async function saveCouponSettingsApi(storeId: string, settings: any): Promise<any> {
  return serviceApiRequest('save-coupon-settings', { storeId, settings });
}

/**
 * 決済インテントAPI
 */
export async function createPaymentIntentApi(data: {
  storeId: string;
  amount: number;
  currency?: string;
  description?: string;
}): Promise<any> {
  return serviceApiRequest('create-payment-intent', data);
}

/**
 * チャットレスポンス生成API（HTTP Fallback）
 * ストリーミングではなく従来の同期リクエストとして実行
 */
export async function generateChatResponseApi(
  conversation: any[],
  storeInfo: any
): Promise<ChatResponseData> {
  try {
    // First try using Supabase Edge Function
    return await supabaseEdgeFunctionRequest<ChatResponseData>(
      'streaming-chat',
      {
        action: 'generate-chat-response',
        conversation,
        storeInfo
      },
      {
        timeout: 15000 // 15 seconds timeout
      }
    );
  } catch (error) {
    console.error('[API Error] Action: generate-chat-response, Status:', (error as any).response?.status);
    
    // Fall back to legacy Netlify function (if still available)
    try {
      return await serviceApiRequest<ChatResponseData>('generate-chat-response', {
        conversation,
        storeInfo
      });
    } catch (fallbackError) {
      console.error('[API Call Failed] Action: "generate-chat-response" at URL "/.netlify/functions/kuchitoru-service"', fallbackError);
      
      // Generate a simple fallback response
      return generateFallbackChatResponse(conversation, storeInfo);
    }
  }
}

/**
 * レビュー生成API（HTTP Fallback）
 */
export async function generateReviewApi(
  conversation: any[],
  storeInfo: any
): Promise<ReviewGenerationResponse> {
  try {
    // First try using Supabase Edge Function
    return await supabaseEdgeFunctionRequest<ReviewGenerationResponse>(
      'streaming-chat',
      {
        action: 'generate-review',
        conversation,
        storeInfo
      },
      {
        timeout: 15000
      }
    );
  } catch (error) {
    console.error('[API Error] Action: generate-review, Status:', (error as any).response?.status);
    
    // Fall back to legacy Netlify function (if still available)
    try {
      return await serviceApiRequest<ReviewGenerationResponse>('generate-review', {
        conversation,
        storeInfo
      });
    } catch (fallbackError) {
      console.error('[API Call Failed] Action: "generate-review"', fallbackError);
      
      // Generate a simple fallback review
      return generateFallbackReviewResponse(conversation, storeInfo);
    }
  }
}

/**
 * Stripe Customer Portal リンク生成API
 */
export async function createCustomerPortalLinkApi(customerId: string, returnUrl?: string): Promise<any> {
  return supabaseEdgeFunctionRequest(
    'create-manage-link',
    {
      customer_id: customerId,
      return_url: returnUrl
    }
  );
}

// --- ヘルパー関数 ---

/**
 * オフラインの場合のフォールバックチャットレスポンス生成
 */
function generateFallbackChatResponse(conversation: any[], storeInfo: any): ChatResponseData {
  console.log('[Fallback] Generating offline fallback chat response');
  
  const storeName = storeInfo?.name || 'お店';
  
  // 初回メッセージの場合
  if (conversation.length === 0 || !conversation.some((msg: any) => msg.role === 'bot')) {
    return {
      success: true,
      message: `こんにちは！${storeName}の評価にご協力いただきありがとうございます。下記のトピックから気になるものを選んでください。`,
      topicOptions: [
        "商品・サービスの品質について",
        "スタッフの対応について",
        "店内の雰囲気について",
        "価格について",
        "その他のご意見"
      ]
    };
  }
  
  // 最後のユーザーメッセージを取得
  const userMessages = conversation.filter((msg: any) => msg.role === 'user');
  const userMessageCount = userMessages.length;
  const lastUserMessage = userMessages[userMessageCount - 1];
  
  // 完了条件をチェック
  if (userMessageCount >= 3 || 
      (lastUserMessage && lastUserMessage.text && 
       lastUserMessage.text.match(/([いい]えいい|終わり|もう(いい|大丈夫)|特にない)/))) {
    return {
      success: true,
      message: `ご意見をいただきありがとうございました。${storeName}のサービス向上に活用させていただきます。`,
      isCompleted: true
    };
  }
  
  // 汎用的な返答を返す
  const genericResponses = [
    `なるほど、ありがとうございます。他に${storeName}で良かった点や改善点はありますか？`,
    `貴重なご意見をありがとうございます。${storeName}について他に何か感じたことはありますか？`,
    `そのような体験をされたのですね。${storeName}のどのような点が印象的でしたか？`
  ];
  
  return {
    success: true,
    message: genericResponses[Math.floor(Math.random() * genericResponses.length)]
  };
}

/**
 * オフラインの場合のフォールバックレビュー生成
 */
function generateFallbackReviewResponse(conversation: any[], storeInfo: any): ReviewGenerationResponse {
  console.log('[Fallback] Generating offline fallback review');
  
  const storeName = storeInfo?.name || 'このお店';
  const userMessages = conversation
    .filter((msg: any) => msg.role === 'user')
    .map((msg: any) => msg.text || '');
  
  // ユーザーメッセージが少ない場合は汎用レビュー
  if (userMessages.length <= 1) {
    return {
      success: true,
      reviewText: `${storeName}を利用しました。全体的に良い印象でした。また機会があれば利用したいと思います。`
    };
  }
  
  // より詳細なフォールバックレビュー
  return {
    success: true,
    reviewText: `${storeName}を訪問しました。スタッフの対応も丁寧で、サービスの品質も良かったです。店内の雰囲気も良く、居心地のよい空間でした。全体として満足のいく体験でした。また利用したいと思います。`
  };
}