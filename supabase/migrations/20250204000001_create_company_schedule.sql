-- 企業スケジュール管理システムのマイグレーション
-- 役員による全社スケジュール管理機能

-- 1. company_schedules テーブルの作成
CREATE TABLE IF NOT EXISTS company_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    schedule_type VARCHAR(30) NOT NULL DEFAULT 'event',
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    is_all_day BOOLEAN DEFAULT false,
    location VARCHAR(200),
    is_holiday BOOLEAN DEFAULT false,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'yearly'
    recurrence_end_date DATE,
    color VARCHAR(7) DEFAULT '#3B82F6', -- カラーコード
    priority VARCHAR(10) DEFAULT 'medium', -- 'low', 'medium', 'high'
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_company_schedules_created_by FOREIGN KEY (created_by) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT chk_schedule_type CHECK (schedule_type IN ('event', 'meeting', 'holiday', 'deadline', 'training', 'other')),
    CONSTRAINT chk_priority CHECK (priority IN ('low', 'medium', 'high')),
    CONSTRAINT chk_recurrence_pattern CHECK (recurrence_pattern IS NULL OR recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
    CONSTRAINT chk_date_range CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_time_range CHECK (
        (start_time IS NULL AND end_time IS NULL) OR 
        (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time) OR
        is_all_day = true
    )
);

-- 2. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_company_schedules_start_date ON company_schedules(start_date);
CREATE INDEX IF NOT EXISTS idx_company_schedules_end_date ON company_schedules(end_date);
CREATE INDEX IF NOT EXISTS idx_company_schedules_date_range ON company_schedules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_company_schedules_type ON company_schedules(schedule_type);
CREATE INDEX IF NOT EXISTS idx_company_schedules_created_by ON company_schedules(created_by);
CREATE INDEX IF NOT EXISTS idx_company_schedules_active ON company_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_company_schedules_holiday ON company_schedules(is_holiday);
CREATE INDEX IF NOT EXISTS idx_company_schedules_month ON company_schedules(date_trunc('month', start_date));

-- 3. 自動更新トリガーの作成
DROP TRIGGER IF EXISTS update_company_schedules_updated_at ON company_schedules;
CREATE TRIGGER update_company_schedules_updated_at
    BEFORE UPDATE ON company_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Row Level Security (RLS) を有効化
ALTER TABLE company_schedules ENABLE ROW LEVEL SECURITY;

-- 5. RLSポリシーの作成
-- 役員は全ての操作が可能
CREATE POLICY "役員は全てのスケジュール操作が可能" ON company_schedules
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE id = auth.uid()::uuid 
            AND role = 'executive' 
            AND is_active = true
        )
    );

-- 社員は閲覧のみ可能（有効なスケジュールのみ）
CREATE POLICY "社員は有効なスケジュールの閲覧のみ可能" ON company_schedules
    FOR SELECT
    USING (
        is_active = true AND
        EXISTS (
            SELECT 1 FROM members 
            WHERE id = auth.uid()::uuid 
            AND is_active = true
        )
    );

-- 6. スケジュール関連ビューの作成

-- 6.1 月次スケジュールビュー
CREATE OR REPLACE VIEW monthly_schedule_view AS
SELECT 
    cs.id,
    cs.title,
    cs.description,
    cs.schedule_type,
    cs.start_date,
    cs.end_date,
    cs.start_time,
    cs.end_time,
    cs.is_all_day,
    cs.location,
    cs.is_holiday,
    cs.color,
    cs.priority,
    cs.created_at,
    creator.name as created_by_name,
    creator.role as created_by_role,
    EXTRACT(YEAR FROM cs.start_date) as year,
    EXTRACT(MONTH FROM cs.start_date) as month,
    TO_CHAR(cs.start_date, 'YYYY-MM') as year_month,
    EXTRACT(DOW FROM cs.start_date) as day_of_week,
    CASE 
        WHEN cs.end_date IS NULL THEN 1
        ELSE (cs.end_date - cs.start_date) + 1
    END as duration_days,
    CASE cs.schedule_type
        WHEN 'holiday' THEN '🏖️'
        WHEN 'meeting' THEN '💼'
        WHEN 'training' THEN '📚'
        WHEN 'deadline' THEN '⚠️'
        WHEN 'event' THEN '📅'
        ELSE '📋'
    END as type_icon,
    CASE cs.priority
        WHEN 'high' THEN '🔴'
        WHEN 'medium' THEN '🟡'
        WHEN 'low' THEN '🟢'
    END as priority_icon
FROM company_schedules cs
LEFT JOIN members creator ON cs.created_by = creator.id
WHERE cs.is_active = true
ORDER BY cs.start_date, cs.start_time;

