-- RLSの適切な修正
-- ビューではなく、基底テーブルのRLSポリシーを修正し、認証状態を確認

-- 1. 既存のポリシーを削除
DROP POLICY IF EXISTS "メンバーは自分の勤怠記録のみ操作可能" ON attendance_records;
DROP POLICY IF EXISTS "役員は全ての勤怠記録を管理可能" ON attendance_records;
DROP POLICY IF EXISTS "役員のみ時給設定が可能" ON member_hourly_rates;

-- ビューのRLS設定を削除（ビューにはRLSを適用できない）
ALTER VIEW IF EXISTS attendance_summary DISABLE ROW LEVEL SECURITY;
ALTER VIEW IF EXISTS monthly_attendance_stats DISABLE ROW LEVEL SECURITY;
ALTER VIEW IF EXISTS monthly_payroll DISABLE ROW LEVEL SECURITY;

-- 2. 認証状態確認用の関数を作成
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    -- 現在の認証ユーザーのIDを取得
    SELECT auth.uid() INTO user_id;
    
    -- 認証されていない場合はNULLを返す
    IF user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- membersテーブルから対応するメンバーIDを取得
    SELECT id INTO user_id
    FROM members 
    WHERE auth_user_id = user_id 
    AND is_active = true;
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. メールベースの認証確認関数
CREATE OR REPLACE FUNCTION get_current_user_by_email()
RETURNS UUID AS $$
DECLARE
    user_id UUID;
    user_email TEXT;
BEGIN
    -- JWTからメールアドレスを取得
    SELECT auth.jwt() ->> 'email' INTO user_email;
    
    -- メールアドレスが取得できない場合
    IF user_email IS NULL THEN
        -- auth.uid()からユーザー情報を取得を試行
        SELECT email INTO user_email
        FROM auth.users 
        WHERE id = auth.uid();
    END IF;
    
    -- まだメールアドレスが取得できない場合はNULLを返す
    IF user_email IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- membersテーブルから対応するメンバーIDを取得
    SELECT id INTO user_id
    FROM members 
    WHERE email = user_email 
    AND is_active = true;
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 役員権限確認関数
CREATE OR REPLACE FUNCTION is_current_user_executive()
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
    user_role TEXT;
BEGIN
    -- JWTからメールアドレスを取得
    SELECT auth.jwt() ->> 'email' INTO user_email;
    
    -- メールアドレスが取得できない場合
    IF user_email IS NULL THEN
        -- auth.uid()からユーザー情報を取得を試行
        SELECT email INTO user_email
        FROM auth.users 
        WHERE id = auth.uid();
    END IF;
    
    -- まだメールアドレスが取得できない場合はfalseを返す
    IF user_email IS NULL THEN
        RETURN false;
    END IF;
    
    -- 特定のメールアドレスは役員として扱う
    IF user_email = 'queue@queue-tech.jp' THEN
        RETURN true;
    END IF;
    
    -- membersテーブルから役員権限を確認
    SELECT role INTO user_role
    FROM members 
    WHERE email = user_email 
    AND is_active = true;
    
    RETURN (user_role = 'executive');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 新しいRLSポリシーを作成

-- 勤怠記録のポリシー
CREATE POLICY "attendance_records_user_policy" ON attendance_records
    FOR ALL
    USING (
        member_id = get_current_user_by_email() 
        OR is_current_user_executive()
    );

-- 時給設定のポリシー（役員のみ）
CREATE POLICY "hourly_rates_executive_policy" ON member_hourly_rates
    FOR ALL
    USING (is_current_user_executive());

-- 6. 一時的にRLSを無効化するオプション（デバッグ用）
-- 本番環境では削除すること
CREATE OR REPLACE FUNCTION temporarily_disable_rls()
RETURNS VOID AS $$
BEGIN
    -- 開発環境でのみ実行
    IF current_setting('app.environment', true) = 'development' THEN
        ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;
        ALTER TABLE member_hourly_rates DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS temporarily disabled for development';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 7. RLSを再有効化する関数
CREATE OR REPLACE FUNCTION re_enable_rls()
RETURNS VOID AS $$
BEGIN
    ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
    ALTER TABLE member_hourly_rates ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS re-enabled';
END;
$$ LANGUAGE plpgsql;

-- 8. デバッグ用：現在のユーザー情報を確認する関数
CREATE OR REPLACE FUNCTION debug_current_user()
RETURNS TABLE (
    auth_uid UUID,
    jwt_email TEXT,
    auth_user_email TEXT,
    member_id UUID,
    member_email TEXT,
    member_role TEXT,
    is_executive BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid() as auth_uid,
        auth.jwt() ->> 'email' as jwt_email,
        au.email as auth_user_email,
        m.id as member_id,
        m.email as member_email,
        m.role as member_role,
        is_current_user_executive() as is_executive
    FROM auth.users au
    LEFT JOIN members m ON au.email = m.email AND m.is_active = true
    WHERE au.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 権限の付与
GRANT EXECUTE ON FUNCTION get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_by_email() TO authenticated;
GRANT EXECUTE ON FUNCTION is_current_user_executive() TO authenticated;
GRANT EXECUTE ON FUNCTION debug_current_user() TO authenticated;
GRANT EXECUTE ON FUNCTION temporarily_disable_rls() TO authenticated;
GRANT EXECUTE ON FUNCTION re_enable_rls() TO authenticated;

-- 10. コメント
COMMENT ON FUNCTION get_current_user_id() IS '現在認証されているユーザーのメンバーIDを取得';
COMMENT ON FUNCTION get_current_user_by_email() IS 'メールアドレスベースで現在のユーザーのメンバーIDを取得';
COMMENT ON FUNCTION is_current_user_executive() IS '現在のユーザーが役員かどうかを確認';
COMMENT ON FUNCTION debug_current_user() IS 'デバッグ用：現在のユーザー情報を表示';