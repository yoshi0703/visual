import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useStoreStore } from '../lib/store';
import { usePlanSelection, useWebsiteAnalysis, useQRCodeGeneration } from '../hooks';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase, stores } from '@/lib/supabase';
import OnboardingPlanSelection from './OnboardingPlanSelection';
import { 
  CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Loader2, 
  Download, MessageCircle, Ticket, Sparkles, Store, QrCode
} from 'lucide-react';
import PaymentSuccessNotification from '@/components/PaymentSuccessNotification';
import { toast } from '@/components/ui/use-toast';
import { verifyCheckoutSession } from '@/lib/stripe';

// 背景イメージのURL
const BLURRED_BG_IMAGE = "https://ramune-material.com/wp-content/uploads/2022/06/simple-gradation_120-940x529.png";

// AIの会話スタイルのサンプル
const aiToneExamples = {
  friendly: {
    welcome: 'こんにちは！今日はご来店ありがとうございます😊 お店の雰囲気や料理はいかがでしたか？感想を教えていただけると嬉しいです！',
    response: 'なるほど、素敵な体験をされたようですね！他にも印象に残ったことはありますか？例えば、接客や雰囲気など、何でも教えてくださいね！'
  },
  formal: {
    welcome: 'お世話になっております。本日はご来店いただき誠にありがとうございます。店内の雰囲気やお料理の味など、ご感想をお聞かせいただければ幸いです。',
    response: '貴重なご意見をありがとうございます。他にも何かお気づきの点がございましたら、ぜひお聞かせくださいませ。'
  },
  casual: {
    welcome: 'やぁ、今日は来てくれてありがとう！お店の感想を聞かせてくれるかな？何でも気軽に話してね～',
    response: 'そっか～それはよかった！他にも気になったことあったら、なんでも教えてね！'
  }
};

