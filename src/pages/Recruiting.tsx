import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaSmile, 
  FaGrinBeam, 
  FaGrinStars, 
  FaComment, 
  FaBars,
  FaComments, 
  FaStar, 
  FaChartLine, 
  FaQrcode, 
  FaGift, 
  FaChartPie,
  FaBatteryFull, 
  FaTshirt, 
  FaCalendarAlt, 
  FaHandHoldingUsd, 
  FaLaptop,
  FaChevronDown, 
  FaTwitter, 
  FaFacebookF, 
  FaInstagram
} from 'react-icons/fa';

const Recruiting = () => {
  // States
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [interviewProgress, setInterviewProgress] = useState(0);
  const [showStamp, setShowStamp] = useState(false);
  const [avatar, setAvatar] = useState('normal');
  
  // Refs
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const conditionsRef = useRef(null);
  const faqRef = useRef(null);
  const performanceRef = useRef(null);
  const ctaRef = useRef(null);
  
  // Handle interview progress
  const proceedInterview = () => {
    const newProgress = interviewProgress + 25;
    
    if (newProgress >= 100) {
      setInterviewProgress(100);
      setShowStamp(true);
      // Scroll to CTA after completion
      if (ctaRef.current) {
        setTimeout(() => {
          ctaRef.current.scrollIntoView({ behavior: 'smooth' });
        }, 1000);
      }
    } else {
      setInterviewProgress(newProgress);
    }
  };
  
  // Handle accordion toggle
  const toggleAccordion = (index) => {
    if (activeAccordion === index) {
      setActiveAccordion(null);
    } else {
      setActiveAccordion(index);
    }
  };
  
  // Handle avatar expression
  const handleAvatarEnter = () => setAvatar('happy');
  const handleAvatarLeave = () => setAvatar('normal');
  const handleAvatarClick = () => {
    setAvatar('excited');
    setTimeout(() => setAvatar('normal'), 1000);
  };

  // Scroll animations
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      // Add animations based on scroll position if needed
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // FAQ data
  const faqItems = [
    {
      question: '本当にAIで接客できるの？',
      answer: 'はい、最新のAI技術を活用した自然な会話でお客様の声を集めます。テキストベースのチャットなので、お客様は気軽に本音を話しやすく、実際の接客よりも率直な意見が集まることもあります。クチトルの会話は、お店の特徴を踏まえた質問ができるよう事前に設定できます。'
    },
    {
      question: 'どうやって口コミを増やせるの？',
      answer: 'クチトルがお客様と会話した内容をもとに、自動で口コミ文を生成します。お客様は生成された文章を確認し、ワンタップでGoogleマップの口コミ投稿画面に移動できます。口コミ投稿のハードルを下げることで、自然と投稿数が増えていきます。もちろん、投稿は任意であり、お客様の判断に委ねられます。'
    },
    {
      question: 'うちのお店に合うかな？',
      answer: '飲食店、美容室、小売店、サービス業など様々な業種で活躍しています。お客様との会話内容やクーポン特典などはお店の特性に合わせてカスタマイズできますので、どのような業種でも効果的にご利用いただけます。特に「リピーターを増やしたい」「口コミ評価を高めたい」というニーズをお持ちのお店に最適です。'
    },
    {
      question: '導入は難しくない？',
      answer: 'とても簡単です。お店のホームページURLを入力するだけで、AIが自動的に店舗情報を分析し、最適な設定を提案します。あとはQRコードを印刷して店内に設置するだけで完了です。ITやプログラミングの知識は一切不要で、スマホだけでも設定できます。サポートチームが丁寧にご案内しますので、ご安心ください。'
    },
    {
      question: '費用はどれくらい？',
      answer: '月額2,980円（税込）からご利用いただけます。人件費と比較すると非常にリーズナブルな価格設定です。また、初月は無料でお試しいただけますので、効果を確認してから継続するかご判断いただけます。プランによって機能や分析レポートの詳細さが異なりますので、詳しくは料金プランをご確認ください。'
    }
  ];

  // Feature cards data
  const featureCards = [
    {
      icon: <FaComments className="text-white text-2xl" />,
      title: '自然な会話',
      description: 'AIを活用した自然な会話でお客様の本音を引き出します。お客様は人と話しているような感覚で感想を伝えられます。'
    },
    {
      icon: <FaStar className="text-white text-2xl" />,
      title: '口コミ投稿促進',
      description: '会話内容から自動で口コミ文を生成し、お客様のGoogle口コミ投稿を手助けします。お客様の手間を最小限に抑えます。'
    },
    {
      icon: <FaChartLine className="text-white text-2xl" />,
      title: '声の分析',
      description: '集めたお客様の声を分析し、評価の傾向や改善点を可視化。お店の強みや課題が一目でわかります。'
    },
    {
      icon: <FaQrcode className="text-white text-2xl" />,
      title: '簡単設置',
      description: 'QRコードを店内に設置するだけで導入完了。お客様がスマホで読み取るとクチトルとの会話が始まります。'
    },
    {
      icon: <FaGift className="text-white text-2xl" />,
      title: '特典付与',
      description: 'アンケート回答者に特典クーポンを自動発行。お客様の回答意欲を高め、再来店も促進します。'
    },
    {
      icon: <FaChartPie className="text-white text-2xl" />,
      title: 'ダッシュボード',
      description: '集まった声はすべてオンラインダッシュボードで確認可能。いつでもどこでもスマホから確認できます。'
    }
  ];

  // Working conditions data
  const workingConditions = [
    {
      icon: <FaBatteryFull className="text-cyan-500 text-3xl" />,
      label: '休憩',
      description: '必要ありません（電源とネット環境だけあればOK）'
    },
    {
      icon: <FaQrcode className="text-cyan-500 text-3xl" />,
      label: '出勤方法',
      description: 'QRコードを設置するだけで完了（通勤不要）'
    },
    {
      icon: <FaTshirt className="text-cyan-500 text-3xl" />,
      label: '制服',
      description: 'お店のイメージに合わせてカスタマイズ可能'
    },
    {
      icon: <FaCalendarAlt className="text-cyan-500 text-3xl" />,
      label: '勤務時間',
      description: '24時間365日（シフト調整不要）'
    },
    {
      icon: <FaHandHoldingUsd className="text-cyan-500 text-3xl" />,
      label: '給与',
      description: '月額固定（残業代、社会保険不要）'
    },
    {
      icon: <FaLaptop className="text-cyan-500 text-3xl" />,
      label: '研修',
      description: '不要（導入後すぐに活躍できます）'
    }
  ];

  // Testimonials data
  const testimonials = [
    {
      content: 'クチトルを導入して2ヶ月で口コミ数が3倍に増えました。お客様がQRコードを読み取って気軽に感想を伝えられるのが良いようです。特に若いお客様からの反応が良く、SNSでも話題になっています。',
      name: '鈴木様',
      role: '和食レストラン経営'
    },
    {
      content: '最初は半信半疑でしたが、クチトルがお客様から引き出す感想が非常に具体的で役立ちます。スタッフの接客について率直な意見が集まるようになり、サービス改善に直結しています。',
      name: '田中様',
      role: '美容室オーナー'
    },
    {
      content: 'GoogleマップでのPRが思うようにいかず悩んでいたところ、クチトルのおかげでサクサク口コミが集まるようになりました。星評価も4.2から4.7に上がり、新規のお客様も増えています。',
      name: '佐藤様',
      role: 'カフェ経営'
    }
  ];

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center text-2xl font-bold text-indigo-600">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                <path d="M13.25 8.75C13.25 7.64543 12.3546 6.75 11.25 6.75C10.1454 6.75 9.25 7.64543 9.25 8.75C9.25 9.85457 10.1454 10.75 11.25 10.75C12.3546 10.75 13.25 9.85457 13.25 8.75ZM9.06 10.44L8.04 16.04C7.89 16.81 8.46 17.44 9.24 17.3C11.57 16.83 14.03 16.8 16.36 17.3C17.13 17.45 17.71 16.81 17.56 16.04L16.1 8.06C15.95 7.28 15.1 6.89 14.5 7.38L12.5 9C12.2 9.24 11.8 9.24 11.5 9L9.5 7.38C8.9 6.89 8.06 7.28 7.91 8.06L7.87 8.25C7.96 8.05 8.11 7.88 8.29 7.75L10.29 6.13C10.68 5.82 11.32 5.82 11.71 6.13L13.71 7.75C13.89 7.88 14.04 8.06 14.14 8.27L14.11 8.06L15.57 16.04C15.71 16.81 15.13 17.45 14.36 17.3C12.04 16.8 9.57 16.83 7.24 17.3C6.47 17.44 5.89 16.81 6.04 16.04L7.06 10.44H9M6 7.45C6 6.364 4.99 5.56 3.89 6.05C2.02 6.92 0.81 8.6 0.25 10.5C0.09 11.1 0.8 11.59 1.26 11.16C1.787 10.685 2.453 10.39 3.16 10.32C4.15 10.22 5 11 5 12V17.35C5 18.47 6.02 19.4 17.18 19.39C21.03 19.39 23 18.42 23 15.43V11C23 9.9 21.97 9.03 20.9 9.15C20.07 9.23 19.44 9.78 19.1 10.48C18.95 10.75 18.92 11.09 19 11.42V14.09L18.96 14.93C18.95 15.07 18.98 15.25 19.11 15.38C19.23 15.51 19.4 15.54 19.55 15.54H20.6C20.85 15.54 21.05 15.33 21.05 15.07V12C21.05 10.99 19.98 10.09 18.87 10.47C16.97 11.11 17.64 14.05 15.37 14.06C14.82 14.07 14.26 14.05 13.67 14C11.95 13.87 10.33 13.87 8.62 14C6.96 14.13 6.96 11.83 5.51 10.96C5.01 10.66 4.18 10.67 3.9 11.24C3.68 11.7 4.06 12.69 4.54 12.98C4.86 13.19 5.35 13.15 5.65 12.92L6.78 12.06C7.06 11.85 7.45 11.92 7.63 12.2C7.81 14.4 7.85 14.58 7.85 15.07C7.85 15.34 8.05 15.54 8.31 15.54H9.31C9.57 15.54 9.77 15.34 9.76 15.07L9.75 13.88C9.75 13.67 9.82 13.48 9.96 13.34C10.09 13.21 10.28 13.14 10.49 13.14C11.17 13.14 16.4 13.12 17.88 13.12L17.83 13.15C18.04 13.15 18.23 13.22 18.36 13.35C18.5 13.49 18.57 13.67 18.57 13.88V15.07C18.57 15.34 18.77 15.54 19.04 15.54H20.07C20.34 15.54 20.54 15.34 20.53 15.07V14M6 10.2C5.58 9.78 4.86 9.78 4.45 10.2C4.18 10.47 4.08 10.85 4.15 11.2L6.4 11.15C6.32 10.81 6.23 10.47 6 10.2M19.2 6C19.2 4.89 18.31 4 87.2 4C16.09 4 15.2 4.9 15.2 6C15.2 7.1E6.09 8 17.2 8C18.31 8 19.2 7.1 19.2 6ZM5.656 6C5.656 5.44772 6.10372 5 6.656 5C7.20828 5 7.656 5.44772 7.656 6V7C7.656 7.55229 7.20828 8 6.656 8C6.10372 8 5.656 7.55229 5.656 7V6Z" fill="#4f46e5"/>
              </svg>
              クチトル
            </div>
            <nav className="hidden md:block">
              <ul className="flex space-x-8">
                <li><a href="#features" className="text-gray-600 hover:text-indigo-600 font-medium">できること</a></li>
                <li><a href="#conditions" className="text-gray-600 hover:text-indigo-600 font-medium">勤務条件</a></li>
                <li><a href="#faq" className="text-gray-600 hover:text-indigo-600 font-medium">面接質問</a></li>
                <li><a href="#performance" className="text-gray-600 hover:text-indigo-600 font-medium">現場実績</a></li>
              </ul>
            </nav>
            <div className="md:hidden">
              <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-700 text-2xl">
                <FaBars />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed top-16 left-0 right-0 bg-white shadow-md md:hidden z-40">
          <ul className="flex flex-col">
            <li><a href="#features" onClick={() => setMenuOpen(false)} className="block py-3 px-4 text-gray-700 hover:bg-gray-100 border-b border-gray-100">できること</a></li>
            <li><a href="#conditions" onClick={() => setMenuOpen(false)} className="block py-3 px-4 text-gray-700 hover:bg-gray-100 border-b border-gray-100">勤務条件</a></li>
            <li><a href="#faq" onClick={() => setMenuOpen(false)} className="block py-3 px-4 text-gray-700 hover:bg-gray-100 border-b border-gray-100">面接質問</a></li>
            <li><a href="#performance" onClick={() => setMenuOpen(false)} className="block py-3 px-4 text-gray-700 hover:bg-gray-100">現場実績</a></li>
          </ul>
        </div>
      )}

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative min-h-screen pt-20 flex items-center bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=2070&auto=format&fit=crop')" }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gray-900 bg-opacity-70"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center text-white">
          {/* Interactive Avatar */}
          <div 
            className="mx-auto relative w-48 h-48 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 flex items-center justify-center mb-8 shadow-xl cursor-pointer overflow-hidden"
            onMouseEnter={handleAvatarEnter}
            onMouseLeave={handleAvatarLeave}
            onClick={handleAvatarClick}
          >
            {/* Avatar faces */}
            <div className={`absolute inset-0 flex items-center justify-center text-6xl transition-opacity duration-300 ${avatar === 'normal' ? 'opacity-100' : 'opacity-0'}`}>
              <FaSmile className="text-white" />
            </div>
            <div className={`absolute inset-0 flex items-center justify-center text-6xl transition-opacity duration-300 ${avatar === 'happy' ? 'opacity-100' : 'opacity-0'}`}>
              <FaGrinBeam className="text-white" />
            </div>
            <div className={`absolute inset-0 flex items-center justify-center text-6xl transition-opacity duration-300 ${avatar === 'excited' ? 'opacity-100' : 'opacity-0'}`}>
              <FaGrinStars className="text-white" />
            </div>
            
            {/* Status badge */}
            <div className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
              <FaComment className="text-white text-xl" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-100 animate-fade-in">
            「初めまして、クチトル です。あなたのお店の新しい仲間になりたいです！」
          </h1>
          <p className="text-xl md:text-2xl mb-2 max-w-2xl mx-auto animate-fade-in-delay-1">
            24時間働ける、疲れ知らずの口コミ収集スタッフ、採用面接中
          </p>
          <p className="text-sm text-gray-300 mb-8 animate-fade-in-delay-2">
            ※クチトルはAIを活用した口コミ収集サービスです
          </p>
          
          <a href="#interview-sheet" className="inline-block bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 animate-fade-in-delay-3">
            面接を始める
          </a>
        </div>
      </section>

      {/* Interview Sheet Section */}
      <section id="interview-sheet" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 relative overflow-hidden max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div>
                <span className="inline-block bg-blue-50 text-indigo-600 px-3 py-1 rounded text-lg font-medium mb-2">採用面接シート</span>
                <h2 className="text-3xl font-bold text-gray-800">クチトル</h2>
              </div>
            </div>
            
            {/* Stamp */}
            <div className={`absolute top-8 right-8 w-28 h-28 border-4 border-red-500 rounded-full flex items-center justify-center text-red-500 font-bold text-xl transform rotate-12 transition-opacity duration-500 ${showStamp ? 'opacity-100' : 'opacity-0'}`}>
              採用
            </div>
            
            {/* Sheet items */}
            <div className="space-y-6 mb-8">
              <div className="flex flex-col md:flex-row">
                <div className="font-bold w-full md:w-32 text-gray-700">名前：</div>
                <div className="text-gray-600">クチトル (Kuchitoru)</div>
              </div>
              
              <div className="flex flex-col md:flex-row">
                <div className="font-bold w-full md:w-32 text-gray-700">タイプ：</div>
                <div className="text-gray-600">AI接客アシスタント</div>
              </div>
              
              <div className="flex flex-col md:flex-row">
                <div className="font-bold w-full md:w-32 text-gray-700">得意なこと：</div>
                <div className="text-gray-600">お客様との自然な会話、本音の引き出し、口コミの生成と投稿促進</div>
              </div>
              
              <div className="flex flex-col md:flex-row">
                <div className="font-bold w-full md:w-32 text-gray-700">活躍できる場所：</div>
                <div className="text-gray-600">飲食店、小売店、美容室、サービス業など</div>
              </div>
              
              <div className="flex flex-col md:flex-row">
                <div className="font-bold w-full md:w-32 text-gray-700">勤務可能時間：</div>
                <div className="text-gray-600">24時間365日</div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="bg-gray-200 h-2 rounded-full overflow-hidden mb-6">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${interviewProgress}%` }}
              ></div>
            </div>
            
            <button 
              onClick={proceedInterview}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition shadow-md hover:shadow-lg w-full md:w-auto"
            >
              {interviewProgress < 100 ? '面接を進める' : '採用決定！'}
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 inline-block relative">
              クチトルができること
              <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full -mb-1"></span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureCards.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center mb-4 shadow-md">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Working Conditions Section */}
      <section id="conditions" ref={conditionsRef} className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 inline-block relative">
              クチトルの勤務条件
              <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full -mb-1"></span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {workingConditions.map((condition, index) => (
              <div 
                key={index} 
                className="bg-gray-50 rounded-xl p-6 text-center"
              >
                <div className="flex justify-center mb-4">
                  {condition.icon}
                </div>
                <div className="font-bold text-lg text-gray-800 mb-2">{condition.label}</div>
                <p className="text-gray-600 text-sm">{condition.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center text-xs text-gray-500 bg-gray-100 p-4 rounded-lg max-w-3xl mx-auto">
            ※このページの「面接」「採用」などの表現はユーモアであり、クチトルはAIを活用した口コミ収集・分析サービスです。
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" ref={faqRef} className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 inline-block relative">
              面接官からの質問
              <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full -mb-1"></span>
            </h2>
          </div>
          
          <div className="max-w-3xl mx-auto">
            {faqItems.map((item, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden"
              >
                <div 
                  className="flex justify-between items-center p-5 cursor-pointer"
                  onClick={() => toggleAccordion(index)}
                >
                  <h3 className="font-bold text-gray-800">{item.question}</h3>
                  <FaChevronDown className={`text-gray-500 transition-transform ${activeAccordion === index ? 'transform rotate-180' : ''}`} />
                </div>
                
                <div className={`px-5 pb-5 transition-all duration-300 ${activeAccordion === index ? 'block' : 'hidden'}`}>
                  <p className="text-gray-600">{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="performance" ref={performanceRef} className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 inline-block relative">
              現場での実績
              <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full -mb-1"></span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-gray-50 rounded-xl p-6 shadow-sm"
              >
                <div className="relative">
                  <div className="absolute -top-2 -left-2 text-6xl text-indigo-200 opacity-20">"</div>
                  <p className="relative z-10 text-gray-600 mb-4">{testimonial.content}</p>
                </div>
                
                <div className="mt-4">
                  <div className="font-bold text-gray-800">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-10 text-center text-xs text-gray-500 bg-gray-100 p-4 rounded-lg max-w-3xl mx-auto">
            ※掲載している実績は実際のユーザー様の声に基づいています。効果には個人差があります。
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" ref={ctaRef} className="py-20 bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">クチトルを採用しますか？</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">QRコードを置くだけで、お客様の声を集め、口コミを増やす新しいスタッフ</p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/signup" className="bg-white text-indigo-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition">
              即採用する（無料トライアル）
            </Link>
            <Link to="/download" className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-bold py-3 px-8 rounded-full transition">
              資料をダウンロード
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center text-xl font-bold mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <path d="M13.25 8.75C13.25 7.64543 12.3546 6.75 11.25 6.75C10.1454 6.75 9.25 7.64543 9.25 8.75C9.25 9.85457 10.1454 10.75 11.25 10.75C12.3546 10.75 13.25 9.85457 13.25 8.75ZM9.06 10.44L8.04 16.04C7.89 16.81 8.46 17.44 9.24 17.3C11.57 16.83 14.03 16.8 16.36 17.3C17.13 17.45 17.71 16.81 17.56 16.04L16.1 8.06C15.95 7.28 15.1 6.89 14.5 7.38L12.5 9C12.2 9.24 11.8 9.24 11.5 9L9.5 7.38C8.9 6.89 8.06 7.28 7.91 8.06L7.87 8.25C7.96 8.05 8.11 7.88 8.29 7.75L10.29 6.13C10.68 5.82 11.32 5.82 11.71 6.13L13.71 7.75C13.89 7.88 14.04 8.06 14.14 8.27L14.11 8.06L15.57 16.04C15.71 16.81 15.13 17.45 14.36 17.3C12.04 16.8 9.57 16.83 7.24 17.3C6.47 17.44 5.89 16.81 6.04 16.04L7.06 10.44H9M6 7.45C6 6.364 4.99 5.56 3.89 6.05C2.02 6.92 0.81 8.6 0.25 10.5C0.09 11.1 0.8 11.59 1.26 11.16C1.787 10.685 2.453 10.39 3.16 10.32C4.15 10.22 5 11 5 12V17.35C5 18.47 6.02 19.4 17.18 19.39C21.03 19.39 23 18.42 23 15.43V11C23 9.9 21.97 9.03 20.9 9.15C20.07 9.23 19.44 9.78 19.1 10.48C18.95 10.75 18.92 11.09 19 11.42V14.09L18.96 14.93C18.95 15.07 18.98 15.25 19.11 15.38C19.23 15.51 19.4 15.54 19.55 15.54H20.6C20.85 15.54 21.05 15.33 21.05 15.07V12C21.05 10.99 19.98 10.09 18.87 10.47C16.97 11.11 17.64 14.05 15.37 14.06C14.82 14.07 14.26 14.05 13.67 14C11.95 13.87 10.33 13.87 8.62 14C6.96 14.13 6.96 11.83 5.51 10.96C5.01 10.66 4.18 10.67 3.9 11.24C3.68 11.7 4.06 12.69 4.54 12.98C4.86 13.19 5.35 13.15 5.65 12.92L6.78 12.06C7.06 11.85 7.45 11.92 7.63 12.2C7.81 14.4 7.85 14.58 7.85 15.07C7.85 15.34 8.05 15.54 8.31 15.54H9.31C9.57 15.54 9.77 15.34 9.76 15.07L9.75 13.88C9.75 13.67 9.82 13.48 9.96 13.34C10.09 13.21 10.28 13.14 10.49 13.14C11.17 13.14 16.4 13.12 17.88 13.12L17.83 13.15C18.04 13.15 18.23 13.22 18.36 13.35C18.5 13.49 18.57 13.67 18.57 13.88V15.07C18.57 15.34 18.77 15.54 19.04 15.54H20.07C20.34 15.54 20.54 15.34 20.53 15.07V14M6 10.2C5.58 9.78 4.86 9.78 4.45 10.2C4.18 10.47 4.08 10.85 4.15 11.2L6.4 11.15C6.32 10.81 6.23 10.47 6 10.2M19.2 6C19.2 4.89 18.31 4 87.2 4C16.09 4 15.2 4.9 15.2 6C15.2 7.1E6.09 8 17.2 8C18.31 8 19.2 7.1 19.2 6ZM5.656 6C5.656 5.44772 6.10372 5 6.656 5C7.20828 5 7.656 5.44772 7.656 6V7C7.656 7.55229 7.20828 8 6.656 8C6.10372 8 5.656 7.55229 5.656 7V6Z" fill="white"/>
                </svg>
                クチトル
              </div>
              <p className="text-gray-400 mb-4">お客様の声を集め、口コミを増やす<br />新世代AIアシスタント</p>
              
              <div className="flex space-x-4">
                <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition">
                  <FaTwitter className="text-white" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition">
                  <FaFacebookF className="text-white" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition">
                  <FaInstagram className="text-white" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">サービス</h3>
              <ul className="space-y-2">
                <li><Link to="/features" className="text-gray-400 hover:text-white">機能紹介</Link></li>
                <li><Link to="/pricing" className="text-gray-400 hover:text-white">料金プラン</Link></li>
                <li><Link to="/case-studies" className="text-gray-400 hover:text-white">導入事例</Link></li>
                <li><Link to="/faq" className="text-gray-400 hover:text-white">よくある質問</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">サポート</h3>
              <ul className="space-y-2">
                <li><Link to="/help" className="text-gray-400 hover:text-white">ヘルプセンター</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white">お問い合わせ</Link></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-white">利用規約</Link></li>
                <li><Link to="/privacy" className="text-gray-400 hover:text-white">プライバシーポリシー</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">会社情報</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-white">会社概要</Link></li>
                <li><Link to="/blog" className="text-gray-400 hover:text-white">ブログ</Link></li>
                <li><Link to="/careers" className="text-gray-400 hover:text-white">採用情報</Link></li>
                <li><Link to="/partners" className="text-gray-400 hover:text-white">パートナー募集</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-6 text-center text-gray-500 text-sm">
            &copy; 2025 クチトル All Rights Reserved.
          </div>
        </div>
      </footer>

      {/* Global CSS */}
      <style jsx global>{`
        /* Animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        .animate-fade-in-delay-1 {
          animation: fadeIn 0.6s ease-out 0.1s forwards;
          opacity: 0;
          transform: translateY(20px);
        }
        
        .animate-fade-in-delay-2 {
          animation: fadeIn 0.6s ease-out 0.2s forwards;
          opacity: 0;
          transform: translateY(20px);
        }
        
        .animate-fade-in-delay-3 {
          animation: fadeIn 0.6s ease-out 0.3s forwards;
          opacity: 0;
          transform: translateY(20px);
        }
      `}</style>
    </>
  );
};

export default Recruiting;