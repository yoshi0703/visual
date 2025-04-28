import React, { useState } from 'react';
import { Button } from './ui/button';
import { CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { useStoreStore, useAuthStore } from '../lib/store';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { createCheckoutSession } from '../lib/stripe';
import { useToast } from './ui/use-toast';

interface StripeCheckoutButtonProps {
  planId: string;
  buttonText?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const StripeCheckoutButton: React.FC<StripeCheckoutButtonProps> = ({
  planId,
  buttonText = 'このプランで始める',
  variant = 'default',
  size = 'default',
  className = '',
  onSuccess,
  onError
}) => {
  const { currentStore } = useStoreStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const handleClick = async () => {
    if (!user) {
      const errorMsg = 'ユーザー情報がありません。ログインしてください。';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }
    
    if (!currentStore?.id) {
      const errorMsg = '店舗情報が見つかりません。';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      console.log(`StripeCheckoutButton: チェックアウトを開始します - プラン: ${planId}, 店舗: ${currentStore.id}`);
      
      // If no Stripe customer ID, create one first
      if (!currentStore.stripe_customer_id) {
        setIsCreatingCustomer(true);
        
        try {
          console.log("Creating Stripe customer ID");
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
          
          console.log("Stripe customer created successfully, proceeding to checkout");
          // Continue with checkout without page reload
          // Store will be updated in the database, but we can proceed anyway since we have the customer ID now
        } catch (createCustomerError: any) {
          console.error('Stripe customer creation error:', createCustomerError);
          throw new Error(`Stripe顧客設定: ${createCustomerError.message}`);
        } finally {
          setIsCreatingCustomer(false);
        }
      }

      // Pass store's stripe_customer_id if available
      const userWithStripeId = {
        ...user,
        stripeCustomerId: currentStore.stripe_customer_id || undefined
      };
      
      // Create checkout session using our stripe.ts helper
      const result = await createCheckoutSession(
        planId,
        currentStore.id,
        userWithStripeId,
        'subscription'
      );
      
      if (!result.url) {
        throw new Error('チェックアウトURLが返されませんでした');
      }
      
      console.log(`StripeCheckoutButton: チェックアウトURL取得成功`);
      
      // 成功コールバック
      if (onSuccess) {
        onSuccess();
      }
      
      // チェックアウトページにリダイレクト
      window.location.href = result.url;
      
    } catch (err: any) {
      console.error('StripeCheckoutButton: エラー', err);
      const errorMsg = err.message || '決済セッションの作成に失敗しました。';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={isLoading || !user?.id || !currentStore?.id}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isCreatingCustomer ? 'Stripe連携中...' : '処理中...'}
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            {buttonText}
          </>
        )}
      </Button>
    </>
  );
};

export default StripeCheckoutButton;