import React, { useState, useEffect } from 'react';
import useWebsiteAnalysis from '../hooks/useWebsiteAnalysis';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Progress } from './ui/progress';
import { 
  Loader2, AlertCircle, CheckCircle, Globe, Info, ExternalLink, 
  RefreshCw, FileSearch, BarChart, Award, Zap, Settings, Filter, Sparkles
} from 'lucide-react';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Badge } from './ui/badge';

interface WebsiteAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (data: any) => void;
}

// Progress stage messages
const progressStages = [
  { stage: 1, message: 'WEBサイトに接続中...', progress: 15 },
  { stage: 2, message: 'データ取得中...', progress: 30 },
  { stage: 3, message: '情報を分析中...', progress: 45 },
  { stage: 4, message: '店舗情報を抽出中...', progress: 60 },
  { stage: 5, message: 'データを処理中...', progress: 75 },
  { stage: 6, message: '情報を反映中...', progress: 90 }
];

// Stage empathy messages - ユーザーの「共感の瞬間」を作るためのメッセージ
const stageEmpathyMessages = [
  'URLを確認しています...',
  'Jina AIが高度な分析を実行中...',
  'ウェブサイトの構造を理解中です...',
  '情報をAIがセマンティック解析しています...',
  '検索で上位になるためのロジックをパーソナライズしています...',
  'もう少しで完了します！'
];

// Advanced analysis info texts
const advancedAnalysisInfo = {
  title: 'Jina AI高度分析モード',
  description: 'Jina AIの最先端テクノロジーを活用して、より正確な店舗情報を抽出します。マルチモーダル理解とクロスリファレンス検証を行い、分析精度を向上させます。',
  features: [
    '代替情報源の自動検索',
    'より詳細なキーワード分析',
    'マルチモーダル理解',
    '信頼性スコアリング'
  ]
};

