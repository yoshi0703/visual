import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  
  // 特殊エフェクト
  glassPanel: "bg-white/60 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(255,255,255,0.3)] relative group",
  innerGlow: "absolute inset-0 bg-gradient-to-tr from-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none",
  layeredCard: "relative group",
  layeredCardBg: "absolute -inset-0.5 bg-gradient-to-r from-sky-300/10 to-indigo-300/10 rounded-3xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500",
  
  // ボタン無効状態
  buttonDisabled: "opacity-60 cursor-not-allowed pointer-events-none",
};

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (!email) {
      errors.email = 'メールアドレスを入力してください';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = '有効なメールアドレスを入力してください';
      isValid = false;
    }

    if (!password) {
      errors.password = 'パスワードを入力してください';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'パスワードは6文字以上で入力してください';
      isValid = false;
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'パスワードが一致しません';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Supabaseで新規ユーザー登録
      const { user: newUser, error: signUpError } = await auth.signUp(
        email, 
        password,
        storeName || email.split('@')[0] // ストア名が未入力の場合はメールアドレスの@前の部分を使用
      );
      
      if (signUpError) {
        throw signUpError;
      }
      
      if (!newUser) {
        throw new Error('ユーザーの作成に失敗しました');
      }
      
      // 認証ストアを更新
      setUser({
        id: newUser.id,
        email: newUser.email || '',
        name: storeName || email.split('@')[0],
        created_at: newUser.created_at
      });
      
      // オンボーディングのプラン選択ステップへ
      navigate('/onboarding', { state: { step: 0 }, replace: true });
      
    } catch (err: any) {
      console.error('Registration error:', err);
      
      if (err.message && err.message.includes('email already')) {
        setError('このメールアドレスは既に登録されています');
      } else {
        setError(err.message || '新規登録に失敗しました');
      }
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
            新規アカウント登録
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            既にアカウントをお持ちの方は{' '}
            <a href="/login" className="font-medium text-sky-600 hover:text-sky-500 transition-colors">
              ログイン
            </a>
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
                <h3 className={visionStyles.cardTitle}>アカウント情報</h3>
                <p className={visionStyles.cardDescription}>クチトルを始めるためにアカウントを作成してください</p>
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
                    <label htmlFor="storeName" className="font-medium text-gray-700 mb-1 block">
                      店舗名（後で変更可能）
                    </label>
                    <input 
                      id="storeName"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="例: 和食処さくら"
                      className={visionStyles.input}
                    />
                    {formErrors.storeName && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.storeName}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="font-medium text-gray-700 mb-1 block">
                      メールアドレス
                    </label>
                    <input 
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="メールアドレスを入力"
                      className={visionStyles.input + (formErrors.email ? " border-red-300 focus:border-red-300 focus:ring-red-200/50" : "")}
                    />
                    {formErrors.email && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="password" className="font-medium text-gray-700 mb-1 block">
                      パスワード
                    </label>
                    <div className="relative">
                      <input 
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="パスワードを入力（6文字以上）"
                        className={visionStyles.input + " pr-10" + (formErrors.password ? " border-red-300 focus:border-red-300 focus:ring-red-200/50" : "")}
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
                    {formErrors.password && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="font-medium text-gray-700 mb-1 block">
                      パスワード（確認）
                    </label>
                    <div className="relative">
                      <input 
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="同じパスワードを入力"
                        className={visionStyles.input + " pr-10" + (formErrors.confirmPassword ? " border-red-300 focus:border-red-300 focus:ring-red-200/50" : "")}
                      />
                      <button 
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {formErrors.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.confirmPassword}</p>
                    )}
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
                        登録中...
                      </>
                    ) : (
                      '登録する'
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

export default Register;