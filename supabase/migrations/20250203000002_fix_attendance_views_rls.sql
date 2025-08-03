-- 勤怠管理ビューのRLS修正
-- ビューに対するRLSポリシーを追加

-- 1. ビューに対するRLSを有効化
ALTER VIEW attendance_summary OWNER TO postgres;
ALTER VIEW monthly_attendance_stats OWNER TO postgres;
ALTER VIEW monthly_payroll OWNER TO postgres;

-- 2. ビューに対するRLSポリシーを作成

-- attendance_summaryビューのポリシー
DROP POLICY IF EXISTS "メンバーは自分の勤怠サマリーのみ閲覧可能" ON attendance_summary;
CREATE POLICY "メンバーは自分の勤怠サマリーのみ閲覧可能" ON attendance_summary
    FOR SELECT
    USING (member_id = (SELECT id FROM members WHERE email = auth.jwt() ->> 'email' AND is_active = true));

DROP POLICY IF EXISTS "役員は全ての勤怠サマリーを閲覧可能" ON attendance_summary;
CREATE POLICY "役員は全ての勤怠サマリーを閲覧可能" ON attendance_summary
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM members 
        WHERE email = auth.jwt() ->> 'email' 
        AND role = 'executive' 
        AND is_active = true
    ));

-- monthly_attendance_statsビューのポリシー
DROP POLICY IF EXISTS "メンバーは自分の月次統計のみ閲覧可能" ON monthly_attendance_stats;
CREATE POLICY "メンバーは自分の月次統計のみ閲覧可能" ON monthly_attendance_stats
    FOR SELECT
    USING (member_id = (SELECT id FROM members WHERE email = auth.jwt() ->> 'email' AND is_active = true));

DROP POLICY IF EXISTS "役員は全ての月次統計を閲覧可能" ON monthly_attendance_stats;
CREATE POLICY "役員は全ての月次統計を閲覧可能" ON monthly_attendance_stats
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM members 
        WHERE email = auth.jwt() ->> 'email' 
        AND role = 'executive' 
        AND is_active = true
    ));

-- monthly_payrollビューのポリシー（役員のみ）
DROP POLICY IF EXISTS "役員のみ人件費データを閲覧可能" ON monthly_payroll;
CREATE POLICY "役員のみ人件費データを閲覧可能" ON monthly_payroll
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM members 
        WHERE email = auth.jwt() ->> 'email' 
        AND role = 'executive' 
        AND is_active = true
    ));

-- 3. ビューに対するRLSを有効化
ALTER VIEW attendance_summary ENABLE ROW LEVEL SECURITY;
ALTER VIEW monthly_attendance_stats ENABLE ROW LEVEL SECURITY;
ALTER VIEW monthly_payroll ENABLE ROW LEVEL SECURITY;

-- 4. 関数に対するセキュリティ設定
-- get_monthly_payroll_summary関数のセキュリティ設定
DROP FUNCTION IF EXISTS get_monthly_payroll_summary(TEXT);
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
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 役員権限チェック
    IF NOT EXISTS (
        SELECT 1 FROM members 
        WHERE email = auth.jwt() ->> 'email' 
        AND role = 'executive' 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'この機能は役員のみ利用可能です';
    END IF;

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

-- get_member_attendance関数のセキュリティ設定
DROP FUNCTION IF EXISTS get_member_attendance(UUID, TEXT);
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
) 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    is_executive BOOLEAN;
BEGIN
    -- 現在のユーザーIDを取得
    SELECT id INTO current_user_id 
    FROM members 
    WHERE email = auth.jwt() ->> 'email' AND is_active = true;
    
    -- 役員かどうかチェック
    SELECT (role = 'executive') INTO is_executive
    FROM members 
    WHERE id = current_user_id;
    
    -- 権限チェック：自分のデータまたは役員の場合のみアクセス可能
    IF current_user_id != target_member_id AND NOT is_executive THEN
        RAISE EXCEPTION 'アクセス権限がありません';
    END IF;

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

-- 5. 権限の付与
GRANT SELECT ON attendance_summary TO authenticated;
GRANT SELECT ON monthly_attendance_stats TO authenticated;
GRANT SELECT ON monthly_payroll TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_payroll_summary(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_member_attendance(UUID, TEXT) TO authenticated;