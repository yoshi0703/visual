import { useState, useCallback, useEffect } from 'react';
import { useStoreStore } from '../lib/store';
import { analyzeWebsiteApi, jinaReaderApi, searchAlternativeSources } from '../lib/api';
import { validateUrl, normalizeUrl, calculateConfidenceScores } from '../lib/utils';

/**
 * ウェブサイト分析用フック
 * Jina AIを活用して店舗ウェブサイトからの情報抽出を管理する
 */
const useWebsiteAnalysis = () => {
  const { currentStore, setStore } = useStoreStore();
  const [websiteUrl, setWebsiteUrl] = useState(currentStore?.website_url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSiteAnalyzed, setIsSiteAnalyzed] = useState(false);
  const [analyzedData, setAnalyzedData] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  
  // 拡張状態: 分析プロセス管理
  const [analysisStage, setAnalysisStage] = useState('');
  const [confidenceScores, setConfidenceScores] = useState({});
  const [alternativeSources, setAlternativeSources] = useState([]);
  const [isEnhancedAnalysis, setIsEnhancedAnalysis] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  
  /**
   * メイン分析関数：Jina AIを活用してウェブサイトを分析
   * @param {Function} onSuccess - 成功時のコールバック関数
   */
  const handleAnalyzeWebsite = useCallback(async (onSuccess) => {
    if (!websiteUrl) {
      setError('URLを入力してください');
      return;
    }
    
    // URL検証とフォーマット
    const normalizedUrl = normalizeUrl(websiteUrl);
    if (!normalizedUrl) {
      setError('有効なURLを入力してください (例: https://example.com)');
      return;
    }
    
    if (!currentStore?.id) {
      setError('店舗情報が見つかりません');
      return;
    }
    
    // 分析開始
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setAnalyzedData(null);
    setDebugInfo(null);
    setAnalysisStage('準備中...');
    
    // 分析履歴に追加
    const analysisStartTime = new Date();
    const historyEntry = {
      url: normalizedUrl,
      timestamp: analysisStartTime,
      status: 'processing'
    };
    setAnalysisHistory(prev => [historyEntry, ...prev]);
    
    try {
      console.log(`[useWebsiteAnalysis] 分析開始: ${normalizedUrl}`);
      setAnalysisStage('ウェブサイトに接続中...');
      
      // バックエンドAPI呼び出し
      const response = await analyzeWebsiteApi(currentStore.id, normalizedUrl);
      
      console.log(`[useWebsiteAnalysis] 応答受信:`, response);
      
      // 応答チェック
      if (!response) {
        throw new Error('ウェブサイト分析からの応答がありませんでした');
      }
      
      if (!response.success) {
        throw new Error(response.error || 'サイト分析に失敗しました');
      }
      
      setAnalysisStage('情報を処理中...');
      
      // フォールバックデータでも成功として扱う
      const extractedData = response.extractedData;
      if (!extractedData) {
        throw new Error('サイトから情報を抽出できませんでした。別のURLを試すか、情報を手動で入力してください。');
      }
      
      // 信頼度スコアの計算
      const confidenceData = calculateConfidenceScores(extractedData, response.details);
      setConfidenceScores(confidenceData);
      
      // 分析データをセット
      setAnalyzedData(extractedData);
      setIsSiteAnalyzed(true);
      
      // フォールバックの場合は異なるメッセージを表示
      if (response.details?.fallback) {
        setSuccess('サイトから直接情報を取得できなかったため、仮のデータを生成しました。必要に応じて編集してください。');
      } else {
        setSuccess('サイトの分析が完了しました！');
      }
      
      // デバッグ情報を保存（あれば）
      if (response.logs || response.details) {
        setDebugInfo({
          logs: response.logs || [],
          details: response.details || {},
          processingTime: response.details?.processingTime || (new Date() - analysisStartTime)
        });
      }
      
      // 分析履歴を更新
      setAnalysisHistory(prev => 
        prev.map(entry => 
          entry.url === normalizedUrl && entry.timestamp === analysisStartTime
            ? { ...entry, status: 'completed', data: extractedData }
            : entry
        )
      );
      
      // ストア情報を更新
      if (response.store) {
        setStore(response.store);
      }
      
      // 高度な分析モードの場合は代替情報源を検索
      if (isEnhancedAnalysis) {
        setAnalysisStage('関連情報を検索中...');
        await findAlternativeSources(normalizedUrl, extractedData.name);
      }
      
      // 成功コールバックがある場合は呼び出す
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(extractedData);
      }
      
    } catch (error) {
      console.error('[useWebsiteAnalysis] エラー:', error);
      
      // エラーメッセージをユーザーフレンドリーにする
      let userMessage = error.message || 'サイト分析に失敗しました';
      
      if (userMessage.includes('<!DOCTYPE') || userMessage.includes('not valid JSON')) {
        userMessage = 'サーバーからの応答が無効です。しばらく待ってから再試行してください。';
      } else if (userMessage.includes('Empty response')) {
        userMessage = 'サーバーからの応答がありませんでした。ネットワーク接続を確認して再試行してください。';
      } else if (userMessage.includes('Network Error') || userMessage.includes('ECONNREFUSED')) {
        userMessage = 'ネットワークエラー: サーバーに接続できませんでした。';
      }
      
      setError(userMessage);
      setIsSiteAnalyzed(false);
      setAnalyzedData(null);
      
      // 分析履歴を更新
      setAnalysisHistory(prev => 
        prev.map(entry => 
          entry.url === normalizedUrl && entry.timestamp === analysisStartTime
            ? { ...entry, status: 'failed', error: userMessage }
            : entry
        )
      );
    } finally {
      setIsLoading(false);
      setAnalysisStage('');
    }
  }, [websiteUrl, currentStore, setStore, isEnhancedAnalysis]);
  
  /**
   * 代替情報源を検索する
   * @param {string} url - 元のURL
   * @param {string} name - 店舗名
   */
  const findAlternativeSources = useCallback(async (url, name) => {
    if (!url || !name) return;
    
    try {
      const sources = await searchAlternativeSources(url, name);
      console.log('[useWebsiteAnalysis] 代替情報源:', sources);
      
      if (Array.isArray(sources) && sources.length > 0) {
        setAlternativeSources(sources);
      }
    } catch (error) {
      console.error('[useWebsiteAnalysis] 代替情報源の検索に失敗:', error);
      
      // エラーが発生しても分析を中断しない（非クリティカル機能）
      setAlternativeSources([
        {
          name: `${name} - Google Maps`,
          source: 'Google Maps',
          url: `https://www.google.com/maps/search/${encodeURIComponent(name)}`
        },
        {
          name: `${name} - 食べログ`,
          source: '食べログ',
          url: `https://tabelog.com/rstLst/?sk=${encodeURIComponent(name)}`
        }
      ]);
    }
  }, []);
  
  /**
   * 分析結果の改善を要求
   * 既存の結果をベースにより詳細な分析を実行
   */
  const improveAnalysis = useCallback(async () => {
    if (!analyzedData || !websiteUrl) return;
    
    setIsLoading(true);
    setError(null);
    setAnalysisStage('分析結果を改善中...');
    
    try {
      // 高度分析モードをオンにする
      if (!isEnhancedAnalysis) {
        setIsEnhancedAnalysis(true);
      }
      
      // 現在のURLで再分析
      await handleAnalyzeWebsite((data) => {
        setSuccess('分析結果を改善しました！');
      });
    } catch (error) {
      console.error('[useWebsiteAnalysis] 結果改善エラー:', error);
      setError('分析結果の改善に失敗しました。');
    }
  }, [analyzedData, websiteUrl, isEnhancedAnalysis, handleAnalyzeWebsite]);
  
  /**
   * 代替情報源から情報を採用
   * @param {object} source - 代替情報源
   */
  const useAlternativeSource = useCallback(async (source) => {
    if (!source || !source.url) return;
    
    try {
      setIsLoading(true);
      setAnalysisStage('代替情報を取得中...');
      
      console.log(`[useWebsiteAnalysis] 代替情報源を使用: ${source.name}`);
      
      // Jina Reader APIを使って代替情報源からデータを取得
      const jinaResult = await jinaReaderApi(source.url, {
        withGeneratedAlt: true,
        timeout: 10000
      });
      
      if (!jinaResult.success) {
        throw new Error(jinaResult.error || '代替情報の取得に失敗しました');
      }
      
      // 新しい分析データを準備
      const newData = { ...analyzedData };
      
      // この時点でバックエンドAPIを呼び出す可能性もある
      // ここでは単純にソース名を追加するだけの簡易実装
      newData.description = newData.description || '';
      newData.description += `\n\n情報源: ${source.name}`;
      
      setAnalyzedData(newData);
      setSuccess(`${source.name}からの情報を採用しました。`);
    } catch (error) {
      console.error('[useWebsiteAnalysis] 代替情報の取得エラー:', error);
      setError(`代替情報の取得に失敗しました: ${error.message}`);
    } finally {
      setIsLoading(false);
      setAnalysisStage('');
    }
  }, [analyzedData]);
  
  /**
   * 高度な分析モードの切り替え
   */
  const toggleEnhancedAnalysis = useCallback(() => {
    setIsEnhancedAnalysis(prev => !prev);
  }, []);
  
  /**
   * 状態をリセット
   */
  const resetState = useCallback(() => {
    setError(null);
    setSuccess(null);
    setAnalyzedData(null);
    setIsSiteAnalyzed(false);
    setDebugInfo(null);
    setConfidenceScores({});
    setAlternativeSources([]);
    setAnalysisStage('');
  }, []);
  
  /**
   * URL変更時にリセット
   */
  useEffect(() => {
    resetState();
  }, [websiteUrl, resetState]);
  
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
    debugInfo,
    // 拡張機能
    analysisStage,
    confidenceScores,
    alternativeSources,
    isEnhancedAnalysis,
    toggleEnhancedAnalysis,
    improveAnalysis,
    useAlternativeSource,
    analysisHistory
  };
};

export default useWebsiteAnalysis;