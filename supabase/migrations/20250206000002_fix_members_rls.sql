-- メンバーテーブルのRLS修正
-- 作成日: 2025年8月6日
-- 目的: メンバー認証とアクセス権限の問題を解決

-- 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Members can view their own data" ON members;
DROP POLICY IF EXISTS "Executives can view all members" ON members;
DROP POLICY IF EXISTS "Admin can manage all members" ON members;
DROP POLICY IF EXISTS "Members can update their own data" ON members;
DROP POLICY IF EXISTS "Executives can update all members" ON members;

-- RLSを一時的に無効化してテスト
ALTER TABLE members DISABLE ROW LEVEL SECURITY;

-- 新しいRLSポリシーを作成（より包括的）
CREATE POLICY "allow_member_authentication" ON members
  FOR SELECT 
  USING (true);

CREATE POLICY "allow_member_updates" ON members
  FOR UPDATE 
  USING (
    auth.uid()::text = id OR 
    (SELECT role FROM members WHERE auth.uid()::text = id AND is_active = true) = 'executive' OR
    auth.uid()::text IN (SELECT id FROM members WHERE email = 'queue@queue-tech.jp' AND is_active = true)
  );

CREATE POLICY "allow_member_insert" ON members
  FOR INSERT 
  WITH CHECK (
    (SELECT role FROM members WHERE auth.uid()::text = id AND is_active = true) = 'executive' OR
    auth.uid()::text IN (SELECT id FROM members WHERE email = 'queue@queue-tech.jp' AND is_active = true)
  );

-- RLSを再有効化
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 認証用のビューを作成（RLS制限なし）
DROP VIEW IF EXISTS member_auth_view;
CREATE VIEW member_auth_view AS
SELECT 
  id,
  email,
  password_hash,
  name,
  role,
  department,
  position,
  is_active,
  created_at
FROM members 
WHERE is_active = true;

-- ビューに対する権限を付与
GRANT SELECT ON member_auth_view TO anon, authenticated, service_role;

-- 認証用ファンクションを作成
CREATE OR REPLACE FUNCTION authenticate_member(
  input_email text,
  input_password text
)
RETURNS TABLE(
  member_id uuid,
  member_email text,
  member_name text,
  member_role text,
  member_department text,
  member_position text,
  success boolean,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  member_record RECORD;
  password_valid boolean := false;
BEGIN
  -- メンバー情報を取得
  SELECT * INTO member_record
  FROM member_auth_view
  WHERE email = input_email AND is_active = true;
  
  IF member_record IS NULL THEN
    RETURN QUERY SELECT 
      NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text,
      false, 'ユーザーが見つからない、またはパスワードが間違っています'::text;
    RETURN;
  END IF;
  
  -- パスワード検証（簡単なハッシュ比較）
  -- 実際の実装では bcrypt 等を使用
  password_valid := member_record.password_hash = input_password;
  
  IF password_valid THEN
    RETURN QUERY SELECT 
      member_record.id,
      member_record.email,
      member_record.name,
      member_record.role,
      member_record.department,
      member_record.position,
      true,
      'ログイン成功'::text;
  ELSE
    RETURN QUERY SELECT 
      NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text,
      false, 'ユーザーが見つからない、またはパスワードが間違っています'::text;
  END IF;
END;
$$;

-- 認証ファンクションに権限を付与
GRANT EXECUTE ON FUNCTION authenticate_member TO anon, authenticated, service_role;

-- テスト用ファンクション
CREATE OR REPLACE FUNCTION test_member_access()
RETURNS TABLE(
  test_name text,
  accessible boolean,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- メンバーテーブルアクセステスト
  BEGIN
    PERFORM count(*) FROM members WHERE is_active = true;
    RETURN QUERY SELECT 'members_table_access'::text, true, 'アクセス成功'::text;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'members_table_access'::text, false, SQLERRM::text;
  END;
  
  -- 認証ビューアクセステスト
  BEGIN
    PERFORM count(*) FROM member_auth_view;
    RETURN QUERY SELECT 'auth_view_access'::text, true, 'アクセス成功'::text;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'auth_view_access'::text, false, SQLERRM::text;
  END;
END;
$$;

-- テストファンクションに権限を付与
GRANT EXECUTE ON FUNCTION test_member_access TO anon, authenticated, service_role; 