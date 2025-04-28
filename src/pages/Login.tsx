import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { auth } from '../lib/supabase';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

// 背景イメージのURL
const BLURRED_BG_IMAGE = "https://ramune-material.com/wp-content/uploads/2022/06/simple-gradation_120-940x529.png";

// Apple VisionOS風の洗練されたスタイルヘルパーオブジェクト
const visionStyles = {
  // コンテナスタイル
  container: "relative min-h-screen",
  bgImageContainer: "absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed z-0",
  contentContainer: "relative z-10 max-w-3xl mx-auto px-4 pt-8 pb-12",
  
  // カードスタイル - ガラス効果強化
  card: "bg-white/60 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(255,255,255,0.3)] overflow-hidden relative",
  cardGlow: "absolute -inset-1 bg-gradient-to-r from-sky-100/20 to-indigo-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl rounded-[32px]",
  cardHeader: "p-6 border-b border-gray-100/30",
  cardTitle: "text-xl font-medium bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent",
  cardDescription: "mt-1 text-gray-600",
  cardContent: "p-6",
  cardFooter: "p-6 border-t border-gray-100/30 flex justify-between",
  
  // ボタンスタイル - Apple風の洗練された配色
  buttonPrimary: "bg-gradient-to-r from-sky-400 to-indigo-400 text-white rounded-full shadow-[0_4px_12px_rgba(100,150,255,0.15)] hover:shadow-[0_8px_20px_rgba(100,150,255,0.25)] transition-all hover:-translate-y-0.5 px-6 py-2.5 font-medium flex items-center justify-center",
  buttonSecondary: "bg-white/70 backdrop-blur-xl border border-white/40 text-gray-700 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 px-6 py-2.5 flex items-center justify-center",
  buttonOutline: "bg-white/50 backdrop-blur-xl border border-white/40 text-gray-600 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 px-6 py-2.5 flex items-center justify-center",
  
  // フォーム要素スタイル - より洗練された見た目
  input: "bg-white/70 backdrop-blur-xl border border-white/50 rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.02)] focus:ring-2 focus:ring-sky-200/50 transition-all px-4 py-2.5 w-full",
  checkbox: "h-4 w-4 rounded border-white/50 bg-white/70 text-sky-500 focus:ring-2 focus:ring-sky-200/50 transition-all",
  
  // 特殊エフェクト
  glassPanel: "bg-white/60 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(255,255,255,0.3)] relative group",
  innerGlow: "absolute inset-0 bg-gradient-to-tr from-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none",
  layeredCard: "relative group",
  layeredCardBg: "absolute -inset-0.5 bg-gradient-to-r from-sky-300/10 to-indigo-300/10 rounded-3xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500",
  
  // ボタン無効状態
  buttonDisabled: "opacity-60 cursor-not-allowed pointer-events-none",
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { user, session, error } = await auth.signIn(email, password);
      
      if (error) {
        throw error;
      }
      
      if (user) {
        setUser({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || '',
          created_at: user.created_at || new Date().toISOString(),
        });
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={visionStyles.container}>
      {/* 背景画像 */}
      <div className={visionStyles.bgImageContainer} style={{ backgroundImage: `url(${BLURRED_BG_IMAGE})` }} />
      
      <div className="relative z-10 min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
            アカウントにログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            アカウントをお持ちでない場合は{' '}
            <Link to="/register" className="font-medium text-sky-600 hover:text-sky-500 transition-colors">
              新規登録
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className={visionStyles.layeredCard}>
            {/* 外側の光彩効果 */}
            <div className={visionStyles.layeredCardBg}></div>
            
            {/* メインカード */}
            <div className={visionStyles.glassPanel + " group"}>
              <div className={visionStyles.innerGlow}></div>
              
              <div className={visionStyles.cardHeader}>
                <h3 className={visionStyles.cardTitle}>ログイン情報</h3>
                <p className={visionStyles.cardDescription}>アカウント情報を入力してください</p>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className={visionStyles.cardContent + " space-y-4"}>
                  {error && (
                    <div className="bg-red-50/80 backdrop-blur-xl border border-red-100/50 rounded-xl p-4 flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-red-800">エラー</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="font-medium text-gray-700 mb-1 block">
                      メールアドレス
                    </label>
                    <input 
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="メールアドレスを入力"
                      className={visionStyles.input}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="password" className="font-medium text-gray-700 mb-1 block">
                      パスワード
                    </label>
                    <div className="relative">
                      <input 
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="パスワードを入力"
                        className={visionStyles.input + " pr-10"}
                      />
                      <button 
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember_me"
                        name="remember_me"
                        type="checkbox"
                        className={visionStyles.checkbox}
                      />
                      <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-700">
                        ログイン状態を保持
                      </label>
                    </div>

                    <div className="text-sm">
                      <a href="#" className="font-medium text-sky-600 hover:text-sky-500 transition-colors">
                        パスワードを忘れた場合
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className={visionStyles.cardFooter + " justify-center"}>
                  <button 
                    type="submit" 
                    className={visionStyles.buttonPrimary + " w-full" + (isLoading ? " " + visionStyles.buttonDisabled : "")} 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ログイン中...
                      </>
                    ) : (
                      'ログイン'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;