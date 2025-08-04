-- =====================================================
-- 役員アカウント作成・パスワード更新マイグレーション
-- 作成日: 2025年2月9日
-- 目的: 
-- 1. taichi.taniguchi@queue-tech.jpの役員アカウントを作成
-- 2. queue@queue-tech.jpのパスワードをHeita001225に更新
-- =====================================================

-- 1. queue@queue-tech.jpアカウントのパスワードを更新
UPDATE members 
SET 
    password_hash = hash_password('Heita001225'),
    updated_at = NOW()
WHERE email = 'queue@queue-tech.jp';

-- 2. taichi.taniguchi@queue-tech.jp役員アカウントを作成（存在しない場合のみ）
INSERT INTO members (email, password_hash, name, role, department, position, is_active, created_by)
VALUES (
    'taichi.taniguchi@queue-tech.jp',
    hash_password('Heita001225'),
    '谷口太一',
    'executive',
    '経営陣',
    'CTO',
    true,
    (SELECT id FROM members WHERE email = 'queue@queue-tech.jp' LIMIT 1)
) ON CONFLICT (email) DO UPDATE SET
    password_hash = hash_password('Heita001225'),
    role = 'executive',
    department = '経営陣',
    position = 'CTO',
    is_active = true,
    updated_at = NOW();

-- 3. パスワード変更をログに記録
INSERT INTO member_activity_logs (member_id, action, details, created_at)
SELECT 
    m.id,
    'password_change',
    '{"reason": "Admin password update to Heita001225", "updated_by": "system", "timestamp": "' || NOW() || '"}',
    NOW()
FROM members m 
WHERE m.email = 'queue@queue-tech.jp';

-- 4. 新規アカウント作成をログに記録
INSERT INTO member_activity_logs (member_id, action, details, created_at)
SELECT 
    m.id,
    'created',
    '{"reason": "Executive account creation", "role": "executive", "position": "CTO", "created_by": "system", "timestamp": "' || NOW() || '"}',
    NOW()
FROM members m 
WHERE m.email = 'taichi.taniguchi@queue-tech.jp';

-- 5. コメント更新
COMMENT ON TABLE members IS 'メンバー管理テーブル - 役員アカウント追加完了（2025年2月9日）'; 