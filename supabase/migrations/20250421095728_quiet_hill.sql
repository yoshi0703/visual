-- supabase/migrations/20250422000000_add_feedback_table.sql
-- インタビューフィードバックテーブルとサポート機能を追加

-- テーブル存在確認関数
CREATE OR REPLACE FUNCTION public.check_table_exists(p_table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables AS t
    WHERE t.table_schema = 'public'
    AND t.table_name = p_table_name
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$;

-- フィードバックテーブル作成関数
CREATE OR REPLACE FUNCTION public.create_feedback_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- テーブルが存在しない場合のみ作成
  IF NOT (SELECT public.check_table_exists('interview_feedback')) THEN
    -- テーブル作成
    CREATE TABLE public.interview_feedback (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      interview_id uuid NOT NULL REFERENCES public.interviews(id),
      feedback_text text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- RLS設定
    ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;

    -- ポリシー作成
    CREATE POLICY "Store owners can access their interview feedback"
      ON public.interview_feedback
      USING (
        interview_id IN (
          SELECT id FROM public.interviews
          WHERE store_id IN (
            SELECT id FROM public.stores 
            WHERE owner_id = auth.uid()
          )
        )
      );

    -- 誰でも作成できるポリシー
    CREATE POLICY "Anyone can create interview feedback"
      ON public.interview_feedback FOR INSERT
      WITH CHECK (true);
      
    -- サービスロール用ポリシー
    CREATE POLICY "Service role can manage all feedback"
      ON public.interview_feedback
      USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END;
$$;

-- 実際にテーブルを作成（マイグレーション時にのみ実行）
SELECT public.create_feedback_table();