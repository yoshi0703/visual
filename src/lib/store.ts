// src/lib/store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { auth, type User, type Store, type Interview } from './supabase';
import { supabase } from './supabase';

// --- 認証状態ストア ---
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  resetAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true, // 初期ロード中は true
      error: null,
      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false, error: null }),
      setError: (error) => set({ error, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      // 修正: ログアウト時にローカルストレージもクリア
      resetAuth: () => {
        // supabase.auth.signOut()を実行（オプション）
        try {
          auth.signOut().catch((err: any) => console.error('Sign out error:', err));
        } catch (e) {
          console.error('Failed to sign out:', e);
        }
        
        // ローカルストレージもクリア
        try {
          // Auth関連の項目を削除
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          if (supabaseUrl) {
            const storageKey = 'sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token';
            localStorage.removeItem(storageKey);
          }
          
          // 他のAuth関連Storage項目も削除
          localStorage.removeItem('auth-storage');
          localStorage.removeItem('selectedPlanId');
          localStorage.removeItem('checkoutStarted');
        } catch (e) {
          console.error('Failed to clear localStorage:', e);
        }
        
        // 状態をリセット
        set({ user: null, isAuthenticated: false, isLoading: false, error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
          // 再読み込み時に isLoading を true に戻すなど
          if (state) state.isLoading = true;
       }
    }
  )
);

// --- 店舗状態ストア ---
interface StoreState {
  currentStore: Store | null;
  isLoading: boolean; // 店舗情報取得・更新中フラグ
  error: string | null;
  setStore: (store: Store | null) => void;
  updateStore: (updates: Partial<Omit<Store, 'id' | 'created_at' | 'owner_id'>>) => void; // 部分更新用アクション
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  resetStore: () => void;
  updateSubscription: (planId: string, subscriptionStatus: string) => void;
}

export const useStoreStore = create<StoreState>()(
  persist(
    (set, get) => ({
      currentStore: null,
      isLoading: false, // 初期状態は false に変更 (必要に応じて useEffect で true に)
      error: null,
      setStore: (store) => set({ currentStore: store, isLoading: false, error: null }),
      updateStore: (updates) => {
        const current = get().currentStore;
        if (current) {
          console.log("Updating store with:", updates);
          set({
            currentStore: {
                ...current,
                ...updates,
                updated_at: new Date().toISOString() // 更新日時をクライアント側で設定
            },
            isLoading: false,
            error: null
          });
        } else {
          console.warn("updateStore called but currentStore is null.");
          set({ error: "更新対象の店舗情報が見つかりません。", isLoading: false });
        }
      },
      setError: (error) => set({ error, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      resetStore: () => set({ currentStore: null, isLoading: false, error: null }),
      // プランと購読状態を更新する専用メソッド
      updateSubscription: (planId, subscriptionStatus = 'active') => {
        const current = get().currentStore;
        if (current) {
          console.log(`[StoreStore] プラン(${planId})と購読状態(${subscriptionStatus})を更新`);
          set({
            currentStore: {
              ...current,
              plan_id: planId,
              subscription_status: subscriptionStatus,
              updated_at: new Date().toISOString()
            },
            isLoading: false,
            error: null
          });
        } else {
          console.warn("[StoreStore] プラン更新が呼び出されましたが、currentStore は null です");
          set({ error: "更新対象の店舗情報が見つかりません。", isLoading: false });
        }
      }
    }),
    {
      name: 'store-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currentStore: state.currentStore }),
    }
  )
);

// --- インタビュー状態ストア ---
interface InterviewState {
  currentInterview: Interview | null;
  storeInterviews: Interview[];
  isLoading: boolean;
  error: string | null;
  setCurrentInterview: (interview: Interview | null) => void;
  setStoreInterviews: (interviews: Interview[]) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  resetInterview: () => void;
}

export const useInterviewStore = create<InterviewState>()((set) => ({
  currentInterview: null,
  storeInterviews: [],
  isLoading: false,
  error: null,
  setCurrentInterview: (interview) => set({ currentInterview: interview, isLoading: false, error: null }),
  setStoreInterviews: (interviews) => set({ storeInterviews: interviews, isLoading: false, error: null }),
  setError: (error) => set({ error, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  resetInterview: () => set({ currentInterview: null, storeInterviews: [], isLoading: false, error: null }),
}));