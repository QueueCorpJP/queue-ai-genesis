-- セッション管理と閲覧時間計算のバグ修正
-- 2025-02-10 作成

-- 1. session_idカラムの制約修正（NULL許可から必須に変更）
-- 既存のNULLデータにデフォルトのセッションIDを設定
UPDATE news_article_views 
SET session_id = 'legacy_' || id::text 
WHERE session_id IS NULL;

-- session_idをNOT NULLに変更
ALTER TABLE news_article_views 
ALTER COLUMN session_id SET NOT NULL;

-- session_idのデフォルト値を設定（新規レコード用）
ALTER TABLE news_article_views 
ALTER COLUMN session_id SET DEFAULT 'session_' || gen_random_uuid()::text;

-- updated_atカラムを追加（存在しない場合）
ALTER TABLE news_article_views 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- updated_at自動更新トリガーの追加
CREATE OR REPLACE FUNCTION update_news_article_views_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成
DROP TRIGGER IF EXISTS trigger_update_news_article_views_updated_at ON news_article_views;
CREATE TRIGGER trigger_update_news_article_views_updated_at
  BEFORE UPDATE ON news_article_views
  FOR EACH ROW
  EXECUTE FUNCTION update_news_article_views_updated_at();

-- 2. 閲覧時間計算の整合性修正
-- view_end_timeとreading_duration_secondsの制約改善
ALTER TABLE news_article_views 
ADD CONSTRAINT check_reading_duration_consistency 
CHECK (
  (view_end_time IS NULL AND reading_duration_seconds IS NULL) OR 
  (view_end_time IS NOT NULL AND reading_duration_seconds IS NOT NULL)
);

-- セッション終了時の自動計算トリガー追加
CREATE OR REPLACE FUNCTION calculate_reading_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- view_end_timeが設定された場合、reading_duration_secondsを自動計算
  IF NEW.view_end_time IS NOT NULL AND NEW.view_start_time IS NOT NULL THEN
    NEW.reading_duration_seconds = EXTRACT(EPOCH FROM (NEW.view_end_time - NEW.view_start_time))::INTEGER;
  END IF;
  
  -- 不正な値のチェック
  IF NEW.reading_duration_seconds IS NOT NULL AND NEW.reading_duration_seconds < 0 THEN
    NEW.reading_duration_seconds = 0;
  END IF;
  
  -- 異常に長い閲覧時間のチェック（24時間以上は無効）
  IF NEW.reading_duration_seconds IS NOT NULL AND NEW.reading_duration_seconds > 86400 THEN
    NEW.reading_duration_seconds = 86400;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成
DROP TRIGGER IF EXISTS trigger_calculate_reading_duration ON news_article_views;
CREATE TRIGGER trigger_calculate_reading_duration
  BEFORE INSERT OR UPDATE ON news_article_views
  FOR EACH ROW
  EXECUTE FUNCTION calculate_reading_duration();

