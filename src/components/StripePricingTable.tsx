import React, { useState } from 'react';
import { getSubscriptionProducts, Product } from '@/stripe-config';
import { TabsList, Tabs, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import StripeCheckoutButton from './StripeCheckoutButton';

interface StripePricingTableProps {
  hideFreeTier?: boolean;
  showYearlyDefault?: boolean;
  withCustomHeader?: React.ReactNode;
  withCustomFooter?: React.ReactNode;
}

const StripePricingTable: React.FC<StripePricingTableProps> = ({
  hideFreeTier = false,
  showYearlyDefault = false,
  withCustomHeader,
  withCustomFooter,
}) => {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>(showYearlyDefault ? 'year' : 'month');
  
  // Get subscription products
  const allProducts = getSubscriptionProducts();
  const products = hideFreeTier 
    ? allProducts.filter(p => p.price && p.price > 0) 
    : allProducts;
    
  // Format price based on currency and interval
  const formatPrice = (product: Product): string => {
    if (!product.price) return '無料';
    
    const formatter = new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: product.currency || 'jpy',
      minimumFractionDigits: 0
    });
    
    return formatter.format(product.price);
  };
  
  // Check if we have yearly and monthly options
  const hasYearlyOption = products.some(p => p.interval === 'year');
  const hasMonthlyOption = products.some(p => p.interval === 'month');
  
  // Filter products by selected billing interval
  const filteredProducts = hasYearlyOption && hasMonthlyOption
    ? products.filter(p => p.interval === billingInterval)
    : products;
  
  return (
    <div className="w-full">
      {/* Custom Header */}
      {withCustomHeader}
      
      {/* Billing interval toggle */}
      {hasYearlyOption && hasMonthlyOption && (
        <div className="flex justify-center mb-8">
          <Tabs 
            defaultValue={billingInterval}
            value={billingInterval} 
            onValueChange={(v) => setBillingInterval(v as 'month' | 'year')}
            className="w-full max-w-xs"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="month">月払い</TabsTrigger>
              <TabsTrigger value="year">年払い<span className="ml-1 text-xs font-normal text-emerald-600">お得</span></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}
      
      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((product) => {
          const price = formatPrice(product);
          
          return (
            <Card 
              key={product.id}
              className={`flex flex-col h-full ${
                product.recommended 
                  ? 'border-blue-300 shadow-lg relative' 
                  : 'border-gray-200'
              }`}
            >
              {product.recommended && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  おすすめ
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {product.name}
                </CardTitle>
                <div className="text-3xl font-bold mt-2">
                  {price}
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    /{billingInterval === 'month' ? '月' : '年'}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="flex-grow">
                <p className="text-sm text-gray-600 mb-6">
                  {product.description}
                </p>
                
                {product.features && (
                  <ul className="space-y-3">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
              
              <CardFooter className="pt-2">
                <StripeCheckoutButton
                  planId={product.priceId}
                  buttonText={
                    product.price && product.price > 0
                      ? '今すぐ始める'
                      : '無料で始める'
                  }
                  variant={product.recommended ? "default" : "outline"}
                  className="w-full"
                />
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      {/* Custom Footer */}
      {withCustomFooter}
    </div>
  );
};

export default StripePricingTable;