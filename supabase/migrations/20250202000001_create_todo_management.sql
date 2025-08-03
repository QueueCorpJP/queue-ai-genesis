-- ===============================================
-- Todo Management System Migration
-- Version: 20250202000001
-- Description: Create tables and views for todo management
-- ===============================================

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    due_date TIMESTAMPTZ,
    assigned_by UUID REFERENCES members(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_todos_member_id ON todos(member_id);
CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_created_at ON todos(created_at);

-- Create todo_progress_logs table for tracking changes
CREATE TABLE IF NOT EXISTS todo_progress_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    comment TEXT,
    changed_by UUID NOT NULL REFERENCES members(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for progress logs
CREATE INDEX idx_todo_progress_logs_todo_id ON todo_progress_logs(todo_id);
CREATE INDEX idx_todo_progress_logs_created_at ON todo_progress_logs(created_at);

-- Create trigger to update todos.updated_at automatically
CREATE OR REPLACE FUNCTION update_todos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_todos_updated_at
    BEFORE UPDATE ON todos
    FOR EACH ROW
    EXECUTE FUNCTION update_todos_updated_at();

-- Create comprehensive view for todo management with member details
CREATE OR REPLACE VIEW todo_management_view AS
SELECT 
    t.id,
    t.title,
    t.description,
    t.priority,
    t.status,
    t.due_date,
    t.created_at,
    t.updated_at,
    
    -- Member details
    m.id as member_id,
    m.name as member_name,
    m.email as member_email,
    m.role as member_role,
    m.department as member_department,
    m.position as member_position,
    
    -- Assigned by details
    ab.id as assigned_by_id,
    ab.name as assigned_by_name,
    ab.email as assigned_by_email,
    
    -- Progress calculations
    CASE 
        WHEN t.due_date IS NOT NULL AND t.due_date < now() AND t.status != 'completed' THEN true
        ELSE false
    END as is_overdue,
    
    CASE 
        WHEN t.due_date IS NOT NULL AND t.due_date <= now() + INTERVAL '3 days' AND t.status != 'completed' THEN true
        ELSE false
    END as is_due_soon,
    
    -- Days until due
    CASE 
        WHEN t.due_date IS NOT NULL THEN
            EXTRACT(DAY FROM (t.due_date - now()))::INTEGER
        ELSE NULL
    END as days_until_due,
    
    -- Time spent on todo (time between creation and completion)
    CASE 
        WHEN t.status = 'completed' THEN
            EXTRACT(EPOCH FROM (t.updated_at - t.created_at))/3600
        ELSE NULL
    END as completion_hours
    
FROM todos t
JOIN members m ON t.member_id = m.id
LEFT JOIN members ab ON t.assigned_by = ab.id;

-- Create todo statistics view by member
CREATE OR REPLACE VIEW member_todo_stats AS
SELECT 
    m.id as member_id,
    m.name as member_name,
    m.email as member_email,
    m.role as member_role,
    m.department as member_department,
    
    -- Todo counts by status
    COUNT(t.id) as total_todos,
    COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_todos,
    COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_todos,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_todos,
    COUNT(CASE WHEN t.status = 'cancelled' THEN 1 END) as cancelled_todos,
    
    -- Priority breakdown
    COUNT(CASE WHEN t.priority = 'high' AND t.status != 'completed' THEN 1 END) as high_priority_pending,
    COUNT(CASE WHEN t.priority = 'medium' AND t.status != 'completed' THEN 1 END) as medium_priority_pending,
    COUNT(CASE WHEN t.priority = 'low' AND t.status != 'completed' THEN 1 END) as low_priority_pending,
    
    -- Overdue todos
    COUNT(CASE WHEN t.due_date IS NOT NULL AND t.due_date < now() AND t.status != 'completed' THEN 1 END) as overdue_todos,
    
    -- Due soon todos
    COUNT(CASE WHEN t.due_date IS NOT NULL AND t.due_date <= now() + INTERVAL '3 days' AND t.status != 'completed' THEN 1 END) as due_soon_todos,
    
    -- Completion rate
    CASE 
        WHEN COUNT(t.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::NUMERIC / COUNT(t.id)::NUMERIC) * 100, 1)
        ELSE 0
    END as completion_rate_percentage,
    
    -- Average completion time (in hours)
    AVG(
        CASE 
            WHEN t.status = 'completed' THEN
                EXTRACT(EPOCH FROM (t.updated_at - t.created_at))/3600
            ELSE NULL
        END
    ) as avg_completion_hours,
    
    -- Latest activity
    MAX(t.updated_at) as last_todo_activity,
    
    -- This month's activity
    COUNT(CASE WHEN t.created_at >= date_trunc('month', now()) THEN 1 END) as todos_this_month,
    COUNT(CASE WHEN t.status = 'completed' AND t.updated_at >= date_trunc('month', now()) THEN 1 END) as completed_this_month
    
FROM members m
LEFT JOIN todos t ON m.id = t.member_id
WHERE m.is_active = true
GROUP BY m.id, m.name, m.email, m.role, m.department;

-- Create daily todo progress summary view
CREATE OR REPLACE VIEW daily_todo_progress AS
SELECT 
    date_trunc('day', created_at)::DATE as date,
    COUNT(*) as todos_created,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as todos_completed,
    COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_todos,
    COUNT(CASE WHEN due_date IS NOT NULL AND due_date < now() AND status != 'completed' THEN 1 END) as overdue_todos
FROM todos
WHERE created_at >= now() - INTERVAL '30 days'
GROUP BY date_trunc('day', created_at)::DATE
ORDER BY date DESC;

-- Create function to get todo insights for executives
CREATE OR REPLACE FUNCTION get_todo_insights(
    start_date DATE DEFAULT (now() - INTERVAL '30 days')::DATE,
    end_date DATE DEFAULT now()::DATE
)
RETURNS TABLE (
    total_todos BIGINT,
    completed_todos BIGINT,
    overdue_todos BIGINT,
    high_priority_pending BIGINT,
    completion_rate NUMERIC,
    avg_completion_time_hours NUMERIC,
    most_productive_member TEXT,
    department_with_most_overdue TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH todo_summary AS (
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed,
            COUNT(CASE WHEN t.due_date IS NOT NULL AND t.due_date < now() AND t.status != 'completed' THEN 1 END) as overdue,
            COUNT(CASE WHEN t.priority = 'high' AND t.status != 'completed' THEN 1 END) as high_priority,
            AVG(CASE WHEN t.status = 'completed' THEN EXTRACT(EPOCH FROM (t.updated_at - t.created_at))/3600 END) as avg_hours
        FROM todos t
        WHERE t.created_at::DATE BETWEEN start_date AND end_date
    ),
    productive_member AS (
        SELECT m.name
        FROM members m
        JOIN todos t ON m.id = t.member_id
        WHERE t.status = 'completed' 
        AND t.updated_at::DATE BETWEEN start_date AND end_date
        GROUP BY m.id, m.name
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ),
    overdue_department AS (
        SELECT m.department
        FROM members m
        JOIN todos t ON m.id = t.member_id
        WHERE t.due_date IS NOT NULL 
        AND t.due_date < now() 
        AND t.status != 'completed'
        AND m.department IS NOT NULL
        GROUP BY m.department
        ORDER BY COUNT(*) DESC
        LIMIT 1
    )
    SELECT 
        ts.total,
        ts.completed,
        ts.overdue,
        ts.high_priority,
        CASE WHEN ts.total > 0 THEN ROUND((ts.completed::NUMERIC / ts.total::NUMERIC) * 100, 1) ELSE 0 END,
        ROUND(ts.avg_hours, 1),
        COALESCE(pm.name, 'データなし'),
        COALESCE(od.department, 'データなし')
    FROM todo_summary ts
    CROSS JOIN productive_member pm
    CROSS JOIN overdue_department od;
END;
$$;

-- RLS (Row Level Security) policies
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_progress_logs ENABLE ROW LEVEL SECURITY;

-- Policy for members to see only their own todos
CREATE POLICY "Members can view their own todos" ON todos
    FOR SELECT USING (
        auth.uid()::text = member_id::text OR
        EXISTS (
            SELECT 1 FROM members 
            WHERE id::text = auth.uid()::text 
            AND role = 'executive'
        )
    );

-- Policy for members to create their own todos
CREATE POLICY "Members can create their own todos" ON todos
    FOR INSERT WITH CHECK (auth.uid()::text = member_id::text);

-- Policy for members to update their own todos
CREATE POLICY "Members can update their own todos" ON todos
    FOR UPDATE USING (
        auth.uid()::text = member_id::text OR
        EXISTS (
            SELECT 1 FROM members 
            WHERE id::text = auth.uid()::text 
            AND role = 'executive'
        )
    );

-- Policy for members to delete their own todos
CREATE POLICY "Members can delete their own todos" ON todos
    FOR DELETE USING (
        auth.uid()::text = member_id::text OR
        EXISTS (
            SELECT 1 FROM members 
            WHERE id::text = auth.uid()::text 
            AND role = 'executive'
        )
    );

-- Progress logs policies
CREATE POLICY "Members can view progress logs for their todos" ON todo_progress_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM todos 
            WHERE id = todo_progress_logs.todo_id 
            AND (member_id::text = auth.uid()::text OR
                 EXISTS (
                     SELECT 1 FROM members 
                     WHERE id::text = auth.uid()::text 
                     AND role = 'executive'
                 ))
        )
    );

