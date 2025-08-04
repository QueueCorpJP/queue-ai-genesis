-- =====================================================
-- マイメモ機能マイグレーション
-- 作成日: 2025年2月8日
-- 目的: 各メンバーが日々の気づき・アイデア・業務メモを記録できる個人専用スペース
-- 機能: 作成・編集・削除・検索・カテゴリ分類・重要度設定
-- =====================================================

-- 1. personal_memosテーブルの作成
CREATE TABLE IF NOT EXISTS personal_memos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id uuid NOT NULL,
    title varchar(200) NOT NULL,
    content text NOT NULL,
    category varchar(50) DEFAULT 'general',
    priority varchar(10) DEFAULT 'medium',
    tags text[] DEFAULT '{}',
    is_favorite boolean DEFAULT false,
    is_archived boolean DEFAULT false,
    reminder_date timestamptz NULL,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW(),
    
    -- 外部キー制約
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 2. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_personal_memos_member_id ON personal_memos(member_id);
CREATE INDEX IF NOT EXISTS idx_personal_memos_category ON personal_memos(category);
CREATE INDEX IF NOT EXISTS idx_personal_memos_priority ON personal_memos(priority);
CREATE INDEX IF NOT EXISTS idx_personal_memos_tags ON personal_memos USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_personal_memos_created_at ON personal_memos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_personal_memos_is_favorite ON personal_memos(is_favorite);
CREATE INDEX IF NOT EXISTS idx_personal_memos_is_archived ON personal_memos(is_archived);
CREATE INDEX IF NOT EXISTS idx_personal_memos_reminder_date ON personal_memos(reminder_date);
CREATE INDEX IF NOT EXISTS idx_personal_memos_member_created ON personal_memos(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_personal_memos_member_category ON personal_memos(member_id, category);

-- 3. 制約条件の追加
ALTER TABLE personal_memos 
ADD CONSTRAINT check_category CHECK (category IN (
    'general', 'ideas', 'meeting', 'project', 'learning', 
    'goal', 'reflection', 'task', 'inspiration', 'other'
));

ALTER TABLE personal_memos 
ADD CONSTRAINT check_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE personal_memos 
ADD CONSTRAINT check_title_length CHECK (char_length(title) > 0);

ALTER TABLE personal_memos 
ADD CONSTRAINT check_content_length CHECK (char_length(content) > 0);

-- 4. updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_personal_memos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_personal_memos_updated_at ON personal_memos;
CREATE TRIGGER trigger_update_personal_memos_updated_at
    BEFORE UPDATE ON personal_memos
    FOR EACH ROW
    EXECUTE FUNCTION update_personal_memos_updated_at();

-- 5. RLS (Row Level Security) の設定
ALTER TABLE personal_memos ENABLE ROW LEVEL SECURITY;

-- メンバーは自分のメモのみアクセス可能
CREATE POLICY "members_own_memos_policy" ON personal_memos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE members.id = personal_memos.member_id 
            AND members.id::text = current_setting('app.current_member_id', true)
        )
    );

-- 役員は全メンバーのメモを閲覧可能（但し、プライバシー配慮で通常は制限）
CREATE POLICY "executives_view_memos_policy" ON personal_memos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE members.id::text = current_setting('app.current_member_id', true)
            AND members.role IN ('executive', 'ceo', 'admin')
        )
    );

-- 6. メモ統計ビューの作成
CREATE OR REPLACE VIEW personal_memo_stats AS
SELECT 
    m.id as member_id,
    m.name as member_name,
    m.email as member_email,
    m.department,
    COUNT(pm.*) as total_memos,
    COUNT(pm.*) FILTER (WHERE pm.category = 'ideas') as ideas_count,
    COUNT(pm.*) FILTER (WHERE pm.category = 'learning') as learning_count,
    COUNT(pm.*) FILTER (WHERE pm.category = 'reflection') as reflection_count,
    COUNT(pm.*) FILTER (WHERE pm.category = 'project') as project_count,
    COUNT(pm.*) FILTER (WHERE pm.is_favorite = true) as favorite_count,
    COUNT(pm.*) FILTER (WHERE pm.is_archived = false) as active_count,
    COUNT(pm.*) FILTER (WHERE pm.created_at >= CURRENT_DATE - INTERVAL '7 days') as this_week_count,
    COUNT(pm.*) FILTER (WHERE pm.created_at >= CURRENT_DATE - INTERVAL '30 days') as this_month_count,
    MAX(pm.created_at) as last_memo_at,
    AVG(CASE 
        WHEN pm.priority = 'urgent' THEN 4
        WHEN pm.priority = 'high' THEN 3
        WHEN pm.priority = 'medium' THEN 2
        WHEN pm.priority = 'low' THEN 1
        ELSE 0
    END) as avg_priority_score
FROM members m
LEFT JOIN personal_memos pm ON m.id = pm.member_id
GROUP BY m.id, m.name, m.email, m.department;

