-- 閲覧時間トラッキング機能の追加
-- ユーザーの記事閲覧開始・終了時間、滞在時間を記録する

-- 1. news_article_viewsテーブルに閲覧時間関連のカラムを追加
ALTER TABLE news_article_views 
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS view_start_time TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS view_end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reading_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS scroll_depth_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_bounce BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS referrer_url TEXT,
ADD COLUMN IF NOT EXISTS exit_url TEXT;

-- 2. 閲覧時間統計用のビューを作成
CREATE OR REPLACE VIEW reading_time_stats AS
SELECT 
    na.id as article_id,
    na.title as article_title,
    na.published_at,
    COUNT(nav.id) as total_views,
    COUNT(DISTINCT nav.ip_address) as unique_visitors,
    ROUND(AVG(CASE WHEN nav.reading_duration_seconds > 0 THEN nav.reading_duration_seconds END), 2) as avg_reading_time_seconds,
    ROUND(AVG(CASE WHEN nav.reading_duration_seconds > 0 THEN nav.reading_duration_seconds END) / 60.0, 2) as avg_reading_time_minutes,
    MAX(nav.reading_duration_seconds) as max_reading_time_seconds,
    MIN(CASE WHEN nav.reading_duration_seconds > 0 THEN nav.reading_duration_seconds END) as min_reading_time_seconds,
    ROUND(AVG(nav.scroll_depth_percentage), 2) as avg_scroll_depth_percentage,
    COUNT(CASE WHEN nav.is_bounce = true THEN 1 END) as bounce_count,
    ROUND((COUNT(CASE WHEN nav.is_bounce = true THEN 1 END)::numeric / NULLIF(COUNT(nav.id), 0)) * 100, 2) as bounce_rate_percentage,
    -- 閲覧時間別の分類
    COUNT(CASE WHEN nav.reading_duration_seconds BETWEEN 0 AND 30 THEN 1 END) as views_0_30_seconds,
    COUNT(CASE WHEN nav.reading_duration_seconds BETWEEN 31 AND 60 THEN 1 END) as views_31_60_seconds,
    COUNT(CASE WHEN nav.reading_duration_seconds BETWEEN 61 AND 180 THEN 1 END) as views_1_3_minutes,
    COUNT(CASE WHEN nav.reading_duration_seconds BETWEEN 181 AND 300 THEN 1 END) as views_3_5_minutes,
    COUNT(CASE WHEN nav.reading_duration_seconds > 300 THEN 1 END) as views_over_5_minutes
FROM news_articles na
LEFT JOIN news_article_views nav ON na.id = nav.article_id
WHERE na.status = 'published'
GROUP BY na.id, na.title, na.published_at
ORDER BY na.published_at DESC;

-- 3. 日別閲覧時間統計ビュー
CREATE OR REPLACE VIEW daily_reading_stats AS
SELECT 
    DATE(nav.created_at) as date,
    COUNT(nav.id) as total_views,
    COUNT(DISTINCT nav.ip_address) as unique_visitors,
    ROUND(AVG(CASE WHEN nav.reading_duration_seconds > 0 THEN nav.reading_duration_seconds END), 2) as avg_reading_time_seconds,
    ROUND(AVG(CASE WHEN nav.reading_duration_seconds > 0 THEN nav.reading_duration_seconds END) / 60.0, 2) as avg_reading_time_minutes,
    ROUND(AVG(nav.scroll_depth_percentage), 2) as avg_scroll_depth_percentage,
    ROUND((COUNT(CASE WHEN nav.is_bounce = true THEN 1 END)::numeric / NULLIF(COUNT(nav.id), 0)) * 100, 2) as bounce_rate_percentage
FROM news_article_views nav
WHERE nav.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(nav.created_at)
ORDER BY date DESC;

-- 4. ユーザー別閲覧履歴ビュー（IPアドレスベース）
CREATE OR REPLACE VIEW user_reading_history AS
SELECT 
    nav.ip_address,
    nav.user_agent,
    COUNT(DISTINCT nav.article_id) as articles_read,
    COUNT(nav.id) as total_page_views,
    ROUND(AVG(CASE WHEN nav.reading_duration_seconds > 0 THEN nav.reading_duration_seconds END), 2) as avg_reading_time_seconds,
    SUM(CASE WHEN nav.reading_duration_seconds > 0 THEN nav.reading_duration_seconds END) as total_reading_time_seconds,
    ROUND(AVG(nav.scroll_depth_percentage), 2) as avg_scroll_depth_percentage,
    MIN(nav.created_at) as first_visit,
    MAX(nav.created_at) as last_visit,
    COUNT(CASE WHEN nav.is_bounce = true THEN 1 END) as bounce_count,
    ROUND((COUNT(CASE WHEN nav.is_bounce = true THEN 1 END)::numeric / NULLIF(COUNT(nav.id), 0)) * 100, 2) as bounce_rate_percentage
FROM news_article_views nav
WHERE nav.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY nav.ip_address, nav.user_agent
HAVING COUNT(nav.id) > 0
ORDER BY total_reading_time_seconds DESC;

