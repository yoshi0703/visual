import React, { useState } from 'react';
import { 
  ArrowRight, 
  Phone, 
  Mail, 
  MessageCircle, 
  Check, 
  Clock, 
  HelpCircle,
  ChevronRight,
  User,
  Building,
  FileText
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
  
  // フォーム要素
  input: "w-full bg-white/70 backdrop-blur-xl border border-white/50 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent transition-all",
  textarea: "w-full bg-white/70 backdrop-blur-xl border border-white/50 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent transition-all resize-none",
  select: "w-full bg-white/70 backdrop-blur-xl border border-white/50 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent transition-all appearance-none",
  label: "block text-gray-700 font-medium mb-2",
  checkbox: "h-5 w-5 rounded-md border-gray-300 text-sky-600 focus:ring-sky-300 mr-2",
};

// コンタクトページコンポーネント
const ContactPage = () => {
  const navigate = useNavigate();
  
  // フォームの状態
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    inquiryType: '',
    message: '',
    agreeToPrivacyPolicy: false
  });
  
  // フォーム送信状態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState('form'); // 'form' または 'faq'
  
  // フォーム入力ハンドラ
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormState({
      ...formState,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // フォーム送信ハンドラ
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // フォーム送信をシミュレート
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // フォームリセット
      setFormState({
        name: '',
        email: '',
        phone: '',
        company: '',
        inquiryType: '',
        message: '',
        agreeToPrivacyPolicy: false
      });
      
      // 3秒後にサクセスメッセージを非表示
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
      
    }, 1500);
  };
  
  // FAQデータ
  const faqItems = [
    {
      question: "クチトルはどのようなサービスですか？",
      answer: "クチトルは店舗の口コミを簡単に集めるためのサービスです。お店に設置したQRコードをお客様がスマホで読み取り、簡単な質問に答えるだけで、AIが自然な口コミを作成します。ITの知識がなくても、わずか5分で始められます。"
    },
    {
      question: "料金プランについて教えてください",
      answer: "現在、「お試しプラン（30日間無料）」、「個人店プラン（月額5,000円）」、「プレミアムプラン（月額30,000円～）」の3つをご用意しています。お試しプラン終了後も自動更新はされませんので、ご安心ください。"
    },
    {
      question: "パソコンが苦手でも使えますか？",
      answer: "はい、すべての操作はスマートフォンだけで完結できます。「おばあちゃんでも使える」をモットーに開発しており、IT知識がなくても簡単に始められます。操作で困った場合は、お電話でサポートいたします。"
    },
    {
      question: "導入までの流れを教えてください",
      answer: "① 会員登録（名前・メールアドレスの入力）→ ② お店の情報入力 → ③ 自動生成されたQRコードを設置 → ④ お客様の声を集め始める、という流れです。最短5分で完了します。"
    },
    {
      question: "解約方法を教えてください",
      answer: "マイページの「アカウント設定」から簡単に解約手続きができます。解約金は一切かかりません。また、お電話での解約手続きも受け付けております。"
    }
  ];
  
  return (
    <div className={visionStyles.container}>
      {/* 背景要素 */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-100 rounded-full filter blur-3xl opacity-70"></div>
      <div className="absolute top-40 -left-24 w-80 h-80 bg-blue-100 rounded-full filter blur-3xl opacity-70"></div>
      
      {/* ヘッダーセクション */}
      <section className={`${visionStyles.section} pt-20 pb-12`}>
        <div className={visionStyles.contentContainer}>
          <div className="text-center mb-8">
            <span className={visionStyles.badge}>
              いつでもお気軽にご連絡ください
            </span>
          </div>
          
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 tracking-tight leading-tight">
              <span className={visionStyles.gradientText}>
                お問い合わせ
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-10 max-w-3xl mx-auto">
              クチトルについてのご質問や導入のご相談、お見積りなど、なんでもお気軽にご連絡ください。
              専任スタッフが丁寧にご案内いたします。
            </p>
          </div>
          
          {/* タブ切り替え */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-white/50 backdrop-blur-xl p-1 rounded-full border border-white/30 flex w-full md:w-2/3 mx-auto">
              <button
                className={`flex-1 py-3 px-6 rounded-full transition-all ${activeTab === 'form' 
                  ? 'bg-white shadow-md text-gray-800' 
                  : 'text-gray-600 hover:bg-white/50'}`}
                onClick={() => setActiveTab('form')}
              >
                お問い合わせフォーム
              </button>
              <button
                className={`flex-1 py-3 px-6 rounded-full transition-all ${activeTab === 'faq' 
                  ? 'bg-white shadow-md text-gray-800' 
                  : 'text-gray-600 hover:bg-white/50'}`}
                onClick={() => setActiveTab('faq')}
              >
                よくある質問
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* メインコンテンツセクション */}
      <section className={visionStyles.sectionAlt + " pt-0"}>
        <div className={visionStyles.contentContainer}>
          {/* フォームコンテンツ */}
          {activeTab === 'form' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* 左側: 問い合わせフォーム */}
              <div className="md:col-span-2">
                <div className={`${visionStyles.glassPanel} p-8 group`}>
                  <div className={visionStyles.innerGlow}></div>
                  
                  {isSubmitted ? (
                    // 送信完了メッセージ
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-800">お問い合わせを受け付けました</h3>
                      <p className="text-gray-600 mb-8">
                        ご入力いただいたメールアドレス宛に、受付確認メールをお送りしました。<br />
                        通常1営業日以内にご返信いたします。
                      </p>
                      <button 
                        className={visionStyles.buttonPrimary}
                        onClick={() => navigate('/')}
                      >
                        トップページに戻る
                      </button>
                    </div>
                  ) : (
                    // 問い合わせフォーム
                    <form onSubmit={handleSubmit}>
                      <h2 className="text-2xl font-bold mb-6 text-gray-800">お問い合わせフォーム</h2>
                      <p className="text-gray-600 mb-8">必要事項をご入力の上、「送信する」ボタンをクリックしてください。</p>
                      
                      <div className="space-y-6">
                        {/* 名前 */}
                        <div>
                          <label htmlFor="name" className={visionStyles.label}>
                            お名前 <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                              <User size={18} />
                            </span>
                            <input
                              type="text"
                              id="name"
                              name="name"
                              value={formState.name}
                              onChange={handleInputChange}
                              required
                              className={visionStyles.input + " pl-10"}
                              placeholder="山田 太郎"
                            />
                          </div>
                        </div>
                        
                        {/* メールアドレス */}
                        <div>
                          <label htmlFor="email" className={visionStyles.label}>
                            メールアドレス <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                              <Mail size={18} />
                            </span>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formState.email}
                              onChange={handleInputChange}
                              required
                              className={visionStyles.input + " pl-10"}
                              placeholder="example@email.com"
                            />
                          </div>
                        </div>
                        
                        {/* 電話番号 */}
                        <div>
                          <label htmlFor="phone" className={visionStyles.label}>
                            電話番号（任意）
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                              <Phone size={18} />
                            </span>
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              value={formState.phone}
                              onChange={handleInputChange}
                              className={visionStyles.input + " pl-10"}
                              placeholder="03-1234-5678"
                            />
                          </div>
                        </div>
                        
                        {/* 会社名 */}
                        <div>
                          <label htmlFor="company" className={visionStyles.label}>
                            会社名・店舗名（任意）
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                              <Building size={18} />
                            </span>
                            <input
                              type="text"
                              id="company"
                              name="company"
                              value={formState.company}
                              onChange={handleInputChange}
                              className={visionStyles.input + " pl-10"}
                              placeholder="〇〇食堂"
                            />
                          </div>
                        </div>
                        
                        {/* お問い合わせ種類 */}
                        <div>
                          <label htmlFor="inquiryType" className={visionStyles.label}>
                            お問い合わせ内容 <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                              <FileText size={18} />
                            </span>
                            <select
                              id="inquiryType"
                              name="inquiryType"
                              value={formState.inquiryType}
                              onChange={handleInputChange}
                              required
                              className={visionStyles.select + " pl-10"}
                            >
                              <option value="">お問い合わせの種類を選択してください</option>
                              <option value="service">サービスについて</option>
                              <option value="price">料金・お見積りについて</option>
                              <option value="trial">無料トライアルについて</option>
                              <option value="technical">技術的な質問</option>
                              <option value="support">サポートについて</option>
                              <option value="other">その他</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                              <ChevronRight size={16} className="rotate-90" />
                            </div>
                          </div>
                        </div>
                        
                        {/* メッセージ */}
                        <div>
                          <label htmlFor="message" className={visionStyles.label}>
                            メッセージ <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-4 text-gray-400">
                              <MessageCircle size={18} />
                            </span>
                            <textarea
                              id="message"
                              name="message"
                              value={formState.message}
                              onChange={handleInputChange}
                              required
                              rows="5"
                              className={visionStyles.textarea + " pl-10"}
                              placeholder="ご質問やご要望をご記入ください"
                            ></textarea>
                          </div>
                        </div>
                        
                        {/* プライバシーポリシー同意 */}
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            id="agreeToPrivacyPolicy"
                            name="agreeToPrivacyPolicy"
                            checked={formState.agreeToPrivacyPolicy}
                            onChange={handleInputChange}
                            required
                            className={visionStyles.checkbox}
                          />
                          <label htmlFor="agreeToPrivacyPolicy" className="text-sm text-gray-600">
                            <span className="text-red-500 mr-1">*</span>
                            <a href="/privacy-policy" className="text-sky-600 hover:underline">プライバシーポリシー</a>に同意します
                          </label>
                        </div>
                        
                        {/* 送信ボタン */}
                        <div className="pt-4">
                          <button
                            type="submit"
                            className={visionStyles.buttonPrimary + " w-full"}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                送信中...
                              </>
                            ) : (
                              <>
                                送信する
                                <ArrowRight className="ml-2 h-5 w-5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>
              
              {/* 右側: お問い合わせ情報 */}
              <div>
                <div className="space-y-6">
                  {/* サポート情報 */}
                  <div className={`${visionStyles.glassPanel} p-6 group ${visionStyles.cardHover}`}>
                    <div className={visionStyles.innerGlow}></div>
                    <h3 className="text-xl font-bold mb-4 text-gray-800">お電話でのお問い合わせ</h3>
                    <div className="flex items-center mb-3">
                      <div className="p-3 bg-sky-50/80 rounded-xl backdrop-blur-sm mr-4">
                        <Phone className="h-6 w-6 text-sky-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-800">03-1234-5678</p>
                        <p className="text-sm text-gray-600">平日 9:00〜18:00</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      操作方法や導入についてのご質問は、お電話でも丁寧にご案内いたします。
                      「パソコンが苦手」という方も、お気軽にご相談ください。
                    </p>
                  </div>
                  
                  {/* メールでのお問い合わせ */}
                  <div className={`${visionStyles.glassPanel} p-6 group ${visionStyles.cardHover}`}>
                    <div className={visionStyles.innerGlow}></div>
                    <h3 className="text-xl font-bold mb-4 text-gray-800">メールでのお問い合わせ</h3>
                    <div className="flex items-center mb-3">
                      <div className="p-3 bg-indigo-50/80 rounded-xl backdrop-blur-sm mr-4">
                        <Mail className="h-6 w-6 text-indigo-600" />
                      </div>
                      <p className="text-lg font-bold text-gray-800">info@kuchitoru.com</p>
                    </div>
                    <p className="text-sm text-gray-600">
                      24時間いつでも受け付けております。通常1営業日以内にご返信いたします。
                    </p>
                  </div>
                  
                  {/* 営業時間 */}
                  <div className={`${visionStyles.glassPanel} p-6 group ${visionStyles.cardHover}`}>
                    <div className={visionStyles.innerGlow}></div>
                    <h3 className="text-xl font-bold mb-4 text-gray-800">営業時間</h3>
                    <div className="flex items-center mb-3">
                      <div className="p-3 bg-emerald-50/80 rounded-xl backdrop-blur-sm mr-4">
                        <Clock className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-800">平日 9:00〜18:00</p>
                        <p className="text-sm text-gray-600">土日祝日 休業</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* FAQコンテンツ */}
          {activeTab === 'faq' && (
            <div className="max-w-3xl mx-auto">
              <div className={`${visionStyles.glassPanel} p-8 group`}>
                <div className={visionStyles.innerGlow}></div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">よくある質問</h2>
                <p className="text-gray-600 mb-8">
                  クチトルに関するよくあるご質問をまとめました。
                  ご不明点がございましたら、お問い合わせフォームよりご連絡ください。
                </p>
                
                {/* FAQ項目 */}
                <div className="space-y-4">
                  {faqItems.map((item, index) => (
                    <details 
                      key={index} 
                      className="group bg-white/50 backdrop-blur-sm rounded-xl overflow-hidden border border-white/40 [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer">
                        <div className="flex items-start gap-4">
                          <div className="p-1.5 bg-sky-50/80 rounded-lg backdrop-blur-sm flex-shrink-0">
                            <HelpCircle className="h-5 w-5 text-sky-600" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900">{item.question}</h3>
                        </div>
                        <span className="relative flex-shrink-0 ml-1.5 w-5 h-5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-5 h-5 opacity-100 group-open:opacity-0 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-5 h-5 opacity-0 group-open:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                          </svg>
                        </span>
                      </summary>
                      <div className="px-5 pb-5 pt-2 text-gray-600">{item.answer}</div>
                    </details>
                  ))}
                </div>
                
                {/* フォームへの誘導 */}
                <div className="mt-8 p-6 bg-gradient-to-r from-sky-50 to-indigo-50 rounded-xl text-center">
                  <h3 className="text-xl font-bold mb-3 text-gray-800">質問が見つかりませんでしたか？</h3>
                  <p className="text-gray-600 mb-5">
                    お気軽にお問い合わせフォームよりご連絡ください。
                    専任スタッフが丁寧にお答えいたします。
                  </p>
                  <button 
                    className={visionStyles.buttonPrimary}
                    onClick={() => setActiveTab('form')}
                  >
                    お問い合わせフォームへ
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* 資料請求CTA */}
      <section className={visionStyles.sectionDark}>
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white to-transparent"></div>
        <div className={visionStyles.contentContainer + " relative z-10 text-center"}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">まずは詳しい資料をご覧ください</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            クチトルの詳しい機能や料金プラン、導入事例をまとめた資料をお送りします。
          </p>
          {/* CTA ボタン */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-xl mx-auto">
            <button
              onClick={() => navigate('/register', { state: { from: 'contact' } })}
              className="w-full sm:w-auto px-8 py-4 bg-white text-sky-600 rounded-full font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              資料をダウンロードする
            </button>
            <button
              onClick={() => navigate('/register', { state: { step: 0 } })}
              className="w-full sm:w-auto px-8 py-4 bg-blue-500 bg-opacity-30 text-white rounded-full font-medium text-lg border border-white border-opacity-30 hover:bg-opacity-40 transition-all hover:shadow-lg hover:-translate-y-1"
            >
              無料でお試しを始める
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;