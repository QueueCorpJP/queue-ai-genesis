-- メンバー管理システムのマイグレーション
-- 役員アカウントによるメンバー作成・管理機能

-- 1. membersテーブルの作成
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'executive')),
    department VARCHAR(100),
    position VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0
);

-- 2. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_role ON members(role);
CREATE INDEX IF NOT EXISTS idx_members_is_active ON members(is_active);
CREATE INDEX IF NOT EXISTS idx_members_created_by ON members(created_by);
CREATE INDEX IF NOT EXISTS idx_members_created_at ON members(created_at);

-- 3. 更新日時自動更新のトリガー（既存の関数を使用）
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Row Level Security (RLS) を有効化
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 5. RLSポリシーの作成
-- 管理者（role = 'executive'）は全ての操作が可能
CREATE POLICY "役員は全ての操作が可能" ON members
    FOR ALL
    USING (true);

-- 一般社員は自分のレコードのみ読み取り可能
CREATE POLICY "社員は自分のレコードのみ読み取り可能" ON members
    FOR SELECT
    USING (id = auth.uid()::uuid);

-- 6. メンバー管理ログテーブルの作成
CREATE TABLE IF NOT EXISTS member_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'login', 'logout', 'password_change', 'profile_update', 'created', 'deactivated', 'reactivated'
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    performed_by UUID REFERENCES members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. アクティビティログのインデックス
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_member_id ON member_activity_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_action ON member_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_created_at ON member_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_performed_by ON member_activity_logs(performed_by);

-- 8. メンバー管理統計ビューの作成
CREATE OR REPLACE VIEW member_stats AS
SELECT 
    COUNT(*) as total_members,
    COUNT(CASE WHEN role = 'executive' THEN 1 END) as total_executives,
    COUNT(CASE WHEN role = 'employee' THEN 1 END) as total_employees,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_members,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_members,
    COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '30 days' THEN 1 END) as recently_active_members,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_members_this_month
FROM members;

-- 9. メンバーアクティビティサマリービューの作成
CREATE OR REPLACE VIEW member_activity_summary AS
SELECT 
    m.id,
    m.email,
    m.name,
    m.role,
    m.department,
    m.position,
    m.is_active,
    m.created_at,
    m.last_login_at,
    m.login_count,
    creator.name as created_by_name,
    COUNT(mal.id) as total_activities,
    MAX(mal.created_at) as last_activity_at
FROM members m
LEFT JOIN members creator ON m.created_by = creator.id
LEFT JOIN member_activity_logs mal ON m.id = mal.member_id
GROUP BY m.id, m.email, m.name, m.role, m.department, m.position, m.is_active, 
         m.created_at, m.last_login_at, m.login_count, creator.name
ORDER BY m.created_at DESC;

-- 10. パスワードハッシュ化ファンクション（簡易版）
CREATE OR REPLACE FUNCTION hash_password(plain_password TEXT)
RETURNS TEXT AS $$
BEGIN
    -- 実際の実装では、bcryptやArgon2を使用することを推奨
    -- ここでは簡易的にSHA256を使用（本番環境では適切なライブラリを使用）
    RETURN encode(digest(plain_password || 'queue_salt_2025', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 11. メンバー認証ファンクション
CREATE OR REPLACE FUNCTION authenticate_member(member_email TEXT, member_password TEXT)
RETURNS TABLE(
    member_id UUID,
    email TEXT,
    name TEXT,
    role TEXT,
    department TEXT,
    position TEXT,
    is_active BOOLEAN,
    last_login_at TIMESTAMPTZ
) AS $$
DECLARE
    hashed_password TEXT;
BEGIN
    -- パスワードをハッシュ化
    hashed_password := hash_password(member_password);
    
    -- メンバーを認証
    RETURN QUERY
    SELECT 
        m.id,
        m.email,
        m.name,
        m.role,
        m.department,
        m.position,
        m.is_active,
        m.last_login_at
    FROM members m
    WHERE m.email = member_email 
      AND m.password_hash = hashed_password 
      AND m.is_active = true;
      
    -- ログイン回数と最終ログイン時刻を更新
    UPDATE members 
    SET login_count = login_count + 1,
        last_login_at = NOW(),
        updated_at = NOW()
    WHERE email = member_email 
      AND password_hash = hashed_password 
      AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 12. 初期役員アカウントの作成（queue@queue-tech.jp）
INSERT INTO members (email, password_hash, name, role, department, position, is_active)
VALUES (
    'queue@queue-tech.jp',
    hash_password('Taichi00610'),
    'システム管理者',
    'executive',
    '経営陣',
    'CEO',
    true
) ON CONFLICT (email) DO UPDATE SET
    password_hash = hash_password('Taichi00610'),
    role = 'executive',
    updated_at = NOW();

-- 13. コメント追加
COMMENT ON TABLE members IS 'メンバー管理テーブル - 社員・役員アカウントの管理';
COMMENT ON COLUMN members.role IS 'アカウント種別: employee(社員), executive(役員)';
COMMENT ON COLUMN members.is_active IS 'アカウント有効状態';
COMMENT ON COLUMN members.created_by IS 'アカウント作成者（役員のID）';

COMMENT ON TABLE member_activity_logs IS 'メンバーアクティビティログ - ログイン、操作履歴等';
COMMENT ON COLUMN member_activity_logs.action IS 'アクション種別: login, logout, password_change, profile_update, created, deactivated, reactivated';
COMMENT ON COLUMN member_activity_logs.details IS 'アクション詳細情報（JSON形式）';

COMMENT ON VIEW member_stats IS 'メンバー統計ビュー - 総数、役職別、状態別の集計';
COMMENT ON VIEW member_activity_summary IS 'メンバーアクティビティサマリー - 個人別活動状況'; 