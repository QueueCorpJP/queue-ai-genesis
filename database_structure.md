# Queue-LP Database Structure

## 概要
Queue-LP（Queue Landing Page）のデータベース構造について説明します。
このシステムは、Queue株式会社の公式サイトのお問い合わせフォームとニュース記事管理機能を提供します。

## 使用技術
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **ORM**: Supabase JavaScript Client
- **Framework**: React + TypeScript + Vite

## データベース構造

### 1. 無料相談申込テーブル (`consultation_requests`)

```sql
CREATE TABLE consultation_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    service TEXT NOT NULL CHECK (service IN ('ai_development', 'prompt_engineering', 'prototype', 'other')),
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

**フィールド詳細:**
- `id`: UUID型、主キー
- `name`: 申込者名
- `company`: 会社名
- `email`: メールアドレス
- `phone`: 電話番号
- `service`: サービス種別（ai_development/prompt_engineering/prototype/other）
- `message`: 申込内容
- `status`: ステータス（pending/in_progress/completed/cancelled）
- `created_at`: 作成日時
- `updated_at`: 更新日時

**インデックス:**
- `consultation_requests_email_idx`: メールアドレスでの検索最適化
- `consultation_requests_status_idx`: ステータスでの検索最適化
- `consultation_requests_created_at_idx`: 作成日時での検索最適化

### 2. お問い合わせテーブル (`contact_requests`)

```sql
CREATE TABLE contact_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

**フィールド詳細:**
- `id`: UUID型、主キー
- `name`: 問い合わせ者名
- `company`: 会社名
- `email`: メールアドレス
- `phone`: 電話番号（任意）
- `message`: 問い合わせ内容
- `status`: ステータス（pending/in_progress/completed/cancelled）
- `created_at`: 作成日時
- `updated_at`: 更新日時

**インデックス:**
- `contact_requests_email_idx`: メールアドレスでの検索最適化
- `contact_requests_status_idx`: ステータスでの検索最適化
- `contact_requests_created_at_idx`: 作成日時での検索最適化

### 3. 管理者テーブル (`admin_users`)

```sql
CREATE TABLE admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

**フィールド詳細:**
- `id`: UUID型、主キー
- `email`: ログイン用メールアドレス
- `password_hash`: パスワードハッシュ
- `name`: 管理者名
- `created_at`: 作成日時
- `updated_at`: 更新日時

**デフォルト管理者:**
- Email: queue@queue-tech.jp
- Password: Taichi00610

### 4. ニュース記事テーブル (`news_articles`)

```sql
CREATE TABLE news_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    source_name TEXT NOT NULL,
    source_url TEXT,
    image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

**フィールド詳細:**
- `id`: UUID型、主キー
- `title`: 記事タイトル
- `summary`: 記事概要
- `content`: 記事本文
- `source_name`: 情報源名
- `source_url`: 情報源URL（任意）
- `image_url`: アイキャッチ画像URL（任意）
- `tags`: タグ配列
- `status`: ステータス（draft/published/archived）
- `published_at`: 公開日時
- `created_at`: 作成日時
- `updated_at`: 更新日時

**インデックス:**
- `news_articles_status_idx`: ステータスでの検索最適化
- `news_articles_published_at_idx`: 公開日時での検索最適化
- `news_articles_created_at_idx`: 作成日時での検索最適化

### 5. 記事閲覧数追跡テーブル (`news_article_views`)

```sql
CREATE TABLE news_article_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT news_article_views_article_id_fkey 
        FOREIGN KEY (article_id) 
        REFERENCES news_articles(id) 
        ON DELETE CASCADE
);
```

**フィールド詳細:**
- `id`: UUID型、主キー
- `article_id`: 記事ID（外部キー）
- `ip_address`: 閲覧者のIPアドレス
- `user_agent`: ユーザーエージェント
- `created_at`: 閲覧日時

**インデックス:**
- `news_article_views_article_id_idx`: 記事IDでの検索最適化
- `news_article_views_created_at_idx`: 閲覧日時での検索最適化
- `news_article_views_ip_address_idx`: IPアドレスでの検索最適化

## データベースビュー

### 1. 記事閲覧数統計ビュー (`article_view_stats`)

```sql
CREATE OR REPLACE VIEW article_view_stats AS
SELECT 
    a.id,
    a.title,
    a.published_at,
    a.status,
    COALESCE(v.view_count, 0) as view_count,
    COALESCE(v.unique_viewers, 0) as unique_viewers,
    v.latest_view
FROM news_articles a
LEFT JOIN (
    SELECT 
        article_id,
        COUNT(*) as view_count,
        COUNT(DISTINCT ip_address) as unique_viewers,
        MAX(created_at) as latest_view
    FROM news_article_views
    GROUP BY article_id
) v ON a.id = v.article_id
WHERE a.status = 'published'
ORDER BY v.view_count DESC NULLS LAST;
```

**用途:** 記事ごとの閲覧数、ユニーク閲覧者数、最新閲覧時刻を統計表示

### 2. 日別閲覧数統計ビュー (`daily_article_views`)

```sql
CREATE OR REPLACE VIEW daily_article_views AS
SELECT 
    DATE(created_at) as view_date,
    article_id,
    COUNT(*) as daily_views,
    COUNT(DISTINCT ip_address) as unique_daily_viewers
FROM news_article_views
GROUP BY DATE(created_at), article_id
ORDER BY view_date DESC, daily_views DESC;
```

