import React from 'react';
import { useParams } from 'react-router-dom';
import BaseLandingPage from './BaseLandingPage';

const CampaignPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  
  // キャンペーン情報はIDに基づいて実際の実装では取得する
  // ここではプレースホルダーを使用
  return (
    <BaseLandingPage
      title="期間限定キャンペーン"
      subtitle="限定特典つきで今だけお得にご利用いただけます"
      campaign={campaignId || '不明'}
    />
  );
};

export default CampaignPage;