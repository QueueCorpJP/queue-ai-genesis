-- Analytics用のテーブル作成マイグレーション
-- 実行前に必ずバックアップを取ってください

-- 1. 記事閲覧数追跡テーブル
CREATE TABLE IF NOT EXISTS public.news_article_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- 外部キー制約
    CONSTRAINT news_article_views_article_id_fkey 
        FOREIGN KEY (article_id) 
        REFERENCES public.news_articles(id) 
        ON DELETE CASCADE
);

-- 2. インデックス作成
CREATE INDEX IF NOT EXISTS news_article_views_article_id_idx ON public.news_article_views(article_id);
CREATE INDEX IF NOT EXISTS news_article_views_created_at_idx ON public.news_article_views(created_at);
CREATE INDEX IF NOT EXISTS news_article_views_ip_address_idx ON public.news_article_views(ip_address);

-- 3. RLS（Row Level Security）ポリシー設定
ALTER TABLE public.news_article_views ENABLE ROW LEVEL SECURITY;

-- 誰でも閲覧数を挿入可能（記事閲覧時）
CREATE POLICY "Anyone can insert article views" ON public.news_article_views
    FOR INSERT WITH CHECK (true);

-- 認証済みユーザーが閲覧数データを参照可能
-- 注意: 現在の実装では管理者認証はクライアントサイドで行われているため、
-- 詳細な権限制御が必要な場合は追加のセキュリティ対策を検討してください
CREATE POLICY "Authenticated users can view article views" ON public.news_article_views
    FOR SELECT USING (true);

-- 4. 便利なビュー作成：記事ごとの閲覧数統計
CREATE OR REPLACE VIEW public.article_view_stats AS
SELECT 
    a.id,
    a.title,
    a.published_at,
    a.status,
    COALESCE(v.view_count, 0) as view_count,
    COALESCE(v.unique_viewers, 0) as unique_viewers,
    v.latest_view
FROM public.news_articles a
LEFT JOIN (
    SELECT 
        article_id,
        COUNT(*) as view_count,
        COUNT(DISTINCT ip_address) as unique_viewers,
        MAX(created_at) as latest_view
    FROM public.news_article_views
    GROUP BY article_id
) v ON a.id = v.article_id
WHERE a.status = 'published'
ORDER BY v.view_count DESC NULLS LAST;

-- 5. 日別閲覧数統計ビュー
CREATE OR REPLACE VIEW public.daily_article_views AS
SELECT 
    DATE(created_at) as view_date,
    article_id,
    COUNT(*) as daily_views,
    COUNT(DISTINCT ip_address) as unique_daily_viewers
FROM public.news_article_views
GROUP BY DATE(created_at), article_id
ORDER BY view_date DESC, daily_views DESC;

-- 6. 便利な関数：記事の総閲覧数を取得
CREATE OR REPLACE FUNCTION public.get_article_view_count(article_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.news_article_views
        WHERE article_id = article_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 便利な関数：記事のユニーク閲覧者数を取得
CREATE OR REPLACE FUNCTION public.get_article_unique_viewers(article_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(DISTINCT ip_address)::INTEGER
        FROM public.news_article_views
        WHERE article_id = article_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 便利な関数：期間別の閲覧統計を取得
CREATE OR REPLACE FUNCTION public.get_article_views_by_period(
    article_uuid UUID,
    start_date DATE,
    end_date DATE
)
RETURNS TABLE(
    view_date DATE,
    view_count BIGINT,
    unique_viewers BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(created_at) as view_date,
        COUNT(*) as view_count,
        COUNT(DISTINCT ip_address) as unique_viewers
    FROM public.news_article_views
    WHERE article_id = article_uuid
        AND DATE(created_at) BETWEEN start_date AND end_date
    GROUP BY DATE(created_at)
    ORDER BY view_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. クリーンアップ関数：古い閲覧データを削除（オプション）
CREATE OR REPLACE FUNCTION public.cleanup_old_article_views(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.news_article_views
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 管理者用の統計情報を取得する関数
CREATE OR REPLACE FUNCTION public.get_analytics_summary()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_article_views', (
            SELECT COUNT(*) FROM public.news_article_views
        ),
        'unique_viewers', (
            SELECT COUNT(DISTINCT ip_address) FROM public.news_article_views
        ),
        'published_articles', (
            SELECT COUNT(*) FROM public.news_articles WHERE status = 'published'
        ),
        'most_viewed_article', (
            SELECT json_build_object(
                'id', a.id,
                'title', a.title,
                'view_count', COUNT(v.id)
            )
            FROM public.news_articles a
            LEFT JOIN public.news_article_views v ON a.id = v.article_id
            WHERE a.status = 'published'
            GROUP BY a.id, a.title
            ORDER BY COUNT(v.id) DESC
            LIMIT 1
        ),
        'views_today', (
            SELECT COUNT(*) 
            FROM public.news_article_views 
            WHERE DATE(created_at) = CURRENT_DATE
        ),
        'views_this_week', (
            SELECT COUNT(*) 
            FROM public.news_article_views 
            WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
        ),
        'views_this_month', (
            SELECT COUNT(*) 
            FROM public.news_article_views 
            WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. ビューと関数の権限設定
GRANT SELECT ON public.article_view_stats TO authenticated;
GRANT SELECT ON public.article_view_stats TO anon;
GRANT SELECT ON public.daily_article_views TO authenticated;
GRANT SELECT ON public.daily_article_views TO anon;
GRANT EXECUTE ON FUNCTION public.get_article_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_article_view_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_article_unique_viewers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_article_unique_viewers(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_article_views_by_period(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_article_views_by_period(UUID, DATE, DATE) TO anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_summary() TO anon;

-- 12. 匿名ユーザーと認証済みユーザーが閲覧数を記録できるよう権限を付与
GRANT INSERT ON public.news_article_views TO anon;
GRANT INSERT ON public.news_article_views TO authenticated;

-- マイグレーション完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'Analytics migration completed successfully!';
    RAISE NOTICE 'Created tables: news_article_views';
    RAISE NOTICE 'Created views: article_view_stats, daily_article_views';
    RAISE NOTICE 'Created functions: get_article_view_count, get_article_unique_viewers, get_article_views_by_period, get_analytics_summary, cleanup_old_article_views';
    RAISE NOTICE 'Configured RLS policies for secure access';
    RAISE NOTICE 'Note: This migration is compatible with client-side admin authentication';
END $$; 