**用途:** 日別の記事閲覧数とユニーク閲覧者数を統計表示

## セキュリティ設定

### Row Level Security (RLS)
すべてのテーブルでRLSが有効化されており、適切な権限管理が行われています。

**無料相談申込テーブル:**
- 誰でも新規作成可能
- 管理者のみ閲覧・更新可能

**お問い合わせテーブル:**
- 誰でも新規作成可能
- 管理者のみ閲覧・更新可能

**管理者テーブル:**
- 管理者のみ全操作可能

**ニュース記事テーブル:**
- 公開記事は誰でも閲覧可能
- 管理者のみ作成・更新・削除可能

**記事閲覧数テーブル:**
- 誰でも閲覧記録の挿入可能
- 管理者のみ閲覧数データの参照可能

## 便利な関数

### 1. 記事閲覧数取得関数

```sql
-- 記事の総閲覧数を取得
SELECT get_article_view_count('記事のUUID');

-- 記事のユニーク閲覧者数を取得
SELECT get_article_unique_viewers('記事のUUID');

-- 期間別の閲覧統計を取得
SELECT * FROM get_article_views_by_period('記事のUUID', '2024-01-01', '2024-01-31');
```

### 2. 分析サマリー関数

```sql
-- 全体の統計情報を取得
SELECT get_analytics_summary();
```

返される統計情報:
- 総記事閲覧数
- ユニーク閲覧者数
- 公開記事数
- 最も閲覧された記事
- 今日の閲覧数
- 今週の閲覧数
- 今月の閲覧数

### 3. データクリーンアップ関数

```sql
-- 365日より古い閲覧データを削除
SELECT cleanup_old_article_views(365);
```

## 初期データ

### 管理者アカウント
```sql
INSERT INTO admin_users (email, password_hash, name) VALUES 
('queue@queue-tech.jp', '$2b$10$...', 'Queue株式会社');
```

## 使用例

### 1. 新しい無料相談申込の作成
```javascript
const { data, error } = await supabase
  .from('consultation_requests')
  .insert({
    name: '山田太郎',
    company: '株式会社サンプル',
    email: 'yamada@sample.com',
    phone: '03-1234-5678',
    service: 'ai_development',
    message: 'AI開発についてご相談があります。'
  });
```

### 2. お問い合わせの作成
```javascript
const { data, error } = await supabase
  .from('contact_requests')
  .insert({
    name: '佐藤花子',
    company: '有限会社テスト',
    email: 'sato@test.com',
    phone: '03-9876-5432',
    message: 'サービスについて詳しく知りたいです。'
  });
```

### 3. 公開記事の取得
```javascript
const { data, error } = await supabase
  .from('news_articles')
  .select('*')
  .eq('status', 'published')
  .order('published_at', { ascending: false });
```

### 4. 記事閲覧数の記録
```javascript
const { data, error } = await supabase
  .from('news_article_views')
  .insert({
    article_id: '記事のUUID',
    ip_address: '192.168.1.1',
    user_agent: navigator.userAgent
  });
```

### 5. 閲覧統計の取得
```javascript
const { data, error } = await supabase
  .from('article_view_stats')
  .select('*')
  .order('view_count', { ascending: false });
```

## 管理者機能

### 1. 相談申込管理
- 申込一覧の表示
- ステータスの更新
- 申込内容の確認
- 検索・フィルタリング

### 2. お問い合わせ管理
- 問い合わせ一覧の表示
- ステータスの更新
- 問い合わせ内容の確認
- 検索・フィルタリング

### 3. ニュース記事管理
- 記事の作成・編集・削除
- 記事のステータス管理
- 画像のアップロード
- タグ管理

### 4. 分析機能
- 各記事の閲覧数表示
- 今週・今月のお問い合わせ件数
- 公開記事数の統計
- 閲覧傾向の分析

## バックアップとメンテナンス

### 定期的なバックアップ
- 日次自動バックアップ（Supabase）
- 週次手動バックアップ推奨

### パフォーマンスモニタリング
- クエリ実行時間の監視
- インデックス効率の確認
- 不要データの定期削除

### セキュリティ監査
- 定期的なパスワード変更
- アクセスログの確認
- 権限設定の見直し

## 開発者向け情報

### 環境変数
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 型定義
TypeScript用の型定義は `/src/lib/supabase.ts` で管理されています。

### マイグレーション
新しいテーブルやビューを追加する場合は、適切なマイグレーションファイルを作成してください。

## トラブルシューティング

### よくある問題と解決方法

1. **RLS エラー**
   - 適切な権限が設定されているか確認
   - 管理者認証が正しく行われているか確認

2. **接続エラー**
   - Supabase の接続情報が正しいか確認
   - ネットワーク接続を確認

3. **パフォーマンス問題**
   - インデックスが適切に設定されているか確認
   - 不要なデータの削除を実行

## 更新履歴

- **v1.0.0** (2024-01-01): 初期リリース
- **v1.1.0** (2024-01-15): ニュース記事機能追加
- **v1.2.0** (2024-01-30): 画像アップロード機能追加
- **v1.3.0** (2024-02-01): 分析機能追加（記事閲覧数追跡） 