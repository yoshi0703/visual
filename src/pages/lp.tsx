import React from 'react';
// Import necessary icons from lucide-react
import { 
  ArrowRight, Star, TrendingUp, MessageSquare, CheckCircle, Users, 
  Award, BarChart, Globe, Shield, Zap, Phone, QrCode, ThumbsUp,
  ChevronRight, HelpCircle, Calendar, CreditCard, Coffee, Smile, Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// 背景イメージのURL
const BLURRED_BG_IMAGE = "https://ramune-material.com/wp-content/uploads/2022/06/simple-gradation_120-940x529.png";

// Apple VisionOS風の洗練されたスタイルヘルパーオブジェクト
const visionStyles = {
  // コンテナスタイル
  container: "relative min-h-screen bg-gradient-to-b from-slate-50 to-white font-sans",
  contentContainer: "container mx-auto max-w-6xl px-4",
  
  // カードスタイル - ガラス効果強化
  card: "bg-white/70 backdrop-blur-xl border border-white/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(255,255,255,0.3)] overflow-hidden relative",
  cardHover: "hover:shadow-[0_15px_60px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(255,255,255,0.5)] transition-all duration-300 hover:-translate-y-1",
  cardGlow: "absolute -inset-1 bg-gradient-to-r from-sky-100/20 to-indigo-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl rounded-[32px]",
  
  // ボタンスタイル - Apple風の洗練された配色
  buttonPrimary: "bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-full shadow-[0_4px_12px_rgba(100,150,255,0.15)] hover:shadow-[0_8px_20px_rgba(100,150,255,0.25)] transition-all hover:-translate-y-0.5 px-6 py-3 font-medium flex items-center justify-center",
  buttonSecondary: "bg-white/80 backdrop-blur-xl border border-white/40 text-gray-700 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 px-6 py-3 flex items-center justify-center",
  buttonOutline: "bg-white/50 backdrop-blur-xl border border-white/40 text-gray-600 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 px-6 py-3 flex items-center justify-center",
  
  // 特殊エフェクト
  glassPanel: "bg-white/60 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(255,255,255,0.3)] relative group",
  innerGlow: "absolute inset-0 bg-gradient-to-tr from-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none",
  gradientText: "bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent",
  
  // セクションスタイル
  section: "py-16 relative overflow-hidden",
  sectionAlt: "py-16 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden",
  sectionDark: "py-16 bg-gradient-to-r from-sky-600 to-indigo-600 text-white relative overflow-hidden",
  
  // バッジスタイル
  badge: "inline-block px-4 py-1.5 bg-white/70 rounded-full text-sm font-medium backdrop-blur-sm border border-white/40 shadow-sm",
};

// Define the component with props similar to ImprovedLandingPage
const EnhancedHome: React.FC<{ onStartSurvey?: () => void; onLoginClick?: () => void; language?: string }> = ({ 
  onStartSurvey, // Using default implementation in handleRegisterClick
  onLoginClick, // Using default implementation in handleContactClick
  language = 'ja' // Default language
}) => {
  
  const navigate = useNavigate();
  
  // Handler for registration/free trial buttons
  const handleRegisterClick = () => {
    if (onStartSurvey) {
      onStartSurvey();
    } else {
      navigate('/register', { state: { step: 0 } });
     }
  };
  
  // Handler for contact/document request buttons
  const handleContactClick = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      navigate('/contact');
    }
  };
  
  // 困りごとベースに改善したテキスト
  const text = {
    hero: {
      badge: 'スマホが苦手でも迷わず使える',
      title: '口コミが自然に集まる！お店の集客に悩まない',
      subtitle: 'IT知識ゼロでも、お客様の「うれしい」の声でお店を賑わせましょう',
      cta: '今すぐ簡単に始めたい',
      storeCta: '詳しい情報が欲しい',
      stats: {
        rating: { value: '4.8', label: 'お客様満足度' },
        growth: { value: '2.5倍', label: '集客増加率' }
      }
    },
    simpleSummary: {
      title: 'お客様の声が集まるとこんな変化が起きます',
      description: 'クチトルがあなたのお店の悩みを解決します',
    },
    manga: {
      title: '「私のようなIT初心者でも使えるの？」と心配していた田中さんの場合',
      subtitle: '実際に使った60代オーナーの体験をマンガでご紹介',
      panels: [
        '「若い人は増えてほしいけど、どうやって集客すればいいのかしら...」',
        '「息子が『口コミを増やすといいよ』って言うけど、難しそう...」',
        '「クチトルなら、お客様がスマホをかざすだけで口コミが書けるんだって！」',
        '「QRコードをレジ横に置くだけでいいの？それなら私にもできそう！」',
        '「お客様が『美味しかった』と答えるだけで、AIが口コミを書いてくれるなんて便利！」',
        '「1ヶ月で口コミが20件も増えた！評価も4.7に上がって新しいお客様も増えてきたわ！」',
        '「こんなに簡単に集客できるなんて思わなかった。もっと早く始めればよかった！」'
      ],
      conclusion: '田中さんのお団子屋さんは、クチトルを導入してから3ヶ月で売上が1.5倍に！あなたも始めてみませんか？'
    },
    features: {
      title: 'スマホ操作が苦手でも簡単に始められる3つの特徴',
      items: [
        { title: '難しい設定は一切なし', description: 'アカウント登録後、お店の名前を入れるだけ。QRコードが自動で作られます。印刷してお店に置くだけで準備完了！' },
        { title: 'お客様の声が自然な口コミに', description: '「美味しかった」「接客が良かった」といった簡単な感想からAIが自然な口コミ文章を作ります。お客様の負担にならず気軽に協力してもらえます。' },
        { title: 'スマホからも確認カンタン', description: '何件口コミが増えたか、どんな内容か、すべてスマホから簡単に確認できます。難しいパソコン操作は必要ありません。' }
      ]
    },
    testimonials: {
      title: '初めは不安だったお店のオーナーさんたちの声',
      items: [
        { name: '和食処 さくら', owner: '佐藤 和子さん（68歳）', comment: '『パソコンは全く使えないけど、クチトルなら私でも簡単に使えました。お客様も「こんなに簡単なら協力するわよ」と喜んでくれて、3週間で口コミが15件も増えました。新規のお客様も増えて嬉しいです。』', result: '口コミ数：5件→28件 / 新規客：月30人増加' },
        { name: '理容室 ハッピーカット', owner: '田口 誠一さん（72歳）', comment: '『若い子に頼らなくても自分でできるのがいいですね。お客さんとの会話のきっかけにもなります。「良かったよ」って言ってもらえるのが何より嬉しいです。おかげで常連さんも増えました。』', result: '口コミ数：2件→18件 / リピート率：15%向上' },
        { name: '癒しの整体院', owner: '山本 恵子さん（58歳）', comment: '『ホームページを作る余裕がなかったので、Googleの情報だけが頼りでした。クチトルのおかげで患者さんの声がたくさん集まり、新しい方の予約が増えています。本当に感謝しています。』', result: '口コミ数：8件→34件 / 新規予約：週3件増加' }
      ]
    },
    pricing: {
      title: 'お悩みに合わせたプラン',
      subtitle: '初期費用なし・解約金なし・いつでも変更可能',
      items: [
        { title: 'お試しプラン', price: '30日間無料', priceDescription: 'その後月額5,000円（税別）', features: ['手軽に設置できるQRカード', '口コミ自動生成機能', 'スマホで簡単に結果確認', 'メールでの質問サポート'], recommended: false },
        { title: '個人店プラン', price: '月額5,000円（税込）', priceDescription: '年払いなら2ヶ月分お得！', features: ['複数箇所に設置できるQRカード3枚', '口コミ集計・分析機能', 'スマホアプリでカンタン確認', 'お電話サポート（平日9時-17時）', 'わかりやすい活用ガイド冊子'], recommended: true },
        { title: 'プレミアムプラン', price: '月額30,000円（税別）～', priceDescription: '店舗数に応じてお見積り', features: ['必要な分のQRカード', '複数店舗の一括管理', '店舗別の詳細レポート', '24時間いつでも質問対応', '専任スタッフによるサポート'], recommended: false }
      ]
    },
    setup: {
      title: '始め方がわからない方へ',
      subtitle: '5分で設定完了！その日から口コミが集まり始めます',
      steps: [
        { title: 'アカウントを登録する', description: '名前・電話番号・メールアドレスを入力するだけ。パソコンがなくてもスマホだけで完結します。' },
        { title: 'お店の情報を入れる', description: 'お店の名前とGoogleマップのURLを入力するだけ。難しい設定は一切ありません。' },
        { title: 'QRコードを設置する', description: '自動作成されたQRコードをコンビニで印刷するか、郵送されたカードをレジ横やテーブルに設置するだけ。' },
        { title: 'お客様に声をかける', description: '「よかったら感想を聞かせてください」と一言。スマホをかざすだけで簡単に回答できます。' },
        { title: '結果を確認する', description: 'スマホアプリで、増えた口コミ数や内容をカンタンに確認できます。' }
      ]
    },
    faq: {
      title: 'こんな疑問にお答えします',
      items: [
        { question: 'パソコンが苦手でも使えますか？', answer: 'はい、すべての機能がスマートフォンだけで利用できます。難しい操作は一切ありませんので、スマホの基本操作ができれば安心してご利用いただけます。' },
        { question: 'お客様にとって手間はかかりますか？', answer: 'お店に設置されたQRコードをスマホで読み取り、「美味しかった」「接客が良かった」など簡単な質問に答えるだけです。わずか30秒程度で完了します。その後AIが自然な口コミ文章を作成し、お客様が確認して投稿するだけです。' },
        { question: '本当に口コミは増えるのでしょうか？', answer: '多くのお客様はお店の感想を伝えたいと思っていますが、自分で文章を考えるのが面倒で投稿していないケースが多いです。クチトルなら簡単な質問に答えるだけでAIが文章を作成するため、導入店舗の平均で月に15-20件の口コミが増えています。' },
        { question: 'Googleの規約に違反しませんか？', answer: 'クチトルはGoogleの規約に完全に準拠しています。実際にお店を利用したお客様の感想をもとにAIが文章化するだけで、架空の口コミを作成することはありません。お客様自身が内容を確認して投稿するため、問題ありません。' },
        { question: '月額料金以外に費用はかかりますか？', answer: '初期費用や解約金は一切ありません。お試しプランなら30日間は完全無料です。その後も月額料金のみで、追加料金は一切発生しません。月単位での契約となるため、効果を実感できなければいつでも解約可能です。' }
      ]
    },
    finalCta: {
      title: 'お客様の声を集めて、お店を賑わせましょう！',
      subtitle: '30日間無料でお試しいただけます',
      button: '今すぐ無料で始める',
      secondary: '詳しい資料を請求する'
    }
  };

  return (
    <div className={visionStyles.container}>
      {/* 背景要素 */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-100 rounded-full filter blur-3xl opacity-70"></div>
      <div className="absolute top-40 -left-24 w-80 h-80 bg-blue-100 rounded-full filter blur-3xl opacity-70"></div>
      
      {/* === ヒーローセクション === */}
      <section className={`${visionStyles.section} pt-20 pb-24`}>
        <div className={visionStyles.contentContainer}>
          {/* ヒーローバッジ */}
          <div className="text-center mb-6 md:mb-8">
            <span className={visionStyles.badge}>
              {text.hero.badge}
            </span>
          </div>
          
          {/* ヒーローコンテンツ */}
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-tight">
              <span className={visionStyles.gradientText}>
                {text.hero.title}
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-10 max-w-3xl mx-auto">
              {text.hero.subtitle}
            </p>
            
            {/* CTA ボタン */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <button
                onClick={handleRegisterClick}
                className={`${visionStyles.buttonPrimary} text-lg`}
              >
                {text.hero.cta}
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button
                onClick={handleContactClick}
                className={`${visionStyles.buttonSecondary} text-lg`}
              >
                {text.hero.storeCta}
              </button>
            </div>
            
            {/* ヒーロー画像 */}
            <div className={`${visionStyles.glassPanel} overflow-hidden mb-12`}>
              <div className={visionStyles.innerGlow}></div>
              <img 
                src="https://images.unsplash.com/photo-1611274570139-fd814e9da504?q=80&w=800&h=450&auto=format&fit=crop"
                alt="クチトル利用イメージ" 
                className="w-full rounded-2xl"
              />
              {/* プレイボタンオーバーレイ */}
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* スタッツカード */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className={`${visionStyles.glassPanel} p-6 group ${visionStyles.cardHover}`}>
                <div className={visionStyles.innerGlow}></div>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-yellow-50/80 rounded-xl backdrop-blur-sm">
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                      {text.hero.stats.rating.value}
                    </p>
                    <p className="text-base text-gray-600">{text.hero.stats.rating.label}</p>
                  </div>
                </div>
              </div>
              
              <div className={`${visionStyles.glassPanel} p-6 group ${visionStyles.cardHover}`}>
                <div className={visionStyles.innerGlow}></div>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50/80 rounded-xl backdrop-blur-sm">
                    <TrendingUp className="h-8 w-8 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
                      {text.hero.stats.growth.value}
                    </p>
                    <p className="text-base text-gray-600">{text.hero.stats.growth.label}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === お店が繁盛するストーリー === */}
      <section className={`${visionStyles.sectionAlt}`}>
        <div className={visionStyles.contentContainer}>
          <div className="text-center mb-10">
             <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              <span className={visionStyles.gradientText}>
                {text.simpleSummary.title}
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-2">
              {text.simpleSummary.description}
            </p>
            <p className="text-sm text-gray-500 max-w-xl mx-auto md:hidden">
              ←→ スワイプしてストーリーを見る
            </p>
          </div>
          
          {/* モバイル: カルーセル */}
          <div className="md:hidden relative">
            <div className="overflow-x-auto pb-8 hide-scrollbar">
              <div className="flex space-x-6 px-4 w-max">
                {/* カード1 */}
                <div className={`${visionStyles.glassPanel} flex-shrink-0 w-80 group overflow-hidden`}>
                  <div className={visionStyles.innerGlow}></div>
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
                <div className={`${visionStyles.glassPanel} flex-shrink-0 w-80 group overflow-hidden`}>
                  <div className={visionStyles.innerGlow}></div>
                  <div className="h-48 relative">
                    <img src="https://images.unsplash.com/photo-1555421689-491a97ff2040?w=320&h=192&auto=format&fit=crop&q=80" alt="お客様回答" className="w-full h-full object-cover"/>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/40 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 bg-indigo-500 text-white text-xl font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-lg">2</div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-3 text-gray-800">お客様が簡単に回答</h3>
                    <p className="text-base text-gray-600">「美味しかった」「団子の食感がよかった」など、たった3つの質問。お客様は30秒で簡単に回答できました。</p>
                  </div>
                </div>
                
                {/* カード3 */}
                <div className={`${visionStyles.glassPanel} flex-shrink-0 w-80 group overflow-hidden`}>
                  <div className={visionStyles.innerGlow}></div>
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
                
                {/* カード4 */}
                <div className={`${visionStyles.glassPanel} flex-shrink-0 w-80 group overflow-hidden`}>
                  <div className={visionStyles.innerGlow}></div>
                  <div className="h-48 relative">
                    <img src="https://images.unsplash.com/photo-1556742031-c6961e8560b0?w=320&h=192&auto=format&fit=crop&q=80" alt="新規客来店" className="w-full h-full object-cover"/>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/40 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 bg-amber-500 text-white text-xl font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-lg">4</div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-3 text-gray-800">新しいお客様が増加</h3>
                    <p className="text-base text-gray-600">「口コミを見て来ました」というお客様が増え始めました。若い方や遠方からの来店も増えました。</p>
                  </div>
                </div>
                
                {/* カード5 */}
                <div className={`${visionStyles.glassPanel} flex-shrink-0 w-80 group overflow-hidden`}>
                  <div className={visionStyles.innerGlow}></div>
                  <div className="h-48 relative">
                    <img src="https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=320&h=192&auto=format&fit=crop&q=80" alt="繁盛" className="w-full h-full object-cover"/>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/40 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 bg-rose-500 text-white text-xl font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-lg">5</div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-3 text-gray-800">売上アップを実感！</h3>
                    <p className="text-base text-gray-600">田中さんのお団子屋さんは3ヶ月で売上が1.5倍に！「これからも大切にしていきたいです」と笑顔が溢れます。</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* モバイルインジケーター */}
            <div className="flex justify-center mt-4 space-x-2">
              {[0, 1, 2, 3, 4].map((index) => (
                <button 
                  key={index} 
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${index === 0 ? 'bg-sky-500' : 'bg-gray-300 hover:bg-gray-400'}`} 
                  aria-label={`カード${index + 1}を表示`}
                ></button>
              ))}
            </div>
          </div>
          
          {/* デスクトップ: タイムライン */}
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
              
              {/* ストーリー3 */}
              <div className="mb-16 relative">
                <div className="absolute -left-14 top-0 bg-emerald-500 text-white text-xl font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-lg">3</div>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-full md:w-1/3 rounded-xl shadow-md overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=240&auto=format&fit=crop&q=80" alt="口コミ増加" className="w-full h-48 object-cover"/>
                  </div>
                  <div className="w-full md:w-2/3">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">口コミがどんどん増加</h3>
                    <p className="text-lg text-gray-600 mb-4">3週間で20件以上の口コミが集まりました。Googleマップの星評価も4.2から4.7に上昇！</p>
                    <p className="text-lg text-gray-600 italic">「スマホでいつでも確認できるから、新しい口コミが入るのが楽しみになりました」と田中さん。</p>
                  </div>
                </div>
              </div>
              
              {/* ストーリー4 */}
              <div className="mb-16 relative">
                <div className="absolute -left-14 top-0 bg-amber-500 text-white text-xl font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-lg">4</div>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-full md:w-1/3 rounded-xl shadow-md overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1556742031-c6961e8560b0?w=400&h=240&auto=format&fit=crop&q=80" alt="新規客" className="w-full h-48 object-cover"/>
                  </div>
                  <div className="w-full md:w-2/3">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">新しいお客様が増加</h3>
                    <p className="text-lg text-gray-600 mb-4">「口コミを見て来ました」というお客様が増え始めました。若い方や遠方からの来店も増加。</p>
                    <p className="text-lg text-gray-600 italic">「今までは近所の方ばかりだったけど、駅の向こう側からもお客様が来るようになりました」</p>
                  </div>
                </div>
              </div>
              
              {/* ストーリー5 */}
              <div className="relative">
                <div className="absolute -left-14 top-0 bg-rose-500 text-white text-xl font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-lg">5</div>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-full md:w-1/3 rounded-xl shadow-md overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=240&auto=format&fit=crop&q=80" alt="売上アップ" className="w-full h-48 object-cover"/>
                  </div>
                  <div className="w-full md:w-2/3">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">売上アップを実感！</h3>
                    <p className="text-lg text-gray-600 mb-4">田中さんのお団子屋さんは3ヶ月で売上が1.5倍に！平日も活気のあるお店に生まれ変わりました。</p>
                    <div className={`${visionStyles.glassPanel} p-4 group`}>
                      <div className={visionStyles.innerGlow}></div>
                      <p className="text-lg text-sky-800 font-medium italic">「ITは苦手でしたが、クチトルは簡単に始められて本当に良かったです。これからも大切なお客様の声を集めていきたいです」と笑顔で話す田中さん。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* CTA ボタン */}
          <div className="text-center mt-12">
            <button
              onClick={handleRegisterClick}
              className={visionStyles.buttonPrimary}
            >
              あなたのお店でも始めてみる
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </section>
      
      {/* Scrollbar用のスタイル */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* === 漫画セクション === */}
      <section className={visionStyles.section}>
        <div className={visionStyles.contentContainer}>
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              <span className={visionStyles.gradientText}>
                {text.manga.title}
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              {text.manga.subtitle}
            </p>
          </div>
          
          {/* 漫画コマ */}
          <div className="max-w-5xl mx-auto mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {text.manga.panels.map((panel, index) => (
                <div key={index} className={`${visionStyles.glassPanel} p-4 group ${visionStyles.cardHover}`}>
                  <div className={visionStyles.innerGlow}></div>
                  <div className="aspect-square bg-gray-100 mb-3 rounded-xl overflow-hidden flex items-center justify-center relative">
                    <img src={`https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&index=${index}`} alt={`漫画コマ${index+1}`} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-10"></div>
                  </div>
                  <p className="text-base text-gray-700">{panel}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* 漫画のまとめ */}
          <div className="text-center mb-8">
            <p className="text-xl font-medium text-gray-700 max-w-3xl mx-auto">
              {text.manga.conclusion}
            </p>
          </div>
          
          {/* 漫画CTA */}
          <div className="text-center">
            <button
              onClick={handleRegisterClick}
              className={visionStyles.buttonPrimary}
            >
              無料で始めてみる
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* === 特徴セクション === */}
      <section className={visionStyles.sectionAlt}>
        <div className={visionStyles.contentContainer}>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
              <span className={visionStyles.gradientText}>
                {text.features.title}
              </span>
            </h2>
          </div>
          
          {/* 特徴項目 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {text.features.items.map((feature, index) => (
              <div key={index} className={`${visionStyles.glassPanel} p-8 group ${visionStyles.cardHover}`}>
                <div className={visionStyles.innerGlow}></div>
                {/* アイコン */}
                <div className="mb-6">
                  {index === 0 ? (
                    <div className="p-4 bg-sky-50/80 inline-block rounded-xl backdrop-blur-sm">
                      <QrCode className="h-6 w-6 text-sky-500" />
                    </div>
                  ) : index === 1 ? (
                    <div className="p-4 bg-indigo-50/80 inline-block rounded-xl backdrop-blur-sm">
                      <MessageSquare className="h-6 w-6 text-indigo-500" />
                    </div>
                  ) : (
                    <div className="p-4 bg-violet-50/80 inline-block rounded-xl backdrop-blur-sm">
                      <Phone className="h-6 w-6 text-violet-500" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-base text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === 実際のユーザーの声 === */}
      <section className={visionStyles.section}>
        <div className={visionStyles.contentContainer}>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
              <span className={visionStyles.gradientText}>
                {text.testimonials.title}
              </span>
            </h2>
          </div>
          {/* 証言項目 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {text.testimonials.items.map((testimonial, index) => (
              <div key={index} className={`${visionStyles.glassPanel} p-6 group ${visionStyles.cardHover} relative`}>
                <div className={visionStyles.innerGlow}></div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{testimonial.name}</h3>
                <div className="flex items-center mb-5">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-3 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${index+10}`} alt={testimonial.owner} className="w-full h-full object-cover"/>
                  </div>
                  <p className="text-gray-600 text-sm">{testimonial.owner}</p>
                </div>
                <div className="absolute top-4 right-4 text-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 opacity-30">
                    <path d="M6.5 10c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35.208-.086.39-.16.539-.222.302-.125.474-.197.474-.197L9.758 4.03c0 0-.218.052-.597.144C8.97 4.222 8.737 4.278 8.472 4.345c-.271.05-.56.187-.882.312C7.272 4.799 6.904 4.895 6.562 5.123c-.344.218-.741.4-1.091.692C5.132 6.116 4.723 6.377 4.421 6.76c-.33.358-.656.734-.909 1.162C3.219 8.33 3.02 8.778 2.81 9.221c-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539.017.109.025.168.025.168l.026-.006C2.535 17.474 4.338 19 6.5 19c2.485 0 4.5-2.015 4.5-4.5S8.985 10 6.5 10zM17.5 10c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35.208-.086.39-.16.539-.222.302-.125.474-.197.474-.197L20.758 4.03c0 0-.218.052-.597.144-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.317.143-.686.238-1.028.467-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.944-.33.358-.656.734-.909 1.162C14.219 8.33 14.02 8.778 13.81 9.221c-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539.017.109.025.168.025.168l.026-.006C13.535 17.474 15.338 19 17.5 19c2.485 0 4.5-2.015 4.5-4.5S19.985 10 17.5 10z" />
                  </svg>
                </div>
                <p className="text-base text-gray-700 mb-5 italic">{testimonial.comment}</p>
                <div className="bg-sky-50/80 p-3 rounded-lg backdrop-blur-sm">
                  <p className="text-sky-800 font-bold text-sm">{testimonial.result}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === 料金プラン === */}
      <section className={visionStyles.sectionAlt}>
        <div className={visionStyles.contentContainer}>
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              <span className={visionStyles.gradientText}>{text.pricing.title}</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">{text.pricing.subtitle}</p>
          </div>
          {/* 料金プラン */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {text.pricing.items.map((plan, index) => (
              <div key={index} className={`${visionStyles.glassPanel} p-6 group relative ${plan.recommended ? 'ring-4 ring-sky-300/30' : ''} ${visionStyles.cardHover}`}>
                <div className={visionStyles.innerGlow}></div>
                {plan.recommended && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white px-4 py-1 text-sm rounded-full font-medium shadow-md">
                    おすすめ
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-4">{plan.title}</h3>
                  <div className="mb-1"><span className="text-3xl font-bold">{plan.price}</span></div>
                  <p className="text-sm text-gray-500">{plan.priceDescription}</p>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-base text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={handleRegisterClick} 
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-all text-base ${
                    plan.recommended 
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md hover:shadow-lg' 
                      : 'bg-gray-100/80 backdrop-blur-sm text-gray-800 hover:bg-gray-200/80'
                  }`}
                >
                  {plan.recommended ? '今すぐ始める' : '詳細を見る'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === 始め方セクション === */}
      <section className={visionStyles.section}>
        <div className={visionStyles.contentContainer}>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              <span className={visionStyles.gradientText}>{text.setup.title}</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">{text.setup.subtitle}</p>
          </div>
          <div className="max-w-5xl mx-auto">
            {/* デスクトップフロー */}
            <div className="hidden md:flex flex-wrap lg:flex-nowrap justify-center items-start w-full gap-4 mb-10">
              {text.setup.steps.map((step, index) => (
                <React.Fragment key={index}>
                  <div className="flex-1 max-w-xs mb-4 lg:mb-0">
                    <div className={`${visionStyles.glassPanel} p-6 group h-full ${visionStyles.cardHover}`}>
                      <div className={visionStyles.innerGlow}></div>
                      <div className="w-12 h-12 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4 shadow-md">
                        {index + 1}
                      </div>
                      <div className="mb-4">
                        {index === 0 ? (
                          <div className="p-3 bg-sky-50/80 inline-block rounded-lg backdrop-blur-sm">
                            <Users className="h-6 w-6 text-sky-600" />
                          </div>
                        ) : index === 1 ? (
                          <div className="p-3 bg-indigo-50/80 inline-block rounded-lg backdrop-blur-sm">
                            <Globe className="h-6 w-6 text-indigo-600" />
                          </div>
                        ) : index === 2 ? (
                          <div className="p-3 bg-violet-50/80 inline-block rounded-lg backdrop-blur-sm">
                            <QrCode className="h-6 w-6 text-violet-600" />
                          </div>
                        ) : index === 3 ? (
                          <div className="p-3 bg-emerald-50/80 inline-block rounded-lg backdrop-blur-sm">
                            <MessageSquare className="h-6 w-6 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50/80 inline-block rounded-lg backdrop-blur-sm">
                            <Phone className="h-6 w-6 text-amber-600" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-base text-gray-600">{step.description}</p>
                    </div>
                  </div>
                  {index < text.setup.steps.length - 1 && (
                    <div className="hidden lg:flex flex-shrink-0 items-center">
                      <ArrowRight className="h-10 w-10 text-sky-300" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            {/* モバイルフロー */}
            <div className="md:hidden space-y-8">
              {text.setup.steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className={`${visionStyles.glassPanel} p-6 group ${visionStyles.cardHover}`}>
                    <div className={visionStyles.innerGlow}></div>
                    <div className="flex items-start gap-4">
                      <div>
                        <div className="w-12 h-12 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-md">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                        <p className="text-base text-gray-600">{step.description}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {index === 0 ? (
                          <div className="p-3 bg-sky-50/80 rounded-lg backdrop-blur-sm">
                            <Users className="h-6 w-6 text-sky-600" />
                          </div>
                        ) : index === 1 ? (
                          <div className="p-3 bg-indigo-50/80 rounded-lg backdrop-blur-sm">
                            <Globe className="h-6 w-6 text-indigo-600" />
                          </div>
                        ) : index === 2 ? (
                          <div className="p-3 bg-violet-50/80 rounded-lg backdrop-blur-sm">
                            <QrCode className="h-6 w-6 text-violet-600" />
                          </div>
                        ) : index === 3 ? (
                          <div className="p-3 bg-emerald-50/80 rounded-lg backdrop-blur-sm">
                            <MessageSquare className="h-6 w-6 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50/80 rounded-lg backdrop-blur-sm">
                            <Phone className="h-6 w-6 text-amber-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {index < text.setup.steps.length - 1 && (
                    <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 z-10 bg-white rounded-full p-1 shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* === よくある質問 === */}
      <section className={visionStyles.sectionAlt}>
        <div className={visionStyles.contentContainer}>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
              <span className={visionStyles.gradientText}>{text.faq.title}</span>
            </h2>
          </div>
          {/* FAQ項目 */}
          <div className="max-w-3xl mx-auto space-y-4">
            {text.faq.items.map((item, index) => (
              <details key={index} className={`group ${visionStyles.glassPanel} overflow-hidden [&_summary::-webkit-details-marker]:hidden`}>
                <div className={visionStyles.innerGlow}></div>
                <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer">
                  <h3 className="text-lg font-medium text-gray-900">{item.question}</h3>
                  <span className="relative flex-shrink-0 ml-1.5 w-5 h-5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-5 h-5 opacity-100 group-open:opacity-0 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-5 h-5 opacity-0 group-open:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-base text-gray-600">{item.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
      
      {/* === 運営者・サポート紹介 === */}
      <section className={visionStyles.section}>
        <div className={visionStyles.contentContainer}>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              <span className={visionStyles.gradientText}>
                私たちがあなたの集客をサポートします
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              クチトルは、お店の成功を願うチームが心を込めて運営・サポートしています。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* CEO 紹介カード */}
            <div className={`${visionStyles.glassPanel} p-8 group text-center ${visionStyles.cardHover}`}>
              <div className={visionStyles.innerGlow}></div>
              <div className="mb-5 inline-block">
                <img
                  src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120&h=120&ixlib=rb-4.0.3"
                  alt="クチトル CEO"
                  className="w-32 h-32 rounded-full object-cover mx-auto shadow-md border-2 border-white"
                />
              </div>
              <h3 className="text-xl font-bold mb-1 text-gray-800">
                大束良明
              </h3>
              <p className="text-base text-sky-600 font-medium mb-4">
                CEO
              </p>
              <p className="text-base text-gray-600 leading-relaxed">
                「ITの知識がない、スマホが苦手…そんな個人店オーナー様こそ、もっと手軽にネット集客の恩恵を受けてほしい。その一心でクチトルを開発しました。皆様の『お店が賑わう喜び』を、私たちが全力で後押しします！」
              </p>
            </div>

            {/* カスタマーサクセス 紹介カード */}
            <div className={`${visionStyles.glassPanel} p-8 group text-center ${visionStyles.cardHover}`}>
              <div className={visionStyles.innerGlow}></div>
              <div className="mb-5 inline-block">
                <img
                  src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=120&h=120&ixlib=rb-4.0.3"
                  alt="クチトル カスタマーサクセス"
                  className="w-32 h-32 rounded-full object-cover mx-auto shadow-md border-2 border-white"
                />
              </div>
              <h3 className="text-xl font-bold mb-1 text-gray-800">
                鈴木 大城
              </h3>
              <p className="text-base text-indigo-600 font-medium mb-4">
                事業開発リード
              </p>
              <p className="text-base text-gray-600 leading-relaxed">
                「『使い方が分からない』『もっと効果を出したい』そんな時は、いつでも私たちを頼ってください！お電話一本、メール一通で、あなたの疑問や不安がなくなるまで丁寧にご説明します。一緒に口コミを増やしていきましょう！」
              </p>
            </div>
          </div>

          {/* サポートへの安心感を促す一文 */}
          <div className="text-center mt-10">
             <p className="text-lg text-gray-700 max-w-2xl mx-auto flex items-center justify-center gap-2">
                <Phone className="h-5 w-5 text-gray-500" />
                <span>操作に困った時も、お電話で丁寧にご案内しますのでご安心ください。</span>
             </p>
          </div>
        </div>
      </section>

      {/* === 最終CTA === */}
      <section className={visionStyles.sectionDark}>
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white to-transparent"></div>
        <div className={visionStyles.contentContainer + " relative z-10 text-center"}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">{text.finalCta.title}</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">{text.finalCta.subtitle}</p>
          {/* CTA ボタン */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-xl mx-auto">
            <button
              onClick={handleRegisterClick} 
              className="w-full sm:w-auto px-8 py-4 bg-white text-sky-600 rounded-full font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              {text.finalCta.button}
            </button>
            <button
              onClick={handleContactClick} 
              className="w-full sm:w-auto px-8 py-4 bg-blue-500 bg-opacity-30 text-white rounded-full font-medium text-lg border border-white border-opacity-30 hover:bg-opacity-40 transition-all hover:shadow-lg hover:-translate-y-1"
            >
              {text.finalCta.secondary}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EnhancedHome;