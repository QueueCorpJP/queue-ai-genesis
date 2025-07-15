-- Drop existing policies
DROP POLICY IF EXISTS "Allow public insert on chatbot_conversations" ON public.chatbot_conversations;
DROP POLICY IF EXISTS "Allow authenticated select on chatbot_conversations" ON public.chatbot_conversations;
DROP POLICY IF EXISTS "Allow authenticated update on chatbot_conversations" ON public.chatbot_conversations;
DROP POLICY IF EXISTS "Allow authenticated delete on chatbot_conversations" ON public.chatbot_conversations;

-- Create new policies that are more permissive for testing
-- Allow anon users to select (for admin dashboard)
CREATE POLICY "Allow anon select on chatbot_conversations" ON public.chatbot_conversations
    FOR SELECT TO anon
    USING (true);

-- Allow anon users to insert (for chatbot)
CREATE POLICY "Allow anon insert on chatbot_conversations" ON public.chatbot_conversations
    FOR INSERT TO anon
    WITH CHECK (true);

-- Allow authenticated users full access
CREATE POLICY "Allow authenticated select on chatbot_conversations" ON public.chatbot_conversations
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert on chatbot_conversations" ON public.chatbot_conversations
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on chatbot_conversations" ON public.chatbot_conversations
    FOR UPDATE TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated delete on chatbot_conversations" ON public.chatbot_conversations
    FOR DELETE TO authenticated
    USING (true);

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.chatbot_conversations TO anon;
GRANT ALL ON public.chatbot_conversations TO authenticated; 