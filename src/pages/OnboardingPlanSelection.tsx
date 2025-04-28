import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useStoreStore } from '../lib/store';
import { usePlanSelection } from '../hooks';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import StripeCheckoutButton from '../components/StripeCheckoutButton';
import DebugPanel from '../components/ui/debug-panel';
import { CheckCircle, Info, AlertCircle, ArrowRight } from 'lucide-react';
import { products } from '../stripe-config';

const OnboardingPlanSelection: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentStore, isLoading: isStoreLoading } = useStoreStore();
  
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isDebugMode, setIsDebugMode] = useState(false);
  
  // usePlanSelection フックの使用
  const {
    selectedPlan,
    setSelectedPlan,
    isLoading: isPlanLoading,
    error: planError,
    setError: setPlanError,
    success: planSuccess
  } = usePlanSelection();
  
  // Debug モードの初期化
  useEffect(() => {
    // URLパラメータでデバッグモードを確認
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'true') {
      setIsDebugMode(true);
    }
    
    // 基本情報収集
    updateDebugInfo();
    
    // DEV環境では自動的にデバッグモードを有効化
    if (import.meta.env.DEV) {
      setIsDebugMode(true);
    }
  }, [user, currentStore]);
  
  // デバッグ情報の更新
  const updateDebugInfo = () => {
    const info = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        viteMode: import.meta.env.MODE,
        isDev: import.meta.env.DEV,
        isProd: import.meta.env.PROD,
        apiBase: import.meta.env.VITE_SUPABASE_URL || 'Not set',
        stripeKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'Set (starts with pk_)' : 'Not set',
      },
      auth: {
        isAuthenticated: !!user,
        userId: user?.id || 'Not logged in',
        userEmail: user?.email || 'Not available'
      },
      store: {
        storeId: currentStore?.id || 'No store',
        storeName: currentStore?.name || 'No name',
        planId: currentStore?.plan_id || 'No plan',
        stripeCustomerId: currentStore?.stripe_customer_id || 'No customer ID'
      },
      stripe: {
        publishableKeyAvailable: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
        selectedPlanId: selectedPlan,
        availableProducts: products.map(p => ({
          id: p.id,
          priceId: p.priceId,
          name: p.name
        }))
      }
    };
    
    setDebugInfo(info);
    console.log('[OnboardingPlanSelection] Debug info updated:', info);
  };
  
  // プランの選択処理
  const handlePlanClick = (planId: string) => {
    setSelectedPlan(planId);
    updateDebugInfo();
  };
  
  // 次へボタンのクリックハンドラ
  const handleNext = () => {
    navigate('/onboarding?step=2');
  };
  
  // ローディング画面
  if (isStoreLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">クチトルへようこそ</h1>
        <p className="text-gray-600">
          まずは、最適なプランを選択してください
        </p>
      </div>
      
      {/* プラン選択のコンテンツ */}
      <div className="space-y-6">
        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle>プランを選択</AlertTitle>
          <AlertDescription>
            サービスをご利用いただくには、まずプランを選択してください。
          </AlertDescription>
        </Alert>
        
        {planError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{planError}</AlertDescription>
          </Alert>
        )}
        
        {planSuccess && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>成功</AlertTitle>
            <AlertDescription>{planSuccess}</AlertDescription>
          </Alert>
        )}

        {isDebugMode && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>デバッグモード</AlertTitle>
            <AlertDescription>
              Stripe連携のデバッグモードが有効です。決済情報や連携状態を確認できます。
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className={`border rounded-lg p-6 cursor-pointer transition-all ${
                selectedPlan === product.priceId
                  ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-500'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
              } relative`}
              onClick={() => handlePlanClick(product.priceId)}
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4">{product.description}</p>
                  <div className="text-2xl font-bold mb-3">
                    {product.price ? `¥${product.price.toLocaleString()}/${product.interval === 'year' ? '年' : '月'}` : ''}
                  </div>
                  <p className="text-sm text-gray-500 mb-4">支払いはStripeで安全に処理されます</p>
                  
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>AIを活用した口コミ生成・分析機能</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>QRコード設置カード</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>スマホアプリでカンタン確認</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>メールサポート</span>
                    </li>
                  </ul>
                </div>
                
                <div className="flex flex-col justify-end">
                  <StripeCheckoutButton
                    planId={product.priceId}
                    buttonText={currentStore?.plan_id === product.priceId ? "選択中" : "このプランを選択"}
                    variant={currentStore?.plan_id === product.priceId ? "outline" : "default"}
                    className="w-full"
                    onError={setPlanError}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {currentStore?.plan_id && (
          <div className="flex justify-end">
            <Button onClick={handleNext}>
              次のステップへ
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      {/* テクニカルサポート情報 */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <h3 className="font-medium text-gray-700 mb-2">お問い合わせ</h3>
          <p>技術的な問題やご質問がございましたら、下記までご連絡ください。</p>
          <p className="mt-1">
            サポート: <a href="mailto:support@kuchitoru.com" className="text-blue-600">support@kuchitoru.com</a>
          </p>
        </div>
      </div>
      
      {/* デバッグパネル (開発環境またはデバッグモード時のみ表示) */}
      {isDebugMode && (
        <DebugPanel 
          title="Stripe 連携情報" 
          data={debugInfo} 
          open={true}
        />
      )}
    </div>
  );
};

export default OnboardingPlanSelection;