-- =====================================================
-- 普通の社員でも個人KPI作成を可能にする権限設定
-- 作成日: 2025年1月11日
-- 目的: Row Level Security (RLS) 有効化と個人KPI作成権限の付与
-- =====================================================

-- =====================================================
-- 1. RLS (Row Level Security) 有効化
-- =====================================================

-- KPI関連テーブルのRLSを有効化
ALTER TABLE kpi_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_progress_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_evaluations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. kpi_indicators テーブルのRLSポリシー
-- =====================================================

-- 個人KPI指標の作成権限（すべての社員が個人KPI指標を作成可能）
CREATE POLICY "個人KPI指標作成権限" ON kpi_indicators
    FOR INSERT
    WITH CHECK (
        indicator_type = 'personal_kpi' 
        AND created_by = auth.uid()
    );

-- 個人KPI指標の参照権限（作成者本人 + 役員が参照可能）
CREATE POLICY "個人KPI指標参照権限" ON kpi_indicators
    FOR SELECT
    USING (
        -- 作成者本人
        created_by = auth.uid()
        OR
        -- 役員権限（チーム・KGI指標も含めて全て参照可能）
        EXISTS (
            SELECT 1 FROM members 
            WHERE id = auth.uid() 
            AND role IN ('役員', 'admin', 'manager')
        )
        OR
        -- チーム・KGI指標は全員参照可能
        indicator_type IN ('team_kpi', 'kgi')
    );

-- 個人KPI指標の更新権限（作成者本人のみ）
CREATE POLICY "個人KPI指標更新権限" ON kpi_indicators
    FOR UPDATE
    USING (
        indicator_type = 'personal_kpi' 
        AND created_by = auth.uid()
    )
    WITH CHECK (
        indicator_type = 'personal_kpi' 
        AND created_by = auth.uid()
    );

-- 個人KPI指標の削除権限（作成者本人のみ）
CREATE POLICY "個人KPI指標削除権限" ON kpi_indicators
    FOR DELETE
    USING (
        indicator_type = 'personal_kpi' 
        AND created_by = auth.uid()
    );

-- 役員用の全KPI指標管理権限
CREATE POLICY "役員KPI指標管理権限" ON kpi_indicators
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE id = auth.uid() 
            AND role IN ('役員', 'admin', 'manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM members 
            WHERE id = auth.uid() 
            AND role IN ('役員', 'admin', 'manager')
        )
    );

-- =====================================================
-- 3. kpi_targets テーブルのRLSポリシー
-- =====================================================

-- 個人KPI目標の作成権限（自分の個人KPI指標に対してのみ）
CREATE POLICY "個人KPI目標作成権限" ON kpi_targets
    FOR INSERT
    WITH CHECK (
        assigned_member_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM kpi_indicators 
            WHERE id = indicator_id 
            AND indicator_type = 'personal_kpi'
            AND created_by = auth.uid()
        )
    );

-- 個人KPI目標の参照権限（本人 + 役員）
CREATE POLICY "個人KPI目標参照権限" ON kpi_targets
    FOR SELECT
    USING (
        -- 自分が担当の目標
        assigned_member_id = auth.uid()
        OR
        -- 役員権限
        EXISTS (
            SELECT 1 FROM members 
            WHERE id = auth.uid() 
            AND role IN ('役員', 'admin', 'manager')
        )
        OR
        -- チーム目標は全員参照可能
        assigned_team IS NOT NULL
    );

-- 個人KPI目標の更新権限（本人のみ）
CREATE POLICY "個人KPI目標更新権限" ON kpi_targets
    FOR UPDATE
    USING (
        assigned_member_id = auth.uid()
    )
    WITH CHECK (
        assigned_member_id = auth.uid()
    );

-- 個人KPI目標の削除権限（本人のみ）
CREATE POLICY "個人KPI目標削除権限" ON kpi_targets
    FOR DELETE
    USING (
        assigned_member_id = auth.uid()
    );

-- 役員用の全KPI目標管理権限
CREATE POLICY "役員KPI目標管理権限" ON kpi_targets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE id = auth.uid() 
            AND role IN ('役員', 'admin', 'manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM members 
            WHERE id = auth.uid() 
            AND role IN ('役員', 'admin', 'manager')
        )
    );

-- =====================================================
-- 4. kpi_progress_records テーブルのRLSポリシー
-- =====================================================

-- KPI進捗記録の作成権限（自分の目標に対してのみ）
CREATE POLICY "KPI進捗記録作成権限" ON kpi_progress_records
    FOR INSERT
    WITH CHECK (
        recorded_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM kpi_targets 
            WHERE id = target_id 
            AND assigned_member_id = auth.uid()
        )
    );

-- KPI進捗記録の参照権限（目標担当者 + 役員）
CREATE POLICY "KPI進捗記録参照権限" ON kpi_progress_records
    FOR SELECT
    USING (
        -- 自分が記録した進捗
        recorded_by = auth.uid()
        OR
        -- 自分の目標の進捗
        EXISTS (
            SELECT 1 FROM kpi_targets 
            WHERE id = target_id 
            AND assigned_member_id = auth.uid()
        )
        OR
        -- 役員権限
        EXISTS (
            SELECT 1 FROM members 
            WHERE id = auth.uid() 
            AND role IN ('役員', 'admin', 'manager')
        )
    );

