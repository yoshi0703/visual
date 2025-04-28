import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ExternalLink, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { products } from '@/stripe-config';

interface SubscriptionItemProps {
  subscription: {
    id?: string;
    status: string;
    priceId: string | null;
    planName?: string;
    currentPeriodEnd: number | null;
    cancelAtPeriodEnd: boolean;
    paymentMethodBrand: string | null;
    paymentMethodLast4: string | null;
  };
  onManageClick: () => void;
  isRedirecting: boolean;
}

const SubscriptionItem: React.FC<SubscriptionItemProps> = ({ 
  subscription,
  onManageClick,
  isRedirecting
}) => {
  // Get status display information
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'アクティブ', color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'trialing':
        return { label: '無料トライアル中', color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'past_due':
        return { label: '支払い遅延', color: 'text-orange-600', bgColor: 'bg-orange-100' };
      case 'canceled':
      case 'canceling':
        return { label: 'キャンセル済み', color: 'text-red-600', bgColor: 'bg-red-100' };
      case 'incomplete':
        return { label: '未完了', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
      default:
        return { label: status || '不明', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  const statusDisplay = getStatusDisplay(subscription.status);
  
  // Get current product information
  const currentProduct = subscription.priceId ? 
    products.find(p => p.priceId === subscription.priceId) : null;

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{subscription.planName || 'クチトル'}</CardTitle>
            <CardDescription>
              {currentProduct?.description || 'AIを活用したクチコミ生成・管理プラン'}
            </CardDescription>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.bgColor} ${statusDisplay.color}`}>
            {statusDisplay.label}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">次回更新日</p>
            <p className="text-lg font-semibold">
              {formatDate(subscription.currentPeriodEnd * 1000)}
            </p>
            {subscription.cancelAtPeriodEnd && (
              <p className="text-sm text-red-600">
                この日に自動更新が停止されます
              </p>
            )}
          </div>
          
          {subscription.paymentMethodBrand && subscription.paymentMethodLast4 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">お支払い方法</p>
              <p className="text-lg font-semibold capitalize">
                {subscription.paymentMethodBrand} **** {subscription.paymentMethodLast4}
              </p>
            </div>
          )}
        </div>
        
        <div className="pt-4">
          <p className="text-sm font-medium text-gray-500 mb-2">サブスクリプションの詳細</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm">
              {currentProduct?.description || 
               'クチトルは、AIを活用して店舗のGoogleクチコミを簡単に増やせるMEO対策ツールです。顧客がアンケートに回答すると、AIが高品質なクチコミを生成し、ワンクリックで投稿できます。'}
            </p>
            
            {currentProduct?.features && (
              <div className="mt-3 space-y-1">
                <p className="text-sm font-medium">プラン特典:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-2">
                  {currentProduct.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <Alert className="bg-blue-50 border-blue-100">
          <AlertTitle>サブスクリプション管理</AlertTitle>
          <AlertDescription>
            サブスクリプションの変更、キャンセル、お支払い方法の更新はStripeの安全なポータルで行えます。
          </AlertDescription>
        </Alert>
      </CardContent>
      
      <CardFooter>
        <Button
          onClick={onManageClick}
          disabled={isRedirecting}
          className="w-full"
        >
          {isRedirecting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="mr-2 h-4 w-4" />
          )}
          Stripeでサブスクリプションを管理する
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubscriptionItem;