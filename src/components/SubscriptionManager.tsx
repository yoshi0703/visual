import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useStoreStore } from '@/lib/store';
import { CreditCard, AlertCircle, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from './ui/use-toast';
import StripeCustomerCreator from './StripeCustomerCreator';
import { useNavigate } from 'react-router-dom';

interface SubscriptionManagerProps {
  compact?: boolean;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ compact = false }) => {
  const { currentStore } = useStoreStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch subscription data
  useEffect(() => {
    if (!currentStore?.id) return;
    
    const fetchSubscriptionData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if customer ID exists first
        if (!currentStore.stripe_customer_id) {
          setSubscriptionData(null);
          return;
        }
        
        // Fetch subscription data from Supabase
        const { data, error } = await supabase
          .from('stripe_user_subscriptions')
          .select('*')
          .maybeSingle();
          
        if (error) throw error;
        
        setSubscriptionData(data);
      } catch (err: any) {
        console.error('Error fetching subscription:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubscriptionData();
  }, [currentStore]);
  
  // Get subscription status display
  const getStatusDisplay = (status?: string) => {
    if (!status) return { label: '不明', color: 'text-gray-500' };
    
    switch (status) {
      case 'active':
        return { label: '有効', color: 'text-green-600' };
      case 'trialing':
        return { label: 'トライアル中', color: 'text-blue-600' };
      case 'past_due':
        return { label: '支払い遅延', color: 'text-orange-600' };
      case 'canceled':
      case 'canceling':
        return { label: 'キャンセル済み', color: 'text-red-600' };
      default:
        return { label: status, color: 'text-gray-600' };
    }
  };
  
  // Handle click to manage subscription
  const handleManageClick = () => {
    navigate('/subscription');
  };
  
  // If no customer ID, show the creator component
  if (!currentStore?.stripe_customer_id) {
    return <StripeCustomerCreator />;
  }
  
  // If we're showing a compact version
  if (compact) {
    const status = subscriptionData?.subscription_status || currentStore?.subscription_status;
    const statusDisplay = getStatusDisplay(status);
    
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium">サブスクリプション</h3>
              <p className={`text-sm ${statusDisplay.color}`}>{statusDisplay.label}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4" 
              onClick={handleManageClick}
            >
              管理
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Full version
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>サブスクリプション管理</CardTitle>
        <CardDescription>
          お支払いプランの管理と確認
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : subscriptionData ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">現在のステータス</p>
              <p className={`font-semibold ${getStatusDisplay(subscriptionData.subscription_status).color}`}>
                {getStatusDisplay(subscriptionData.subscription_status).label}
              </p>
            </div>
            
            {subscriptionData.current_period_end && (
              <div>
                <p className="text-sm font-medium">次回更新日</p>
                <p className="font-semibold">
                  {new Date(subscriptionData.current_period_end * 1000).toLocaleDateString('ja-JP')}
                </p>
              </div>
            )}
            
            {subscriptionData.cancel_at_period_end && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle>自動更新停止予定</AlertTitle>
                <AlertDescription>
                  次回更新日以降は自動更新されません
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600">
              {isLoading 
                ? "読み込み中..." 
                : "サブスクリプション情報が見つかりません"}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleManageClick}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          詳細管理
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubscriptionManager;