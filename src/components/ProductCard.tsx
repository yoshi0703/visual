import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Product } from '@/stripe-config';
import StripeCheckoutButton from './StripeCheckoutButton';

interface ProductCardProps {
  product: Product;
  selected?: boolean;
  onSelect?: () => void;
  buttonText?: string;
  showFeatures?: boolean;
  compact?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  selected = false,
  onSelect,
  buttonText,
  showFeatures = true,
  compact = false
}) => {
  // Format price based on currency
  const formatPrice = (price?: number, currency = 'jpy', interval?: string) => {
    if (!price) return '';
    
    const formatter = new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'jpy' ? 0 : 2
    });
    
    const formattedPrice = formatter.format(price);
    
    if (interval && product.mode === 'subscription') {
      return `${formattedPrice}/${interval === 'year' ? '年' : '月'}`;
    }
    
    return formattedPrice;
  };
  
  return (
    <Card className={`h-full transition-all ${
      selected 
        ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-500' 
        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
    } ${product.recommended ? 'relative pt-8' : ''}`}>
      {product.recommended && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold z-10 shadow">
          おすすめ
        </div>
      )}
      
      <CardHeader className={compact ? 'pb-2 pt-4 px-4' : ''}>
        <CardTitle className="flex justify-between items-start">
          <span>{product.name}</span>
          {product.mode === 'payment' && (
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
              一回払い
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {compact ? product.description.substring(0, 60) + (product.description.length > 60 ? '...' : '') : product.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className={`space-y-4 ${compact ? 'pt-0 pb-2 px-4' : ''}`}>
        <div className="font-bold text-2xl">
          {formatPrice(product.price, product.currency, product.interval)}
          {product.interval && product.mode === 'subscription' && (
            <span className="text-sm font-normal text-gray-500 ml-1">
              /{product.interval === 'year' ? '年' : '月'}
            </span>
          )}
        </div>
        
        {showFeatures && product.features && (
          <ul className="space-y-1.5 text-sm">
            {product.features.map((feature, idx) => (
              <li key={idx} className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      
      <CardFooter className={compact ? 'pt-0 pb-4 px-4' : ''}>
        {onSelect ? (
          <Button
            onClick={onSelect}
            variant={selected ? "default" : "outline"}
            className="w-full"
          >
            {buttonText || (selected ? '選択中' : '選択する')}
          </Button>
        ) : (
          <StripeCheckoutButton
            planId={product.priceId}
            buttonText={buttonText || (product.mode === 'subscription' ? 'サブスクリプションを開始' : '今すぐ購入')}
            variant={selected ? "default" : "outline"}
            className="w-full"
          />
        )}
      </CardFooter>
    </Card>
  );
};

export default ProductCard;