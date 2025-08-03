-- Todo management system RLS policy fix
-- Enable executives to view and manage all member todos

-- Drop existing policies
DROP POLICY IF EXISTS "Members can view their own todos" ON todos;
DROP POLICY IF EXISTS "Members can create their own todos" ON todos;
DROP POLICY IF EXISTS "Members can update their own todos" ON todos;
DROP POLICY IF EXISTS "Members can delete their own todos" ON todos;
DROP POLICY IF EXISTS "Members can view progress logs for their todos" ON todo_progress_logs;
DROP POLICY IF EXISTS "Members can create progress logs for their todos" ON todo_progress_logs;

-- Create new policies

-- 1. Todo viewing policy (members can view their own todos, executives can view all todos)
CREATE POLICY "Todo viewing policy" ON todos
    FOR SELECT USING (
        -- Members can always view their own todos
        EXISTS (
            SELECT 1 FROM members 
            WHERE email = auth.email() 
            AND id = todos.member_id
            AND is_active = true
        ) OR
        -- Executives can view all todos
        EXISTS (
            SELECT 1 FROM members 
            WHERE email = auth.email() 
            AND role = 'executive' 
            AND is_active = true
        ) OR
        -- Admin account can view all todos
        auth.email() = 'queue@queue-tech.jp'
    );

-- 2. Todo creation policy (members can create their own todos, executives can create todos for any member)
CREATE POLICY "Todo creation policy" ON todos
    FOR INSERT WITH CHECK (
        -- Create todos for themselves
        EXISTS (
            SELECT 1 FROM members 
            WHERE email = auth.email() 
            AND id = todos.member_id
            AND is_active = true
        ) OR
        -- Executives can create todos for any member
        EXISTS (
            SELECT 1 FROM members 
            WHERE email = auth.email() 
            AND role = 'executive' 
            AND is_active = true
        ) OR
        -- Admin account can create todos for any member
        auth.email() = 'queue@queue-tech.jp'
    );

-- 3. Todo update policy (members can update their own todos, executives can update all todos)
CREATE POLICY "Todo update policy" ON todos
    FOR UPDATE USING (
        -- Members can update their own todos
        EXISTS (
            SELECT 1 FROM members 
            WHERE email = auth.email() 
            AND id = todos.member_id
            AND is_active = true
        ) OR
        -- Executives can update all todos
        EXISTS (
            SELECT 1 FROM members 
            WHERE email = auth.email() 
            AND role = 'executive' 
            AND is_active = true
        ) OR
        -- Admin account can update all todos
        auth.email() = 'queue@queue-tech.jp'
    );

-- 4. Todo delete policy (members can delete their own todos, executives can delete all todos)
CREATE POLICY "Todo delete policy" ON todos
    FOR DELETE USING (
        -- Members can delete their own todos
        EXISTS (
            SELECT 1 FROM members 
            WHERE email = auth.email() 
            AND id = todos.member_id
            AND is_active = true
        ) OR
        -- Executives can delete all todos
        EXISTS (
            SELECT 1 FROM members 
            WHERE email = auth.email() 
            AND role = 'executive' 
            AND is_active = true
        ) OR
        -- Admin account can delete all todos
        auth.email() = 'queue@queue-tech.jp'
    );

-- 5. Todo progress log viewing policy
CREATE POLICY "Todo progress log viewing policy" ON todo_progress_logs
    FOR SELECT USING (
        -- Can view progress logs for their own todos
        EXISTS (
            SELECT 1 FROM todos t
            JOIN members m ON t.member_id = m.id
            WHERE t.id = todo_progress_logs.todo_id 
            AND m.email = auth.email()
            AND m.is_active = true
        ) OR
        -- Executives can view all progress logs
        EXISTS (
            SELECT 1 FROM members 
            WHERE email = auth.email() 
            AND role = 'executive' 
            AND is_active = true
        ) OR
        -- Admin account can view all progress logs
        auth.email() = 'queue@queue-tech.jp'
    );

-- 6. Todo progress log creation policy
CREATE POLICY "Todo progress log creation policy" ON todo_progress_logs
    FOR INSERT WITH CHECK (
        -- Can create progress logs for their own todos
        EXISTS (
            SELECT 1 FROM todos t
            JOIN members m ON t.member_id = m.id
            WHERE t.id = todo_progress_logs.todo_id 
            AND m.email = auth.email()
            AND m.is_active = true
        ) OR
        -- Executives can create all progress logs
        EXISTS (
            SELECT 1 FROM members 
            WHERE email = auth.email() 
            AND role = 'executive' 
            AND is_active = true
        ) OR
        -- Admin account can create all progress logs
        auth.email() = 'queue@queue-tech.jp'
    );

-- 7. Grant permissions to views
GRANT SELECT ON todo_management_view TO authenticated;
GRANT SELECT ON member_todo_stats TO authenticated;
GRANT SELECT ON daily_todo_progress TO authenticated;

-- 8. Test function for access verification
CREATE OR REPLACE FUNCTION test_todo_access(test_email TEXT DEFAULT auth.email())
RETURNS TABLE (
    access_type TEXT,
    accessible BOOLEAN,
    todo_count BIGINT,
    error_message TEXT
) AS $$
BEGIN
    -- Personal todo access test
    BEGIN
        SELECT COUNT(*) INTO todo_count FROM todos 
        WHERE EXISTS (
            SELECT 1 FROM members 
            WHERE email = test_email 
            AND id = todos.member_id
        );
        RETURN QUERY SELECT 'Personal Todos'::TEXT, true, todo_count, NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'Personal Todos'::TEXT, false, 0::BIGINT, SQLERRM;
    END;
    
    -- All todos access test (executives only)
    BEGIN
        SELECT COUNT(*) INTO todo_count FROM todos;
        RETURN QUERY SELECT 'All Todos'::TEXT, true, todo_count, NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'All Todos'::TEXT, false, 0::BIGINT, SQLERRM;
    END;
    
    -- Todo management view access test
    BEGIN
        SELECT COUNT(*) INTO todo_count FROM todo_management_view;
        RETURN QUERY SELECT 'Todo Management View'::TEXT, true, todo_count, NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'Todo Management View'::TEXT, false, 0::BIGINT, SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION test_todo_access(TEXT) TO authenticated;

-- 9. Success message
DO $$
BEGIN
    RAISE NOTICE 'Todo management system RLS policies have been successfully updated';
    RAISE NOTICE '- Members: Can only view and manage their own todos';
    RAISE NOTICE '- Executives: Can view and manage all member todos';
    RAISE NOTICE '- Admin: Full access to all features';
END $$; 