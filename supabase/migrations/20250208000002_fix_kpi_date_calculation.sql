-- =====================================================
-- KPI/KGI管理システム日付計算修正マイグレーション
-- 作成日: 2025年2月8日
-- 目的: PostgreSQL型キャストエラーの修正
-- 問題: EXTRACT関数での日付差分計算でtype castエラー
-- 解決: 明示的なtimestamp型キャストを追加
-- =====================================================

-- 既存のkpi_management_viewを削除して再作成
DROP VIEW IF EXISTS kpi_management_view CASCADE;

-- 修正版のKPI/KGI統合管理ビューを作成
CREATE OR REPLACE VIEW kpi_management_view AS
SELECT 
    t.id as target_id,
    i.id as indicator_id,
    i.indicator_name,
    i.indicator_type,
    i.description,
    i.measurement_unit,
    i.category,
    i.frequency,
    i.target_type,
    t.target_period,
    t.assigned_member_id,
    m.name as assigned_member_name,
    m.email as assigned_member_email,
    m.department as assigned_member_department,
    t.assigned_team,
    t.target_value,
    t.baseline_value,
    t.current_value,
    t.achievement_rate,
    t.status,
    t.priority,
    t.start_date,
    t.end_date,
    t.notes,
    CASE 
        WHEN t.achievement_rate >= 100 THEN 'achieved'
        WHEN t.achievement_rate >= 80 THEN 'on_track'
        WHEN t.achievement_rate >= 60 THEN 'needs_attention'
        ELSE 'at_risk'
    END as performance_status,
    CASE 
        WHEN t.end_date < CURRENT_DATE THEN 'overdue'
        WHEN t.end_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
        ELSE 'on_schedule'
    END as timeline_status,
    -- 修正: 明示的なtimestamp型キャスト
    CASE 
        WHEN t.end_date >= CURRENT_DATE THEN 
            EXTRACT(epoch FROM (t.end_date::timestamp - CURRENT_DATE::timestamp))/86400
        ELSE 
            -EXTRACT(epoch FROM (CURRENT_DATE::timestamp - t.end_date::timestamp))/86400
    END as days_remaining,
    cb.name as created_by_name,
    cb.role as created_by_role,
    t.created_at,
    t.updated_at
FROM kpi_targets t
JOIN kpi_indicators i ON t.indicator_id = i.id
LEFT JOIN members m ON t.assigned_member_id = m.id
JOIN members cb ON t.created_by = cb.id
WHERE i.is_active = true;

-- 依存するビューも再作成（必要に応じて）
-- dashboard_kpi_overviewビューも日付計算を含む場合は再作成
DROP VIEW IF EXISTS dashboard_kpi_overview CASCADE;

CREATE OR REPLACE VIEW dashboard_kpi_overview AS
SELECT 
    -- 現在月の統計
    current_month.total_kpis,
    current_month.achieved_kpis,
    current_month.on_track_kpis,
    current_month.needs_attention_kpis,
    current_month.at_risk_kpis,
    current_month.avg_achievement_rate as current_month_avg_rate,
    
    -- 前月との比較
    COALESCE(previous_month.avg_achievement_rate, 0) as previous_month_avg_rate,
    ROUND(current_month.avg_achievement_rate - COALESCE(previous_month.avg_achievement_rate, 0), 2) as rate_change_from_previous,
    
    -- 種別別統計
    (SELECT COUNT(*) FROM kpi_management_view WHERE indicator_type = 'personal_kpi' AND target_period = TO_CHAR(CURRENT_DATE, 'YYYY-MM')) as personal_kpis,
    (SELECT COUNT(*) FROM kpi_management_view WHERE indicator_type = 'team_kpi' AND target_period = TO_CHAR(CURRENT_DATE, 'YYYY-MM')) as team_kpis,
    (SELECT COUNT(*) FROM kpi_management_view WHERE indicator_type = 'kgi' AND target_period = TO_CHAR(CURRENT_DATE, 'YYYY-MM')) as kgis,
    
    -- 高優先度アラート
    (SELECT COUNT(*) FROM kpi_management_view WHERE priority = 'critical' AND performance_status = 'at_risk' AND target_period = TO_CHAR(CURRENT_DATE, 'YYYY-MM')) as critical_at_risk,
    (SELECT COUNT(*) FROM kpi_management_view WHERE timeline_status = 'due_soon' AND target_period = TO_CHAR(CURRENT_DATE, 'YYYY-MM')) as due_soon_count,
    (SELECT COUNT(*) FROM kpi_management_view WHERE timeline_status = 'overdue' AND target_period = TO_CHAR(CURRENT_DATE, 'YYYY-MM')) as overdue_count
FROM (
    SELECT 
        COUNT(*) as total_kpis,
        COUNT(CASE WHEN achievement_rate >= 100 THEN 1 END) as achieved_kpis,
        COUNT(CASE WHEN achievement_rate >= 80 AND achievement_rate < 100 THEN 1 END) as on_track_kpis,
        COUNT(CASE WHEN achievement_rate >= 60 AND achievement_rate < 80 THEN 1 END) as needs_attention_kpis,
        COUNT(CASE WHEN achievement_rate < 60 THEN 1 END) as at_risk_kpis,
        ROUND(AVG(achievement_rate), 2) as avg_achievement_rate
    FROM kpi_management_view 
    WHERE target_period = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
) current_month
LEFT JOIN (
    SELECT 
        ROUND(AVG(achievement_rate), 2) as avg_achievement_rate
    FROM kpi_management_view 
    WHERE target_period = TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM')
) previous_month ON true;

-- 進捗統計ビューも同様に修正（日付計算がある場合）
-- kpi_progress_statsは大丈夫そうですが、念のためチェック

-- コメント
COMMENT ON VIEW kpi_management_view IS 'KPI/KGI統合管理ビュー - 日付計算型キャスト修正済み（2025年2月8日）';
COMMENT ON VIEW dashboard_kpi_overview IS 'ダッシュボード用KPI概要ビュー - 型キャスト修正済み（2025年2月8日）';

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'KPI/KGI管理システムの日付計算型キャストエラー修正完了';
    RAISE NOTICE 'EXTRACT関数での明示的timestamp型キャスト適用済み';
    RAISE NOTICE 'kpi_management_viewとdashboard_kpi_overviewを再作成';
END $$; 