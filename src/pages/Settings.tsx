import React, { useState, useEffect } from 'react';
import { useStoreStore } from '../lib/store';
import { updateStoreSettingsApi } from '../lib/api';
import { auth } from '../lib/supabase'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, AlertCircle, Store, User, MapPin, Globe, 
  Check, ExternalLink, Image as ImageIcon
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Settings = () => {
  const { currentStore, updateStore } = useStoreStore();
  const { toast } = useToast();
  
  // Store settings state
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [googlePlaceId, setGooglePlaceId] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  
  // Account settings state
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Form state
  const [isStoreLoading, setIsStoreLoading] = useState(false);
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("store");

  // Load current store data
  useEffect(() => {
    if (currentStore) {
      setName(currentStore.name || '');
      setIndustry(currentStore.industry || '');
      setLocation(currentStore.location || '');
      setGooglePlaceId(currentStore.google_place_id || '');
      setWebsiteUrl(currentStore.website_url || '');
      setIconUrl(currentStore.icon_url || '');
    }
    
    // Get current user email
    auth.getCurrentUser().then(({ user }) => {
      if (user) {
        setEmail(user.email);
      }
    });
  }, [currentStore]);

  // Save store settings
  const handleSaveStoreSettings = async () => {
    setIsStoreLoading(true);
    setStoreError(null);

    try {
      if (!currentStore?.id) {
        throw new Error('店舗IDが見つかりません');
      }

      const updates = {
        name: name.trim(),
        industry: industry.trim(),
        location: location.trim(),
        google_place_id: googlePlaceId.trim(),
        website_url: websiteUrl.trim(),
        icon_url: iconUrl.trim()
      };

      const response = await updateStoreSettingsApi(currentStore.id, updates);

      if (response.success && response.store) {
        updateStore(response.store);
        toast({
          title: "保存完了",
          description: "店舗情報を更新しました",
          variant: "default",
        });
      } else {
        throw new Error(response.error || '設定の更新に失敗しました');
      }
    } catch (error: any) {
      console.error('Store settings update error:', error);
      setStoreError(error.message || '設定の更新に失敗しました');
      toast({
        title: "エラー",
        description: error.message || '設定の更新に失敗しました',
        variant: "destructive",
      });
    } finally {
      setIsStoreLoading(false);
    }
  };

  // Update account password
  const handleUpdatePassword = async () => {
    setIsAccountLoading(true);
    setAccountError(null);

    try {
      // Validate passwords
      if (newPassword !== confirmPassword) {
        throw new Error('新しいパスワードと確認用パスワードが一致しません');
      }
      
      if (newPassword.length < 6) {
        throw new Error('パスワードは6文字以上で入力してください');
      }
      
      if (!currentPassword) {
        throw new Error('現在のパスワードを入力してください');
      }

      // Re-authenticate user
      const { error: signInError } = await auth.signIn(email, currentPassword);
      if (signInError) {
        throw new Error('現在のパスワードが正しくありません');
      }

      // Update password
      const { error: updateError } = await auth.getSession().then(({ session }) => {
        if (!session) {
          throw new Error('セッションが見つかりません');
        }
        // Using supabase client directly to update user
        return auth.supabase.auth.updateUser({ password: newPassword });
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "パスワード更新完了",
        description: "パスワードが正常に更新されました",
      });
      
      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error: any) {
      console.error('Password update error:', error);
      setAccountError(error.message || 'パスワードの更新に失敗しました');
      toast({
        title: "エラー",
        description: error.message || 'パスワードの更新に失敗しました',
        variant: "destructive",
      });
    } finally {
      setIsAccountLoading(false);
    }
  };

  // 画像URLのバリデーション
  const validateImageUrl = (url: string): boolean => {
    if (!url) return true; // Empty is OK
    
    try {
      const validatedUrl = new URL(url);
      return validatedUrl.protocol === "http:" || validatedUrl.protocol === "https:";
    } catch (e) {
      return false;
    }
  };

  if (!currentStore) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-8">アカウント・店舗設定</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="store">店舗情報</TabsTrigger>
          <TabsTrigger value="account">アカウント情報</TabsTrigger>
        </TabsList>

        {/* Store Settings */}
        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Store className="mr-2 h-5 w-5" />
                店舗情報設定
              </CardTitle>
              <CardDescription>お店の基本情報を管理・更新できます</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {storeError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>エラー</AlertTitle>
                  <AlertDescription>{storeError}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">店舗名 *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: 和食処 さくら"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="iconUrl">店舗アイコン画像URL</Label>
                <Input
                  id="iconUrl"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="例: https://example.com/logo.png"
                  type="url"
                />
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <ImageIcon className="h-3.5 w-3.5 mr-1" />
                  <span>店舗アイコンの画像URLを入力してください</span>
                </div>
                {iconUrl && (
                  <div className="mt-2 flex items-center">
                    <div className="w-12 h-12 rounded-full border overflow-hidden mr-3">
                      {validateImageUrl(iconUrl) ? (
                        <img 
                          src={iconUrl} 
                          alt="店舗アイコン" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=Error';
                            toast({
                              title: "画像読み込みエラー",
                              description: "指定されたURLの画像を読み込めませんでした",
                              variant: "destructive",
                            });
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-red-100 flex items-center justify-center text-red-500">
                          <AlertCircle size={16} />
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">プレビュー</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">業種</Label>
                <Input
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="例: 飲食店、美容室、小売店"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">住所・場所</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="例: 東京都渋谷区渋谷1-1-1"
                />
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  <span>住所を入力すると、お客様がお店を見つけやすくなります</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">ウェブサイトURL</Label>
                <Input
                  id="websiteUrl"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="例: https://example.com"
                  type="url"
                />
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Globe className="h-3.5 w-3.5 mr-1" />
                  <span>お店のホームページがあれば入力してください</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="googlePlaceId">Google Place ID</Label>
                <Input
                  id="googlePlaceId"
                  value={googlePlaceId}
                  onChange={(e) => setGooglePlaceId(e.target.value)}
                  placeholder="例: ChIJN1t_tDeuEmsRUsoyG83frY4"
                />
                <div className="flex justify-between items-center text-sm text-gray-500 mt-1">
                  <div className="flex items-center">
                    <Globe className="h-3.5 w-3.5 mr-1" />
                    <span>Google口コミの投稿にリダイレクトするために必要です</span>
                  </div>
                  <a
                    href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 flex items-center hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    <span>確認方法</span>
                  </a>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSaveStoreSettings}
                disabled={isStoreLoading}
                className="ml-auto"
              >
                {isStoreLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    変更を保存
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                アカウント設定
              </CardTitle>
              <CardDescription>メールアドレスとパスワードを管理できます</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {accountError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>エラー</AlertTitle>
                  <AlertDescription>{accountError}</AlertDescription>
                </Alert>
              )}
              
              {/* Email Display */}
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  value={email}
                  readOnly
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500">
                  メールアドレスの変更は現在サポートされていません
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-4">パスワード変更</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">現在のパスワード</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="現在のパスワードを入力"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">新しいパスワード</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="新しいパスワードを入力"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="新しいパスワードを再入力"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleUpdatePassword}
                disabled={isAccountLoading || !currentPassword || !newPassword || !confirmPassword}
                className="ml-auto"
              >
                {isAccountLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    更新中...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    パスワードを更新
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;