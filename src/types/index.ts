// src/types/index.ts
// 共通の型定義をここにまとめる
// ユーザー情報の型
export interface User {
  id: string;
  email: string;
  name?: string; // ユーザーのメタデータから取得される名前（オプション）
  stripeCustomerId?: string; // Stripe顧客ID（オプション）
  created_at: string; // ISO形式のタイムスタンプ文字列
}

// 店舗情報の型
export interface Store {
  id: string; // プライマリーキー (UUID)
  owner_id: string; // auth.usersテーブルを参照する外部キー
  name: string; // 店舗名
  website_url?: string | null; // オプションのウェブサイトURL
  description?: string | null; // オプションの店舗説明
  features?: string[] | null; // オプションの機能またはタグのリスト
  location?: string | null; // 店舗の場所のテキスト表現
  google_place_id?: string | null; // Google Places APIからの識別子
  place_id?: string | null; // 別の場所識別子（google_place_idと異なる目的がある場合は維持）
  industry?: string | null; // 店舗の業種やカテゴリ
  ai_tone?: string | null; // AI生成コンテンツの好みのトーン
  welcome_message?: string | null; // インタビューのデフォルトウェルカムメッセージ
  thanks_message?: string | null; // インタビュー/レビュー完了後に表示されるメッセージ
  coupon_type?: string | null; // 提供されるクーポンのタイプ（例：'percentage'、'fixed'、'free_item'）
  coupon_value?: number | null; // 'percentage'または'fixed'クーポンの数値
  coupon_free_item_desc?: string | null; // 'free_item'クーポンの説明
  plan_id?: string | null; // 関連するサブスクリプションプランの識別子
  qr_code_url?: string | null; // 店舗のQRコード画像へのURL
  interview_url?: string | null; // インタビューを開始するための特定のURL
  subscription_status?: string | null; // サブスクリプションのステータス
  subscription_ends_at?: string | null; // サブスクリプションの終了時期
  stripe_customer_id?: string | null; // Stripeの顧客ID
  icon_url?: string | null; // 店舗のカスタムアイコン画像へのURL
  created_at: string; // 作成日時のISO形式文字列
  updated_at?: string | null; // 最終更新のISO形式文字列
}

// メッセージの型
export interface Message {
  role: 'bot' | 'user'; // メッセージの送信者
  text: string; // メッセージの内容
  timestamp: string; // ISO 8601形式のタイムスタンプ文字列
}

// インタビューのステータスタイプ
export type InterviewStatus = 'active' | 'completed' | 'error' | string; // 柔軟性のために文字列も許可

// インタビュー情報の型
export interface Interview {
  id: string; // プライマリーキー (UUID)
  store_id: string; // storesテーブルを参照する外部キー
  status: InterviewStatus; // インタビューの現在のステータス
  rating?: number; // 完了後のユーザー評価（例：1-5）
  conversation: Message[]; // インタビュー内のメッセージの配列
  generated_review?: string; // 会話に基づいて生成されたレビューテキスト
  created_at: string; // 作成日時のISO形式文字列
  updated_at?: string | null; // 最終更新のISO形式文字列
}

// ウェブサイト分析関連の型定義
// ウェブサイトから抽出されたデータの型
export interface WebsiteExtractedData {
  name?: string;          // 抽出された店舗名
  description?: string;   // 抽出された店舗説明
  location?: string;      // 抽出された住所・場所
  features?: string[];    // 抽出された特徴・キーワード
}

// ウェブサイト分析APIレスポンスの型
export interface WebsiteAnalysisResponse {
  success: boolean;                     // 分析が成功したかどうか
  extractedData?: WebsiteExtractedData; // 抽出されたデータ
  error?: string;                       // エラーメッセージ（失敗時）
  message?: string;                     // 成功/失敗メッセージ
  store?: Store;                        // 更新された店舗情報
  details?: AnalysisDetails;            // 分析の詳細情報
  logs?: string[];                      // 処理ログ
}

// AIチャットレスポンスの型
export interface ChatResponseData {
  success: boolean;
  message?: string; 
  error?: string;
  isCompleted?: boolean;
  topicOptions?: string[]; // トピック選択肢
}

// レビュー生成APIレスポンスの型
export interface ReviewGenerationResponse {
  success: boolean;
  reviewText?: string;
  error?: string;
}

// Jina AI関連の型定義
// Jina ReaderのAPIレスポンスの型
export interface JinaReaderResponse {
  success: boolean;       // 成功したかどうか
  url: string;            // 処理されたURL
  title: string;          // ページのタイトル
  content: string;        // 抽出されたコンテンツ（マークダウン形式）
  timestamp?: string;     // タイムスタンプ（あれば）
  error?: string;         // エラーメッセージ（失敗時）
}

// 信頼度スコアの型
export interface ConfidenceScores {
  name: number;           // 店舗名の信頼度
  description: number;    // 説明の信頼度
  features: number;       // 特徴の信頼度
  location: number;       // 住所の信頼度
}

// 代替情報源の型
export interface AlternativeSource {
  name: string;           // 代替情報源の名前
  source: string;         // 情報源のタイプ（例：Google Maps, 食べログ）
  url: string;            // 情報源のURL
  confidence?: number;    // 信頼度スコア（オプション）
}

// 分析の詳細情報の型
export interface AnalysisDetails {
  fallback?: boolean;           // フォールバックメカニズムが使用されたか
  bytesAnalyzed?: number;       // 分析されたバイト数
  url?: string;                 // 分析されたURL
  method?: string;              // 使用された方法（例：'jina', 'direct', 'complete_fallback'）
  aiConfidence?: number;        // AI抽出の全体的な信頼度
  processingTime?: number;      // 処理時間（ミリ秒）
  sourceType?: string;          // ソースタイプ（例：'html', 'pdf', 'text'）
}

// 分析処理ステージの型
export interface AnalysisStage {
  stage: string;                // ステージ名
  message: string;              // 表示メッセージ
  progress: number;             // 進行度（0-100）
}

// 分析履歴エントリの型
export interface AnalysisHistoryEntry {
  url: string;                  // 分析されたURL
  timestamp: Date;              // 分析時刻
  status: 'processing' | 'completed' | 'failed';  // 状態
  data?: WebsiteExtractedData;  // 抽出データ（成功時）
  error?: string;               // エラーメッセージ（失敗時）
}

// Jina AI検索オプションの型
export interface JinaSearchOptions {
  timeout?: number;                // タイムアウト時間（ミリ秒）
  withGeneratedAlt?: boolean;      // 画像のalt属性を生成するか
  withLinksButtons?: boolean;      // リンクとボタンのセクションを含めるか
  withImagesSummary?: boolean;     // 画像のサマリーを含めるか
  processingLevel?: 'basic' | 'standard' | 'enhanced';  // 処理レベル
  browserEngine?: 'direct' | 'headless' | 'static';     // ブラウザエンジン
}