-- SEO最適化のための追加フィールドとインデックスを追加
-- 実行日: 2025-02-10
-- 目的: 検索エンジンクロール最適化

-- news_articlesテーブルにSEOフィールドを追加
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS seo_title varchar(60) DEFAULT NULL;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS meta_description varchar(160) DEFAULT NULL;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS meta_keywords text DEFAULT NULL;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS slug varchar(255) DEFAULT NULL;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS canonical_url varchar(1000) DEFAULT NULL;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS focus_keyword varchar(100) DEFAULT NULL;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS reading_time_minutes integer DEFAULT NULL;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS article_type varchar(50) DEFAULT 'article';
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS author_name varchar(100) DEFAULT 'Queue株式会社';
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS author_url varchar(500) DEFAULT 'https://queue-tech.jp';

-- Open Graph専用フィールド
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS og_title varchar(95) DEFAULT NULL;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS og_description varchar(300) DEFAULT NULL;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS og_image varchar(1000) DEFAULT NULL;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS og_type varchar(50) DEFAULT 'article';

-- Twitter Cards専用フィールド
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS twitter_title varchar(70) DEFAULT NULL;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS twitter_description varchar(200) DEFAULT NULL;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS twitter_image varchar(1000) DEFAULT NULL;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS twitter_card_type varchar(50) DEFAULT 'summary_large_image';

-- SEO管理フィールド
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS meta_robots varchar(100) DEFAULT 'index, follow';
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS structured_data jsonb DEFAULT NULL;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS last_seo_update timestamptz DEFAULT now();

-- 制約条件の追加
ALTER TABLE news_articles ADD CONSTRAINT IF NOT EXISTS check_article_type 
    CHECK (article_type IN ('article', 'blog_post', 'news', 'tutorial', 'case_study', 'technical'));

ALTER TABLE news_articles ADD CONSTRAINT IF NOT EXISTS check_twitter_card_type 
    CHECK (twitter_card_type IN ('summary', 'summary_large_image', 'app', 'player'));

ALTER TABLE news_articles ADD CONSTRAINT IF NOT EXISTS check_og_type 
    CHECK (og_type IN ('article', 'website', 'blog'));

-- スラッグのユニーク制約（公開記事のみ）
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_articles_slug_unique 
    ON news_articles(slug) 
    WHERE status = 'published' AND slug IS NOT NULL;

-- SEO最適化用インデックス
CREATE INDEX IF NOT EXISTS idx_news_articles_seo_title ON news_articles(seo_title);
CREATE INDEX IF NOT EXISTS idx_news_articles_meta_keywords ON news_articles USING gin(to_tsvector('japanese', meta_keywords));
CREATE INDEX IF NOT EXISTS idx_news_articles_focus_keyword ON news_articles(focus_keyword);
CREATE INDEX IF NOT EXISTS idx_news_articles_reading_time ON news_articles(reading_time_minutes);
CREATE INDEX IF NOT EXISTS idx_news_articles_article_type ON news_articles(article_type);
CREATE INDEX IF NOT EXISTS idx_news_articles_last_seo_update ON news_articles(last_seo_update);

-- 全文検索用インデックス（日本語対応）
CREATE INDEX IF NOT EXISTS idx_news_articles_fulltext_japanese 
    ON news_articles USING gin(
        to_tsvector('japanese', coalesce(title, '') || ' ' || 
                               coalesce(summary, '') || ' ' || 
                               coalesce(content, '') || ' ' || 
                               coalesce(meta_keywords, ''))
    );

-- スラッグ自動生成関数
CREATE OR REPLACE FUNCTION generate_article_slug(article_title text, article_id uuid)
RETURNS text AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 0;
    slug_exists boolean := true;
