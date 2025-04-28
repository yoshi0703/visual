import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import { 
  ArrowRight, Clock, MessageSquare, CheckCircle, 
  Star, Award, Zap, Heart, DollarSign, Users, 
  Store, QrCode, Shield, Mail, CreditCard, Search
} from 'lucide-react';

// ================== 設定・コンテンツ ==================

// アセット設定
const ASSETS = {
  logo: 'https://i.imgur.com/EKN4pph.png',
  heroImage: 'https://picsum.photos/800/600',
  productImages: {
    main: 'https://i.imgur.com/ncP4gwS.gif',
    usage: 'https://i.imgur.com/qkzKLFM.gif',
    interface: 'https://i.imgur.com/czqDkf1.gif',
    dashboard: 'https://imgur.com/qkzKLFM'
  }
};

// AIスタッフの特徴データ
const STAFF_FEATURES = [
  {
    icon: <Clock size={20} />,
    text: "24時間いつでも接客",
    benefit: "人件費削減と機会損失防止"
  },
  {
    icon: <Award size={20} />,
    text: "接客満足度95%",
    benefit: "お客様の声を自然に引き出します"
  },
  {
    icon: <Zap size={20} />,
    text: "1日120件の接客対応",
    benefit: "人手不足でも安定した顧客体験"
  },
  {
    icon: <Heart size={20} />,
    text: "高い口コミ投稿率",
    benefit: "通常の声かけよりも効果的"
  }
];

// 比較データ
const COMPARISON_DATA = [
  {
    category: "営業時間",
    human: { text: "週40時間、シフト調整必要", status: "negative" },
    ai: { text: "365日24時間いつでも対応", status: "positive" }
  },
  {
    category: "コスト",
    human: { text: "月給25万円〜+社会保険+有給", status: "negative" },
    ai: { text: "月額5,000円（税別）のみ", status: "positive" }
  },
  {
    category: "導入",
    human: { text: "採用活動と研修期間が必要", status: "negative" },
    ai: { text: "URLを入力するだけで即日稼働", status: "positive" }
  },
  {
    category: "サービス品質",
    human: { text: "個人差や体調で変動あり", status: "negative" },
    ai: { text: "常に安定した対応を維持", status: "positive" }
  },
  {
    category: "口コミ集め",
    human: { text: "声かけで約10%の獲得率", status: "negative" },
    ai: { text: "自然な会話で獲得率アップ", status: "positive" }
  }
];

// 価格計算
const PRICE_CALCULATION = {
  monthlyCost: 5000, // 税別月額
  dailyResponseTime: 0.5, // 1日あたり30分（0.5時間）
  daysPerMonth: 30, // 1ヶ月あたりの日数
  hoursPerMonth: 0.5 * 30, // 1日30分 × 30日 = 15時間/月
  hourlyRate: Math.round(5000 / (0.5 * 30)), // ≈ 333円/時間
  reviewConversion: 0.09, // 平均口コミ投稿率 (業界平均から算出)
  reviewValue: 8000, // 口コミ1件あたりの価値（訪問者数換算）
  monthlyResponses: 120, // 月間対応数 (業種平均)
  monthlyReviews: 120 * 0.09, // 月間獲得口コミ数 (120件対応 * 9%投稿率)
  monthlySalesImpact: Math.round(120 * 0.09 * 8000), // 月間売上効果
};

// クチトルの履歴書データ
const RESUME_DATA = {
  basics: {
    name: "クチトル",
    birth: "2023年4月1日",
    location: "クラウドサーバー",
    contact: "support@kuchitoru.ai",
    objective: "お客様の声を自然に引き出し、店舗の評価向上と集客に貢献します。疲れを知らない24時間営業のAI接客スタッフとして、人間のスタッフでは対応しきれない業務をサポートします。",
  },
  work: [
    {
      company: "クチトル株式会社",
      position: "AIアシスタント",
      startDate: "2023-04",
      endDate: "現在",
      summary: "店舗の評価向上と口コミ収集に特化したAIアシスタント",
      highlights: [
        "月間平均150件の顧客対応をしています",
        "通常の声かけよりも高い口コミ獲得率",
        "24時間365日無休で稼働しています",
        "導入店舗の検索順位向上に貢献しています"
      ]
    }
  ],
  skills: [
    "自然な会話", "感情理解", "状況把握", "個別対応",
    "顧客の声の分析", "傾向把握", "改善提案",
    "休憩不要", "シフト管理不要", "常に安定した対応"
  ]
};

