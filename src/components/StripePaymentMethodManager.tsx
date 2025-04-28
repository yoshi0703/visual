import React, { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement, CardElement } from '@stripe/react-stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CreditCard, AlertCircle, CheckCircle, Plus, Trash } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useStoreStore } from '@/lib/store';

// Stripe publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentMethodProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  selectedPaymentMethodId?: string;
}

const PaymentMethodForm: React.FC<PaymentMethodProps> = ({
  onSuccess,
  onCancel,
  selectedPaymentMethodId
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Submit the form
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw submitError;
      }
      
      // Call onSuccess callback
      if (onSuccess) {
        onSuccess();
      }
      
      toast({
        title: "お支払い方法を更新しました",
        description: "新しいお支払い方法が正常に保存されました",
      });
    } catch (err: any) {
      console.error('Payment method error:', err);
      setError(err.message || 'お支払い方法の更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        <PaymentElement />
      </div>
      
      <div className="flex justify-between mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !elements || isLoading}
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 処理中...</>
          ) : (
            '保存する'
          )}
        </Button>
      </div>
    </form>
  );
};

interface PaymentMethodItemProps {
  paymentMethod: {
    id: string;
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
    isDefault?: boolean;
  };
  onSelect: () => void;
  onDelete: () => void;
}

const PaymentMethodItem: React.FC<PaymentMethodItemProps> = ({
  paymentMethod,
  onSelect,
  onDelete
}) => {
  const getBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳 Visa';
      case 'mastercard':
        return '💳 Mastercard';
      case 'amex':
        return '💳 American Express';
      case 'jcb':
        return '💳 JCB';
      default:
        return '💳 Card';
    }
  };
  
  return (
    <div className={`border rounded-lg p-4 ${paymentMethod.isDefault ? 'border-blue-500 bg-blue-50' : ''}`}>
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium">
            {getBrandIcon(paymentMethod.brand)} **** {paymentMethod.last4}
          </div>
          <div className="text-sm text-gray-500">
            有効期限: {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}
          </div>
        </div>
        <div className="flex space-x-2">
          {paymentMethod.isDefault ? (
            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              デフォルト
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onSelect}
            >
              デフォルトに設定
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

interface StripePaymentMethodManagerProps {
  clientSecret?: string;
  customerId?: string;
  onUpdate?: () => void;
}

export const StripePaymentMethodManager: React.FC<StripePaymentMethodManagerProps> = ({
  clientSecret,
  customerId,
  onUpdate
}) => {
  const { currentStore } = useStoreStore();
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Mock loading payment methods (in a real app, this would call an API)
  useEffect(() => {
    const loadPaymentMethods = async () => {
      setIsLoading(true);
      try {
        // This is where you would actually fetch payment methods
        // For now, let's just use mock data
        if (currentStore?.stripe_customer_id) {
          // Mock payment methods
          const mockPaymentMethods = [
            {
              id: 'pm_123456',
              brand: 'visa',
              last4: '4242',
              expiryMonth: 12,
              expiryYear: 2025,
              isDefault: true
            }
          ];
          setPaymentMethods(mockPaymentMethods);
        } else {
          setPaymentMethods([]);
        }
      } catch (err: any) {
        console.error('Error loading payment methods:', err);
        setError(err.message || '支払い方法の読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPaymentMethods();
  }, [currentStore]);
  
  const handleAddNewCard = () => {
    setIsAddingNew(true);
  };
  
  const handleCancel = () => {
    setIsAddingNew(false);
  };
  
  const handleNewCardSuccess = () => {
    setIsAddingNew(false);
    // Reload payment methods
    if (onUpdate) {
      onUpdate();
    }
  };
  
  const handleSetDefault = (id: string) => {
    // This would call an API to set the default payment method
    toast({
      title: "デフォルトの支払い方法を更新しました",
      description: "選択したカードがデフォルトの支払い方法に設定されました"
    });
    
    // Update UI (in a real app, you would reload from the API)
    setPaymentMethods(methods => 
      methods.map(m => ({
        ...m,
        isDefault: m.id === id
      }))
    );
  };
  
  const handleDelete = (id: string) => {
    // This would call an API to delete the payment method
    toast({
      title: "支払い方法を削除しました",
      description: "選択したカードが削除されました"
    });
    
    // Update UI (in a real app, you would reload from the API)
    setPaymentMethods(methods => methods.filter(m => m.id !== id));
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>支払い方法の管理</CardTitle>
        <CardDescription>
          サブスクリプションに使用するクレジットカードを管理します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {paymentMethods.length > 0 ? (
              <div className="space-y-3">
                {paymentMethods.map(method => (
                  <PaymentMethodItem
                    key={method.id}
                    paymentMethod={method}
                    onSelect={() => handleSetDefault(method.id)}
                    onDelete={() => handleDelete(method.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">登録済みの支払い方法はありません</p>
                <p className="text-sm text-gray-500">下のボタンから支払い方法を追加できます</p>
              </div>
            )}
            
            {isAddingNew && clientSecret && (
              <div className="mt-6 border p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4">新しい支払い方法を追加</h3>
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                    }
                  }}
                >
                  <PaymentMethodForm
                    onSuccess={handleNewCardSuccess}
                    onCancel={handleCancel}
                  />
                </Elements>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!isAddingNew && (
          <Button 
            onClick={handleAddNewCard}
            disabled={!clientSecret || isAddingNew} 
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            支払い方法を追加
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default StripePaymentMethodManager;