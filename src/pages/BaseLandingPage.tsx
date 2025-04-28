import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowRight, Store, MessageSquare, Star, BarChart, QrCode } from 'lucide-react';

interface BaseLandingPageProps {
  title?: string;
  subtitle?: string;
  persona?: string;
  industry?: string;
  variant?: string;
  campaign?: string;
}

/**
 * Base Landing Page component that can be customized for different personas, industries, etc.
 */
const BaseLandingPage: React.FC<BaseLandingPageProps> = ({
  title = "口コミが自然に集まる！お店の集客に悩まない",
  subtitle = "IT知識ゼロでも、お客様の「うれしい」の声でお店を賑わせましょう",
  persona = "",
  industry = "",
  variant = "",
  campaign = ""
}) => {
  const location = useLocation();
  
  // 背景イメージのURL
  const BLURRED_BG_IMAGE = "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=2282&h=1282";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white font-sans overflow-hidden">
      {/* ヘッダーセクション */}
      <section className="relative py-20">
        {/* 背景要素 */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-100 rounded-full filter blur-3xl opacity-70"></div>
        <div className="absolute top-40 -left-24 w-80 h-80 bg-blue-100 rounded-full filter blur-3xl opacity-70"></div>
        
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          {/* バッジと編集ラベル */}
          <div className="text-center mb-6 flex flex-col items-center">
            <span className="inline-block px-4 py-1.5 bg-white/70 rounded-full text-sm font-medium backdrop-blur-sm border border-white/40 shadow-sm">
              スマホが苦手でも迷わず使える
            </span>
            
            {(persona || industry || variant || campaign) && (
              <div className="mt-3 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                {persona && `ペルソナ: ${persona}`} 
                {industry && `業種: ${industry}`}
                {variant && `バリアント: ${variant}`}
                {campaign && `キャンペーン: ${campaign}`}
              </div>
            )}
          </div>
          
          {/* ヘッダー */}
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              {title}
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-10 max-w-3xl mx-auto">
              {subtitle}
            </p>
            
            {/* CTA ボタン */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <Link 
                to="/register" 
                className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 px-6 py-3 text-lg flex items-center justify-center"
              >
                今すぐ簡単に始めたい
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              
              <Link
                to="/contact"
                className="bg-white/80 backdrop-blur-xl border border-white/40 text-gray-700 rounded-full shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 px-6 py-3 text-lg flex items-center justify-center"
              >
                詳しい資料を請求する
              </Link>
            </div>
            
            {/* 編集メッセージ */}
            <div className="p-4 bg-gray-100 rounded-lg text-gray-700 text-sm">
              このランディングページは現在編集中です。<br />
              実装すると、ターゲットに最適化されたコンテンツが表示されます。
            </div>
          </div>
          
          {/* プレースホルダー画像 */}
          <div className="bg-white/60 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-lg overflow-hidden mb-12 group">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
            <div className="h-80 bg-gray-200 flex items-center justify-center">
              <div className="text-gray-400 flex flex-col items-center">
                <Store className="h-16 w-16 mb-4" />
                <p className="text-center">ここに店舗イメージが表示されます</p>
              </div>
            </div>
          </div>
          
          {/* 特徴プレビュー */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/60 backdrop-blur-2xl border border-white/30 p-6 rounded-2xl shadow-md flex flex-col items-center text-center">
              <QrCode className="h-8 w-8 text-indigo-500 mb-4" />
              <h3 className="font-medium mb-2">簡単設置</h3>
              <p className="text-sm text-gray-600">QRコードを設置するだけですぐに開始できます</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-2xl border border-white/30 p-6 rounded-2xl shadow-md flex flex-col items-center text-center">
              <MessageSquare className="h-8 w-8 text-sky-500 mb-4" />
              <h3 className="font-medium mb-2">AIインタビュー</h3>
              <p className="text-sm text-gray-600">AIが自然な会話でお客様の声を引き出します</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-2xl border border-white/30 p-6 rounded-2xl shadow-md flex flex-col items-center text-center">
              <Star className="h-8 w-8 text-yellow-500 mb-4" />
              <h3 className="font-medium mb-2">口コミ増加</h3>
              <p className="text-sm text-gray-600">自然に口コミが増え、評価が向上します</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-2xl border border-white/30 p-6 rounded-2xl shadow-md flex flex-col items-center text-center">
              <BarChart className="h-8 w-8 text-emerald-500 mb-4" />
              <h3 className="font-medium mb-2">分析機能</h3>
              <p className="text-sm text-gray-600">お客様の声を分析し、改善点を発見します</p>
            </div>
          </div>
        </div>
      </section>

      {/* 必要に応じてさらにセクションを追加 */}

      {/* フッターセクション */}
      <section className="py-10 bg-gray-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} クチトル All rights reserved.</p>
          <p className="text-xs mt-2 text-gray-400">
            このページは現在編集中です。最終的なコンテンツはターゲットペルソナに合わせて最適化されます。
          </p>
        </div>
      </section>
    </div>
  );
};

export default BaseLandingPage;