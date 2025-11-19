-- Add hub/sub page structure to news_articles
-- 目的: ブログ記事を「通常 / ハブ / ハブ配下」に分類し、ハブ配下ページを紐付けできるようにする

-- 1. ページ種別カラムの追加
--    normal: 既存の通常記事（デフォルト）
--    hub   : ハブページ（トピックの中心ページ）
--    sub   : ハブ配下のページ（ユースケース別・業界別など）
ALTER TABLE news_articles
  ADD COLUMN IF NOT EXISTS page_type varchar(20) DEFAULT 'normal'
    CHECK (page_type IN ('normal', 'hub', 'sub'));

-- 2. ハブ親IDカラムの追加
--    ハブ配下ページのみ利用。news_articles.id を参照する自己参照FK。
ALTER TABLE news_articles
  ADD COLUMN IF NOT EXISTS parent_hub_id uuid NULL
    REFERENCES news_articles(id) ON DELETE SET NULL;

-- 3. ハブ内での表示順序
--    ハブ配下ページの並び順を制御するための任意のソート番号
ALTER TABLE news_articles
  ADD COLUMN IF NOT EXISTS cluster_sort_order integer NULL;

-- 4. インデックス作成
CREATE INDEX IF NOT EXISTS idx_news_articles_page_type
  ON news_articles(page_type);

CREATE INDEX IF NOT EXISTS idx_news_articles_parent_hub
  ON news_articles(parent_hub_id);

CREATE INDEX IF NOT EXISTS idx_news_articles_cluster_sort_order
  ON news_articles(cluster_sort_order);

-- メモ:
-- - 既存レコードは page_type = 'normal' として扱われるため、互換性を維持できます。
-- - URL構造や既存の /news/* ルーティングは変更せず、メタデータとしてハブ構造を管理します。


