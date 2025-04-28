import React, { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement, AddressElement } from '@stripe/react-stripe-js';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface PaymentFormProps {
  clientSecret: string;
  onSuccess?: () => void;
  returnUrl?: string;
  amount?: number;
  currency?: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  clientSecret,
  onSuccess,
  returnUrl = '/dashboard',
  amount,
  currency = 'jpy'
}) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe || !clientSecret) {
      return;
    }

    // Check for success message from URL if returning from redirect
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntentResult = urlParams.get('payment_intent_client_secret');
    
    if (paymentIntentResult === clientSecret) {
      stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
        if (paymentIntent?.status === 'succeeded') {
          setIsSuccess(true);
          setMessage('お支払いが完了しました！');
          if (onSuccess) onSuccess();
        }
      });
    }
  }, [stripe, clientSecret, onSuccess]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}${returnUrl}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
          setError(error.message || 'カード情報に問題があります。再度お試しください。');
        } else {
          setError('予期せぬエラーが発生しました。後ほど再度お試しください。');
        }
      } else if (paymentIntent?.status === 'succeeded') {
        setIsSuccess(true);
        setMessage('お支払いが完了しました！');
        if (onSuccess) onSuccess();
      } else {
        setMessage('決済処理中です...');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'お支払い処理中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // Format amount for display
  const formatAmount = (amount?: number, currency = 'jpy') => {
    if (!amount) return '';
    
    const formatter = new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'jpy' ? 0 : 2,
    });
    
    return formatter.format(currency === 'jpy' ? amount : amount / 100);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>お支払い情報</CardTitle>
        {amount && (
          <div className="text-2xl font-bold text-center mt-2">
            {formatAmount(amount, currency)}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">お支払い完了</h3>
            <p className="text-gray-600">{message}</p>
            <Button 
              className="mt-4" 
              onClick={() => window.location.href = returnUrl}
            >
              ダッシュボードへ戻る
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} id="payment-form">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>エラー</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {message && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>お知らせ</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              <PaymentElement />
              <AddressElement options={{
                mode: 'shipping',
                fields: {
                  phone: 'always',
                },
                defaultValues: {
                  address: {
                    country: 'JP',
                  },
                },
              }} />
            </div>
            
            <Button
              type="submit"
              disabled={isLoading || !stripe || !elements || isSuccess}
              className="w-full mt-6"
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 処理中...</>
              ) : (
                '今すぐ支払う'
              )}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <p className="text-xs text-gray-500 text-center">
          安全な決済処理のため、Stripeを使用しています。
          カード情報はクチトルには保存されません。
        </p>
        <div className="flex justify-center">
          <img 
            src="https://stripe.com/img/v3/home/social.png" 
            alt="Powered by Stripe" 
            className="h-6 opacity-50"
          />
        </div>
      </CardFooter>
    </Card>
  );
};

export default PaymentForm;