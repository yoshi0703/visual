import React, { useState } from 'react';
import { getSubscriptionProducts, getOneTimeProducts, Product } from '@/stripe-config';
import ProductCard from './ProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, ShoppingBag } from 'lucide-react';

interface StripeProductListProps {
  selectedProductId?: string;
  onSelectProduct?: (product: Product) => void;
  showSubscriptions?: boolean;
  showOneTimeProducts?: boolean;
  compact?: boolean;
}

const StripeProductList: React.FC<StripeProductListProps> = ({
  selectedProductId,
  onSelectProduct,
  showSubscriptions = true,
  showOneTimeProducts = true,
  compact = false
}) => {
  const [activeTab, setActiveTab] = useState<string>(showSubscriptions ? 'subscriptions' : 'one-time');
  
  const subscriptions = getSubscriptionProducts();
  const oneTimeProducts = getOneTimeProducts();
  
  const handleSelectProduct = (product: Product) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  };
  
  // Show only tabs with products
  const showTabs = 
    (showSubscriptions && subscriptions.length > 0) && 
    (showOneTimeProducts && oneTimeProducts.length > 0);
  
  return (
    <div className="w-full">
      {showTabs && (
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="subscriptions" className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              <span>サブスクリプション</span>
            </TabsTrigger>
            <TabsTrigger value="one-time" className="flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4" />
              <span>単品購入</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="subscriptions">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptions.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  selected={selectedProductId === product.id}
                  onSelect={onSelectProduct ? () => handleSelectProduct(product) : undefined}
                  compact={compact}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="one-time">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {oneTimeProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  selected={selectedProductId === product.id}
                  onSelect={onSelectProduct ? () => handleSelectProduct(product) : undefined}
                  compact={compact}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
      
      {/* When we don't need tabs (only one type of product) */}
      {!showTabs && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {showSubscriptions && subscriptions.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              selected={selectedProductId === product.id}
              onSelect={onSelectProduct ? () => handleSelectProduct(product) : undefined}
              compact={compact}
            />
          ))}
          
          {showOneTimeProducts && oneTimeProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              selected={selectedProductId === product.id}
              onSelect={onSelectProduct ? () => handleSelectProduct(product) : undefined}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StripeProductList;