const EnhancedOnboarding = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const { currentStore, setStore, isLoading: isStoreLoading } = useStoreStore();

  const stepFromUrlParams = new URLSearchParams(location.search).get('step');
  const stepFromState = location.state?.step;
  const [activeStep, setActiveStep] = useState(
    stepFromUrlParams ? parseInt(stepFromUrlParams, 10) : 
    stepFromState !== undefined ? stepFromState : 0
  );
  
  const [progress, setProgress] = useState(0);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutCancelled, setCheckoutCancelled] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showThankYouMessage, setShowThankYouMessage] = useState(false);
  const [hasPaidPlan, setHasPaidPlan] = useState(false);
  const isNavigatingRef = useRef(false);
  const [maxVisitedStep, setMaxVisitedStep] = useState(0);
  
  const [isStoreSubmitting, setIsStoreSubmitting] = useState(false);
  const [storeSubmitError, setStoreSubmitError] = useState(null);
  const [storeFormValues, setStoreFormValues] = useState({
    name: currentStore?.name || '',
    description: currentStore?.description || '',
    location: currentStore?.location || '',
    industry: currentStore?.industry || '',
    features: currentStore?.features?.join(', ') || '',
    google_place_id: currentStore?.google_place_id || ''
  });

  const [isChatSubmitting, setIsChatSubmitting] = useState(false);
  const [chatSubmitError, setChatSubmitError] = useState(null);
  const [chatFormValues, setChatFormValues] = useState({
    ai_tone: currentStore?.ai_tone || 'friendly',
    welcome_message: currentStore?.welcome_message || 'こんにちは！本日はご利用いただきありがとうございます。お店の感想を教えていただけると嬉しいです。',
    thanks_message: currentStore?.thanks_message || 'ご回答ありがとうございました！いただいたフィードバックを今後のサービス向上に活かしてまいります。'
  });
  
  const [previewTab, setPreviewTab] = useState('welcome');

  const [isCouponSubmitting, setIsCouponSubmitting] = useState(false);
  const [couponSubmitError, setCouponSubmitError] = useState(null);
  const [couponFormValues, setCouponFormValues] = useState({
    coupon_type: currentStore?.coupon_type || null,
    coupon_value: currentStore?.coupon_value?.toString() || '',
    coupon_free_item_desc: currentStore?.coupon_free_item_desc || ''
  });
  
  const [successPlanId, setSuccessPlanId] = useState(null);
  
  const { 
    selectedPlan,
    setSelectedPlan,
    handleSubscriptionSuccess
  } = usePlanSelection();

  // ウェブサイト分析機能のカスタムフック
  const {
    websiteUrl,
    setWebsiteUrl,
    isLoading: isWebsiteLoading,
    error: websiteError,
    setError: setWebsiteError,
    success: websiteSuccess,
    isSiteAnalyzed,
    analyzedData,
    handleAnalyzeWebsite
  } = useWebsiteAnalysis({
    // 分析成功時のコールバック - 分析結果をフォームに自動反映
    onSuccess: (data) => {
      if (data) {
        // フォームの値を分析結果で更新
        const newFormValues = {
          ...storeFormValues
        };
        
        if (data.name) {
          newFormValues.name = data.name;
        }
        
        if (data.description) {
          newFormValues.description = data.description;
        }
        
        if (data.location) {
          newFormValues.location = data.location;
        }
        
        if (data.features && Array.isArray(data.features)) {
          newFormValues.features = data.features.join(', ');
        }
        
        // フォーム値を更新
        setStoreFormValues(newFormValues);
        
        // 成功メッセージを表示
        toast({
          title: "分析完了",
          description: "ウェブサイトの情報をフォームに反映しました",
        });
      }
    }
  });

  const {
    qrCodeUrl,
    isLoading: isQrLoading,
    error: qrError,
    success: qrSuccess,
    handleGenerateQRCode,
    handleDownloadQRCode
  } = useQRCodeGeneration();
  
  // スタッフ採用の文脈に変更したステップ定義
  const [steps, setSteps] = useState([
    { id: 0, title: 'ようこそ', description: 'クチトルの採用', isCompleted: false, isActive: activeStep === 0 },
    { id: 1, title: '勤務条件', description: 'プランの選択', isCompleted: !!currentStore?.plan_id, isActive: activeStep === 1 },
    { id: 2, title: '職場紹介', description: 'お店の情報', isCompleted: !!currentStore?.description, isActive: activeStep === 2 },
    { id: 3, title: '接客方法', description: '話し方の設定', isCompleted: !!currentStore?.welcome_message, isActive: activeStep === 3 },
    { id: 4, title: '受付設置', description: 'QRコードの作成', isCompleted: !!currentStore?.qr_code_url, isActive: activeStep === 4 },
    { id: 5, title: '出勤開始', description: '準備完了', isCompleted: false, isActive: activeStep === 5 },
  ]);
  
  // Early redirect check for completed onboarding
  // Note: This is now handled in the main useEffect hook
  
  useEffect(() => {
    if (currentStore?.plan_id) {
      setHasPaidPlan(true);
    } else if (currentStore) { 
      setHasPaidPlan(false);
    }
  }, [currentStore]);
  
  useEffect(() => {
    // アクティブステップに基づいてmaxVisitedStepを更新
    if (activeStep > maxVisitedStep) {
      setMaxVisitedStep(activeStep);
    }
  }, [activeStep, maxVisitedStep]);

  useEffect(() => {
    if (hasPaidPlan && (activeStep === 0 || activeStep === 1)) {
      if (!isNavigatingRef.current) {
        isNavigatingRef.current = true;
        setActiveStep(2);
        navigate('/onboarding?step=2', { replace: true });
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 200);
      }
    }
  }, [activeStep, hasPaidPlan, navigate]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const stepParam = queryParams.get('step');
    
    if (stepParam !== null) {
      const newStep = parseInt(stepParam, 10);
      
      if (newStep >= 0 && newStep <= 5) {
        // Paid plan users should not be able to navigate back to step 0 or 1 manually
        if (hasPaidPlan && (newStep === 0 || newStep === 1)) {
          if (activeStep !== 2 && !isNavigatingRef.current) {
             isNavigatingRef.current = true;
             setActiveStep(2);
             navigate('/onboarding?step=2', { replace: true });
             setTimeout(() => {
               isNavigatingRef.current = false;
             }, 200);
          }
        } else if (newStep !== activeStep && !isNavigatingRef.current) {
          setActiveStep(newStep);
          if (newStep > maxVisitedStep) {
            setMaxVisitedStep(newStep);
          }
        }
      }
    } else if (!stepFromState && !stepFromUrlParams) {
      // If no step param, set to 0 or 2 based on plan
      const initialStep = hasPaidPlan ? 2 : 0;
      if (activeStep !== initialStep && !isNavigatingRef.current) {
        isNavigatingRef.current = true;
        setActiveStep(initialStep);
        navigate(`/onboarding?step=${initialStep}`, { replace: true });
        setTimeout(() => { isNavigatingRef.current = false; }, 200);
      }
    }
    
    const success = queryParams.get('checkout_success');
    const cancelled = queryParams.get('checkout_cancelled');
    const session = queryParams.get('session_id');
    const planId = queryParams.get('plan_id');
    
    if (success === 'true') {
      setCheckoutSuccess(true);
      setShowThankYouMessage(true);
      setHasPaidPlan(true);
      
      if (planId) {
        setSuccessPlanId(planId);
      }
      // Clean up query params
      queryParams.delete('checkout_success');
      queryParams.delete('session_id');
      queryParams.delete('plan_id');
      navigate(`${location.pathname}?${queryParams.toString()}`, { replace: true });
    }
    
    if (cancelled === 'true') {
      setCheckoutCancelled(true);
      toast({ title: "支払いキャンセル", description: "支払いがキャンセルされました。", variant: "default" });
      queryParams.delete('checkout_cancelled');
      navigate(`${location.pathname}?${queryParams.toString()}`, { replace: true });
    }
    
    if (session && session !== '{CHECKOUT_SESSION_ID}') {
      setSessionId(session);
      if (currentStore?.id) {
        (async () => {
          try {
            const data = await verifyCheckoutSession(session);
            if (data.success && data.plan_id) {
              await handleSubscriptionSuccess(data.plan_id);
              setSuccessPlanId(data.plan_id);
              setHasPaidPlan(true);
              setShowThankYouMessage(true); // Show success message even if verified later
              setActiveStep(2); // Move to step 2 after successful verification
              navigate('/onboarding?step=2', { replace: true });
            } else {
              console.warn('[Onboarding] Session data missing plan_id or verification failed:', data);
            }
          } catch (err) {
            console.error('[Onboarding] Error processing checkout session:', err);
             toast({
                title: "エラー",
                description: "支払い情報の確認中にエラーが発生しました。",
                variant: "destructive",
              });
          } finally {
              // Clean up session_id param regardless of outcome
              queryParams.delete('session_id');
              navigate(`${location.pathname}?${queryParams.toString()}`, { replace: true });
          }
        })();
      } else {
         // Clean up session_id if store is not ready yet
         queryParams.delete('session_id');
         navigate(`${location.pathname}?${queryParams.toString()}`, { replace: true });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, currentStore?.id, handleSubscriptionSuccess, navigate, hasPaidPlan]); // Removed activeStep, maxVisitedStep dependencies to avoid loops

  useEffect(() => {
    const updatedSteps = steps.map(step => ({
      ...step,
      isActive: step.id === activeStep,
      isCompleted: 
        (step.id === 1 && !!currentStore?.plan_id) || 
        (step.id === 2 && !!currentStore?.description && !!currentStore?.location && !!currentStore?.industry) || 
        (step.id === 3 && !!currentStore?.welcome_message && !!currentStore?.thanks_message) || 
        (step.id === 4 && !!currentStore?.qr_code_url) || 
        (step.id < activeStep && step.id !== 0) // Mark previous steps as completed, except welcome
    }));
    
    setSteps(updatedSteps);
    
    const completedStepsCount = updatedSteps.filter(s => s.isCompleted).length;
    const totalStepsForProgress = updatedSteps.length - 1; // Exclude the final 'complete' step
    const percent = Math.min(Math.round((completedStepsCount / totalStepsForProgress) * 100), 100);
    setProgress(percent);
    
    // Check if all onboarding steps are complete and redirect to dashboard
    const allStepsCompleted = currentStore && 
      currentStore.plan_id && 
      currentStore.name && // Added name check
      currentStore.description && 
      currentStore.location && 
      currentStore.industry && // Added industry check
      currentStore.welcome_message && 
      currentStore.thanks_message && 
      currentStore.qr_code_url;
    
    if (allStepsCompleted && location.pathname === '/onboarding') {
      console.log("All onboarding steps completed, redirecting to dashboard");
      navigate('/dashboard', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, currentStore, navigate, location.pathname]); // Keep dependencies minimal

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const currentStepParam = queryParams.get('step');
    const newStepParam = activeStep.toString();
    
    if (currentStepParam !== newStepParam && !isNavigatingRef.current) {
      isNavigatingRef.current = true;
      navigate(`/onboarding?step=${activeStep}`, { replace: true, state: { step: activeStep } });
      
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 200); // Short delay to prevent rapid navigation loops
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, navigate]); // Removed location.search to prevent loops


  useEffect(() => {
    if (currentStore) {
      setStoreFormValues(prev => ({
        ...prev,
        name: currentStore.name || prev.name || '',
        description: currentStore.description || prev.description || '',
        location: currentStore.location || prev.location || '',
        industry: currentStore.industry || prev.industry || '',
        features: Array.isArray(currentStore?.features) ? currentStore.features.join(', ') : prev.features || '',
        google_place_id: currentStore.google_place_id || prev.google_place_id || ''
      }));
      
      setChatFormValues(prev => ({
        ...prev,
        ai_tone: currentStore.ai_tone || prev.ai_tone || 'friendly',
        welcome_message: currentStore.welcome_message || prev.welcome_message || 'こんにちは！本日はご利用いただきありがとうございます。お店の感想を教えていただけると嬉しいです。',
        thanks_message: currentStore.thanks_message || prev.thanks_message || 'ご回答ありがとうございました！いただいたフィードバックを今後のサービス向上に活かしてまいります。'
      }));
      
      setCouponFormValues(prev => ({
        ...prev,
        coupon_type: currentStore.coupon_type || prev.coupon_type || null,
        coupon_value: currentStore.coupon_value?.toString() || prev.coupon_value || '',
        coupon_free_item_desc: currentStore.coupon_free_item_desc || prev.coupon_free_item_desc || ''
      }));
      
      if (currentStore.plan_id) {
        setSelectedPlan(currentStore.plan_id); // Ensure plan selection hook is updated
        setHasPaidPlan(true);
      }
    }
  }, [currentStore, setSelectedPlan]); // Depend only on currentStore and setSelectedPlan

  const handlePaymentSuccessComplete = () => {
    setShowThankYouMessage(false);
    if (activeStep < 2) { // Only force navigation if not already past step 1
      setActiveStep(2);
      isNavigatingRef.current = true;
      navigate('/onboarding?step=2', { replace: true });
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 300);
    }
  };

  if (isAuthLoading || isStoreLoading) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed z-0" style={{ backgroundImage: `url(${BLURRED_BG_IMAGE})` }} />
        <div className="flex justify-center items-center h-screen">
          <div className="bg-white/60 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-lg p-10 flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-sky-500 mb-4" />
            <span className="text-lg text-gray-700 font-medium">読み込み中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const goToDashboard = () => {
     // Ensure all required fields are potentially set before redirecting
     // This is a safety check, main check is in useEffect
     const allStepsCompleted = currentStore && currentStore.plan_id && currentStore.name && currentStore.description && currentStore.location && currentStore.industry && currentStore.welcome_message && currentStore.thanks_message && currentStore.qr_code_url;
     if (allStepsCompleted) {
        navigate('/dashboard', { replace: true });
     } else {
        // Maybe show a message indicating what's missing or just stay on the last step
        toast({ title: "あと少し！", description: "ダッシュボードに進む前にすべての設定を完了してください。", variant: "default" });
        // Optionally navigate to the first incomplete step
        const firstIncompleteStep = steps.find(step => !step.isCompleted)?.id;
        if (firstIncompleteStep !== undefined && firstIncompleteStep !== activeStep) {
            setActiveStep(firstIncompleteStep);
            navigate(`/onboarding?step=${firstIncompleteStep}`, { replace: true });
        }
     }
  };

  const handleNextStep = () => {
    if (isNavigatingRef.current) return;

    const nextStep = activeStep + 1;
    if (nextStep >= steps.length) {
      goToDashboard();
      return;
    }

    // Prevent navigating to step 0 or 1 if paid plan exists
    if (hasPaidPlan && (nextStep === 0 || nextStep === 1)) {
      return; // Should not happen if logic is correct, but safety check
    }
    
    // Check if allowed to proceed (e.g., based on completion)
    // Basic check: Can only move forward linearly for now
    if (nextStep > maxVisitedStep + 1 && !steps[activeStep]?.isCompleted) {
       toast({ title: "まだ完了していません", description: "現在のステップを完了してください。", variant: "default" });
       return;
    }

    isNavigatingRef.current = true;
    setActiveStep(nextStep);
    // Update maxVisitedStep if moving forward
    if (nextStep > maxVisitedStep) {
        setMaxVisitedStep(nextStep);
    }
    navigate(`/onboarding?step=${nextStep}`, { replace: true });
    
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 200);
  };

  const handlePrevStep = () => {
    if (activeStep <= 0 || isNavigatingRef.current) return;

    const prevStep = activeStep - 1;
    
    // Prevent navigating back to step 0 or 1 if paid plan exists
    if (hasPaidPlan && (prevStep === 0 || prevStep === 1)) {
        return; 
    }
    
    isNavigatingRef.current = true;
    setActiveStep(prevStep);
    navigate(`/onboarding?step=${prevStep}`, { replace: true });
    
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 200);
  };
  
  const handleStoreFormSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isStoreSubmitting) return;
    
    if (!storeFormValues.name || !storeFormValues.description || !storeFormValues.location || !storeFormValues.industry) {
      setStoreSubmitError('必須項目 (店舗名, 説明, 所在地, 業種) を入力してください');
      toast({ title: "入力エラー", description: "必須項目 (店舗名, 説明, 所在地, 業種) を入力してください", variant: "destructive" });
      return;
    }
    
    setIsStoreSubmitting(true);
    setStoreSubmitError(null);
    
    try {
      if (!currentStore?.id) throw new Error('店舗情報が見つかりません');
      
      const featuresArray = storeFormValues.features
        ? storeFormValues.features.split(',').map(f => f.trim()).filter(Boolean)
        : [];
      
      const updates = {
        name: storeFormValues.name,
        description: storeFormValues.description,
        location: storeFormValues.location,
        industry: storeFormValues.industry,
        features: featuresArray,
        google_place_id: storeFormValues.google_place_id || null, // Ensure null if empty
      };
      
      const { data, error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', currentStore.id)
        .select()
        .single();
      
      if (error) throw new Error(`店舗情報の更新に失敗しました: ${error.message}`);
      
      if (data) {
        setStore(data); // Update the store state
        toast({ title: "保存完了", description: "店舗情報を保存しました" });
        handleNextStep(); // Move to next step on success
      } else {
         throw new Error('店舗情報の更新後、データが返されませんでした。');
      }
      
    } catch (err) {
      const message = err instanceof Error ? err.message : '店舗情報の更新に失敗しました';
      setStoreSubmitError(message);
      toast({ title: "エラー", description: message, variant: "destructive" });
    } finally {
      setIsStoreSubmitting(false);
    }
  };
  
  const handleChatFormSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isChatSubmitting) return;
    
    if (!chatFormValues.welcome_message || !chatFormValues.thanks_message) {
      setChatSubmitError('挨拶とお礼のメッセージを入力してください');
       toast({ title: "入力エラー", description: "挨拶とお礼のメッセージを入力してください", variant: "destructive" });
      return;
    }
    
    setIsChatSubmitting(true);
    setChatSubmitError(null);
    
    try {
      if (!currentStore?.id) throw new Error('店舗情報が見つかりません');
      
      const settings = {
        ai_tone: chatFormValues.ai_tone || 'friendly',
        welcome_message: chatFormValues.welcome_message.trim(),
        thanks_message: chatFormValues.thanks_message.trim()
      };
      
      // --- Combine Coupon settings submit here if rewards tab is active ---
      // Or handle coupon submit separately if it has its own button/logic
      // For simplicity, let's assume coupon settings are submitted with chat settings
      let couponSettings = {
        coupon_type: couponFormValues.coupon_type,
        coupon_value: null,
        coupon_free_item_desc: null
      };
      
      if (couponFormValues.coupon_type === 'percent' || couponFormValues.coupon_type === 'fixed') {
        if (couponFormValues.coupon_value) {
          const numValue = parseFloat(couponFormValues.coupon_value);
          couponSettings.coupon_value = !isNaN(numValue) ? numValue : null;
        }
      } else if (couponFormValues.coupon_type === 'free_item') {
        couponSettings.coupon_free_item_desc = couponFormValues.coupon_free_item_desc?.trim() || null;
      }
      // --- End Coupon settings ---

      const updatePayload = { ...settings, ...couponSettings };
      
      const { data, error } = await supabase
        .from('stores')
        .update(updatePayload)
        .eq('id', currentStore.id)
        .select()
        .single();
      
      if (error) throw new Error(`接客・特典設定の更新に失敗しました: ${error.message}`);
      
      if (data) {
        setStore(data);
        toast({ title: "保存完了", description: "接客・特典設定を保存しました" });
        handleNextStep();
      } else {
         throw new Error('設定の更新後、データが返されませんでした。');
      }
      
    } catch (err) {
       const message = err instanceof Error ? err.message : '接客・特典設定の更新に失敗しました';
       setChatSubmitError(message);
       toast({ title: "エラー", description: message, variant: "destructive" });
    } finally {
      setIsChatSubmitting(false);
    }
  };

  // Note: handleCouponFormSubmit might be redundant if integrated into handleChatFormSubmit
  // If it's meant to be separate (e.g., save button only on Rewards tab), keep it.
  // const handleCouponFormSubmit = async () => { ... }; 
  
  const handleCreateStore = async () => {
    if (!user?.id || currentStore) { // Prevent creating if already exists
      handleNextStep(); // Just move to next step if store exists
      return;
    }
    
    setIsStoreSubmitting(true); // Use a loading state
    try {
        const { data, error } = await stores.createStoreWithOwner({
          owner_id: user.id,
          // Provide minimal defaults or potentially use user info
          name: `${user.email?.split('@')[0] || 'マイ'}のお店`, 
          created_at: new Date().toISOString()
        });
        
        if (error) throw error;
        
        if (data) {
          setStore(data);
          toast({ title: "準備完了", description: "クチトルの受け入れ準備が整いました" });
          handleNextStep(); // Proceed after creation
        } else {
           throw new Error('ストア作成後、データが返されませんでした。');
        }
    } catch (err) {
      console.error('[Onboarding] ストア作成エラー:', err);
      const message = err instanceof Error ? err.message : '初期設定に失敗しました';
      toast({ title: "エラー", description: message, variant: "destructive" });
    } finally {
      setIsStoreSubmitting(false);
    }
  };
  
  // ステップごとにアクセス可能かどうかをチェック
  const canAccessStep = (stepId) => {
    if (stepId === 0) return true; // Welcome step always accessible initially

    // Paid plan skips steps 0, 1
    if (hasPaidPlan && (stepId === 0 || stepId === 1)) return false; 

    // Need store created for step 1 onwards (unless paid plan)
    if (stepId >= 1 && !currentStore?.id) return false; 

    // Need plan for step 2 onwards
    if (stepId >= 2 && !currentStore?.plan_id) return false; 

    // Need store info for step 3 onwards
    if (stepId >= 3 && (!currentStore?.description || !currentStore?.name || !currentStore?.location || !currentStore?.industry)) return false;

    // Need chat settings for step 4 onwards
    if (stepId >= 4 && (!currentStore?.welcome_message || !currentStore?.thanks_message)) return false;

    // Need QR code for step 5 onwards (completion step)
    if (stepId >= 5 && !currentStore?.qr_code_url) return false;

    // Allow access if the step has been visited before OR it's the next logical step
    return stepId <= maxVisitedStep + 1; 
  };
  
  // QRコード生成と完了処理
  const handleGenerateQRCodeAndContinue = async () => {
    if (!currentStore?.id) {
      toast({ title: "エラー", description: "店舗情報が見つかりません", variant: "destructive" });
      return;
    }
    
    const success = await handleGenerateQRCode(); // handleGenerateQRCode should return boolean or handle errors internally
    
    if (success) {
      // Wait briefly for state update if needed, then proceed
      setTimeout(() => {
        handleNextStep(); // Move to the final step (or dashboard if step 5 is the last action)
      }, 300); 
    } else {
       // Error handled within useQRCodeGeneration hook via toast potentially
       console.error("QRコード生成に失敗しました。");
    }
  };
  
  // ウェブサイト分析ボタンのクリックハンドラ
  const handleAnalyzeWebsiteClick = () => {
    if (!websiteUrl) {
      setWebsiteError('URLを入力してください');
      toast({ title: "入力エラー", description: "ウェブサイトURLを入力してください", variant: "default" });
      return;
    }
    setWebsiteError(null); // Clear previous errors
    handleAnalyzeWebsite(); // Call the hook's function
  };

  // =============================================
  //   RENDER STEP CONTENT FUNCTION
  // =============================================
  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Welcome
        return (
          <Card className="bg-white/60 backdrop-blur-2xl border border-white/30 shadow-lg rounded-3xl overflow-hidden">
            <CardContent className="p-6 md:p-10 space-y-8">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                  クチトルへようこそ
                </h1>
                <p className="text-gray-600 mt-3 max-w-lg mx-auto">
                  口コミ集めの新しいスタッフ、クチトルをお店に迎えましょう。<br />
                  QRコードを置くだけで、お客様の声を自動で集めます。
                </p>
              </div>
              
              <div className="bg-white/50 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-md">
                <h3 className="font-semibold text-lg mb-4 bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                  あなたの新しいスタッフ、クチトル
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full p-1 mr-3 flex-shrink-0 shadow-md mt-1">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-700">お客様と自然な会話をし、生の声を集めます</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full p-1 mr-3 flex-shrink-0 shadow-md mt-1">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-700">会話内容から口コミを作成し、投稿を促します</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full p-1 mr-3 flex-shrink-0 shadow-md mt-1">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-700">お客様の声の傾向を分析し、改善点を提案します</span>
                  </li>
                </ul>
              </div>
              
              <div className="text-center">
                <Button 
                  onClick={handleCreateStore}
                  disabled={isStoreSubmitting || !!currentStore} // Disable if already created or creating
                  className="bg-gradient-to-r from-sky-400 to-indigo-400 text-white rounded-full px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  {isStoreSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> :
                   currentStore ? '次へ' : 'クチトルを採用する'} 
                   {!isStoreSubmitting && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
        
      case 1: // Plan Selection
        // Ensure OnboardingPlanSelection handles next/prev logic or calls handleNextStep
        return <OnboardingPlanSelection onPlanSelected={handleNextStep} />; 
        
      case 2: // Store Info
        return (
          <Card className="bg-white/60 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-lg overflow-hidden">
            <CardHeader className="p-6 border-b border-gray-100/30">
               <div className="flex items-center">
                 <Store className="h-5 w-5 mr-2 text-sky-500" />
                 <CardTitle className="text-xl font-medium bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent">
                    クチトルの職場環境
                 </CardTitle>
               </div>
              <CardDescription className="mt-1 text-gray-600">
                お店の情報を教えてください。クチトルがお客様との会話に活用します
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleStoreFormSubmit}>
              <CardContent className="p-6 space-y-6">
                {storeSubmitError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>エラー</AlertTitle>
                    <AlertDescription>{storeSubmitError}</AlertDescription>
                  </Alert>
                )}
                
                {/* Website Scraping Feature */}
                <div className="bg-gradient-to-br from-sky-50/80 to-indigo-50/80 backdrop-blur-xl p-4 rounded-xl border border-sky-100/30">
                  <div className="flex items-center mb-3">
                    <Sparkles className="h-5 w-5 text-sky-500 mr-2" />
                    <h3 className="font-medium text-gray-800">AI自動分析機能</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    ウェブサイトのURLを入力すると、AIが店舗情報を自動的に分析・入力します。
                  </p>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Input
                      type="url" // Use type="url" for better validation
                      placeholder="例: https://your-store.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="flex-1 bg-white/70 backdrop-blur-xl border border-white/50 rounded-xl"
                      aria-label="ウェブサイトURL"
                    />
                    <Button
                      type="button" // Prevent form submission
                      onClick={handleAnalyzeWebsiteClick}
                      disabled={isWebsiteLoading || !websiteUrl}
                      className="bg-gradient-to-r from-sky-400 to-indigo-400 text-white rounded-full px-4 shrink-0"
                    >
                      {isWebsiteLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />分析中...</>
                      ) : ( '分析する' )}
                    </Button>
                  </div>
                  {websiteError && <p className="text-sm text-red-600 mt-2">{websiteError}</p>}
                  {/* Removed success message, relies on toast */}
                  {isSiteAnalyzed && analyzedData && ( // Show analysis result preview
                    <div className="mt-3 bg-white/60 rounded-lg p-3 border border-white/40 text-xs text-gray-700">
                      <p className="font-medium mb-1">分析結果プレビュー:</p>
                      <ul className="space-y-1">
                         {analyzedData.name && <li>店舗名: {analyzedData.name}</li>}
                         {analyzedData.description && <li>説明: {analyzedData.description.substring(0, 50)}...</li>}
                         {analyzedData.location && <li>所在地: {analyzedData.location}</li>}
                         {analyzedData.features?.length > 0 && (<li>特徴: {analyzedData.features.slice(0, 3).join(', ')}</li>)}
                      </ul>
                      <p className="mt-2 text-sky-700">上記の情報がフォームに反映されました。</p>
                    </div>
                  )}
                </div>
                
                {/* Store Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-medium text-gray-700">店舗名 *</Label>
                    <Input id="name" value={storeFormValues.name} onChange={(e) => setStoreFormValues({...storeFormValues, name: e.target.value})} className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-xl" placeholder="例: 〇〇食堂" required />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="industry" className="font-medium text-gray-700">業種 *</Label>
                     <Select value={storeFormValues.industry} onValueChange={(value) => setStoreFormValues({...storeFormValues, industry: value})} required>
                       <SelectTrigger className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-xl">
                         <SelectValue placeholder="業種を選択" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="restaurant">飲食店</SelectItem>
                         <SelectItem value="cafe">カフェ</SelectItem>
                         <SelectItem value="bar">バー・居酒屋</SelectItem>
                         <SelectItem value="beauty">美容院・サロン</SelectItem>
                         <SelectItem value="retail">小売店</SelectItem>
                         <SelectItem value="service">サービス業</SelectItem>
                         <SelectItem value="other">その他</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="font-medium text-gray-700">店舗の説明 *</Label>
                  <Textarea id="description" value={storeFormValues.description} onChange={(e) => setStoreFormValues({...storeFormValues, description: e.target.value})} className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-xl" placeholder="例: 地元食材にこだわった家庭的な定食屋です。アットホームな雰囲気で、特に唐揚げ定食が人気です。" rows={3} required />
                  <p className="text-xs text-gray-500">※ お店の特徴や強みを入力すると、AIがお客様との会話に活用します</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="location" className="font-medium text-gray-700">所在地 *</Label>
                     <Input id="location" value={storeFormValues.location} onChange={(e) => setStoreFormValues({...storeFormValues, location: e.target.value})} className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-xl" placeholder="例: 東京都渋谷区〇〇町1-2-3" required />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="google_place_id" className="font-medium text-gray-700">Google Place ID (オプション)</Label>
                     <Input id="google_place_id" value={storeFormValues.google_place_id} onChange={(e) => setStoreFormValues({...storeFormValues, google_place_id: e.target.value})} className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-xl" placeholder="例: ChIJiTLFJL2MGGARa88S5aEQ2k" />
                     <p className="text-xs text-gray-500">※ Googleマップのレビュー連携に使用します。</p>
                   </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="features" className="font-medium text-gray-700">特徴キーワード</Label>
                  <Input id="features" value={storeFormValues.features} onChange={(e) => setStoreFormValues({...storeFormValues, features: e.target.value})} className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-xl" placeholder="例: 家庭的, アットホーム, 地元食材, 唐揚げ, ボリューム満点" />
                  <p className="text-xs text-gray-500">※ カンマ区切りで入力してください。AIがお客様の声を集める際の話題として使用します</p>
                </div>
                
              </CardContent>
              
              <CardFooter className="p-6 border-t border-gray-100/30 flex justify-between">
                <Button type="button" variant="outline" onClick={handlePrevStep} disabled={hasPaidPlan || activeStep === 2} className={`bg-white/50 backdrop-blur-xl border border-white/40 text-gray-600 rounded-full ${hasPaidPlan || activeStep === 2 ? 'invisible' : ''}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> 戻る
                </Button>
                <Button type="submit" disabled={isStoreSubmitting} className="bg-gradient-to-r from-sky-400 to-indigo-400 text-white rounded-full px-6">
                  {isStoreSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  {isStoreSubmitting ? '保存中...' : 'クチトルに職場を教える'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        );

      case 3: // Chat Settings + Rewards
        return (
          <Card className="bg-white/60 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-lg overflow-hidden">
            <CardHeader className="p-6 border-b border-gray-100/30">
               <div className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-sky-500" />
                 <CardTitle className="text-xl font-medium bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent">
                   クチトルの接客スタイル
                 </CardTitle>
               </div>
              <CardDescription className="mt-1 text-gray-600">
                お客様と会話するクチトルの話し方や、回答へのお礼を設定します
              </CardDescription>
            </CardHeader>

            {/* Wrap content in a form for unified submission */}
            <form onSubmit={handleChatFormSubmit}>
              <CardContent className="p-6">
                {chatSubmitError && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>エラー</AlertTitle>
                    <AlertDescription>{chatSubmitError}</AlertDescription>
                  </Alert>
                )}

                <Tabs defaultValue="personality" className="w-full">
                  <div className="flex justify-center mb-6">
                    <TabsList className="bg-white/50 backdrop-blur-xl rounded-full p-1 border border-white/40 shadow-sm">
                      <TabsTrigger value="personality" className="rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                        性格
                      </TabsTrigger>
                      <TabsTrigger value="messages" className="rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                        会話
                      </TabsTrigger>
                      <TabsTrigger value="rewards" className="rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                        特典
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="personality" className="mt-0">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                       {/* Personality Settings */}
                       <div className="space-y-5 bg-white/40 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-md">
                         <h3 className="text-lg font-medium bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                           クチトルの性格設定
                         </h3>
                         <p className="text-sm text-gray-600">お客様と会話するときのクチトルの話し方を選びます</p>
                         
                         <div className="space-y-4">
                           <div className="space-y-2">
                             <Label htmlFor="ai_tone">話し方のトーン</Label>
                             <div className="grid grid-cols-3 gap-3">
                               {[
                                 { id: 'friendly', name: 'フレンドリー', icon: '😊', desc: '親しみやすい' },
                                 { id: 'formal', name: 'フォーマル', icon: '🧐', desc: '丁寧' },
                                 { id: 'casual', name: 'カジュアル', icon: '✌️', desc: '気さく' }
                               ].map(tone => (
                                 <button
                                   key={tone.id} type="button"
                                   onClick={() => setChatFormValues(prev => ({ ...prev, ai_tone: tone.id }))}
                                   className={`bg-white/70 backdrop-blur-xl border ${ chatFormValues.ai_tone === tone.id ? 'border-sky-300 ring-2 ring-sky-200' : 'border-white/50 hover:border-sky-200' } rounded-xl p-3 transition-all shadow-sm hover:shadow-md text-center space-y-1 relative`}
                                 >
                                   <div className="text-xl">{tone.icon}</div>
                                   <div className="text-sm font-medium text-gray-800">{tone.name}</div>
                                   <div className="text-xs text-gray-500">{tone.desc}</div>
                                 </button>
                               ))}
                             </div>
                           </div>
                           
                           {/* Simple switches for now, actual implementation might be complex */}
                           <div className="space-y-2">
                             <Label>会話スタイルの微調整 (オプション)</Label>
                             <div className="space-y-2 pt-1">
                               <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2 border border-white/40">
                                 <label htmlFor="use_emoji" className="text-sm text-gray-700">絵文字を使う</label>
                                 <Switch id="use_emoji" defaultChecked={true} />
                               </div>
                               <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2 border border-white/40">
                                 <label htmlFor="proactive_questions" className="text-sm text-gray-700">積極的に質問する</label>
                                 <Switch id="proactive_questions" defaultChecked={true} />
                               </div>
                                <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2 border border-white/40">
                                 <label htmlFor="follow_up" className="text-sm text-gray-700">回答に共感する</label>
                                 <Switch id="follow_up" defaultChecked={true} />
                               </div>
                             </div>
                           </div>
                         </div>
                       </div>

                       {/* Conversation Preview */}
                       <div className="space-y-5">
                          <h3 className="text-lg font-medium bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                            会話プレビュー
                          </h3>
                          <p className="text-sm text-gray-600">クチトルとお客様の会話イメージです</p>
    
                          <div className="bg-white/40 backdrop-blur-2xl rounded-2xl border border-white/30 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white p-3 flex items-center">
                               <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3"><MessageCircle size={18} /></div>
                               <div>
                                 <div className="font-medium">クチトル</div>
                                 <div className="text-xs text-white/80">接客中</div>
                               </div>
                            </div>
                            <div className="p-4 space-y-3 max-h-64 overflow-y-auto text-sm">
                              {/* AI Message */}
                              <div className="flex">
                                <div className="flex-shrink-0 mr-2">
                                   <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
                                     <MessageCircle size={14} />
                                   </div>
                                </div>
                                <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-lg rounded-tl-none p-2.5 text-gray-800 shadow-sm">
                                  {aiToneExamples[chatFormValues.ai_tone]?.welcome || chatFormValues.welcome_message}
                                </div>
                              </div>
                              {/* User Message */}
                              <div className="flex justify-end">
                                 <div className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-lg rounded-br-none p-2.5 shadow-md max-w-[80%]">
                                    料理がとても美味しかったです！特に海鮮が新鮮でした。
                                 </div>
                                 <div className="flex-shrink-0 ml-2">
                                    <div className="w-7 h-7 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center shadow-sm text-gray-500 text-xs">客</div>
                                 </div>
                              </div>
                              {/* AI Message */}
                              <div className="flex">
                                <div className="flex-shrink-0 mr-2">
                                   <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
                                     <MessageCircle size={14} />
                                   </div>
                                </div>
                                <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-lg rounded-tl-none p-2.5 text-gray-800 shadow-sm">
                                  {aiToneExamples[chatFormValues.ai_tone]?.response || '素晴らしいですね！他に良かった点はありますか？'}
                                </div>
                              </div>
                            </div>
                          </div>
                       </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="messages" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Message Settings */}
                      <div className="space-y-6 bg-white/40 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-md">
                        <h3 className="text-lg font-medium bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                           クチトルの会話スクリプト
                        </h3>
                        <p className="text-sm text-gray-600">お客様に話しかける言葉を教えてください</p>
                      
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="welcome_message" className="flex items-center">
                              <span className="inline-block w-5 h-5 rounded-full bg-sky-100 text-sky-600 text-xs font-bold flex items-center justify-center mr-2">1</span>
                              最初の挨拶 *
                            </Label>
                            <Textarea id="welcome_message" value={chatFormValues.welcome_message} onChange={(e) => setChatFormValues(prev => ({ ...prev, welcome_message: e.target.value }))} required rows={3} placeholder="例: いつもご利用ありがとうございます。今日の体験はいかがでしたか？" className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-xl" />
                            <p className="text-xs text-gray-500">QRコードを読み取った時の最初の言葉です</p>
                          </div>
                          
                           <div className="space-y-2">
                             <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-white/40">
                               <Label htmlFor="auto_questions" className="flex items-center text-sm text-gray-700">
                                 <span className="inline-block w-5 h-5 rounded-full bg-sky-100 text-sky-600 text-xs font-bold flex items-center justify-center mr-2">2</span>
                                 質問の自動生成
                               </Label>
                               <Switch id="auto_questions" defaultChecked={true} />
                             </div>
                             <p className="text-xs text-gray-500 pl-7">クチトルが会話の流れに合わせて質問を考えます</p>
                           </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="thanks_message" className="flex items-center">
                              <span className="inline-block w-5 h-5 rounded-full bg-sky-100 text-sky-600 text-xs font-bold flex items-center justify-center mr-2">3</span>
                              会話終了時のお礼 *
                            </Label>
                            <Textarea id="thanks_message" value={chatFormValues.thanks_message} onChange={(e) => setChatFormValues(prev => ({ ...prev, thanks_message: e.target.value }))} required rows={3} placeholder="例: ご回答ありがとうございました！今後のサービス改善に活かします。" className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-xl" />
                            <p className="text-xs text-gray-500">会話終了時のメッセージです</p>
                          </div>
                        </div>
                      </div>

                      {/* Process Explanation */}
                      <div className="space-y-5">
                         <h3 className="text-lg font-medium bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                           クチトルの仕事の流れ
                         </h3>
                         <p className="text-sm text-gray-600">クチトルが会話からお客様のリアルな声を引き出す方法です</p>

                         <div className="bg-white/40 backdrop-blur-2xl rounded-2xl border border-white/30 shadow-lg overflow-hidden p-5">
                           <div className="mb-4">
                             <div className="text-sm font-medium text-gray-700 mb-3">クチトルの接客プロセス</div>
                             <ol className="space-y-3 list-none pl-0">
                               <li className="flex items-start">
                                 <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 text-xs font-bold flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">1</div>
                                 <div className="text-sm text-gray-600">店舗の特徴や強みを理解し、質問を準備</div>
                               </li>
                               <li className="flex items-start">
                                 <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 text-xs font-bold flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">2</div>
                                 <div className="text-sm text-gray-600">お客様の回答から感情や関心を読み取る</div>
                               </li>
                               <li className="flex items-start">
                                 <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 text-xs font-bold flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">3</div>
                                 <div className="text-sm text-gray-600">自然な流れで次の質問を選択・生成</div>
                               </li>
                             </ol>
                           </div>

                           <div className="bg-gradient-to-br from-sky-50/80 to-indigo-50/80 rounded-xl p-3 border border-sky-100/30">
                             <div className="text-sm font-medium text-gray-700 mb-2">質問例</div>
                             <div className="space-y-1.5 text-xs text-gray-600">
                               <div className="bg-white/70 backdrop-blur-sm rounded-lg p-1.5 border border-white/50">「特に唐揚げはいかがでしたか？」</div>
                               <div className="bg-white/70 backdrop-blur-sm rounded-lg p-1.5 border border-white/50">「スタッフの対応は良かったですか？」</div>
                               <div className="bg-white/70 backdrop-blur-sm rounded-lg p-1.5 border border-white/50">「改善点があれば教えてください」</div>
                             </div>
                           </div>
                         </div>
                       </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="rewards" className="mt-0">
                    <div className="space-y-4 bg-white/40 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-medium bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                            クチトルからのお礼の設定
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            クチトルが対話後にお客様へ渡す特典を設定できます (任意)
                          </p>
                        </div>
                        <Switch 
                          id="enable-coupon"
                          checked={!!couponFormValues.coupon_type}
                          onCheckedChange={(checked) => setCouponFormValues(prev => ({
                            ...prev,
                            coupon_type: checked ? 'percent' : null, // Default to percent when enabled
                            coupon_value: checked ? '10' : '', // Default value
                            coupon_free_item_desc: ''
                          }))}
                          aria-label="特典を有効にする"
                        />
                      </div>
                      
                      {couponFormValues.coupon_type ? (
                        <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/40 shadow-inner p-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Coupon Settings Form */}
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="coupon_type">特典タイプ *</Label>
                                <Select value={couponFormValues.coupon_type || ''} onValueChange={(value) => setCouponFormValues(prev => ({ ...prev, coupon_type: value, coupon_value: value !== 'free_item' ? prev.coupon_value || '' : '', coupon_free_item_desc: value === 'free_item' ? prev.coupon_free_item_desc || '' : '' }))} required>
                                  <SelectTrigger className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-xl"><SelectValue placeholder="特典タイプを選択" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="percent">パーセント割引 (%)</SelectItem>
                                    <SelectItem value="fixed">金額割引 (円)</SelectItem>
                                    <SelectItem value="free_item">無料サービス</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {(couponFormValues.coupon_type === 'percent' || couponFormValues.coupon_type === 'fixed') && (
                                <div className="space-y-2">
                                  <Label htmlFor="coupon_value">{couponFormValues.coupon_type === 'percent' ? '割引率 (%) *' : '割引額 (円) *'}</Label>
                                  <Input id="coupon_value" type="number" min="1" max={couponFormValues.coupon_type === 'percent' ? "100" : "100000"} value={couponFormValues.coupon_value} onChange={(e) => setCouponFormValues(prev => ({ ...prev, coupon_value: e.target.value }))} className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-xl" required />
                                </div>
                              )}
                              
                              {couponFormValues.coupon_type === 'free_item' && (
                                <div className="space-y-2">
                                  <Label htmlFor="coupon_free_item_desc">無料サービスの内容 *</Label>
                                  <Input id="coupon_free_item_desc" placeholder="例: ソフトドリンク1杯無料" value={couponFormValues.coupon_free_item_desc} onChange={(e) => setCouponFormValues(prev => ({ ...prev, coupon_free_item_desc: e.target.value }))} className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-xl" required />
                                </div>
                              )}
                            </div>
                            
                            {/* Coupon Preview */}
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-3">特典プレビュー</div>
                              <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-white/50 shadow-md p-4 relative overflow-hidden">
                                <div className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-yellow-500 text-white text-[10px] font-bold py-0.5 px-3 rounded-bl-lg shadow-sm">SPECIAL</div>
                                <div className="flex items-center mb-4">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center mr-3 shadow-md text-white"><Ticket size={20} /></div>
                                  <div>
                                    <div className="font-semibold text-sm text-gray-800">ご協力ありがとうございます</div>
                                    <div className="text-xs text-gray-600">{currentStore?.name || 'あなたのお店'}</div>
                                  </div>
                                </div>
                                <div className="text-center my-4">
                                  <div className="text-xs text-gray-500">アンケート回答 特典</div>
                                  <div className="font-bold text-2xl bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent my-1">
                                    {couponFormValues.coupon_type === 'percent' ? `${couponFormValues.coupon_value || 'XX'}% OFF` : 
                                    couponFormValues.coupon_type === 'fixed' ? `${couponFormValues.coupon_value || 'XXX'}円 OFF` : 
                                    couponFormValues.coupon_free_item_desc || '無料サービス'}
                                  </div>
                                  <div className="text-xs text-gray-600">次回ご来店時にご利用いただけます</div>
                                </div>
                                <div className="border-t border-dashed border-gray-300 pt-2 mt-3">
                                  <div className="flex justify-between text-[10px] text-gray-500">
                                    <span>有効期限: 発行日から30日間</span>
                                    <span className="text-emerald-600 font-medium">有効</span>
                                  </div>
                                </div>
                              </div>
                               <div className="mt-3 bg-yellow-50/80 border border-yellow-200/50 rounded-lg p-2 text-xs text-yellow-800">
                                 <p><strong className="font-medium">注意:</strong> 特典はアンケート回答への感謝として提供されます。Google口コミ投稿は任意です。</p>
                               </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white/50 backdrop-blur-xl border border-white/40 rounded-xl p-4 text-center text-gray-600">
                          <Ticket size={24} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-sm">特典の提供は現在オフです。スイッチをオンにすると設定できます。</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              
              <CardFooter className="p-6 border-t border-gray-100/30 flex justify-between">
                <Button type="button" variant="outline" onClick={handlePrevStep} className="bg-white/50 backdrop-blur-xl border border-white/40 text-gray-600 rounded-full">
                  <ArrowLeft className="mr-2 h-4 w-4" /> 前のステップ
                </Button>
                <Button type="submit" disabled={isChatSubmitting} className="bg-gradient-to-r from-sky-400 to-indigo-400 text-white rounded-full px-6">
                  {isChatSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  {isChatSubmitting ? '設定中...' : '接客設定を完了'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        );

      case 4: // QR Code Generation
        return (
          <Card className="bg-white/60 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-lg overflow-hidden">
            <CardHeader className="p-6 border-b border-gray-100/30">
               <div className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2 text-sky-500" />
                 <CardTitle className="text-xl font-medium bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent">
                   受付の設置
                 </CardTitle>
               </div>
              <CardDescription className="mt-1 text-gray-600">
                お客様がクチトルと話すためのQRコードを作成・設置します
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
               {qrError && (
                  <Alert variant="destructive">
                     <AlertCircle className="h-4 w-4" />
                     <AlertTitle>QRコードエラー</AlertTitle>
                     <AlertDescription>{qrError}</AlertDescription>
                  </Alert>
               )}
               <div className="text-center">
                  {isQrLoading && <Loader2 className="h-8 w-8 mx-auto animate-spin text-sky-500 mb-4" />}
                  
                  {/* Display QR Code if available */}
                  {currentStore?.qr_code_url || qrCodeUrl ? (
                    <div className="inline-block p-4 bg-white rounded-lg shadow-md border border-gray-200">
                      <img 
                         src={currentStore?.qr_code_url || qrCodeUrl} 
                         alt="店舗用QRコード" 
                         width={200} 
                         height={200} 
                         className="block mx-auto"
                      />
                    </div>
                  ) : (
                     <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mx-auto text-gray-400 border border-gray-200">
                        <QrCode size={64} />
                     </div>
                  )}

                  <p className="text-gray-600 mt-4 mb-6 max-w-md mx-auto">
                     {currentStore?.qr_code_url || qrCodeUrl 
                        ? 'このQRコードをお客様に見える場所に設置してください。ダウンロードして印刷できます。'
                        : '下のボタンを押して、このお店専用のQRコードを生成します。'}
                  </p>

                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                     <Button 
                        onClick={handleGenerateQRCodeAndContinue} 
                        disabled={isQrLoading || !currentStore?.id}
                        className="bg-gradient-to-r from-sky-400 to-indigo-400 text-white rounded-full px-6"
                     >
                        {isQrLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                        {currentStore?.qr_code_url || qrCodeUrl ? 'QRコードを再生成' : 'QRコードを生成'}
                     </Button>

                     {(currentStore?.qr_code_url || qrCodeUrl) && (
                       <Button 
                          variant="outline" 
                          onClick={handleDownloadQRCode} 
                          disabled={isQrLoading}
                          className="bg-white/70 backdrop-blur-xl border border-white/40 text-gray-700 rounded-full px-6"
                        >
                          <Download className="mr-2 h-4 w-4" /> ダウンロード
                       </Button>
                     )}
                  </div>
               </div>
            </CardContent>
             <CardFooter className="p-6 border-t border-gray-100/30 flex justify-between">
                <Button type="button" variant="outline" onClick={handlePrevStep} className="bg-white/50 backdrop-blur-xl border border-white/40 text-gray-600 rounded-full">
                  <ArrowLeft className="mr-2 h-4 w-4" /> 前のステップ
                </Button>
                 {/* Show "Complete" button only if QR code exists */}
                 {(currentStore?.qr_code_url || qrCodeUrl) && (
                    <Button 
                       onClick={handleNextStep} // Go to final step (or dashboard)
                       className="bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-full px-6"
                    >
                       設定を完了する <CheckCircle className="ml-2 h-4 w-4" />
                    </Button>
                 )}
             </CardFooter>
          </Card>
        );

      case 5: // Completion
        return (
          <Card className="bg-white/60 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-lg overflow-hidden">
             <CardContent className="p-6 md:p-10 text-center space-y-6">
               <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto animate-pulse" />
               <h2 className="text-2xl font-semibold bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent">
                 クチトルの準備が完了しました！
               </h2>
               <p className="text-gray-600 max-w-md mx-auto">
                 お疲れ様でした。すべての設定が完了し、クチトルがお客様の声を集める準備が整いました。
                 作成したQRコードをお客様の目に付く場所に設置してください。
               </p>
                <p className="text-gray-600 max-w-md mx-auto">
                  ダッシュボードで集まった声の分析や設定の変更ができます。
                </p>
               <Button 
                  onClick={goToDashboard} 
                  className="bg-gradient-to-r from-sky-400 to-indigo-400 text-white rounded-full px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all"
               >
                 ダッシュボードへ進む <ArrowRight className="ml-2 h-5 w-5" />
               </Button>
             </CardContent>
          </Card>
        );

      default: // Fallback for invalid steps
        return (
           <Card className="bg-white/60 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-lg p-6 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-gray-800">無効なステップ</h2>
              <p className="text-gray-600 mt-2">ステップが見つかりません。最初のステップに戻ります。</p>
              <Button 
                 variant="outline" 
                 onClick={() => { setActiveStep(0); navigate('/onboarding?step=0', { replace: true }); }} 
                 className="mt-4 bg-white/50 backdrop-blur-xl border border-white/40 text-gray-600 rounded-full"
               >
                 最初のステップへ
               </Button>
           </Card>
        );
    } // End switch
  }; // End renderStepContent

  // =============================================
  //   MAIN COMPONENT RETURN
  // =============================================
  return (
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed z-0" 
        style={{ backgroundImage: `url(${BLURRED_BG_IMAGE})` }} 
      />
      
      {/* Subtle Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/10 z-0"></div> 

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8 sm:py-12 relative z-10 flex flex-col lg:flex-row lg:space-x-8 items-start">

        {/* Sidebar / Progress Indicator */}
        <div className="w-full lg:w-1/3 xl:w-1/4 mb-8 lg:mb-0 lg:sticky lg:top-12">
          <Card className="bg-white/60 backdrop-blur-2xl border border-white/30 shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-gray-100/30 p-4">
              <CardTitle className="text-base sm:text-lg font-medium bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent">
                クチトル採用プロセス
              </CardTitle>
              <Progress value={progress} className="mt-2 h-2 rounded-full" />
              <p className="text-xs text-gray-500 mt-1 text-right">{progress}% 完了</p>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 space-y-1.5">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => {
                    // Allow clicking only on visited or current/next accessible step
                    if ((step.id <= maxVisitedStep || step.id === activeStep + 1) && canAccessStep(step.id) && !isNavigatingRef.current) {
                       if (hasPaidPlan && (step.id === 0 || step.id === 1)) return; // Prevent paid users going back
                       
                       isNavigatingRef.current = true;
                       setActiveStep(step.id);
                       navigate(`/onboarding?step=${step.id}`, { replace: true });
                       setTimeout(() => { isNavigatingRef.current = false; }, 200);
                    }
                  }}
                  disabled={!((step.id <= maxVisitedStep || step.id === activeStep + 1) && canAccessStep(step.id)) || (hasPaidPlan && (step.id === 0 || step.id === 1))}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm flex items-center group disabled:opacity-50 disabled:cursor-not-allowed ${
                    step.isActive
                      ? 'bg-gradient-to-r from-sky-100/70 to-indigo-100/70 font-medium text-sky-800 shadow-inner ring-1 ring-sky-200/50'
                      : step.isCompleted
                      ? 'text-gray-500 hover:bg-gray-50/30'
                      : 'text-gray-400' // Future steps
                  } ${ (step.id <= maxVisitedStep || step.id === activeStep + 1) && canAccessStep(step.id) && !(hasPaidPlan && (step.id === 0 || step.id === 1)) ? 'cursor-pointer' : 'cursor-not-allowed' }`}
                >
                  {step.isCompleted ? (
                    <CheckCircle className="h-4 w-4 mr-2 text-emerald-500 flex-shrink-0" />
                  ) : step.isActive ? (
                    <div className="h-4 w-4 mr-2 flex items-center justify-center flex-shrink-0 relative">
                       <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                       <div className="absolute inset-0 rounded-full border border-sky-400 animate-ping"></div>
                    </div>
                  ) : (
                    <div className="h-4 w-4 mr-2 flex items-center justify-center flex-shrink-0">
                      <div className={`w-1.5 h-1.5 rounded-full ${step.id <= maxVisitedStep ? 'bg-gray-400' : 'bg-gray-300'}`}></div>
                    </div>
                  )}
                  <span className="flex-1 truncate" title={step.title}>{step.title}</span>
                  {step.isActive && <ArrowRight className="h-4 w-4 text-sky-600 opacity-70 ml-1 flex-shrink-0" />}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Step Content */}
        <div className="w-full lg:w-2/3 xl:w-3/4">
          {/* Conditional rendering based on step access */}
          {canAccessStep(activeStep) ? (
             renderStepContent()
          ) : (
            // Show an "Access Denied" or "Complete Previous Step" message
            <Card className="bg-white/60 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-lg p-6 text-center">
               <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
               <h2 className="text-xl font-medium text-gray-800">アクセスできません</h2>
               <p className="text-gray-600 mt-2">前のステップを完了してください。</p>
               <Button 
                  variant="outline" 
                  onClick={() => {
                     // Find the last accessible step before the current one
                     const prevAccessibleStep = steps.slice(0, activeStep).reverse().find(s => canAccessStep(s.id))?.id ?? (hasPaidPlan ? 2 : 0);
                     setActiveStep(prevAccessibleStep);
                     navigate(`/onboarding?step=${prevAccessibleStep}`, { replace: true });
                  }} 
                  className="mt-4 bg-white/50 backdrop-blur-xl border border-white/40 text-gray-600 rounded-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  戻る
                </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Success Notification (Modal or similar) */}
      {showThankYouMessage && successPlanId && (
        <PaymentSuccessNotification
          planId={successPlanId}
          onComplete={handlePaymentSuccessComplete}
        />
      )}
    </div>
  ); // End Component Return
}; // End EnhancedOnboarding Component

export default EnhancedOnboarding; // Export the component