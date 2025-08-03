-- 勤怠管理システムのマイグレーション
-- 社員の出勤予定入力、役員の時給設定、月ごとの人件費計算機能

-- 1. 勤怠記録テーブルの作成
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    break_time_minutes INTEGER DEFAULT 0,
    work_hours DECIMAL(4,2), -- 実働時間（自動計算）
    overtime_hours DECIMAL(4,2) DEFAULT 0, -- 残業時間
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'present', 'absent', 'late', 'early_leave')),
    attendance_type VARCHAR(20) NOT NULL DEFAULT 'regular' CHECK (attendance_type IN ('regular', 'remote', 'business_trip', 'sick_leave', 'vacation')),
    notes TEXT,
    submitted_at TIMESTAMPTZ, -- 実際の出勤時刻記録時刻
    approved_by UUID REFERENCES members(id), -- 承認者
    approved_at TIMESTAMPTZ, -- 承認日時
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 同じメンバーの同じ日付には1つの記録のみ
    UNIQUE(member_id, date)
);

-- 2. メンバー時給設定テーブルの作成
CREATE TABLE IF NOT EXISTS member_hourly_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    hourly_rate DECIMAL(8,2) NOT NULL, -- 基本時給
    overtime_rate DECIMAL(8,2), -- 残業時給（NULLの場合は基本時給の1.25倍）
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE, -- NULLの場合は無期限
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES members(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 同じメンバーの有効期間の重複を防ぐ
    EXCLUDE USING gist (
        member_id WITH =,
        daterange(effective_from, COALESCE(effective_to, '9999-12-31'::date), '[]') WITH &&
    )
);

-- 3. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_attendance_records_member_id ON attendance_records(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_attendance_records_member_date ON attendance_records(member_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_month ON attendance_records(member_id, date_trunc('month', date));

CREATE INDEX IF NOT EXISTS idx_member_hourly_rates_member_id ON member_hourly_rates(member_id);
CREATE INDEX IF NOT EXISTS idx_member_hourly_rates_effective ON member_hourly_rates(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_member_hourly_rates_active ON member_hourly_rates(is_active);

-- 4. 更新日時自動更新のトリガー
DROP TRIGGER IF EXISTS update_attendance_records_updated_at ON attendance_records;
CREATE TRIGGER update_attendance_records_updated_at
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_member_hourly_rates_updated_at ON member_hourly_rates;
CREATE TRIGGER update_member_hourly_rates_updated_at
    BEFORE UPDATE ON member_hourly_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. 実働時間自動計算のトリガー
CREATE OR REPLACE FUNCTION calculate_work_hours()
RETURNS TRIGGER AS $$
BEGIN
    -- start_timeとend_timeがある場合、実働時間を計算
    IF NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
        -- 基本労働時間を計算（分単位）
        NEW.work_hours := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600.0 - (COALESCE(NEW.break_time_minutes, 0) / 60.0);
        
        -- 実働時間がマイナスの場合は0にする
        IF NEW.work_hours < 0 THEN
            NEW.work_hours := 0;
        END IF;
        
        -- 残業時間の計算（8時間を超えた分）
        IF NEW.work_hours > 8 THEN
            NEW.overtime_hours := NEW.work_hours - 8;
            NEW.work_hours := 8;
        ELSE
            NEW.overtime_hours := 0;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_work_hours_trigger ON attendance_records;
CREATE TRIGGER calculate_work_hours_trigger
    BEFORE INSERT OR UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION calculate_work_hours();

-- 6. Row Level Security (RLS) を有効化
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_hourly_rates ENABLE ROW LEVEL SECURITY;

-- 7. RLSポリシーの作成

-- 勤怠記録のポリシー
-- メンバーは自分の記録のみCRUD可能
CREATE POLICY "メンバーは自分の勤怠記録のみ操作可能" ON attendance_records
    FOR ALL
    USING (member_id = (SELECT id FROM members WHERE email = auth.jwt() ->> 'email' AND is_active = true));

-- 役員は全ての勤怠記録を閲覧・管理可能
CREATE POLICY "役員は全ての勤怠記録を管理可能" ON attendance_records
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM members 
        WHERE email = auth.jwt() ->> 'email' 
        AND role = 'executive' 
        AND is_active = true
    ));

-- 時給設定のポリシー
-- 役員のみ時給設定の操作が可能
CREATE POLICY "役員のみ時給設定が可能" ON member_hourly_rates
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM members 
        WHERE email = auth.jwt() ->> 'email' 
        AND role = 'executive' 
        AND is_active = true
    ));

