-- CTAコンバージョン分析のためのビューとファンクション作成

-- 1. 日別CTAクリック・相談申し込み統計ビュー
CREATE OR REPLACE VIEW daily_conversion_stats AS
SELECT 
    DATE(COALESCE(cc.clicked_at, cr.created_at)) as date,
    COALESCE(click_counts.total_clicks, 0) as cta_clicks,
    COALESCE(consultation_counts.total_consultations, 0) as consultation_requests,
    CASE 
        WHEN COALESCE(click_counts.total_clicks, 0) > 0 
        THEN ROUND((COALESCE(consultation_counts.total_consultations, 0)::numeric / click_counts.total_clicks::numeric) * 100, 2)
        ELSE 0 
    END as conversion_rate
FROM (
    -- CTAクリック数の日別集計
    SELECT 
        DATE(clicked_at) as date,
        COUNT(*) as total_clicks
    FROM cta_clicks 
    WHERE cta_type = 'consultation'
    GROUP BY DATE(clicked_at)
) click_counts
FULL OUTER JOIN (
    -- 相談申し込み数の日別集計
    SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_consultations
    FROM consultation_requests
    GROUP BY DATE(created_at)
) consultation_counts ON click_counts.date = consultation_counts.date
LEFT JOIN cta_clicks cc ON DATE(cc.clicked_at) = COALESCE(click_counts.date, consultation_counts.date)
LEFT JOIN consultation_requests cr ON DATE(cr.created_at) = COALESCE(click_counts.date, consultation_counts.date)
WHERE COALESCE(click_counts.date, consultation_counts.date) IS NOT NULL
ORDER BY date DESC;

-- 2. IPアドレスベースのコンバージョン追跡ビュー
CREATE OR REPLACE VIEW ip_based_conversion_tracking AS
SELECT 
    cc.ip_address,
    COUNT(DISTINCT cc.id) as cta_clicks_count,
    MIN(cc.clicked_at) as first_click_time,
    MAX(cc.clicked_at) as last_click_time,
    CASE 
        WHEN cr.created_at IS NOT NULL THEN true 
        ELSE false 
    END as consultation_submitted,
    cr.created_at as consultation_time,
    CASE 
        WHEN cr.created_at IS NOT NULL AND cc.clicked_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (cr.created_at - MIN(cc.clicked_at))) / 60
        ELSE NULL 
    END as time_to_convert_minutes
FROM cta_clicks cc
LEFT JOIN consultation_requests cr ON (
    -- IPアドレスが一致し、CTAクリック後24時間以内の相談申し込み
    cc.ip_address = cr.created_at::text -- ここはIPアドレス比較の仮実装
    AND cr.created_at >= cc.clicked_at 
    AND cr.created_at <= cc.clicked_at + INTERVAL '24 hours'
)
WHERE cc.cta_type = 'consultation'
GROUP BY cc.ip_address, cr.created_at
ORDER BY first_click_time DESC;

-- 3. コンバージョン分析用ファンクション
CREATE OR REPLACE FUNCTION analyze_cta_conversions()
RETURNS TABLE (
    period text,
    cta_clicks bigint,
    consultation_requests bigint,
    conversion_rate numeric,
    avg_time_to_convert numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(dcs.date, 'YYYY-MM-DD') as period,
        dcs.cta_clicks,
        dcs.consultation_requests,
        dcs.conversion_rate,
        COALESCE(AVG(ibc.time_to_convert_minutes), 0) as avg_time_to_convert
    FROM daily_conversion_stats dcs
    LEFT JOIN ip_based_conversion_tracking ibc ON DATE(ibc.first_click_time) = dcs.date
    WHERE dcs.date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY dcs.date, dcs.cta_clicks, dcs.consultation_requests, dcs.conversion_rate
    ORDER BY dcs.date DESC;
END;
$$;

-- 4. 月別コンバージョンサマリービュー
CREATE OR REPLACE VIEW monthly_conversion_summary AS
SELECT 
    TO_CHAR(date, 'YYYY-MM') as month,
    SUM(cta_clicks) as total_cta_clicks,
    SUM(consultation_requests) as total_consultations,
    CASE 
        WHEN SUM(cta_clicks) > 0 
        THEN ROUND((SUM(consultation_requests)::numeric / SUM(cta_clicks)::numeric) * 100, 2)
        ELSE 0 
    END as monthly_conversion_rate,
    COUNT(*) as active_days
FROM daily_conversion_stats
WHERE date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY TO_CHAR(date, 'YYYY-MM')
ORDER BY month DESC;

-- 5. コンバージョンパフォーマンス分析ファンクション
CREATE OR REPLACE FUNCTION get_conversion_insights()
RETURNS TABLE (
    metric_name text,
    metric_value numeric,
    metric_description text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            SUM(cta_clicks) as total_clicks,
            SUM(consultation_requests) as total_consultations,
            AVG(conversion_rate) as avg_daily_conversion_rate,
            MAX(conversion_rate) as best_daily_conversion_rate,
            MIN(CASE WHEN conversion_rate > 0 THEN conversion_rate END) as worst_daily_conversion_rate
        FROM daily_conversion_stats
        WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    )
    SELECT 'total_cta_clicks'::text, total_clicks, '過去30日のCTAクリック総数'::text FROM stats
    UNION ALL
    SELECT 'total_consultations'::text, total_consultations, '過去30日の相談申し込み総数'::text FROM stats
    UNION ALL
    SELECT 'overall_conversion_rate'::text, 
           CASE WHEN total_clicks > 0 THEN (total_consultations / total_clicks) * 100 ELSE 0 END,
           '過去30日の全体コンバージョン率(%)'::text FROM stats
    UNION ALL
    SELECT 'avg_daily_conversion_rate'::text, avg_daily_conversion_rate, '日別平均コンバージョン率(%)'::text FROM stats
    UNION ALL
    SELECT 'best_daily_conversion_rate'::text, best_daily_conversion_rate, '最高日別コンバージョン率(%)'::text FROM stats
    UNION ALL
    SELECT 'worst_daily_conversion_rate'::text, COALESCE(worst_daily_conversion_rate, 0), '最低日別コンバージョン率(%)'::text FROM stats;
END;
$$;

-- 6. インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_cta_clicks_consultation_analysis 
ON cta_clicks (cta_type, clicked_at, ip_address) 
WHERE cta_type = 'consultation';

CREATE INDEX IF NOT EXISTS idx_consultation_requests_date 
ON consultation_requests (created_at);

-- コメント追加
COMMENT ON VIEW daily_conversion_stats IS 'CTAクリックから相談申し込みまでの日別コンバージョン統計';
COMMENT ON VIEW ip_based_conversion_tracking IS 'IPアドレスベースのコンバージョン追跡（同一IP内でのCTAクリック→相談申し込みの流れを分析）';
COMMENT ON VIEW monthly_conversion_summary IS '月別コンバージョンサマリー統計';
COMMENT ON FUNCTION analyze_cta_conversions() IS 'CTAコンバージョン分析データを取得する関数';
COMMENT ON FUNCTION get_conversion_insights() IS 'コンバージョンパフォーマンスの主要指標を取得する関数'; 