-- KPI進捗記録の更新権限（記録者本人のみ）
CREATE POLICY "KPI進捗記録更新権限" ON kpi_progress_records
    FOR UPDATE
    USING (
        recorded_by = auth.uid()
    )
    WITH CHECK (
        recorded_by = auth.uid()
    );

-- KPI進捗記録の削除権限（記録者本人のみ）
CREATE POLICY "KPI進捗記録削除権限" ON kpi_progress_records
    FOR DELETE
    USING (
        recorded_by = auth.uid()
    );

-- 役員用の全KPI進捗記録管理権限
CREATE POLICY "役員KPI進捗記録管理権限" ON kpi_progress_records
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE id = auth.uid() 
            AND role IN ('役員', 'admin', 'manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM members 
            WHERE id = auth.uid() 
            AND role IN ('役員', 'admin', 'manager')
        )
    );

-- =====================================================
-- 5. kpi_evaluations テーブルのRLSポリシー
-- =====================================================

-- KPI評価の参照権限（目標担当者 + 役員）
CREATE POLICY "KPI評価参照権限" ON kpi_evaluations
    FOR SELECT
    USING (
        -- 自分の目標の評価
        EXISTS (
            SELECT 1 FROM kpi_targets 
            WHERE id = target_id 
            AND assigned_member_id = auth.uid()
        )
        OR
        -- 役員権限
        EXISTS (
            SELECT 1 FROM members 
            WHERE id = auth.uid() 
            AND role IN ('役員', 'admin', 'manager')
        )
    );

-- KPI評価の作成・更新・削除権限（役員のみ）
CREATE POLICY "KPI評価管理権限" ON kpi_evaluations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE id = auth.uid() 
            AND role IN ('役員', 'admin', 'manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM members 
            WHERE id = auth.uid() 
            AND role IN ('役員', 'admin', 'manager')
        )
    );

-- =====================================================
-- 6. 個人KPI作成支援用のファンクション
-- =====================================================