BEGIN
    -- タイトルからスラッグのベースを作成
    base_slug := lower(
        regexp_replace(
            regexp_replace(
                regexp_replace(article_title, '[^\w\s\-]', '', 'g'),  -- 特殊文字を除去
                '\s+', '-', 'g'  -- スペースをハイフンに変換
            ),
            '\-+', '-', 'g'  -- 連続するハイフンを1つに
        )
    );
    
    -- 先頭・末尾のハイフンを除去
    base_slug := trim(base_slug, '-');
    
    -- 長すぎる場合は短縮
    IF length(base_slug) > 200 THEN
        base_slug := left(base_slug, 200);
        base_slug := trim(base_slug, '-');
    END IF;
    
    -- 空の場合はデフォルト値
    IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := 'article';
    END IF;
    
    final_slug := base_slug;
    
    -- 同じスラッグが存在する場合は番号を追加
    WHILE slug_exists LOOP
        SELECT EXISTS(
            SELECT 1 FROM news_articles 
            WHERE slug = final_slug 
            AND id != article_id 
            AND status = 'published'
        ) INTO slug_exists;
        
        IF slug_exists THEN
            counter := counter + 1;
            final_slug := base_slug || '-' || counter::text;
        END IF;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- 読了時間自動計算関数
CREATE OR REPLACE FUNCTION calculate_reading_time(content_text text)
RETURNS integer AS $$
DECLARE
    word_count integer;
    reading_time integer;
BEGIN
    -- HTMLタグを除去してテキストのみを取得
    content_text := regexp_replace(content_text, '<[^>]*>', '', 'g');
    
    -- 日本語文字数をカウント（ひらがな、カタカナ、漢字、英数字）
    word_count := length(regexp_replace(content_text, '[^\p{Hiragana}\p{Katakana}\p{Han}a-zA-Z0-9]', '', 'g'));
    
    -- 日本語の平均読書速度: 400文字/分
    reading_time := GREATEST(1, CEIL(word_count / 400.0));
    
    RETURN reading_time;
END;
$$ LANGUAGE plpgsql;

-- SEO情報自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_seo_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- 読了時間を自動計算
    NEW.reading_time_minutes := calculate_reading_time(NEW.content);
    
    -- スラッグが空の場合は自動生成
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_article_slug(NEW.title, NEW.id);
    END IF;
    
    -- SEOタイトルが空の場合はタイトルを使用（60文字制限）
    IF NEW.seo_title IS NULL OR NEW.seo_title = '' THEN
        NEW.seo_title := left(NEW.title, 60);
    END IF;
    
    -- メタディスクリプションが空の場合は概要から生成（160文字制限）
    IF NEW.meta_description IS NULL OR NEW.meta_description = '' THEN
        NEW.meta_description := left(regexp_replace(NEW.summary, '<[^>]*>', '', 'g'), 160);
    END IF;
    
    -- OGタイトルが空の場合はSEOタイトルを使用
    IF NEW.og_title IS NULL OR NEW.og_title = '' THEN
        NEW.og_title := left(NEW.seo_title, 95);
    END IF;
    
    -- OGディスクリプションが空の場合はメタディスクリプションを使用
    IF NEW.og_description IS NULL OR NEW.og_description = '' THEN
        NEW.og_description := left(NEW.meta_description, 300);
    END IF;
    
    -- Twitterタイトル/ディスクリプションも同様に設定
    IF NEW.twitter_title IS NULL OR NEW.twitter_title = '' THEN
        NEW.twitter_title := left(NEW.seo_title, 70);
    END IF;
    
    IF NEW.twitter_description IS NULL OR NEW.twitter_description = '' THEN
        NEW.twitter_description := left(NEW.meta_description, 200);
    END IF;
    
    -- 画像URLがある場合はOG/Twitter画像にも設定
    IF NEW.image_url IS NOT NULL AND NEW.image_url != '' THEN
        IF NEW.og_image IS NULL OR NEW.og_image = '' THEN
            NEW.og_image := NEW.image_url;
        END IF;
        IF NEW.twitter_image IS NULL OR NEW.twitter_image = '' THEN
            NEW.twitter_image := NEW.image_url;
        END IF;
    END IF;
    
    -- SEO更新日時を更新
    NEW.last_seo_update := now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- SEO自動更新トリガーを作成
DROP TRIGGER IF EXISTS trigger_update_seo_fields ON news_articles;
CREATE TRIGGER trigger_update_seo_fields
    BEFORE INSERT OR UPDATE ON news_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_seo_fields();

