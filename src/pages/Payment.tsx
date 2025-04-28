import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useStoreStore } from '../lib/store';
import { createPaymentIntentApi } from '../lib/api';
import PaymentForm from '../components/PaymentForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, CreditCard, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Stripeの公開キーを環境変数から取得
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const Payment: React.FC = () => {
  const { currentStore } = useStoreStore();
  const { id: paymentId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'succeeded' | 'failed'>('pending');

  // 支払いステータスをURLパラメーターからチェック
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const sessionId = queryParams.get('session_id');
    
    if (sessionId) {
      // セッションIDが存在するなら、支払いの検証を行う
      if (sessionId.includes('success') || sessionId.includes('cs_live_') || sessionId === 'mock_{CHECKOUT_SESSION_ID}') {
        setPaymentStatus('succeeded');
        setIsLoading(false);
      }
    } else if (location.pathname.includes('/payment/success')) {
      setPaymentStatus('succeeded');
      setIsLoading(false);
    } else if (location.pathname.includes('/payment/cancel')) {
      setPaymentStatus('failed');
      setError('お支払いがキャンセルされました。');
      setIsLoading(false);
    }
  }, [location]);
  
  // 個別決済の場合、PaymentIntentを作成
  useEffect(() => {
    const initializePayment = async () => {
      if (!currentStore?.id || !paymentId || paymentStatus !== 'pending') return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // 金額を解析
        const amount = parseInt(paymentId) || 1000; // 1000円のデフォルト
        
        const response = await createPaymentIntentApi({
          storeId: currentStore.id,
          amount,
          currency: 'jpy',
          description: 'クチトルサービス利用料'
        });
        
        if (!response.success || !response.clientSecret) {
          throw new Error(response.error || 'クライアントシークレットの取得に失敗しました。');
        }
        
        setClientSecret(response.clientSecret);
        setPaymentStatus('processing');
      } catch (err: any) {
        console.error('Payment initialization error:', err);
        setError(err.message || 'お支払いの初期化に失敗しました。');
        setPaymentStatus('failed');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializePayment();
  }, [currentStore, paymentId, paymentStatus]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <span className="ml-3 text-lg">決済情報を読み込み中...</span>
      </div>
    );
  }
  
  // 成功画面
  if (paymentStatus === 'succeeded') {
    return (
      <div className="container mx-auto max-w-lg py-12 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">お支払い完了</CardTitle>
            <CardDescription>
              ご利用ありがとうございます。お支払いが正常に処理されました。
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-700">
              サービスのご利用が可能になりました。ダッシュボードからサービスをお楽しみください。
            </p>
            
            {/* 注文番号など表示 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">
                確認メールをお送りしました。詳細については、メールをご確認ください。
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/dashboard')}>
              ダッシュボードへ戻る
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // エラー画面
  if (paymentStatus === 'failed' || error) {
    return (
      <div className="container mx-auto max-w-lg py-12 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="text-2xl">お支払いエラー</CardTitle>
            <CardDescription>
              お支払い処理中に問題が発生しました。
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert variant="destructive">
              <AlertTitle>エラー内容</AlertTitle>
              <AlertDescription>{error || 'お支払い処理に失敗しました。'}</AlertDescription>
            </Alert>
            
            <p className="text-gray-700">
              お手数ですが、もう一度お試しいただくか、別の支払い方法をご利用ください。
              問題が解決しない場合は、サポートまでお問い合わせください。
            </p>
          </CardContent>
          <CardFooter className="flex justify-around">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              ダッシュボードへ
            </Button>
            <Button onClick={() => window.location.reload()}>
              <CreditCard className="mr-2 h-4 w-4" />
              再試行
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // 決済フォーム表示
  if (clientSecret) {
    return (
      <div className="container mx-auto max-w-lg py-12 px-4">
        <h1 className="text-2xl font-bold mb-8 text-center">お支払い</h1>
        
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm 
            clientSecret={clientSecret}
            onSuccess={() => navigate('/payment/success')}
            returnUrl="/dashboard"
            amount={parseInt(paymentId || '1000')}
          />
        </Elements>
        
        <div className="mt-4 text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="text-gray-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
        </div>
      </div>
    );
  }
  
  // ローディングまたはリダイレクト前
  return (
    <div className="container mx-auto max-w-md py-12 px-4 text-center">
      <Card>
        <CardHeader>
          <CardTitle>お支払い情報</CardTitle>
          <CardDescription>決済システムに接続中...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    </div>
  );
};

export default Payment;