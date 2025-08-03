-- ビューの権限問題を完全に解決する

-- 1. 既存のビューを削除して再作成（権限をリセット）
DROP VIEW IF EXISTS monthly_attendance_stats CASCADE;
DROP VIEW IF EXISTS attendance_summary CASCADE;
DROP VIEW IF EXISTS monthly_payroll CASCADE;

-- 2. attendance_summaryビューを再作成
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

-- 3. monthly_attendance_statsビューを再作成
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

-- 4. monthly_payrollビューを再作成
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
    COALESCE(mhr.hourly_rate, 0) as hourly_rate,
    COALESCE(mhr.overtime_rate, mhr.hourly_rate * 1.25, 0) as overtime_rate,
    
    -- 給与計算
    (mas.total_work_hours * COALESCE(mhr.hourly_rate, 0)) as regular_pay,
    (mas.total_overtime_hours * COALESCE(mhr.overtime_rate, mhr.hourly_rate * 1.25, 0)) as overtime_pay,
    (mas.total_work_hours * COALESCE(mhr.hourly_rate, 0)) + 
    (mas.total_overtime_hours * COALESCE(mhr.overtime_rate, mhr.hourly_rate * 1.25, 0)) as total_pay,
    
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

-- 5. すべてのロールに対してビューの権限を付与
GRANT SELECT ON attendance_summary TO anon, authenticated, service_role;
GRANT SELECT ON monthly_attendance_stats TO anon, authenticated, service_role;
GRANT SELECT ON monthly_payroll TO anon, authenticated, service_role;

-- 6. ビューの所有者を変更
ALTER VIEW attendance_summary OWNER TO postgres;
ALTER VIEW monthly_attendance_stats OWNER TO postgres;
ALTER VIEW monthly_payroll OWNER TO postgres;

-- 7. 関数の権限も再設定
GRANT EXECUTE ON FUNCTION get_monthly_payroll_summary(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_member_attendance(UUID, TEXT) TO anon, authenticated, service_role;

-- 8. 基底テーブルの権限も確認
GRANT SELECT ON members TO anon, authenticated, service_role;
GRANT ALL ON attendance_records TO anon, authenticated, service_role;
GRANT ALL ON member_hourly_rates TO anon, authenticated, service_role;

-- 9. シーケンスの権限も付与（必要に応じて）
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 10. 確認用のテスト関数
CREATE OR REPLACE FUNCTION test_view_access()
RETURNS TABLE (
    view_name TEXT,
    accessible BOOLEAN,
    error_message TEXT
) AS $$
BEGIN
    -- attendance_summaryのテスト
    BEGIN
        PERFORM 1 FROM attendance_summary LIMIT 1;
        RETURN QUERY SELECT 'attendance_summary'::TEXT, true, NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'attendance_summary'::TEXT, false, SQLERRM;
    END;
    
    -- monthly_attendance_statsのテスト
    BEGIN
        PERFORM 1 FROM monthly_attendance_stats LIMIT 1;
        RETURN QUERY SELECT 'monthly_attendance_stats'::TEXT, true, NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'monthly_attendance_stats'::TEXT, false, SQLERRM;
    END;
    
    -- monthly_payrollのテスト
    BEGIN
        PERFORM 1 FROM monthly_payroll LIMIT 1;
        RETURN QUERY SELECT 'monthly_payroll'::TEXT, true, NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'monthly_payroll'::TEXT, false, SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION test_view_access() TO anon, authenticated, service_role;

-- 11. 成功メッセージ
DO $$
BEGIN
    RAISE NOTICE 'All views have been recreated with proper permissions for all roles';
END $$;