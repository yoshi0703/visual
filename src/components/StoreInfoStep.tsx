// src/components/StoreInfoStep.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Loader2, AlertCircle, ArrowLeft, ArrowRight, Globe, ExternalLink, Sparkles } from 'lucide-react';
import WebsiteAnalysisModal from './WebsiteAnalysisModal';

interface StoreInfoStepProps {
  storeFormValues: {
    name: string;
    description: string;
    location: string;
    industry: string;
    features: string;
    google_place_id: string;
  };
  setStoreFormValues: React.Dispatch<React.SetStateAction<{
    name: string;
    description: string;
    location: string;
    industry: string;
    features: string;
    google_place_id: string;
  }>>;
  isStoreSubmitting: boolean;
  storeSubmitError: string | null;
  handleStoreFormSubmit: (e: React.FormEvent) => Promise<void>;
  handlePrevStep: () => void;
  analyzedData?: any;
  isWebsiteAnalysisLoading?: boolean;
}

const StoreInfoStep: React.FC<StoreInfoStepProps> = ({
  storeFormValues,
  setStoreFormValues,
  isStoreSubmitting,
  storeSubmitError,
  handleStoreFormSubmit,
  handlePrevStep,
  analyzedData,
  isWebsiteAnalysisLoading = false
}) => {
  // Website analysis modal state
  const [websiteAnalysisModalOpen, setWebsiteAnalysisModalOpen] = useState<boolean>(false);
  
  // Animation states
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [animatingField, setAnimatingField] = useState<string | null>(null);
  const [animationQueue, setAnimationQueue] = useState<string[]>([]);
  
  // Refs for input fields for animations
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const industryRef = useRef<HTMLInputElement>(null);
  const featuresRef = useRef<HTMLInputElement>(null);

  // Handle website analysis result
  const handleWebsiteAnalysisComplete = (data: any) => {
    // Save original data for animation
    console.log("handleWebsiteAnalysisComplete called with data:", data);
    const updatedValues = { ...storeFormValues };
    
    const fieldUpdates: any = {};
    
    if (data.name) fieldUpdates.name = data.name;
    if (data.description) fieldUpdates.description = data.description;
    if (data.location) fieldUpdates.location = data.location;
    if (data.industry) fieldUpdates.industry = data.industry;
    if (data.features && Array.isArray(data.features)) {
      fieldUpdates.features = data.features.join(', ');
    }
    
    console.log("fieldUpdates:", fieldUpdates);
    
    // Set up the animation queue
    const fieldsToAnimate = Object.keys(fieldUpdates).filter(key =>
      fieldUpdates[key] !== storeFormValues[key as keyof typeof storeFormValues]
    );
    
    console.log("fieldsToAnimate:", fieldsToAnimate);
    
    if (fieldsToAnimate.length > 0) {
      setAnimationQueue(fieldsToAnimate);
      // Start with empty values to show typing animation
      const animationPrep = { ...storeFormValues };
      fieldsToAnimate.forEach(field => {
        animationPrep[field as keyof typeof storeFormValues] = '';
      });
      
      console.log("animationPrep (before setting state):", animationPrep);
      setStoreFormValues(animationPrep);
      
      // Store the final values for animation
      (window as any).finalAnimationValues = fieldUpdates;
      console.log("finalAnimationValues stored:", (window as any).finalAnimationValues);
      
      // Start the animation process
      setIsAnalyzing(true);
    } else {
      console.log("No fields to animate - directly updating form values");
      setStoreFormValues({
        ...storeFormValues,
        ...fieldUpdates
      });
    }
  };

  // Handle opening the analysis modal
  const handleOpenAnalysisModal = () => {
    setIsAnalyzing(true);
    setWebsiteAnalysisModalOpen(true);
    
    // Set maximum timeout of 15 seconds
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 15000);
  };

  // Animation effect for typing animation
  useEffect(() => {
    console.log("Animation effect run with queue:", animationQueue, "animatingField:", animatingField);
    
    if (animationQueue.length === 0 || animatingField !== null) return;
    
    // Start animating the first field in the queue
    const fieldToAnimate = animationQueue[0];
    console.log("Starting animation for field:", fieldToAnimate);
    setAnimatingField(fieldToAnimate);
    
    const finalValue = (window as any).finalAnimationValues?.[fieldToAnimate] || '';
    console.log(`Final value for ${fieldToAnimate}:`, finalValue);
    let currentValue = '';
    let charIndex = 0;
    
    // Get the appropriate element ref
    let fieldRef: any = null;
    switch(fieldToAnimate) {
      case 'name': fieldRef = nameRef; break;
      case 'description': fieldRef = descriptionRef; break;
      case 'location': fieldRef = locationRef; break;
      case 'industry': fieldRef = industryRef; break;
      case 'features': fieldRef = featuresRef; break;
    }
    
    // Add animation classes to the field
    if (fieldRef?.current) {
      console.log(`Adding animation classes to ${fieldToAnimate} field`);
      fieldRef.current.classList.add('animate-field', 'rainbow-border');
    } else {
      console.log(`Ref for ${fieldToAnimate} is null`);
    }
    
    // Start typing animation
    const typingInterval = setInterval(() => {
      if (charIndex < finalValue.length) {
        currentValue += finalValue.charAt(charIndex);
        console.log(`Typing animation: ${fieldToAnimate} = "${currentValue}"`);
        setStoreFormValues(prev => ({
          ...prev,
          [fieldToAnimate]: currentValue
        }));
        charIndex++;
      } else {
        // Animation for this field is complete
        console.log(`Animation complete for ${fieldToAnimate}`);
        clearInterval(typingInterval);
        
        // Remove animation classes after a delay
        setTimeout(() => {
          if (fieldRef?.current) {
            fieldRef.current.classList.remove('animate-field', 'rainbow-border');
          }
          
          // Move to the next field in the queue
          setAnimationQueue(prev => prev.slice(1));
          setAnimatingField(null);
          
          // If all animations are complete, end analyzing state
          if (animationQueue.length <= 1) {
            setTimeout(() => {
              setIsAnalyzing(false);
            }, 500);
          }
        }, 500);
      }
    }, 25); // Speed of typing animation
    
    return () => {
      clearInterval(typingInterval);
    };
  }, [animationQueue, animatingField, setStoreFormValues]);

  // Update form when analyzedData changes
  useEffect(() => {
    if (analyzedData) {
      console.log("analyzedData changed, updating form:", analyzedData);
      const updatedValues = { ...storeFormValues };
      
      if (analyzedData.name) {
        updatedValues.name = analyzedData.name;
      }
      
      if (analyzedData.description) {
        updatedValues.description = analyzedData.description;
      }
      
      if (analyzedData.location) {
        updatedValues.location = analyzedData.location;
      }
      
      if (analyzedData.industry) {
        updatedValues.industry = analyzedData.industry;
      }
      
      if (analyzedData.features && Array.isArray(analyzedData.features)) {
        updatedValues.features = analyzedData.features.join(', ');
      }
      
      setStoreFormValues(updatedValues);
    }
  }, [analyzedData, setStoreFormValues]);
  
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>店舗情報の設定</CardTitle>
        <CardDescription>
          お店の基本情報を入力してください。これによりAIがお客様とより的確なコミュニケーションを取れるようになります。
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleStoreFormSubmit}>
        <CardContent className="space-y-4">
          {storeSubmitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{storeSubmitError}</AlertDescription>
            </Alert>
          )}
          
          {/* ウェブサイト分析セクションを追加 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-sm text-blue-700">
              <p className="font-medium">ホームページから自動入力</p>
              <p>店舗のウェブサイトからAIが自動的に情報を抽出します</p>
            </div>
            <Button 
              type="button" 
              variant="secondary" 
              className="whitespace-nowrap relative"
              onClick={handleOpenAnalysisModal}
              disabled={isAnalyzing || isWebsiteAnalysisLoading}
            >
              <Globe className="mr-2 h-4 w-4" />
              {isAnalyzing || isWebsiteAnalysisLoading ? (
                <>
                  分析中
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                "URLを分析する"
              )}
              {isAnalyzing && (
                <span className="absolute inset-0 animate-pulse bg-blue-300 opacity-20 rounded-md"></span>
              )}
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">店舗名 *</Label>
            <Input
              id="name"
              ref={nameRef}
              value={storeFormValues.name}
              onChange={(e) => setStoreFormValues(prev => ({ ...prev, name: e.target.value }))}
              required
              className={animatingField === 'name' ? 'animate-field rainbow-border' : ''}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="industry">業種</Label>
            <Input
              id="industry"
              ref={industryRef}
              placeholder="例: 飲食店、美容室、小売店"
              value={storeFormValues.industry}
              onChange={(e) => setStoreFormValues(prev => ({ ...prev, industry: e.target.value }))}
              className={animatingField === 'industry' ? 'animate-field rainbow-border' : ''}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">住所・場所</Label>
            <Input
              id="location"
              ref={locationRef}
              placeholder="例: 東京都渋谷区渋谷1-1-1"
              value={storeFormValues.location}
              onChange={(e) => setStoreFormValues(prev => ({ ...prev, location: e.target.value }))}
              className={animatingField === 'location' ? 'animate-field rainbow-border' : ''}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">店舗の説明 *</Label>
            <Textarea
              id="description"
              ref={descriptionRef}
              placeholder="例: 当店は創業30年の老舗ラーメン店で、特製醤油ラーメンが人気です。"
              value={storeFormValues.description}
              onChange={(e) => setStoreFormValues(prev => ({ ...prev, description: e.target.value }))}
              required
              rows={3}
              className={animatingField === 'description' ? 'animate-field rainbow-border' : ''}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="features">特徴・サービス（カンマ区切りで入力）</Label>
            <Input
              id="features"
              ref={featuresRef}
              placeholder="例: Wi-Fi完備, テイクアウト可能, 個室あり"
              value={storeFormValues.features}
              onChange={(e) => setStoreFormValues(prev => ({ ...prev, features: e.target.value }))}
              className={animatingField === 'features' ? 'animate-field rainbow-border' : ''}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="google_place_id">Google Place ID</Label>
            <Input
              id="google_place_id"
              placeholder="例: ChIJN1t_tDeuEmsRUsoyG83frY4"
              value={storeFormValues.google_place_id}
              onChange={(e) => setStoreFormValues(prev => ({ ...prev, google_place_id: e.target.value }))}
            />
            <p className="text-xs text-gray-500">※ Google Maps APIで取得したPlace IDを入力すると、口コミ投稿がしやすくなります</p>
          </div>
          
          {/* Google Place IDの取得方法リンク */}
          <div className="text-xs text-blue-600 flex items-center">
            <a 
              href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center hover:underline"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Google Place IDを調べる方法
            </a>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handlePrevStep}
            disabled={isAnalyzing}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
          <Button 
            type="submit" 
            disabled={isAnalyzing || isStoreSubmitting}
          >
            {isStoreSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                次へ
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </form>
      
      {/* ウェブサイト分析モーダル */}
      <WebsiteAnalysisModal
        isOpen={websiteAnalysisModalOpen}
        onClose={() => {
          setWebsiteAnalysisModalOpen(false);
          setIsAnalyzing(false);
        }}
        onAnalysisComplete={handleWebsiteAnalysisComplete}
      />

      {/* アニメーション用スタイル */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @keyframes pulse-border {
          0%, 100% {
            border-image: linear-gradient(90deg, #f56565, #ed64a6, #9f7aea, #667eea, #48bb78, #38b2ac, #4299e1, #f56565) 1;
            box-shadow: 0 0 10px rgba(66, 153, 225, 0.5);
          }
          50% {
            border-image: linear-gradient(270deg, #f56565, #ed64a6, #9f7aea, #667eea, #48bb78, #38b2ac, #4299e1, #f56565) 1;
            box-shadow: 0 0 15px rgba(66, 153, 225, 0.7);
          }
        }
        
        .animate-field {
          background: linear-gradient(
            90deg, 
            rgba(255, 255, 255, 0) 0%, 
            rgba(255, 255, 255, 0.8) 50%, 
            rgba(255, 255, 255, 0) 100%
          ) !important;
          background-size: 200% 100% !important;
          animation: shimmer 2s infinite !important;
        }
        
        .rainbow-border {
          border-width: 2px !important;
          border-style: solid !important;
          border-image: linear-gradient(45deg, #f56565, #ed64a6, #9f7aea, #667eea, #48bb78, #38b2ac, #4299e1, #f56565) 1 !important;
          animation: pulse-border 2s infinite !important;
        }
      `}</style>
    </Card>
  );
};

export default StoreInfoStep;