-- 記事の表示順序カスタマイズ機能追加
-- 管理者が自由に記事の表示順序を決められるようにする

-- news_articlesテーブルにsort_order（表示順序）カラムを追加
ALTER TABLE news_articles 
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- sort_orderのコメント追加
COMMENT ON COLUMN news_articles.sort_order IS '表示順序（小さい順に表示、0=デフォルト）';

-- sort_order用のインデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_news_articles_sort_order 
    ON news_articles(sort_order DESC, created_at DESC);

-- 複合インデックス作成（status, sort_order, created_at）
CREATE INDEX IF NOT EXISTS idx_news_articles_status_sort_order 
    ON news_articles(status, sort_order DESC, created_at DESC);

-- 既存の記事にデフォルトのsort_order値を設定
-- 作成日時順に1, 2, 3...の値を割り当て
WITH ranked_articles AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY created_at DESC) as new_sort_order
    FROM news_articles 
    WHERE sort_order = 0 OR sort_order IS NULL
)
UPDATE news_articles 
SET sort_order = ranked_articles.new_sort_order
FROM ranked_articles
WHERE news_articles.id = ranked_articles.id;

-- sort_orderの自動設定ファンクション
CREATE OR REPLACE FUNCTION set_default_sort_order()
RETURNS TRIGGER AS $$
BEGIN
    -- 新規作成時のみ、sort_orderが設定されていない場合に自動設定
    IF TG_OP = 'INSERT' AND (NEW.sort_order = 0 OR NEW.sort_order IS NULL) THEN
        -- 最大のsort_order + 1を設定
        SELECT COALESCE(MAX(sort_order), 0) + 1 
        INTO NEW.sort_order 
        FROM news_articles;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- sort_order自動設定トリガー
DROP TRIGGER IF EXISTS trigger_set_default_sort_order ON news_articles;
CREATE TRIGGER trigger_set_default_sort_order
    BEFORE INSERT ON news_articles
    FOR EACH ROW
    EXECUTE FUNCTION set_default_sort_order();

-- 表示順序更新用のファンクション
CREATE OR REPLACE FUNCTION update_article_sort_order(
    article_id UUID,
    new_sort_order INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    -- 指定された記事のsort_orderを更新
    UPDATE news_articles 
    SET sort_order = new_sort_order,
        updated_at = NOW()
    WHERE id = article_id;
    
    -- 更新が成功したかチェック
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 複数記事の表示順序を一括更新するファンクション
CREATE OR REPLACE FUNCTION batch_update_sort_orders(
    article_orders JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    item JSONB;
BEGIN
    -- JSONBの配列をループして各記事のsort_orderを更新
    FOR item IN SELECT * FROM jsonb_array_elements(article_orders)
    LOOP
        UPDATE news_articles 
        SET sort_order = (item->>'sort_order')::INTEGER,
            updated_at = NOW()
        WHERE id = (item->>'id')::UUID;
    END LOOP;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 表示順序統計ビュー
CREATE OR REPLACE VIEW article_sort_stats AS
SELECT 
    COUNT(*) as total_articles,
    COUNT(CASE WHEN sort_order > 0 THEN 1 END) as custom_sorted_articles,
    MIN(sort_order) as min_sort_order,
    MAX(sort_order) as max_sort_order,
    AVG(sort_order) as avg_sort_order
FROM news_articles 
WHERE status = 'published';

-- 表示順序管理ビュー（管理画面用）
CREATE OR REPLACE VIEW article_sort_management AS
SELECT 
    id,
    title,
    status,
    sort_order,
    created_at,
    published_at,
    updated_at,
    CASE 
        WHEN sort_order = 0 THEN '自動'
        ELSE sort_order::TEXT
    END as sort_order_display,
    ROW_NUMBER() OVER (ORDER BY sort_order DESC, created_at DESC) as current_position
FROM news_articles
ORDER BY sort_order DESC, created_at DESC;
