// src/hooks/onboardingHooks.ts
import { useState, useCallback } from 'react';
import { useStoreStore } from '../lib/store';
import { analyzeWebsiteApi, generateQrCodeApi } from '../lib/api';
import { validateUrl } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { WebsiteExtractedData } from '../types';

/**
 * プラン選択用フック
 * プランの選択と保存を管理する
 */
export const usePlanSelection = () => {
  const { currentStore, setStore } = useStoreStore();
  const [selectedPlan, setSelectedPlan] = useState(currentStore?.plan_id || products[0].priceId); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // プラン選択を保存し、必要ならチェックアウトページへリダイレクト
  const handleSelectPlan = useCallback(async (onSuccess?: () => void) => {
    if (!currentStore?.id) {
      setError('店舗情報が見つかりません');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Note: This function is now a placeholder since we're using SubscriptionButton component
      // which directly handles the checkout process
      setSuccess('プランが選択されました！');
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err: any) {
      console.error('Plan selection error:', err);
      setError(err.message || 'プラン選択に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [currentStore, setError]);

  /**
   * プラン情報をサーバーとローカルストアに更新する
   * @param planId 選択されたプランID
   * @returns 更新が成功したかどうか
   */
  const handleUpdatePlan = useCallback(async (planId: string): Promise<boolean> => {
    if (!currentStore?.id) {
      console.error('[usePlanSelection/updatePlan] 店舗情報が見つかりません');
      setError('店舗情報が見つかりません。ページをリロードしてお試しください。');
      return false;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`[usePlanSelection/updatePlan] 店舗 ${currentStore.id} のプラン ${planId} を更新中`);
      
      // サーバー側の店舗情報を更新
      const { data, error: updateError } = await supabase
        .from('stores')
        .update({ plan_id: planId })
        .eq('id', currentStore.id)
        .select();
      
      if (updateError) {
        console.error('[usePlanSelection/updatePlan] 更新エラー:', updateError);
        throw updateError;
      }
      
      // ローカルストアも更新
      const updatedStore = {
        ...currentStore,
        plan_id: planId
      };
      
      setStore(updatedStore);
      console.log(`[usePlanSelection/updatePlan] ローカルストア更新完了:`, updatedStore);
      
      setSuccess('プランが正常に更新されました');
      return true;
    } catch (err: any) {
      console.error('[usePlanSelection/updatePlan] プラン更新エラー:', err);
      setError('プランの更新に失敗しました: ' + (err.message || '不明なエラー'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentStore, setStore]);

  /**
   * Stripeチェックアウト成功時のプラン更新ハンドラ
   * @param planId 選択されたプランID
   * @returns 更新成功ならtrue
   */
  const handleSubscriptionSuccess = useCallback(async (planId: string): Promise<boolean> => {
    console.log(`[usePlanSelection/subscription] サブスクリプション完了処理開始: planId=${planId}`);
    
    if (!planId) {
      console.error('[usePlanSelection/subscription] プランIDが指定されていません');
      setError('プランIDが指定されていません');
      return false;
    }
    
    if (!currentStore?.id || !currentStore?.owner_id) {
      console.error('[usePlanSelection/subscription] 店舗情報または所有者情報が不足しています');
      setError('店舗情報が見つかりません');
      return false;
    }
    
    // プラン情報更新
    const updateResult = await handleUpdatePlan(planId);
    return updateResult;
  }, [currentStore, handleUpdatePlan]);
  
  // 状態リセット関数
  const resetState = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    selectedPlan,
    setSelectedPlan,
    isLoading,
    error,
    setError,
    success,
    setSuccess,
    handleSelectPlan,
    handleUpdatePlan,
    handleSubscriptionSuccess,
    resetState
  };
};

/**
 * ウェブサイト分析用フック
 * 店舗ウェブサイトからの情報抽出を管理する
 */
export const useWebsiteAnalysis = () => {
  const { currentStore, setStore } = useStoreStore();
  const [websiteUrl, setWebsiteUrl] = useState(currentStore?.website_url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSiteAnalyzed, setIsSiteAnalyzed] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<WebsiteExtractedData | null>(null);
  const [debugInfo, setDebugInfo] = useState<any | null>(null);
  
  // ウェブサイトを分析して店舗情報を抽出
  const handleAnalyzeWebsite = useCallback(async (onSuccess?: (data: WebsiteExtractedData) => void) => {
    if (!websiteUrl) {
      setError('URLを入力してください');
      return;
    }
    
    if (!validateUrl(websiteUrl)) {
      setError('有効なURLを入力してください (例: https://example.com)');
      return;
    }
    
    if (!currentStore?.id) {
      setError('店舗情報が見つかりません');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setAnalyzedData(null);
    
    try {
      const response = await analyzeWebsiteApi(currentStore.id, websiteUrl);
      
      if (!response.success) {
        throw new Error(response.error || 'サイト分析に失敗しました');
      }
      
      // extractedDataがなくてもエラーにする
      if (!response.extractedData) {
        throw new Error('サイトから情報を抽出できませんでした。別のURLを試すか、情報を手動で入力してください。');
      }
      
      const extractedData = response.extractedData;
      setAnalyzedData(extractedData);
      setIsSiteAnalyzed(true);
      setSuccess('サイトの分析が完了しました！');
      
      // ストア情報を更新
      if (response.store) {
        setStore(response.store);
      }
      
      // デバッグ情報を保存（あれば）
      if (response.logs || response.details) {
        setDebugInfo({
          logs: response.logs || [],
          details: response.details || {}
        });
      }
      
      // 成功コールバックがある場合は呼び出す
      if (typeof onSuccess === 'function') {
        onSuccess(extractedData);
      }
      
    } catch (err: any) {
      console.error('Website analysis error:', err);
      setError(err.message || 'サイト分析に失敗しました');
      setIsSiteAnalyzed(false);
      setAnalyzedData(null);
    } finally {
      setIsLoading(false);
    }
  }, [websiteUrl, currentStore, setStore]);
  
  // 状態をリセット
  const resetState = useCallback(() => {
    setError(null);
    setSuccess(null);
    setAnalyzedData(null);
    setIsSiteAnalyzed(false);
  }, []);
  
  return {
    websiteUrl,
    setWebsiteUrl,
    isLoading,
    error,
    setError,
    success,
    setSuccess,
    isSiteAnalyzed,
    analyzedData,
    setAnalyzedData,
    handleAnalyzeWebsite,
    resetState,
    debugInfo
  };
};

/**
 * QRコード生成用フック
 * 店舗用QRコードの生成と管理を行う
 */
export const useQRCodeGeneration = () => {
  const { currentStore, setStore } = useStoreStore();
  const [qrCodeUrl, setQrCodeUrl] = useState(currentStore?.qr_code_url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0); // リトライカウンター追加

  // QRコードを生成
  const handleGenerateQRCode = useCallback(async () => {
    if (!currentStore?.id) {
      setError('店舗情報が見つかりません');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log(`[useQRCodeGeneration] 店舗ID ${currentStore.id} のQRコード生成を開始`);
      
      // ベースURLとインタビューURLの生成（フォールバック用）
      const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
      const fallbackInterviewUrl = `${baseUrl}/interview/${currentStore.id}`;
      const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fallbackInterviewUrl)}`;
      
      console.log(`[useQRCodeGeneration] 使用するQRコードURL: ${fallbackQrUrl}`);
      
      // ストア情報を更新（Supabase直接利用）
      try {
        const { data: updatedStore, error: updateError } = await supabase
          .from('stores')
          .update({
            qr_code_url: fallbackQrUrl,
            interview_url: fallbackInterviewUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentStore.id)
          .select()
          .single();
            
        if (updateError) {
          throw updateError;
        }
        
        setQrCodeUrl(fallbackQrUrl);
        setSuccess('QRコードが生成されました');
        
        if (updatedStore) {
          console.log(`[useQRCodeGeneration] 店舗情報をDBで更新しました`);
          setStore(updatedStore);
        }
      } catch (dbError: any) {
        console.error('[useQRCodeGeneration] DB更新エラー:', dbError);
        throw new Error(`データベース更新エラー: ${dbError.message}`);
      }
    } catch (err: any) {
      console.error('[useQRCodeGeneration] QRコード生成エラー:', err);
      setError(err.message || 'QRコード生成に失敗しました。後ほど再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  }, [currentStore, setStore, retryCount]);

  // QRコードのダウンロード
  const handleDownloadQRCode = useCallback(() => {
    if (!qrCodeUrl) {
      setError('ダウンロードするQRコードがありません');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      const safeStoreName = currentStore?.name?.replace(/[^a-zA-Z0-9_-\u3040-\u30FF\uFF66-\uFF9F\u4E00-\u9FD0]/g, '_') || 'kuchitoru';
      const filename = `${safeStoreName}_qrcode-${Date.now()}.png`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`[useQRCodeGeneration] QRコードをダウンロードしました: ${filename}`);
      setSuccess('QRコードを正常にダウンロードしました');
    } catch (err: any) {
      console.error('[useQRCodeGeneration] QRコードダウンロードエラー:', err);
      setError('QRコードのダウンロードに失敗しました: ' + err.message);
    }
  }, [qrCodeUrl, currentStore?.name]);

  return {
    qrCodeUrl,
    setQrCodeUrl,
    isLoading,
    error,
    setError,
    success,
    setSuccess,
    handleGenerateQRCode,
    handleDownloadQRCode,
    retryCount
  };
};

// Import products outside the hook to prevent missing references
import { products } from '../stripe-config';