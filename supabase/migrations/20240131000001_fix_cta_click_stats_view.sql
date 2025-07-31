-- CTAクリック統計ビューの修正
-- 記事の閲覧数とCTAクリック数が同じになる問題を解決

-- 既存のビューを削除
DROP VIEW IF EXISTS cta_click_stats;

-- 修正されたCTAクリック統計用のビューを作成
CREATE OR REPLACE VIEW cta_click_stats AS
SELECT 
    na.id as article_id,
    na.title as article_title,
    na.published_at,
    COALESCE(cta_stats.total_clicks, 0) as total_clicks,
    COALESCE(cta_stats.unique_clicks, 0) as unique_clicks,
    COALESCE(cta_stats.consultation_clicks, 0) as consultation_clicks,
    COALESCE(view_stats.total_views, 0) as total_views,
    CASE 
        WHEN COALESCE(view_stats.total_views, 0) > 0 THEN 
            ROUND((COALESCE(cta_stats.total_clicks, 0)::numeric / view_stats.total_views::numeric) * 100, 2)
        ELSE 0 
    END as click_rate_percentage
FROM news_articles na
LEFT JOIN (
    -- CTAクリック統計を別途集計
    SELECT 
        article_id,
        COUNT(*) as total_clicks,
        COUNT(DISTINCT ip_address) as unique_clicks,
        COUNT(CASE WHEN cta_type = 'consultation' THEN 1 END) as consultation_clicks
    FROM cta_clicks
    GROUP BY article_id
) cta_stats ON na.id = cta_stats.article_id
LEFT JOIN (
    -- 記事閲覧統計を別途集計
    SELECT 
        article_id,
        COUNT(*) as total_views
    FROM news_article_views
    GROUP BY article_id
) view_stats ON na.id = view_stats.article_id
WHERE na.status = 'published'
ORDER BY na.published_at DESC;

-- ビューにコメントを追加
COMMENT ON VIEW cta_click_stats IS '修正されたCTAクリック統計ビュー - CTAクリック数と記事閲覧数を正確に分離';