-- 3. セッション管理関数の追加
CREATE OR REPLACE FUNCTION start_reading_session(
  p_article_id UUID,
  p_ip_address TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_referrer_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_session_id TEXT;
  v_view_id UUID;
BEGIN
  -- セッションIDが提供されない場合は生成
  v_session_id := COALESCE(p_session_id, 'session_' || gen_random_uuid()::text);
  
  -- 新しい閲覧セッションを開始
  INSERT INTO news_article_views (
    article_id,
    ip_address,
    user_agent,
    session_id,
    view_start_time,
    referrer_url,
    scroll_depth_percentage,
    is_bounce
  ) VALUES (
    p_article_id,
    p_ip_address,
    p_user_agent,
    v_session_id,
    NOW(),
    p_referrer_url,
    0,
    FALSE
  ) RETURNING id INTO v_view_id;
  
  RETURN v_view_id;
END;
$$;

-- 4. セッション終了関数の追加
CREATE OR REPLACE FUNCTION end_reading_session(
  p_view_id UUID,
  p_scroll_depth_percentage INTEGER DEFAULT NULL,
  p_exit_url TEXT DEFAULT NULL,
  p_is_bounce BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- レコードの存在確認
  SELECT EXISTS(
    SELECT 1 FROM news_article_views 
    WHERE id = p_view_id AND view_end_time IS NULL
  ) INTO v_exists;
  
  IF NOT v_exists THEN
    RETURN FALSE;
  END IF;
  
  -- セッション終了情報を更新
  UPDATE news_article_views 
  SET 
    view_end_time = NOW(),
    scroll_depth_percentage = COALESCE(p_scroll_depth_percentage, scroll_depth_percentage),
    exit_url = p_exit_url,
    is_bounce = p_is_bounce,
    updated_at = NOW()
  WHERE id = p_view_id;
  
  RETURN TRUE;
END;
$$;

-- 5. 詳細閲覧セッションビューの修正
-- 既存のビューをドロップしてから再作成（カラム構造変更のため）
DROP VIEW IF EXISTS detailed_reading_sessions;
CREATE VIEW detailed_reading_sessions AS
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
        WHEN nav.view_end_time IS NULL THEN 'セッション継続中'
        WHEN nav.reading_duration_seconds IS NULL THEN 'データ不整合'
        WHEN nav.reading_duration_seconds <= 10 THEN '瞬間閲覧（10秒以下）'
        WHEN nav.reading_duration_seconds <= 30 THEN '短時間閲覧（30秒以下）'
        WHEN nav.reading_duration_seconds <= 60 THEN '通常閲覧（1分以下）'
        WHEN nav.reading_duration_seconds <= 180 THEN '中程度閲覧（3分以下）'
        WHEN nav.reading_duration_seconds <= 300 THEN '長時間閲覧（5分以下）'
        WHEN nav.reading_duration_seconds <= 600 THEN '詳細閲覧（10分以下）'
        ELSE '深い閲覧（10分超）'
    END as reading_category,
    nav.scroll_depth_percentage,
    nav.is_bounce,
    nav.referrer_url,
    nav.exit_url,
    nav.user_agent,
    nav.created_at,
    nav.updated_at
FROM news_article_views nav
JOIN news_articles na ON nav.article_id = na.id
WHERE nav.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY nav.view_start_time DESC;

-- 6. セッション統計ビューの追加
CREATE OR REPLACE VIEW session_analytics AS
SELECT 
    DATE(nav.created_at) as date,
    COUNT(nav.id) as total_sessions,
    COUNT(DISTINCT nav.session_id) as unique_sessions,
    COUNT(CASE WHEN nav.view_end_time IS NULL THEN 1 END) as active_sessions,
    COUNT(CASE WHEN nav.view_end_time IS NOT NULL THEN 1 END) as completed_sessions,
    ROUND(AVG(CASE WHEN nav.reading_duration_seconds > 0 THEN nav.reading_duration_seconds END), 2) as avg_session_duration,
    ROUND(AVG(nav.scroll_depth_percentage), 2) as avg_scroll_depth,
    COUNT(CASE WHEN nav.is_bounce = true THEN 1 END) as bounce_count,
    ROUND((COUNT(CASE WHEN nav.is_bounce = true THEN 1 END)::numeric / NULLIF(COUNT(nav.id), 0)) * 100, 2) as bounce_rate_percentage
FROM news_article_views nav
WHERE nav.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(nav.created_at)
ORDER BY date DESC;

-- 7. 既存ビューの修正（reading_time_stats）
-- 既存のビューをドロップしてから再作成（カラム構造変更のため）
DROP VIEW IF EXISTS reading_time_stats;
CREATE VIEW reading_time_stats AS
SELECT 
    na.id as article_id,
    na.title as article_title,
    na.published_at,
    COUNT(nav.id) as total_views,
    COUNT(DISTINCT nav.ip_address) as unique_visitors,
    COUNT(DISTINCT nav.session_id) as unique_sessions,
    ROUND(AVG(CASE WHEN nav.reading_duration_seconds > 0 THEN nav.reading_duration_seconds END), 2) as avg_reading_time_seconds,
    ROUND(AVG(CASE WHEN nav.reading_duration_seconds > 0 THEN nav.reading_duration_seconds END) / 60.0, 2) as avg_reading_time_minutes,
    MAX(nav.reading_duration_seconds) as max_reading_time_seconds,
    MIN(CASE WHEN nav.reading_duration_seconds > 0 THEN nav.reading_duration_seconds END) as min_reading_time_seconds,
    ROUND(AVG(nav.scroll_depth_percentage), 2) as avg_scroll_depth_percentage,
    COUNT(CASE WHEN nav.is_bounce = true THEN 1 END) as bounce_count,
    ROUND((COUNT(CASE WHEN nav.is_bounce = true THEN 1 END)::numeric / NULLIF(COUNT(nav.id), 0)) * 100, 2) as bounce_rate_percentage,
    -- 閲覧時間別の分類（瞬間閲覧を追加）
    COUNT(CASE WHEN nav.reading_duration_seconds BETWEEN 0 AND 10 THEN 1 END) as views_0_10_seconds,
    COUNT(CASE WHEN nav.reading_duration_seconds BETWEEN 11 AND 30 THEN 1 END) as views_11_30_seconds,
    COUNT(CASE WHEN nav.reading_duration_seconds BETWEEN 31 AND 60 THEN 1 END) as views_31_60_seconds,
    COUNT(CASE WHEN nav.reading_duration_seconds BETWEEN 61 AND 180 THEN 1 END) as views_1_3_minutes,
    COUNT(CASE WHEN nav.reading_duration_seconds BETWEEN 181 AND 300 THEN 1 END) as views_3_5_minutes,
    COUNT(CASE WHEN nav.reading_duration_seconds > 300 THEN 1 END) as views_over_5_minutes,
    -- セッション継続中のカウント
    COUNT(CASE WHEN nav.view_end_time IS NULL THEN 1 END) as active_sessions
FROM news_articles na
LEFT JOIN news_article_views nav ON na.id = nav.article_id
WHERE na.status = 'published'
GROUP BY na.id, na.title, na.published_at
ORDER BY na.published_at DESC;

-- 8. 追加インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_news_article_views_session_end_time 
ON news_article_views(session_id, view_end_time);

CREATE INDEX IF NOT EXISTS idx_news_article_views_active_sessions 
ON news_article_views(article_id, view_end_time) 
WHERE view_end_time IS NULL;

-- 9. コメント追加
COMMENT ON FUNCTION start_reading_session(UUID, TEXT, TEXT, TEXT, TEXT) IS '記事閲覧セッション開始関数';
COMMENT ON FUNCTION end_reading_session(UUID, INTEGER, TEXT, BOOLEAN) IS '記事閲覧セッション終了関数';
COMMENT ON FUNCTION calculate_reading_duration() IS '閲覧時間自動計算トリガー関数';
COMMENT ON VIEW session_analytics IS 'セッション分析統計ビュー';
COMMENT ON CONSTRAINT check_reading_duration_consistency ON news_article_views IS 'view_end_timeとreading_duration_secondsの整合性制約';