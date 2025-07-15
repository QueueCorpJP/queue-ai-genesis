-- Drop existing table if it exists
DROP TABLE IF EXISTS public.chatbot_conversations;

-- Create table with exact structure provided
CREATE TABLE public.chatbot_conversations (
  id uuid not null default gen_random_uuid (),
  session_id text not null,
  user_message text not null,
  bot_response text not null,
  timestamp timestamp with time zone null default now(),
  user_ip text null,
  user_agent text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint chatbot_conversations_pkey primary key (id)
) TABLESPACE pg_default;

-- Create indexes
create index IF not exists idx_chatbot_conversations_session_id on public.chatbot_conversations using btree (session_id) TABLESPACE pg_default;
create index IF not exists idx_chatbot_conversations_timestamp on public.chatbot_conversations using btree ("timestamp") TABLESPACE pg_default;
create index IF not exists idx_chatbot_conversations_created_at on public.chatbot_conversations using btree (created_at) TABLESPACE pg_default;

-- Enable RLS (Row Level Security)
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Create policy for public insert (チャットボットからの挿入を許可)
CREATE POLICY "Allow public insert on chatbot_conversations" ON public.chatbot_conversations
    FOR INSERT TO public
    WITH CHECK (true);

-- Create policy for authenticated select (管理者のみ閲覧可能)
CREATE POLICY "Allow authenticated select on chatbot_conversations" ON public.chatbot_conversations
    FOR SELECT TO authenticated
    USING (true);

-- Create policy for authenticated update (管理者のみ更新可能)
CREATE POLICY "Allow authenticated update on chatbot_conversations" ON public.chatbot_conversations
    FOR UPDATE TO authenticated
    USING (true);

-- Create policy for authenticated delete (管理者のみ削除可能)
CREATE POLICY "Allow authenticated delete on chatbot_conversations" ON public.chatbot_conversations
    FOR DELETE TO authenticated
    USING (true); 