-- SEO統計ビューを作成
CREATE OR REPLACE VIEW seo_article_stats AS
SELECT 
    id,
    title,
    seo_title,
    slug,
    status,
    reading_time_minutes,
    article_type,
    created_at,
    published_at,
    last_seo_update,
    -- SEO完成度スコア（0-100）
    (
        CASE WHEN seo_title IS NOT NULL AND seo_title != '' THEN 20 ELSE 0 END +
        CASE WHEN meta_description IS NOT NULL AND meta_description != '' THEN 20 ELSE 0 END +
        CASE WHEN meta_keywords IS NOT NULL AND meta_keywords != '' THEN 15 ELSE 0 END +
        CASE WHEN slug IS NOT NULL AND slug != '' THEN 15 ELSE 0 END +
        CASE WHEN focus_keyword IS NOT NULL AND focus_keyword != '' THEN 10 ELSE 0 END +
        CASE WHEN og_image IS NOT NULL AND og_image != '' THEN 10 ELSE 0 END +
        CASE WHEN canonical_url IS NOT NULL AND canonical_url != '' THEN 10 ELSE 0 END
    ) AS seo_completion_score,
    -- SEO警告
    CASE 
        WHEN length(seo_title) > 60 THEN 'SEOタイトルが長すぎます'
        WHEN length(meta_description) > 160 THEN 'メタディスクリプションが長すぎます'
        WHEN slug IS NULL OR slug = '' THEN 'スラッグが設定されていません'
        WHEN reading_time_minutes IS NULL THEN '読了時間が計算されていません'
        ELSE 'OK'
    END AS seo_warnings
FROM news_articles
WHERE status IN ('published', 'draft');

-- SEOキーワード分析ビュー
CREATE OR REPLACE VIEW seo_keyword_analysis AS
SELECT 
    focus_keyword,
    COUNT(*) as article_count,
    AVG(reading_time_minutes) as avg_reading_time,
    STRING_AGG(title, '; ') as articles_using_keyword
FROM news_articles 
WHERE focus_keyword IS NOT NULL 
  AND focus_keyword != ''
  AND status = 'published'
GROUP BY focus_keyword
ORDER BY article_count DESC;

-- 記事の全文検索関数（日本語対応）
CREATE OR REPLACE FUNCTION search_articles_fulltext(
    search_query text,
    limit_count integer DEFAULT 10,
    offset_count integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    title varchar(500),
    summary text,
    slug varchar(255),
    reading_time_minutes integer,
    published_at timestamptz,
    rank real
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.summary,
        a.slug,
        a.reading_time_minutes,
        a.published_at,
        ts_rank(
            to_tsvector('japanese', 
                coalesce(a.title, '') || ' ' || 
                coalesce(a.summary, '') || ' ' || 
                coalesce(a.content, '') || ' ' || 
                coalesce(a.meta_keywords, '')
            ),
            plainto_tsquery('japanese', search_query)
        ) as rank
    FROM news_articles a
    WHERE 
        a.status = 'published'
        AND to_tsvector('japanese', 
            coalesce(a.title, '') || ' ' || 
            coalesce(a.summary, '') || ' ' || 
            coalesce(a.content, '') || ' ' || 
            coalesce(a.meta_keywords, '')
        ) @@ plainto_tsquery('japanese', search_query)
    ORDER BY rank DESC, a.published_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- サイトマップ生成用ビュー
CREATE OR REPLACE VIEW sitemap_articles AS
SELECT 
    id,
    slug,
    published_at as lastmod,
    last_seo_update,
    CASE 
        WHEN published_at >= NOW() - INTERVAL '7 days' THEN 'daily'
        WHEN published_at >= NOW() - INTERVAL '30 days' THEN 'weekly'
        ELSE 'monthly'
    END as changefreq,
    CASE 
        WHEN published_at >= NOW() - INTERVAL '7 days' THEN '0.9'
        WHEN published_at >= NOW() - INTERVAL '30 days' THEN '0.7'
        ELSE '0.5'
    END as priority
FROM news_articles 
WHERE status = 'published' 
  AND slug IS NOT NULL 
  AND slug != ''
ORDER BY published_at DESC;