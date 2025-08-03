// 閲覧時間トラッキングユーティリティ
import { supabase } from '@/lib/supabase';

interface ReadingSession {
  sessionId: string;
  articleId: string;
  startTime: Date;
  endTime?: Date;
  scrollDepth: number;
  isActive: boolean;
}

class ReadingTimeTracker {
  private session: ReadingSession | null = null;
  private scrollDepthCheckInterval: NodeJS.Timeout | null = null;
  private lastActiveTime: Date = new Date();
  private inactivityTimeout: NodeJS.Timeout | null = null;
  private maxScrollDepth: number = 0;
  private isPageVisible: boolean = true;

  // セッションID生成
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 閲覧開始
  async startTracking(articleId: string): Promise<void> {
    // 既存セッションがあれば終了
    if (this.session) {
      await this.endTracking();
    }

    // 新しいセッション作成
    this.session = {
      sessionId: this.generateSessionId(),
      articleId,
      startTime: new Date(),
      scrollDepth: 0,
      isActive: true
    };

    try {
      // IPアドレス取得
      const ipAddress = await this.getClientIP();
      
      // データベースに挿入
      const { data, error } = await supabase
        .from('news_article_views')
        .insert({
          session_id: this.session.sessionId,
          article_id: articleId,
          view_start_time: this.session.startTime.toISOString(),
          ip_address: ipAddress,
          user_agent: navigator.userAgent,
          referrer_url: document.referrer || null,
          scroll_depth_percentage: 0,
          is_bounce: false
        })
        .select();

      if (error) {
        console.error('Error tracking article view:', error);
        return;
      }

      // スクロール監視開始
      this.startScrollTracking();
      // 非アクティブ監視開始
      this.startInactivityTracking();
      // ページ可視性監視開始
      this.startVisibilityTracking();
      
    } catch (error) {
      console.error('Error starting reading time tracking:', error);
    }
  }

  // 閲覧終了
  async endTracking(): Promise<void> {
    if (!this.session) {
      return;
    }

    const now = new Date();
    const durationSeconds = Math.floor((now.getTime() - this.session.startTime.getTime()) / 1000);
    
    // 5秒未満の閲覧はスキップ
    if (durationSeconds < 5) {
      this.cleanup();
      return;
    }

    try {
      const isBounce = this.determineBounceStatus(durationSeconds, this.maxScrollDepth);
      
      // データベース更新
      const { error } = await supabase
        .from('news_article_views')
        .update({
          view_end_time: now.toISOString(),
          reading_duration_seconds: durationSeconds,
          scroll_depth_percentage: this.maxScrollDepth,
          is_bounce: isBounce,
          exit_url: window.location.href
        })
        .eq('session_id', this.session.sessionId);

      if (error) {
        console.error('Error updating reading time:', error);
      }
    } catch (error) {
      console.error('Error ending reading time tracking:', error);
    } finally {
      this.cleanup();
    }
  }

  // IPアドレス取得
  private async getClientIP(): Promise<string> {
    try {
      // より信頼性の高いサービスを最初に試す
      try {
        const response = await fetch('https://httpbin.org/ip');
        const data = await response.json();
        return data.origin || 'unknown';
      } catch {
        // フォールバック
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || 'unknown';
      }
    } catch (error) {
      console.error('Error getting IP address:', error);
      return 'unknown';
    }
  }

  // スクロール監視開始
  private startScrollTracking(): void {
    const updateScrollDepth = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      const scrollPercentage = Math.round((scrollTop + windowHeight) / documentHeight * 100);
      const clampedPercentage = Math.min(Math.max(scrollPercentage, 0), 100);
      
      if (clampedPercentage > this.maxScrollDepth) {
        this.maxScrollDepth = clampedPercentage;
      }
    };

    // 初回実行
    updateScrollDepth();

    // スクロールイベント（デバウンス付き）
    let scrollTimeout: NodeJS.Timeout;
    const debouncedScrollHandler = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateScrollDepth, 100);
    };

    window.addEventListener('scroll', debouncedScrollHandler, { passive: true });

    // 定期的にスクロール深度をチェック（15秒間隔）
    this.scrollDepthCheckInterval = setInterval(updateScrollDepth, 15000);

    // クリーンアップ関数を保存
    this.cleanup = () => {
      window.removeEventListener('scroll', debouncedScrollHandler);
      if (this.scrollDepthCheckInterval) {
        clearInterval(this.scrollDepthCheckInterval);
        this.scrollDepthCheckInterval = null;
      }
      clearTimeout(scrollTimeout);
    };
  }

  // 非アクティブ監視開始
  private startInactivityTracking(): void {
    const updateLastActiveTime = () => {
      this.lastActiveTime = new Date();
      if (this.session) {
        this.session.isActive = true;
      }
    };

    // より少ないイベントで監視
    const events = ['click', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, updateLastActiveTime, { passive: true });
    });

    // 5分間非アクティブで一時停止
    this.inactivityTimeout = setInterval(() => {
      const now = new Date();
      const timeSinceLastActivity = now.getTime() - this.lastActiveTime.getTime();
      
      if (timeSinceLastActivity > 300000 && this.session?.isActive) { // 5分
        this.session.isActive = false;
      }
    }, 30000); // 30秒ごとにチェック
  }

  // ページ可視性監視開始
  private startVisibilityTracking(): void {
    const handleVisibilityChange = () => {
      this.isPageVisible = !document.hidden;
      
      if (!this.isPageVisible && this.session) {
        // ページが非表示になったら一時停止
        this.session.isActive = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  // 直帰判定
  private determineBounceStatus(durationSeconds: number, scrollDepth: number): boolean {
    // 30秒未満または20%未満のスクロールで直帰とみなす
    return durationSeconds < 30 || scrollDepth < 20;
  }

  // ページ離脱前の処理
  setupBeforeUnloadTracking(): void {
    const handleBeforeUnload = async () => {
      if (this.session) {
        const now = new Date();
        const durationSeconds = Math.floor((now.getTime() - this.session.startTime.getTime()) / 1000);
        
        if (durationSeconds >= 5) {
          const isBounce = this.determineBounceStatus(durationSeconds, this.maxScrollDepth);
          
          // 直接 Supabase を更新（sendBeacon の代わり）
          await supabase
            .from('news_article_views')
            .update({
              view_end_time: now.toISOString(),
              reading_duration_seconds: durationSeconds,
              scroll_depth_percentage: this.maxScrollDepth,
              is_bounce: isBounce,
              exit_url: window.location.href
            })
            .eq('session_id', this.session.sessionId);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
  }

  // クリーンアップ
  private cleanup(): void {
    if (this.scrollDepthCheckInterval) {
      clearInterval(this.scrollDepthCheckInterval);
      this.scrollDepthCheckInterval = null;
    }
    
    if (this.inactivityTimeout) {
      clearInterval(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }

    this.session = null;
    this.maxScrollDepth = 0;
  }

  // セッション情報取得（外部アクセス用）
  getSessionInfo() {
    if (!this.session) return null;
    return {
      sessionId: this.session.sessionId,
      articleId: this.session.articleId,
      startTime: this.session.startTime,
      isActive: this.session.isActive,
      scrollDepth: this.maxScrollDepth
    };
  }
}

// シングルトンインスタンス
const readingTimeTracker = new ReadingTimeTracker();

export default readingTimeTracker; 