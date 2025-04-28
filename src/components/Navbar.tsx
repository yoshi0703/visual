import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore, useStoreStore } from "../lib/store";
import { Home, MessageCircle, QrCode, LogOut, User, CreditCard, Menu, X, Settings, Briefcase, Mail, FileText, Shield, Info } from "lucide-react";

const Navbar: React.FC = () => {
  const { isAuthenticated, user, resetAuth } = useAuthStore();
  const { currentStore } = useStoreStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // インタビュー画面かどうか
  const isInterviewPage = location.pathname.startsWith("/interview/");

  // ログインページか登録ページにいるかどうか
  const isAuthPage = 
    location.pathname === "/login" || 
    location.pathname === "/register";

  // 認証が必要なページかどうか
  const isAuthRequired = 
    location.pathname.startsWith("/dashboard") || 
    location.pathname.startsWith("/onboarding") ||
    location.pathname.startsWith("/subscription");

  // ログアウト処理
  const handleLogout = () => {
    resetAuth();
    navigate("/");
  };

  // Get username safely, handling any possible object types
  const getUserName = (): string => {
    if (!user?.name) {
      return "ユーザー";
    }
    
    // Handle case where name is an object
    if (typeof user.name === 'object' && user.name !== null) {
      // Try various possible keys that might contain the name
      if ('store_name' in user.name && typeof user.name.store_name === 'string') {
        return user.name.store_name;
      }
      if ('data' in user.name && typeof user.name.data === 'string') {
        return user.name.data;
      }
      if ('name' in user.name && typeof user.name.name === 'string') {
        return user.name.name;
      }
      
      // If no known key is found, return default
      console.warn("Unexpected user.name structure:", user.name);
      return "ユーザー";
    }
    
    // If it's a string (normal case) or any other non-null type, stringify it
    return String(user.name);
  };

  // インタビュー画面では表示しない
  if (isInterviewPage) {
    return null;
  }

  // 未認証状態でナビゲーションを表示しない場合
  if (!isAuthenticated && isAuthRequired) {
    return null;
  }

  // 認証済みで認証ページにいる場合はダッシュボードにリダイレクト
  if (isAuthenticated && isAuthPage) {
    navigate("/dashboard");
    return null;
  }

  // 認証済みユーザー用のナビゲーション
  if (isAuthenticated) {
    return (
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-blue-600 font-bold text-xl">
                  クチトル
                </Link>
              </div>
              {/* デスクトップ向けナビゲーションメニュー */}
              <div className="hidden md:ml-6 md:flex md:space-x-4">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/dashboard' ? 
                    'border-blue-500 text-gray-900' : 
                    'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Home className="mr-1 h-4 w-4" />
                  ダッシュボード
                </Link>
                <Link
                  to="/subscription"
                  className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/subscription' ? 
                    'border-blue-500 text-gray-900' : 
                    'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="mr-1 h-4 w-4" />
                  サブスクリプション
                </Link>
                <Link
                  to="/settings"
                  className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/settings' ? 
                    'border-blue-500 text-gray-900' : 
                    'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Settings className="mr-1 h-4 w-4" />
                  設定
                </Link>
                <Link
                  to="/about"
                  className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/about' ? 
                    'border-blue-500 text-gray-900' : 
                    'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Info className="mr-1 h-4 w-4" />
                  About Us
                </Link>
              </div>
            </div>
            <div className="hidden md:ml-6 md:flex md:items-center">
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">{getUserName()}</span>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center text-gray-500 hover:text-gray-700"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* モバイルメニューボタン */}
            <div className="flex items-center md:hidden">
              <button 
                className="p-2 rounded-md text-gray-400 hover:text-gray-500"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">メニューを開く</span>
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* モバイルメニュー */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <Link
                to="/dashboard"
                className={`block pl-3 pr-4 py-2 border-l-4 ${
                  location.pathname === '/dashboard' ?
                  'border-blue-500 text-blue-700 bg-blue-50' :
                  'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <Home className="mr-2 h-5 w-5" />
                  ダッシュボード
                </div>
              </Link>
              <Link
                to="/subscription"
                className={`block pl-3 pr-4 py-2 border-l-4 ${
                  location.pathname === '/subscription' ?
                  'border-blue-500 text-blue-700 bg-blue-50' :
                  'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  サブスクリプション
                </div>
              </Link>
              <Link
                to="/settings"
                className={`block pl-3 pr-4 py-2 border-l-4 ${
                  location.pathname === '/settings' ?
                  'border-blue-500 text-blue-700 bg-blue-50' :
                  'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  設定
                </div>
              </Link>
              <Link
                to="/about"
                className={`block pl-3 pr-4 py-2 border-l-4 ${
                  location.pathname === '/about' ?
                  'border-blue-500 text-blue-700 bg-blue-50' :
                  'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <Info className="mr-2 h-5 w-5" />
                  About Us
                </div>
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 w-full text-left"
              >
                <div className="flex items-center">
                  <LogOut className="mr-2 h-5 w-5" />
                  ログアウト
                </div>
              </button>
            </div>
          </div>
        )}
      </header>
    );
  }

  // 未認証ユーザー用のシンプルなナビゲーション
  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-blue-600 font-bold text-xl">
                クチトル
              </Link>
            </div>
            {/* デスクトップ向けナビゲーションリンク */}
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              <Link
                to="/landing"
                className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium ${
                  location.pathname === '/landing' ? 
                  'border-blue-500 text-gray-900' : 
                  'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ランディングページ
              </Link>
              <Link
                to="/features"
                className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium ${
                  location.pathname === '/features' ? 
                  'border-blue-500 text-gray-900' : 
                  'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                機能
              </Link>
              <Link
                to="/pricing"
                className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium ${
                  location.pathname === '/pricing' ? 
                  'border-blue-500 text-gray-900' : 
                  'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                料金プラン
              </Link>
              <Link
                to="/contact"
                className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium ${
                  location.pathname === '/contact' ? 
                  'border-blue-500 text-gray-900' : 
                  'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Mail className="mr-1 h-4 w-4" />
                お問い合わせ
              </Link>
              <Link
                to="/about"
                className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium ${
                  location.pathname === '/about' ? 
                  'border-blue-500 text-gray-900' : 
                  'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Info className="mr-1 h-4 w-4" />
                About Us
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center">
            <Link 
              to="/login" 
              className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              ログイン
            </Link>
            <Link 
              to="/register" 
              className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              新規登録
            </Link>
          </div>
          
          {/* モバイルメニューボタン */}
          <div className="flex items-center md:hidden">
            <button 
              className="p-2 rounded-md text-gray-400 hover:text-gray-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">メニューを開く</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* モバイルメニュー */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/landing"
              className={`block pl-3 pr-4 py-2 border-l-4 ${
                location.pathname === '/landing' ?
                'border-blue-500 text-blue-700 bg-blue-50' :
                'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              } text-base font-medium`}
              onClick={() => setMobileMenuOpen(false)}
            >
              ランディングページ
            </Link>
            <Link
              to="/features"
              className={`block pl-3 pr-4 py-2 border-l-4 ${
                location.pathname === '/features' ?
                'border-blue-500 text-blue-700 bg-blue-50' :
                'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              } text-base font-medium`}
              onClick={() => setMobileMenuOpen(false)}
            >
              機能
            </Link>
            <Link
              to="/pricing"
              className={`block pl-3 pr-4 py-2 border-l-4 ${
                location.pathname === '/pricing' ?
                'border-blue-500 text-blue-700 bg-blue-50' :
                'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              } text-base font-medium`}
              onClick={() => setMobileMenuOpen(false)}
            >
              料金プラン
            </Link>
            <Link
              to="/contact"
              className={`block pl-3 pr-4 py-2 border-l-4 ${
                location.pathname === '/contact' ?
                'border-blue-500 text-blue-700 bg-blue-50' :
                'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              } text-base font-medium`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                お問い合わせ
              </div>
            </Link>
            <Link
              to="/about"
              className={`block pl-3 pr-4 py-2 border-l-4 ${
                location.pathname === '/about' ?
                'border-blue-500 text-blue-700 bg-blue-50' :
                'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              } text-base font-medium`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center">
                <Info className="mr-2 h-5 w-5" />
                About Us
              </div>
            </Link>
            <Link
              to="/login"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              ログイン
            </Link>
            <Link
              to="/register"
              className="block pl-3 pr-4 py-2 border-l-4 border-blue-500 text-base font-medium text-blue-700 bg-blue-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              新規登録
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;