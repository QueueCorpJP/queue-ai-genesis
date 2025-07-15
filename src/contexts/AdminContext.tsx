import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminUser {
  id: string;
  email: string;
  isAuthenticated: boolean;
  loginTime: number;
  lastActivity: number;
}

interface AdminSession {
  user: AdminUser;
  token: string;
  expiresAt: number;
}

interface AdminContextType {
  user: AdminUser | null;
  session: AdminSession | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  checkSession: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// 管理者アカウント情報
const ADMIN_CREDENTIALS = {
  email: 'queue@queue-tech.jp',
  password: 'Taichi00610'
};

// セッション情報をローカルストレージに保存するためのキー
const SESSION_STORAGE_KEY = 'queue_admin_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24時間
const ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30分の無操作でタイムアウト

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // セッショントークンを生成
  const generateSessionToken = (): string => {
    return btoa(Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15) + 
                Date.now().toString());
  };

  // セッション情報をローカルストレージに保存
  const saveSessionToStorage = (sessionData: AdminSession) => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to save session to localStorage:', error);
    }
  };

  // ローカルストレージからセッション情報を取得
  const loadSessionFromStorage = (): AdminSession | null => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return null;

      const sessionData: AdminSession = JSON.parse(stored);
      
      // セッションの有効期限をチェック
      if (Date.now() > sessionData.expiresAt) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }

      // 最後の活動から一定時間経過している場合はタイムアウト
      if (Date.now() - sessionData.user.lastActivity > ACTIVITY_TIMEOUT) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error('Failed to load session from localStorage:', error);
      localStorage.removeItem(SESSION_STORAGE_KEY);
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

  // ユーザーアクティビティを更新
  const updateUserActivity = () => {
    if (session && user) {
      const updatedUser = {
        ...user,
        lastActivity: Date.now()
      };
      const updatedSession = {
        ...session,
        user: updatedUser
      };
      
      setUser(updatedUser);
      setSession(updatedSession);
      saveSessionToStorage(updatedSession);
    }
  };

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
  const checkSession = async () => {
    try {
      setIsLoading(true);
      
      const storedSession = loadSessionFromStorage();
      
      if (storedSession && isAdminUser(storedSession.user.email)) {
        // 有効なセッションがある場合、アクティビティを更新
        const updatedUser = {
          ...storedSession.user,
          lastActivity: Date.now()
        };
        const updatedSession = {
          ...storedSession,
          user: updatedUser
        };
        
        updateSession(updatedSession);
      } else {
        // セッションが無効
        setUser(null);
        setSession(null);
        clearSessionStorage();
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setUser(null);
      setSession(null);
      clearSessionStorage();
    } finally {
      setIsLoading(false);
    }
  };

  // アクティビティ監視
  useEffect(() => {
    const handleUserActivity = () => {
      updateUserActivity();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // アクティビティイベントリスナーを追加
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [session, user]);

  // 定期的なセッションチェック
  useEffect(() => {
    checkSession();

    const interval = setInterval(() => {
      if (user?.isAuthenticated) {
        const storedSession = loadSessionFromStorage();
        if (!storedSession) {
          // セッションが無効になった場合
          setUser(null);
          setSession(null);
        }
      }
    }, 60000); // 1分ごと

    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // 管理者メールアドレスのチェック
      if (!isAdminUser(email)) {
        console.log('Invalid admin email:', email);
        return false;
      }

      // パスワードの簡易チェック
      if (password !== ADMIN_CREDENTIALS.password) {
        console.log('Invalid password');
        return false;
      }

      // ローディング演出
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 新しいセッションを作成
      const now = Date.now();
      const newUser: AdminUser = {
        id: `admin_${now}`,
        email: email,
        isAuthenticated: true,
        loginTime: now,
        lastActivity: now
      };

      const newSession: AdminSession = {
        user: newUser,
        token: generateSessionToken(),
        expiresAt: now + SESSION_DURATION
      };

      console.log('Login successful, creating session:', newSession);
      updateSession(newSession);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // ローカル状態をクリア
      setUser(null);
      setSession(null);
      clearSessionStorage();
      
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminContext.Provider value={{ 
      user, 
      session, 
      login, 
      logout, 
      isLoading,
      checkSession 
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}; 