-- Members can create progress logs for their todos
CREATE POLICY "Members can create progress logs for their todos" ON todo_progress_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM todos 
            WHERE id = todo_progress_logs.todo_id 
            AND member_id::text = auth.uid()::text
        ) OR
        EXISTS (
            SELECT 1 FROM members 
            WHERE id::text = auth.uid()::text 
            AND role = 'executive'
        )
    );

-- Grant permissions
GRANT SELECT ON todo_management_view TO authenticated;
GRANT SELECT ON member_todo_stats TO authenticated;
GRANT SELECT ON daily_todo_progress TO authenticated;

-- Insert sample data for testing (optional)
-- This will only run if there are existing members
DO $$
DECLARE
    sample_member_id UUID;
BEGIN
    -- Get first active member for sample data
    SELECT id INTO sample_member_id 
    FROM members 
    WHERE is_active = true 
    LIMIT 1;
    
    IF sample_member_id IS NOT NULL THEN
        INSERT INTO todos (member_id, title, description, priority, status, due_date) VALUES
        (sample_member_id, 'データベース設計レビュー', 'Todoシステムのデータベース設計をレビューし、最適化案を検討する', 'high', 'in_progress', now() + INTERVAL '2 days'),
        (sample_member_id, 'UI/UXデザイン完成', 'Todo管理画面のUI/UXデザインを完成させる', 'medium', 'pending', now() + INTERVAL '5 days'),
        (sample_member_id, 'API仕様書作成', 'Todo API的詳細仕様書を作成する', 'low', 'pending', now() + INTERVAL '7 days');
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON TABLE todos IS 'Todo管理システム - 各メンバーのタスク管理';
COMMENT ON TABLE todo_progress_logs IS 'Todo進捗ログ - ステータス変更履歴を記録';
COMMENT ON VIEW todo_management_view IS 'Todo管理ビュー - メンバー情報と進捗状況を含む包括的なビュー';
COMMENT ON VIEW member_todo_stats IS 'メンバー別Todo統計 - 各メンバーのTodo進捗状況統計';
COMMENT ON VIEW daily_todo_progress IS '日別Todo進捗 - 日次のTodo作成・完了統計';
COMMENT ON FUNCTION get_todo_insights IS 'Todo分析ファンクション - 役員向けの総合的なTodo分析データ'; 