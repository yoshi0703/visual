import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, CheckCircle, Star, ChevronRight, MessageSquare, Users, 
  Award, BarChart, Globe, Shield, Zap, Phone, QrCode, ThumbsUp
} from 'lucide-react';

const LandingPage: React.FC = () => {
  // 背景イメージのURL
  const BLURRED_BG_IMAGE = "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=2282&h=1282";
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white font-sans overflow-hidden">
      {/* ヒーローセクション */}
      <section className="relative py-20">
        {/* 背景要素 */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-100 rounded-full filter blur-3xl opacity-70"></div>
        <div className="absolute top-40 -left-24 w-80 h-80 bg-blue-100 rounded-full filter blur-3xl opacity-70"></div>
        
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          {/* ヒーローバッジ */}
          <div className="text-center mb-6">
            <span className="inline-block px-4 py-1.5 bg-white/70 rounded-full text-sm font-medium backdrop-blur-sm border border-white/40 shadow-sm">
              スマホが苦手でも迷わず使える
            </span>
          </div>
          
          {/* ヒーローコンテンツ */}
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              口コミが自然に集まる！お店の集客に悩まない
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-10 max-w-3xl mx-auto">
              IT知識ゼロでも、お客様の「うれしい」の声でお店を賑わせましょう
            </p>
            
            {/* CTA ボタン */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <Button
                className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 px-6 py-3 text-lg"
                asChild
              >
                <Link to="/register">
                  今すぐ簡単に始めたい
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button
                variant="outline"
                className="bg-white/80 backdrop-blur-xl border border-white/40 text-gray-700 rounded-full shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 px-6 py-3 text-lg"
                asChild
              >
                <Link to="/login">
                  詳しい情報が欲しい
                </Link>
              </Button>
            </div>
            
            {/* ヒーロー画像 */}
            <div className="bg-white/60 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-lg overflow-hidden mb-12 group">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
              <img 
                src="https://images.unsplash.com/photo-1611274570139-fd814e9da504?q=80&w=800&h=450&auto=format&fit=crop"
                alt="クチトル利用イメージ" 
                className="w-full rounded-2xl"
              />
            </div>
            
            {/* スタッツカード */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="bg-white/60 backdrop-blur-2xl border border-white/30 p-6 rounded-2xl shadow-lg group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-yellow-50/80 rounded-xl backdrop-blur-sm">
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                      4.8
                    </p>
                    <p className="text-base text-gray-600">お客様満足度</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-2xl border border-white/30 p-6 rounded-2xl shadow-lg group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50/80 rounded-xl backdrop-blur-sm">
                    <BarChart className="h-8 w-8 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
                      2.5倍
                    </p>
                    <p className="text-base text-gray-600">集客増加率</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* お店が繁盛するストーリー */}
      <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              お客様の声が集まるとこんな変化が起きます
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-2">
              クチトルがあなたのお店の悩みを解決します
            </p>
            <p className="text-sm text-gray-500 max-w-xl mx-auto md:hidden">
              ←→ スワイプしてストーリーを見る
            </p>
          </div>
          
          {/* ストーリーカード - モバイル用カルーセル */}
          <div className="md:hidden relative overflow-x-auto pb-8">
            <div className="flex space-x-6 px-4 w-max">
              {/* カード1 */}
              <div className="bg-white/60 backdrop-blur-2xl border border-white/30 flex-shrink-0 w-80 rounded-2xl shadow-lg overflow-hidden group">
                <div className="h-48 relative">
                  <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=320&h=192&auto=format&fit=crop&q=80" alt="QRコード設置" className="w-full h-full object-cover"/>
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/40 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 bg-sky-500 text-white text-xl font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-lg">1</div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-gray-800">QRコードを設置するだけ</h3>
                  <p className="text-base text-gray-600">田中さんはレジ横にQRコードカードを置きました。「レジを済ませた後に、このQRを読み取ってお団子の感想を教えてくださいね」</p>
                </div>
              </div>
              
              {/* カード2 */}
              <div className="bg-white/60 backdrop-blur-2xl border border-white/30 flex-shrink-0 w-80 rounded-2xl shadow-lg overflow-hidden group">
                <div className="h-48 relative">
                  <img src="https://images.unsplash.com/photo-1555421689-491a97ff2040?w=320&h=192&auto=format&fit=crop&q=80" alt="お客様回答" className="w-full h-full object-cover"/>
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/40 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 bg-indigo-500 text-white text-xl font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-lg">2</div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-gray-800">お客様が簡単に回答</h3>
                  <p className="text-base text-gray-600">「美味しかった」「団子の食感がよかった」など、たった3つの質問。お客様は30秒で簡単に回答できます。</p>
                </div>
              </div>
              
              {/* カード3 */}
              <div className="bg-white/60 backdrop-blur-2xl border border-white/30 flex-shrink-0 w-80 rounded-2xl shadow-lg overflow-hidden group">
                <div className="h-48 relative">
                  <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=320&h=192&auto=format&fit=crop&q=80" alt="口コミ増加" className="w-full h-full object-cover"/>
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/40 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 bg-emerald-500 text-white text-xl font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-lg">3</div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-gray-800">口コミがどんどん増加</h3>
                  <p className="text-base text-gray-600">3週間で20件以上の口コミが集まりました。Googleマップの星評価も4.2から4.7に上昇！スマホでいつでも確認できます。</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* ストーリータイムライン - デスクトップ用 */}
          <div className="hidden md:block max-w-5xl mx-auto">
            <div className="relative border-l-4 border-sky-200 pl-10 ml-10">
              {/* ストーリー1 */}
              <div className="mb-16 relative">
                <div className="absolute -left-14 top-0 bg-sky-500 text-white text-xl font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-lg">1</div>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-full md:w-1/3 rounded-xl shadow-md overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=240&auto=format&fit=crop&q=80" alt="QR設置" className="w-full h-48 object-cover"/>
                  </div>
                  <div className="w-full md:w-2/3">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">QRコードを設置するだけ</h3>
                    <p className="text-lg text-gray-600 mb-4">田中さんはレジ横にQRコードカードを置きました。難しい設定は一切不要です。</p>
                    <p className="text-lg text-gray-600 italic">「レジを済ませた後に、このQRを読み取ってお団子の感想を教えてくださいね」</p>
                  </div>
                </div>
              </div>
              
              {/* ストーリー2 */}
              <div className="mb-16 relative">
                <div className="absolute -left-14 top-0 bg-indigo-500 text-white text-xl font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-lg">2</div>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-full md:w-1/3 rounded-xl shadow-md overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1555421689-491a97ff2040?w=400&h=240&auto=format&fit=crop&q=80" alt="お客様回答" className="w-full h-48 object-cover"/>
                  </div>
                  <div className="w-full md:w-2/3">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">お客様が簡単に回答</h3>
                    <p className="text-lg text-gray-600 mb-4">「美味しかった」「団子の食感がよかった」など、たった3つの質問。お客様は30秒で簡単に回答できます。</p>
                    <p className="text-lg text-gray-600 italic">「こんなに簡単なら協力できるわ！」とお客様も喜んで回答してくれます。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* CTA */}
          <div className="text-center mt-12">
            <Button
              className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 px-6 py-3"
              asChild
            >
              <Link to="/register">
                あなたのお店でも始めてみる
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* 特徴セクション */}
      <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              スマホ操作が苦手でも簡単に始められる3つの特徴
            </h2>
          </div>
          
          {/* 特徴項目 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/60 backdrop-blur-2xl border border-white/30 p-8 rounded-2xl shadow-lg group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="mb-6">
                <div className="p-4 bg-sky-50/80 inline-block rounded-xl backdrop-blur-sm">
                  <QrCode className="h-6 w-6 text-sky-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">難しい設定は一切なし</h3>
              <p className="text-base text-gray-600">アカウント登録後、お店の名前を入れるだけ。QRコードが自動で作られます。印刷してお店に置くだけで準備完了！</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-2xl border border-white/30 p-8 rounded-2xl shadow-lg group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="mb-6">
                <div className="p-4 bg-indigo-50/80 inline-block rounded-xl backdrop-blur-sm">
                  <MessageSquare className="h-6 w-6 text-indigo-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">お客様の声が自然な口コミに</h3>
              <p className="text-base text-gray-600">「美味しかった」「接客が良かった」といった簡単な感想からAIが自然な口コミ文章を作ります。お客様の負担にならず気軽に協力してもらえます。</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-2xl border border-white/30 p-8 rounded-2xl shadow-lg group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="mb-6">
                <div className="p-4 bg-violet-50/80 inline-block rounded-xl backdrop-blur-sm">
                  <Phone className="h-6 w-6 text-violet-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">スマホからも確認カンタン</h3>
              <p className="text-base text-gray-600">何件口コミが増えたか、どんな内容か、すべてスマホから簡単に確認できます。難しいパソコン操作は必要ありません。</p>
            </div>
          </div>
        </div>
      </section>

      {/* よくある質問 */}
      <section className="py-16 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              よくあるご質問
            </h2>
          </div>
          
          {/* FAQ */}
          <div className="max-w-3xl mx-auto space-y-4">
            <details className="group bg-white/60 backdrop-blur-2xl border border-white/30 rounded-3xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer">
                <h3 className="text-lg font-medium text-gray-900">パソコンが苦手でも使えますか？</h3>
                <span className="relative flex-shrink-0 ml-1.5 w-5 h-5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-5 h-5 opacity-100 group-open:opacity-0 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-5 h-5 opacity-0 group-open:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                  </svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-base text-gray-600">
                はい、すべての機能がスマートフォンだけで利用できます。難しい操作は一切ありませんので、スマホの基本操作ができれば安心してご利用いただけます。
              </div>
            </details>
            
            <details className="group bg-white/60 backdrop-blur-2xl border border-white/30 rounded-3xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer">
                <h3 className="text-lg font-medium text-gray-900">お客様にとって手間はかかりますか？</h3>
                <span className="relative flex-shrink-0 ml-1.5 w-5 h-5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-5 h-5 opacity-100 group-open:opacity-0 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-5 h-5 opacity-0 group-open:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                  </svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-base text-gray-600">
                お店に設置されたQRコードをスマホで読み取り、「美味しかった」「接客が良かった」など簡単な質問に答えるだけです。わずか30秒程度で完了します。その後AIが自然な口コミ文章を作成し、お客様が確認して投稿するだけです。
              </div>
            </details>
            
            <details className="group bg-white/60 backdrop-blur-2xl border border-white/30 rounded-3xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer">
                <h3 className="text-lg font-medium text-gray-900">月額料金以外に費用はかかりますか？</h3>
                <span className="relative flex-shrink-0 ml-1.5 w-5 h-5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-5 h-5 opacity-100 group-open:opacity-0 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-5 h-5 opacity-0 group-open:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                  </svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-base text-gray-600">
                初期費用や解約金は一切ありません。お試しプランなら30日間は完全無料です。その後も月額料金のみで、追加料金は一切発生しません。月単位での契約となるため、効果を実感できなければいつでも解約可能です。
              </div>
            </details>
          </div>
        </div>
      </section>
      
      {/* 最終CTA */}
      <section className="py-16 bg-gradient-to-r from-sky-600 to-indigo-600 text-white relative">
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-slate-50 to-transparent"></div>
        <div className="container mx-auto relative z-10 text-center px-4 max-w-6xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">お客様の声を集めて、お店を賑わせましょう！</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">30日間無料でお試しいただけます</p>
          
          {/* CTA ボタン */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-xl mx-auto">
            <Button
              className="w-full sm:w-auto px-8 py-4 bg-white text-sky-600 rounded-full font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
              asChild
            >
              <Link to="/register">
                今すぐ無料で始める
              </Link>
            </Button>
            
            <Button
              className="w-full sm:w-auto px-8 py-4 bg-blue-500 bg-opacity-30 text-white rounded-full font-medium text-lg border border-white border-opacity-30 hover:bg-opacity-40 transition-all hover:shadow-lg hover:-translate-y-1"
              variant="ghost"
              asChild
            >
              <Link to="/login">
                詳しい資料を請求する
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* フッター */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white text-lg font-bold mb-4">クチトル</h3>
              <p className="text-sm mb-4">お店の口コミを自動で集めるサービス。設置するだけで口コミが増え、新規顧客の獲得につながります。</p>
            </div>
            
            <div>
              <h3 className="text-white text-lg font-bold mb-4">リンク</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="hover:text-white transition-colors">ホーム</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">新規登録</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">ログイン</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">よくある質問</a></li>
                <li><a href="#" className="hover:text-white transition-colors">お問い合わせ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white text-lg font-bold mb-4">お問い合わせ</h3>
              <p className="text-sm mb-1">メール: info@kuchitoru.com</p>
              <p className="text-sm mb-1">電話: 03-1234-5678</p>
              <p className="text-sm">営業時間: 平日 10:00-18:00</p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            <p>&copy; {new Date().getFullYear()} クチトル All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;