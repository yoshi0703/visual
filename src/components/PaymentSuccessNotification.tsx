import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStoreStore } from '../lib/store';

interface PaymentSuccessNotificationProps {
  onComplete?: () => void;
  autoRedirectTime?: number; // Time in milliseconds
  planId?: string;
}

const PaymentSuccessNotification: React.FC<PaymentSuccessNotificationProps> = ({
  onComplete,
  autoRedirectTime = 4000, // Default: 4 seconds
  planId
}) => {
  const [countdown, setCountdown] = useState(Math.ceil(autoRedirectTime / 1000));
  const navigate = useNavigate();
  const { currentStore, updateSubscription } = useStoreStore();

  useEffect(() => {
    // ストアがあり、プランIDがある場合は更新
    if (currentStore?.id && planId) {
      console.log(`[PaymentSuccessNotification] ストア ${currentStore.id} のプラン ${planId} を更新`);
      updateSubscription(planId, 'active');
    }
    
    // Start countdown for auto-redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Set timeout for auto-redirect
    const redirectTimeout = setTimeout(() => {
      if (onComplete) {
        onComplete();
      } else {
        // Default redirect to store info step
        navigate('/onboarding?step=2', { replace: true });
      }
    }, autoRedirectTime);

    // Cleanup
    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimeout);
    };
  }, [autoRedirectTime, onComplete, navigate, currentStore, planId, updateSubscription]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
      >
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md text-center mx-4">
          <div className="mb-4 bg-green-100 p-3 rounded-full inline-flex">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">決済完了！</h2>
          <p className="text-gray-700 mb-4">
            お支払いいただきありがとうございます！<br />
            これからクチトルサービスをご利用いただけます。
          </p>
          <div className="bg-blue-50 p-4 mb-4 rounded-lg">
            <p className="text-blue-800 font-medium">
              {countdown}秒後に店舗情報の入力画面へ自動的に移動します
            </p>
          </div>
          <button
            onClick={() => {
              if (onComplete) {
                onComplete();
              } else {
                navigate('/onboarding?step=2', { replace: true });
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            今すぐ次へ進む
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentSuccessNotification;