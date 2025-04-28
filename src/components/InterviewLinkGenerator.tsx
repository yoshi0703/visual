import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { interviews } from '@/lib/supabase';
import { QrCode, Loader2, Copy, Check, Share2, ExternalLink, AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { useToast } from './ui/use-toast';

interface InterviewLinkGeneratorProps {
  storeId: string;
  welcomeMessage?: string;
}

const InterviewLinkGenerator: React.FC<InterviewLinkGeneratorProps> = ({
  storeId,
  welcomeMessage
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [interviewUrl, setInterviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Generate new interview link
  const generateInterviewLink = async () => {
    if (!storeId) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Create a new interview
      const { data, error } = await interviews.createInterview(storeId, welcomeMessage);
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error('インタビューの作成に失敗しました');
      }
      
      // Get the base URL from environment or current origin
      const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
      
      // Construct the interview URL
      const newUrl = `${baseUrl}/interview/${data.id}`;
      setInterviewUrl(newUrl);
      
      toast({
        title: "新しいインタビューリンクを作成しました",
        description: "このリンクを共有して回答を集めることができます",
      });
    } catch (err: any) {
      console.error('Interview creation error:', err);
      setError(err.message || 'インタビューの作成に失敗しました');
      
      toast({
        title: "エラー",
        description: err.message || 'インタビューの作成に失敗しました',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Copy interview link to clipboard
  const copyInterviewLink = async () => {
    if (!interviewUrl) return;
    
    try {
      await navigator.clipboard.writeText(interviewUrl);
      setIsLinkCopied(true);
      
      // Reset the "copied" status after 2 seconds
      setTimeout(() => {
        setIsLinkCopied(false);
      }, 2000);
      
      toast({
        title: "コピーしました",
        description: "インタビューリンクがクリップボードにコピーされました",
      });
    } catch (err) {
      console.error('Clipboard error:', err);
      
      toast({
        title: "エラー",
        description: "クリップボードへのコピーに失敗しました",
        variant: "destructive",
      });
    }
  };
  
  // Share interview link (mobile only)
  const shareInterviewLink = async () => {
    if (!interviewUrl || !navigator.share) return;
    
    try {
      await navigator.share({
        title: 'インタビューのお願い',
        text: 'この度は弊店をご利用いただき、誠にありがとうございます。以下のリンクから簡単なインタビューにご協力いただけますと幸いです。',
        url: interviewUrl
      });
      
      toast({
        title: "シェアしました",
        description: "インタビューリンクを共有しました",
      });
    } catch (err) {
      console.error('Share error:', err);
      
      // User may have cancelled sharing, don't show error toast in that case
      if (err instanceof Error && err.name !== 'AbortError') {
        toast({
          title: "エラー",
          description: "リンクの共有に失敗しました",
          variant: "destructive",
        });
      }
    }
  };
  
  // Open the interview link
  const openInterviewLink = () => {
    if (!interviewUrl) return;
    window.open(interviewUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <QrCode className="mr-2 h-5 w-5"/>
          新規インタビューリンク
        </CardTitle>
        <CardDescription>
          新しいインタビューを作成して直接共有することができます
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {interviewUrl ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Input 
                value={interviewUrl} 
                readOnly 
                className="bg-blue-50"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button 
                size="icon" 
                variant="outline" 
                onClick={copyInterviewLink}
                className="flex-shrink-0"
              >
                {isLinkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            <p className="text-xs text-gray-500">
              このリンクを顧客に直接共有して、インタビューに参加してもらうことができます。
            </p>
            
            <div className="flex space-x-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-grow"
                onClick={openInterviewLink}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                プレビュー
              </Button>
              
              {/* Only show Share button on devices that support Web Share API */}
              {typeof navigator !== 'undefined' && navigator.share && (
                <Button 
                  variant="outline"
                  size="sm"
                  className="flex-grow"
                  onClick={shareInterviewLink}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  共有
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 bg-gray-50 rounded-lg">
            <QrCode className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-1">新しいインタビューリンクを作成できます</p>
            <p className="text-xs text-gray-500">リンクはQRコードを読み取れないお客様に直接共有できます</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={generateInterviewLink} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : interviewUrl ? (
            <>新しいリンクを再生成</>
          ) : (
            <>インタビューリンクを生成</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InterviewLinkGenerator;