// 導入ステップ
const ADOPTION_STEPS = [
  {
    title: '1. お店の情報を登録',
    description: 'お店のホームページURLだけ。クチトルが自動的にお店の種類を判断し、最適な接客の仕方を覚えます。',
    icon: <Store className="h-8 w-8 mb-6" />,
    time: '所要時間：約2分',
    difficulty: '難易度：かんたん'
  },
  {
    title: '2. QRコードを設置',
    description: '自動作成されたQRコードを印刷して設置。レジ横やテーブルなど、お客様の目に入る場所がおすすめです。',
    icon: <QrCode className="h-8 w-8 mb-6" />,
    time: '所要時間：約3分',
    difficulty: '難易度：かんたん'
  },
  {
    title: '3. すぐに始まります',
    description: '設置完了と同時に24時間体制で接客開始。口コミ収集からデータ分析まで全て自動で行います。',
    icon: <Zap className="h-8 w-8 mb-6" />,
    time: '所要時間：0分',
    difficulty: '難易度：なし'
  }
];

// FAQ項目
const FAQ_ITEMS = [
  {
    question: '特別な知識がなくても始められますか？',
    answer: 'はい、URLを入力するだけで設定完了です。スマホかパソコンの基本操作ができれば問題ありません。不安な方には専任スタッフがサポートします。'
  },
  {
    question: 'どんなお店で使えますか？',
    answer: '飲食店、美容室、整体院、小売店など、お客様の声を集めたいあらゆるお店でご利用いただけます。お店の種類に合わせた専門知識を自動で学習します。'
  },
  {
    question: 'どれくらいの効果が期待できますか？',
    answer: '調査によると、60〜80%の消費者が購入前に口コミを確認すると言われています。良質な口コミが増えることで、お店の検索順位向上につながります。実際のお客様からの声としてGoogleに表示されるため、新規のお客様獲得にもつながります。'
  },
  {
    question: '解約はいつでもできますか？',
    answer: 'はい、いつでも解約金なしで解約できます。月額契約で、解約月末日まで利用可能。集めた口コミデータはCSVでダウンロードできます。'
  },
  {
    question: '口コミって何ですか？なぜ大事なのですか？',
    answer: '口コミとは、お店を利用したお客様が書く感想や評価のことです。Google検索でお店の名前を検索すると表示される星評価と感想文です。調査によると、82%以上のお客様がお店選びの際に口コミを参考にしており、お店の集客に大きく影響します。'
  }
];

// 用語集
const GLOSSARY_ITEMS = [
  {
    term: 'Google口コミ',
    definition: 'Googleマップやお店の検索結果に表示される、実際に利用したお客様の評価と感想です。星評価（5段階）とコメントで構成されています。'
  },
  {
    term: '検索順位',
    definition: 'Googleなどの検索エンジンで表示される順番のことです。上位に表示されるほど多くの人の目に触れる機会が増えます。'
  },
  {
    term: 'QRコード',
    definition: '四角い模様のコードで、スマホのカメラをかざすとウェブサイトを開くことができます。お客様がスムーズに口コミを書けるようにするために使います。'
  },
  {
    term: 'MEO対策',
    definition: 'Map Engine Optimizationの略で、Googleマップでお店が見つかりやすくなるための取り組みのことです。口コミはMEO対策の重要な要素です。'
  }
];

