import { createClient } from '@supabase/supabase-js';

type RuntimeEnv = Record<string, string | undefined>;

const getRuntimeEnv = (): RuntimeEnv => {
	if (typeof import.meta !== 'undefined' && import.meta.env) {
		return import.meta.env as RuntimeEnv;
	}

	if (typeof process !== 'undefined' && process.env) {
		return process.env as RuntimeEnv;
	}

	return {};
};

const runtimeEnv = getRuntimeEnv();

const supabaseUrl = runtimeEnv.VITE_SUPABASE_URL || 'https://vrpdhzbfnwljdsretjld.supabase.co';
const supabaseAnonKey = runtimeEnv.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycGRoemJmbndsamRzcmV0amxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0OTk0ODQsImV4cCI6MjA2ODA3NTQ4NH0.qGcEKtsF9jqa8Mg0Tc_M2MlC2s9DajhRJEs_PJ_UIE8';
const supabaseServiceRoleKey = runtimeEnv.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

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
    console.log('🔗 Creating new Supabase client instance');
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
    console.log('🔗 Creating new Supabase admin client instance');
    _supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
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
          table_of_contents: any[] | null
          auto_generate_toc: boolean
          toc_style: 'numbered' | 'bulleted' | 'plain' | 'hierarchical'
          page_type?: 'normal' | 'hub' | 'sub' | null
          parent_hub_id?: string | null
          cluster_sort_order?: number | null
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
          table_of_contents?: any[] | null
          auto_generate_toc?: boolean
          toc_style?: 'numbered' | 'bulleted' | 'plain' | 'hierarchical'
          page_type?: 'normal' | 'hub' | 'sub' | null
          parent_hub_id?: string | null
          cluster_sort_order?: number | null
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
          table_of_contents?: any[] | null
          auto_generate_toc?: boolean
          toc_style?: 'numbered' | 'bulleted' | 'plain' | 'hierarchical'
          page_type?: 'normal' | 'hub' | 'sub' | null
          parent_hub_id?: string | null
          cluster_sort_order?: number | null
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