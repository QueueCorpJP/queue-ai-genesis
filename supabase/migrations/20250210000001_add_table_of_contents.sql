-- マイグレーション: 記事の目次機能追加
-- 作成日: 2025年2月10日
-- 目的: news_articlesテーブルに目次（Table of Contents）機能を追加

-- 1. news_articlesテーブルに目次関連カラムを追加
ALTER TABLE news_articles 
ADD COLUMN table_of_contents jsonb DEFAULT NULL,
ADD COLUMN auto_generate_toc boolean NOT NULL DEFAULT false,
ADD COLUMN toc_style varchar(20) NOT NULL DEFAULT 'numbered';

-- 2. 目次スタイルの制約を追加
ALTER TABLE news_articles
ADD CONSTRAINT check_toc_style 
CHECK (toc_style IN ('numbered', 'bulleted', 'plain', 'hierarchical'));

-- 3. 目次データのインデックスを作成（検索・フィルタリング用）
CREATE INDEX idx_news_articles_toc_content ON news_articles USING GIN (table_of_contents);
CREATE INDEX idx_news_articles_auto_toc ON news_articles (auto_generate_toc);
CREATE INDEX idx_news_articles_toc_style ON news_articles (toc_style);

-- 4. 目次データのバリデーション関数を作成
CREATE OR REPLACE FUNCTION validate_table_of_contents(toc_data jsonb)
RETURNS boolean AS $$
BEGIN
    -- NULL値は許可
    IF toc_data IS NULL THEN
        RETURN true;
    END IF;
    
    -- 配列でない場合は無効
    IF jsonb_typeof(toc_data) != 'array' THEN
        RETURN false;
    END IF;
    
    -- 各要素が必要なフィールドを持っているかチェック
    IF NOT (
        SELECT bool_and(
            item ? 'level' AND 
            item ? 'title' AND 
            item ? 'anchor' AND
            (item->>'level')::int BETWEEN 1 AND 6 AND
            length(item->>'title') > 0 AND
            length(item->>'anchor') > 0
        )
        FROM jsonb_array_elements(toc_data) AS item
    ) THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. 目次データのバリデーション制約を追加
ALTER TABLE news_articles
ADD CONSTRAINT check_valid_toc 
CHECK (validate_table_of_contents(table_of_contents));

-- 6. 目次付き記事の統計ビューを作成
CREATE OR REPLACE VIEW news_articles_toc_stats AS
SELECT 
    COUNT(*) as total_articles,
    COUNT(table_of_contents) as articles_with_toc,
    COUNT(CASE WHEN auto_generate_toc = true THEN 1 END) as auto_generated_toc,
    COUNT(CASE WHEN table_of_contents IS NOT NULL AND auto_generate_toc = false THEN 1 END) as manual_toc,
    ROUND(
        (COUNT(table_of_contents)::decimal / COUNT(*)) * 100, 2
    ) as toc_coverage_percentage,
    (
        SELECT jsonb_object_agg(toc_style, style_count)
        FROM (
            SELECT 
                toc_style,
                COUNT(*) as style_count
            FROM news_articles 
            WHERE status = 'published' AND table_of_contents IS NOT NULL
            GROUP BY toc_style
        ) style_stats
    ) as toc_style_distribution
FROM news_articles
WHERE status = 'published';

-- 7. 記事の目次情報を取得するビューを作成
CREATE OR REPLACE VIEW news_articles_with_toc AS
SELECT 
    na.id,
    na.title,
    na.summary,
    na.content,
    na.table_of_contents,
    na.auto_generate_toc,
    na.toc_style,
    na.status,
    na.published_at,
    na.created_at,
    na.updated_at,
    -- 目次の要素数
    CASE 
        WHEN na.table_of_contents IS NOT NULL 
        THEN jsonb_array_length(na.table_of_contents)
        ELSE 0 
    END as toc_items_count,
    -- 最大見出しレベル
    CASE 
        WHEN na.table_of_contents IS NOT NULL 
        THEN (
            SELECT MAX((item->>'level')::int)
            FROM jsonb_array_elements(na.table_of_contents) AS item
        )
        ELSE 0 
    END as max_heading_level,
    -- 最小見出しレベル
    CASE 
        WHEN na.table_of_contents IS NOT NULL 
        THEN (
            SELECT MIN((item->>'level')::int)
            FROM jsonb_array_elements(na.table_of_contents) AS item
        )
        ELSE 0 
    END as min_heading_level
FROM news_articles na
WHERE na.status IN ('published', 'draft');

-- 8. 目次生成支援ファンクションを作成
CREATE OR REPLACE FUNCTION generate_toc_from_content(content_html text)
RETURNS jsonb AS $$
DECLARE
    toc_items jsonb := '[]'::jsonb;
    heading_pattern text := '<h([1-6])[^>]*>([^<]+)</h[1-6]>';
    matches text[][];
    item jsonb;
    item_array text[];
    i int := 1;