// 口コミ効果の統計データ
const REVIEW_STATISTICS = [
  {
    title: '消費者行動への影響',
    value: '60〜80%',
    description: '購入前に口コミを参考にする消費者の割合',
    source: '総務省情報通信白書・各種調査より'
  },
  {
    title: '口コミの自然発生率',
    value: '1%以下',
    description: '何も対策をしない場合に自発的に口コミを書く顧客の割合',
    source: 'MEOチェキ調査より'
  },
  {
    title: '来店判断への影響',
    value: '76.4%',
    description: '星評価が3以下の場合に来店をやめるユーザーの割合',
    source: 'プロモスト社調査より'
  },
  {
    title: '口コミを重視する世代',
    value: '10〜30代',
    description: '特に若い世代ほど口コミを参考にする傾向が強い',
    source: 'マイボイスコム社調査より'
  }
];

// ================== スタイルの定義 ==================

// グローイングテキスト用スタイル - 画像と同じような光る効果を実現
const glowingTextStyles = {
  container: {
    position: 'relative',
    display: 'inline-block',
    zIndex: 1,
  },
  shining: {
    color: 'white',
    fontWeight: 700,
    textShadow: '0 0 10px rgba(255, 255, 255, 0.7)',
    animation: 'shine 3s ease-in-out infinite',
  },
  dimmed: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: 500,
  },
  // アニメーションはリアクトコンポーネントで実装します
};

// ================== コンポーネント ==================

// GlowingText - 光るテキスト効果コンポーネント
const GlowingText = ({ children, className = "", dimmed = false }) => {
  return (
    <span
      style={dimmed ? glowingTextStyles.dimmed : glowingTextStyles.shining}
      className={`relative ${className}`}
    >
      {children}
      <style jsx>{`
        @keyframes shine {
          0% {
            text-shadow: 0 0 5px rgba(255, 255, 255, 0.7);
          }
          50% {
            text-shadow: 0 0 15px rgba(255, 255, 255, 0.9), 0 0 20px rgba(255, 255, 255, 0.5);
          }
          100% {
            text-shadow: 0 0 5px rgba(255, 255, 255, 0.7);
          }
        }
      `}</style>
    </span>
  );
};

// ScrollableSection - Appleスタイルのスクロール連動アニメーション
const ScrollableSection = ({ children, className, bgColor = "bg-black", id = "" }) => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  return (
    <section 
      ref={sectionRef} 
      id={id}
      className={`relative w-full overflow-hidden py-20 ${bgColor} ${className}`}
    >
      <div className="container mx-auto max-w-screen-lg px-6 md:px-8">
        {children(scrollYProgress)}
      </div>
    </section>
  );
};

