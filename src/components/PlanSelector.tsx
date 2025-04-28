import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { CheckCircle, Check } from 'lucide-react';
import StripeCheckoutButton from './StripeCheckoutButton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

// プランの型定義
interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  priceDescription?: string;
  features: string[];
  recommended?: boolean;
}

// プランセレクターのProps
interface PlanSelectorProps {
  plans: Plan[];
  selectedPlan: string;
  setSelectedPlan: (id: string) => void;
  onPlanSelected?: (planId: string) => void;
  loading?: boolean;
  error?: string | null;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({
  plans,
  selectedPlan,
  setSelectedPlan,
  onPlanSelected,
  loading = false,
  error = null
}) => {
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* エラー表示 */}
      {(error || checkoutError) && (
        <Alert variant="destructive">
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error || checkoutError}</AlertDescription>
        </Alert>
      )}
      
      {/* プランカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all flex flex-col justify-between h-full ${
              selectedPlan === plan.id
                ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-500'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
            } ${plan.recommended ? 'relative pt-8' : 'pt-4'}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.recommended && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold z-10 shadow">
                おすすめ
              </div>
            )}
            <div className="flex-grow">
              <div className="font-bold text-lg mb-1">{plan.name}</div>
              <div className="text-gray-600 text-sm mb-3 h-10">{plan.description}</div>
              <div className="font-bold text-xl mb-3">{plan.price}</div>
              {plan.priceDescription && (
                <div className="text-sm text-gray-500 mb-3">{plan.priceDescription}</div>
              )}
              <ul className="space-y-1.5 text-sm mb-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Stripeチェックアウトボタン */}
            <StripeCheckoutButton
              planId={plan.id}
              buttonText={selectedPlan === plan.id ? 'このプランで始める' : 'このプランを選択'}
              variant={selectedPlan === plan.id ? "default" : "outline"}
              className="w-full mt-auto"
              onSuccess={() => {
                if (onPlanSelected) onPlanSelected(plan.id);
              }}
              onError={setCheckoutError}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanSelector;