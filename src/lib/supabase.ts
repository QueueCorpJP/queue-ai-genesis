import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

// Singleton pattern to prevent multiple client instances
let supabaseInstance: any = null;
let supabaseAdminInstance: any = null;

// Regular client for public operations
const createSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabaseInstance;
};

export const supabase = createSupabaseClient();

// Admin client with service role key (bypasses RLS)
const createSupabaseAdminClient = () => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseAdminInstance;
};

export const supabaseAdmin = createSupabaseAdminClient();

// Types for the database
export interface ChatbotConversation {
  id: string;
  session_id: string;
  user_message: string;
  bot_response: string;
  timestamp: string;
  user_ip?: string;
  user_agent?: string;
  status?: 'pending' | 'reviewed' | 'flagged' | 'resolved';
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      consultation_requests: {
        Row: {
          id: string
          name: string
          company: string
          email: string
          phone: string
          service: 'ai_development' | 'prompt_engineering' | 'prototype' | 'other'
          message: string
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          company: string
          email: string
          phone: string
          service: 'ai_development' | 'prompt_engineering' | 'prototype' | 'other'
          message: string
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          company?: string
          email?: string
          phone?: string
          service?: 'ai_development' | 'prompt_engineering' | 'prototype' | 'other'
          message?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      contact_requests: {
        Row: {
          id: string
          name: string
          company: string
          email: string
          phone: string | null
          message: string
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          company: string
          email: string
          phone?: string | null
          message: string
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          company?: string
          email?: string
          phone?: string | null
          message?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      news_articles: {
        Row: {
          id: string
          title: string
          summary: string
          content: string
          source_name: string
          source_url: string | null
          image_url: string | null
          tags: string[]
          status: 'draft' | 'published' | 'archived'
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          summary: string
          content: string
          source_name: string
          source_url?: string | null
          image_url?: string | null
          tags?: string[]
          status?: 'draft' | 'published' | 'archived'
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          summary?: string
          content?: string
          source_name?: string
          source_url?: string | null
          image_url?: string | null
          tags?: string[]
          status?: 'draft' | 'published' | 'archived'
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      news_article_views: {
        Row: {
          id: string
          article_id: string
          ip_address: string
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          article_id: string
          ip_address: string
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          article_id?: string
          ip_address?: string
          user_agent?: string | null
          created_at?: string
        }
      }
      chatbot_conversations: {
        Row: ChatbotConversation;
        Insert: Omit<ChatbotConversation, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ChatbotConversation, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
} 