// SectionTitle - シンプルなセクションタイトル
const SectionTitle = ({ title, subtitle, alignLeft = false, light = false, glowingTitle = false }) => {
  const textAlign = alignLeft ? "text-left" : "text-center";
  const textColor = light ? "text-gray-400" : "text-gray-200";
  
  return (
    <div className={`${textAlign} mb-16`}>
      <h2 className="text-4xl font-bold text-white tracking-tight mb-4">
        {glowingTitle ? <GlowingText>{title}</GlowingText> : title}
      </h2>
      {subtitle && (
        <p className={`${textColor} text-xl max-w-3xl ${alignLeft ? "" : "mx-auto"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

// Button - Appleスタイルのシンプルなボタン
const Button = ({ children, primary = true, onClick, icon, className = "", href = "" }) => {
  const baseStyle = "flex items-center justify-center rounded-full transition-all cursor-pointer font-medium tracking-tight py-4 px-8";
  const primaryStyle = "bg-white text-black hover:bg-gray-100";
  const secondaryStyle = "bg-black text-white border border-gray-700 hover:bg-gray-900";
  
  // リンクの場合はaタグを返す
  if (href) {
    return (
      <a 
        href={href}
        className={`${baseStyle} ${primary ? primaryStyle : secondaryStyle} ${className}`}
      >
        <span>{children}</span>
        {icon && <span className="ml-2">{icon}</span>}
      </a>
    );
  }
  
  // リンクでない場合はbuttonタグを返す
  return (
    <button 
      className={`${baseStyle} ${primary ? primaryStyle : secondaryStyle} ${className}`}
      onClick={onClick}
    >
      <span>{children}</span>
      {icon && <span className="ml-2">{icon}</span>}
    </button>
  );
};

// FeatureItem - 特徴アイテム
const FeatureItem = ({ icon, text, benefit, delay = 0 }) => {
  return (
    <motion.div 
      className="flex items-start mb-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay }}
    >
      <div className="mr-4 mt-1 flex-shrink-0 text-gray-400">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">{text}</h3>
        <p className="text-gray-400">{benefit}</p>
      </div>
    </motion.div>
  );
};

// ResumeCard - Appleスタイルの履歴書コンポーネント
const ResumeCard = ({ data }) => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="bg-gray-900/60 backdrop-blur-md rounded-3xl border border-gray-800/50 overflow-hidden"
    >
      <div className="p-8 border-b border-gray-800/50">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">{data.basics.name}</h3>
            <p className="text-gray-400">稼働開始: {data.basics.birth}</p>
            <p className="text-gray-400 mt-2">{data.basics.location}</p>
          </div>
          <div className="flex-shrink-0">
            <div className="flex justify-center items-center w-20 h-20 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full">
              <img src={ASSETS.logo} alt="クチトル" className="w-16 h-16 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-8 border-b border-gray-800/50">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-white mb-3">目標</h4>
          <p className="text-gray-400">{data.basics.objective}</p>
        </div>
      </div>
      
      <div className="p-8 border-b border-gray-800/50">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-white mb-3">業務実績</h4>
          {data.work.map((work, idx) => (
            <div key={idx}>
              <div className="flex justify-between mb-2">
                <p className="text-white font-medium">{work.position}</p>
                <p className="text-gray-400">
                  {work.startDate} - {work.endDate}
                </p>
              </div>
              <p className="text-gray-400 mb-3">{work.summary}</p>
              <ul className="space-y-1 list-inside list-disc text-gray-400">
                {work.highlights.map((highlight, i) => (
                  <li key={i}>{highlight}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-8">
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">スキル</h4>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, idx) => (
              <span 
                key={idx}
                className="inline-block px-3 py-1 bg-blue-900/30 text-blue-400 text-sm rounded-full border border-blue-800/50"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ComparisonTable - Apple風比較表
const ComparisonTable = ({ data }) => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-x-auto"
    >
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-1/4 text-left pb-6 text-gray-400 font-medium">項目</th>
            <th className="w-1/3 text-left pb-6 text-gray-400 font-medium">一般的なスタッフ</th>
            <th className="w-1/3 text-left pb-6 text-white font-medium">クチトル AI接客スタッフ</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <motion.tr 
              key={index}
              className="border-t border-gray-800"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <td className="py-6 font-medium text-white">{item.category}</td>
              <td className="py-6 text-gray-400">{item.human.text}</td>
              <td className="py-6 text-blue-400">{item.ai.text}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};

// AdoptionStep - 導入ステップ
const AdoptionStep = ({ title, description, icon, time, difficulty, index }) => {
  return (
    <motion.div
      className="flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: index * 0.15 }}
    >
      <div className="text-center md:text-left mb-6">
        {icon}
      </div>
      <h3 className="text-2xl font-semibold text-white mb-4">{title}</h3>
      <p className="text-gray-400 mb-6">{description}</p>
      <div className="space-y-2 mt-auto">
        <div className="text-sm text-gray-400">
          {time}
        </div>
        <div className="text-sm text-gray-400">
          {difficulty}
        </div>
      </div>
    </motion.div>
  );
};

// FaqItem - FAQ項目
const FaqItem = ({ question, answer, isOpen, toggleOpen }) => {
  return (
    <div className="border-b border-gray-800 last:border-0 py-8">
      <button 
        className="flex justify-between items-center w-full text-left" 
        onClick={toggleOpen}
      >
        <h3 className="text-xl font-medium text-white pr-8">{question}</h3>
        <span className="text-gray-400 text-2xl transform transition-transform">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="text-gray-400 pt-4 pb-2">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// GlossaryItem - 用語集アイテム
const GlossaryItem = ({ term, definition }) => {
  return (
    <div className="mb-4 last:mb-0">
      <h4 className="text-lg font-medium text-blue-400 mb-1">{term}</h4>
      <p className="text-gray-400">{definition}</p>
    </div>
  );
};

// StatCard - 統計データカード
const StatCard = ({ title, value, description, source, index }) => {
  return (
    <motion.div 
      className="bg-gray-900/60 backdrop-blur-md rounded-2xl border border-gray-800/50 p-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: index * 0.1 }}
    >
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-3xl font-bold text-blue-400 mb-2">{value}</p>
      <p className="text-gray-400 mb-4">{description}</p>
      <p className="text-xs text-gray-600">{source}</p>
    </motion.div>
  );
};

// ROICalculator - 投資対効果計算コンポーネント
const ROICalculator = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="bg-gray-900/60 backdrop-blur-md rounded-3xl border border-gray-800/50 overflow-hidden p-8"
    >
      <div className="flex items-center mb-6">
        <DollarSign size={24} className="text-yellow-500 mr-3" />
        <h3 className="text-2xl font-semibold text-white">費用対効果シミュレーション</h3>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <ul className="space-y-4">
              <li className="flex justify-between border-b border-gray-800 pb-3">
                <span className="text-gray-400">月間対応時間</span>
                <span className="text-white">1日30分 × 30日 = {PRICE_CALCULATION.hoursPerMonth}時間</span>
              </li>
              <li className="flex justify-between border-b border-gray-800 pb-3">
                <span className="text-gray-400">月間接客数 (平均)</span>
                <span className="text-white">約{PRICE_CALCULATION.monthlyResponses}件</span>
              </li>
              <li className="flex justify-between border-b border-gray-800 pb-3">
                <span className="text-gray-400">口コミ投稿率</span>
                <span className="text-white">通常の声かけよりも効果的</span>
              </li>
            </ul>
          </div>
          
          <div>
            <ul className="space-y-4">
              <li className="flex justify-between border-b border-gray-800 pb-3">
                <span className="text-gray-400">月間獲得口コミ数</span>
                <span className="text-white">約{Math.round(PRICE_CALCULATION.monthlyResponses * 0.2)}件</span>
              </li>
              <li className="flex justify-between border-b border-gray-800 pb-3">
                <span className="text-gray-400">検索順位への影響</span>
                <span className="text-white">Google公式に影響あり</span>
              </li>
              <li className="flex justify-between border-b border-gray-800 pb-3 font-medium">
                <span className="text-gray-400">集客効果</span>
                <span className="text-yellow-400">Google検索順位向上</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-800 text-center">
          <p className="text-white">
            月額<span className="text-blue-400 font-medium">{PRICE_CALCULATION.monthlyCost.toLocaleString()}円（税別）</span>で
            検索順位向上に直結する口コミを自動収集
          </p>
          <p className="text-xs text-gray-600 mt-2">※効果は業種や地域により異なります。調査データをもとに算出</p>
        </div>
      </div>
    </motion.div>
  );
};

// ================== メインコンポーネント ==================

const AppleLandingPage = () => {
  const [activeSection, setActiveSection] = useState('hero');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  // スクロール位置の監視
  useEffect(() => {
    const handleScroll = () => {
      // スクロールトップボタンの表示/非表示
      setShowScrollToTop(window.scrollY > 300);
      
      // アクティブセクションの検出
      const sections = ['hero', 'features', 'statistics', 'comparison', 'resume', 'adoption', 'glossary', 'faq'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Faqトグル
  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };
  
  // トップへスクロール
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-black text-white font-sans antialiased">
      {/* ナビゲーションバー */}
      <header className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto max-w-screen-lg px-6 py-5 flex justify-between items-center">
          <div className="flex items-center">
            <img src={ASSETS.logo} alt="クチトル" className="w-8 h-8 rounded-full object-cover mr-3" />
            <span className="font-medium text-xl">クチトル</span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#features" className={`text-sm ${activeSection === 'features' ? 'text-white' : 'text-gray-400'}`}>特徴</a>
            <a href="#statistics" className={`text-sm ${activeSection === 'statistics' ? 'text-white' : 'text-gray-400'}`}>データ</a>
            <a href="#comparison" className={`text-sm ${activeSection === 'comparison' ? 'text-white' : 'text-gray-400'}`}>比較</a>
            <a href="#adoption" className={`text-sm ${activeSection === 'adoption' ? 'text-white' : 'text-gray-400'}`}>導入方法</a>
            <a href="#glossary" className={`text-sm ${activeSection === 'glossary' ? 'text-white' : 'text-gray-400'}`}>用語集</a>
            <a href="#faq" className={`text-sm ${activeSection === 'faq' ? 'text-white' : 'text-gray-400'}`}>FAQ</a>
          </nav>
          <div className="flex items-center space-x-4">
            <a href="/login" className="text-sm text-gray-400 hover:text-white">ログイン</a>
            <Button primary={true} className="text-sm py-2 px-5" href="/register">
              無料で始める
            </Button>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section id="hero" className="w-full min-h-screen flex flex-col justify-center pt-24 pb-20 bg-black">
        <div className="container mx-auto max-w-screen-lg px-6 md:px-8">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-4">
                <GlowingText className="block">5分で始める</GlowingText>
                <GlowingText className="block">口コミ収集</GlowingText>
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-8 max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold">
                <span className="text-blue-500">約8割の消費者が口コミを参考に</span>するお店選び
              </h2>
              <p className="text-xl text-gray-400 mt-4">
                月額{PRICE_CALCULATION.monthlyCost.toLocaleString()}円（税別）で良質な口コミを自動収集
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row justify-center gap-4 mb-12"
            >
              <Button primary={true} icon={<ArrowRight size={18} />} href="/register">
                無料で始める
              </Button>
              <Button primary={false} href="/register">
                デモを見る
              </Button>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex items-center justify-center text-gray-400 text-sm"
            >
              <Clock size={16} className="mr-2" />
              <span>お店のURLを入力するだけ。5分で設定完了</span>
            </motion.div>
          </div>
          
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <img src={ASSETS.productImages.main} alt="クチトル AI接客スタッフ" className="w-full max-w-lg rounded-3xl shadow-2xl" />
          </motion.div>
        </div>
      </section>
      
      {/* 特徴セクション */}
      <ScrollableSection id="features" bgColor="bg-black">
        {(scrollYProgress) => {
          const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
          const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [60, 0, 0, -60]);
          
          return (
            <>
              <SectionTitle 
                title="なぜ口コミが集まるのか"
                subtitle="お客様の声を自然に引き出す口コミ収集専用AI"
                glowingTitle={true}
              />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                <motion.div style={{ opacity, y }}>
                  <img 
                    src={ASSETS.productImages.usage} 
                    alt="クチトル AI接客スタッフの活用シーン" 
                    className="w-full rounded-3xl shadow-2xl"
                  />
                </motion.div>
                
                <div className="space-y-6">
                  <h3 className="text-3xl font-semibold text-white mb-8">4つの強み</h3>
                  
                  {STAFF_FEATURES.map((feature, index) => (
                    <FeatureItem 
                      key={index}
                      icon={feature.icon}
                      text={feature.text}
                      benefit={feature.benefit}
                      delay={index * 0.1}
                    />
                  ))}
                  
                  <div className="mt-8 pt-8 border-t border-gray-800">
                    <p className="text-blue-400 font-medium mb-2">
                      Google検索順位に直結する口コミを自動収集
                    </p>
                    <p className="text-gray-400">
                      通常、自発的に口コミを投稿するお客様は1%以下と言われています。クチトルはお客様の声を自然に引き出し、良質な口コミを効率的に集めます。
                    </p>
                  </div>
                </div>
              </div>
            </>
          );
        }}
      </ScrollableSection>

      {/* 統計データセクション */}
      <section id="statistics" className="w-full py-20 bg-black">
        <div className="container mx-auto max-w-screen-lg px-6 md:px-8">
          <SectionTitle 
            title="口コミの影響力データ"
            subtitle="お客様の行動を左右する口コミの重要性"
            glowingTitle={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {REVIEW_STATISTICS.map((stat, index) => (
              <StatCard 
                key={index}
                index={index}
                title={stat.title}
                value={stat.value}
                description={stat.description}
                source={stat.source}
              />
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-400 max-w-3xl mx-auto">
              上記のデータが示すように、口コミはお客様の来店判断に大きな影響を与えています。良質な口コミを増やすことは、お店の集客と売上に直結するのです。
            </p>
          </div>
        </div>
      </section>
      
      {/* 比較セクション */}
      <section id="comparison" className="w-full py-20 bg-black">
        <div className="container mx-auto max-w-screen-lg px-6 md:px-8">
          <SectionTitle 
            title="人間スタッフとの比較"
            subtitle="月額5,000円で効率的に口コミを集める"
            glowingTitle={true}
          />
          
          <div className="mb-16">
            <ComparisonTable data={COMPARISON_DATA} />
          </div>
          
          <div className="mx-auto max-w-4xl">
            <ROICalculator />
          </div>
          
          <div className="mx-auto max-w-4xl mt-12 bg-gray-900/60 backdrop-blur-md rounded-3xl border border-gray-800/50 overflow-hidden p-8">
            <div className="flex items-center mb-6">
              <Star size={24} className="text-yellow-500 mr-3" />
              <h3 className="text-2xl font-semibold text-white">口コミがお店の検索順位と集客に与える影響</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-white mb-2">Google検索結果への影響</p>
                <p className="text-gray-400 text-sm">Google社の公式ヘルプでは「Googleでの口コミ数と評価もローカル検索結果のランキングに影響します」と明記されています。口コミの質と量はお店の検索順位を左右します。</p>
                <p className="text-xs text-gray-600 mt-1">※出典: Google ビジネスプロフィール ヘルプ</p>
              </div>
              
              <div>
                <p className="text-white mb-2">お客様の来店判断に直結</p>
                <p className="text-gray-400 text-sm">調査によると<span className="text-blue-400">82.6%のお客様が来店前に情報収集</span>し、来店前に口コミを確認。星評価が3以下の場合、76.4%のお客様が来店をやめるという結果も。</p>
                <p className="text-xs text-gray-600 mt-1">※出典: プロモスト調査、わいがや調査</p>
              </div>
              
              <div>
                <p className="text-white mb-2">業種別の重要度</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <p className="text-blue-400 text-lg font-bold">88%</p>
                    <p className="text-gray-400 text-sm">飲食店</p>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <p className="text-blue-400 text-lg font-bold">86%</p>
                    <p className="text-gray-400 text-sm">医療機関</p>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <p className="text-blue-400 text-lg font-bold">63%</p>
                    <p className="text-gray-400 text-sm">美容院</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">※上記は「Google口コミを参考にする」お客様の割合（出典: ヘアログ調査）</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* 履歴書セクション */}
      <section id="resume" className="w-full py-20 bg-black">
        <div className="container mx-auto max-w-screen-lg px-6 md:px-8">
          <SectionTitle 
            title="クチトルの履歴書"
            subtitle="AI接客スタッフの能力と可能性を人材の履歴書形式でご紹介します"
            glowingTitle={true}
          />
          
          <div className="mx-auto max-w-4xl">
            <ResumeCard data={RESUME_DATA} />
          </div>
        </div>
      </section>
      
      {/* 導入ステップセクション */}
      <ScrollableSection id="adoption" bgColor="bg-gradient-to-b from-black to-gray-900">
        {(scrollYProgress) => {
          const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
          const x = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [-60, 0, 0, 60]);
          
          return (
            <>
              <SectionTitle 
                title="5分で導入完了"
                subtitle="お店のURLを入力するだけ。専門知識は不要です"
                glowingTitle={true}
              />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                <div className="order-2 lg:order-1 space-y-16">
                  {ADOPTION_STEPS.map((step, index) => (
                    <AdoptionStep
                      key={index}
                      index={index}
                      title={step.title}
                      description={step.description}
                      icon={step.icon}
                      time={step.time}
                      difficulty={step.difficulty}
                    />
                  ))}
                </div>
                
                <motion.div className="order-1 lg:order-2" style={{ opacity, x }}>
                  <img 
                    src={ASSETS.productImages.interface} 
                    alt="クチトル AI接客スタッフの導入画面" 
                    className="w-full rounded-3xl shadow-2xl"
                  />
                </motion.div>
              </div>
              
              <div className="mt-20 text-center">
                <Button 
                  primary={true} 
                  icon={<ArrowRight size={18} />}
                  className="mx-auto"
                  href="/register"
                >
                  無料で始める
                </Button>
                <p className="mt-4 text-gray-400 text-sm">初期費用・導入費用0円</p>
              </div>
            </>
          );
        }}
      </ScrollableSection>

      {/* 用語集セクション */}
      <section id="glossary" className="w-full py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto max-w-screen-lg px-6 md:px-8">
          <SectionTitle 
            title="用語集"
            subtitle="よく使われる用語の簡単な説明"
            glowingTitle={true}
          />
          
          <div className="max-w-3xl mx-auto bg-gray-900/60 backdrop-blur-md rounded-3xl border border-gray-800/50 overflow-hidden p-8">
            {GLOSSARY_ITEMS.map((item, index) => (
              <GlossaryItem
                key={index}
                term={item.term}
                definition={item.definition}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* FAQ セクション */}
      <section id="faq" className="w-full py-20 bg-black">
        <div className="container mx-auto max-w-screen-lg px-6 md:px-8">
          <SectionTitle 
            title="よくあるご質問"
            subtitle="導入・活用について"
            glowingTitle={true}
          />
          
          <div className="max-w-3xl mx-auto">
            {FAQ_ITEMS.map((item, index) => (
              <FaqItem
                key={index}
                question={item.question}
                answer={item.answer}
                isOpen={openFaqIndex === index}
                toggleOpen={() => toggleFaq(index)}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA セクション */}
      <section className="w-full py-20 bg-black">
        <div className="container mx-auto max-w-screen-lg px-6 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <GlowingText>初月無料</GlowingText>
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              お店のURLを入力するだけで5分で設定完了。いつでも解約可能です。
            </p>
            <div className="mb-8">
              <Button 
                primary={true} 
                icon={<ArrowRight size={18} />}
                className="mx-auto text-lg px-10 py-5"
                href="/register"
              >
                無料で始める
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-6 text-gray-400 text-sm">
              <div className="flex items-center justify-center">
                <CreditCard size={16} className="mr-2" />
                <span>カード登録で初月無料</span>
              </div>
              <div className="flex items-center justify-center">
                <Shield size={16} className="mr-2" />
                <span>解約手続き3分</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* フッター */}
      <footer className="w-full py-12 bg-black border-t border-gray-900">
        <div className="container mx-auto max-w-screen-lg px-6 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center mb-6 md:mb-0">
              <img src={ASSETS.logo} alt="クチトル" className="w-8 h-8 rounded-full object-cover mr-3" />
              <span className="font-medium text-xl">クチトル</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3">
              <a href="#features" className="text-sm text-gray-400 hover:text-white">特徴</a>
              <a href="#statistics" className="text-sm text-gray-400 hover:text-white">データ</a>
              <a href="#comparison" className="text-sm text-gray-400 hover:text-white">比較</a>
              <a href="#adoption" className="text-sm text-gray-400 hover:text-white">導入方法</a>
              <a href="#glossary" className="text-sm text-gray-400 hover:text-white">用語集</a>
              <a href="#faq" className="text-sm text-gray-400 hover:text-white">FAQ</a>
            </nav>
          </div>
          <div className="text-center text-gray-600 text-sm">
            <p>© 2025 クチトル株式会社. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      {/* スクロールトップボタン */}
      <AnimatePresence>
        {showScrollToTop && (
          <motion.button
            className="fixed bottom-8 right-8 p-3 bg-white text-black rounded-full shadow-lg z-50"
            onClick={scrollToTop}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            aria-label="トップに戻る"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppleLandingPage;