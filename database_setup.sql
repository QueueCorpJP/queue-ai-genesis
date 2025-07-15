-- ニュース記事管理機能のデータベース設定
-- このSQLファイルは、Queue-LPプロジェクトのSupabaseデータベースにニュース記事テーブルを追加するためのものです。

-- ニュース記事用テーブル
CREATE TABLE IF NOT EXISTS news_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    source_url VARCHAR(1000),
    image_url VARCHAR(1000),
    tags TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 既存テーブルにimage_urlカラムを追加（テーブルが既に存在する場合）
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS image_url VARCHAR(1000);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_news_articles_status ON news_articles(status);
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_news_articles_created_at ON news_articles(created_at);
CREATE INDEX IF NOT EXISTS idx_news_articles_tags ON news_articles USING GIN(tags);

-- 更新日時自動更新のトリガー関数（既存の場合はスキップ）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- news_articles テーブルにトリガーを追加
DROP TRIGGER IF EXISTS update_news_articles_updated_at ON news_articles;
CREATE TRIGGER update_news_articles_updated_at
    BEFORE UPDATE ON news_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) を有効化
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

-- 管理者用ポリシー（すべての操作を許可）
CREATE POLICY "管理者は全ての操作が可能" ON news_articles
    FOR ALL
    USING (true);

-- 一般ユーザー用ポリシー（公開記事のみ読み取り可能）
CREATE POLICY "一般ユーザーは公開記事のみ読み取り可能" ON news_articles
    FOR SELECT
    USING (status = 'published');

-- Supabase Storageバケットの作成
INSERT INTO storage.buckets (id, name, public) 
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- ストレージポリシーの設定（画像アップロード用）
CREATE POLICY "画像アップロード可能" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'public' AND (storage.foldername(name))[1] = 'news-images');

CREATE POLICY "画像読み取り可能" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'public');

CREATE POLICY "画像削除可能" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'public' AND (storage.foldername(name))[1] = 'news-images');

-- サンプルデータの挿入（オプション）
INSERT INTO news_articles (title, summary, content, source_name, source_url, image_url, tags, status, published_at)
VALUES 
    (
        'Queue株式会社、2024年最速ディールで1500万円の資金調達',
        'スカイランドベンチャーズからシードラウンドの調達に成功',
        'Queue株式会社は、スカイランドベンチャーズをリード投資家として、シードラウンドで1500万円の資金調達を完了したことを発表しました。

この調達資金は、同社の主力製品であるAI開発プラットフォームの機能拡充と、海外展開の加速に充てられる予定です。Queue株式会社の代表取締役CEO 谷口太一（ジョン/John Bobby）氏は「今回の資金調達により、私たちのミッションである『AIの民主化』をさらに推進できることを嬉しく思います」とコメントしています。

スカイランドベンチャーズの代表パートナーは「Queueのチームは、AIの開発・実装におけるハードルを下げ、多くの企業がAIを活用できるプラットフォームを構築している点に大きな可能性を感じました」と述べています。

現在Queue株式会社は、東京を拠点に急速に成長しており、今回の資金調達を機に、エンジニアとセールスの採用を強化する方針です。',
        'PR TIMES',
        'https://prtimes.jp/main/html/rd/p/000000002.000147944.html',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
        ARRAY['資金調達', 'スタートアップ', 'AI'],
        'published',
        NOW()
    ),
    (
        'Queue株式会社、AI開発プラットフォーム「Workmate ai」の正式版をリリース',
        '企業のAI導入を加速する画期的なプラットフォーム',
        'Queue株式会社は、企業のAI導入を支援するプラットフォーム「Workmate ai」の正式版を本日リリースしました。

Workmate aiは、これまでベータ版を通じて100社以上の企業に導入され、AI開発の工数を平均で60%削減することに成功。特に、非エンジニアでも直感的にAIモデルを選定・カスタマイズできる点が高く評価されています。

今回の正式リリースでは、多言語対応や、より高度なカスタマイズ機能が追加されました。年内には大規模言語モデル（LLM）のファインチューニング機能も実装される予定です。

Queue株式会社代表取締役CEO 谷口太一（ジョン/John Bobby）氏は「日本発のAI開発プラットフォームとして、グローバル市場での展開も視野に入れている」と今後の展望を示しています。',
        '日本経済新聞',
        'https://www.nikkei.com/compass/content/PRTKDB000000195_000008324/preview',
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop',
        ARRAY['プロダクトリリース', 'AI', 'テクノロジー'],
        'published',
        NOW() - INTERVAL '15 days'
    )
ON CONFLICT (id) DO NOTHING;

-- 完了メッセージ
SELECT 'ニュース記事テーブル（画像対応）の作成が完了しました' as message; 