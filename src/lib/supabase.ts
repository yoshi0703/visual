// src/lib/supabase.ts
import {
  createClient,
  Session,
  User as SupabaseUser,
  PostgrestError,
  AuthError,
  AuthSessionMissingError,
} from '@supabase/supabase-js';
import { Store, Interview, Message, InterviewStatus } from '../types';

// 環境変数チェック
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 環境変数がない場合はエラー
if (!supabaseUrl) {
  console.error("Critical Error: VITE_SUPABASE_URL environment variable is not defined.");
  throw new Error("VITE_SUPABASE_URL is not defined");
}
if (!supabaseKey) {
  console.error("Critical Error: VITE_SUPABASE_ANON_KEY environment variable is not defined.");
  throw new Error("VITE_SUPABASE_ANON_KEY is not defined");
}

// --- 型定義 (Type Definitions) ---
export interface User {
  id: string;
  email: string;
  name?: string; // Optional name from user metadata
  stripeCustomerId?: string; // Optional Stripe customer ID
  created_at: string; // ISO timestamp string
}

// Re-export types from types/index.ts
export type { Store, Interview, Message, InterviewStatus };

// Supabaseクライアント作成
export const supabase = createClient(supabaseUrl, supabaseKey);

// 後方互換性のために保持
export const supabaseClient = supabase;

// --- Helper Functions ---

/**
 * Transforms a SupabaseUser object into the application's User interface.
 * Returns null if the input SupabaseUser is null.
 */
export const formatUser = (supabaseUser: SupabaseUser | null): User | null => {
  if (!supabaseUser) {
    return null;
  }
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '', // Default empty string if email is null/undefined
    name: supabaseUser.user_metadata?.name, // Safely access optional name
    stripeCustomerId: supabaseUser.user_metadata?.stripe_customer_id, // Include Stripe customer ID if available
    created_at: supabaseUser.created_at,
  };
};

// --- Auth Functions ---
export const auth = {
  /** Signs up a new user with email, password, and optional name */
  async signUp(email: string, password: string, name: string): Promise<{ user: User | null; session: Session | null; error?: AuthError | null }> {
    console.log(`[Auth] Attempting sign up for: ${email}`);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } } // Store name in user_metadata
    });
    if (error) {
      console.error("[Auth] SignUp Error:", error.message);
    }
    return { user: formatUser(data.user), session: data.session, error };
  },

  /** Signs in an existing user using email and password. */
  async signIn(email: string, password: string): Promise<{ user: User | null; session: Session | null; error?: AuthError | null }> {
    console.log(`[Auth] Attempting sign in for: ${email}`);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("[Auth] SignIn Error:", error.message);
    }
    return { user: formatUser(data.user), session: data.session, error };
  },

  /** Signs out the currently authenticated user. */
  async signOut(): Promise<{ error?: AuthError | null }> {
    console.log("[Auth] Signing out current user.");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[Auth] SignOut Error:", error.message);
    }
    return { error };
  },

  /** Retrieves the current user session, if one exists. */
  async getSession(): Promise<{ session: Session | null; error?: AuthError | null }> {
    console.log("[Auth] Getting current session.");
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.error("[Auth] GetSession Error:", error.message);
    }
    return { session: data.session, error };
  },

  /** Fetches the currently authenticated user details. Handles session missing gracefully. */
  async getCurrentUser(): Promise<{ user: User | null; error?: AuthError | null }> {
    console.log("[Auth] Getting current user details.");
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error instanceof AuthSessionMissingError) {
      console.warn("[Auth] No active session found (AuthSessionMissingError). Returning null user.");
      return { user: null, error: null };
    }
    if (error) {
      console.error("[Auth] GetUser Error:", error.message);
      return { user: null, error };
    }
    return { user: formatUser(user), error: null };
  },

  /** Subscribes to authentication state changes */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    console.log("[Auth] Subscribing to authentication state changes.");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return { subscription };
  },

  /** [Client-Side Mock] Simulates user deletion. */
  async deleteUser(userId: string): Promise<{ error?: Error | null }> {
    try {
      console.warn(`[Auth Mock] deleteUser called for user ID: ${userId}. Client-side mock only.`);
      console.warn("[Auth Mock] Implement actual deletion via a secure server function.");
      return { error: null };
    } catch (error: any) {
      console.error("[Auth Mock] Error in mock deleteUser:", error);
      return { error };
    }
  }
};