BEGIN
    -- HTML content から見出しタグを抽出
    SELECT array_agg(ARRAY[match[1], match[2]]) INTO matches
    FROM (
        SELECT regexp_matches(content_html, heading_pattern, 'gi') as match
    ) AS subquery;
    
    -- マッチした見出しから目次アイテムを生成
    IF matches IS NOT NULL THEN
        FOREACH item_array SLICE 1 IN ARRAY matches
        LOOP
            item := jsonb_build_object(
                'level', item_array[1]::int,
                'title', trim(item_array[2]),
                'anchor', 'heading-' || i,
                'order', i
            );
            toc_items := toc_items || item;
            i := i + 1;
        END LOOP;
    END IF;
    
    RETURN toc_items;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 9. 目次データ取得ファンクションを作成
CREATE OR REPLACE FUNCTION get_article_toc_data(article_id uuid)
RETURNS jsonb AS $$
DECLARE
    article_record record;
    result jsonb;
BEGIN
    -- 記事データを取得
    SELECT id, title, table_of_contents, auto_generate_toc, toc_style, content
    INTO article_record
    FROM news_articles 
    WHERE id = article_id AND status IN ('published', 'draft');
    
    IF NOT FOUND THEN
        RETURN '{"error": "Article not found"}'::jsonb;
    END IF;
    
    -- 目次データを構築
    result := jsonb_build_object(
        'article_id', article_record.id,
        'article_title', article_record.title,
        'toc_style', article_record.toc_style,
        'auto_generate', article_record.auto_generate_toc,
        'toc_items', COALESCE(article_record.table_of_contents, '[]'::jsonb),
        'items_count', COALESCE(jsonb_array_length(article_record.table_of_contents), 0)
    );
    
    -- 自動生成フラグが立っている場合は、コンテンツから目次を生成
    IF article_record.auto_generate_toc AND article_record.table_of_contents IS NULL THEN
        result := jsonb_set(
            result, 
            '{suggested_toc}', 
            generate_toc_from_content(article_record.content)
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- 10. 目次検索ファンクションを作成
CREATE OR REPLACE FUNCTION search_articles_by_toc(search_term text, limit_count int DEFAULT 20)
RETURNS TABLE (
    id uuid,
    title varchar(500),
    summary text,
    table_of_contents jsonb,
    toc_style varchar(20),
    toc_items_count int,
    published_at timestamptz,
    relevance_score numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        na.id,
        na.title,
        na.summary,
        na.table_of_contents,
        na.toc_style,
        CASE 
            WHEN na.table_of_contents IS NOT NULL 
            THEN jsonb_array_length(na.table_of_contents)
            ELSE 0 
        END as toc_items_count,
        na.published_at,
        -- 目次内での検索語の関連度スコアを計算
        CASE 
            WHEN na.table_of_contents IS NOT NULL THEN
                (
                    SELECT COUNT(*)::numeric
                    FROM jsonb_array_elements(na.table_of_contents) AS item
                    WHERE item->>'title' ILIKE '%' || search_term || '%'
                )
            ELSE 0
        END as relevance_score
    FROM news_articles na
    WHERE na.status = 'published'
    AND na.table_of_contents IS NOT NULL
    AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements(na.table_of_contents) AS item
        WHERE item->>'title' ILIKE '%' || search_term || '%'
    )
    ORDER BY relevance_score DESC, na.published_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- 11. トリガー関数: 目次の自動生成
CREATE OR REPLACE FUNCTION auto_generate_toc_trigger()
RETURNS trigger AS $$
BEGIN
    -- 自動生成フラグが立っていて、目次が空の場合に自動生成
    IF NEW.auto_generate_toc = true AND NEW.table_of_contents IS NULL THEN
        NEW.table_of_contents := generate_toc_from_content(NEW.content);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. トリガーを作成
CREATE TRIGGER trigger_auto_generate_toc
    BEFORE INSERT OR UPDATE ON news_articles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_toc_trigger();

-- 13. コメント追加
COMMENT ON COLUMN news_articles.table_of_contents IS '記事の目次データ（JSON形式）- level, title, anchor, orderを含む配列';
COMMENT ON COLUMN news_articles.auto_generate_toc IS '記事内容から目次を自動生成するかのフラグ';
COMMENT ON COLUMN news_articles.toc_style IS '目次の表示スタイル（numbered, bulleted, plain, hierarchical）';

COMMENT ON FUNCTION validate_table_of_contents(jsonb) IS '目次データの形式をバリデーションする関数';
COMMENT ON FUNCTION generate_toc_from_content(text) IS 'HTML内容から見出しタグを抽出して目次を自動生成する関数';
COMMENT ON FUNCTION get_article_toc_data(uuid) IS '指定記事の目次データを取得する関数';
COMMENT ON FUNCTION search_articles_by_toc(text, int) IS '目次内容で記事を検索する関数';

COMMENT ON VIEW news_articles_toc_stats IS '目次機能の利用統計を表示するビュー';
COMMENT ON VIEW news_articles_with_toc IS '目次情報を含む記事データを表示するビュー';

-- マイグレーション完了メッセージ
DO $$
BEGIN
    INSERT INTO migration_log (version, description, executed_at)
    VALUES (
        '20250210000001', 
        '記事の目次機能追加 - table_of_contents, auto_generate_toc, toc_style カラム追加、関連ビュー・ファンクション作成',
        now()
    );
    RAISE NOTICE '✅ 目次機能マイグレーション完了: news_articlesテーブルに目次機能を追加しました';
END $$;