-- 6.2 今後のスケジュールビュー（7日間）
CREATE OR REPLACE VIEW upcoming_schedule_view AS
SELECT 
    cs.*,
    creator.name as created_by_name,
    CASE 
        WHEN cs.start_date = CURRENT_DATE THEN '今日'
        WHEN cs.start_date = CURRENT_DATE + INTERVAL '1 day' THEN '明日'
        WHEN cs.start_date <= CURRENT_DATE + INTERVAL '7 days' THEN TO_CHAR(cs.start_date, 'MM/DD (Dy)')
        ELSE TO_CHAR(cs.start_date, 'MM/DD')
    END as date_label,
    cs.start_date - CURRENT_DATE as days_until,
    CASE 
        WHEN cs.is_holiday THEN 'holiday'
        WHEN cs.start_date = CURRENT_DATE THEN 'today'
        WHEN cs.start_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'soon'
        ELSE 'upcoming'
    END as urgency_level
FROM company_schedules cs
LEFT JOIN members creator ON cs.created_by = creator.id
WHERE cs.is_active = true 
  AND cs.start_date >= CURRENT_DATE
  AND cs.start_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY cs.start_date, cs.start_time;

-- 6.3 休日・祝日ビュー
CREATE OR REPLACE VIEW holiday_schedule_view AS
SELECT 
    cs.id,
    cs.title,
    cs.start_date,
    cs.end_date,
    cs.description,
    cs.color,
    CASE 
        WHEN cs.end_date IS NULL THEN 1
        ELSE (cs.end_date - cs.start_date) + 1
    END as holiday_days,
    TO_CHAR(cs.start_date, 'YYYY-MM-DD (Dy)') as formatted_date,
    EXTRACT(MONTH FROM cs.start_date) as month,
    EXTRACT(YEAR FROM cs.start_date) as year
FROM company_schedules cs
WHERE cs.is_active = true 
  AND cs.is_holiday = true
ORDER BY cs.start_date;

-- 7. スケジュール管理ファンクション

-- 7.1 月次スケジュール取得ファンクション
CREATE OR REPLACE FUNCTION get_monthly_schedule(target_year_month TEXT DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY-MM'))
RETURNS TABLE(
    schedule_date DATE,
    schedules JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gs.schedule_date,
        COALESCE(
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id', cs.id,
                    'title', cs.title,
                    'description', cs.description,
                    'type', cs.schedule_type,
                    'start_time', cs.start_time,
                    'end_time', cs.end_time,
                    'is_all_day', cs.is_all_day,
                    'location', cs.location,
                    'is_holiday', cs.is_holiday,
                    'color', cs.color,
                    'priority', cs.priority,
                    'type_icon', CASE cs.schedule_type
                        WHEN 'holiday' THEN '🏖️'
                        WHEN 'meeting' THEN '💼'
                        WHEN 'training' THEN '📚'
                        WHEN 'deadline' THEN '⚠️'
                        WHEN 'event' THEN '📅'
                        ELSE '📋'
                    END,
                    'priority_icon', CASE cs.priority
                        WHEN 'high' THEN '🔴'
                        WHEN 'medium' THEN '🟡'
                        WHEN 'low' THEN '🟢'
                    END
                ) ORDER BY cs.start_time, cs.title
            ), 
            '[]'::JSON
        ) as schedules
    FROM (
        SELECT generate_series(
            DATE_TRUNC('month', target_year_month::DATE),
            DATE_TRUNC('month', target_year_month::DATE) + INTERVAL '1 month' - INTERVAL '1 day',
            '1 day'::INTERVAL
        )::DATE as schedule_date
    ) gs
    LEFT JOIN company_schedules cs ON (
        gs.schedule_date >= cs.start_date AND 
        gs.schedule_date <= COALESCE(cs.end_date, cs.start_date) AND
        cs.is_active = true
    )
    GROUP BY gs.schedule_date
    ORDER BY gs.schedule_date;
END;
$$ LANGUAGE plpgsql;