// --- Store Functions ---
export const stores = {
  /**
   * 新しいストアを作成する
   */
  createStore: async (storeData: Omit<Store, 'id' | 'created_at' | 'updated_at' | 'owner_id'>): Promise<{ data: Store | null; error: PostgrestError | null }> => {
    console.log("[stores.createStore] Creating store, relying on RLS and triggers for owner_id");
    return supabase.from('stores').insert(storeData).select('*').single();
  },

  /**
   * 明示的にowner_idを設定してストアを作成
   */
  createStoreWithOwner: async (storeData: Omit<Store, 'id' | 'created_at' | 'updated_at'> & { owner_id: string }): Promise<{ data: Store | null; error: PostgrestError | null }> => {
    console.log("[stores.createStoreWithOwner] Creating store with explicit owner_id:", storeData.owner_id);
    return supabase.from('stores').insert(storeData).select('*').single();
  },

  /**
   * ストア情報を更新する
   */
  updateStore: async (id: string, updates: Partial<Omit<Store, 'id' | 'created_at' | 'owner_id'>>): Promise<{ data: Store | null; error: PostgrestError | null }> => {
    console.log(`[Stores] Updating store with ID: ${id}`);
    const updatePayload = { ...updates, updated_at: new Date().toISOString() };
    return supabase.from('stores').update(updatePayload).eq('id', id).select('*').single();
  },

  /**
   * 所有者IDに基づいてストアを取得
   */
  getStoreByOwner: async (ownerId: string): Promise<{ data: Store | null; error: PostgrestError | null }> => {
    console.log(`[Stores] Getting store by owner_id: ${ownerId}`);
    return supabase.from('stores').select('*').eq('owner_id', ownerId).maybeSingle();
  },

  /**
   * ストアIDに基づいてストアを取得
   */
  getStoreById: async (id: string): Promise<{ data: Store | null; error: PostgrestError | null }> => {
    console.log(`[Stores] Getting store by ID: ${id}`);
    return supabase.from('stores').select('*').eq('id', id).single();
  },

  /**
   * ストアを削除する
   */
  deleteStore: async (id: string): Promise<{ error: PostgrestError | null }> => {
    console.log(`[Stores] Deleting store with ID: ${id}`);
    const { error } = await supabase.from('stores').delete().eq('id', id);
    if (error) {
        console.error(`[Stores] Error deleting store ${id}:`, error.message);
    }
    return { error };
  }
};

// --- Interview Functions ---
export const interviews = {
  /**
   * 新しいインタビューを開始する
   */
  createInterview: async (storeId: string, welcomeMessage?: string): Promise<{ data: Interview | null; error: PostgrestError | null }> => {
    console.log(`[Interviews] Creating new interview for store ID: ${storeId}`);
    const initialConversation: Message[] = welcomeMessage
      ? [{ role: 'bot', text: welcomeMessage, timestamp: new Date().toISOString() }]
      : [];

    const interviewData = {
      store_id: storeId,
      status: 'active' as InterviewStatus, 
      conversation: initialConversation,
    };
    return supabase.from('interviews').insert(interviewData).select('*').single();
  },

  /**
   * インタビューにメッセージを追加する
   */
  addMessage: async (interviewId: string, message: Omit<Message, 'timestamp'>): Promise<{ data: Interview | null; error: PostgrestError | null }> => {
    console.log(`[Interviews] Adding ${message.role} message to interview ID: ${interviewId}`);

    // 1. 現在の会話を取得
    const { data: currentInterview, error: getError } = await supabase
      .from('interviews')
      .select('conversation')
      .eq('id', interviewId)
      .single();

    if (getError || !currentInterview) {
      const errorMsg = getError?.message ?? 'Interview not found';
      console.error(`[Interviews][addMessage] Failed to get interview ${interviewId}:`, errorMsg);
      const error = getError ?? new PostgrestError({ message: "Interview not found", details: `ID: ${interviewId}`, hint: "", code: "PGRST116" });
      return { data: null, error };
    }

    // 2. 新しいメッセージを準備
    const newMessage: Message = {
      ...message,
      timestamp: new Date().toISOString()
    };

    // 3. 既存の会話に追加
    const updatedConversation: Message[] = [
      ...(currentInterview.conversation || []),
      newMessage
    ];

    // 4. インタビューレコードを更新
    return supabase
      .from('interviews')
      .update({
        conversation: updatedConversation,
        updated_at: new Date().toISOString()
      })
      .eq('id', interviewId)
      .select('*')
      .single();
  },

  /**
   * インタビューを完了状態にする
   */
  completeInterview: async (interviewId: string, reviewText: string, rating: number): Promise<{ data: Interview | null; error: PostgrestError | null }> => {
    console.log(`[Interviews] Completing interview ID: ${interviewId} with rating: ${rating}`);
    const updates = {
      status: 'completed' as InterviewStatus,
      generated_review: reviewText,
      rating: rating,
      updated_at: new Date().toISOString()
    };
    return supabase
      .from('interviews')
      .update(updates)
      .eq('id', interviewId)
      .select('*')
      .single();
  },

  /**
   * インタビューの評価のみを更新する
   */
  updateInterviewRating: async (interviewId: string, rating: number): Promise<{ data: Interview | null; error: PostgrestError | null }> => {
      console.log(`[Interviews] Updating rating for interview ID: ${interviewId} to ${rating}`);
      const updates = {
        rating: rating,
        updated_at: new Date().toISOString()
      };
      return await supabase.from('interviews').update(updates).eq('id', interviewId).select('*').single();
  },

  /**
   * ストアIDに基づいてインタビューリストを取得
   */
  getInterviewsByStore: async (storeId: string, limit: number = 20, offset: number = 0): Promise<{ data: Interview[] | null; error: PostgrestError | null; count: number | null }> => {
    console.log(`[Interviews] Getting interviews for store ID: ${storeId} (Limit: ${limit}, Offset: ${offset})`);
    return supabase
      .from('interviews')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
  },

  /**
   * 完了したインタビューのみを取得
   */
  getCompletedInterviews: async (storeId: string, limit: number = 100): Promise<{ data: Interview[] | null; error: PostgrestError | null; count: number | null }> => {
    console.log(`[Interviews] Getting completed interviews for store ID: ${storeId} (Limit: ${limit})`);
    return supabase
      .from('interviews')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit);
  },

  /**
   * インタビューIDに基づいて単一のインタビューを取得
   */
  getInterviewById: async (id: string): Promise<{ data: Interview & { stores: Store } | null; error: PostgrestError | null }> => {
    console.log(`[Interviews] Getting interview by ID: ${id}`);
    return supabase.from('interviews').select('*, stores(*)').eq('id', id).single();
  }
};

// Export the initialized Supabase client as the default export
export default supabase;