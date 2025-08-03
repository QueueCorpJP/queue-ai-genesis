-- monthly_attendance_stats ビューの406エラー修正
-- 複雑なビューが原因でSupabaseで406エラーが発生する場合の対処

-- 既存のビューを削除
DROP VIEW IF EXISTS monthly_attendance_stats;

-- シンプルな構造でビューを再作成
CREATE OR REPLACE VIEW monthly_attendance_stats AS
SELECT 
    ar.member_id,
    m.name as member_name,
    m.email as member_email,
    m.department,
    m.position,
    EXTRACT(YEAR FROM ar.date) as year,
    EXTRACT(MONTH FROM ar.date) as month,
    TO_CHAR(ar.date, 'YYYY-MM') as year_month,
    COUNT(*) as total_days,
    COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_days,
    COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_days,
    COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_days,
    COUNT(CASE WHEN ar.status = 'early_leave' THEN 1 END) as early_leave_days,
    COALESCE(SUM(ar.work_hours), 0) as total_work_hours,
    COALESCE(SUM(ar.overtime_hours), 0) as total_overtime_hours,
    COALESCE(SUM(ar.work_hours + ar.overtime_hours), 0) as total_hours,
    CASE 
        WHEN COUNT(CASE WHEN ar.status = 'present' THEN 1 END) > 0 
        THEN ROUND(SUM(ar.work_hours) / COUNT(CASE WHEN ar.status = 'present' THEN 1 END), 2)
        ELSE 0 
    END as avg_work_hours_per_day,
    COUNT(CASE WHEN ar.attendance_type = 'remote' THEN 1 END) as remote_days,
    COUNT(CASE WHEN ar.attendance_type = 'business_trip' THEN 1 END) as business_trip_days,
    COUNT(CASE WHEN ar.attendance_type = 'sick_leave' THEN 1 END) as sick_leave_days,
    COUNT(CASE WHEN ar.attendance_type = 'vacation' THEN 1 END) as vacation_days
FROM attendance_records ar
LEFT JOIN members m ON ar.member_id = m.id
WHERE ar.date IS NOT NULL
  AND m.is_active = true
GROUP BY 
    ar.member_id, 
    m.name, 
    m.email, 
    m.department, 
    m.position,
    EXTRACT(YEAR FROM ar.date), 
    EXTRACT(MONTH FROM ar.date)
ORDER BY year DESC, month DESC, m.name;

-- ビューにコメントを追加
COMMENT ON VIEW monthly_attendance_stats IS '月次勤怠統計ビュー（406エラー対応版） - 月別の勤怠集計データを提供';

-- 代替として、勤怠統計を取得する関数も作成
CREATE OR REPLACE FUNCTION get_monthly_attendance_stats(
    target_member_id UUID DEFAULT NULL,
    target_year_month TEXT DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY-MM')
)
RETURNS TABLE(
    member_id UUID,
    member_name VARCHAR(255),
    member_email VARCHAR(255),
    department VARCHAR(100),
    position VARCHAR(100),
    year NUMERIC,
    month NUMERIC,
    year_month TEXT,
    total_days BIGINT,
    present_days BIGINT,
    absent_days BIGINT,
    late_days BIGINT,
    early_leave_days BIGINT,
    total_work_hours NUMERIC,
    total_overtime_hours NUMERIC,
    total_hours NUMERIC,
    avg_work_hours_per_day NUMERIC,
    remote_days BIGINT,
    business_trip_days BIGINT,
    sick_leave_days BIGINT,
    vacation_days BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.member_id,
        m.name,
        m.email,
        m.department,
        m.position,
        EXTRACT(YEAR FROM ar.date),
        EXTRACT(MONTH FROM ar.date),
        TO_CHAR(ar.date, 'YYYY-MM'),
        COUNT(*)::BIGINT,
        COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::BIGINT,
        COUNT(CASE WHEN ar.status = 'absent' THEN 1 END)::BIGINT,
        COUNT(CASE WHEN ar.status = 'late' THEN 1 END)::BIGINT,
        COUNT(CASE WHEN ar.status = 'early_leave' THEN 1 END)::BIGINT,
        COALESCE(SUM(ar.work_hours), 0),
        COALESCE(SUM(ar.overtime_hours), 0),
        COALESCE(SUM(ar.work_hours + ar.overtime_hours), 0),
        CASE 
            WHEN COUNT(CASE WHEN ar.status = 'present' THEN 1 END) > 0 
            THEN ROUND(SUM(ar.work_hours) / COUNT(CASE WHEN ar.status = 'present' THEN 1 END), 2)
            ELSE 0 
        END,
        COUNT(CASE WHEN ar.attendance_type = 'remote' THEN 1 END)::BIGINT,
        COUNT(CASE WHEN ar.attendance_type = 'business_trip' THEN 1 END)::BIGINT,
        COUNT(CASE WHEN ar.attendance_type = 'sick_leave' THEN 1 END)::BIGINT,
        COUNT(CASE WHEN ar.attendance_type = 'vacation' THEN 1 END)::BIGINT
    FROM attendance_records ar
    LEFT JOIN members m ON ar.member_id = m.id
    WHERE ar.date IS NOT NULL
      AND m.is_active = true
      AND (target_member_id IS NULL OR ar.member_id = target_member_id)
      AND TO_CHAR(ar.date, 'YYYY-MM') = target_year_month
    GROUP BY 
        ar.member_id, 
        m.name, 
        m.email, 
        m.department, 
        m.position,
        EXTRACT(YEAR FROM ar.date), 
        EXTRACT(MONTH FROM ar.date)
    ORDER BY m.name;
END;
$$ LANGUAGE plpgsql; 