import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useStoreStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CreditCard, Calendar, Loader2, AlertCircle, Package, ChevronRight, ExternalLink } from 'lucide-react';
import StripeProductList from '@/components/StripeProductList';
import StripePricingTable from '@/components/StripePricingTable';
import SubscriptionItem from '@/components/SubscriptionItem';
import { useToast } from '@/components/ui/use-toast';
import { createCustomerPortalLinkApi } from '@/lib/api';
import { products } from '@/stripe-config';

interface SubscriptionData {
  id?: string;
  status: string;
  priceId: string | null;
  planName?: string;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  paymentMethodBrand: string | null;
  paymentMethodLast4: string | null;
}

const Subscription: React.FC = () => {
  const { user } = useAuthStore();
  const { currentStore } = useStoreStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('current-subscription');
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchSubscription = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get subscription from user_subscriptions view
        const { data, error } = await supabase
          .from('stripe_user_subscriptions')
          .select('*')
          .maybeSingle();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Find plan name from subscription price ID
          let planName = 'クチトルサブスクリプション';
          if (data.price_id) {
            const matchingProduct = products.find(p => p.priceId === data.price_id);
            if (matchingProduct) {
              planName = matchingProduct.name;
            }
          }

          setSubscription({
            id: data.subscription_id,
            status: data.subscription_status,
            priceId: data.price_id,
            planName: planName,
            currentPeriodEnd: data.current_period_end,
            cancelAtPeriodEnd: data.cancel_at_period_end || false,
            paymentMethodBrand: data.payment_method_brand,
            paymentMethodLast4: data.payment_method_last4
          });
        } else {
          // If no subscription in the view, use store subscription status
          if (currentStore?.plan_id) {
            const matchingProduct = products.find(p => p.priceId === currentStore.plan_id);
            
            setSubscription({
              status: currentStore.subscription_status || 'active',
              priceId: currentStore.plan_id,
              planName: matchingProduct?.name || 'クチトルサブスクリプション',
              currentPeriodEnd: currentStore.subscription_ends_at ? 
                new Date(currentStore.subscription_ends_at).getTime() / 1000 : null,
              cancelAtPeriodEnd: false,
              paymentMethodBrand: null,
              paymentMethodLast4: null
            });
          } else {
            setSubscription(null);
          }
        }
      } catch (err: any) {
        console.error('Error fetching subscription:', err);
        setError(err.message || 'サブスクリプション情報の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubscription();
  }, [user, navigate, currentStore]);

  // Function to redirect to Stripe Customer Portal
  const handleOpenCustomerPortal = async () => {
    if (!currentStore?.stripe_customer_id) {
      toast({
        title: "エラー",
        description: "Stripe顧客IDが見つかりません",
        variant: "destructive",
      });
      return;
    }
    
    setIsRedirecting(true);
    
    try {
      const response = await createCustomerPortalLinkApi(currentStore.stripe_customer_id);
      
      if (!response.success || !response.url) {
        throw new Error(response.error || 'Stripeポータルリンクの作成に失敗しました');
      }
      
      // Redirect to Stripe Customer Portal
      window.location.href = response.url;
    } catch (err: any) {
      console.error('Error creating customer portal link:', err);
      toast({
        title: "エラー",
        description: err.message || 'Stripeポータルリンクの作成に失敗しました',
        variant: "destructive",
      });
      setIsRedirecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2">サブスクリプション情報を読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">サブスクリプション管理</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="current-subscription" className="flex-1">現在のプラン</TabsTrigger>
          <TabsTrigger value="upgrade-options" className="flex-1">アップグレード</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current-subscription">
          {subscription && subscription.status !== 'not_started' ? (
            <div className="space-y-6">
              <SubscriptionItem 
                subscription={subscription} 
                onManageClick={handleOpenCustomerPortal}
                isRedirecting={isRedirecting}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>請求履歴</CardTitle>
                  <CardDescription>過去の請求と支払い履歴</CardDescription>
                </CardHeader>
                <CardContent>
                  {subscription ? (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <div className="text-sm">
                          <p className="font-medium">直近の請求</p>
                          <p className="text-gray-500">
                            {subscription.currentPeriodEnd 
                              ? new Date((subscription.currentPeriodEnd - 2592000) * 1000).toLocaleDateString('ja-JP')
                              : '-'}
                          </p>
                        </div>
                        <div className="text-sm font-medium">
                          {subscription.priceId 
                            ? `¥${products.find(p => p.priceId === subscription.priceId)?.price?.toLocaleString() || 5000}`
                            : '¥5,000'}
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <div className="text-sm text-gray-500">次回更新日</div>
                        <div className="text-sm">
                          {subscription.currentPeriodEnd 
                            ? new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString('ja-JP')
                            : '-'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">請求履歴はありません</p>
                    </div>
                  )}
                </CardContent>
                {subscription && currentStore?.stripe_customer_id && (
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={handleOpenCustomerPortal}
                      disabled={isRedirecting}
                    >
                      {isRedirecting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="mr-2 h-4 w-4" />
                      )}
                      Stripeで明細を確認
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
          ) : (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>サブスクリプションがありません</CardTitle>
                <CardDescription>
                  クチトルのサービスを利用するには、サブスクリプションを開始してください。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  サブスクリプションを開始すると、以下の機能が利用できます：
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>AIを活用した口コミ生成</li>
                  <li>QRコードを使った簡単なアンケート</li>
                  <li>Google口コミの増加</li>
                  <li>店舗のオンライン評価向上</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="default" 
                  onClick={() => setActiveTab('upgrade-options')}
                  className="w-full"
                >
                  <Package className="mr-2 h-4 w-4"/>
                  プランを選択する
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="upgrade-options">
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>プランをアップグレード</CardTitle>
                <CardDescription>
                  ニーズに合ったプランを選択してください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StripePricingTable showYearlyDefault={true} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>追加サービス</CardTitle>
                <CardDescription>サブスクリプションに追加できるサービス</CardDescription>
              </CardHeader>
              <CardContent>
                <StripeProductList 
                  showSubscriptions={false} 
                  showOneTimeProducts={true} 
                  compact={true}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Subscription;