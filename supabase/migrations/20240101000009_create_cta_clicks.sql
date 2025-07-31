-- CTAクリックトラッキングテーブルの作成
CREATE TABLE IF NOT EXISTS cta_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
    cta_type TEXT NOT NULL DEFAULT 'consultation', -- 'consultation', 'contact', 'other'
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    referrer_url TEXT,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_cta_clicks_article_id ON cta_clicks(article_id);
CREATE INDEX IF NOT EXISTS idx_cta_clicks_cta_type ON cta_clicks(cta_type);
CREATE INDEX IF NOT EXISTS idx_cta_clicks_clicked_at ON cta_clicks(clicked_at);

-- RLS（行レベルセキュリティ）を有効化
ALTER TABLE cta_clicks ENABLE ROW LEVEL SECURITY;

-- 管理者のみがデータを参照・操作可能なポリシーを作成
CREATE POLICY "Admin can view all cta_clicks" ON cta_clicks
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Admin can insert cta_clicks" ON cta_clicks
    FOR INSERT WITH CHECK (true);

-- CTAクリック統計用のビューを作成
CREATE OR REPLACE VIEW cta_click_stats AS
SELECT 
    na.id as article_id,
    na.title as article_title,
    na.published_at,
    COUNT(cc.id) as total_clicks,
    COUNT(DISTINCT cc.ip_address) as unique_clicks,
    COUNT(CASE WHEN cc.cta_type = 'consultation' THEN 1 END) as consultation_clicks,
    COUNT(av.id) as total_views,
    CASE 
        WHEN COUNT(av.id) > 0 THEN ROUND((COUNT(cc.id)::numeric / COUNT(av.id)::numeric) * 100, 2)
        ELSE 0 
    END as click_rate_percentage
FROM news_articles na
LEFT JOIN cta_clicks cc ON na.id = cc.article_id
LEFT JOIN news_article_views av ON na.id = av.article_id
WHERE na.status = 'published'
GROUP BY na.id, na.title, na.published_at
ORDER BY na.published_at DESC;

-- コメント追加
COMMENT ON TABLE cta_clicks IS 'CTAクリック履歴テーブル - 記事内のCTAボタンのクリックを追跡';
COMMENT ON COLUMN cta_clicks.article_id IS '記事ID（外部キー）';
COMMENT ON COLUMN cta_clicks.cta_type IS 'CTAタイプ（consultation: 無料相談、contact: お問い合わせ、other: その他）';
COMMENT ON COLUMN cta_clicks.ip_address IS 'クリックしたユーザーのIPアドレス';
COMMENT ON COLUMN cta_clicks.user_agent IS 'ユーザーエージェント情報';
COMMENT ON COLUMN cta_clicks.referrer_url IS 'リファラーURL';
COMMENT ON COLUMN cta_clicks.clicked_at IS 'CTAクリック日時'; 