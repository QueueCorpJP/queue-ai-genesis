import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role?: 'employee' | 'executive';
  isAuthenticated: boolean;
  lastActivity: number;
}

export interface AdminSession {
  id: string;
  user: AdminUser;
  expiresAt: number;
  createdAt: number;
}

interface AdminContextType {
  user: AdminUser | null;
  session: AdminSession | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserActivity: () => void;
  checkSession: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

const ADMIN_CREDENTIALS = {
  email: 'queue@queue-tech.jp',
  password: 'Taichi00610'
} as const;

const SESSION_STORAGE_KEY = 'queue_admin_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24時間

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // デバウンス用のref
  const lastActivityUpdateRef = useRef<number>(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // セッションをlocalStorageに保存
  const saveSessionToStorage = (session: AdminSession) => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session to localStorage:', error);
    }
  };

  // セッション期限チェック
  const isSessionValid = (session: AdminSession): boolean => {
    const now = Date.now();
    const timeSinceLastActivity = now - session.user.lastActivity;
    const sessionAge = now - session.createdAt;
    
    // セッション全体が24時間以内、かつ最後のアクティビティが30分以内
    return sessionAge < SESSION_DURATION && timeSinceLastActivity < 30 * 60 * 1000;
  };

  // localStorageからセッションを読み込み
  const loadSessionFromStorage = (): AdminSession | null => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return null;
      
      const session: AdminSession = JSON.parse(stored);
      
      if (isSessionValid(session)) {
        return session;
      } else {
        clearSessionStorage();
        return null;
      }
    } catch (error) {
      console.error('Failed to load session from localStorage:', error);
      clearSessionStorage();
      return null;
    }
  };

  // セッション情報をクリア
  const clearSessionStorage = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  // 管理者ユーザーかどうかを確認
  const isAdminUser = (email: string): boolean => {
    return email === ADMIN_CREDENTIALS.email;
  };

  // ユーザーアクティビティを更新（デバウンス処理付き）
  const updateUserActivity = useCallback(() => {
    const now = Date.now();
    
    // デバウンス処理: 10秒以内の連続呼び出しは無視
    if (now - lastActivityUpdateRef.current < 10000) {
      return;
    }
    
    // デバウンスタイマーをクリア
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // 5秒後に実行
    debounceTimeoutRef.current = setTimeout(() => {
      lastActivityUpdateRef.current = now;
      
      setSession(currentSession => {
        if (!currentSession) return currentSession;
        
        const updatedUser = {
          ...currentSession.user,
          lastActivity: now
        };
        
        const updatedSession = {
          ...currentSession,
          user: updatedUser
        };
        
        saveSessionToStorage(updatedSession);
        setUser(updatedUser);
        
        return updatedSession;
      });
    }, 5000);
  }, []); // 依存配列を空にしてコールバック関数の再作成を防ぐ

  // セッションの状態を更新
  const updateSession = (newSession: AdminSession | null) => {
    setSession(newSession);
    
    if (newSession) {
      setUser(newSession.user);
      saveSessionToStorage(newSession);
    } else {
      setUser(null);
      clearSessionStorage();
    }
  };

  // セッションチェック
  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const storedSession = loadSessionFromStorage();
      
      if (storedSession && isAdminUser(storedSession.user.email)) {
        // 有効なセッションがある場合、状態を更新
        setUser(storedSession.user);
        setSession(storedSession);
      } else {
        // セッションが無効または存在しない場合
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []); // 依存配列を空にして無限ループを防ぐ

  // ログイン処理
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // 入力値を正規化（トリムして空白を除去）
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();
      const expectedEmail = ADMIN_CREDENTIALS.email.trim().toLowerCase();
      const expectedPassword = ADMIN_CREDENTIALS.password.trim();
      
      // 既存の管理者認証（後方互換性）
      if (normalizedEmail === expectedEmail && normalizedPassword === expectedPassword) {
        const now = Date.now();
        const adminUser: AdminUser = {
          id: '1',
          email: ADMIN_CREDENTIALS.email,
          name: 'システム管理者',
          role: 'executive',
          isAuthenticated: true,
          lastActivity: now
        };
        
        const newSession: AdminSession = {
          id: `session_${now}`,
          user: adminUser,
          expiresAt: now + SESSION_DURATION,
          createdAt: now
        };
        
        updateSession(newSession);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // ログアウト処理
  const logout = () => {
    updateSession(null);
  };

  // コンポーネントマウント時にセッションをチェック
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // ユーザーアクティビティのイベントリスナーを設定（軽量化）
  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      updateUserActivity();
    };

    // イベントリスナーを制限（パフォーマンス向上）
    const events = ['click', 'keydown'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // 定期的なセッションチェック（60秒ごと）
    const interval = setInterval(() => {
      if (session && !isSessionValid(session)) {
        logout();
      }
    }, 60000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
      
      // デバウンスタイマーのクリア
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [user, session, updateUserActivity]); // sessionを依存配列に追加

  return (
    <AdminContext.Provider value={{
      user,
      session,
      isLoading,
      login,
      logout,
      updateUserActivity,
      checkSession
    }}>
      {children}
    </AdminContext.Provider>
  );
}; 