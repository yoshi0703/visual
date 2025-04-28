/*
  # Kuchitoru RLS Policy Fix Migration
  
  ## 目的:
  - 既存の厳格な RLS ポリシーを修正し、ユーザー登録フローを改善
  - トリガーによる owner_id の自動設定機能を追加
  - デバッグとトラブルシューティングのための拡張機能を追加
  
  ## 変更点:
  1. 既存のストア作成ポリシーを削除
  2. より柔軟なストア作成ポリシーを追加
  3. owner_id を自動設定するトリガーを追加
  4. サービスロール用のポリシーを更新
  5. デバッグ用のログ機能を追加
*/

-- セクション 1: 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can create their own stores" ON public.stores;

-- セクション 2: より柔軟な新しい RLS ポリシーを追加
-- このポリシーは2つのケースに対応:
-- 1) owner_id が明示的に auth.uid() に設定される場合
-- 2) owner_id が NULL で、トリガーによって自動設定される場合
CREATE POLICY "Users can create stores with flexible ownership" 
  ON public.stores FOR INSERT 
  WITH CHECK (
    -- ユーザーが認証されていることが必須
    auth.uid() IS NOT NULL
    AND (
      -- owner_id が明示的に指定され、現在のユーザーと一致する場合
      owner_id = auth.uid()
      -- または owner_id が NULL の場合 (トリガーで自動設定される)
      OR owner_id IS NULL
    )
  );

-- セクション 3: owner_id を自動設定するトリガー関数を作成
CREATE OR REPLACE FUNCTION public.set_owner_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- owner_id が NULL の場合のみ設定
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーが存在しない場合は作成
DROP TRIGGER IF EXISTS set_owner_id_on_insert ON public.stores;
CREATE TRIGGER set_owner_id_on_insert
BEFORE INSERT ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.set_owner_id_on_insert();

-- セクション 4: サービスロール用のポリシーを作成/更新
DROP POLICY IF EXISTS "Service role can create any store" ON public.stores;
CREATE POLICY "Service role can create any store"
  ON public.stores FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can manage all stores" ON public.stores;
CREATE POLICY "Service role can manage all stores"
  ON public.stores
  USING (auth.jwt() ->> 'role' = 'service_role');

-- セクション 5: 店舗テーブルの owner_id カラムの制約チェック (コメントアウト)
-- 外部キー制約が存在しない場合は、必要に応じて以下をコメント解除して実行
-- ALTER TABLE public.stores ADD CONSTRAINT stores_owner_id_fkey 
-- FOREIGN KEY (owner_id) REFERENCES auth.users(id);

-- セクション 6: デバッグとトラブルシューティングのための拡張機能
CREATE TABLE IF NOT EXISTS public.auth_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- RLS設定
ALTER TABLE IF EXISTS public.auth_logs ENABLE ROW LEVEL SECURITY;

-- サービスロールアクセスポリシー
DROP POLICY IF EXISTS "Service role can access all auth logs" ON public.auth_logs;
CREATE POLICY "Service role can access all auth logs"
  ON public.auth_logs
  USING (auth.jwt() ->> 'role' = 'service_role');
  
-- ログインユーザーが自分のログを見られるポリシー
DROP POLICY IF EXISTS "Users can see their own auth logs" ON public.auth_logs;
CREATE POLICY "Users can see their own auth logs"
  ON public.auth_logs FOR SELECT
  USING (user_id = auth.uid());

-- セクション 7: 認証イベントログ用の関数とトリガー (特権が必要なためコメントアウト)
/*
CREATE OR REPLACE FUNCTION auth.log_auth_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.auth_logs (event_type, user_id, metadata)
  VALUES (
    TG_ARGV[0], 
    NEW.id, 
    jsonb_build_object(
      'email', NEW.email,
      'last_sign_in_at', NEW.last_sign_in_at,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_signup_event ON auth.users;
CREATE TRIGGER log_signup_event
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auth.log_auth_event('signup');

DROP TRIGGER IF EXISTS log_signin_event ON auth.users;
CREATE TRIGGER log_signin_event
AFTER UPDATE OF last_sign_in_at ON auth.users
FOR EACH ROW
WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
EXECUTE FUNCTION auth.log_auth_event('signin');
*/