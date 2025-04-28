import React, { useState, useEffect } from 'react';
import { useAuthStore, useStoreStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2, ExternalLink, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StripeCheck: React.FC = () => {
  const { user } = useAuthStore();
  const { currentStore } = useStoreStore();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [planId, setPlanId] = useState('price_1RE8QDIoXiM5069uMN8Ke2TX');
  const [isFix, setIsFix] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const navigate = useNavigate();

  // On first load, check the current data
  useEffect(() => {
    if (user?.id || currentStore?.id) {
      handleCheck();
    }
  }, [user?.id, currentStore?.id]);

  const handleCheck = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    setIsFix(false);
    setIsFixed(false);
    
    try {
      const response = await fetch('/.netlify/functions/check-stripe-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          storeId: currentStore?.id,
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'データ取得に失敗しました');
      }
      
      setResults(data.data);
      
      // Check if fix is needed
      if (data.data.store) {
        const needsFix = 
          !data.data.store.plan_id || 
          data.data.store.subscription_status !== 'active';
        
        setIsFix(needsFix);
      }
    } catch (err: any) {
      setError(err.message || '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFix = async () => {
    if (!confirm('本当に修正しますか？この操作は取り消せません。')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const storeId = results?.store?.id;
      
      if (!storeId) {
        throw new Error('ストアIDが見つかりません');
      }
      
      const response = await fetch('/.netlify/functions/check-stripe-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId,
          planId,
          action: 'fix'
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '修正に失敗しました');
      }
      
      setResults(data.data);
      setIsFixed(true);
      setIsFix(false);
    } catch (err: any) {
      setError(err.message || '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderStatus = (status: string | null | undefined) => {
    if (!status) return <span className="text-gray-500">未設定</span>;
    
    switch (status) {
      case 'active':
        return <span className="text-green-600 font-medium">アクティブ</span>;
      case 'trialing':
        return <span className="text-blue-600 font-medium">トライアル中</span>;
      case 'canceled':
        return <span className="text-red-600 font-medium">キャンセル済み</span>;
      default:
        return <span className="text-gray-600">{status}</span>;
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Stripeデータ確認</h1>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            ダッシュボードへ戻る
          </Button>
          <Button onClick={handleCheck} disabled={isLoading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            再確認
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isLoading && (
        <div className="flex justify-center my-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}
      
      {isFixed && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>修正完了</AlertTitle>
          <AlertDescription>
            ストアのプラン情報が正常に更新されました。ダッシュボードにアクセスしてみてください。
          </AlertDescription>
        </Alert>
      )}
      
      {results && (
        <div className="space-y-6">
          {/* Store Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                店舗情報
                {results.store.plan_id && results.store.subscription_status === 'active' ? (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">正常</span>
                ) : (
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">要確認</span>
                )}
              </CardTitle>
              <CardDescription>
                データベースに保存されている店舗情報
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">店舗ID:</div>
                <div className="font-mono">{results.store.id}</div>
                
                <div className="font-medium">店舗名:</div>
                <div>{results.store.name}</div>
                
                <div className="font-medium">オーナーID:</div>
                <div className="font-mono">{results.store.owner_id}</div>
                
                <div className="font-medium">StripeカスタマーID:</div>
                <div className="font-mono">{results.store.stripe_customer_id || '未設定'}</div>
                
                <div className="font-medium">プランID:</div>
                <div className="font-mono">
                  {results.store.plan_id || <span className="text-red-500">未設定</span>}
                </div>
                
                <div className="font-medium">サブスクリプション状態:</div>
                <div>{renderStatus(results.store.subscription_status)}</div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-xs text-gray-500">
                作成日: {new Date(results.store.created_at).toLocaleString('ja-JP')} | 
                更新日: {new Date(results.store.updated_at).toLocaleString('ja-JP')}
              </div>
            </CardFooter>
          </Card>
          
          {/* Stripe Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                Stripeカスタマー情報
                {results.customer ? (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">正常</span>
                ) : (
                  <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">未設定</span>
                )}
              </CardTitle>
              <CardDescription>
                Stripeと連携されたカスタマー情報
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.customer ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">カスタマーID:</div>
                  <div className="font-mono">{results.customer.customer_id}</div>
                  
                  <div className="font-medium">ユーザーID:</div>
                  <div className="font-mono">{results.customer.user_id}</div>
                  
                  <div className="font-medium">作成日:</div>
                  <div>{new Date(results.customer.created_at).toLocaleString('ja-JP')}</div>
                </div>
              ) : (
                <div className="text-red-600">
                  Stripeカスタマー情報が見つかりません
                </div>
              )}
              
              {results.errors && results.errors.customer && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>カスタマー情報取得エラー</AlertTitle>
                  <AlertDescription>{results.errors.customer}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          
          {/* Subscription Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                サブスクリプション情報
                {results.subscription ? (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">正常</span>
                ) : (
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">未設定</span>
                )}
              </CardTitle>
              <CardDescription>
                Stripeサブスクリプションの状態
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.subscription ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">サブスクリプションID:</div>
                  <div className="font-mono">{results.subscription.subscription_id || '未設定'}</div>
                  
                  <div className="font-medium">プランID:</div>
                  <div className="font-mono">{results.subscription.price_id || '未設定'}</div>
                  
                  <div className="font-medium">ステータス:</div>
                  <div>{renderStatus(results.subscription.status)}</div>
                  
                  <div className="font-medium">次回更新日:</div>
                  <div>
                    {results.subscription.current_period_end ? 
                      new Date(results.subscription.current_period_end * 1000).toLocaleString('ja-JP') :
                      '未設定'
                    }
                  </div>
                </div>
              ) : (
                <div>
                  サブスクリプション情報が見つかりません
                  {results.customer && (
                    <div className="mt-2 text-sm text-gray-600">
                      カスタマー情報は存在しますが、サブスクリプションが設定されていません。
                    </div>
                  )}
                </div>
              )}
              
              {results.errors && results.errors.subscription && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>サブスクリプション情報取得エラー</AlertTitle>
                  <AlertDescription>{results.errors.subscription}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          
          {/* Fix Option */}
          {isFix && (
            <Card className="border-2 border-yellow-300">
              <CardHeader className="bg-yellow-50">
                <CardTitle>データ修正</CardTitle>
                <CardDescription>
                  プラン情報に問題が見つかりました。以下の操作で修正できます。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>修正前の確認</AlertTitle>
                  <AlertDescription>
                    現在のデータ状態:
                    <ul className="list-disc pl-5 mt-1">
                      <li>プランID: {results.store.plan_id || '未設定'}</li>
                      <li>サブスクリプション状態: {results.store.subscription_status || '未設定'}</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">設定するプランID</label>
                  <Input 
                    value={planId} 
                    onChange={(e) => setPlanId(e.target.value)} 
                    placeholder="例: price_1RE8QDIoXiM5069uMN8Ke2TX"
                  />
                  <p className="text-xs text-gray-500">
                    デフォルト: クチトルベーシックプラン (price_1RE8QDIoXiM5069uMN8Ke2TX)
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="destructive" 
                  onClick={handleFix}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      処理中...
                    </>
                  ) : (
                    '記録を修正する'
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* View Online Button */}
          {results && (
            <div className="flex justify-center py-4">
              <a 
                href={import.meta.env.VITE_SUPABASE_URL + '/project/default/editor'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Supabaseダッシュボードで詳細を確認
              </a>
            </div>
          )}
          
          {/* Raw Debug Data */}
          {results && (
            <details className="mt-8">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                デバッグ用データ (JSON)
              </summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </details>
          )}
          
          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => navigate('/onboarding')}>
              オンボーディングへ
            </Button>
            <Button variant="default" onClick={() => navigate('/dashboard')}>
              ダッシュボードへ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StripeCheck;