-- 7. メモ検索ビューの作成
CREATE OR REPLACE VIEW memo_search_view AS
SELECT 
    pm.id,
    pm.member_id,
    pm.title,
    pm.content,
    pm.category,
    pm.priority,
    pm.tags,
    pm.is_favorite,
    pm.is_archived,
    pm.reminder_date,
    pm.created_at,
    pm.updated_at,
    m.name as author_name,
    m.department as author_department,
    -- 全文検索用の検索ベクター (simple configuration works with Japanese text)
    to_tsvector('simple', pm.title || ' ' || pm.content || ' ' || array_to_string(pm.tags, ' ')) as search_vector,
    -- カテゴリ表示名
    CASE 
        WHEN pm.category = 'general' THEN '一般'
        WHEN pm.category = 'ideas' THEN 'アイデア'
        WHEN pm.category = 'meeting' THEN '会議'
        WHEN pm.category = 'project' THEN 'プロジェクト'
        WHEN pm.category = 'learning' THEN '学習'
        WHEN pm.category = 'goal' THEN '目標'
        WHEN pm.category = 'reflection' THEN '振り返り'
        WHEN pm.category = 'task' THEN 'タスク'
        WHEN pm.category = 'inspiration' THEN 'インスピレーション'
        ELSE 'その他'
    END as category_display,
    -- 優先度表示名
    CASE 
        WHEN pm.priority = 'urgent' THEN '緊急'
        WHEN pm.priority = 'high' THEN '高'
        WHEN pm.priority = 'medium' THEN '中'
        WHEN pm.priority = 'low' THEN '低'
        ELSE '未設定'
    END as priority_display
FROM personal_memos pm
JOIN members m ON pm.member_id = m.id
WHERE pm.is_archived = false;

-- 8. 検索機能のためのGINインデックス
-- Note: Functional index removed due to IMMUTABLE function requirement
-- Search functionality is still available through the memo_search_view and search function

-- 9. メモ検索ファンクション
CREATE OR REPLACE FUNCTION search_personal_memos(
    p_member_id uuid,
    p_search_term text DEFAULT '',
    p_category text DEFAULT '',
    p_priority text DEFAULT '',
    p_is_favorite boolean DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    title varchar(200),
    content text,
    category varchar(50),
    priority varchar(10),
    tags text[],
    is_favorite boolean,
    category_display text,
    priority_display text,
    created_at timestamptz,
    updated_at timestamptz,
    relevance_score real
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        msv.id,
        msv.title,
        msv.content,
        msv.category,
        msv.priority,
        msv.tags,
        msv.is_favorite,
        msv.category_display,
        msv.priority_display,
        msv.created_at,
        msv.updated_at,
        CASE 
            WHEN p_search_term = '' THEN 1.0
            ELSE ts_rank(msv.search_vector, plainto_tsquery('simple', p_search_term))
        END as relevance_score
    FROM memo_search_view msv
    WHERE msv.member_id = p_member_id
        AND (p_search_term = '' OR msv.search_vector @@ plainto_tsquery('simple', p_search_term))
        AND (p_category = '' OR msv.category = p_category)
        AND (p_priority = '' OR msv.priority = p_priority)
        AND (p_is_favorite IS NULL OR msv.is_favorite = p_is_favorite)
    ORDER BY 
        CASE WHEN p_search_term = '' THEN msv.created_at ELSE relevance_score END DESC,
        msv.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 10. メモ統計取得ファンクション
CREATE OR REPLACE FUNCTION get_memo_insights(p_member_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_memos', COUNT(*),
        'categories_breakdown', json_object_agg(category, category_count),
        'weekly_activity', (
            SELECT json_agg(
                json_build_object(
                    'date', date_trunc('day', created_at)::date,
                    'count', day_count
                ) ORDER BY date_trunc('day', created_at)::date
            )
            FROM (
                SELECT 
                    created_at,
                    COUNT(*) as day_count
                FROM personal_memos 
                WHERE member_id = p_member_id 
                    AND created_at >= CURRENT_DATE - INTERVAL '7 days'
                GROUP BY date_trunc('day', created_at)
            ) daily_stats
        ),
        'priority_distribution', json_object_agg(priority, priority_count),
        'favorite_count', SUM(CASE WHEN is_favorite THEN 1 ELSE 0 END),
        'recent_activity', (
            SELECT COUNT(*) FROM personal_memos 
            WHERE member_id = p_member_id 
                AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        )
    ) INTO result
    FROM (
        SELECT 
            category,
            COUNT(*) as category_count,
            priority,
            COUNT(*) OVER (PARTITION BY priority) as priority_count
        FROM personal_memos 
        WHERE member_id = p_member_id AND is_archived = false
        GROUP BY category, priority
    ) stats;
    
    RETURN COALESCE(result, '{}'::json);
END;
$$;

-- 11. コメント
COMMENT ON TABLE personal_memos IS 'マイメモ機能 - 各メンバーの個人的な気づき・アイデア・業務メモを管理';
COMMENT ON COLUMN personal_memos.category IS 'メモカテゴリ: general, ideas, meeting, project, learning, goal, reflection, task, inspiration, other';
COMMENT ON COLUMN personal_memos.priority IS '優先度: low, medium, high, urgent';
COMMENT ON COLUMN personal_memos.tags IS 'タグ配列 - 自由なタグ付けによる分類';
COMMENT ON COLUMN personal_memos.is_favorite IS 'お気に入りフラグ';
COMMENT ON COLUMN personal_memos.is_archived IS 'アーカイブフラグ';
COMMENT ON COLUMN personal_memos.reminder_date IS 'リマインダー日時';

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'マイメモ機能のデータベース構築が完了しました';
    RAISE NOTICE 'テーブル: personal_memos';
    RAISE NOTICE 'ビュー: personal_memo_stats, memo_search_view';
    RAISE NOTICE 'ファンクション: search_personal_memos, get_memo_insights';
    RAISE NOTICE 'RLS: 個人専用アクセス制御を設定済み';
END $$; 