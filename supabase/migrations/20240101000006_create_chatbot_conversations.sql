-- Create table for chatbot conversations
CREATE TABLE chatbot_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL, -- チャットセッションID
    user_message TEXT NOT NULL, -- ユーザーからの質問
    bot_response TEXT NOT NULL, -- AIからの回答
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_ip TEXT, -- ユーザーのIPアドレス（オプション）
    user_agent TEXT, -- ユーザーエージェント（オプション）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_chatbot_conversations_session_id ON chatbot_conversations(session_id);
CREATE INDEX idx_chatbot_conversations_timestamp ON chatbot_conversations(timestamp);
CREATE INDEX idx_chatbot_conversations_created_at ON chatbot_conversations(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Create policy for public insert (チャットボットからの挿入を許可)
CREATE POLICY "Allow public insert on chatbot_conversations" ON chatbot_conversations
    FOR INSERT TO public
    WITH CHECK (true);

-- Create policy for authenticated select (管理者のみ閲覧可能)
CREATE POLICY "Allow authenticated select on chatbot_conversations" ON chatbot_conversations
    FOR SELECT TO authenticated
    USING (true);

-- Create policy for authenticated update (管理者のみ更新可能)
CREATE POLICY "Allow authenticated update on chatbot_conversations" ON chatbot_conversations
    FOR UPDATE TO authenticated
    USING (true);

-- Create policy for authenticated delete (管理者のみ削除可能)
CREATE POLICY "Allow authenticated delete on chatbot_conversations" ON chatbot_conversations
    FOR DELETE TO authenticated
    USING (true); 