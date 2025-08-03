-- =====================================================
-- KPI/KGI管理システムマイグレーション
-- 作成日: 2025年2月8日
-- 目的: 個人KPI・チームKPI・KGI（重要目標達成指標）管理システム実装
-- 機能: 数値目標設定、進捗追跡、達成率分析、可視化
-- =====================================================

-- 1. KPI/KGI指標マスターテーブル
CREATE TABLE IF NOT EXISTS kpi_indicators (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    indicator_name varchar(150) NOT NULL,
    indicator_type varchar(20) NOT NULL CHECK (indicator_type IN ('personal_kpi', 'team_kpi', 'kgi')),
    description text,
    measurement_unit varchar(50) NOT NULL, -- 測定単位（件、円、%、時間など）
    measurement_method text, -- 測定方法の説明
    category varchar(50) NOT NULL, -- カテゴリ（売上、品質、効率性、顧客満足度など）
    frequency varchar(20) NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    target_type varchar(20) NOT NULL DEFAULT 'increase' CHECK (target_type IN ('increase', 'decrease', 'maintain')), -- 目標タイプ
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. KPI/KGI目標設定テーブル
CREATE TABLE IF NOT EXISTS kpi_targets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    indicator_id uuid NOT NULL REFERENCES kpi_indicators(id) ON DELETE CASCADE,
    target_period varchar(7) NOT NULL, -- 目標期間（YYYY-MM形式）
    assigned_member_id uuid REFERENCES members(id) ON DELETE CASCADE, -- 個人KPI用
    assigned_team varchar(50), -- チームKPI用（部署名）
    target_value decimal(15,2) NOT NULL, -- 目標値
    baseline_value decimal(15,2) DEFAULT 0, -- ベースライン値
    current_value decimal(15,2) DEFAULT 0, -- 現在値
    achievement_rate decimal(5,2) DEFAULT 0, -- 達成率（%）
    status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'failed', 'cancelled', 'suspended')),
    priority varchar(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    start_date date NOT NULL,
    end_date date NOT NULL,
    notes text,
    created_by uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_assignment CHECK (
        (assigned_member_id IS NOT NULL AND assigned_team IS NULL) OR 
        (assigned_member_id IS NULL AND assigned_team IS NOT NULL)
    )
);

-- 3. KPI進捗記録テーブル
CREATE TABLE IF NOT EXISTS kpi_progress_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id uuid NOT NULL REFERENCES kpi_targets(id) ON DELETE CASCADE,
    record_date date NOT NULL DEFAULT CURRENT_DATE,
    recorded_value decimal(15,2) NOT NULL, -- 記録値
    previous_value decimal(15,2), -- 前回値
    change_amount decimal(15,2), -- 変化量
    change_rate decimal(5,2), -- 変化率（%）
    achievement_rate decimal(5,2), -- その時点での達成率
    comments text, -- コメント
    evidence_url varchar(500), -- 根拠資料URL
    recorded_by uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    approved_by uuid REFERENCES members(id) ON DELETE SET NULL,
    approved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. KPI評価・分析テーブル
CREATE TABLE IF NOT EXISTS kpi_evaluations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id uuid NOT NULL REFERENCES kpi_targets(id) ON DELETE CASCADE,
    evaluation_period varchar(7) NOT NULL, -- 評価期間（YYYY-MM形式）
    final_achievement_rate decimal(5,2) NOT NULL, -- 最終達成率
    evaluation_score integer CHECK (evaluation_score BETWEEN 1 AND 5), -- 評価スコア（1-5）
    strengths text, -- 強み・良かった点
    weaknesses text, -- 弱み・改善点
    action_items text, -- 次回に向けたアクション
    evaluator_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    evaluated_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- インデックス作成
-- =====================================================

-- kpi_indicators用インデックス
CREATE INDEX IF NOT EXISTS idx_kpi_indicators_type ON kpi_indicators(indicator_type);
CREATE INDEX IF NOT EXISTS idx_kpi_indicators_category ON kpi_indicators(category);
CREATE INDEX IF NOT EXISTS idx_kpi_indicators_active ON kpi_indicators(is_active);
CREATE INDEX IF NOT EXISTS idx_kpi_indicators_created_by ON kpi_indicators(created_by);