-- 8. 勤怠サマリービューの作成
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
    ar.member_id,
    m.name as member_name,
    m.email as member_email,
    m.department,
    m.position,
    ar.date,
    ar.start_time,
    ar.end_time,
    ar.break_time_minutes,
    ar.work_hours,
    ar.overtime_hours,
    ar.status,
    ar.attendance_type,
    ar.notes,
    ar.submitted_at,
    ar.approved_by,
    approver.name as approved_by_name,
    ar.approved_at,
    ar.created_at,
    ar.updated_at,
    
    -- 日付関連の計算フィールド
    EXTRACT(year FROM ar.date) as year,
    EXTRACT(month FROM ar.date) as month,
    EXTRACT(dow FROM ar.date) as day_of_week,
    to_char(ar.date, 'YYYY-MM') as year_month,
    
    -- ステータス判定
    CASE 
        WHEN ar.status = 'present' AND ar.start_time > '09:00'::time THEN true
        ELSE false
    END as is_late,
    
    CASE 
        WHEN ar.status = 'present' AND ar.end_time < '17:00'::time THEN true
        ELSE false
    END as is_early_leave
    
FROM attendance_records ar
JOIN members m ON ar.member_id = m.id
LEFT JOIN members approver ON ar.approved_by = approver.id;

-- 9. 月次勤怠統計ビューの作成
CREATE OR REPLACE VIEW monthly_attendance_stats AS
SELECT 
    member_id,
    member_name,
    member_email,
    department,
    position,
    year,
    month,
    year_month,
    
    -- 勤怠統計
    COUNT(*) as total_days,
    COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
    COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
    COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
    COUNT(CASE WHEN is_late THEN 1 END) as actual_late_days,
    COUNT(CASE WHEN is_early_leave THEN 1 END) as early_leave_days,
    
    -- 労働時間統計
    COALESCE(SUM(work_hours), 0) as total_work_hours,
    COALESCE(SUM(overtime_hours), 0) as total_overtime_hours,
    COALESCE(SUM(work_hours + overtime_hours), 0) as total_hours,
    COALESCE(AVG(work_hours), 0) as avg_work_hours_per_day,
    
    -- 勤怠タイプ別統計
    COUNT(CASE WHEN attendance_type = 'remote' THEN 1 END) as remote_days,
    COUNT(CASE WHEN attendance_type = 'business_trip' THEN 1 END) as business_trip_days,
    COUNT(CASE WHEN attendance_type = 'sick_leave' THEN 1 END) as sick_leave_days,
    COUNT(CASE WHEN attendance_type = 'vacation' THEN 1 END) as vacation_days

FROM attendance_summary
GROUP BY 
    member_id, member_name, member_email, department, position,
    year, month, year_month;

-- 10. 月次人件費計算ビューの作成
CREATE OR REPLACE VIEW monthly_payroll AS
SELECT 
    mas.member_id,
    mas.member_name,
    mas.member_email,
    mas.department,
    mas.position,
    mas.year,
    mas.month,
    mas.year_month,
    mas.total_work_hours,
    mas.total_overtime_hours,
    mas.total_hours,
    
    -- 時給情報
    mhr.hourly_rate,
    COALESCE(mhr.overtime_rate, mhr.hourly_rate * 1.25) as overtime_rate,
    
    -- 給与計算
    (mas.total_work_hours * mhr.hourly_rate) as regular_pay,
    (mas.total_overtime_hours * COALESCE(mhr.overtime_rate, mhr.hourly_rate * 1.25)) as overtime_pay,
    (mas.total_work_hours * mhr.hourly_rate) + 
    (mas.total_overtime_hours * COALESCE(mhr.overtime_rate, mhr.hourly_rate * 1.25)) as total_pay,
    
    -- 勤怠情報
    mas.present_days,
    mas.absent_days,
    mas.late_days,
    mas.remote_days,
    mas.vacation_days
    
FROM monthly_attendance_stats mas
LEFT JOIN member_hourly_rates mhr ON (
    mas.member_id = mhr.member_id 
    AND mhr.is_active = true
    AND mhr.effective_from <= (mas.year_month || '-01')::date
    AND (mhr.effective_to IS NULL OR mhr.effective_to >= (mas.year_month || '-01')::date)
);

