import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';

const PricingPage: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  
  // 価格プラン
  const plans = [
    {
      name: "お試しプラン",
      description: "クチトルを気軽に試してみたい方向け",
      price: {
        monthly: "30日間無料",
        yearly: "30日間無料"
      },
      priceDetails: {
        monthly: "その後¥2,980/月",
        yearly: "その後¥2,980/月"
      },
      features: [
        { included: true, text: "1つの店舗で利用可能" },
        { included: true, text: "QRコード1枚" },
        { included: true, text: "AIインタビュー機能" },
        { included: true, text: "レビュー自動生成" },
        { included: true, text: "基本的な分析レポート" },
        { included: false, text: "複数QRコード" },
        { included: false, text: "詳細分析ダッシュボード" },
        { included: false, text: "優先サポート" }
      ],
      isPopular: false,
      ctaText: "無料で始める"
    },
    {
      name: "ベーシック",
      description: "個人店舗向けの標準プラン",
      price: {
        monthly: "¥5,980",
        yearly: "¥4,980"
      },
      priceDetails: {
        monthly: "/月（税別）",
        yearly: "/月（税別・年間契約）"
      },
      features: [
        { included: true, text: "1つの店舗で利用可能" },
        { included: true, text: "QRコード最大3枚" },
        { included: true, text: "AIインタビュー機能" },
        { included: true, text: "レビュー自動生成" },
        { included: true, text: "詳細な分析レポート" },
        { included: true, text: "口コミトレンド分析" },
        { included: true, text: "電話サポート（平日）" },
        { included: false, text: "優先サポート" }
      ],
      isPopular: true,
      ctaText: "このプランを選ぶ"
    },
    {
      name: "プレミアム",
      description: "複数店舗展開企業向け",
      price: {
        monthly: "¥14,800",
        yearly: "¥11,800"
      },
      priceDetails: {
        monthly: "/月（税別）",
        yearly: "/月（税別・年間契約）"
      },
      features: [
        { included: true, text: "最大5店舗まで利用可能" },
        { included: true, text: "店舗ごとにQRコード無制限" },
        { included: true, text: "高度なAIインタビュー機能" },
        { included: true, text: "高品質レビュー自動生成" },
        { included: true, text: "全機能の分析ダッシュボード" },
        { included: true, text: "競合比較分析" },
        { included: true, text: "24時間メールサポート" },
        { included: true, text: "専任担当者によるサポート" }
      ],
      isPopular: false,
      ctaText: "このプランを選ぶ"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
            シンプルな料金プラン
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            あなたの店舗に最適なプランをお選びください
          </p>
        </div>
        
        {/* 請求周期の切り替え */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-full p-1 inline-flex">
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                billingPeriod === 'monthly' 
                  ? 'bg-indigo-500 text-white' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setBillingPeriod('monthly')}
            >
              月払い
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                billingPeriod === 'yearly' 
                  ? 'bg-indigo-500 text-white' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setBillingPeriod('yearly')}
            >
              年払い<span className="ml-1 text-xs font-normal text-emerald-600">お得</span>
            </button>
          </div>
        </div>
        
        {/* 料金プランカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`bg-white/70 backdrop-blur-xl border ${
                plan.isPopular 
                  ? 'border-indigo-300 ring-2 ring-indigo-500/30' 
                  : 'border-white/30'
              } rounded-2xl shadow-lg overflow-hidden relative`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold py-1 px-3 rounded-bl-lg">
                  人気
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-6">{plan.description}</p>
                
                <div className="mb-4">
                  <div className="flex items-end">
                    <span className="text-3xl font-bold">
                      {plan.price[billingPeriod]}
                    </span>
                    {plan.price[billingPeriod] !== "30日間無料" && (
                      <span className="text-gray-500 ml-1">
                        {plan.priceDetails[billingPeriod]}
                      </span>
                    )}
                  </div>
                  {plan.priceDetails[billingPeriod] && plan.price[billingPeriod] === "30日間無料" && (
                    <p className="text-gray-500 text-sm">
                      {plan.priceDetails[billingPeriod]}
                    </p>
                  )}
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 mr-2 flex-shrink-0" />
                      )}
                      <span className={feature.included ? "text-gray-700" : "text-gray-400"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  to="/register"
                  className={`w-full py-2 px-4 rounded-lg font-medium text-center block transition-colors ${
                    plan.isPopular
                      ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {plan.ctaText}
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        {/* よくある質問セクションや他のコンテンツはここに追加可能 */}
        
        <div className="text-center mt-16">
          <p className="text-sm text-gray-500">
            このページは現在編集中です。実装時には料金に関するFAQ、導入企業の声なども追加されます。
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;