-- kpi_targets用インデックス
CREATE INDEX IF NOT EXISTS idx_kpi_targets_indicator_id ON kpi_targets(indicator_id);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_period ON kpi_targets(target_period);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_member_id ON kpi_targets(assigned_member_id);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_team ON kpi_targets(assigned_team);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_status ON kpi_targets(status);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_priority ON kpi_targets(priority);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_date_range ON kpi_targets(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_period_status ON kpi_targets(target_period, status);

-- kpi_progress_records用インデックス
CREATE INDEX IF NOT EXISTS idx_kpi_progress_target_id ON kpi_progress_records(target_id);
CREATE INDEX IF NOT EXISTS idx_kpi_progress_date ON kpi_progress_records(record_date);
CREATE INDEX IF NOT EXISTS idx_kpi_progress_recorded_by ON kpi_progress_records(recorded_by);
CREATE INDEX IF NOT EXISTS idx_kpi_progress_target_date ON kpi_progress_records(target_id, record_date);

-- kpi_evaluations用インデックス
CREATE INDEX IF NOT EXISTS idx_kpi_evaluations_target_id ON kpi_evaluations(target_id);
CREATE INDEX IF NOT EXISTS idx_kpi_evaluations_period ON kpi_evaluations(evaluation_period);
CREATE INDEX IF NOT EXISTS idx_kpi_evaluations_evaluator ON kpi_evaluations(evaluator_id);

-- =====================================================
-- トリガー関数とトリガー作成
-- =====================================================

-- updated_at自動更新トリガー関数（既存の場合はスキップ）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにupdated_atトリガーを設定
CREATE TRIGGER update_kpi_indicators_updated_at BEFORE UPDATE ON kpi_indicators FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_kpi_targets_updated_at BEFORE UPDATE ON kpi_targets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_kpi_progress_records_updated_at BEFORE UPDATE ON kpi_progress_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_kpi_evaluations_updated_at BEFORE UPDATE ON kpi_evaluations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 達成率自動計算トリガー関数
CREATE OR REPLACE FUNCTION calculate_achievement_rate()
RETURNS TRIGGER AS $$
BEGIN
    -- target_valueが0の場合は達成率を0に設定
    IF NEW.target_value = 0 THEN
        NEW.achievement_rate = 0;
    ELSE
        -- 達成率計算（現在値 ÷ 目標値 × 100）
        NEW.achievement_rate = ROUND((NEW.current_value / NEW.target_value) * 100, 2);
        
        -- 達成率の上限を999.99%に設定
        IF NEW.achievement_rate > 999.99 THEN
            NEW.achievement_rate = 999.99;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- kpi_targetsテーブルに達成率自動計算トリガーを設定
CREATE TRIGGER calculate_kpi_achievement_rate 
    BEFORE INSERT OR UPDATE OF current_value, target_value ON kpi_targets 
    FOR EACH ROW EXECUTE PROCEDURE calculate_achievement_rate();

-- 進捗記録時の変化量・変化率自動計算トリガー関数
CREATE OR REPLACE FUNCTION calculate_progress_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- 前回値が設定されている場合の変化量・変化率計算
    IF NEW.previous_value IS NOT NULL THEN
        NEW.change_amount = NEW.recorded_value - NEW.previous_value;
        
        IF NEW.previous_value = 0 THEN
            NEW.change_rate = 0;
        ELSE
            NEW.change_rate = ROUND(((NEW.recorded_value - NEW.previous_value) / NEW.previous_value) * 100, 2);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- kpi_progress_recordsテーブルに変化量計算トリガーを設定
CREATE TRIGGER calculate_progress_changes_trigger 
    BEFORE INSERT OR UPDATE ON kpi_progress_records 
    FOR EACH ROW EXECUTE PROCEDURE calculate_progress_changes();

-- =====================================================
-- ビュー作成
-- =====================================================

-- 1. KPI/KGI統合管理ビュー
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
    EXTRACT(epoch FROM (t.end_date::timestamp - CURRENT_DATE::timestamp))/86400 as days_remaining,
    cb.name as created_by_name,
    cb.role as created_by_role,
    t.created_at,
    t.updated_at
FROM kpi_targets t
JOIN kpi_indicators i ON t.indicator_id = i.id
LEFT JOIN members m ON t.assigned_member_id = m.id
JOIN members cb ON t.created_by = cb.id
WHERE i.is_active = true;

-- 2. KPI進捗統計ビュー
CREATE OR REPLACE VIEW kpi_progress_stats AS
SELECT 
    t.id as target_id,
    t.target_period,
    i.indicator_name,
    i.indicator_type,
    i.category,
    COUNT(pr.id) as total_records,
    MIN(pr.record_date) as first_record_date,
    MAX(pr.record_date) as latest_record_date,
    AVG(pr.recorded_value) as avg_recorded_value,
    MIN(pr.recorded_value) as min_recorded_value,
    MAX(pr.recorded_value) as max_recorded_value,
    STDDEV(pr.recorded_value) as stddev_recorded_value,
    AVG(pr.achievement_rate) as avg_achievement_rate,
    MAX(pr.achievement_rate) as max_achievement_rate,
    -- 最新の記録値
    (SELECT recorded_value FROM kpi_progress_records WHERE target_id = t.id ORDER BY record_date DESC LIMIT 1) as latest_value,
    -- トレンド分析（直近3回の平均と前3回の平均を比較）
    CASE 
        WHEN COUNT(pr.id) >= 6 THEN
            CASE 
                WHEN (SELECT AVG(recorded_value) FROM (SELECT recorded_value FROM kpi_progress_records WHERE target_id = t.id ORDER BY record_date DESC LIMIT 3) recent) >
                     (SELECT AVG(recorded_value) FROM (SELECT recorded_value FROM kpi_progress_records WHERE target_id = t.id ORDER BY record_date DESC LIMIT 6 OFFSET 3) previous) THEN 'improving'
                WHEN (SELECT AVG(recorded_value) FROM (SELECT recorded_value FROM kpi_progress_records WHERE target_id = t.id ORDER BY record_date DESC LIMIT 3) recent) <
                     (SELECT AVG(recorded_value) FROM (SELECT recorded_value FROM kpi_progress_records WHERE target_id = t.id ORDER BY record_date DESC LIMIT 6 OFFSET 3) previous) THEN 'declining'
                ELSE 'stable'
            END
        ELSE 'insufficient_data'
    END as trend_analysis
FROM kpi_targets t
JOIN kpi_indicators i ON t.indicator_id = i.id
LEFT JOIN kpi_progress_records pr ON t.id = pr.target_id
GROUP BY t.id, t.target_period, i.indicator_name, i.indicator_type, i.category;

-- 3. 月次KPI達成状況サマリービュー
CREATE OR REPLACE VIEW monthly_kpi_summary AS
SELECT 
    target_period,
    indicator_type,
    category,
    COUNT(*) as total_kpis,
    COUNT(CASE WHEN achievement_rate >= 100 THEN 1 END) as achieved_kpis,
    COUNT(CASE WHEN achievement_rate >= 80 AND achievement_rate < 100 THEN 1 END) as on_track_kpis,
    COUNT(CASE WHEN achievement_rate >= 60 AND achievement_rate < 80 THEN 1 END) as needs_attention_kpis,
    COUNT(CASE WHEN achievement_rate < 60 THEN 1 END) as at_risk_kpis,
    ROUND(AVG(achievement_rate), 2) as avg_achievement_rate,
    ROUND(AVG(CASE WHEN status = 'achieved' THEN achievement_rate END), 2) as avg_achieved_rate,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_kpis,
    COUNT(CASE WHEN status = 'achieved' THEN 1 END) as completed_kpis,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_kpis
FROM kpi_management_view
GROUP BY target_period, indicator_type, category
ORDER BY target_period DESC, indicator_type, category;

-- 4. ダッシュボード用KPI概要ビュー
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

-- =====================================================
-- ファンクション作成
-- =====================================================

-- 1. KPI分析インサイト取得ファンクション
CREATE OR REPLACE FUNCTION get_kpi_insights(
    target_period_param varchar(7) DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
    indicator_type_param varchar(20) DEFAULT NULL
)
RETURNS TABLE (
    period varchar(7),
    total_indicators integer,
    avg_achievement_rate decimal(5,2),
    top_performer_indicator varchar(150),
    top_performer_rate decimal(5,2),
    lowest_performer_indicator varchar(150),
    lowest_performer_rate decimal(5,2),
    improving_trends_count integer,
    declining_trends_count integer,
    critical_alerts_count integer,
    recommendations text
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH period_stats AS (
        SELECT 
            kmv.target_period,
            COUNT(*) as total_count,
            ROUND(AVG(kmv.achievement_rate), 2) as avg_rate,
            COUNT(CASE WHEN kps.trend_analysis = 'improving' THEN 1 END) as improving_count,
            COUNT(CASE WHEN kps.trend_analysis = 'declining' THEN 1 END) as declining_count,
            COUNT(CASE WHEN kmv.priority = 'critical' AND kmv.performance_status = 'at_risk' THEN 1 END) as critical_count
        FROM kpi_management_view kmv
        LEFT JOIN kpi_progress_stats kps ON kmv.target_id = kps.target_id
        WHERE kmv.target_period = target_period_param
        AND (indicator_type_param IS NULL OR kmv.indicator_type = indicator_type_param)
        GROUP BY kmv.target_period
    ),
    top_performer AS (
        SELECT indicator_name, achievement_rate
        FROM kpi_management_view
        WHERE target_period = target_period_param
        AND (indicator_type_param IS NULL OR indicator_type = indicator_type_param)
        ORDER BY achievement_rate DESC
        LIMIT 1
    ),
    lowest_performer AS (
        SELECT indicator_name, achievement_rate
        FROM kpi_management_view
        WHERE target_period = target_period_param
        AND (indicator_type_param IS NULL OR indicator_type = indicator_type_param)
        ORDER BY achievement_rate ASC
        LIMIT 1
    )
    SELECT 
        target_period_param,
        COALESCE(ps.total_count, 0)::integer,
        COALESCE(ps.avg_rate, 0),
        COALESCE(tp.indicator_name, 'N/A'),
        COALESCE(tp.achievement_rate, 0),
        COALESCE(lp.indicator_name, 'N/A'),
        COALESCE(lp.achievement_rate, 0),
        COALESCE(ps.improving_count, 0)::integer,
        COALESCE(ps.declining_count, 0)::integer,
        COALESCE(ps.critical_count, 0)::integer,
        CASE 
            WHEN ps.avg_rate >= 90 THEN '優秀な成果を維持してください。'
            WHEN ps.avg_rate >= 70 THEN '良好な進捗です。低い達成率の指標に注力してください。'
            WHEN ps.avg_rate >= 50 THEN '改善が必要です。アクションプランの見直しを推奨します。'
            ELSE '緊急対応が必要です。リソースの再配分を検討してください。'
        END as recommendations
    FROM period_stats ps
    LEFT JOIN top_performer tp ON true
    LEFT JOIN lowest_performer lp ON true;
END;
$$;

-- 2. 個人KPI取得ファンクション
CREATE OR REPLACE FUNCTION get_member_kpis(
    member_id_param uuid,
    period_param varchar(7) DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY-MM')
)
RETURNS TABLE (
    target_id uuid,
    indicator_name varchar(150),
    target_value decimal(15,2),
    current_value decimal(15,2),
    achievement_rate decimal(5,2),
    status varchar(20),
    priority varchar(10),
    performance_status text,
    timeline_status text,
    days_remaining decimal
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kmv.target_id,
        kmv.indicator_name,
        kmv.target_value,
        kmv.current_value,
        kmv.achievement_rate,
        kmv.status,
        kmv.priority,
        kmv.performance_status,
        kmv.timeline_status,
        kmv.days_remaining
    FROM kpi_management_view kmv
    WHERE kmv.assigned_member_id = member_id_param
    AND kmv.target_period = period_param
    ORDER BY kmv.priority DESC, kmv.achievement_rate ASC;
END;
$$;

-- =====================================================
-- RLS (Row Level Security) 設定
-- =====================================================

-- RLS無効化（アプリケーションレベルで制御）
ALTER TABLE kpi_indicators DISABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_targets DISABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_progress_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_evaluations DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 初期サンプルデータ挿入
-- =====================================================

-- サンプル指標マスター
INSERT INTO kpi_indicators (indicator_name, indicator_type, description, measurement_unit, category, frequency, created_by) 
SELECT 
    '月次売上目標', 'team_kpi', '部署の月次売上目標達成', '万円', '売上', 'monthly', id
FROM members WHERE email = 'queue@queue-tech.jp'
ON CONFLICT DO NOTHING;

INSERT INTO kpi_indicators (indicator_name, indicator_type, description, measurement_unit, category, frequency, created_by) 
SELECT 
    '新規顧客獲得数', 'personal_kpi', '個人の新規顧客獲得目標', '件', '営業', 'monthly', id
FROM members WHERE email = 'queue@queue-tech.jp'
ON CONFLICT DO NOTHING;

INSERT INTO kpi_indicators (indicator_name, indicator_type, description, measurement_unit, category, frequency, created_by) 
SELECT 
    '年間収益目標', 'kgi', '会社全体の年間収益目標', '百万円', '財務', 'yearly', id
FROM members WHERE email = 'queue@queue-tech.jp'
ON CONFLICT DO NOTHING;

-- テーブルコメント追加
COMMENT ON TABLE kpi_indicators IS 'KPI/KGI指標マスターテーブル - 測定指標の定義と管理';
COMMENT ON TABLE kpi_targets IS 'KPI/KGI目標設定テーブル - 期間別目標値と進捗管理';
COMMENT ON TABLE kpi_progress_records IS 'KPI進捗記録テーブル - 実績値の記録と追跡';
COMMENT ON TABLE kpi_evaluations IS 'KPI評価・分析テーブル - 期間終了時の評価と振り返り';

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'KPI/KGI管理システムのデータベーススキーマ作成完了';
    RAISE NOTICE 'テーブル: 4個, ビュー: 4個, ファンクション: 2個, トリガー: 7個';
    RAISE NOTICE '機能: 個人KPI・チームKPI・KGI管理、進捗追跡、達成率分析、可視化対応';
END $$; 