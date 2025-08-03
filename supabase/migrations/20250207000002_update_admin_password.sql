-- =====================================================
-- 管理者パスワード更新マイグレーション
-- 作成日: 2025年2月7日
-- 目的: queue@queue-tech.jpアカウントのパスワードをAce00124に更新
-- =====================================================

-- queue@queue-tech.jpアカウントのパスワードを更新
UPDATE members 
SET 
    password_hash = hash_password('Ace00124'),
    updated_at = NOW()
WHERE email = 'queue@queue-tech.jp';

-- 更新が成功したかログに記録
INSERT INTO member_activity_logs (member_id, action, details, created_at)
SELECT 
    m.id,
    'password_change',
    '{"reason": "Admin password update", "updated_by": "system", "timestamp": "' || NOW() || '"}',
    NOW()
FROM members m 
WHERE m.email = 'queue@queue-tech.jp';

-- コメント
COMMENT ON TABLE members IS 'メンバー管理テーブル - queue@queue-tech.jpパスワード更新済み（2025年2月7日）'; 