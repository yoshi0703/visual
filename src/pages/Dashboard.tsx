import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useStoreStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import type { Interview } from '../types';
import { formatDate, getRatingStars, formatRelativeTime } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Building, MapPin, Link as LinkIcon, Settings, Loader2, AlertCircle,
  MessageCircle, Star, TrendingUp, Users, ClipboardList, Tag, QrCode,
  Download, Gift, ArrowRight, CheckCircle, Package, BarChart3,
  Ticket, CreditCard, ExternalLink, Sparkles, Zap, RefreshCcw, LineChart,
  Clock, ThumbsDown, Activity, PieChart, TimerOff, ThumbsUp
} from 'lucide-react';
import SubscriptionButton from '@/components/SubscriptionButton';
import { products } from '@/stripe-config';
import { useToast } from '@/components/ui/use-toast';
import { verifyCheckoutSession } from '@/lib/stripe';
import PaymentSuccessNotification from '@/components/PaymentSuccessNotification';
import CouponEditor from '@/components/CouponEditor';
import InterviewLinkGenerator from '@/components/InterviewLinkGenerator';
import StripeCustomerCreator from '@/components/StripeCustomerCreator';
import { AreaChart, BarChart, PieChart as RechartsPieChart, Cell, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie } from 'recharts';

