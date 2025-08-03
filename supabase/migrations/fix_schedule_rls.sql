-- スケジュール管理RLSポリシー修正
-- 401エラー対応

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "役員は全てのスケジュール操作が可能" ON company_schedules;
DROP POLICY IF EXISTS "社員は有効なスケジュールの閲覧のみ可能" ON company_schedules;

-- 新しいポリシーを作成（より柔軟な認証方式）

-- 1. 認証されたユーザー全員がスケジュールを閲覧可能
CREATE POLICY "認証されたユーザーはスケジュール閲覧可能" ON company_schedules
    FOR SELECT
    USING (is_active = true);

-- 2. 役員のみスケジュールの作成・更新・削除が可能
CREATE POLICY "役員のみスケジュール編集可能" ON company_schedules
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE email = auth.email() 
            AND role = 'executive' 
            AND is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM members 
            WHERE email = auth.email() 
            AND role = 'executive' 
            AND is_active = true
        )
    );

-- 3. 管理者アカウント（queue@queue-tech.jp）は全操作可能
CREATE POLICY "管理者は全スケジュール操作可能" ON company_schedules
    FOR ALL
    USING (auth.email() = 'queue@queue-tech.jp')
    WITH CHECK (auth.email() = 'queue@queue-tech.jp');

-- 代替案: RLSを一時的に無効化してテスト（本番環境では推奨しません）
-- ALTER TABLE company_schedules DISABLE ROW LEVEL SECURITY; 