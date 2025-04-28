import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Interview, Message, Store } from '../types';
import { getGoogleReviewUrl } from '../lib/utils';
import { createStreamingChatClient, generateChatResponseApi, generateReviewApi } from '../lib/api'; 
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { generateStoreMessage, analyzeConversation } from '@/lib/messagegenerator';
import { 
  Send, Star, MessageSquare, AlertCircle, Wifi, WifiOff,
  ThumbsUp, CheckCircle, Flag, PenTool, Loader2, 
  Info, Gift, ArrowRight, Scissors, Award
} from 'lucide-react';

const MAX_RETRY_ATTEMPTS = 3;
const MAX_CONVERSATION_ROUNDS = 10;
const SUFFICIENCY_CHECK_THRESHOLD = 5;

const InterviewPage: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdminAccess = searchParams.get('admin') === 'true';

  // 状態変数
  const [storeInfo, setStoreInfo] = useState<Store | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [autoReviewText, setAutoReviewText] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topicOptions, setTopicOptions] = useState<string[]>([]);
  const [showTopicSelection, setShowTopicSelection] = useState(false);
  const [showEndButton, setShowEndButton] = useState(false);
  const [conversationRound, setConversationRound] = useState(0);
  const [informationSufficiency, setInformationSufficiency] = useState(0);
  const [sufficientCategories, setSufficientCategories] = useState<string[]>([]);
  const [storeFollowupMessage, setStoreFollowupMessage] = useState<string>('');
  
  // スクロール制御のための状態変数
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  
  // ストリーミング関連
  const [currentStreamingText, setCurrentStreamingText] = useState('');
  const [useStreaming, setUseStreaming] = useState(true);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showThankYouMessage, setShowThankYouMessage] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'fallback'>('disconnected');
  const [isExploding, setIsExploding] = useState<boolean>(false); // 紙吹雪効果用
  
  // ゲーミフィケーション要素
  const [showInitialGuidance, setShowInitialGuidance] = useState(true);
  const [showCouponAnimation, setShowCouponAnimation] = useState(false);
  const [progressPoints, setProgressPoints] = useState(0);
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  const [showReviewGeneration, setShowReviewGeneration] = useState(false);
  const [reviewGenerationProgress, setReviewGenerationProgress] = useState(0);
  const [achievementUnlocked, setAchievementUnlocked] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastResponseTime, setLastResponseTime] = useState<Date | null>(null);
  const [showGoogleRedirectAnimation, setShowGoogleRedirectAnimation] = useState(false);
  
  // レイアウト制御
  const [messageListHeight, setMessageListHeight] = useState<number>(0);
  const [safeAreaBottom, setSafeAreaBottom] = useState<number>(0);
  
  // 参照変数
  const streamingClientRef = useRef<{
    sendMessage: (message: string) => boolean;
    generateReview: () => boolean;
    close: () => void;
    setCallbacks: (callbacks: any) => void;
    getConnectionStatus: () => 'connecting' | 'connected' | 'disconnected' | 'fallback';
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const couponRef = useRef<HTMLDivElement>(null);
  const reviewGenerationRef = useRef<HTMLDivElement>(null);
  const realtimeSubscriptionRef = useRef<{ subscription: any, unsubscribe: () => void } | null>(null);
  const apiRetryCountRef = useRef<number>(0);
  const initializedRef = useRef<boolean>(false);
  const pendingTopicOptionsRef = useRef<boolean>(false);
  const heightAdjustmentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollPositionRef = useRef<number>(0);
  const keyboardVisibleRef = useRef<boolean>(false);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const appleGradientAnimationRef = useRef<number>(0);
  const particlesRef = useRef<Array<{x: number, y: number, size: number, speedX: number, speedY: number, color: string, rotation: number, rotationSpeed: number}>>([]);
  
  // データ取得
  const fetchInterviewData = useCallback(async () => {
    if (!interviewId) {
      setError("インタビューIDが見つかりません。");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`[Interview] インタビューID ${interviewId} のデータを取得中...`);
      
      // インタビュー情報の取得（ストア情報も含めて）
      const { data: interviewData, error: interviewError } = await supabase
        .from('interviews')
        .select('*, stores(*)')
        .eq('id', interviewId)
        .maybeSingle();
        
      if (interviewError) {
        console.error(`[Interview] インタビュー取得エラー:`, interviewError);
        throw interviewError;
      }
      
      if (!interviewData) {
        console.error(`[Interview] インタビューID ${interviewId} が見つかりません`);
        throw new Error("インタビューが見つかりません。IDを確認してください。");
      }
      
      console.log(`[Interview] インタビューデータを取得しました:`, 
          { id: interviewData.id, status: interviewData.status, messages: interviewData.conversation?.length || 0 });
      
      // ストア情報を抽出（stores.*でJOINした結果）
      let storeData = interviewData.stores;
      
      // ストア情報が見つからない場合、直接取得を試みる
      if (!storeData && interviewData.store_id) {
        console.log(`[Interview] JOINでストア情報が取得できませんでした。直接取得を試みます: ${interviewData.store_id}`);
        
        // 直接store_idを使用してストア情報を取得
        const { data: directStoreData, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', interviewData.store_id)
          .maybeSingle();
            
        if (storeError) {
          console.error(`[Interview] ストア直接取得エラー:`, storeError);
          throw new Error("店舗情報の取得中にエラーが発生しました。");
        }
        
        if (!directStoreData) {
          console.error(`[Interview] 店舗ID ${interviewData.store_id} が見つかりません`);
          // エラーをスローするのではなく、ダミーのストア情報を作成
          storeData = {
            id: interviewData.store_id,
            name: "不明な店舗",
            description: "詳細情報が見つかりませんでした",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            owner_id: null
          };
          
          console.log(`[Interview] 店舗情報が見つからないため、ダミーデータを使用します`);
        } else {
          console.log(`[Interview] 店舗情報を直接取得しました: ${directStoreData.name}`);
          storeData = directStoreData;
        }
      } else if (!storeData) {
        // store_idもない場合はダミーデータを使用
        console.log(`[Interview] 店舗情報がなく、store_idも見つかりません、ダミーデータを使用します`);
        storeData = {
          id: "unknown",
          name: "不明な店舗",
          description: "詳細情報が見つかりませんでした",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner_id: null
        };
      }
      
      // 取得したストア情報をセット
      setStoreInfo(storeData as Store);
      
      // インタビューデータをセット
      setInterview(interviewData as Interview);
      
      // 会話データが存在する場合、メッセージをセット
      if (interviewData.conversation && interviewData.conversation.length > 0) {
        setMessages(interviewData.conversation);
        initializedRef.current = true;
        
        // 会話の往復数をカウント (ユーザーのメッセージ数)
        const userMessageCount = interviewData.conversation.filter(msg => msg.role === 'user').length;
        setConversationRound(userMessageCount);
        
        // 進捗ポイントを設定（ゲーミフィケーション）
        setProgressPoints(userMessageCount * 10);
        
        // 情報充足評価
        if (userMessageCount >= SUFFICIENCY_CHECK_THRESHOLD) {
          evaluateInformationSufficiency(interviewData.conversation);
        }
        
        // 会話往復が閾値を超えていれば終了ボタン表示
        setShowEndButton(userMessageCount >= SUFFICIENCY_CHECK_THRESHOLD);
        
        // 最初のボットメッセージの場合はトピック選択を表示
        const botMessages = interviewData.conversation.filter(msg => msg.role === 'bot');
        if (botMessages.length === 1) {
          setShowTopicSelection(true);
          
          // メッセージからトピックオプションを抽出する試み
          const extractedTopics = extractTopicsFromMessage(botMessages[0].text || '');
          if (extractedTopics.length > 0) {
            setTopicOptions(extractedTopics);
          }
        }
      }
      
      setIsCompleted(interviewData.status === 'completed');
      
      if (interviewData.status === 'completed') {
        setAutoReviewText(interviewData.generated_review || '');
        setUserRating(interviewData.rating || 0);
        setShowReviewPrompt(true);
        
        // 店舗からのフォローアップメッセージを生成
        if (interviewData.conversation && interviewData.conversation.length > 0) {
          const generatedMessage = generateStoreMessage(
            interviewData.conversation, 
            storeData.name || '当店'
          );
          setStoreFollowupMessage(generatedMessage);
        }
        
        // クーポンアニメーションを表示（少し遅延させる）
        setTimeout(() => {
          setShowCouponAnimation(true);
        }, 500);
      }
      
      // 会話が空の場合のみ初期化（会話が既にあれば初期化しない）
      if ((!interviewData.conversation || interviewData.conversation.length === 0) && !initializedRef.current) {
        // ストア情報を使用して会話を初期化
        await initializeConversation(interviewData.id, storeData as Store);
        initializedRef.current = true;
      }
      
      // ストリーミングクライアントの初期化
      if (interviewData.status !== 'completed') {
        initializeStreamingClient(storeData as Store, interviewData.conversation || []);
      }
      
    } catch (err: any) {
      console.error('[Interview] データ取得エラー:', err);
      setError(err.message || 'インタビュー情報の読み込みエラー');
      setInterview(null);
      setStoreInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [interviewId]);

  // スクロールイベントハンドラ - ユーザーが手動でスクロールしたかどうかを検出
  const handleScroll = useCallback(() => {
    if (!messageListRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 20;
    
    // 最下部からスクロールアップしたらユーザースクロールとみなす
    if (!isAtBottom && !userHasScrolled) {
      setUserHasScrolled(true);
      setAutoScrollEnabled(false);
    }
    
    // 最下部までスクロールしたら自動スクロールを再有効化
    if (isAtBottom && userHasScrolled) {
      setUserHasScrolled(false);
      setAutoScrollEnabled(true);
    }
    
    lastScrollPositionRef.current = scrollTop;
  }, [userHasScrolled]);

  // メッセージリストのスクロールイベントリスナーを設定
  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList) {
      messageList.addEventListener('scroll', handleScroll);
      return () => messageList.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // メッセージが更新されたときのスクロール処理を最適化
  useEffect(() => {
    // 自動スクロールが有効か、新しいメッセージがユーザーから送信された場合のみスクロール
    const shouldScrollToBottom = 
      autoScrollEnabled || 
      (messages.length > 0 && messages[messages.length - 1].role === 'user') ||
      keyboardVisibleRef.current;
    
    if (shouldScrollToBottom) {
      // スクロールを少し遅延させて、レンダリングが完了してから実行
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, currentStreamingText, autoScrollEnabled]);

  // iOS SafariのSafe Area対応
  useEffect(() => {
    const detectSafeArea = () => {
      // CSSのenv()関数を使用して安全エリアの値を取得
      const safeAreaBottom = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--sat-safe-area-bottom') || '0'
      );
      
      // ビューポートの高さに対して一定の割合を安全エリアとして使用
      const viewportHeight = window.innerHeight;
      const calculatedSafeArea = Math.max(safeAreaBottom, Math.round(viewportHeight * 0.02));
      
      setSafeAreaBottom(calculatedSafeArea);
    };
    
    // 初期検出
    detectSafeArea();
    
    // リサイズ時にも再検出
    window.addEventListener('resize', detectSafeArea);
    
    // CSS変数をセット
    document.documentElement.style.setProperty('--safe-area-bottom', `${safeAreaBottom}px`);
    
    return () => {
      window.removeEventListener('resize', detectSafeArea);
    };
  }, [safeAreaBottom]);

  // ビューポートとキーボード高さの処理
  useEffect(() => {
    // メッセージリストの高さを調整する関数
    const adjustMessageListHeight = () => {
      if (!messageListRef.current || !inputAreaRef.current) return;
      
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const inputAreaHeight = inputAreaRef.current.offsetHeight;
      const headerHeight = 64; // ヘッダーの高さ
      
      // 新しい高さを計算（安全エリアも考慮）
      const newHeight = viewportHeight - inputAreaHeight - headerHeight - safeAreaBottom;
      
      // キーボードが表示されたかどうかを検出
      const isKeyboardShown = window.innerHeight > viewportHeight + 100;
      keyboardVisibleRef.current = isKeyboardShown;
      
      // 高さが大きく変わった場合のみ更新して不要な再レンダリングを防止
      if (Math.abs(newHeight - messageListHeight) > 10) {
        setMessageListHeight(newHeight);
        
        // キーボードが表示された場合のみ強制的に最下部にスクロール
        if (isKeyboardShown || !userHasScrolled) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 300); // キーボード表示の遅延を考慮して少し長めの遅延
        }
      }
    };

    // デバウンス処理用の関数
    const handleResize = () => {
      // 既存のタイムアウトをクリア
      if (heightAdjustmentTimeoutRef.current) {
        clearTimeout(heightAdjustmentTimeoutRef.current);
      }
      
      // 新しいタイムアウトを設定（デバウンス処理）
      heightAdjustmentTimeoutRef.current = setTimeout(() => {
        adjustMessageListHeight();
      }, 100);
    };
    
    // 初期サイズ設定
    adjustMessageListHeight();
    
    // イベントリスナーの登録
    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);
    
    // iOS Safariでの修正：フォーカスイベント処理の改善
    const handleFocusIn = (e: FocusEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        // キーボードが表示されたことを記録
        keyboardVisibleRef.current = true;
        
        // 高さ調整のみ実行し、デフォルトのスクロール動作は妨げない
        adjustMessageListHeight();
        
        // 入力欄にフォーカスしたときは最下部にスクロール
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 300); // キーボード表示の遅延を考慮
      }
    };
    
    document.addEventListener('focusin', handleFocusIn);
    
    // フォーカスが外れたときのハンドラ
    const handleFocusOut = () => {
      keyboardVisibleRef.current = false;
    };
    
    document.addEventListener('focusout', handleFocusOut);
    
    // クリーンアップ関数
    return () => {
      if (heightAdjustmentTimeoutRef.current) {
        clearTimeout(heightAdjustmentTimeoutRef.current);
      }
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [messageListHeight, userHasScrolled, safeAreaBottom]);

  // 初期データ取得とページ設定
  useEffect(() => {
    // データ取得は一度だけ実行
    if (!initializedRef.current) {
      fetchInterviewData();
    }
    
    // ページタイトルの設定
    if (storeInfo?.name) {
      document.title = `${storeInfo.name} | クチトル インタビュー`;
    } else {
      document.title = 'インタビュー | クチトル';
    }
    
    // モバイルビューポート設定
    const setViewportMetaTag = () => {
      let viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.setAttribute('name', 'viewport');
        document.head.appendChild(viewportMeta);
      }
      
      // キーボードの動きに合わせたビューポート設定
      viewportMeta.setAttribute('content', 
        'width=device-width, initial-scale=1.0, height=device-height, viewport-fit=cover');
    };
    
    // iOSタップ応答性向上のための設定
    const improveTouchResponsiveness = () => {
      const style = document.createElement('style');
      style.innerHTML = `
        * {
          -webkit-tap-highlight-color: rgba(0,0,0,0);
          touch-action: manipulation;
        }
        
        button, a, input, textarea, [role="button"] {
          cursor: pointer;
          touch-action: manipulation;
        }
        
        .fast-tap {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `;
      document.head.appendChild(style);
    };
    
    setViewportMetaTag();
    improveTouchResponsiveness();
    
    // 初期ガイダンスの表示タイミング設定
    if (messages.length === 0 || (messages.length === 1 && messages[0].role === 'bot')) {
      setShowInitialGuidance(true);
      // 5秒後に非表示
      const timer = setTimeout(() => {
        setShowInitialGuidance(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowInitialGuidance(false);
    }
    
    // ページ離脱時の警告（完了していない場合のみ）
    if (!isCompleted && messages.length > 1) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [fetchInterviewData, storeInfo, isCompleted, messages.length]);
  
  // ストリーミングクライアントの初期化関数
  const initializeStreamingClient = useCallback((storeData: Store, initialConversation: Message[] = []) => {
    if (!storeData || streamingClientRef.current || !useStreaming || isCompleted) return;
    
    try {
      console.log('[Streaming] ストリーミングクライアントの初期化を試みます');
      const client = createStreamingChatClient(storeData, initialConversation);
      
      client.setCallbacks({
        onReady: () => {
          console.log('[Streaming] クライアント準備完了');
          
          // トピック選択が保留中でなければ何もしない
          // これにより初期化時の重複メッセージを防ぐ
          if (!pendingTopicOptionsRef.current) {
            return;
          }
        },
        onChunk: (chunk) => {
          setIsTyping(true);
          setCurrentStreamingText(prev => prev + chunk);
        },
        onComplete: (fullResponse, isCompleted, updatedConversation) => {
          // ストリーミング完了時の処理
          setCurrentStreamingText('');
          setMessages(updatedConversation);
          setIsTyping(false);
          
          // ゲーミフィケーション - 新しい返信が来たら応答ストリークを更新
          updateResponseStreak();
          
          // トピックオプションがあれば表示
          if (updatedConversation.length === 1 && updatedConversation[0].role === 'bot') {
            const topicOpts = extractTopicsFromMessage(fullResponse);
            if (topicOpts.length > 0) {
              setTopicOptions(topicOpts);
              setShowTopicSelection(true);
            }
          }
          
          // インタビュー記録の更新
          if (interviewId) {
            supabase
              .from('interviews')
              .update({
                conversation: updatedConversation,
                updated_at: new Date().toISOString()
              })
              .eq('id', interviewId)
              .then(() => {
                console.log('[Streaming] インタビュー会話を保存しました');
              })
              .catch(err => {
                console.error('[Streaming] インタビュー保存エラー:', err);
              });
          }
          
          // 会話完了判定
          if (isCompleted) {
            setIsCompleted(true);
            handleConversationCompleted(updatedConversation);
          } else {
            // 会話の往復をカウント
            const userMessageCount = updatedConversation.filter(msg => msg.role === 'user').length;
            setConversationRound(userMessageCount);
            
            // 進捗ポイントを更新（ゲーミフィケーション）
            setProgressPoints(userMessageCount * 10);
            
            // 閾値に達した場合は情報の充足度を評価
            if (userMessageCount >= SUFFICIENCY_CHECK_THRESHOLD) {
              evaluateInformationSufficiency(updatedConversation);
              setShowEndButton(true); // 終了ボタンを表示
            }
            
            // 最大会話往復数に達した場合
            if (userMessageCount >= MAX_CONVERSATION_ROUNDS) {
              promptToEndConversation(updatedConversation);
            }
          }
        },
        onReview: (reviewText) => {
          setAutoReviewText(reviewText);
          // レビュー生成アニメーションの完了
          completeReviewGenerationAnimation();
          completeInterviewInDatabase(reviewText);
        },
        onError: (error) => {
          console.error('[Streaming] エラー:', error);
          
          // WebSocketが失敗したとき自動的にフォールバックに切り替え
          console.log('[Streaming] WebSocketが失敗したためAPIフォールバックに切り替えます');
          setUseStreaming(false);
          setIsTyping(false);
          
          // WebSocketエラーの場合はユーザー体験を確保するためにエラーは表示せず、APIフォールバックへと移行
          if (messages.length === 0 && storeInfo) {
            initializeConversation(interviewId!, storeInfo);
          }
        },
        onConnectionStatus: (status) => {
          console.log(`[Streaming] 接続状態が変更されました: ${status}`);
          setConnectionStatus(status);
          
          // fallbackモードに切り替わった場合、useStreamingをfalseに設定
          if (status === 'fallback') {
            setUseStreaming(false);
          }
        }
      });
      
      streamingClientRef.current = client;
      
      // 初期接続状態を設定
      setConnectionStatus(client.getConnectionStatus());
    } catch (error) {
      console.error('[Streaming] クライアント初期化エラー:', error);
      setUseStreaming(false);
      setConnectionStatus('fallback');
      
      // 初期化に失敗した場合、通常のAPIフォールバックを使用
      if (messages.length === 0 && storeInfo && interviewId) {
        initializeConversation(interviewId, storeInfo);
      }
    }
  }, [interviewId, messages.length, storeInfo, isCompleted, useStreaming]);

  // WebSocket client initialization
  useEffect(() => {
    if (!streamingClientRef.current && storeInfo && useStreaming && !isCompleted && !isLoading) {
      initializeStreamingClient(storeInfo, messages);
    }
    
    // クリーンアップ
    return () => {
      if (streamingClientRef.current) {
        streamingClientRef.current.close();
        streamingClientRef.current = null;
      }
    };
  }, [storeInfo, isCompleted, isLoading, useStreaming, initializeStreamingClient, messages]);

  // Apple Intelligence風グラデーションアニメーションを実装
  useEffect(() => {
    if (!showReviewGeneration) return;
    
    const reviewGenEl = reviewGenerationRef.current;
    if (!reviewGenEl) return;
    
    // グラデーションアニメーション
    let startTime = Date.now();
    let animationFrameId: number;
    
    const gradientColors = [
      { r: 74, g: 101, b: 242 },    // 青紫
      { r: 126, g: 87, b: 255 },    // 紫
      { r: 219, g: 39, b: 119 },    // ピンク
      { r: 249, g: 115, b: 22 },    // オレンジ
      { r: 74, g: 101, b: 242 }     // 青紫（循環のため）
    ];
    
    const animateGradient = () => {
      // 時間経過に基づく変化量（10秒でサイクル）
      const elapsed = (Date.now() - startTime) % 10000;
      const progress = elapsed / 10000;
      const offset = progress * 360;
      
      reviewGenEl.style.backgroundImage = `
        linear-gradient(
          ${offset}deg, 
          rgba(74, 101, 242, 0.7), 
          rgba(126, 87, 255, 0.7), 
          rgba(219, 39, 119, 0.7), 
          rgba(249, 115, 22, 0.7),
          rgba(74, 101, 242, 0.7)
        )
      `;
      
      // 次のフレームのアニメーションをリクエスト
      animationFrameId = requestAnimationFrame(animateGradient);
    };
    
    // アニメーション開始
    animationFrameId = requestAnimationFrame(animateGradient);
    
    // クリーンアップ時にアニメーションを停止
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [showReviewGeneration]);

  // Supabase Realtime subscriptionのセットアップ
  useEffect(() => {
    if (!interviewId || realtimeSubscriptionRef.current) return;

    console.log(`[Interview] Realtime subscription setup for interview ${interviewId}`);
    
    // インタビューの変更をリッスンするチャンネルを設定
    const subscription = supabase
      .channel(`interview-${interviewId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'interviews',
          filter: `id=eq.${interviewId}`,
        },
        (payload) => {
          console.log(`[Interview Realtime] Interview update detected:`, payload);
          
          // 会話データを更新
          if (payload.new && (payload.new as Interview).conversation) {
            const updatedInterview = payload.new as Interview;
            const newConversation = updatedInterview.conversation || [];
            
            // 更新が自分自身ではない場合のみメッセージを更新
            if (JSON.stringify(newConversation) !== JSON.stringify(messages)) {
              console.log(`[Interview Realtime] Updating messages from realtime change`);
              setMessages(newConversation);
              
              // 会話の往復数をカウント更新
              const userMessageCount = newConversation.filter(msg => msg.role === 'user').length;
              setConversationRound(userMessageCount);
              
              // 進捗ポイントを更新（ゲーミフィケーション）
              setProgressPoints(userMessageCount * 10);
              
              // 情報充足度評価
              if (userMessageCount >= SUFFICIENCY_CHECK_THRESHOLD) {
                evaluateInformationSufficiency(newConversation);
                setShowEndButton(true);
              }
            }
            
            // インタビューステータスも更新
            if (updatedInterview.status === 'completed' && !isCompleted) {
              setIsCompleted(true);
              setAutoReviewText(updatedInterview.generated_review || '');
              setUserRating(updatedInterview.rating || 0);
              setShowReviewPrompt(true);
              
              // クーポンアニメーションを表示（少し遅延させる）
              setTimeout(() => {
                setShowCouponAnimation(true);
              }, 500);
              
              // 店舗からのフォローアップメッセージを生成
              if (newConversation.length > 0 && storeInfo) {
                const generatedMessage = generateStoreMessage(
                  newConversation, 
                  storeInfo.name || '当店'
                );
                setStoreFollowupMessage(generatedMessage);
              }
            }
          }
        }
      )
      .subscribe();
      
    // 参照を保存してクリーンアップ時に使用
    realtimeSubscriptionRef.current = {
      subscription,
      unsubscribe: () => {
        console.log(`[Interview] Unsubscribing from realtime updates for interview ${interviewId}`);
        subscription.unsubscribe();
      }
    };
    
    // クリーンアップ関数
    return () => {
      if (realtimeSubscriptionRef.current) {
        realtimeSubscriptionRef.current.unsubscribe();
        realtimeSubscriptionRef.current = null;
      }
    };
  }, [interviewId, isCompleted, messages, storeInfo]);
  
  // ネットワーク状態の監視
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Interview] Network is online');
      // ネットワークが回復したらWebSocketクライアントを再作成
      if (!streamingClientRef.current && storeInfo && useStreaming && !isCompleted) {
        initializeStreamingClient(storeInfo, messages);
      }
    };
    
    const handleOffline = () => {
      console.log('[Interview] Network is offline');
      setConnectionStatus('disconnected');
    };
    
    // ネットワーク状態変更のイベントリスナーを追加
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // クリーンアップ
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [storeInfo, messages, isCompleted, initializeStreamingClient, useStreaming]);
  
  // 紙吹雪アニメーション
  useEffect(() => {
    if (!isExploding || !confettiCanvasRef.current) return;
    
    const canvas = confettiCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // キャンバスサイズをビューポートに合わせる
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 紙吹雪のパーティクルを初期化
    const particleCount = 150;
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
    }> = [];
    
    const colors = [
      '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', 
      '#536DFE', '#448AFF', '#40C4FF', '#18FFFF',
      '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41',
      '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
    ];
    
    // パーティクルを生成
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        size: Math.random() * 10 + 5,
        speedX: (Math.random() - 0.5) * 15,
        speedY: (Math.random() - 0.5) * 15 - 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }
    
    particlesRef.current = particles;
    
    // パーティクルアニメーション
    let animationFrameId: number;
    let startTime = Date.now();
    
    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const elapsed = Date.now() - startTime;
      const opacity = Math.max(0, 1 - elapsed / 3000); // 3秒でフェードアウト
      
      // すべてのパーティクルが見えなくなったら終了
      if (opacity <= 0) {
        setIsExploding(false);
        return;
      }
      
      // パーティクルを描画
      for (const particle of particlesRef.current) {
        // パーティクルの位置を更新
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.speedY += 0.1; // 重力
        particle.rotation += particle.rotationSpeed;
        
        // 紙吹雪を描画
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = particle.color;
        
        // 長方形の紙吹雪
        ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
        
        ctx.restore();
      }
      
      animationFrameId = requestAnimationFrame(animateParticles);
    };
    
    // アニメーション開始
    animationFrameId = requestAnimationFrame(animateParticles);
    
    // クリーンアップ
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isExploding]);
  
  // 応答ストリークを更新するゲーミフィケーション機能
  const updateResponseStreak = () => {
    const now = new Date();
    
    // 前回の応答時間がセットされている場合
    if (lastResponseTime) {
      const timeDiff = now.getTime() - lastResponseTime.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      // 10分以内の応答でストリーク増加
      if (minutesDiff <= 10) {
        const newStreak = currentStreak + 1;
        setCurrentStreak(newStreak);
        
        // ストリーク達成によるアチーブメント解除
        if (newStreak === 3 && !achievementUnlocked) {
          setAchievementUnlocked(true);
          // 少し遅延してから非表示
          setTimeout(() => {
            setAchievementUnlocked(false);
          }, 3000);
        }
      } else {
        // 10分以上経過していたらストリークリセット
        setCurrentStreak(1);
      }
    } else {
      // 初めての応答
      setCurrentStreak(1);
    }
    
    // 最終応答時間を更新
    setLastResponseTime(now);
  };

  // Enterキー押下でメッセージ送信
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // 情報充足度評価関数
  const evaluateInformationSufficiency = (conversation: Message[]) => {
    // 評価カテゴリ
    const categories = [
      { name: 'service', keywords: ['サービス', '接客', '対応', 'スタッフ', '店員', '従業員'] },
      { name: 'product', keywords: ['商品', '料理', '品質', '味', 'メニュー', '商材'] },
      { name: 'atmosphere', keywords: ['雰囲気', '店内', '内装', '清潔', '環境', '居心地'] },
      { name: 'price', keywords: ['価格', '料金', 'コスパ', '値段', '安い', '高い', '妥当'] },
      { name: 'feedback', keywords: ['改善', '要望', '期待', '次回', '提案', 'アドバイス'] }
    ];
    
    // ユーザーのメッセージをすべて結合
    const userContent = conversation
      .filter(msg => msg.role === 'user')
      .map(msg => msg.text || '')
      .join(' ');
    
    // カテゴリごとの情報充足度を評価
    const sufficientCats: string[] = [];
    
    categories.forEach(category => {
      // カテゴリのキーワードが含まれているか確認
      const hasKeywords = category.keywords.some(keyword => 
        userContent.toLowerCase().includes(keyword.toLowerCase())
      );
      
      // 十分な情報が含まれている場合、カテゴリを追加
      if (hasKeywords) {
        sufficientCats.push(category.name);
      }
    });
    
    // 充足度合計を設定
    setSufficientCategories(sufficientCats);
    setInformationSufficiency(sufficientCats.length);
    
    // デバッグログ
    console.log(`[Interview] 情報充足度評価: ${sufficientCats.length}/5 カテゴリ`, sufficientCats);
    
    // 充足カテゴリが3以上なら「情報充足」と判断
    return sufficientCats.length >= 3;
  };
  
  // 会話終了促進メッセージの生成
  const promptToEndConversation = async (conversation: Message[]) => {
    if (!interviewId || !storeInfo) return;
    
    const endPromptMessage: Message = {
      role: 'bot',
      text: 'ご意見をありがとうございました！インタビューを終わる場合は、終了ボタンをクリックしてください。引き続きご意見等ある場合は、そのままチャットに文章を入力してください。',
      timestamp: new Date().toISOString()
    };
    
    // メッセージの追加
    const updatedConversation = [...conversation, endPromptMessage];
    setMessages(updatedConversation);
    setShowEndButton(true);
    
    // DBの更新
    try {
      await supabase
        .from('interviews')
        .update({
          conversation: updatedConversation,
          updated_at: new Date().toISOString()
        })
        .eq('id', interviewId);
        
      console.log(`[Interview] 会話終了促進メッセージを追加しました`);
    } catch (err) {
      console.error('[Interview] 会話終了促進メッセージの追加に失敗:', err);
    }
  };
  
  // メッセージからトピック選択肢を抽出
  const extractTopicsFromMessage = (message: string): string[] => {
    // トピック選択肢を抽出するヒューリスティック
    try {
      // パターン1: 「以下のトピックから選んでください」の後に列挙
      const topicSectionRegex = /(?:以下|下記)の(?:トピック|話題|項目).*(?:選|教)(?:んで|えて)/i;
      const hasTopicSection = topicSectionRegex.test(message);
      
      if (hasTopicSection) {
        // パターン1: 改行と数字や記号で区切られたリスト
        const listItems = message.split(/\n/).filter(line => 
          line.trim().match(/^[•\-*・]|^\d+[\.\)）]|「.+?」/)
        ).map(line => 
          line.trim().replace(/^[•\-*・]|^\d+[\.\)）]\s*|「(.+?)」.*$/, '$1')
        );
        
        if (listItems.length >= 2) {
          return listItems.map(item => item.trim()).filter(Boolean);
        }
        
        // パターン2: 文中のカンマ区切りリスト
        const inlineListMatches = message.match(/(?:について|に関して|を選んでください)[：:・]?\s*[「『](.+?)[」』]/);
        if (inlineListMatches && inlineListMatches[1]) {
          const items = inlineListMatches[1].split(/[、,]/).map(item => item.trim());
          if (items.length >= 2) return items;
        }
      }
      
      // パターン3: 質問の列挙
      const topicPattern = /(?:「[^」\n]+」|『[^』\n]+』|[^、。\n]{5,}かですか[\?？])/g;
      const topicMatches = message.match(topicPattern);
      
      if (topicMatches && topicMatches.length >= 2) {
        const cleanedTopics = topicMatches.map(topic => 
          topic.replace(/^「|」$|^『|』$|ですか[\?？]$/g, '').trim()
        );
        
        return cleanedTopics;
      }
    } catch (e) {
      console.error('Error extracting topic options:', e);
    }
    
    // デフォルトのトピック
    return ["店内の雰囲気", "スタッフの対応", "商品・サービスの品質", "価格", "その他の感想"];
  };
  
  // トピック選択肢を取得する関数
  const requestTopicOptions = async (interviewId: string, storeData: Store, existingConversation: Message[] = []) => {
    if (!interviewId || !storeData) return;
    
    console.log(`[Interview] トピック選択肢を取得中...`);
    setIsTyping(true);
    setError(null);
    
    try {
      // エラー処理のリセット
      apiRetryCountRef.current = 0;
      
      // AIレスポンスを生成
      const response = await generateChatResponseApi(
        existingConversation, 
        storeData
      );
      
      if (!response.success || !response.message) {
        throw new Error(response.error || 'AIからの応答の取得に失敗しました');
      }
      
      console.log(`[Interview] AIレスポンス取得成功: ${response.message.substring(0, 50)}...`);
      
      // トピック選択肢が返された場合
      if (response.topicOptions && Array.isArray(response.topicOptions)) {
        setTopicOptions(response.topicOptions);
        setShowTopicSelection(true);
        
        console.log(`[Interview] トピック選択肢設定: ${response.topicOptions.join(', ')}`);
      } else {
        // レスポンスからトピックを抽出
        const extractedTopics = extractTopicsFromMessage(response.message);
        if (extractedTopics.length > 0) {
          setTopicOptions(extractedTopics);
          setShowTopicSelection(true);
          console.log(`[Interview] メッセージから抽出したトピック選択肢: ${extractedTopics.join(', ')}`);
        }
      }
      
      // メッセージに追加
      const botMessage: Message = {
        role: 'bot',
        text: response.message,
        timestamp: new Date().toISOString()
      };
      
      // メッセージ更新（UI）
      if (existingConversation.length === 0) {
        setMessages([botMessage]);
      } else {
        setMessages((prev) => [...prev, botMessage]);
      }
      
      // メッセージ更新（DB）
      const conversation = existingConversation.length === 0 ? [botMessage] : [...existingConversation, botMessage];
      
      await supabase
        .from('interviews')
        .update({
          conversation: conversation,
          updated_at: new Date().toISOString()
        })
        .eq('id', interviewId);
    } catch (err: any) {
      console.error('[Interview] トピック選択肢取得エラー:', err);
      
      // リトライカウンターを増やす
      apiRetryCountRef.current += 1;
      
      // 最大リトライ回数未満ならリトライ
      if (apiRetryCountRef.current < MAX_RETRY_ATTEMPTS) {
        console.log(`[Interview] トピック選択肢を再取得します (${apiRetryCountRef.current}/${MAX_RETRY_ATTEMPTS})...`);
        
        // 少し待ってから再試行
        setTimeout(() => {
          requestTopicOptions(interviewId, storeData, existingConversation);
        }, 1000 * apiRetryCountRef.current); // リトライごとに待ち時間を増やす
        
        return;
      }
      
      // リトライ回数が上限に達した場合、フォールバックのデフォルトメッセージを表示
      console.log('[Interview] 最大リトライ回数に達しました。デフォルトトピックを使用します');
      
      // デフォルトのトピック選択肢とウェルカムメッセージ
      const defaultTopics = ["店内の雰囲気", "スタッフの対応", "商品・サービスの品質", "価格", "その他"];
      const defaultMessage = `こんにちは！${storeData.name || '当店'}の評価にご協力いただきありがとうございます。以下のトピックから気になるものを選んでください。`;
      
      setTopicOptions(defaultTopics);
      setShowTopicSelection(true);
      
      // デフォルトメッセージを追加
      const fallbackBotMessage: Message = {
        role: 'bot',
        text: defaultMessage,
        timestamp: new Date().toISOString()
      };
      
      // メッセージ更新（UI）
      if (existingConversation.length === 0) {
        setMessages([fallbackBotMessage]);
      } else {
        setMessages((prev) => [...prev, fallbackBotMessage]);
      }
      
      // メッセージ更新（DB）
      const conversation = existingConversation.length === 0 ? [fallbackBotMessage] : [...existingConversation, fallbackBotMessage];
      
      try {
        await supabase
          .from('interviews')
          .update({
            conversation: conversation,
            updated_at: new Date().toISOString()
          })
          .eq('id', interviewId);
      } catch (updateErr) {
        console.error('[Interview] フォールバックメッセージの保存エラー:', updateErr);
      }
    } finally {
      setIsTyping(false);
    }
  };

  // 会話の初期化
  const initializeConversation = async (interviewId: string, storeData: Store) => {
    if (!interviewId || !storeData || initializedRef.current) return;
    
    console.log(`[Interview] 会話を初期化中...`);
    setIsTyping(true);
    setError(null);
    pendingTopicOptionsRef.current = true;
    
    try {
      // 空の会話履歴でAIレスポンスを生成
      await requestTopicOptions(interviewId, storeData, []);
      initializedRef.current = true;
    } catch (err: any) {
      console.error('[Interview] 会話初期化エラー:', err);
      setError('会話の初期化中にエラーが発生しました。ページを再読み込みしてください。');
    } finally {
      setIsTyping(false);
      pendingTopicOptionsRef.current = false;
    }
  };

  // --- メッセージ送信処理 ---
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !interviewId || isCompleted || isTyping || !interview || !storeInfo) return;
    
    const userMessageText = inputMessage.trim();
    setInputMessage('');
    
    const newUserMessage: Message = {
      role: 'user',
      text: userMessageText,
      timestamp: new Date().toISOString()
    };
    
    // UIにメッセージを追加
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsTyping(true);
    setError(null);
    
    // 現在のトピック選択を非表示にする
    setShowTopicSelection(false);
    
    // 自動スクロールを有効に（ユーザーがメッセージを送信したため）
    setAutoScrollEnabled(true);
    setUserHasScrolled(false);
    
    try {
      // 1. ユーザーメッセージをDBに保存
      const currentConversation = [...messages, newUserMessage];
      const { error: addMsgError } = await supabase
        .from('interviews')
        .update({
          conversation: currentConversation,
          updated_at: new Date().toISOString()
        })
        .eq('id', interviewId);
        
      if (addMsgError) {
        throw addMsgError;
      }
      
      // 会話の往復数をカウント更新
      const userMessageCount = currentConversation.filter(msg => msg.role === 'user').length;
      setConversationRound(userMessageCount);
      
      // 進捗ポイントを更新（ゲーミフィケーション）
      setProgressPoints(userMessageCount * 10);
      
      // 2. ストリーミングクライアントが利用可能な場合は使用
      if (useStreaming && streamingClientRef.current) {
        const sent = streamingClientRef.current.sendMessage(userMessageText);
        
        if (!sent) {
          // 送信失敗時はフォールバック
          console.warn('[Interview] WebSocketでのメッセージ送信に失敗、APIフォールバックを使用します');
          await handleSendMessageFallback(currentConversation);
        }
      } else {
        // フォールバックAPIを使用
        await handleSendMessageFallback(currentConversation);
      }
      
      // 会話往復数が閾値以上なら情報充足度を評価
      if (userMessageCount >= SUFFICIENCY_CHECK_THRESHOLD) {
        const isSufficient = evaluateInformationSufficiency(currentConversation);
        setShowEndButton(true);
        
        // 最大往復数に達した場合または情報が十分な場合
        if (userMessageCount >= MAX_CONVERSATION_ROUNDS || (isSufficient && !showEndButton)) {
          promptToEndConversation(currentConversation);
        }
      }
    } catch (err: any) {
      console.error('Send message error:', err);
      setError('メッセージの送信中にエラーが発生しました。もう一度お試しください。');
      setIsTyping(false);
    }
  };
  
  // フォールバックを使用したメッセージ送信処理
  const handleSendMessageFallback = async (currentConversation: Message[]) => {
    if (!storeInfo || !interviewId) return;
    
    try {
      // API呼び出しリトライカウンターをリセット
      apiRetryCountRef.current = 0;
      
      // AI応答生成API
      const response = await generateChatResponseApi(currentConversation, storeInfo);
      
      if (!response.success || !response.message) {
        throw new Error(response.error || 'AI応答の取得に失敗しました');
      }
      
      const botMessage: Message = {
        role: 'bot',
        text: response.message,
        timestamp: new Date().toISOString()
      };
      
      // ボットメッセージをUIに追加
      setMessages(prev => [...prev, botMessage]);
      
      // ボットメッセージをDBに保存
      const updatedConversation = [...currentConversation, botMessage];
      const { error: addBotMsgError } = await supabase
        .from('interviews')
        .update({
          conversation: updatedConversation,
          updated_at: new Date().toISOString()
        })
        .eq('id', interviewId);
        
      if (addBotMsgError) {
        console.error("Failed to save bot message:", addBotMsgError);
      }
      
      // 応答ストリークを更新（ゲーミフィケーション）
      updateResponseStreak();
      
      // トピック選択肢が返された場合
      if (response.topicOptions && Array.isArray(response.topicOptions) && response.topicOptions.length > 0) {
        setTopicOptions(response.topicOptions);
        setShowTopicSelection(true);
      } else {
        setShowTopicSelection(false);
      }
      
      // 完了処理
      if (response.isCompleted) {
        await handleConversationCompleted(updatedConversation);
      }
    } catch (error: any) {
      console.error('Send message fallback error:', error);
      
      // リトライカウンターを増やす
      apiRetryCountRef.current += 1;
      
      // 最大リトライ回数未満ならリトライ
      if (apiRetryCountRef.current < MAX_RETRY_ATTEMPTS) {
        console.log(`[Interview] メッセージ応答を再取得します (${apiRetryCountRef.current}/${MAX_RETRY_ATTEMPTS})...`);
        
        // 少し待ってから再試行
        setTimeout(() => {
          handleSendMessageFallback(currentConversation);
        }, 1000 * apiRetryCountRef.current); // リトライごとに待ち時間を増やす
        
        return;
      }
      
      // リトライ回数が上限に達した場合、フォールバックの簡易応答を生成
      console.log('[Interview] 最大リトライ回数に達しました。簡易応答を生成します');
      
      // 最後のユーザーメッセージを取得
      const lastUserMessage = currentConversation.filter(msg => msg.role === 'user').pop();
      
      // 簡易的な応答生成
      let fallbackResponse = "ありがとうございます。他にコメントはありますか？";
      
      if (lastUserMessage) {
        // 「完了」などの終了ワードがある場合
        if (lastUserMessage.text.includes('完了') || lastUserMessage.text.includes('終了') || 
            lastUserMessage.text.includes('以上') || lastUserMessage.text.includes('ない')) {
          fallbackResponse = "ご意見ありがとうございました。これで評価を完了します。";
          
          // 完了フラグを設定
          const fallbackBotMessage: Message = {
            role: 'bot',
            text: fallbackResponse,
            timestamp: new Date().toISOString()
          };
          
          // UIを更新
          setMessages(prev => [...prev, fallbackBotMessage]);
          
          // DBを更新
          const updatedConversation = [...currentConversation, fallbackBotMessage];
          try {
            await supabase
              .from('interviews')
              .update({
                conversation: updatedConversation,
                updated_at: new Date().toISOString()
              })
              .eq('id', interviewId);
            
            // 完了処理に進む
            await handleConversationCompleted(updatedConversation);
            
          } catch (updateErr) {
            console.error('[Interview] フォールバック完了メッセージの保存エラー:', updateErr);
          }
          
          return;
        }
      }
      
      // 通常の応答の場合
      const fallbackBotMessage: Message = {
        role: 'bot',
        text: fallbackResponse,
        timestamp: new Date().toISOString()
      };
      
      // UIを更新
      setMessages(prev => [...prev, fallbackBotMessage]);
      
      // DBを更新
      try {
        await supabase
          .from('interviews')
          .update({
            conversation: [...currentConversation, fallbackBotMessage],
            updated_at: new Date().toISOString()
          })
          .eq('id', interviewId);
      } catch (updateErr) {
        console.error('[Interview] フォールバックメッセージの保存エラー:', updateErr);
      }
    } finally {
      setIsTyping(false);
    }
  };
  
  // トピック選択処理
  const handleTopicSelect = async (topic: string) => {
    if (isTyping || isCompleted || !interviewId || !storeInfo) return;
    
    // 選択されたトピックをユーザーメッセージとして追加
    const topicMessage: Message = {
      role: 'user',
      text: topic,
      timestamp: new Date().toISOString()
    };
    
    // タップフィードバックのためのちらつき効果
    const addTapFeedback = (element: HTMLElement) => {
      element.classList.add('tap-feedback');
      setTimeout(() => {
        element.classList.remove('tap-feedback');
      }, 300);
    };
    
    // 選択されたボタン要素にタップフィードバックを追加
    const selectedTopicBtn = document.querySelector(`button[data-topic="${topic}"]`) as HTMLElement;
    if (selectedTopicBtn) {
      addTapFeedback(selectedTopicBtn);
    }
    
    setMessages(prev => [...prev, topicMessage]);
    setShowTopicSelection(false); // 選択後は選択UIを非表示
    setIsTyping(true);
    setError(null);
    
    // 自動スクロールを有効に（ユーザーが選択したため）
    setAutoScrollEnabled(true);
    setUserHasScrolled(false);
    
    // 会話往復数を更新
    setConversationRound(prev => prev + 1);
    
    // 進捗ポイントを更新（ゲーミフィケーション）
    setProgressPoints(prev => prev + 10);
    
    try {
      // ユーザーのトピック選択をDBに保存
      const currentConversation = [...messages, topicMessage];
      const { error: updateError } = await supabase
        .from('interviews')
        .update({
          conversation: currentConversation,
          updated_at: new Date().toISOString()
        })
        .eq('id', interviewId);
      
      if (updateError) throw updateError;
      
      // ストリーミングクライアントが利用可能な場合は使用
      if (useStreaming && streamingClientRef.current) {
        const sent = streamingClientRef.current.sendMessage(topic);
        
        if (!sent) {
          // 送信失敗時はフォールバック
          console.warn('[Interview] トピック選択のWebSocket送信に失敗、APIフォールバックを使用します');
          await handleSendMessageFallback(currentConversation);
        }
      } else {
        // フォールバックAPIを使用
        await handleSendMessageFallback(currentConversation);
      }
    } catch (err: any) {
      console.error('Topic selection error:', err);
      setError('トピック選択の処理中にエラーが発生しました。もう一度お試しください。');
      setIsTyping(false);
    }
  };

  // 会話終了ボタン処理
  const handleEndInterview = async () => {
    if (!interviewId || !storeInfo || !messages.length) return;
    
    setIsTyping(true);
    
    try {
      // 終了メッセージの追加
      const endingMessage: Message = {
        role: 'bot',
        text: `${storeInfo.thanks_message || 'インタビューにお答えいただき、ありがとうございました。お客様からのご意見は、サービス改善に役立ててまいります。'}`,
        timestamp: new Date().toISOString()
      };
      
      const updatedConversation = [...messages, endingMessage];
      
      // UIを更新
      setMessages(updatedConversation);
      
      // DBを更新
      await supabase
        .from('interviews')
        .update({
          conversation: updatedConversation,
          updated_at: new Date().toISOString()
        })
        .eq('id', interviewId);
      
      // 会話完了処理に進む
      await handleConversationCompleted(updatedConversation);
      
    } catch (err) {
      console.error('[Interview] インタビュー終了処理エラー:', err);
      setError('インタビュー終了処理中にエラーが発生しました。');
      setIsTyping(false);
    }
  };

  // レビュー生成アニメーションを開始
  const startReviewGenerationAnimation = () => {
    // レビュー生成アニメーションの状態をリセット
    setReviewGenerationProgress(0);
    setIsGeneratingReview(true);
    setShowReviewGeneration(true);
    
    // プログレスバーのアニメーション
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      if (progress >= 100) {
        clearInterval(interval);
      }
      setReviewGenerationProgress(progress);
    }, 50);
  };
  
  // レビュー生成アニメーションを完了
  const completeReviewGenerationAnimation = () => {
    // プログレスバーを100%に設定
    setReviewGenerationProgress(100);
    
    // 少し待ってからアニメーションを非表示にし、レビュー表示に移行
    setTimeout(() => {
      setIsGeneratingReview(false);
      setShowReviewGeneration(false);
      setShowReviewPrompt(true);
      
      // クーポンアニメーションを表示（少し遅延させる）
      setTimeout(() => {
        setShowCouponAnimation(true);
      }, 500);
      
      // 紙吹雪効果を表示
      setIsExploding(true);
    }, 1000);
  };

  // 会話完了処理
  const handleConversationCompleted = async (finalConversation: Message[]) => {
    if (!interviewId || !interview || !storeInfo) return;
    
    setIsTyping(true);
    setError(null);
    
    // レビュー生成アニメーションを開始
    startReviewGenerationAnimation();
    
    try {
      // ストリーミングクライアントでレビュー生成
      if (useStreaming && streamingClientRef.current) {
        const sent = streamingClientRef.current.generateReview();
        
        if (!sent) {
          // 送信失敗時はフォールバック
          console.warn('[Interview] WebSocketでのレビュー生成に失敗、APIフォールバックを使用します');
          await generateReviewFallback(finalConversation);
        }
      } else {
        // フォールバックAPIを使用
        await generateReviewFallback(finalConversation);
      }
    } catch (err: any) {
      console.error('Complete conversation error:', err);
      setError('レビュー生成中にエラーが発生しました。しばらくしてからもう一度お試しください。');
      setIsTyping(false);
      
      // エラーの場合もアニメーションを完了
      completeReviewGenerationAnimation();
    }
  };
  
  // レビュー生成フォールバック
  const generateReviewFallback = async (finalConversation: Message[]) => {
    if (!storeInfo || !interviewId) return;
    
    try {
      // API呼び出しリトライカウンターをリセット
      apiRetryCountRef.current = 0;
      
      // レビュー生成API
      const reviewResponse = await generateReviewApi(finalConversation, storeInfo);
      
      if (!reviewResponse.success || !reviewResponse.reviewText) {
        throw new Error(reviewResponse.error || 'レビューの生成に失敗しました');
      }
      
      setAutoReviewText(reviewResponse.reviewText);
      
      // アニメーション完了
      completeReviewGenerationAnimation();
      
      await completeInterviewInDatabase(reviewResponse.reviewText, finalConversation);
    } catch (error: any) {
      console.error('Review fallback error:', error);
      
      // リトライカウンターを増やす
      apiRetryCountRef.current += 1;
      
      // 最大リトライ回数未満ならリトライ
      if (apiRetryCountRef.current < MAX_RETRY_ATTEMPTS) {
        console.log(`[Interview] レビュー生成を再試行します (${apiRetryCountRef.current}/${MAX_RETRY_ATTEMPTS})...`);
        
        // 少し待ってから再試行
        setTimeout(() => {
          generateReviewFallback(finalConversation);
        }, 1000 * apiRetryCountRef.current); // リトライごとに待ち時間を増やす
        
        return;
      }
      
      // リトライ回数が上限に達した場合、フォールバックの簡易レビューを生成
      console.log('[Interview] 最大リトライ回数に達しました。簡易レビューを生成します');
      
      // 会話から簡易的なレビューを生成
      const userMessages = finalConversation.filter(msg => msg.role === 'user').map(msg => msg.text);
      let fallbackReview = `${storeInfo.name || '店舗'}をご利用いただきありがとうございました。お客様からいただいたフィードバックを元に、より良いサービスの提供に努めてまいります。`;
      
      setAutoReviewText(fallbackReview);
      
      // アニメーション完了
      completeReviewGenerationAnimation();
      
      // フォールバックレビューをDBに保存
      await completeInterviewInDatabase(fallbackReview, finalConversation);
    }
  };
  
  // DBにインタビュー完了を保存
  const completeInterviewInDatabase = async (reviewText: string, finalConversation?: Message[]) => {
    if (!interviewId) return;
    
    try {
      const defaultRating = 4; // デフォルト評価
      
      const { error: completeError } = await supabase
        .from('interviews')
        .update({
          status: 'completed',
          generated_review: reviewText,
          rating: defaultRating,
          updated_at: new Date().toISOString()
        })
        .eq('id', interviewId);
        
      if (completeError) {
        throw completeError;
      }
      
      // 店舗からのフォローアップメッセージを生成
      if (finalConversation && storeInfo) {
        const generatedMessage = generateStoreMessage(
          finalConversation, 
          storeInfo.name || '当店'
        );
        setStoreFollowupMessage(generatedMessage);
      }
      
      // UI更新
      setUserRating(defaultRating);
      setIsCompleted(true);
      setInterview(prev => prev ? {
        ...prev,
        status: 'completed',
        generated_review: reviewText,
        rating: defaultRating
      } : null);
      
    } catch (error: any) {
      console.error('Complete interview DB error:', error);
      setError('インタビューの完了処理中にエラーが発生しました。');
    } finally {
      setIsTyping(false);
    }
  };

  // 評価変更処理
  const handleRatingChange = async (rating: number) => {
    if (!interviewId || !isCompleted || isSubmittingRating) return;
    
    setUserRating(rating);
    setIsSubmittingRating(true);
    setError(null);
    
    try {
      // DBの評価を更新
      const { error } = await supabase
        .from('interviews')
        .update({
          rating: rating,
          updated_at: new Date().toISOString()
        })
        .eq('id', interviewId);
        
      if (error) {
        throw error;
      }
      
      // ローカルインタビュー情報も更新
      setInterview(prev => prev ? {
        ...prev,
        rating: rating
      } : null);
      
    } catch (err: any) {
      console.error('Update rating error:', err);
      setError('評価の更新に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // フィードバック送信処理
  const handleFeedbackSubmit = async (feedbackText: string) => {
    if (!interviewId) return;
    
    try {
      if (feedbackText.trim()) {
        try {
          await fetch('/.netlify/functions/save-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              interviewId,
              feedback: feedbackText
            })
          });
        } catch (err) {
          console.error('Feedback submission error:', err);
        }
      }
      
      setShowFeedbackForm(false);
      setShowThankYouMessage(true);
    } catch (error) {
      console.error('Feedback submit error:', error);
    }
  };

  // Googleレビューへの遷移アニメーション
  const handleGoogleRedirect = () => {
    // アニメーション表示
    setShowGoogleRedirectAnimation(true);
    
    // 少し遅延してからリダイレクト
    setTimeout(() => {
      redirectToGoogleReview();
      
      // アニメーションを非表示
      setTimeout(() => {
        setShowGoogleRedirectAnimation(false);
      }, 1500);
    }, 800);
  };

  // Googleレビューページへのリダイレクト
  const redirectToGoogleReview = useCallback(() => {
    if (!storeInfo?.google_place_id) {
      setError('Google Maps情報が見つかりません');
      return;
    }
    
    const reviewUrl = getGoogleReviewUrl(storeInfo.google_place_id);
    window.open(reviewUrl, '_blank', 'noopener,noreferrer');
  }, [storeInfo?.google_place_id]);

  // メッセージの時刻フォーマット
  const formatMessageTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);
  
  // --- レンダリング関数 ---
  
  // 接続状態インジケーターを表示
  const renderConnectionStatus = () => {
    if (isCompleted || !useStreaming) return null;
    
    let statusIcon = null;
    let statusColor = '';
    let statusText = '';
    
    switch (connectionStatus) {
      case 'connected':
        statusIcon = <Wifi size={14} />;
        statusColor = 'text-green-500';
        statusText = 'リアルタイム接続中';
        break;
      case 'connecting':
        statusIcon = <Loader2 size={14} className="animate-spin" />;
        statusColor = 'text-yellow-500';
        statusText = '接続中...';
        break;
      case 'disconnected':
        statusIcon = <WifiOff size={14} />;
        statusColor = 'text-red-500';
        statusText = '接続が切断されました';
        break;
      case 'fallback':
        statusIcon = <Info size={14} />;
        statusColor = 'text-blue-500';
        statusText = '標準モード';
        break;
    }
    
    return (
      <div className={`flex items-center text-xs gap-1 py-0.5 px-2 rounded-full bg-gray-100 ${statusColor}`}>
        {statusIcon}
        <span>{statusText}</span>
      </div>
    );
  };
  
  // 情報充足度インジケーターを表示
  const renderSufficiencyIndicator = () => {
    if (conversationRound < SUFFICIENCY_CHECK_THRESHOLD || isCompleted) return null;
    
    // ステータスカラー
    let statusColor = 'bg-red-400';
    if (informationSufficiency >= 4) statusColor = 'bg-green-500';
    else if (informationSufficiency >= 3) statusColor = 'bg-emerald-400';
    else if (informationSufficiency >= 2) statusColor = 'bg-yellow-400';
    
    return (
      <div className="p-2 bg-gray-50 rounded-lg mb-3">
        <div className="flex justify-between items-center mb-1">
          <p className="text-xs text-gray-600">情報充足度:</p>
          <p className="text-xs font-medium">{informationSufficiency}/5</p>
        </div>
        <Progress value={informationSufficiency * 20} className={`h-1.5 ${statusColor}`} />
      </div>
    );
  };
  
  // 進捗ポイント表示（ゲーミフィケーション）
  const renderProgressPoints = () => {
    if (isCompleted) return null;
    
    return (
      <div className="fixed top-16 right-3 z-10 bg-blue-100 rounded-full px-3 py-1 shadow-md border border-blue-200 flex items-center gap-1.5">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        <span className="text-xs font-medium text-blue-700">{progressPoints} pts</span>
      </div>
    );
  };
  
  // アチーブメント表示（ゲーミフィケーション）
  const renderAchievement = () => {
    if (!achievementUnlocked) return null;
    
    return (
      <div className="fixed top-1/4 left-0 right-0 z-50 flex justify-center">
        <div className="animate-achievement bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 p-0.5 rounded-lg shadow-lg">
          <div className="bg-white px-4 py-3 rounded-lg flex items-center gap-2">
            <Star size={20} className="text-amber-500 fill-amber-500" />
            <div>
              <h4 className="font-semibold text-sm">素早い返答達成！</h4>
              <p className="text-xs text-gray-500">連続返信ストリーク: {currentStreak}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Google遷移アニメーション
  const renderGoogleRedirectAnimation = () => {
    if (!showGoogleRedirectAnimation) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-all duration-500">
        <div className="w-16 h-16 relative animate-bounce">
          <img src="/google-logo.svg" alt="Google" className="w-full h-full" />
          <div className="absolute inset-0 animate-ping-slow rounded-full bg-white opacity-75"></div>
        </div>
      </div>
    );
  };
  
  // レビュー生成アニメーション
  const renderReviewGeneration = () => {
    if (!showReviewGeneration) return null;
    
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-white bg-opacity-90">
        <div 
          ref={reviewGenerationRef}
          className="w-64 h-64 rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg bg-white"
        >
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full relative flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse"></div>
              <PenTool size={40} className="text-blue-600 z-10 animate-float" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">レビューを生成中</h3>
          <p className="text-sm text-gray-600 mb-4 text-center">
            インタビューの内容を分析し<br />レビューを作成しています
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 h-2 rounded-full transition-all duration-200"
              style={{ width: `${reviewGenerationProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">{reviewGenerationProgress}%</p>
        </div>
      </div>
    );
  };
  
  // ユーザーフィードバックUI
  const renderFeedbackForm = () => {
    if (!showFeedbackForm) return null;
    
    return (
      <div className="w-full p-4 bg-white rounded-lg shadow-lg mb-4">
        <h3 className="text-md font-semibold text-gray-700 mb-2">
          この会話の体験はいかがでしたか？
        </h3>
        <Textarea
          placeholder="AIとの会話体験についてのご意見をお聞かせください（任意）"
          className="mb-3"
          rows={3}
          id="feedback-text"
        />
        <Button
          onClick={() => {
            const feedbackEl = document.getElementById('feedback-text') as HTMLTextAreaElement;
            handleFeedbackSubmit(feedbackEl?.value || '');
          }}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          送信して終了
        </Button>
      </div>
    );
  };
  
  // クーポン表示 (Apple Intelligenceスタイル)
  const renderAppleStyleCoupon = () => {
    if (!storeInfo?.coupon_type) return null;
    
    let couponValue = '';
    switch (storeInfo.coupon_type) {
      case 'percent':
        couponValue = `${storeInfo.coupon_value}% OFF`;
        break;
      case 'fixed':
        couponValue = `${storeInfo.coupon_value}円 OFF`;
        break;
      default:
        couponValue = storeInfo.coupon_free_item_desc || '特典';
    }
    
    return (
      <div 
        ref={couponRef}
        className={`relative overflow-hidden bg-white border rounded-xl p-5 mb-4 shadow-lg transform transition-all duration-500 
          ${showCouponAnimation ? 'scale-100 opacity-100 animate-reveal' : 'scale-95 opacity-0'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 via-purple-400/30 to-pink-400/30 animate-pulse-slow"></div>
        
        {/* クーポン境界線アニメーション */}
        <div className="absolute inset-0 border-2 border-dashed border-transparent animate-border-dash rounded-xl pointer-events-none">
          <svg width="100%" height="100%" className="absolute inset-0">
            <rect 
              x="0" 
              y="0" 
              width="100%" 
              height="100%" 
              fill="none" 
              stroke="url(#coupon-gradient)" 
              strokeWidth="2" 
              strokeDasharray="6 3" 
              rx="10" 
              ry="10"
              className="animate-rotate-slow"
            />
            <defs>
              <linearGradient id="coupon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">
            <h3 className="text-lg font-bold text-center">ご回答ありがとうございます！</h3>
          </div>
          
          <div className="w-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl p-4 mb-3">
            <div className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">
              {couponValue}
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-5 w-5 text-purple-500" />
            <p className="text-sm text-gray-700">
              次回ご来店時にこのクーポンをご提示ください
            </p>
          </div>
          
          <div className="text-xs text-gray-500 w-full">
            <p>有効期限: 発行から1ヶ月間</p>
            <p>※他のクーポンや割引と併用不可</p>
          </div>
        </div>
        
        {/* 背景の装飾的な要素 */}
        <div className="absolute top-2 right-2 w-10 h-10 rounded-full bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-pink-400/30 blur-md"></div>
        <div className="absolute bottom-3 left-3 w-6 h-6 rounded-full bg-gradient-to-r from-pink-400/30 via-purple-400/30 to-blue-400/30 blur-md"></div>
      </div>
    );
  };
  
  // 初心者向けガイダンスを表示
  const renderInitialGuidance = () => {
    if (!showInitialGuidance || messages.length > 2 || isCompleted) return null;
    
    return (
      <div className="fixed bottom-24 left-0 right-0 flex justify-center pointer-events-none z-10 animate-fadeIn">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl shadow-lg max-w-xs text-center text-sm">
          {showTopicSelection ? 
            <p>トピックをタップするか、下の入力欄に直接入力できます👇</p> :
            <p>下の入力欄に感想を入力してください👇</p>
          }
          <div className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-0 h-0 
            border-l-[8px] border-l-transparent
            border-r-[8px] border-r-transparent
            border-t-[8px] border-t-indigo-600"></div>
        </div>
      </div>
    );
  };
  
  // メッセージリスト表示 - 改善：メッセージ間の余白を縮小
  const renderMessages = () => (
    <div 
      className="flex-1 overflow-y-auto p-3 space-y-2" // 余白を調整: p-4→p-3, space-y-4→space-y-2
      id="message-list"
      ref={messageListRef}
      style={{ height: messageListHeight > 0 ? `${messageListHeight}px` : 'auto' }}
    >
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex items-end ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          } gap-1`} // gap-2→gap-1に変更して余白を縮小
        >
          {message.role === 'bot' && (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 self-start flex items-center justify-center text-white">
              <MessageSquare size={12} />
            </div>
          )}
          <div
            className={`p-2.5 rounded-lg max-w-[85%] text-sm shadow-sm ${
              message.role === 'user'
                ? 'bg-blue-500 text-white rounded-br-none'
                : 'bg-white text-gray-800 rounded-bl-none'
            }`}
          >
            {message.text.split('\n').map((line, i) => (
              <p key={i} className="mb-0.5 last:mb-0">{line || <> </>}</p> // 改行の余白を調整
            ))}
            <span
              className={`text-[10px] mt-0.5 block ${
                message.role === 'user' ? 'text-blue-200/80 text-right' : 'text-gray-400 text-left'
              }`}
            >
              {formatMessageTime(message.timestamp)}
            </span>
          </div>
          
          {message.role === 'user' && (
            <div className="w-6 h-6 rounded-full bg-blue-500 flex-shrink-0 self-start flex items-center justify-center text-white">
              <div className="text-white font-bold text-xs">あ</div>
            </div>
          )}
        </div>
      ))}
      
      {/* 情報充足度インジケーターの表示 */}
      {renderSufficiencyIndicator()}
      
      {/* 会話終了ボタン */}
      {showEndButton && !isCompleted && !isTyping && !showTopicSelection && (
        <div className="flex justify-center my-3"> {/* my-4→my-3 に変更 */}
          <Button
            onClick={handleEndInterview}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md hover:shadow-lg transition-all animate-pulse-slow"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            インタビューを終了する
          </Button>
        </div>
      )}
      
      {/* ストリーミング中のテキスト表示 */}
      {currentStreamingText && (
        <div className="flex items-end justify-start gap-1"> {/* gap-2→gap-1 */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 self-start flex items-center justify-center text-white">
            <MessageSquare size={12} />
          </div>
          <div className="p-2.5 rounded-lg max-w-[85%] text-sm shadow-sm bg-white text-gray-800 rounded-bl-none">
            {currentStreamingText.split('\n').map((line, i) => (
              <p key={i} className="mb-0.5 last:mb-0">{line || <> </>}</p>
            ))}
            <span className="text-gray-400 inline-block ml-1 animate-pulse">▌</span>
          </div>
        </div>
      )}
      
      {/* トピック選択UIをチャットメッセージとして表示（改善版）*/}
      {showTopicSelection && topicOptions.length > 0 && (
        <div className="flex items-end justify-start gap-1"> {/* gap-2→gap-1 */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 self-start flex items-center justify-center text-white">
            <MessageSquare size={12} />
          </div>
          <div className="p-2.5 rounded-lg max-w-[90%] text-sm shadow-lg bg-white text-gray-800 rounded-bl-none border-2 border-blue-200">
            <p className="mb-1.5 font-medium text-blue-600">話題を選択してください👇</p>
            <div className="grid grid-cols-1 gap-1.5 mt-1.5"> {/* gap-2→gap-1.5, mt-2→mt-1.5 */}
              {topicOptions.slice(0, 4).map((topic, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm" // size="lg"→"sm"に変更して縦幅を縮小
                  data-topic={topic} 
                  className={`p-2 h-auto justify-start hover:bg-blue-100 transition-all whitespace-normal text-left border-2 
                    ${i === 0 ? 'border-blue-400 bg-blue-50 animate-pulse-slow' : 'border-blue-200'} 
                    font-medium fast-tap`}
                  onClick={() => handleTopicSelect(topic)}
                  disabled={isTyping}
                >
                  {topic}
                </Button>
              ))}
            </div>
            <span className="text-[10px] mt-2 block text-gray-400 text-left">
              {formatMessageTime(new Date().toISOString())}
            </span>
          </div>
        </div>
      )}
      
      {/* ローディングアニメーション */}
      {isTyping && !currentStreamingText && (
        <div className="flex items-end justify-start gap-1"> {/* gap-2→gap-1 */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 self-start flex items-center justify-center text-white">
            <MessageSquare size={12} />
          </div>
          <div className="bg-white p-2.5 rounded-lg rounded-bl-none shadow-sm">
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-blue-600 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}
      
      {/* レビューフォーム - 順番を変更 */}
      {showReviewPrompt && (
        <Card className="my-3 bg-white shadow-lg border rounded-xl overflow-hidden"> {/* my-4→my-3 */}
          <CardHeader className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 p-3"> {/* p-4→p-3 */}
            <CardTitle className="text-base font-semibold flex items-center text-blue-800">
              <CheckCircle className="text-blue-500 mr-2 h-5 w-5" />
              ご意見ありがとうございました
            </CardTitle>
            <CardDescription className="text-xs">
              いただいたフィードバックをもとに、より良いサービスの提供に努めてまいります。
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 space-y-3"> {/* p-4 space-y-4→p-3 space-y-3 */}
            {/* 順番変更：1. クーポン表示（Apple Intelligence風グラデーション） */}
            {renderAppleStyleCoupon()}
            
            {/* 順番変更：2. レビュー情報 */}
            <div>
              <div className="flex justify-between items-center mb-1.5"> {/* mb-2→mb-1.5 */}
                <Label className="text-sm font-medium flex items-center">
                  <PenTool className="h-4 w-4 mr-1 text-indigo-500" />
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">
                    あなたの体験から作成したレビュー:
                  </span>
                </Label>
                <div className="flex items-center text-sm text-blue-600">
                  <span className="text-xs text-gray-500 mr-2">体験の評価:</span>
                  <div className="flex space-x-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRatingChange(star)}
                        disabled={isSubmittingRating}
                        className={`h-7 w-7 p-0 fast-tap ${  /* h-8 w-8→h-7 w-7 */
                          star <= userRating ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'
                        }`}
                      >
                        <Star className={star <= userRating ? 'fill-current' : ''} size={16} /> {/* size=18→16 */}
                      </Button>
                    ))}
                  </div>
                  {isSubmittingRating && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-lg blur opacity-25"></div>
                <Textarea
                  value={autoReviewText}
                  readOnly
                  rows={4}
                  className="mt-1 bg-white text-sm relative border-0 shadow-sm"
                />
              </div>
            </div>
            
            {/* 順番変更：3. 投稿ボタン */}
            <Button
              onClick={handleGoogleRedirect}
              disabled={!storeInfo?.google_place_id}
              className="w-full h-11 text-base relative overflow-hidden" /* h-12→h-11 */
              style={{ background: 'linear-gradient(90deg, #4285F4, #EA4335, #FBBC05, #34A853)' }}
            >
              <div className="absolute inset-0 bg-white bg-opacity-20 animate-shimmer"></div>
              <div className="z-10 flex items-center justify-center w-full">
                <img src="/google-logo.svg" alt="G" className="w-5 h-5 mr-2" />
                このレビューをGoogleに投稿する
                <ArrowRight size={16} className="ml-auto" />
              </div>
            </Button>
            
            {/* 順番変更：4. お礼メッセージ（店舗からのメッセージ） */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2.5 rounded-lg"> {/* p-3→p-2.5 */}
              <h4 className="font-medium text-gray-800 text-sm mb-1.5 flex items-center"> {/* mb-2→mb-1.5 */}
                <ThumbsUp className="h-4 w-4 mr-1 text-blue-500" />
                店舗からのメッセージ
              </h4>
              <div className="text-sm text-gray-700 whitespace-pre-line">
                {storeFollowupMessage || "いただいたご意見は、スタッフ全員で共有し、サービスの質向上に活用させていただきます。"}
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setShowFeedbackForm(true)}
              className="w-full h-10"
            >
              AIチャットの改善にご協力ください
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* フィードバックフォーム */}
      {renderFeedbackForm()}
      
      {/* サンクスメッセージ */}
      {showThankYouMessage && (
        <Alert className="bg-blue-50 border-blue-100 text-blue-800">
          <CheckCircle className="h-5 w-5 text-blue-600" />
          <AlertTitle>ありがとうございました</AlertTitle>
          <AlertDescription className="text-xs">
            貴重なご意見をいただき、ありがとうございました。またのご利用をお待ちしております。
          </AlertDescription>
        </Alert>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
  
  // --- メインレンダリング ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-b-purple-500 animate-spin" style={{animationDelay: '-0.3s'}}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={() => window.location.reload()} className="mt-2">再読み込み</Button>
        </Alert>
      </div>
    );
  }

  if (!interview || !storeInfo) {
    return (
      <div className="p-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>情報なし</AlertTitle>
          <AlertDescription>インタビューまたは店舗情報が見つかりません。</AlertDescription>
          <Button onClick={() => navigate('/')} className="mt-2">ホームへ</Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <CardHeader className="flex flex-row items-center p-3 bg-white border-b sticky top-0 z-10">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-semibold mr-2 flex-shrink-0">
          {storeInfo.name?.substring(0, 1)}
        </div>
        <div className="flex-1">
          <CardTitle className="text-sm font-semibold leading-tight">{storeInfo.name}</CardTitle>
          <CardDescription className="text-xs leading-tight">
            {isAdminAccess ? "管理者アクセス: " : ""}
            AIインタビュー
          </CardDescription>
        </div>
        {renderConnectionStatus()}
        {isAdminAccess && (
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2" 
            onClick={() => navigate('/dashboard')}
          >
            ダッシュボードへ
          </Button>
        )}
      </CardHeader>

      {/* ゲーミフィケーション：進捗ポイント表示 */}
      {renderProgressPoints()}
      
      {/* ゲーミフィケーション：アチーブメント表示 */}
      {renderAchievement()}
      
      {/* メッセージリスト */}
      {renderMessages()}
      
      {/* 初心者向けガイダンス */}
      {renderInitialGuidance()}
      
      {/* レビュー生成アニメーション */}
      {renderReviewGeneration()}
      
      {/* Google遷移アニメーション */}
      {renderGoogleRedirectAnimation()}
      
      {/* 紙吹雪エフェクト用のキャンバス */}
      {isExploding && (
        <canvas 
          ref={confettiCanvasRef} 
          className="fixed inset-0 z-50 pointer-events-none"
        />
      )}

      {/* 入力エリア */}
      <CardFooter 
        className="p-2 border-t bg-white sticky bottom-0" 
        ref={inputAreaRef}
        style={{ paddingBottom: `calc(0.5rem + ${safeAreaBottom}px)` }}
      >
        {isCompleted ? (
          <Alert variant="default" className="w-full bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle>完了</AlertTitle>
            <AlertDescription className="text-xs">
              インタビューは完了しました。レビュー投稿にご協力ください。
            </AlertDescription>
            <Button 
              size="sm" 
              variant="outline" 
              className="ml-auto mt-2"
              onClick={() => setShowFeedbackForm(true)}
            >
              フィードバックを送信
            </Button>
          </Alert>
        ) : (
          <div className="flex items-center space-x-2 w-full">
            <Input
              type="text"
              placeholder={showTopicSelection ? 
                "または、こちらに自由に入力してエンターを押してください..." : 
                "メッセージを入力してエンターを押してください..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isTyping || isCompleted}
              className={`flex-grow ${showTopicSelection ? 
                "border-blue-300 shadow-inner animate-pulse-slow" : ""}`}
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping || isCompleted}
              className={`rounded-full flex-shrink-0 w-10 h-10 transition-all ${
                inputMessage.trim() ? "bg-gradient-to-r from-blue-500 to-purple-600 animate-bounce-light" : "bg-gray-300"
              }`}
            >
              {isTyping ? (
                <Loader2 size={18} className="animate-spin text-white" />
              ) : (
                <Send size={18} className="text-white" />
              )}
            </Button>
          </div>
        )}
      </CardFooter>
      
      {/* スタイル定義 */}
      <style jsx global>{`
        :root {
          --safe-area-bottom: 0px;
        }
        
        /* Apple Intelligenceスタイルのグラデーションアニメーション */
        @keyframes gradient-rotate {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .animate-gradient {
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #d946ef, #f59e0b);
          background-size: 300% 300%;
          animation: gradient-rotate 6s ease infinite;
        }
        
        @keyframes reveal {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-reveal {
          animation: reveal 0.8s ease forwards;
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s infinite;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        @keyframes border-dash {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-rotate-slow {
          animation: rotate-slow 20s linear infinite;
        }
        
        @keyframes bounce-light {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-light {
          animation: bounce-light 1s infinite;
        }
        
        @keyframes achievement {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(251, 191, 36, 0.4); }
        }
        .animate-achievement {
          animation: achievement 1.5s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
        
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        /* タップフィードバックエフェクト */
        .tap-feedback {
          animation: tap-feedback 0.3s ease;
        }
        @keyframes tap-feedback {
          0% { transform: scale(1); }
          50% { transform: scale(0.95); opacity: 0.8; }
          100% { transform: scale(1); }
        }
        
        /* 入力フィールドフォーカス時の最適化 */
        input:focus, textarea:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }
        
        /* iOS向けのスクロール最適化 */
        * {
          -webkit-overflow-scrolling: touch;
        }
        
        /* レスポンシブ調整 - 小さな画面でのメッセージ表示を最適化 */
        @media (max-width: 360px) {
          .flex-1.overflow-y-auto {
            padding: 2px;
          }
          .p-2.5 {
            padding: 2px;
          }
          .gap-1 {
            gap: 0.5px;
          }
          .text-sm {
            font-size: 0.8125rem;
          }
        }
        
        /* メッセージバブルの時間表示を最適化 */
        .text-[10px] {
          line-height: 1.1;
        }
        
        /* メッセージの連続性を向上させる - 同じ送信者のメッセージが連続する場合 */
        .message-continuous {
          margin-top: -0.25rem;
        }
        .message-continuous .rounded-full {
          opacity: 0;
        }
        
        /* iOS Safariのノッチ対応 */
        @supports (padding-top: env(safe-area-inset-top)) {
          .sticky.top-0 {
            padding-top: env(safe-area-inset-top);
            height: calc(64px + env(safe-area-inset-top));
          }
          .sticky.bottom-0 {
            padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
          }
        }
        
        /* アンカーリンクのスタイル */
        a {
          color: #3b82f6;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        
        /* テキスト選択時のスタイル */
        ::selection {
          background-color: rgba(59, 130, 246, 0.2);
        }
        
        /* アニメーション最適化 - バッテリー消費を抑制 */
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse, .animate-bounce, .animate-spin,
          .animate-pulse-slow, .animate-float, .animate-ping-slow,
          .animate-shimmer, .animate-reveal, .animate-achievement,
          .animate-bounce-light, .animate-gradient, .animate-border-dash,
          .animate-rotate-slow, .animate-fadeIn {
            animation: none !important;
          }
        }
        
        /* ダークモード対応 */
        @media (prefers-color-scheme: dark) {
          .bg-white {
            background-color: #1f2937;
          }
          .bg-gray-100 {
            background-color: #111827;
          }
          .text-gray-800 {
            color: #e5e7eb;
          }
          .text-gray-700 {
            color: #d1d5db;
          }
          .text-gray-600 {
            color: #9ca3af;
          }
          .text-gray-500 {
            color: #6b7280;
          }
          .border-gray-200 {
            border-color: #374151;
          }
          .shadow-sm {
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
          }
          .shadow-lg {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
          }
          input, textarea {
            background-color: #374151;
            color: #e5e7eb;
            border-color: #4b5563;
          }
          input::placeholder, textarea::placeholder {
            color: #9ca3af;
          }
        }
        
        /* タッチイベントの最適化 - 300msのタップ遅延を防止 */
        html {
          touch-action: manipulation;
        }
        
        /* iOSフォントレンダリングの最適化 */
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        
        /* スクロールバーのカスタマイズ */
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.7);
        }
        
        /* メッセージ間のセパレーターライン（オプション） */
        .message-separator {
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(209, 213, 219, 0.2), transparent);
          margin: 8px 0;
        }
        
        /* 入力エリアの影効果を強化 */
        .sticky.bottom-0 {
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
        }
        
        /* アクセシビリティ向上 - フォーカス表示を明確に */
        :focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        /* メッセージバブルの最大幅を画面サイズに合わせて調整 */
        @media (min-width: 640px) {
          .max-w-\[85\%\] {
            max-width: 75%;
          }
        }
        
        /* メッセージテキスト内のリンク強調 */
        .p-2\\.5 a, .p-3 a {
          color: inherit;
          text-decoration: underline;
          text-underline-offset: 2px;
          text-decoration-thickness: 1px;
          text-decoration-color: rgba(59, 130, 246, 0.5);
        }
        
        /* メッセージの行間調整 */
        .p-2\\.5 p, .p-3 p {
          line-height: 1.4;
        }
        
        /* モバイルデバイスでのスピード最適化 */
        @media (max-width: 768px) {
          * {
            -webkit-tap-highlight-color: transparent;
          }
          .hover\\:bg-blue-100:hover {
            background-color: inherit;
          }
          .hover\\:shadow-lg:hover {
            box-shadow: inherit;
          }
          button:active, a:active, [role="button"]:active {
            opacity: 0.8;
            transform: scale(0.98);
          }
        }
      `}</style>
    </div>
  );
};

export default InterviewPage;