// --- ダッシュボードメインコンテンツ (DashboardHome) ---
const DashboardHome: React.FC = () => {
  const { currentStore, setStore, updateSubscription } = useStoreStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [recentInterviews, setRecentInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState<{
      totalInterviews: number;
      completedInterviews: number;
      averageRating: number;
      keywordCounts: { text: string; count: number }[];
      googleReviewsEstimate: number;
      totalInterviewTimeMinutes: number; // 新規追加: 総インタビュー時間
      timeSavedHours: number;           // 新規追加: 節約時間
      negativePoints: {                 // 新規追加: 改善点
        id: string;
        text: string;
        resolved: boolean;
      }[];
      monthlyGrowthData: {              // 新規追加: 月別成長データ
        month: string;
        interviews: number;
        reviews: number;
      }[];
      topicDistribution: {              // 新規追加: トピック分布
        name: string;
        value: number;
      }[];
  }>({
      totalInterviews: 0,
      completedInterviews: 0,
      averageRating: 0,
      keywordCounts: [],
      googleReviewsEstimate: 0,
      totalInterviewTimeMinutes: 0,
      timeSavedHours: 0,
      negativePoints: [],
      monthlyGrowthData: [],
      topicDistribution: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('growth'); // 新規追加: アナリティクスタブ
  
  // 決済完了モーダル表示用の状態
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [successPlanId, setSuccessPlanId] = useState<string | null>(null);

  // 決済パラメータ処理用の useEffect
  useEffect(() => {
    const processCheckoutParams = async () => {
      // パラメータ取得
      const queryParams = new URLSearchParams(location.search);
      const checkoutSuccess = queryParams.get('checkout_success');
      const checkoutCancelled = queryParams.get('checkout_cancelled');
      const sessionId = queryParams.get('session_id');
      const planId = queryParams.get('plan_id');
      
      // 決済成功のパラメータがあるか
      const isCheckoutSuccess = checkoutSuccess === 'true' || sessionId;
      
      console.log(`[Dashboard/checkout] パラメータチェック: success=${checkoutSuccess}, sessionId=${sessionId}, planId=${planId}, cancelled=${checkoutCancelled}`);
      
      // 決済成功時の処理
      if (isCheckoutSuccess && currentStore?.id) {
        console.log(`[Dashboard/checkout] 決済完了を検出。店舗ID: ${currentStore.id}`);
        
        // パラメータをクリア（クエリパラメータをクリア）
        navigate('/dashboard', { replace: true });
        
        // 店舗情報とプラン状態を更新
        try {
          // 使用するプランIDを決定（優先度: URLパラメータ > セッション情報）
          let finalPlanId = planId || null;
          
          // セッションIDがある場合は詳細情報を取得
          if (sessionId && sessionId !== '{CHECKOUT_SESSION_ID}') {
            try {
              console.log(`[Dashboard/checkout] セッションID: ${sessionId} で詳細情報を取得`);
              
              // セッション情報取得
              const sessionData = await verifyCheckoutSession(sessionId);
              
              if (sessionData && sessionData.success) {
                console.log(`[Dashboard/checkout] セッション検証完了:`, sessionData);
                
                // プランIDを取得（優先順位: 既存のプランID > セッションのプランID）
                if (!finalPlanId && sessionData.plan_id) {
                  finalPlanId = sessionData.plan_id;
                  console.log(`[Dashboard/checkout] セッションからプランID取得: ${finalPlanId}`);
                }
              } else {
                console.warn(`[Dashboard/checkout] セッション検証に失敗または情報なし`);
              }
            } catch (verifyError) {
              console.error(`[Dashboard/checkout] セッション検証エラー:`, verifyError);
              // エラーが発生してもプロセスは続行
            }
          }
          
          // プランIDが取得できた場合は更新処理を実行
          if (finalPlanId) {
            console.log(`[Dashboard/checkout] プラン情報を更新: ${finalPlanId}`);
            
            // 1. 最初にZustandストアを更新 - UI応答性向上のため
            updateSubscription(finalPlanId, 'active');
            
            // 2. DBの店舗情報を更新
            try {
              const { data, error } = await supabase
                .from('stores')
                .update({ 
                  plan_id: finalPlanId,
                  subscription_status: 'active',
                  updated_at: new Date().toISOString()
                })
                .eq('id', currentStore.id)
                .select()
                .single();
                
              if (error) {
                console.error(`[Dashboard/checkout] 店舗情報更新エラー:`, error);
                throw error;
              }
              
              if (data) {
                console.log(`[Dashboard/checkout] 店舗情報をDBで更新しました`);
                setStore(data);
              }
            } catch (dbError) {
              console.error(`[Dashboard/checkout] DB更新エラー:`, dbError);
              // DBエラーは致命的ではないので続行
            }
            
            // 成功表示用のプランIDを設定
            setSuccessPlanId(finalPlanId);
            
            // 成功モーダルを表示
            setShowPaymentSuccess(true);
          } else {
            console.warn(`[Dashboard/checkout] プランIDが特定できません。決済は成功しましたが、プランの更新ができません。`);
            
            // プランIDなしで成功通知のみ
            toast({
              title: "決済完了",
              description: "サブスクリプションが開始されましたが、プラン情報が取得できませんでした。",
              variant: "default",
            });
          }
        } catch (err: any) {
          console.error('[Dashboard/checkout] 決済後の処理中にエラー:', err);
          toast({
            title: "エラー",
            description: "サブスクリプション情報の更新中にエラーが発生しました。",
            variant: "destructive",
          });
        }
      } else if (checkoutCancelled === 'true') {
        // キャンセル時はトーストのみ表示してURLパラメータをクリア
        navigate('/dashboard', { replace: true });
        
        toast({
          title: "サブスクリプションキャンセル",
          description: "サブスクリプションの開始がキャンセルされました。",
          variant: "destructive",
        });
      }
    };
    
    // 決済パラメータが存在する場合のみ処理を実行
    const queryParams = new URLSearchParams(location.search);
    if (
      queryParams.has('checkout_success') || 
      queryParams.has('session_id') || 
      queryParams.has('checkout_cancelled') ||
      queryParams.has('plan_id')
    ) {
      processCheckoutParams();
    }
  }, [location.search, currentStore, navigate, toast, setStore, updateSubscription]);

  // QRコード生成を自動的に処理する効果
  useEffect(() => {
    // QRコードが存在しなくて、ストアデータがあり、ロード完了後のみ実行
    if (currentStore?.id && !currentStore.qr_code_url && !isLoading) {
      import('../hooks/onboardingHooks').then(({ useQRCodeGeneration }) => {
        // Hooks can't be used inside useEffect, but we can create a helper function
        const generateQRCode = async () => {
          const generator = useQRCodeGeneration();
          await generator.handleGenerateQRCode();
          
          // QRコード生成後にデータを再取得
          fetchDashboardData(currentStore.id);
        };
        
        // 非同期関数を呼び出す
        generateQRCode().catch(error => {
          console.error('自動QRコード生成エラー:', error);
        });
      });
    }
  }, [currentStore, isLoading]);

  // 通常のダッシュボードデータ取得
  useEffect(() => {
    if (!currentStore?.id) {
        setIsLoading(false);
        console.warn("[DashboardHome] No current store ID found.");
        return;
    }

    fetchDashboardData(currentStore.id);
  }, [currentStore?.id]);
  
  // ダッシュボードデータ取得関数
  const fetchDashboardData = async (storeId: string) => {
    setIsLoading(true);
    setError(null);
    try {
        console.log(`[DashboardHome] Fetching data for store ${storeId}`);
        
        // インタビューデータを取得
        const { data: interviewData, error: interviewError } = await supabase
          .from('interviews')
          .select('*')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (interviewError) throw interviewError;
        
        // 件数を取得
        const { count: totalCount, error: countError } = await supabase
          .from('interviews')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId);
        
        if (countError) throw countError;

        const interviewList = interviewData || [];
        setRecentInterviews(interviewList);

        const totalInterviewsCount = totalCount || 0;

        // 完了済みインタビュー取得
        const { data: completedData, error: completedError, count: completedCount } = await supabase
          .from('interviews')
          .select('*', { count: 'exact' })
          .eq('store_id', storeId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(100);
          
        if (completedError) {
          console.warn("[DashboardHome] Failed to fetch completed interviews for stats, using estimates.", completedError);
          // Use less accurate estimates if fetching fails
          const completedInFetched = interviewList.filter(iv => iv.status === 'completed' && typeof iv.rating === 'number' && iv.rating > 0);
          const totalRatingInFetched = completedInFetched.reduce((sum, iv) => sum + (iv.rating ?? 0), 0);
          const avgRatingInFetched = completedInFetched.length > 0 ? totalRatingInFetched / completedInFetched.length : 0;
          const completedCountEstimate = completedCount ?? Math.round(totalInterviewsCount * 0.5); // Use returned count if available, otherwise estimate
          const googleReviewsEstimate = Math.round(completedCountEstimate * 0.65);

          setStats({
             totalInterviews: totalInterviewsCount,
             completedInterviews: completedCountEstimate,
             averageRating: avgRatingInFetched,
             keywordCounts: [], // Keyword calculation needs separate logic/endpoint
             googleReviewsEstimate: googleReviewsEstimate,
             totalInterviewTimeMinutes: 0,
             timeSavedHours: 0,
             negativePoints: [],
             monthlyGrowthData: [],
             topicDistribution: []
          });
        } else {
          const completedInterviewsList = completedData || [];
          const totalRating = completedInterviewsList.reduce((sum, iv) => sum + (iv.rating ?? 0), 0);
          const averageRating = completedInterviewsList.length > 0 ? totalRating / completedInterviewsList.length : 0;
          const googleReviewsEstimate = Math.round((completedCount ?? completedInterviewsList.length) * 0.65); // Use total completed count if available
          
          // 総インタビュー時間の計算 (各インタビュー5分と仮定)
          const totalMinutes = totalInterviewsCount * 5;
          
          // 時間節約の計算 (各インタビューで2分/質問 × 平均5質問と仮定)
          const timeSavedMinutes = totalInterviewsCount * 10;
          const timeSavedHours = Math.round(timeSavedMinutes / 60 * 10) / 10; // 小数点第1位まで
          
          // Extract keywords from interview data
          const keywords = extractKeywords(completedInterviewsList);
          
          // 改善点の抽出 (ネガティブな内容を含むレビューから)
          const negativePoints = extractNegativePoints(completedInterviewsList);
          
          // 月別成長データの生成
          const growthData = generateMonthlyGrowthData(interviewData || []);
          
          // トピック分布の生成
          const topicData = generateTopicDistribution(completedInterviewsList);
          
          setStats({
             totalInterviews: totalInterviewsCount,
             completedInterviews: completedCount ?? completedInterviewsList.length, // Use total completed count if available
             averageRating: averageRating,
             keywordCounts: keywords, // Use extracted keywords
             googleReviewsEstimate: googleReviewsEstimate,
             totalInterviewTimeMinutes: totalMinutes,
             timeSavedHours: timeSavedHours,
             negativePoints: negativePoints,
             monthlyGrowthData: growthData,
             topicDistribution: topicData
          });
        }

        // Fetch subscription status
        const { data: subscriptionData } = await supabase
          .from('stripe_user_subscriptions')
          .select('subscription_status')
          .maybeSingle();
        
        if (subscriptionData) {
          setSubscriptionStatus(subscriptionData.subscription_status);
        } else {
          // Fallback: Use store's subscription_status
          setSubscriptionStatus(currentStore.subscription_status || null);
        }

    } catch (err: any) {
        console.error('[DashboardHome] Fetch error:', err);
        setError(err.message || "ダッシュボードデータの取得に失敗しました。");
    } finally {
        setIsLoading(false);
    }
  };

  // 月別成長データの生成
  const generateMonthlyGrowthData = (interviews: Interview[]) => {
    // 過去6ヶ月分のデータを生成
    const last6Months: { month: string; interviews: number; reviews: number }[] = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' });
      
      // この月のインタビュー数をカウント
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();
      
      const monthInterviews = interviews.filter(iv => {
        const createdAt = new Date(iv.created_at);
        return createdAt >= new Date(startOfMonth) && createdAt <= new Date(endOfMonth);
      });
      
      const interviewCount = monthInterviews.length;
      
      // 完了したインタビュー = Google レビュー推定値の計算
      const completedCount = monthInterviews.filter(iv => iv.status === 'completed').length;
      const reviewEstimate = Math.round(completedCount * 0.65);
      
      last6Months.push({
        month: monthStr,
        interviews: interviewCount,
        reviews: reviewEstimate
      });
    }
    
    return last6Months;
  };

  // トピック分布の生成
  const generateTopicDistribution = (interviews: Interview[]) => {
    // サンプルトピックの定義 - Gemini APIからの実際のデータに置き換え予定
    const topics = [
      { name: '接客対応', value: 0 },
      { name: '商品品質', value: 0 },
      { name: '店内雰囲気', value: 0 },
      { name: '価格', value: 0 },
      { name: '清潔さ', value: 0 },
      { name: 'その他', value: 0 }
    ];
    
    // 会話内容からトピックを検出するシンプルな関数
    const detectTopics = (conversation: any[]) => {
      if (!conversation || !Array.isArray(conversation)) return [];
      
      const detectedTopics = [];
      const text = conversation
        .filter(msg => msg.role === 'user')
        .map(msg => msg.text || '')
        .join(' ')
        .toLowerCase();
      
      // 簡易的なキーワードベースでトピック検出
      if (text.match(/接客|スタッフ|店員|対応|サービス/)) detectedTopics.push('接客対応');
      if (text.match(/商品|品質|味|美味しい|まずい|良い|悪い/)) detectedTopics.push('商品品質');
      if (text.match(/雰囲気|内装|デザイン|居心地|空間|音楽/)) detectedTopics.push('店内雰囲気');
      if (text.match(/価格|料金|高い|安い|コスパ|値段/)) detectedTopics.push('価格');
      if (text.match(/清潔|綺麗|きれい|汚い|掃除/)) detectedTopics.push('清潔さ');
      
      return detectedTopics.length > 0 ? detectedTopics : ['その他'];
    };
    
    // インタビューごとにトピックをカウント
    interviews.forEach(interview => {
      if (interview.conversation) {
        const detectedTopics = detectTopics(interview.conversation);
        
        detectedTopics.forEach(topic => {
          const topicObj = topics.find(t => t.name === topic);
          if (topicObj) {
            topicObj.value += 1;
          }
        });
      }
    });
    
    // 値が0のトピックを除外
    return topics.filter(topic => topic.value > 0);
  };

  // 改善点の抽出
  const extractNegativePoints = (interviews: Interview[]) => {
    // ネガティブな内容を持つ単語リスト
    const negativeWords = [
      '不満', '残念', '悪い', '良くない', '改善', 'ひどい', '最悪', 'がっかり', '最低',
      '遅い', '待た', '高すぎ', '接客が悪', '対応が悪', '態度', '失礼', 'クレーム', '問題'
    ];
    
    const negativePoints: { id: string; text: string; resolved: boolean }[] = [];
    
    // 各インタビューのレビューからネガティブな内容を検出
    interviews.forEach(interview => {
      if (interview.generated_review) {
        const reviewText = interview.generated_review.toLowerCase();
        
        // ネガティブな単語が含まれているか確認
        if (negativeWords.some(word => reviewText.includes(word))) {
          // 文単位に分割してネガティブな文を抽出
          const sentences = interview.generated_review.split(/。|！|\.|!/).filter(Boolean);
          
          sentences.forEach(sentence => {
            const sentenceLower = sentence.toLowerCase();
            if (negativeWords.some(word => sentenceLower.includes(word))) {
              // 既に同じような改善点がないか確認（重複排除）
              const isDuplicate = negativePoints.some(point => 
                point.text.toLowerCase().includes(sentenceLower) || 
                sentenceLower.includes(point.text.toLowerCase())
              );
              
              if (!isDuplicate) {
                negativePoints.push({
                  id: `imp-${Date.now()}-${negativePoints.length}`,
                  text: sentence.trim() + '。',
                  resolved: false
                });
              }
            }
          });
        }
      }
    });
    
    // 最大10件まで
    return negativePoints.slice(0, 10);
  };

  // Extract keywords from interviews
  const extractKeywords = (interviews: Interview[]) => {
    const keywords: { text: string; count: number }[] = [];
    const wordCounts: Record<string, number> = {};
    
    // Process each interview with a completed status
    interviews.forEach(interview => {
      if (interview.status === 'completed' && interview.generated_review) {
        // Simple keyword extraction - split by spaces and filter common words
        const words = interview.generated_review
          .toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
          .split(/\s+/);
          
        // Skip common Japanese particles and short words
        const commonWords = ['は', 'が', 'の', 'に', 'を', 'で', 'と', 'も', 'から', 'へ', 'より', 'や', 'な', 'た', 'です', 'ます'];
        
        words.forEach(word => {
          if (word.length > 1 && !commonWords.includes(word)) {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
          }
        });
      }
    });
    
    // Convert to array and sort by count
    Object.entries(wordCounts).forEach(([text, count]) => {
      if (count > 1) { // Only include words that appear more than once
        keywords.push({ text, count });
      }
    });
    
    // Sort by frequency and take top 10
    return keywords
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  // Handle subscription status change
  const handleSubscriptionStatusChange = async (cancelAtPeriodEnd: boolean) => {
    if (!currentStore?.id) return;
    
    try {
      const newStatus = cancelAtPeriodEnd ? 'active' : 'canceled';
      
      // Call Supabase Edge Function to update subscription
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }
      
      // Show loading toast
      toast({
        title: "処理中...",
        description: cancelAtPeriodEnd ? "自動更新を再開しています" : "自動更新を停止しています",
        variant: "default",
      });
      
      // Update subscription via Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/update-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          store_id: currentStore.id,
          cancel_at_period_end: !cancelAtPeriodEnd, // Toggle the current value
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新に失敗しました');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '更新に失敗しました');
      }
      
      // Update local store
      updateSubscription(currentStore.plan_id || 'price_1RE8QDIoXiM5069uMN8Ke2TX', newStatus);
      
      // Show success toast
      toast({
        title: "更新完了",
        description: cancelAtPeriodEnd 
          ? "サブスクリプションの自動更新を再開しました" 
          : "サブスクリプションの更新を次回で停止します",
        variant: "default",
      });
      
    } catch (error: any) {
      console.error('Subscription update error:', error);
      toast({
        title: "エラー",
        description: error.message || 'サブスクリプションの更新に失敗しました',
        variant: "destructive",
      });
    }
  };

  // Toggle improvement point status
  const toggleImprovementResolved = (id: string) => {
    setStats(prevStats => ({
      ...prevStats,
      negativePoints: prevStats.negativePoints.map(point => 
        point.id === id ? { ...point, resolved: !point.resolved } : point
      )
    }));
  };

  // Coupon display logic
  const couponDisplay = useMemo(() => {
      if (!currentStore) return '未設定';
      const { coupon_type, coupon_value, coupon_free_item_desc } = currentStore;
      if (coupon_type === 'percent') return `${coupon_value}% OFF`;
      if (coupon_type === 'fixed') return `¥${Number(coupon_value).toLocaleString('ja-JP')} 割引`;
      if (coupon_type === 'free_item') return coupon_free_item_desc || '無料サービス';
      return '未設定';
  }, [currentStore]);

  // QR code download handler
  const handleDownloadQR = useCallback(() => {
    if (currentStore?.qr_code_url) {
      const link = document.createElement('a');
      link.href = currentStore.qr_code_url;
      const safeStoreName = currentStore.name?.replace(/[^a-zA-Z0-9_-\u3040-\u30FF\uFF66-\uFF9F\u4E00-\u9FD0]/g, '_') || 'store';
      const filename = `kutitoru-qrcode-${safeStoreName}-${currentStore.id.substring(0, 8)}.png`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error("QR code URL not found for download.");
    }
  }, [currentStore]);

  // COLORS for charts
  const CHART_COLORS = {
    primary: '#2563eb',
    secondary: '#60a5fa',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    light: '#f3f4f6',
    dark: '#1e3a8a',
    // More diverse palette for pie chart
    pieColors: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#a855f7', '#f43f5e']
  };

  if (isLoading) {
      return (
          <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">ダッシュボードデータを読み込み中...</span>
          </div>
      );
  }

  if (error) {
      return (
          <div className="p-6">
              <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>エラー</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
              </Alert>
          </div>
      );
  }

  if (!currentStore) {
      return <div className="p-6 text-center text-gray-500">店舗情報が見つかりません。</div>;
  }

  // Dashboard Home JSX
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
          {/* 決済成功通知モーダル */}
          {showPaymentSuccess && (
            <PaymentSuccessNotification 
              onComplete={() => setShowPaymentSuccess(false)}
              planId={successPlanId || undefined}
            />
          )}
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">{currentStore.name}</h2>
                  <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-4 text-sm text-gray-500">
                       <div className="mt-1 flex items-center"><Building className="mr-1.5 h-4 w-4 flex-shrink-0"/>{currentStore.industry || '業種未設定'}</div>
                       {currentStore.location && <div className="mt-1 flex items-center"><MapPin className="mr-1.5 h-4 w-4 flex-shrink-0"/>{currentStore.location}</div>}
                       {currentStore.website_url && <div className="mt-1 flex items-center"><LinkIcon className="mr-1.5 h-4 w-4 flex-shrink-0"/><a href={currentStore.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 truncate max-w-[200px]">{currentStore.website_url.replace(/^https?:\/\//, '')}</a></div>}
                  </div>
              </div>
              <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => navigate('/subscription')}>
                    <CreditCard className="mr-2 h-4 w-4"/>サブスクリプション
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4"/>店舗設定
                  </Button>
              </div>
          </div>
          <Separator />
          
          {/* Stripe Customer Creator */}
          <StripeCustomerCreator />
          
          {/* Subscription Status Alert */}
          {(!currentStore.subscription_status || !currentStore.plan_id || 
             currentStore.subscription_status === 'not_started' || 
             currentStore.subscription_status === 'canceled' || 
             currentStore.subscription_status === 'unpaid') && (
            <Alert className="bg-blue-50 border-blue-200">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <AlertTitle>サブスクリプションが必要です</AlertTitle>
              <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-4">
                <span>サービスを利用するには、サブスクリプションを開始してください。</span>
                <SubscriptionButton 
                  priceId={products[0].priceId}
                  buttonText="サブスクリプションを開始"
                  size="sm"
                  className="sm:ml-auto"
                />
              </AlertDescription>
            </Alert>
          )}
          
          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
               <Card><CardHeader className="pb-2"><CardDescription className="flex items-center text-xs"><MessageCircle className="h-4 w-4 mr-1"/>総インタビュー</CardDescription><CardTitle className="text-2xl font-semibold">{stats.totalInterviews}</CardTitle></CardHeader><CardContent><div className="text-xs text-muted-foreground">全期間</div></CardContent></Card>
               <Card><CardHeader className="pb-2"><CardDescription className="flex items-center text-xs"><Star className="h-4 w-4 mr-1 text-yellow-400 fill-yellow-400"/>平均評価</CardDescription><CardTitle className="text-2xl font-semibold flex items-baseline">{stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}{stats.averageRating > 0 && <span className="ml-1 text-yellow-400 flex text-base">{getRatingStars(Math.round(stats.averageRating))}</span>}</CardTitle></CardHeader><CardContent><div className="text-xs text-muted-foreground">完了済 {stats.completedInterviews}件</div></CardContent></Card>
               <Card><CardHeader className="pb-2"><CardDescription className="flex items-center text-xs"><TimerOff className="h-4 w-4 mr-1 text-blue-600" />時間節約</CardDescription><CardTitle className="text-2xl font-semibold">{stats.timeSavedHours}<span className="text-xl">時間</span></CardTitle></CardHeader><CardContent><div className="text-xs text-muted-foreground">(1インタビュー約10分と仮定)</div></CardContent></Card>
               <Card><CardHeader className="pb-2"><CardDescription className="flex items-center text-xs"><img src="/google-logo.svg" alt="G" className="w-3 h-3 mr-1"/> G投稿(推定)</CardDescription><CardTitle className="text-2xl font-semibold">{stats.googleReviewsEstimate}</CardTitle></CardHeader><CardContent><div className="text-xs text-muted-foreground">完了者の約65%</div></CardContent></Card>
          </div>

          {/* Analytics Tab Section */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-50 pb-2 border-b">
              <CardTitle className="text-xl flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-blue-500" />
                ビジネスインパクト分析
              </CardTitle>
              <div className="flex space-x-1 mt-2">
                <Button 
                  variant={activeAnalyticsTab === 'growth' ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setActiveAnalyticsTab('growth')}
                  className="text-xs rounded-full"
                >
                  <LineChart className="h-3.5 w-3.5 mr-1" />
                  成長データ
                </Button>
                <Button 
                  variant={activeAnalyticsTab === 'topics' ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setActiveAnalyticsTab('topics')}
                  className="text-xs rounded-full"
                >
                  <PieChart className="h-3.5 w-3.5 mr-1" />
                  トピック分析
                </Button>
                <Button 
                  variant={activeAnalyticsTab === 'improvements' ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setActiveAnalyticsTab('improvements')}
                  className="text-xs rounded-full"
                >
                  <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                  改善点
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Growth Chart Tab */}
              {activeAnalyticsTab === 'growth' && (
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">インタビュー&レビュー成長推移</h3>
                    <p className="text-sm text-gray-500">過去6ヶ月間のインタビュー数と推定GoogleレビュースタンプのトレンドデータでYoY計算ができるように6か月表示</p>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={stats.monthlyGrowthData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorInterviews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="interviews" name="インタビュー数" stroke={CHART_COLORS.primary} fillOpacity={1} fill="url(#colorInterviews)" />
                        <Area type="monotone" dataKey="reviews" name="Googleレビュー数(推定)" stroke={CHART_COLORS.success} fillOpacity={1} fill="url(#colorReviews)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
                        <Activity className="mr-1 h-4 w-4" />
                        総利用状況
                      </h4>
                      <div className="grid grid-cols-2 gap-y-2">
                        <div className="text-sm text-gray-600">総インタビュー時間</div>
                        <div className="text-sm font-medium">{stats.totalInterviewTimeMinutes} 分</div>
                        
                        <div className="text-sm text-gray-600">平均インタビュー時間</div>
                        <div className="text-sm font-medium">
                          {stats.totalInterviews > 0 ? Math.round(stats.totalInterviewTimeMinutes / stats.totalInterviews * 10) / 10 : 0} 分/件
                        </div>
                        
                        <div className="text-sm text-gray-600">節約された時間</div>
                        <div className="text-sm font-medium">{stats.timeSavedHours} 時間</div>
                        
                        <div className="text-sm text-gray-600">節約時給換算</div>
                        <div className="text-sm font-medium">¥{(stats.timeSavedHours * 1500).toLocaleString()} (¥1,500/時)</div>
                      </div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-emerald-700 mb-2 flex items-center">
                        <TrendingUp className="mr-1 h-4 w-4" />
                        ビジネスインパクト
                      </h4>
                      <div className="grid grid-cols-2 gap-y-2">
                        <div className="text-sm text-gray-600">新規Googleレビュー</div>
                        <div className="text-sm font-medium">{stats.googleReviewsEstimate} 件</div>
                        
                        <div className="text-sm text-gray-600">推定星評価向上</div>
                        <div className="text-sm font-medium">+0.5 ポイント</div>
                        
                        <div className="text-sm text-gray-600">集客影響（推定）</div>
                        <div className="text-sm font-medium">月間 +{Math.round(stats.googleReviewsEstimate * 2)} 人</div>
                        
                        <div className="text-sm text-gray-600">売上貢献（推定）</div>
                        <div className="text-sm font-medium">¥{(stats.googleReviewsEstimate * 5000).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Topic Analysis Tab */}
              {activeAnalyticsTab === 'topics' && (
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">トピック分析</h3>
                    <p className="text-sm text-gray-500">インタビュー内で最も言及されているトピックとキーワードの分析</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Topic Distribution Chart */}
                    <div>
                      <h4 className="text-sm font-medium mb-4 text-center">会話トピック分布</h4>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={stats.topicDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {stats.topicDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS.pieColors[index % CHART_COLORS.pieColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value, name, props) => [
                                `${value}回言及`, name
                              ]} 
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Keywords Cloud */}
                    <div>
                      <h4 className="text-sm font-medium mb-4">よく出てくるキーワード</h4>
                      <div className="bg-gray-50 p-4 rounded-lg h-64 overflow-y-auto">
                        {stats.keywordCounts.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {stats.keywordCounts.map((keyword, idx) => (
                              <div 
                                key={idx} 
                                className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium flex items-center"
                                style={{ 
                                  fontSize: `${Math.max(0.7, 0.7 + keyword.count / 10)}rem`,
                                  opacity: 0.7 + (keyword.count / 20)
                                }}
                              >
                                {keyword.text}
                                <span className="ml-1 bg-blue-100 text-blue-800 rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px]">
                                  {keyword.count}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex justify-center items-center h-full text-gray-400">
                            <p>キーワードデータがまだありません</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <p className="text-xs text-gray-500">
                          <Sparkles className="w-3 h-3 inline mr-1" />
                          インタビューデータからGemini AIが自動抽出した重要キーワードです。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Improvements Tab */}
              {activeAnalyticsTab === 'improvements' && (
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">改善点一覧</h3>
                    <p className="text-sm text-gray-500">インタビューから抽出された改善点とそのステータス</p>
                  </div>
                  {stats.negativePoints.length > 0 ? (
                    <div className="space-y-2">
                      {stats.negativePoints.map(point => (
                        <div key={point.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div>
                            <input
                              type="checkbox"
                              id={point.id}
                              checked={point.resolved}
                              onChange={() => toggleImprovementResolved(point.id)}
                              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                            />
                          </div>
                          <div className="flex-1">
                            <label 
                              htmlFor={point.id} 
                              className={`text-sm cursor-pointer ${point.resolved ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                            >
                              {point.text}
                            </label>
                          </div>
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${point.resolved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {point.resolved ? '解決済み' : '未解決'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <ThumbsUp className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 mb-1">改善点は見つかりませんでした</p>
                      <p className="text-sm text-gray-400">これはいいことです！お客様からのフィードバックは好意的なようです。</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Interview List & Other Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <Card className="lg:col-span-2">
                   <CardHeader>
                       <CardTitle>最近のインタビュー</CardTitle>
                       <CardDescription>{recentInterviews.length > 0 ? `${recentInterviews.length}件の最近の記録` : 'まだインタビュー記録がありません。'}</CardDescription>
                   </CardHeader>
                   <CardContent>
                       {recentInterviews.length > 0 ? (
                           <div className="space-y-4">
                               {recentInterviews.map(iv => (
                                   <div key={iv.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md transition-colors">
                                       <div>
                                            <div className="text-sm font-medium text-gray-800 flex items-center">
                                               {iv.status === 'completed' && iv.rating ? (
                                                   <span className="flex text-yellow-400 mr-2">{getRatingStars(iv.rating)}</span>
                                                ) : (
                                                    <span className={`mr-2 px-1.5 py-0.5 rounded text-xs font-medium ${iv.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{iv.status}</span>
                                                )}
                                                {formatDate(iv.created_at)}
                                           </div>
                                           {iv.generated_review && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{iv.generated_review}</p>}
                                       </div>
                                       <Button variant="ghost" size="sm" onClick={() => navigate(`/interview/${iv.id}?admin=true`)}>
                                           詳細 <ArrowRight className="ml-1 h-3 w-3"/>
                                       </Button>
                                   </div>
                               ))}
                           </div>
                       ) : (
                           <p className="text-sm text-gray-500 text-center py-4">インタビューが開始されるとここに表示されます。</p>
                       )}
                   </CardContent>
                   <CardFooter>
                       <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/interviews')}>全てのインタビューを見る</Button>
                   </CardFooter>
               </Card>
               {/* QR Code and Coupon Cards */}
               <div className="space-y-6">
                    <Card>
                         <CardHeader>
                             <CardTitle className="flex items-center"><QrCode className="mr-2 h-5 w-5"/>インタビューQRコード</CardTitle>
                             <CardDescription>お客様にスキャンしてもらうQRコード</CardDescription>
                         </CardHeader>
                         <CardContent className="flex flex-col items-center space-y-3">
                             {currentStore.qr_code_url ? (
                                 <>
                                     <img src={currentStore.qr_code_url} alt="QR Code" className="w-36 h-36 border p-1 bg-white shadow-sm"/>
                                     <div className="flex space-x-2">
                                         <Button variant="outline" size="sm" onClick={handleDownloadQR}><Download className="mr-1 h-4 w-4"/>保存</Button>
                                     </div>
                                 </>
                             ) : (
                                 <p className="text-sm text-red-600">QRコードがまだ生成されていません。</p>
                             )}
                         </CardContent>
                    </Card>
                    
                    {/* 新規インタビューリンク生成 */}
                    <InterviewLinkGenerator
                      storeId={currentStore.id}
                      welcomeMessage={currentStore.welcome_message || undefined}
                    />

                    {/* クーポン編集機能 */}
                    <CouponEditor 
                      storeId={currentStore.id}
                      initialCouponType={currentStore.coupon_type || null}
                      initialCouponValue={currentStore.coupon_value || null}
                      initialFreeItemDesc={currentStore.coupon_free_item_desc || null}
                      onSuccess={(newSettings) => {
                        console.log('Coupon settings updated:', newSettings);
                      }}
                    />
                </div>
          </div>
    </div>
  );
};


// --- ダッシュボード全体コンポーネント ---
const Dashboard: React.FC = () => {
  const { currentStore, setStore, isLoading: isStoreLoading, setLoading, setError, updateSubscription } = useStoreStore();
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const publicPaths = useMemo(() => ['/login', '/register', '/password-reset', '/onboarding'], []);
  // インタビュー関係のパスを判別するための関数
  const isInterviewPath = (path: string) => path.startsWith('/interview/');

  // 決済成功後のリダイレクト用の状態
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [successPlanId, setSuccessPlanId] = useState<string | null>(null);

  // QRコードがないときに自動生成
  useEffect(() => {
    const autoGenerateQRCodeIfNeeded = async () => {
      if (currentStore?.id && !currentStore.qr_code_url && !isStoreLoading) {
        console.log('[Dashboard] QRコードがありません。自動生成を試みます...');
        
        try {
          // useQRCodeGenerationフックを動的にインポート
          const { useQRCodeGeneration } = await import('../hooks/onboardingHooks');
          
          // ダミーコンポーネントを作成してフックを実行
          const DummyComponent = () => {
            const { handleGenerateQRCode } = useQRCodeGeneration();
            
            // コンポーネントがマウントされたときにQRコードを生成
            useEffect(() => {
              handleGenerateQRCode();
            }, []);
            
            return null;
          };
          
          // ダミーコンポーネントをレンダリング
          const dummyDiv = document.createElement('div');
          document.body.appendChild(dummyDiv);
          const ReactDOM = await import('react-dom/client');
          const root = ReactDOM.createRoot(dummyDiv);
          root.render(<DummyComponent />);
          
          // クリーンアップ
          setTimeout(() => {
            root.unmount();
            document.body.removeChild(dummyDiv);
          }, 5000);
          
        } catch (error) {
          console.error('[Dashboard] QRコード自動生成に失敗:', error);
        }
      }
    };
    
    autoGenerateQRCodeIfNeeded();
  }, [currentStore, isStoreLoading]);

  // 決済パラメータ処理用の useEffect（ルート検出）
  useEffect(() => {
    const handleCheckoutParams = async () => {
      // パラメータ取得
      const queryParams = new URLSearchParams(location.search);
      const checkoutSuccess = queryParams.get('checkout_success');
      const checkoutCancelled = queryParams.get('checkout_cancelled');
      const sessionId = queryParams.get('session_id');
      const planId = queryParams.get('plan_id');
      
      // 決済成功のパラメータがあるか
      const isCheckoutSuccess = checkoutSuccess === 'true' || (sessionId && sessionId !== '{CHECKOUT_SESSION_ID}');
      
      console.log(`[Dashboard/root] パラメータチェック: success=${checkoutSuccess}, sessionId=${sessionId}, planId=${planId}, cancelled=${checkoutCancelled}`);

      // 決済成功でストアがある場合
      if (isCheckoutSuccess && currentStore?.id) {
        // URLからパラメータを削除
        navigate('/dashboard', { replace: true });
        
        // 成功モーダル表示用データをセット
        if (planId) {
          setSuccessPlanId(planId);
          
          // Zustandストアを即時更新
          updateSubscription(planId, 'active');
          
          // サーバー側にも更新リクエスト
          try {
            await supabase
              .from('stores')
              .update({
                plan_id: planId,
                subscription_status: 'active',
                updated_at: new Date().toISOString()
              })
              .eq('id', currentStore.id);
              
            console.log(`[Dashboard/root] 店舗情報を更新しました: planId=${planId}`);
          } catch (error) {
            console.error(`[Dashboard/root] 店舗情報更新エラー:`, error);
          }
        } else if (!planId && sessionId) {
          try {
            // セッションからプランIDを取得
            const sessionData = await verifyCheckoutSession(sessionId);
            if (sessionData && sessionData.plan_id) {
              setSuccessPlanId(sessionData.plan_id);
              
              // Zustandストアを更新
              updateSubscription(sessionData.plan_id, 'active');
              
              // サーバー側にも更新リクエスト
              try {
                await supabase
                  .from('stores')
                  .update({
                    plan_id: sessionData.plan_id,
                    subscription_status: 'active',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', currentStore.id);
                  
                console.log(`[Dashboard/root] 店舗情報を更新しました: planId=${sessionData.plan_id}`);
              } catch (error) {
                console.error(`[Dashboard/root] 店舗情報更新エラー:`, error);
              }
            }
          } catch (err) {
            console.warn('[Dashboard/root] セッション検証エラー:', err);
          }
        }
        
        // 成功モーダルを表示
        setShowPaymentSuccess(true);
        
      } else if (checkoutCancelled === 'true') {
        // キャンセル時
        navigate('/dashboard', { replace: true });
        
        toast({
          title: "サブスクリプションキャンセル",
          description: "サブスクリプションの開始がキャンセルされました。",
          variant: "destructive",
        });
      }
    };
    
    // URLにチェックアウト関連のパラメータがある場合のみ実行
    const queryParams = new URLSearchParams(location.search);
    if (
      queryParams.has('checkout_success') || 
      queryParams.has('session_id') || 
      queryParams.has('checkout_cancelled') ||
      queryParams.has('plan_id')
    ) {
      handleCheckoutParams();
    }
  }, [location.search, currentStore, navigate, toast, setStore, updateSubscription]);

  useEffect(() => {
    // インタビューページの場合は認証チェックをスキップ
    if (isInterviewPath(location.pathname)) {
      console.log(`[Dashboard useEffect] インタビューページなのでスキップ: ${location.pathname}`);
      return;
    }
    
    const effectTimestamp = Date.now();
    console.log(`[Dashboard useEffect ${effectTimestamp}] 起動: パス=${location.pathname}`);
    console.log(`[Dashboard useEffect ${effectTimestamp}] 状態: 認証ロード=${isAuthLoading}, ユーザー=${!!user}, ユーザーID=${user?.id}, ストア=${!!currentStore}, ストアロード=${isStoreLoading}, ストアプラン=${currentStore?.plan_id}`);

    // --- Guard 1: Auth loading ---
    if (isAuthLoading) {
      console.log(`[Dashboard useEffect ${effectTimestamp}] 認証ロード中のため待機`);
      return;
    }

    // --- Unauthenticated Redirect ---
    if (!user && !publicPaths.includes(location.pathname)) {
      console.log(`[Dashboard useEffect ${effectTimestamp}] 未認証ユーザー。ログインページへリダイレクト`);
      navigate('/login', { replace: true });
      return;
    }

    // --- Authenticated User Logic ---
    if (user) {
        const isValidUserId = typeof user.id === 'string' && user.id.length > 0;

        // --- Store Fetching Logic (Integrated User Request) ---
        // Condition: Valid user ID, no current store, not currently loading store
        const shouldFetchStore = isValidUserId && !currentStore && !isStoreLoading;

        if (shouldFetchStore) {
            const userIdToFetch = user.id; // Already confirmed as string and valid
            console.log(`[Dashboard useEffect ${effectTimestamp}] 有効なユーザー(${userIdToFetch})、ストア未ロード。ストアデータ取得`);
            setLoading(true); // Set loading state before async operation

            (async () => {
                const fetchStoreData = async () => {
                  console.log(`[fetchStoreData] ユーザー ${userIdToFetch} のストア取得試行`);
                  try {
                    // Use Supabase client directly as requested
                    const { data, error } = await supabase
                      .from('stores') // Target the 'stores' table
                      .select('*')    // Select all columns
                      .eq('owner_id', userIdToFetch) // Filter by owner_id
                      .limit(1);      // Expect only one store per owner for now

                    if (error) {
                        // Throw the error to be caught by the outer catch block
                        console.error(`[fetchStoreData] ストア取得エラー:`, error);
                        throw error;
                    }

                    if (data && data.length > 0) {
                      // Store found
                      const fetchedStore = data[0]; // Now correctly typed as Store
                      setStore(fetchedStore);
                      console.log(`[fetchStoreData] ユーザー ${userIdToFetch} のストアデータ取得成功:`, fetchedStore);
                      // Store fetched successfully, onboarding check will run next
                    } else {
                      // No store found for this user
                      console.log(`[fetchStoreData] ユーザー ${userIdToFetch} のストアが見つからない。オンボーディングが必要。`);
                      setStore(null); // Ensure store is null if not found
                      if (location.pathname !== '/onboarding') {
                         console.log(`[fetchStoreData] オンボーディングステップ0にリダイレクト`);
                         navigate('/onboarding', { replace: true, state: { step: 0 } });
                      }
                    }
                  } catch (err: any) {
                     // Catch errors from the fetch operation or thrown Supabase errors
                     console.error(`[fetchStoreData] ユーザー ${userIdToFetch} のストアデータ取得エラー:`, err);
                     setError(err.message || "店舗情報の取得に失敗しました。"); // Set an error state if desired
                     setStore(null); // Ensure store is null on error
                      if (location.pathname !== '/onboarding') {
                         console.log(`[fetchStoreData] エラーのためオンボーディングステップ0にリダイレクト`);
                         navigate('/onboarding', { replace: true, state: { step: 0 } });
                     }
                  } finally {
                     setLoading(false); // Set loading state to false after operation completes
                     console.log(`[fetchStoreData] ユーザー ${userIdToFetch} のストアデータ取得試行完了`);
                  }
                };
                await fetchStoreData(); // Execute the fetch function
            })();
            return; // Skip further checks while store is fetching
        } // End of shouldFetchStore block

        // --- 重要な修正: URLパラメータをチェック - 決済関連パラメータがある場合はリダイレクト処理をスキップ
        const queryParams = new URLSearchParams(location.search);
        const hasCheckoutParams = 
          queryParams.get('checkout_success') === 'true' || 
          queryParams.has('session_id') || 
          queryParams.get('checkout_cancelled') === 'true';
        
        if (hasCheckoutParams) {
          console.log(`[Dashboard useEffect ${effectTimestamp}] 決済関連パラメータあり。オンボーディングリダイレクト処理をスキップ`);
          return; // 決済関連パラメータがある場合は以降の処理をスキップ
        }

        // --- Onboarding Completion Check (Runs AFTER store fetch attempt) ---
        // Condition: Store info exists (fetched or already present), store not loading, not on onboarding page
        if (currentStore && !isStoreLoading && location.pathname !== '/onboarding') {
            // 途中離脱ユーザーのステップ管理を改善 - 各ステップの完了状態を順番にチェック
            
            // ステップ1: プラン選択
            if (!currentStore.plan_id) {
                console.log(`[Dashboard useEffect ${effectTimestamp}] プラン未選択。オンボーディングステップ1へ`);
                navigate('/onboarding', { replace: true, state: { step: 1 } });
                return;
            }
            
            // ステップ2: 店舗情報
            // 店舗情報の完了条件を明確化
            const hasStoreInfo = 
              (currentStore.description && currentStore.description.length > 0) || 
              (currentStore.location && currentStore.location.length > 0) || 
              (currentStore.features && Array.isArray(currentStore.features) && currentStore.features.length > 0);
              
            if (!hasStoreInfo) {
              console.log(`[Dashboard useEffect ${effectTimestamp}] 店舗情報未完了。オンボーディングステップ2へ`);
              navigate('/onboarding', { replace: true, state: { step: 2 } });
              return;
            }
            
            // ステップ3: AIチャット設定
            const hasAIChatSettings = 
              currentStore.welcome_message && 
              currentStore.welcome_message.length > 0 && 
              currentStore.thanks_message && 
              currentStore.thanks_message.length > 0;
              
            if (!hasAIChatSettings) {
              console.log(`[Dashboard useEffect ${effectTimestamp}] AIチャット設定未完了。オンボーディングステップ3へ`);
              navigate('/onboarding', { replace: true, state: { step: 3 } });
              return;
            }
            
            // ステップ4: QRコード生成
            // QRコードがない場合、自動生成を待ちます（リダイレクトは行わない）
            
            console.log(`[Dashboard useEffect ${effectTimestamp}] すべてのオンボーディングステップ完了。現在のページに留まる: ${location.pathname}`);
        }

        // --- Other conditions (unchanged) ---
        if (!currentStore && location.pathname === '/onboarding') {
            console.log(`[Dashboard useEffect ${effectTimestamp}] ユーザー存在、ストアなしorロード中、オンボーディングページ。何もしない。`);
        }
        if (currentStore && location.pathname === '/onboarding') {
             console.log(`[Dashboard useEffect ${effectTimestamp}] ユーザー存在、ストア存在、オンボーディングページ。EnhancedOnboardingにナビゲーション処理を任せる。`);
        }
    }
  }, [
      user,
      currentStore,
      isAuthLoading,
      isStoreLoading,
      location.pathname,
      location.search,
      navigate,
      setLoading,
      setStore,
      setError,
      publicPaths,
      updateSubscription
  ]);

  // --- Rendering Logic ---
  // インタビューページの場合はDashboardコンポーネントの内容は表示せず、
  // 直接子要素（Interview）を表示する
  if (isInterviewPath(location.pathname)) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Interview />
      </Suspense>
    );
  }

  const isLoadingData = isAuthLoading || (user && !currentStore && isStoreLoading && location.pathname !== '/onboarding');
  
  if (isLoadingData) {
      return (
          <div className="flex justify-center items-center h-screen" role="status" aria-live="polite">
               <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
               <span className="ml-3 text-gray-600">読み込み中...</span>
          </div>
      );
  }

  if (!user && !publicPaths.includes(location.pathname)) {
      return <div className="p-8 text-center">認証されていません...</div>;
  }

  if (user && !currentStore && !isStoreLoading && location.pathname !== '/onboarding') {
      return (
          <div className="p-8 text-center">
               <Card className="max-w-md mx-auto">
                    <CardHeader><CardTitle>店舗情報がありません</CardTitle></CardHeader>
                    <CardContent><p>セットアップページに移動します...</p></CardContent>
                </Card>
          </div>
      );
  }

  if (user && currentStore && !currentStore.plan_id && location.pathname !== '/onboarding') {
      return (
          <div className="p-8 text-center">
               <Card className="max-w-md mx-auto">
                    <CardHeader><CardTitle>セットアップ未完了</CardTitle></CardHeader>
                    <CardContent><p>セットアップを完了してください。ページを移動します...</p></CardContent>
                </Card>
          </div>
      );
  }

  return (
    <div className="dashboard-layout flex min-h-screen bg-gray-50/50">
      <main className="flex-1 overflow-y-auto">
        {/* 決済成功通知 */}
        {showPaymentSuccess && (
          <PaymentSuccessNotification 
            onComplete={() => setShowPaymentSuccess(false)}
            planId={successPlanId}
          />
        )}
        
        {location.pathname !== '/onboarding' && currentStore && currentStore.plan_id ? (
             <DashboardHome />
         ) : location.pathname === '/onboarding' || publicPaths.includes(location.pathname) ? (
             null
         ) : (
              <div className="flex justify-center items-center h-screen">
                   <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
                   <span className="ml-3 text-gray-500">ページの準備をしています...</span>
               </div>
          )
        }
      </main>
    </div>
  );
};

// LoadingFallback component - dummy definition to satisfy imports
const LoadingFallback: React.FC = () => (
  <div className="flex justify-center items-center h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    <span className="ml-2 text-gray-600">読み込み中...</span>
  </div>
);

// Interview component - dummy import to satisfy the code
const Interview = React.lazy(() => import('./Interview')); 

export default Dashboard;