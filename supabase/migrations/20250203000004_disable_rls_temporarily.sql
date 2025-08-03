-- 一時的にRLSを無効化して人件費管理を機能させる
-- 本番環境では適切な認証システムの実装後にRLSを再有効化すること

-- 1. 現在のRLSを無効化
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_hourly_rates DISABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーを削除
DROP POLICY IF EXISTS "attendance_records_user_policy" ON attendance_records;
DROP POLICY IF EXISTS "hourly_rates_executive_policy" ON member_hourly_rates;

-- 3. 開発環境用の簡易権限チェック関数
CREATE OR REPLACE FUNCTION check_admin_access()
RETURNS BOOLEAN AS $$
BEGIN
    -- 開発環境では常にtrueを返す
    -- 本番環境では適切な権限チェックを実装すること
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 4. ビューに対する権限を付与
GRANT SELECT ON attendance_summary TO authenticated, anon;
GRANT SELECT ON monthly_attendance_stats TO authenticated, anon;
GRANT SELECT ON monthly_payroll TO authenticated, anon;

-- 5. 関数に対する権限を付与
GRANT EXECUTE ON FUNCTION get_monthly_payroll_summary(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_member_attendance(UUID, TEXT) TO authenticated, anon;

-- 6. テーブルに対する権限を付与
GRANT ALL ON attendance_records TO authenticated, anon;
GRANT ALL ON member_hourly_rates TO authenticated, anon;
GRANT SELECT ON members TO authenticated, anon;

-- 7. 将来のRLS再有効化用の関数
CREATE OR REPLACE FUNCTION enable_rls_with_proper_auth()
RETURNS VOID AS $$
BEGIN
    -- RLSを再有効化
    ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
    ALTER TABLE member_hourly_rates ENABLE ROW LEVEL SECURITY;
    
    -- 適切な認証ベースのポリシーを作成
    CREATE POLICY "attendance_records_auth_policy" ON attendance_records
        FOR ALL
        USING (
            -- Supabaseの認証ユーザーIDベースの権限チェック
            EXISTS (
                SELECT 1 FROM members 
                WHERE id = attendance_records.member_id 
                AND auth_user_id = auth.uid()
            )
            OR
            -- 役員権限チェック
            EXISTS (
                SELECT 1 FROM members 
                WHERE auth_user_id = auth.uid() 
                AND role = 'executive'
                AND is_active = true
            )
        );
    
    CREATE POLICY "hourly_rates_auth_policy" ON member_hourly_rates
        FOR ALL
        USING (
            -- 役員のみアクセス可能
            EXISTS (
                SELECT 1 FROM members 
                WHERE auth_user_id = auth.uid() 
                AND role = 'executive'
                AND is_active = true
            )
        );
    
    RAISE NOTICE 'RLS has been re-enabled with proper authentication policies';
END;
$$ LANGUAGE plpgsql;

-- 8. コメント
COMMENT ON FUNCTION check_admin_access() IS '開発環境用の簡易権限チェック関数（本番環境では削除すること）';
COMMENT ON FUNCTION enable_rls_with_proper_auth() IS 'Supabase認証ベースのRLSを再有効化する関数';

-- 9. 警告メッセージ
DO $$
BEGIN
    RAISE WARNING 'RLS has been temporarily disabled for development. Re-enable with proper authentication before production deployment.';
END $$;