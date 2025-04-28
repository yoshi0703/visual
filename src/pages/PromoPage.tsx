import React from 'react';
import { useParams } from 'react-router-dom';
import BaseLandingPage from './BaseLandingPage';

const PromoPage: React.FC = () => {
  const { promoCode } = useParams<{ promoCode: string }>();
  
  // プロモーション情報はコードに基づいて実際の実装では取得する
  // ここではプレースホルダーを使用
  return (
    <BaseLandingPage
      title="特別プロモーション"
      subtitle="あなただけの特別プロモーションコードで割引特典"
      campaign={`プロモコード: ${promoCode || '不明'}`}
    />
  );
};

export default PromoPage;