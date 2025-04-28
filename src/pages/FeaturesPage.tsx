import React from 'react';
import { MessageSquare, QrCode, Star, BarChart, Zap, Gift, Phone, Shield } from 'lucide-react';

const FeaturesPage: React.FC = () => {
  // 特徴データ
  const features = [
    {
      icon: <QrCode className="h-10 w-10 text-indigo-500" />,
      title: "簡単QR設置",
      description: "お店のURLを入力するだけでQRコードを自動生成。印刷して設置するだけで始められます。"
    },
    {
      icon: <MessageSquare className="h-10 w-10 text-blue-500" />,
      title: "AIインタビュー",
      description: "AIが自然な会話でお客様から感想を引き出します。お客様は短時間で気軽に回答できます。"
    },
    {
      icon: <Star className="h-10 w-10 text-yellow-500" />,
      title: "レビュー自動生成",
      description: "お客様の回答からAIが自然な口コミ文を作成。お客様はワンクリックで投稿できます。"
    },
    {
      icon: <BarChart className="h-10 w-10 text-green-500" />,
      title: "分析ダッシュボード",
      description: "収集した声を分析し、お店の強みや改善点がわかりやすく可視化されます。"
    },
    {
      icon: <Zap className="h-10 w-10 text-orange-500" />,
      title: "Google検索順位向上",
      description: "口コミ数と評価の向上により、Googleマップでの検索順位アップが期待できます。"
    },
    {
      icon: <Gift className="h-10 w-10 text-purple-500" />,
      title: "特典クーポン機能",
      description: "回答者へのお礼として特典クーポンを自動発行。リピート率向上につながります。"
    },
    {
      icon: <Phone className="h-10 w-10 text-pink-500" />,
      title: "スマホ簡単管理",
      description: "すべての機能をスマホから簡単に管理。専門的な知識は一切必要ありません。"
    },
    {
      icon: <Shield className="h-10 w-10 text-teal-500" />,
      title: "安心のサポート",
      description: "導入から運用まで、親身にサポート。操作方法は電話でも丁寧に説明します。"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
            クチトルの機能
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            IT知識ゼロでも使える、口コミ収集・活用の全機能
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-16">
          <p className="text-sm text-gray-500">
            このページは現在編集中です。実装時には機能の詳細な説明や画像、使用例なども追加されます。
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;