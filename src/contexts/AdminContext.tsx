import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7日間
const ACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2時間の無操作でタイムアウト

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

  // セッション情報をローカルストレージに保存（確実に保存されるまで試行）
  const saveSessionToStorage = (sessionData: AdminSession) => {
    try {
      const dataToStore = {
        ...sessionData,
        savedAt: Date.now() // 保存時刻を記録
      };
      
      // 複数回試行して確実に保存
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(dataToStore));
          
          // 保存されたかを即座に確認
          const saved = localStorage.getItem(SESSION_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.user && parsed.user.email === sessionData.user.email) {
              console.log('Session successfully saved to localStorage:', dataToStore.user.email);
              return; // 成功したら終了
            }
          }
        } catch (saveError) {
          console.warn(`Save attempt ${attempts + 1} failed:`, saveError);
        }
        attempts++;
      }
      
      console.error('Failed to save session after', maxAttempts, 'attempts');
    } catch (error) {
      console.error('Failed to save session to localStorage:', error);
    }
  };

  // ローカルストレージからセッション情報を取得（より寛容に）
  const loadSessionFromStorage = (): AdminSession | null => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) {
        console.log('No session found in localStorage');
        return null;
      }

      const sessionData: AdminSession & { savedAt?: number } = JSON.parse(stored);
      console.log('Loading session from localStorage:', sessionData.user?.email);
      
      // セッションの有効期限をチェック（より寛容に）
      if (Date.now() > sessionData.expiresAt) {
        console.log('Session expired, removing from storage');
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }

      // アクティビティタイムアウトチェック（より寛容に）
      const timeSinceLastActivity = Date.now() - sessionData.user.lastActivity;
      if (timeSinceLastActivity > ACTIVITY_TIMEOUT) {
        console.log('Session timed out due to inactivity, removing from storage');
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }

      console.log('Valid session found, time since last activity:', Math.floor(timeSinceLastActivity / 1000 / 60), 'minutes');
      return sessionData;
    } catch (error) {
      console.error('Error loading session from localStorage:', error);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  };

  // セッション情報をクリア
  const clearSessionStorage = () => {
    console.log('Clearing session from localStorage');
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  // 管理者ユーザーかどうかを確認
  const isAdminUser = (email: string): boolean => {
    return email === ADMIN_CREDENTIALS.email;
  };

  // ユーザーアクティビティを更新（頻繁に保存）
  const updateUserActivity = useCallback(() => {
    if (session && user) {
      const now = Date.now();
      const updatedUser = {
        ...user,
        lastActivity: now
      };
      const updatedSession = {
        ...session,
        user: updatedUser
      };
      
      setUser(updatedUser);
      setSession(updatedSession);
      saveSessionToStorage(updatedSession);
      
      // デバッグ用ログ（本番では削除可能）
      console.log('User activity updated at:', new Date(now).toLocaleString());
    }
  }, [session, user]);

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

  // セッションチェック（より積極的にセッションを保持）
  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Checking session...');
      
      const storedSession = loadSessionFromStorage();
      
      if (storedSession && isAdminUser(storedSession.user.email)) {
        console.log('Valid session found, updating activity');
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
        console.log('No valid session found');
        // セッションが無効
        setUser(null);
        setSession(null);
        clearSessionStorage();
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setUser(null);
      setSession(null);
      clearSessionStorage();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // アクティビティ監視（スロットル付き）
  useEffect(() => {
    let lastUpdate = 0;
    const throttleTime = 10000; // 10秒に1回だけ更新
    
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > throttleTime) {
        updateUserActivity();
        lastUpdate = now;
      }
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
  }, [updateUserActivity]);

  // 初回マウント時の自動ログイン処理
  useEffect(() => {
    console.log('AdminProvider mounted, checking for existing session for auto-login');
    
    const performAutoLogin = () => {
      try {
        // ローカルストレージから既存セッションをチェック
        const existingSession = loadSessionFromStorage();
        
        if (existingSession && isAdminUser(existingSession.user.email)) {
          console.log('🔐 Auto-login: Found valid session for', existingSession.user.email);
          
          // セッションの有効性を再確認
          const now = Date.now();
          const isExpired = now > existingSession.expiresAt;
          const isTimedOut = now - existingSession.user.lastActivity > ACTIVITY_TIMEOUT;
          
          if (!isExpired && !isTimedOut) {
            console.log('✅ Auto-login: Session is valid, logging in automatically');
            
            // アクティビティ時間を更新して自動ログイン
            const updatedUser = {
              ...existingSession.user,
              lastActivity: now
            };
            const updatedSession = {
              ...existingSession,
              user: updatedUser
            };
            
            // 状態を更新
            setUser(updatedUser);
            setSession(updatedSession);
            saveSessionToStorage(updatedSession);
            
            console.log('🎉 Auto-login successful for:', updatedUser.email);
            setIsLoading(false);
          } else {
            console.log('❌ Auto-login: Session expired or timed out, clearing storage');
            clearSessionStorage();
            setUser(null);
            setSession(null);
            setIsLoading(false);
          }
        } else {
          console.log('❌ Auto-login: No valid session found');
          setUser(null);
          setSession(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ Auto-login error:', error);
        clearSessionStorage();
        setUser(null);
        setSession(null);
        setIsLoading(false);
      }
    };
    
    // 少し遅延させてからチェック（DOM準備完了を待つ）
    const timeoutId = setTimeout(performAutoLogin, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // 定期的なセッションチェック（より頻繁に）
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.isAuthenticated) {
        console.log('Periodic session check...');
        const storedSession = loadSessionFromStorage();
        if (!storedSession) {
          console.log('Session lost during periodic check');
          // セッションが無効になった場合
          setUser(null);
          setSession(null);
        } else {
          // セッションが有効な場合はアクティビティを更新
          updateUserActivity();
        }
      }
    }, 30000); // 30秒ごと

    return () => clearInterval(interval);
  }, [user?.isAuthenticated, updateUserActivity]);

  // ページのvisibilityが変更されたときのセッションチェック
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.isAuthenticated) {
        // ページがアクティブになったときにセッションをチェック
        checkSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.isAuthenticated, checkSession]);

  // ページアンロード時にセッションを保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session && user) {
        // 最新のアクティビティ時間を保存
        const updatedUser = {
          ...user,
          lastActivity: Date.now()
        };
        const updatedSession = {
          ...session,
          user: updatedUser
        };
        saveSessionToStorage(updatedSession);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [session, user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('Login attempt for:', email);
      
      // 管理者メールアドレスのチェック
      if (!isAdminUser(email)) {
        console.log('Invalid admin email');
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

      console.log('Creating new session:', newSession);
      
      // セッションを状態に設定
      setUser(newUser);
      setSession(newSession);
      
      // ローカルストレージに確実に保存
      saveSessionToStorage(newSession);
      
      // 保存されたかを即座に確認
      const savedSession = loadSessionFromStorage();
      if (savedSession) {
        console.log('Session successfully saved and verified in localStorage');
      } else {
        console.error('Failed to save session to localStorage');
      }
      
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
      console.log('Logging out user');
      
      // ローカル状態をクリア
      setUser(null);
      setSession(null);
      clearSessionStorage();
      
      // ローカルストレージから確実に削除されたかを確認
      const remainingSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (remainingSession) {
        console.warn('Session still exists in localStorage, forcing removal');
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } else {
        console.log('Session successfully cleared from localStorage');
      }
    } catch (error) {
      console.error('Logout error:', error);
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