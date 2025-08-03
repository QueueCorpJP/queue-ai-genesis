import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

// 型安全なグローバルインスタンス管理
interface GlobalThis {
  __queue_supabase_instance?: any;
  __queue_supabase_admin_instance?: any;
}

declare const globalThis: GlobalThis & typeof global;

// メインSupabaseクライアント（シングルトン）
let _supabaseInstance: any = null;

const getSupabaseInstance = () => {
  // 既にインスタンスが存在する場合はそれを返す
  if (_supabaseInstance) {
    return _supabaseInstance;
  }

  // グローバルインスタンスをチェック（ホットリロード対応）
  if (typeof window !== 'undefined' && globalThis.__queue_supabase_instance) {
    _supabaseInstance = globalThis.__queue_supabase_instance;
    return _supabaseInstance;
  }

  // 新しいインスタンスを作成
  if (typeof window !== 'undefined') {
    console.log('Creating new Supabase client instance');
    _supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storageKey: 'queue-supabase-auth-token',
        storage: window.localStorage
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: { 'x-application-name': 'queue-lp' }
      }
    });

    // グローバルに保存（ホットリロード対応）
    globalThis.__queue_supabase_instance = _supabaseInstance;
  }

  return _supabaseInstance;
};

// 管理者用Supabaseクライアント（遅延初期化）
let _supabaseAdminInstance: any = null;

const getSupabaseAdminInstance = () => {
  // 既にインスタンスが存在する場合はそれを返す
  if (_supabaseAdminInstance) {
    return _supabaseAdminInstance;
  }

  // グローバルインスタンスをチェック（ホットリロード対応）
  if (typeof window !== 'undefined' && globalThis.__queue_supabase_admin_instance) {
    _supabaseAdminInstance = globalThis.__queue_supabase_admin_instance;
    return _supabaseAdminInstance;
  }

  // Service Role Keyが設定されている場合のみ管理者クライアントを作成
  if (typeof window !== 'undefined' && supabaseServiceRoleKey && supabaseServiceRoleKey !== supabaseAnonKey) {
    console.log('Creating new Supabase admin client instance');
    _supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storageKey: 'queue-supabase-admin-auth-token',
        storage: window.localStorage
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: { 'x-application-name': 'queue-lp-admin' }
      }
    });

    // グローバルに保存（ホットリロード対応）
    globalThis.__queue_supabase_admin_instance = _supabaseAdminInstance;
  } else {
    // Service Role Keyが未設定の場合は通常のクライアントを返す
    console.warn('Service Role Key is not configured, using regular client instead of admin client');
    return getSupabaseInstance();
  }

  return _supabaseAdminInstance;
};

// エクスポート
export const supabase = getSupabaseInstance();

// 管理者クライアントは遅延初期化でエクスポート
export const getSupabaseAdmin = () => getSupabaseAdminInstance();

// Deprecated: Use getSupabaseAdmin() instead
// export const supabaseAdmin = (() => {
//   if (import.meta.env.DEV) {
//     console.warn('supabaseAdmin is deprecated. Use getSupabaseAdmin() instead to prevent multiple client instances.');
//   }
//   return getSupabaseAdminInstance();
// })();

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
          source_name: string | null
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
          source_name?: string | null
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
          source_name?: string | null
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