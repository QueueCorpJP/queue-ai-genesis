-- ニュース記事テーブルに画像機能を追加するマイグレーションスクリプト
-- このスクリプトは、既存のnews_articlesテーブルに画像アップロード機能を追加します。

-- 1. news_articlesテーブルにimage_urlカラムを追加
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS image_url VARCHAR(1000);

-- 2. Supabase Storageバケットの作成（既に存在する場合はスキップ）
INSERT INTO storage.buckets (id, name, public) 
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- 3. 既存のストレージポリシーを削除（エラーを無視）
DROP POLICY IF EXISTS "画像アップロード可能" ON storage.objects;
DROP POLICY IF EXISTS "画像読み取り可能" ON storage.objects;
DROP POLICY IF EXISTS "画像削除可能" ON storage.objects;

-- 4. 新しいストレージポリシーを作成
CREATE POLICY "画像アップロード可能" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'public' AND (storage.foldername(name))[1] = 'news-images');

CREATE POLICY "画像読み取り可能" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'public');

CREATE POLICY "画像削除可能" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'public' AND (storage.foldername(name))[1] = 'news-images');

-- 5. サンプル画像URLを既存の記事に追加（オプション）
UPDATE news_articles 
SET image_url = CASE 
    WHEN title LIKE '%資金調達%' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop'
    WHEN title LIKE '%Workmate%' OR title LIKE '%プラットフォーム%' THEN 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop'
    ELSE NULL
END
WHERE image_url IS NULL;

-- 完了メッセージ
SELECT 'ニュース記事の画像機能追加マイグレーションが完了しました' as message; 