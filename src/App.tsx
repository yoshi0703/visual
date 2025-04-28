import React, { useEffect, Suspense, lazy, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useStoreStore } from './lib/store';
import { auth, supabase, formatUser } from './lib/supabase';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from './components/ui/toaster';
import { Link } from 'react-router-dom';

// --- コンポーネント ---
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// --- Lazy Loading ---
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Interview = lazy(() => import('./pages/Interview'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EnhancedOnboarding = lazy(() => import('./pages/EnhancedOnboarding'));
const Subscription = lazy(() => import('./pages/Subscription'));
const Payment = lazy(() => import('./pages/Payment'));
const StripeCheck = lazy(() => import('./pages/StripeCheck'));
const Settings = lazy(() => import('./pages/Settings'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Recruiting = lazy(() => import('./pages/Recruiting'));
const Contact = lazy(() => import('./pages/Contact'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const CompanyInfo = lazy(() => import('./pages/CompanyInfo'));
const AboutUs = lazy(() => import('./pages/AboutUs'));

// --- Landing Pages ---
// Base Landing Page
const BaseLandingPage = lazy(() => import('./pages/BaseLandingPage'));
// Persona-specific Landing Pages
const RestaurantLanding = lazy(() => import('./pages/LandingPages/RestaurantLanding'));
const RetailLanding = lazy(() => import('./pages/LandingPages/RetailLanding'));
const ServiceLanding = lazy(() => import('./pages/LandingPages/ServiceLanding'));
const SimpleLanding = lazy(() => import('./pages/LandingPages/SimpleLanding'));
const BusyLanding = lazy(() => import('./pages/LandingPages/BusyLanding'));
// Industry-specific Landing Pages
const CafeLanding = lazy(() => import('./pages/LandingPages/CafeLanding'));
const BeautyLanding = lazy(() => import('./pages/LandingPages/BeautyLanding'));
const ClinicLanding = lazy(() => import('./pages/LandingPages/ClinicLanding'));
const ApparelLanding = lazy(() => import('./pages/LandingPages/ApparelLanding'));
// Special Pages
const CampaignPage = lazy(() => import('./pages/CampaignPage'));
const PromoPage = lazy(() => import('./pages/PromoPage'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const UseCasesPage = lazy(() => import('./pages/UseCasesPage'));
const TestimonialsPage = lazy(() => import('./pages/TestimonialsPage'));
// Homepage (Apple-style page)
const Homepage = lazy(() => import('./pages/Homepage'));

// 建設中ページのプレースホルダーコンポーネント
const UnderConstructionPage: React.FC = () => (
  <div className="container mx-auto px-4 py-12 text-center">
    <h1 className="text-3xl font-bold mb-6">🚧 準備中です 🚧</h1>
    <p className="text-lg mb-4">このページは現在開発中です。もうしばらくお待ちください。</p>
    <Link to="/" className="text-blue-600 hover:underline">ホームページに戻る</Link>
  </div>
);

// --- ローディング中のフォールバックUI ---
const LoadingFallback: React.FC = () => (
  <div className="flex justify-center items-center h-screen" role="status" aria-live="polite">
    <div className="Loader" data-text="読み込み中...">
      <span className="Loader__Circle"></span>
      <span className="Loader__Circle"></span>
      <span className="Loader__Circle"></span>
      <span className="Loader__Circle"></span>
    </div>
    <style jsx>{`
      :root {
        --loader-size: 150px;
        --text-color: #CECECE; /* Fill data-text */
        --color-one: #2979FF;
        --color-two: #FF1744;
        --color-three: #FFFF8D;
        --color-four: #B2FF59;
        --light-size: 3px;
      }

      /* █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ */

      .Loader {
        position: relative;
        width: 150px;
        width: var(--loader-size, 150px);
        min-width: 110px;
        overflow: visible;
        margin: 20px;
        border-radius: 50%;
        box-shadow: inset 0 0 8px rgba(255, 255, 255, 0.4), 0 0 25px rgba(255, 255, 255, 0.8)
      }

      .Loader::after {
        content: attr(data-text);
        color: #CECECE;
        color: var(--text-color, #CECECE);
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%,-50%);
        font-size: calc(70% + 0.10vw);
        text-transform: uppercase;
        letter-spacing: 5px;
      }

      .Loader {
        /* Keep ratio on resize*/
      }

      .Loader::before {
        content: '';
        float: left;
        padding-top: 100%;
      }

      .Loader__Circle {
        display: block;
        position: absolute;
        border-radius: 50%;
        top: 0px;
        right: 0px;
        bottom: 0px;
        left: 0px;
        opacity: 0.8;
        mix-blend-mode: screen;
        filter: brightness(120%);
        -webkit-animation-name: SpinAround;
                animation-name: SpinAround;
        -webkit-animation-iteration-count: infinite;
                animation-iteration-count: infinite;
        -webkit-animation-duration: 2s;
                animation-duration: 2s;
        -webkit-animation-fill-mode: both;
                animation-fill-mode: both;
        -webkit-animation-timing-function: linear;
                animation-timing-function: linear
      }

      .Loader__Circle:nth-of-type(1) {
        box-shadow:
          inset 1px 0 0 1px #2979FF,
          3px 0 0 3px #2979FF;
        box-shadow:
          inset 1px 0 0 1px var(--color-one, #2979FF),
          var(--light-size, 4px) 0 0 var(--light-size, 4px) var(--color-one, #2979FF);
        animation-direction: reverse;
        transform-origin: 49.6% 49.8%;
      }

      .Loader__Circle:nth-of-type(2) {
        box-shadow:
          inset 1px 0 0 1px #FF1744,
          3px 0px 0 3px #FF1744;
        box-shadow:
          inset 1px 0 0 1px var(--color-two, #FF1744),
          var(--light-size, 4px) 0px 0 var(--light-size, 4px) var(--color-two, #FF1744);
        transform-origin: 49.5% 49.8%;
      }

      .Loader__Circle:nth-of-type(3) {
        box-shadow:
          inset 1px 0 0 1px #FFFF8D,
          0 3px 0 3px #FFFF8D;
        box-shadow:
          inset 1px 0 0 1px var(--color-three, #FFFF8D),
          0 var(--light-size, 4px) 0 var(--light-size, 4px) var(--color-three, #FFFF8D);
        transform-origin: 49.8% 49.8%;
      }

      .Loader__Circle:nth-of-type(4) {
        box-shadow:
          inset 1px 0 0 1px #B2FF59,
          0 3px 0 3px #B2FF59;
        box-shadow:
          inset 1px 0 0 1px var(--color-four, #B2FF59),
          0 var(--light-size, 4px) 0 var(--light-size, 4px) var(--color-four, #B2FF59);
        transform-origin: 49.7% 49.7%;
      }

      @-webkit-keyframes SpinAround {
        0% {
          transform: rotate(0);
        }
        
        100% {
          transform: rotate(-360deg);
        }
      }

      @keyframes SpinAround {
        0% {
          transform: rotate(0);
        }
        
        100% {
          transform: rotate(-360deg);
        }
      }
    `}</style>
  </div>
);

// --- 認証必須ルート保護 ---
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const { currentStore, isLoading: isStoreLoading } = useStoreStore();
  const location = useLocation();

  if (isAuthLoading || isStoreLoading) {
    console.log("ProtectedRoute: Loading state...");
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    console.log("ProtectedRoute: Not authenticated, redirecting to login from", location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 開発環境では特殊ルートへのアクセスを許可（デバッグツール用）
  if (process.env.NODE_ENV === 'development' && location.pathname === '/stripe-check') {
    return <>{children}</>;
  }

  // ユーザー認証済みだがストアがない場合はオンボーディングへ
  if (isAuthenticated && !currentStore?.id) {
    console.log("ProtectedRoute: Authenticated but no store, redirecting to onboarding");
    return <Navigate to="/onboarding" state={{ step: 0 }} replace />;
  }

  // ユーザー認証済み、ストアあり、プラン選択なしの場合はオンボーディングプラン選択へ
  // ただし、既にオンボーディングにいる場合は何もしない
  if (isAuthenticated && currentStore?.id && !currentStore?.plan_id && !location.pathname.includes("/onboarding")) {
    console.log("ProtectedRoute: Store exists but no plan, redirecting to plan selection");
    return <Navigate to="/onboarding" state={{ step: 1 }} replace />;
  }

  console.log("ProtectedRoute: Authenticated with store, rendering children for path:", location.pathname);
  return <>{children}</>;
};

// --- 認証済みリダイレクト ---
const RedirectIfAuthenticated: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
    const { currentStore, isLoading: isStoreLoading } = useStoreStore();
    const location = useLocation();
    const navigate = useNavigate();
    
    // 現在のパスがログインまたは登録ページかどうか
    const isLoginPage = location.pathname === '/login';
    const isRegisterPage = location.pathname === '/register';
    
    useEffect(() => {
      // 認証状態の読み込みが完了し、ユーザーがログイン済みの場合
      if (!isAuthLoading && isAuthenticated) {
        // セットアップが完了しているかをチェック
        const isSetupComplete = currentStore && 
          currentStore.plan_id && 
          currentStore.description && 
          currentStore.welcome_message && 
          currentStore.qr_code_url;

        // ログインページまたは登録ページの場合はダッシュボードにリダイレクト
        if (isLoginPage || isRegisterPage) {
          console.log("RedirectIfAuthenticated: Already authenticated, redirecting to dashboard from auth page");
          navigate('/dashboard', { replace: true });
        }
        // セットアップが完了していて、オンボーディングページにいる場合はダッシュボードにリダイレクト
        else if (isSetupComplete && location.pathname === '/onboarding') {
          console.log("RedirectIfAuthenticated: Setup already complete, redirecting to dashboard from onboarding");
          navigate('/dashboard', { replace: true });
        }
      }
    }, [isAuthLoading, isAuthenticated, currentStore, navigate, location.pathname, isLoginPage, isRegisterPage]);
    
    if (isAuthLoading || isStoreLoading) {
        return <LoadingFallback />;
    }
    
    // ログイン済みかつログインまたは登録ページなら表示しない
    if (isAuthenticated && (isLoginPage || isRegisterPage)) {
        return null; // useEffectによりリダイレクト処理されるので、一時的にnullを返す
    }
    
    return <>{children}</>;
};

// フッターの表示を制御するコンポーネント
const FooterController: React.FC = () => {
  const location = useLocation();
  
  // インタビューページではフッターを表示しない
  const isInterviewPage = location.pathname.startsWith('/interview/');
  
  if (isInterviewPage) {
    return null;
  }
  
  return <Footer />;
};

// --- メインアプリケーションコンポーネント ---
const App: React.FC = () => {
  const { user, setUser, setLoading: setAuthLoading, isLoading: isAuthLoading } = useAuthStore();
  const { currentStore, setStore, setLoading: setStoreLoading, resetStore } = useStoreStore();

  // --- ストア取得・更新関数 ---
  const fetchAndSetStore = useCallback(async (userId: string | undefined) => {
    if (typeof userId !== 'string' || userId.length === 0) {
        console.log("[App fetchAndSetStore] Invalid userId, resetting store.");
        setStore(null);
        setStoreLoading(false);
        return;
    }
    console.log("[App fetchAndSetStore] Fetching store for user:", userId);
    setStoreLoading(true);
    try {
      // Get store data with a short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout
      
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', userId)
          .maybeSingle();
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error("[App fetchAndSetStore] Error fetching store:", error);
          setStore(null);
        } else {
          console.log("[App fetchAndSetStore] Store data fetched:", data ? data.id : 'Not Found');
          setStore(data);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.error("[App fetchAndSetStore] Fetch timeout - Supabase request took too long");
          setStore(null);
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
        console.error("[App fetchAndSetStore] Unexpected error:", error);
        setStore(null);
    } finally {
      setStoreLoading(false);
    }
  }, [setStore, setStoreLoading]);


  // --- 認証状態の初期化と監視 ---
  useEffect(() => {
    console.log("[App useEffect] Initializing auth state...");
    setAuthLoading(true);
    // 追加: 認証状態をクリアしてから初期化
    setUser(null);
    resetStore();
    // 1. 初回マウント時に現在のユーザー情報を取得
    auth.getCurrentUser()
      .then(({ user: initialUser, error: getUserError }) => {
        if (getUserError) {
            // Session Missing はエラー扱いしない
            if (getUserError.message === 'Auth session missing!') {
                 console.log("[App useEffect] No initial session found.");
                 setUser(null);
                 resetStore();
            } else {
                 console.error("[App useEffect] Error getting initial user:", getUserError);
                 setUser(null);
                 resetStore();
            }
        } else if (initialUser?.id) { // user が存在し、id も有効な場合
          console.log("[App useEffect] Initial user found:", initialUser.id);
          setUser(initialUser);
          fetchAndSetStore(initialUser.id); // ストア情報取得
        } else {
          // ユーザーがいない場合 (正常系)
          console.log("[App useEffect] No initial user found (normal).");
          setUser(null);
          resetStore();
        }
      })
      .catch(error => {
          console.error("[App useEffect] Unexpected error during getCurrentUser promise:", error);
          setUser(null);
          resetStore();
      })
      .finally(() => {
          setAuthLoading(false);
          console.log("[App useEffect] Auth initialization complete.");
      });
    // 2. 認証状態の変化を監視
    const { data: authListener } = auth.onAuthStateChange((event, session) => {
      console.log(`[App onAuthStateChange] Event: ${event}`);
      const supabaseUser = session?.user ?? null;
      const changedUser = formatUser(supabaseUser);
      
      // 重要な修正: ユーザー情報が変更されたときのみsetUserを呼び出す
      if (event === 'SIGNED_IN' && changedUser?.id) {
        console.log("[App onAuthStateChange] User signed in:", changedUser.id);
        setUser(changedUser);
        fetchAndSetStore(changedUser.id);
      } else if (event === 'SIGNED_OUT') {
        console.log("[App onAuthStateChange] User signed out.");
        setUser(null);
        resetStore();
      }
    });
    // クリーンアップ
    return () => {
      console.log("[App useEffect Cleanup] Unsubscribing auth listener.");
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchAndSetStore, resetStore, setUser, setAuthLoading]);


  // --- ローディング表示 ---
  if (isAuthLoading) {
    return <LoadingFallback />;
  }

  // --- ルーティング ---
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow pt-16 bg-white text-black"> {/* Navbarの高さを考慮 */}
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* 公開ルート */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
                <Route path="/register" element={<RedirectIfAuthenticated><Register /></RedirectIfAuthenticated>} />
                
                {/* 新規ページ - About Us */}
                <Route path="/about" element={<AboutUs />} />
                
                {/* マーケティング・ランディングページ関連 - 新規追加 */}
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/lp" element={<LandingPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/use-cases" element={<UseCasesPage />} />
                <Route path="/testimonials" element={<TestimonialsPage />} />
                <Route path="/homepage" element={<Homepage />} />
                
                {/* ペルソナ特化型ランディングページ */}
                <Route path="/landing/restaurant" element={<RestaurantLanding />} />
                <Route path="/landing/retail" element={<RetailLanding />} />
                <Route path="/landing/service" element={<ServiceLanding />} />
                <Route path="/landing/simple" element={<SimpleLanding />} />
                <Route path="/landing/busy" element={<BusyLanding />} />
                
                {/* 業種別詳細ランディングページ */}
                <Route path="/landing/cafe" element={<CafeLanding />} />
                <Route path="/landing/beauty" element={<BeautyLanding />} />
                <Route path="/landing/clinic" element={<ClinicLanding />} />
                <Route path="/landing/apparel" element={<ApparelLanding />} />
                
                {/* 特殊ページ */}
                <Route path="/campaign/:campaignId" element={<CampaignPage />} />
                <Route path="/promo/:promoCode" element={<PromoPage />} />
                
                {/* 採用ページ・情報ページ - 認証不要でアクセス可能 */}
                <Route path="/recruiting" element={<Recruiting />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/company" element={<CompanyInfo />} />
                
                {/* ヘルプ・サポート関連 - 新規追加 */}
                <Route path="/help" element={<UnderConstructionPage />} />
                <Route path="/help/faq" element={<UnderConstructionPage />} />
                <Route path="/help/guides" element={<UnderConstructionPage />} />
                <Route path="/help/contact" element={<UnderConstructionPage />} />
                
                {/* インタビューページ - 認証不要でアクセス可能 */}
                <Route path="/interview/:interviewId" element={<Interview />} />

                {/* オンボーディングルート - アカウント設定が完了したらダッシュボードにリダイレクト */}
                <Route 
                  path="/onboarding" 
                  element={
                    <RedirectIfAuthenticated>
                      <EnhancedOnboarding />
                    </RedirectIfAuthenticated>
                  } 
                />
                
                {/* 認証必須ルート */}
                <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/dashboard/interviews" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/dashboard/analytics" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/dashboard/qrcode" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                <Route path="/payment/:id" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                <Route path="/payment/success" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                <Route path="/payment/cancel" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                
                {/* デバッグツール */}
                <Route path="/stripe-check" element={<ProtectedRoute><StripeCheck /></ProtectedRoute>} />
                <Route path="/check-stripe" element={<Navigate to="/stripe-check" replace />} />

                {/* 404 */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </main>
          <FooterController />
          <Toaster />
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;