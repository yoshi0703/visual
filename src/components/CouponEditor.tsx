import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { saveCouponSettingsApi } from '@/lib/api';
import { useStoreStore } from '@/lib/store';
import { Gift, Check, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { useToast } from './ui/use-toast';

interface CouponEditorProps {
  storeId: string;
  initialCouponType: string | null;
  initialCouponValue: number | string | null;
  initialFreeItemDesc: string | null;
  onSuccess?: (newSettings: any) => void;
}

const CouponEditor: React.FC<CouponEditorProps> = ({
  storeId,
  initialCouponType,
  initialCouponValue,
  initialFreeItemDesc,
  onSuccess
}) => {
  const { updateStore } = useStoreStore();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [couponType, setCouponType] = useState<string | null>(initialCouponType);
  const [couponValue, setCouponValue] = useState<string | number | null>(initialCouponValue);
  const [freeItemDesc, setFreeItemDesc] = useState<string | null>(initialFreeItemDesc);

  // Update local state when props change
  useEffect(() => {
    setCouponType(initialCouponType);
    setCouponValue(initialCouponValue);
    setFreeItemDesc(initialFreeItemDesc);
  }, [initialCouponType, initialCouponValue, initialFreeItemDesc]);

  // Display text for coupon
  const couponDisplay = () => {
    if (!couponType) return '未設定';
    if (couponType === 'percent') return `${couponValue}% OFF`;
    if (couponType === 'fixed') return `¥${Number(couponValue).toLocaleString('ja-JP')} 割引`;
    if (couponType === 'free_item') return freeItemDesc || '無料サービス';
    return '未設定';
  };

  // Handle coupon type change
  const handleCouponTypeChange = (value: string) => {
    // Convert 'none' to null for API consistency
    const newType = value === 'none' ? null : value;
    setCouponType(newType);
    
    // Reset other values based on type
    if (newType === 'free_item') {
      setCouponValue(null);
    } else if (newType === 'percent' && (!couponValue || typeof couponValue === 'string' && isNaN(parseFloat(couponValue)))) {
      setCouponValue(10); // Default percent value
    } else if (newType === 'fixed' && (!couponValue || typeof couponValue === 'string' && isNaN(parseFloat(couponValue)))) {
      setCouponValue(500); // Default fixed value
    } else if (newType === null) {
      setCouponValue(null);
      setFreeItemDesc(null);
    }
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Validate
      if (couponType === 'percent' || couponType === 'fixed') {
        const numValue = typeof couponValue === 'string' 
          ? parseFloat(couponValue) 
          : couponValue;
          
        if (isNaN(numValue as number) || numValue === null) {
          throw new Error('有効な数値を入力してください');
        }
        
        if (couponType === 'percent' && (numValue < 1 || numValue > 100)) {
          throw new Error('割引率は1〜100の間で指定してください');
        }
        
        if (couponType === 'fixed' && numValue < 0) {
          throw new Error('割引額は0以上で指定してください');
        }
      }
      
      if (couponType === 'free_item' && (!freeItemDesc || freeItemDesc.trim() === '')) {
        throw new Error('無料サービスの内容を入力してください');
      }
      
      // Process coupon value for API
      let processedValue = couponValue;
      if (typeof processedValue === 'string' && (couponType === 'percent' || couponType === 'fixed')) {
        processedValue = parseFloat(processedValue);
        if (isNaN(processedValue)) processedValue = null;
      }
      
      // Prepare settings object
      const settings = {
        coupon_type: couponType,
        coupon_value: processedValue,
        coupon_free_item_desc: freeItemDesc
      };
      
      console.log("Saving coupon settings:", settings);

      // Call API
      const response = await saveCouponSettingsApi(storeId, settings);
      
      if (!response.success) {
        throw new Error(response.error || '保存に失敗しました');
      }
      
      console.log("Coupon save response:", response);
      
      // Update store in local state
      if (response.store) {
        console.log("Updating store with new data:", response.store);
        updateStore(response.store);
      }
      
      // Notify success
      toast({
        title: "保存完了",
        description: "お礼クーポンの設定を保存しました",
      });
      
      // Call success callback
      if (onSuccess) {
        onSuccess(settings);
      }
      
      // Exit edit mode
      setIsEditing(false);
      
    } catch (err: any) {
      console.error('Coupon save error:', err);
      setError(err.message || '保存中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    // Reset to initial values
    setCouponType(initialCouponType);
    setCouponValue(initialCouponValue);
    setFreeItemDesc(initialFreeItemDesc);
    setIsEditing(false);
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Gift className="mr-2 h-5 w-5"/>お礼クーポン</CardTitle>
        <CardDescription>インタビュー協力のお礼として提供する特典</CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>エラー</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="coupon-type">クーポンタイプ</Label>
              <Select
                value={couponType || 'none'}
                onValueChange={handleCouponTypeChange}
              >
                <SelectTrigger id="coupon-type">
                  <SelectValue placeholder="クーポンタイプを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未設定</SelectItem>
                  <SelectItem value="percent">割引率（%）</SelectItem>
                  <SelectItem value="fixed">固定金額（円）</SelectItem>
                  <SelectItem value="free_item">無料サービス</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(couponType === 'percent' || couponType === 'fixed') && (
              <div className="space-y-2">
                <Label htmlFor="coupon-value">
                  {couponType === 'percent' ? '割引率 (%)' : '割引額 (円)'}
                </Label>
                <Input
                  id="coupon-value"
                  type="number"
                  value={couponValue || ''}
                  onChange={(e) => setCouponValue(e.target.value)}
                  placeholder={couponType === 'percent' ? '例: 10' : '例: 500'}
                  min={couponType === 'percent' ? 1 : 0}
                  max={couponType === 'percent' ? 100 : undefined}
                />
                {couponType === 'percent' && (
                  <p className="text-xs text-gray-500">1〜100の間で指定してください</p>
                )}
              </div>
            )}
            
            {couponType === 'free_item' && (
              <div className="space-y-2">
                <Label htmlFor="free-item-desc">無料サービスの内容</Label>
                <Input
                  id="free-item-desc"
                  value={freeItemDesc || ''}
                  onChange={(e) => setFreeItemDesc(e.target.value)}
                  placeholder="例: ドリンク1杯無料サービス"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="border-dashed border-2 border-blue-300 rounded-md p-4 text-center bg-blue-50 shadow-sm">
            <Gift className="h-8 w-8 mx-auto text-blue-500 mb-2"/>
            <p className="font-bold text-lg text-blue-600">{couponDisplay()}</p>
            <p className="text-xs text-gray-500 mt-1">
              {couponType ? '(インタビュー協力特典)' : '特典は設定されていません'}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSaving}
            >
              キャンセル
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  保存
                </>
              )}
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            編集
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default CouponEditor;