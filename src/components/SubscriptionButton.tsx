import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { useStoreStore, useAuthStore } from '../lib/store';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useToast } from './ui/use-toast';
import { createCheckoutSession } from '../lib/stripe';

interface SubscriptionButtonProps {
  priceId: string;
  buttonText?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

const SubscriptionButton: React.FC<SubscriptionButtonProps> = ({
  priceId,
  buttonText = 'このプランで始める',
  variant = 'default',
  size = 'default',
  className = '',
  onSuccess,
  onError,
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentStore } = useStoreStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const handleClick = useCallback(async () => {
    if (!user) {
      const errorMsg = 'ユーザー情報がありません';
      console.error(`[SubscriptionButton] ${errorMsg}`);
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    if (!currentStore?.id) {
      const errorMsg = '店舗情報がありません';
      console.error(`[SubscriptionButton] ${errorMsg}`);
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      console.log(`[SubscriptionButton] チェックアウトセッション作成開始: price=${priceId}, store=${currentStore.id}, user=${user.id}`);
      
      // Stripe チェックアウトセッションの作成
      const result = await createCheckoutSession(
        priceId,
        currentStore.id,
        user,
        'subscription'
      );
      
      if (!result.url) {
        throw new Error('チェックアウトURLが返されませんでした');
      }
      
      console.log(`[SubscriptionButton] チェックアウトURL取得成功`);
      
      // 成功コールバック
      if (onSuccess) {
        onSuccess();
      }
      
      // チェックアウトページにリダイレクト
      console.log(`[SubscriptionButton] リダイレクト準備...`);
      window.location.href = result.url;
      
    } catch (err: any) {
      console.error('[SubscriptionButton] エラー:', err);
      const errorMessage = err.message || '決済処理の初期化に失敗しました';
      setError(errorMessage);
      if (onError) onError(errorMessage);
      
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [priceId, currentStore, user, onSuccess, onError, toast]);
  
  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={isLoading || !user?.id || !currentStore?.id || disabled}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            処理中...
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

export default SubscriptionButton;