-- 個人KPI指標作成ヘルパー関数
CREATE OR REPLACE FUNCTION create_personal_kpi_indicator(
    p_indicator_name varchar(150),
    p_description text,
    p_measurement_unit varchar(50),
    p_category varchar(50),
    p_frequency varchar(20) DEFAULT 'monthly',
    p_target_type varchar(20) DEFAULT 'increase',
    p_measurement_method text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    new_indicator_id uuid;
BEGIN
    -- パラメータバリデーション
    IF p_indicator_name IS NULL OR LENGTH(TRIM(p_indicator_name)) = 0 THEN
        RAISE EXCEPTION 'KPI指標名は必須です';
    END IF;
    
    IF p_measurement_unit IS NULL OR LENGTH(TRIM(p_measurement_unit)) = 0 THEN
        RAISE EXCEPTION '測定単位は必須です';
    END IF;
    
    IF p_category IS NULL OR LENGTH(TRIM(p_category)) = 0 THEN
        RAISE EXCEPTION 'カテゴリは必須です';
    END IF;
    
    -- 個人KPI指標を作成
    INSERT INTO kpi_indicators (
        indicator_name, 
        indicator_type, 
        description, 
        measurement_unit,
        measurement_method,
        category, 
        frequency, 
        target_type,
        created_by
    ) VALUES (
        TRIM(p_indicator_name),
        'personal_kpi',
        p_description,
        TRIM(p_measurement_unit),
        p_measurement_method,
        TRIM(p_category),
        p_frequency,
        p_target_type,
        auth.uid()
    ) RETURNING id INTO new_indicator_id;
    
    RETURN new_indicator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 個人KPI目標設定ヘルパー関数
CREATE OR REPLACE FUNCTION create_personal_kpi_target(
    p_indicator_id uuid,
    p_target_period varchar(7),
    p_target_value decimal(15,2),
    p_baseline_value decimal(15,2) DEFAULT 0,
    p_priority varchar(10) DEFAULT 'medium',
    p_start_date date DEFAULT CURRENT_DATE,
    p_end_date date DEFAULT NULL,
    p_notes text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    new_target_id uuid;
    indicator_exists boolean;
    calculated_end_date date;
BEGIN
    -- 指標が存在し、個人KPIかつ作成者が本人であることを確認
    SELECT EXISTS (
        SELECT 1 FROM kpi_indicators 
        WHERE id = p_indicator_id 
        AND indicator_type = 'personal_kpi'
        AND created_by = auth.uid()
    ) INTO indicator_exists;
    
    IF NOT indicator_exists THEN
        RAISE EXCEPTION '指定されたKPI指標が見つからないか、権限がありません';
    END IF;
    
    -- 終了日が指定されていない場合、期間に基づいて自動計算
    IF p_end_date IS NULL THEN
        calculated_end_date := (p_target_period || '-01')::date + INTERVAL '1 month' - INTERVAL '1 day';
    ELSE
        calculated_end_date := p_end_date;
    END IF;
    
    -- パラメータバリデーション
    IF p_target_value IS NULL THEN
        RAISE EXCEPTION '目標値は必須です';
    END IF;
    
    IF p_start_date > calculated_end_date THEN
        RAISE EXCEPTION '開始日は終了日より前である必要があります';
    END IF;
    
    -- 個人KPI目標を作成
    INSERT INTO kpi_targets (
        indicator_id,
        target_period,
        assigned_member_id,
        target_value,
        baseline_value,
        priority,
        start_date,
        end_date,
        notes,
        created_by
    ) VALUES (
        p_indicator_id,
        p_target_period,
        auth.uid(),
        p_target_value,
        p_baseline_value,
        p_priority,
        p_start_date,
        calculated_end_date,
        p_notes,
        auth.uid()
    ) RETURNING id INTO new_target_id;
    
    RETURN new_target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 個人KPI一覧取得関数
CREATE OR REPLACE FUNCTION get_my_personal_kpis(
    p_target_period varchar(7) DEFAULT NULL
)
RETURNS TABLE (
    target_id uuid,
    indicator_id uuid,
    indicator_name varchar(150),
    description text,
    measurement_unit varchar(50),
    category varchar(50),
    target_period varchar(7),
    target_value decimal(15,2),
    current_value decimal(15,2),
    achievement_rate decimal(5,2),
    status varchar(20),
    priority varchar(10),
    start_date date,
    end_date date,
    days_remaining numeric,
    performance_status text,
    timeline_status text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kmv.target_id,
        kmv.indicator_id,
        kmv.indicator_name,
        kmv.description,
        kmv.measurement_unit,
        kmv.category,
        kmv.target_period,
        kmv.target_value,
        kmv.current_value,
        kmv.achievement_rate,
        kmv.status,
        kmv.priority,
        kmv.start_date,
        kmv.end_date,
        kmv.days_remaining,
        kmv.performance_status,
        kmv.timeline_status
    FROM kpi_management_view kmv
    WHERE kmv.assigned_member_id = auth.uid()
    AND (p_target_period IS NULL OR kmv.target_period = p_target_period)
    ORDER BY kmv.priority DESC, kmv.end_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. 個人KPI用の推奨カテゴリ・測定単位のマスターデータ
-- =====================================================

-- 個人KPI推奨カテゴリビュー
CREATE OR REPLACE VIEW personal_kpi_categories AS
SELECT category_name, description, examples
FROM (VALUES
    ('営業', '営業活動に関するKPI', '新規顧客獲得数、商談件数、成約率'),
    ('効率性', '業務効率に関するKPI', '作業時間短縮、ミス削減、プロセス改善'),
    ('品質', '成果物の品質に関するKPI', 'レビュー完了率、品質スコア、顧客満足度'),
    ('学習・成長', 'スキルアップに関するKPI', '研修受講時間、資格取得、知識習得'),
    ('コミュニケーション', 'チーム連携に関するKPI', 'レスポンス時間、会議参加率、情報共有'),
    ('健康・ワークライフバランス', '働き方に関するKPI', '残業時間削減、休暇取得率、健康維持'),
    ('創造性・革新', '新しい取り組みに関するKPI', 'アイデア提案数、改善提案、新技術習得'),
    ('顧客満足', '顧客関係に関するKPI', '顧客評価、リピート率、問い合わせ対応時間')
) AS categories(category_name, description, examples);

-- 個人KPI推奨測定単位ビュー
CREATE OR REPLACE VIEW personal_kpi_measurement_units AS
SELECT unit_name, unit_type, description
FROM (VALUES
    ('件', 'count', '件数・回数を測定'),
    ('人', 'count', '人数を測定'),
    ('時間', 'time', '時間を測定'),
    ('日', 'time', '日数を測定'),
    ('%', 'percentage', 'パーセンテージで測定'),
    ('点', 'score', 'スコア・評点で測定'),
    ('円', 'currency', '金額で測定'),
    ('回', 'frequency', '頻度・回数で測定'),
    ('分', 'time', '分数で測定'),
    ('個', 'count', '個数で測定')
) AS units(unit_name, unit_type, description);

-- =====================================================
-- 8. 権限確認用のヘルパー関数
-- =====================================================

-- 現在のユーザーの権限レベルを取得
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS varchar(50) AS $$
DECLARE
    user_role varchar(50);
BEGIN
    SELECT role INTO user_role
    FROM members 
    WHERE id = auth.uid();
    
    RETURN COALESCE(user_role, 'unknown');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 個人KPI作成権限があるかチェック
CREATE OR REPLACE FUNCTION can_create_personal_kpi()
RETURNS boolean AS $$
BEGIN
    -- 認証済みユーザーかつメンバーテーブルに存在することを確認
    RETURN EXISTS (
        SELECT 1 FROM members 
        WHERE id = auth.uid()
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