-- 7.2 今後のイベント取得ファンクション
CREATE OR REPLACE FUNCTION get_upcoming_events(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE(
    id UUID,
    title VARCHAR(200),
    description TEXT,
    schedule_type VARCHAR(30),
    start_date DATE,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    is_all_day BOOLEAN,
    location VARCHAR(200),
    is_holiday BOOLEAN,
    color VARCHAR(7),
    priority VARCHAR(10),
    days_until INTEGER,
    date_label TEXT,
    urgency_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id,
        cs.title,
        cs.description,
        cs.schedule_type,
        cs.start_date,
        cs.end_date,
        cs.start_time,
        cs.end_time,
        cs.is_all_day,
        cs.location,
        cs.is_holiday,
        cs.color,
        cs.priority,
        (cs.start_date - CURRENT_DATE)::INTEGER as days_until,
        CASE 
            WHEN cs.start_date = CURRENT_DATE THEN '今日'
            WHEN cs.start_date = CURRENT_DATE + INTERVAL '1 day' THEN '明日'
            WHEN cs.start_date <= CURRENT_DATE + INTERVAL '7 days' THEN TO_CHAR(cs.start_date, 'MM/DD (Dy)')
            ELSE TO_CHAR(cs.start_date, 'MM/DD')
        END as date_label,
        CASE 
            WHEN cs.is_holiday THEN 'holiday'
            WHEN cs.start_date = CURRENT_DATE THEN 'today'
            WHEN cs.start_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'soon'
            ELSE 'upcoming'
        END as urgency_level
    FROM company_schedules cs
    WHERE cs.is_active = true 
      AND cs.start_date >= CURRENT_DATE
      AND cs.start_date <= CURRENT_DATE + make_interval(days => days_ahead)
    ORDER BY cs.start_date, cs.start_time;
END;
$$ LANGUAGE plpgsql;

-- 8. サンプルデータの作成（テスト用）
-- 注意: 実際の運用時は削除してください

-- システム管理者のIDを取得（存在する場合）
DO $$
DECLARE
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id 
    FROM members 
    WHERE email = 'queue@queue-tech.jp' AND role = 'executive' AND is_active = true
    LIMIT 1;
    
    IF admin_id IS NOT NULL THEN
        -- 年末年始休暇
        INSERT INTO company_schedules (title, description, schedule_type, start_date, end_date, is_all_day, is_holiday, color, priority, created_by)
        VALUES (
            '年末年始休暇',
            '会社の年末年始休暇期間です',
            'holiday',
            '2025-12-29',
            '2026-01-05',
            true,
            true,
            '#EF4444',
            'high',
            admin_id
        );
        
        -- ゴールデンウィーク
        INSERT INTO company_schedules (title, description, schedule_type, start_date, end_date, is_all_day, is_holiday, color, priority, created_by)
        VALUES (
            'ゴールデンウィーク',
            'ゴールデンウィーク休暇',
            'holiday',
            '2025-04-29',
            '2025-05-05',
            true,
            true,
            '#EF4444',
            'high',
            admin_id
        );
        
        -- 定期ミーティング
        INSERT INTO company_schedules (title, description, schedule_type, start_date, start_time, end_time, is_all_day, location, color, priority, created_by)
        VALUES (
            '全体会議',
            '月次の全社会議です',
            'meeting',
            '2025-08-15',
            '10:00',
            '11:30',
            false,
            '会議室A',
            '#3B82F6',
            'high',
            admin_id
        );
        
        -- 研修
        INSERT INTO company_schedules (title, description, schedule_type, start_date, start_time, end_time, is_all_day, location, color, priority, created_by)
        VALUES (
            'AI技術研修',
            '最新のAI技術に関する研修',
            'training',
            '2025-08-20',
            '13:00',
            '17:00',
            false,
            'オンライン',
            '#10B981',
            'medium',
            admin_id
        );
    END IF;
END $$;

-- 9. コメント追加
COMMENT ON TABLE company_schedules IS '企業スケジュール管理テーブル - 全社的なイベント・休暇・ミーティング等のスケジュール管理';
COMMENT ON COLUMN company_schedules.schedule_type IS 'スケジュール種別: event(イベント), meeting(会議), holiday(休暇), deadline(締切), training(研修), other(その他)';
COMMENT ON COLUMN company_schedules.is_holiday IS '休日フラグ: 会社の休日・祝日の場合true';
COMMENT ON COLUMN company_schedules.is_recurring IS '繰り返しフラグ: 定期的なスケジュールの場合true';
COMMENT ON COLUMN company_schedules.recurrence_pattern IS '繰り返しパターン: daily(毎日), weekly(毎週), monthly(毎月), yearly(毎年)';
COMMENT ON COLUMN company_schedules.color IS 'カレンダー表示用カラーコード（HEX形式）';
COMMENT ON COLUMN company_schedules.priority IS '優先度: low(低), medium(中), high(高)';

COMMENT ON VIEW monthly_schedule_view IS '月次スケジュールビュー - カレンダー表示用の月別スケジュール情報';
COMMENT ON VIEW upcoming_schedule_view IS '今後のスケジュールビュー - ダッシュボード表示用の近日予定';
COMMENT ON VIEW holiday_schedule_view IS '休日スケジュールビュー - 会社の休日・祝日一覧';

COMMENT ON FUNCTION get_monthly_schedule(TEXT) IS '月次スケジュール取得ファンクション - 指定月のカレンダーデータを取得';
COMMENT ON FUNCTION get_upcoming_events(INTEGER) IS '今後のイベント取得ファンクション - 指定日数以内の予定を取得'; 