-- 11. 勤怠管理用ファンクション

-- 月次人件費サマリー取得ファンクション
CREATE OR REPLACE FUNCTION get_monthly_payroll_summary(
    target_year_month TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM')
)
RETURNS TABLE (
    total_employees BIGINT,
    total_work_hours NUMERIC,
    total_overtime_hours NUMERIC,
    total_payroll NUMERIC,
    avg_pay_per_employee NUMERIC,
    departments_breakdown JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_employees,
        SUM(mp.total_work_hours) as total_work_hours,
        SUM(mp.total_overtime_hours) as total_overtime_hours,
        SUM(mp.total_pay) as total_payroll,
        AVG(mp.total_pay) as avg_pay_per_employee,
        
        -- 部署別内訳
        (SELECT jsonb_agg(
            jsonb_build_object(
                'department', dept_summary.department,
                'employee_count', dept_summary.employee_count,
                'total_pay', dept_summary.total_pay,
                'avg_pay', dept_summary.avg_pay
            )
        )
        FROM (
            SELECT 
                COALESCE(department, '未設定') as department,
                COUNT(*) as employee_count,
                SUM(total_pay) as total_pay,
                AVG(total_pay) as avg_pay
            FROM monthly_payroll 
            WHERE year_month = target_year_month
            GROUP BY department
        ) dept_summary
        ) as departments_breakdown
        
    FROM monthly_payroll mp
    WHERE mp.year_month = target_year_month;
END;
$$ LANGUAGE plpgsql;

-- メンバーの勤怠データ取得ファンクション
CREATE OR REPLACE FUNCTION get_member_attendance(
    target_member_id UUID,
    target_year_month TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM')
)
RETURNS TABLE (
    date DATE,
    start_time TIME,
    end_time TIME,
    work_hours NUMERIC,
    overtime_hours NUMERIC,
    status VARCHAR,
    attendance_type VARCHAR,
    is_late BOOLEAN,
    is_early_leave BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.date,
        ar.start_time,
        ar.end_time,
        ar.work_hours,
        ar.overtime_hours,
        ar.status,
        ar.attendance_type,
        (ar.status = 'present' AND ar.start_time > '09:00'::time) as is_late,
        (ar.status = 'present' AND ar.end_time < '17:00'::time) as is_early_leave
    FROM attendance_records ar
    WHERE ar.member_id = target_member_id
    AND to_char(ar.date, 'YYYY-MM') = target_year_month
    ORDER BY ar.date;
END;
$$ LANGUAGE plpgsql;

-- 12. コメント追加
COMMENT ON TABLE attendance_records IS '勤怠記録テーブル - 社員の出勤・労働時間管理';
COMMENT ON COLUMN attendance_records.status IS '勤怠ステータス: scheduled(予定), present(出勤), absent(欠勤), late(遅刻), early_leave(早退)';
COMMENT ON COLUMN attendance_records.attendance_type IS '勤務形態: regular(通常), remote(リモート), business_trip(出張), sick_leave(病欠), vacation(有給)';
COMMENT ON COLUMN attendance_records.work_hours IS '実働時間（自動計算、最大8時間）';
COMMENT ON COLUMN attendance_records.overtime_hours IS '残業時間（8時間を超えた分）';

COMMENT ON TABLE member_hourly_rates IS 'メンバー時給設定テーブル - 役員による時給管理';
COMMENT ON COLUMN member_hourly_rates.hourly_rate IS '基本時給';
COMMENT ON COLUMN member_hourly_rates.overtime_rate IS '残業時給（NULLの場合は基本時給の1.25倍）';
COMMENT ON COLUMN member_hourly_rates.effective_from IS '有効開始日';
COMMENT ON COLUMN member_hourly_rates.effective_to IS '有効終了日（NULLの場合は無期限）';

COMMENT ON VIEW attendance_summary IS '勤怠サマリービュー - メンバー情報と勤怠データの統合表示';
COMMENT ON VIEW monthly_attendance_stats IS '月次勤怠統計ビュー - 月別の勤怠集計データ';
COMMENT ON VIEW monthly_payroll IS '月次人件費ビュー - 時給設定と勤怠データに基づく給与計算'; 