-- 5. 詳細な閲覧履歴ビュー（個別セッション）
CREATE OR REPLACE VIEW detailed_reading_sessions AS
SELECT 
    nav.id,
    nav.session_id,
    nav.article_id,
    na.title as article_title,
    nav.ip_address,
    nav.view_start_time,
    nav.view_end_time,
    nav.reading_duration_seconds,
    CASE 
        WHEN nav.reading_duration_seconds IS NULL THEN 'セッション継続中'
        WHEN nav.reading_duration_seconds <= 30 THEN '短時間閲覧（30秒以下）'
        WHEN nav.reading_duration_seconds <= 60 THEN '通常閲覧（1分以下）'
        WHEN nav.reading_duration_seconds <= 180 THEN '中程度閲覧（3分以下）'
        WHEN nav.reading_duration_seconds <= 300 THEN '長時間閲覧（5分以下）'
        ELSE '詳細閲覧（5分超）'
    END as reading_category,
    nav.scroll_depth_percentage,
    nav.is_bounce,
    nav.referrer_url,
    nav.exit_url,
    nav.user_agent
FROM news_article_views nav
JOIN news_articles na ON nav.article_id = na.id
WHERE nav.created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY nav.view_start_time DESC;

-- 6. 閲覧時間分析ファンクション
CREATE OR REPLACE FUNCTION get_reading_insights(
    article_id_param UUID DEFAULT NULL,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    metric_name TEXT,
    metric_value NUMERIC,
    metric_description TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(nav.id) as total_views,
            COUNT(DISTINCT nav.ip_address) as unique_visitors,
            AVG(CASE WHEN nav.reading_duration_seconds > 0 THEN nav.reading_duration_seconds END) as avg_reading_time,
            MAX(nav.reading_duration_seconds) as max_reading_time,
            AVG(nav.scroll_depth_percentage) as avg_scroll_depth,
            COUNT(CASE WHEN nav.is_bounce = true THEN 1 END) as bounce_count,
            COUNT(CASE WHEN nav.reading_duration_seconds > 60 THEN 1 END) as engaged_reads
        FROM news_article_views nav
        WHERE nav.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
          AND (article_id_param IS NULL OR nav.article_id = article_id_param)
    )
    SELECT 'total_views'::TEXT, total_views, '総閲覧数'::TEXT FROM stats
    UNION ALL
    SELECT 'unique_visitors'::TEXT, unique_visitors, 'ユニーク訪問者数'::TEXT FROM stats
    UNION ALL
    SELECT 'avg_reading_time_seconds'::TEXT, ROUND(avg_reading_time, 2), '平均閲覧時間（秒）'::TEXT FROM stats
    UNION ALL
    SELECT 'avg_reading_time_minutes'::TEXT, ROUND(avg_reading_time / 60, 2), '平均閲覧時間（分）'::TEXT FROM stats
    UNION ALL
    SELECT 'max_reading_time_seconds'::TEXT, max_reading_time, '最長閲覧時間（秒）'::TEXT FROM stats
    UNION ALL
    SELECT 'avg_scroll_depth'::TEXT, ROUND(avg_scroll_depth, 2), '平均スクロール深度（%）'::TEXT FROM stats
    UNION ALL
    SELECT 'bounce_rate'::TEXT, ROUND((bounce_count::numeric / NULLIF(total_views, 0)) * 100, 2), '直帰率（%）'::TEXT FROM stats
    UNION ALL
    SELECT 'engagement_rate'::TEXT, ROUND((engaged_reads::numeric / NULLIF(total_views, 0)) * 100, 2), 'エンゲージメント率（1分以上閲覧%）'::TEXT FROM stats;
END;
$$;

-- 7. インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_news_article_views_session_id 
ON news_article_views(session_id);

CREATE INDEX IF NOT EXISTS idx_news_article_views_reading_duration 
ON news_article_views(reading_duration_seconds) 
WHERE reading_duration_seconds IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_news_article_views_view_start_time 
ON news_article_views(view_start_time);

CREATE INDEX IF NOT EXISTS idx_news_article_views_ip_created_at 
ON news_article_views(ip_address, created_at);

-- コメント追加
COMMENT ON COLUMN news_article_views.session_id IS 'ブラウザセッションID（同一ユーザーの複数ページ閲覧を追跡）';
COMMENT ON COLUMN news_article_views.view_start_time IS '記事閲覧開始時刻';
COMMENT ON COLUMN news_article_views.view_end_time IS '記事閲覧終了時刻';
COMMENT ON COLUMN news_article_views.reading_duration_seconds IS '閲覧時間（秒）';
COMMENT ON COLUMN news_article_views.scroll_depth_percentage IS 'スクロール深度（%）';
COMMENT ON COLUMN news_article_views.is_bounce IS '直帰フラグ（他ページに移動せずに離脱）';
COMMENT ON COLUMN news_article_views.referrer_url IS '参照元URL';
COMMENT ON COLUMN news_article_views.exit_url IS '離脱先URL';

COMMENT ON VIEW reading_time_stats IS '記事別閲覧時間統計ビュー';
COMMENT ON VIEW daily_reading_stats IS '日別閲覧時間統計ビュー';
COMMENT ON VIEW user_reading_history IS 'ユーザー別閲覧履歴ビュー（IPベース）';
COMMENT ON VIEW detailed_reading_sessions IS '詳細閲覧セッションビュー';
COMMENT ON FUNCTION get_reading_insights(UUID, INTEGER) IS '閲覧時間分析インサイト取得ファンクション'; 