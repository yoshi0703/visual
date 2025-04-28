import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Loader2, RefreshCcw, AlertCircle, CheckCircle } from 'lucide-react';
import { useStoreStore, useAuthStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useToast } from './ui/use-toast';

interface StripeCustomerCreatorProps {
  onSuccess?: () => void;
}

const StripeCustomerCreator: React.FC<StripeCustomerCreatorProps> = ({ onSuccess }) => {
  const { currentStore, setStore } = useStoreStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Create a Stripe customer for the current store
  const createStripeCustomer = async () => {
    if (!currentStore?.id || !user?.email) {
      setError('店舗情報またはユーザー情報が見つかりません');
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      // 1. Call the Supabase function to create a Stripe customer
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }

      // Call the create-customer function
      const response = await fetch(`${supabaseUrl}/functions/v1/create-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          store_id: currentStore.id,
          email: user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Stripe顧客の作成に失敗しました');
      }

      // 2. Update the local store with the new customer ID
      if (data.customer_id) {
        // Update Supabase
        const { data: updatedStore, error: updateError } = await supabase
          .from('stores')
          .update({ 
            stripe_customer_id: data.customer_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentStore.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        if (updatedStore) {
          setStore(updatedStore);
        }
      }

      // 3. Show success message
      setIsSuccess(true);
      toast({
        title: "設定完了",
        description: "Stripe顧客IDが正常に作成されました",
        variant: "default",
      });

      // 4. Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

    } catch (err: any) {
      console.error('Stripe customer creation error:', err);
      setError(err.message || 'Stripe顧客の作成中にエラーが発生しました');
      toast({
        title: "エラー",
        description: err.message || 'Stripe顧客の作成に失敗しました',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If the store already has a customer ID, don't show this component
  if (currentStore?.stripe_customer_id) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center text-amber-700">
          <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
          Stripe連携の修正が必要です
        </CardTitle>
        <CardDescription>
          サブスクリプションの管理や決済を行うには、Stripe顧客IDの設定が必要です
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isSuccess && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>設定完了</AlertTitle>
            <AlertDescription>
              Stripe顧客IDが正常に作成されました。サブスクリプションや決済機能が利用可能になりました。
            </AlertDescription>
          </Alert>
        )}

        <p className="text-sm text-gray-700 mb-4">
          あなたの店舗アカウントにStripe顧客IDが設定されていません。これは、サブスクリプションの購入時にエラーが発生する原因となります。下のボタンをクリックして、この問題を解決してください。
        </p>
        
        {currentStore && (
          <div className="text-xs bg-gray-50 p-3 rounded-md">
            <p><strong>店舗名:</strong> {currentStore.name}</p>
            <p><strong>プランID:</strong> {currentStore.plan_id || '未設定'}</p>
            <p><strong>サブスクリプション状態:</strong> {currentStore.subscription_status || '未設定'}</p>
            <p><strong>Stripe顧客ID:</strong> <span className="text-red-500">未設定</span></p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={createStripeCustomer}
          disabled={isLoading || isSuccess}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              処理中...
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              設定完了
            </>
          ) : (
            <>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Stripe顧客IDを設定する
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StripeCustomerCreator;