// 信頼性インジケータコンポーネント
const ConfidenceIndicator = ({ score, label }: { score: number; label?: boolean }) => {
  let color = 'bg-red-500';
  let textColor = 'text-red-700';
  
  if (score > 0.8) {
    color = 'bg-green-500';
    textColor = 'text-green-700';
  } else if (score > 0.5) {
    color = 'bg-yellow-500';
    textColor = 'text-yellow-700';
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-1">
            <div className="h-2 rounded-full bg-gray-200 w-full">
              <div 
                className={`h-2 rounded-full ${color}`} 
                style={{ width: `${Math.round(score * 100)}%` }} 
              />
            </div>
            {label && (
              <span className={`text-xs ${textColor} font-medium`}>
                {Math.round(score * 100)}%
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">信頼性スコア: {Math.round(score * 100)}%</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const WebsiteAnalysisModal: React.FC<WebsiteAnalysisModalProps> = ({ 
  isOpen, 
  onClose, 
  onAnalysisComplete 
}) => {
  // States
  const [currentStage, setCurrentStage] = useState(0);
  const [progressValue, setProgressValue] = useState(0);
  const [showEmpathyMessage, setShowEmpathyMessage] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Custom hook for website analysis
  const {
    websiteUrl,
    setWebsiteUrl,
    isLoading,
    error,
    success,
    analyzedData,
    handleAnalyzeWebsite,
    debugInfo,
    confidenceScores,
    alternativeSources,
    isEnhancedAnalysis,
    toggleEnhancedAnalysis,
    improveAnalysis,
    useAlternativeSource,
    analysisStage
  } = useWebsiteAnalysis();
  
  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setCurrentStage(0);
      setProgressValue(0);
      setShowEmpathyMessage(false);
      setSimulatedProgress(false);
      setShowManualEntry(false);
      setActiveTab('main');
      setAnimationComplete(false);
      
      // Check if debug mode should be enabled (development or URL param)
      setIsDebugMode(
        process.env.NODE_ENV === 'development' || 
        new URLSearchParams(window.location.search).has('debug')
      );
    }
  }, [isOpen]);
  
  // Simulate progress stages for better UX
  useEffect(() => {
    if (isLoading && !simulatedProgress) {
      setSimulatedProgress(true);
      simulateProgressStages();
    }
  }, [isLoading, simulatedProgress]);
  
  // Reset when loading completes
  useEffect(() => {
    if (!isLoading && simulatedProgress) {
      // Completed successfully
      if (analyzedData) {
        setCurrentStage(6);
        setProgressValue(100);
        
        // Delay animation completion to allow for a visual effect
        setTimeout(() => {
          setAnimationComplete(true);
          // Trigger animation in the parent component
          if (onAnalysisComplete) {
            onAnalysisComplete(analyzedData);
          }
        }, 1000);
      }
    }
  }, [isLoading, simulatedProgress, analyzedData, onAnalysisComplete]);
  
  // 分析ステージが変わったらプログレスを反映
  useEffect(() => {
    if (analysisStage) {
      let stageIndex = 0;
      
      switch(analysisStage) {
        case '準備中...':
          stageIndex = 0;
          break;
        case 'ウェブサイトに接続中...':
          stageIndex = 1;
          break;
        case '情報を処理中...':
          stageIndex = 3;
          break;
        case '分析結果を改善中...':
          stageIndex = 4;
          break;
        case '関連情報を検索中...':
          stageIndex = 5;
          break;
        case '代替情報を取得中...':
          stageIndex = 5;
          break;
        default:
          stageIndex = 2; // デフォルトはデータ取得中
      }
      
      setCurrentStage(stageIndex + 1);
      setProgressValue(progressStages[stageIndex].progress);
      
      // 共感メッセージを表示
      setShowEmpathyMessage(true);
      setTimeout(() => {
        setShowEmpathyMessage(false);
      }, 2000);
    }
  }, [analysisStage]);
  
  // Simulate progress stages
  const simulateProgressStages = () => {
    // Start at stage 1
    setCurrentStage(1);
    setProgressValue(15);
    
    // Random timing for each stage to feel more realistic
    const stageTimings = [
      1000 + Math.random() * 500,  // Stage 1: 1-1.5s
      1500 + Math.random() * 1000, // Stage 2: 1.5-2.5s
      2000 + Math.random() * 1000, // Stage 3: 2-3s
      1000 + Math.random() * 800,  // Stage 4: 1-1.8s
      1200 + Math.random() * 500,  // Stage 5: 1.2-1.7s
      800 + Math.random() * 500    // Stage 6: 0.8-1.3s
    ];
    
    // Show empathy message for the first stage
    setShowEmpathyMessage(true);
    
    // Simulate progress through each stage
    let currentTimerIndex = 0;
    
    const progressTimer = (index: number) => {
      if (index >= progressStages.length) return;
      
      setTimeout(() => {
        // Update stage and progress
        const nextStage = index + 1;
        if (nextStage <= progressStages.length) {
          setCurrentStage(nextStage);
          setProgressValue(progressStages[index].progress);
          
          // Show random empathy message
          setShowEmpathyMessage(true);
          
          // Hide empathy message after a delay
          setTimeout(() => {
            setShowEmpathyMessage(false);
          }, 2000);
          
          // Move to next stage
          progressTimer(nextStage);
        }
      }, stageTimings[index]);
    };
    
    // Start the progress simulation
    progressTimer(currentTimerIndex);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // トリミングして、プロトコルが含まれてるか確認
    let processedUrl = websiteUrl.trim();
    if (!/^https?:\/\//i.test(processedUrl)) {
      processedUrl = 'https://' + processedUrl;
      setWebsiteUrl(processedUrl);
    }
    
    // URL validation
    if (!/^https?:\/\/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/i.test(processedUrl)) {
      alert('有効なURLを入力してください (例: https://example.com)');
      return;
    }
    
    console.log(`[WebsiteAnalysisModal] 分析開始: ${processedUrl}`);
    handleAnalyzeWebsite((data) => {
      console.log('[WebsiteAnalysisModal] 分析完了:', data);
      
      // Do nothing here - we'll handle it in the useEffect that watches for analysisComplete state
      // This prevents double-triggering the animation
    });
  };
  
  // Handle manual entry submission
  const handleManualEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a simple manual data structure
    const manualData = {
      url: manualUrl || 'https://example.com',
      name: '手動入力データ',
      description: '手動入力による店舗情報です。',
      features: ['手動入力'],
      location: ''
    };
    
    onAnalysisComplete(manualData);
    onClose();
  };
  
  // Handle accepting the analysis results
  const handleAcceptResults = () => {
    if (analyzedData) {
      onAnalysisComplete(analyzedData);
      onClose();
    }
  };
  
  // Handle reanalyzing with enhanced mode
  const handleReanalyze = () => {
    if (!websiteUrl) return;
    
    if (!isEnhancedAnalysis) {
      toggleEnhancedAnalysis();
    }
    
    improveAnalysis();
  };
  
  // Get current stage info
  const currentStageInfo = progressStages[currentStage - 1];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2 text-blue-500" />
            ウェブサイト分析
            {isEnhancedAnalysis && (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                <Sparkles className="h-3 w-3 mr-1 text-blue-500" />
                Jina AI
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {/* Initial URL Input */}
        {!isLoading && !analyzedData && !showManualEntry && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <div className="grid flex-1 gap-2">
                  <label htmlFor="website-url" className="text-sm font-medium leading-none">
                    店舗のホームページURL
                  </label>
                  <Input
                    id="website-url"
                    placeholder="https://example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="col-span-3"
                  />
                  <p className="text-xs text-gray-500 flex items-center">
                    <Info className="h-3 w-3 mr-1" />
                    URLを入力すると、Jina AIが自動的に店舗情報を抽出します
                  </p>
                  
                  <div className="flex justify-between items-center mt-2">
                    <button 
                      type="button" 
                      className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center"
                      onClick={() => setShowManualEntry(true)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      ウェブサイトがない、またはURLがわからない場合
                    </button>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enhanced-mode"
                        checked={isEnhancedAnalysis}
                        onCheckedChange={toggleEnhancedAnalysis}
                      />
                      <label 
                        htmlFor="enhanced-mode" 
                        className="text-xs cursor-pointer flex items-center"
                      >
                        <Zap className="h-3 w-3 mr-1 text-yellow-500" />
                        高度なAI分析
                      </label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="w-80 p-2">
                            <h4 className="font-medium text-sm">{advancedAnalysisInfo.title}</h4>
                            <p className="text-xs mt-1">{advancedAnalysisInfo.description}</p>
                            <ul className="text-xs mt-2">
                              {advancedAnalysisInfo.features.map((feature, index) => (
                                <li key={index} className="flex items-center mt-1">
                                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>エラー</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="submit">分析開始</Button>
            </DialogFooter>
          </form>
        )}
        
        {/* Manual Entry Form */}
        {!isLoading && !analyzedData && showManualEntry && (
          <form onSubmit={handleManualEntrySubmit}>
            <div className="space-y-4 py-4">
              <Alert variant="default" className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle>手動データ入力</AlertTitle>
                <AlertDescription className="text-sm">
                  ウェブサイトがない場合は、この後の画面で店舗情報を直接入力できます。
                </AlertDescription>
              </Alert>
              
              <div className="flex items-center space-x-2">
                <div className="grid flex-1 gap-2">
                  <label htmlFor="manual-url" className="text-sm font-medium leading-none">
                    関連URL (あれば)
                  </label>
                  <Input
                    id="manual-url"
                    placeholder="https://example.com (任意)"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                  />
                </div>
              </div>
              
              <button 
                type="button" 
                className="text-xs text-blue-600 hover:text-blue-800 underline"
                onClick={() => setShowManualEntry(false)}
              >
                ウェブサイト分析に戻る
              </button>
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="submit">
                次へ進む
              </Button>
            </DialogFooter>
          </form>
        )}
        
        {/* Loading/Progress State */}
        {isLoading && (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <h3 className="text-lg font-medium flex items-center justify-center">
                {analysisStage || currentStageInfo?.message || 'ウェブサイトを分析中...'}
                {isEnhancedAnalysis && (
                  <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                    <Sparkles className="h-3 w-3 mr-1 text-blue-500" />
                    Jina AI
                  </Badge>
                )}
              </h3>
              
              {showEmpathyMessage && (
                <p className="text-sm text-gray-600 mt-1 animate-fade-in">
                  {stageEmpathyMessages[currentStage - 1]}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Progress value={progressValue} className="h-2" />
              <p className="text-sm text-gray-500 text-right">{progressValue}%</p>
            </div>
            
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          </div>
        )}
        
        {/* Results */}
        {!isLoading && analyzedData && (
          <div className="space-y-4 py-4">
            <Tabs defaultValue="main" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="main" className="text-xs">
                  <FileSearch className="h-3 w-3 mr-1" />
                  分析結果
                </TabsTrigger>
                <TabsTrigger value="alt" className="text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  代替情報
                  {alternativeSources.length > 0 && (
                    <span className="ml-1 bg-blue-100 text-blue-800 text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {alternativeSources.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="debug" className="text-xs">
                  <Settings className="h-3 w-3 mr-1" />
                  詳細情報
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="main">
                <Alert className={debugInfo?.details?.fallback ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200"}>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>分析完了</AlertTitle>
                  <AlertDescription>
                    {debugInfo?.details?.fallback 
                      ? "サイトから直接情報を取得できませんでした。仮の情報を生成したため、内容を確認して編集してください。"
                      : "Jina AIによってサイトから情報を抽出しました。内容を確認してください。"}
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3 mt-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">店舗名</label>
                      <ConfidenceIndicator 
                        score={confidenceScores.name || 0.5} 
                        label={true}
                      />
                    </div>
                    <p className="text-base border p-2 rounded-md bg-gray-50">
                      {analyzedData.name || '(抽出できませんでした)'}
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">店舗の説明</label>
                      <ConfidenceIndicator 
                        score={confidenceScores.description || 0.5}
                        label={true}
                      />
                    </div>
                    <p className="text-base border p-2 rounded-md bg-gray-50 max-h-24 overflow-y-auto">
                      {analyzedData.description || '(抽出できませんでした)'}
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">住所・場所</label>
                      <ConfidenceIndicator 
                        score={confidenceScores.location || 0.5}
                        label={true}
                      />
                    </div>
                    <p className="text-base border p-2 rounded-md bg-gray-50">
                      {analyzedData.location || '(抽出できませんでした)'}
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">特徴・キーワード</label>
                      <ConfidenceIndicator 
                        score={confidenceScores.features || 0.5}
                        label={true}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 border p-2 rounded-md bg-gray-50">
                      {analyzedData.features && analyzedData.features.length > 0
                        ? analyzedData.features.map((feature: string, index: number) => (
                            <span 
                              key={index} 
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                            >
                              {feature}
                            </span>
                          ))
                        : '(抽出できませんでした)'
                      }
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={improveAnalysis}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    分析を改善
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="alt">
                {alternativeSources.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Jina AIが見つけた関連情報源です。内容を確認して採用することができます。
                    </p>
                    {alternativeSources.map((source, idx) => (
                      <div key={idx} className="border p-3 rounded-md hover:bg-gray-50">
                        <h4 className="font-medium text-sm">{source.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">{source.source}</p>
                        <div className="flex justify-between items-center mt-2">
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            確認する
                          </a>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            className="text-xs py-1 h-7"
                            onClick={() => useAlternativeSource(source)}
                          >
                            この情報を採用
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileSearch className="h-12 w-12 text-gray-300 mx-auto" />
                    <p className="text-gray-500 mt-2">関連情報源が見つかりませんでした</p>
                    <p className="text-xs text-gray-400 mt-1">
                      高度なAI分析を有効にして再分析すると、関連情報を検索できます
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={handleReanalyze}
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      高度な分析を実行
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="debug">
                {/* 分析詳細とデバッグ情報 */}
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="font-medium text-sm flex items-center">
                      <BarChart className="h-4 w-4 mr-1 text-blue-500" />
                      分析パフォーマンス
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-white p-2 rounded border">
                        <p className="text-xs text-gray-500">処理時間</p>
                        <p className="text-sm font-medium">
                          {debugInfo?.processingTime 
                            ? `${(debugInfo.processingTime / 1000).toFixed(2)}秒` 
                            : '不明'}
                        </p>
                      </div>
                      <div className="bg-white p-2 rounded border">
                        <p className="text-xs text-gray-500">分析されたデータ</p>
                        <p className="text-sm font-medium">
                          {debugInfo?.details?.bytesAnalyzed 
                            ? `${(debugInfo.details.bytesAnalyzed / 1024).toFixed(2)}KB` 
                            : '不明'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="font-medium text-sm flex items-center">
                      <Award className="h-4 w-4 mr-1 text-yellow-500" />
                      Jina AI情報
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-white p-2 rounded border">
                        <p className="text-xs text-gray-500">分析方法</p>
                        <p className="text-sm font-medium">
                          {debugInfo?.details?.method === 'jina' 
                            ? 'Jina AI Reader' 
                            : debugInfo?.details?.method === 'direct'
                              ? '直接スクレイピング'
                              : debugInfo?.details?.method === 'complete_fallback'
                                ? 'フォールバック'
                                : '不明'}
                        </p>
                      </div>
                      <div className="bg-white p-2 rounded border">
                        <p className="text-xs text-gray-500">AIモデル</p>
                        <p className="text-sm font-medium">
                          GPT-4o + Jina Reader
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* デバッグログ */}
                  {isDebugMode && debugInfo && debugInfo.logs && (
                    <div className="border border-blue-200 rounded-md p-2 mt-4">
                      <details>
                        <summary className="text-xs text-blue-600 cursor-pointer">
                          デバッグログ
                        </summary>
                        <div className="mt-2 overflow-auto max-h-40 text-xs">
                          <div className="mb-2">
                            <h4 className="font-bold text-xs">ログ:</h4>
                            <pre className="text-xs bg-gray-100 p-1 rounded">
                              {debugInfo.logs.join('\n')}
                            </pre>
                          </div>
                          {debugInfo.details && (
                            <div>
                              <h4 className="font-bold text-xs">詳細:</h4>
                              <pre className="text-xs bg-gray-100 p-1 rounded">
                                {JSON.stringify(debugInfo.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            <p className="text-sm text-gray-500 mt-4">
              ※内容はフォーム入力時に編集できます
            </p>
            
            <DialogFooter className="gap-2 mt-4">
              <Button variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button 
                onClick={handleAcceptResults} 
                className={`relative ${animationComplete ? 'animate-success' : ''}`}
              >
                {animationComplete && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="animate-ping absolute h-full w-full rounded-md bg-blue-400 opacity-20"></span>
                    <Sparkles className="h-4 w-4 text-yellow-500 absolute animate-sparkle" />
                  </span>
                )}
                この内容を使用する
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
      
      {/* Extra animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes sparkle {
          0% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
          100% { opacity: 0; transform: scale(0.5) rotate(360deg); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-success {
          box-shadow: 0 0 15px rgba(66, 153, 225, 0.5);
          transition: all 0.3s ease-out;
        }
        
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
      `}</style>
    </Dialog>
  );
};

export default WebsiteAnalysisModal;