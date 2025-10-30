# Queue株式会社 ランディングページ

Queue株式会社のランディングページプロジェクトです。AI開発・AIエージェント開発・DXを専門とする開発パートナーとしてのサービスを紹介するWebサイトです。

## 目次

- [主な機能](#主な機能)
- [技術スタック](#技術スタック)
- [セットアップ手順](#セットアップ手順)
- [プロジェクト構成](#プロジェクト構成)
- [データベース構造](#データベース構造)
- [フォーム機能](#フォーム機能)
- [管理者ページ](#管理者ページ)
- [運用・保守](#運用保守)
- [サポート](#サポート)

## 主な機能

### フロントエンド機能

- レスポンシブデザイン対応
- 無料相談フォーム
- お問い合わせフォーム
- サービス紹介セクション
- 企業情報ページ
- 動的なパーティクル背景エフェクト
- SEO最適化対応

### 管理者ダッシュボード

- 各種統計情報の表示
- 相談・問い合わせ管理
- ニュース記事管理（画像アップロード対応）
- 検索・フィルター機能
- レスポンシブデザイン対応
- リアルタイムデータ更新

## 技術スタック

### フロントエンド

- **フレームワーク**: React 18+
- **言語**: TypeScript
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: shadcn/ui
- **フォーム管理**: React Hook Form + Zod
- **状態管理**: React Query (TanStack Query)

### バックエンド・インフラ

- **BaaS**: Supabase
- **データベース**: PostgreSQL (Supabase)
- **認証**: Supabase Auth
- **ストレージ**: Supabase Storage

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/QueueCorpJP/queue-ai-genesis.git
cd queue-ai-genesis
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Supabaseの設定

#### 3.1 Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクトのURLとAnon Keyを取得

#### 3.2 環境変数の設定

プロジェクトルートに`.env`ファイルを作成し、以下の環境変数を設定：

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  # 管理者機能用（オプション）
```

#### 3.3 データベースの設定

**推奨: マイグレーションファイルを使用**

Supabaseのダッシュボードで、SQL Editorを使用して`supabase/migrations/`ディレクトリ内のマイグレーションファイルを順番に実行してください。

**手動セットアップの場合**

以下のSQLをSupabaseのSQL Editorで実行：

```sql
-- 無料相談フォーム用テーブル
CREATE TABLE consultation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    service VARCHAR(50) NOT NULL CHECK (service IN ('ai_development', 'prompt_engineering', 'prototype', 'other')),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- お問い合わせ用テーブル
CREATE TABLE contact_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_consultation_requests_email ON consultation_requests(email);
CREATE INDEX idx_consultation_requests_status ON consultation_requests(status);
CREATE INDEX idx_consultation_requests_created_at ON consultation_requests(created_at);
CREATE INDEX idx_contact_requests_email ON contact_requests(email);
CREATE INDEX idx_contact_requests_status ON contact_requests(status);
CREATE INDEX idx_contact_requests_created_at ON contact_requests(created_at);

-- 更新日時自動更新のトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの追加
CREATE TRIGGER update_consultation_requests_updated_at
    BEFORE UPDATE ON consultation_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_requests_updated_at
    BEFORE UPDATE ON contact_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで`http://localhost:5173`にアクセスして確認できます。

### 5. ビルド

本番環境用のビルド：

```bash
npm run build
```

ビルドされたファイルは`dist/`ディレクトリに出力されます。

## プロジェクト構成

```
queue-ai-genesis/
├── src/
│   ├── components/          # UIコンポーネント
│   │   ├── ui/             # shadcn/ui コンポーネント
│   │   ├── ContactSection.tsx
│   │   ├── ConsultationManager.tsx
│   │   ├── ContactManager.tsx
│   │   ├── AdminLogin.tsx
│   │   ├── HeroSection.tsx
│   │   ├── Navbar.tsx
│   │   └── ...
│   ├── pages/              # ページコンポーネント
│   │   ├── Index.tsx       # メインページ
│   │   ├── Consultation.tsx
│   │   ├── Contact.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── CaseStudies.tsx
│   │   └── ...
│   ├── contexts/           # Reactコンテキスト
│   │   └── AdminContext.tsx
│   ├── lib/                # ユーティリティ
│   │   ├── supabase.ts     # Supabaseクライアント
│   │   └── utils.ts
│   ├── hooks/              # カスタムフック
│   ├── api/                # API関連
│   └── utils/              # ユーティリティ関数
├── public/                 # 静的ファイル
│   ├── favicon.ico
│   ├── sitemap.xml
│   └── ...
├── supabase/
│   └── migrations/         # データベースマイグレーション
├── .env                    # 環境変数（.gitignoreに含まれる）
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vite.config.ts
```

## データベース構造

詳細なデータベース構造については、[Queue-LP-Database-Schema.md](./Queue-LP-Database-Schema.md)を参照してください。

主なテーブル：

- `consultation_requests` - 無料相談フォームデータ
- `contact_requests` - お問い合わせフォームデータ
- `news_articles` - ニュース記事データ
- `members` - メンバー情報（管理者用）
- `todos` - タスク管理（管理者用）
- `company_schedules` - スケジュール管理（管理者用）

## フォーム機能

### 無料相談フォーム (`/consultation`)

**必須項目：**

- お名前
- 会社名
- メールアドレス
- 電話番号
- 興味のあるサービス（選択式）
  - AI開発
  - プロンプトエンジニアリング
  - プロトタイプ制作
  - その他
- メッセージ

### お問い合わせフォーム (`/contact`)

**必須項目：**

- お名前
- 会社名
- メールアドレス
- 電話番号（任意）
- お問い合わせ内容

## 管理者ページ

### アクセス方法

管理者ページには以下のURLからアクセスできます：

- **ログインページ**: `/admin/login`
- **ダッシュボード**: `/admin/dashboard`
- **リダイレクト**: `/admin` → 認証状況に応じてログインまたはダッシュボードへ

### 管理者アカウント情報

**本番環境では必ず変更してください**

```
メールアドレス: queue@queue-tech.jp
パスワード: Taichi00610
```

### 主な機能

#### 1. ダッシュボード概要

- 今日の新規お問い合わせ数
- 今日の新規相談申込数
- 未対応件数
- 今月の総件数
- 最新のアクティビティ表示

#### 2. 無料相談管理

- 相談申込の一覧表示
- 詳細情報の確認
- ステータス管理（未対応/対応中/完了/キャンセル）
- サービス別フィルタリング
- 検索機能

#### 3. お問い合わせ管理

- 問い合わせの一覧表示
- 詳細情報の確認
- ステータス管理
- 直接メール・電話連絡機能
- 検索・フィルタリング

#### 4. ニュース記事管理

- ニュース記事の投稿・編集・削除
- 記事ステータス管理（下書き/公開/アーカイブ）
- 画像アップロード機能
  - ファイルアップロード（JPEG、PNG、WebP対応、最大5MB）
  - 外部画像URL指定
  - 画像プレビュー機能
- タグ機能
- 出典情報の管理
- 公開日時の設定
- 検索・フィルタリング
- 自動サイトマップ生成

#### 5. セキュリティ機能

- セッション管理
- 自動ログアウト
- ローカルストレージでの認証状態保持

### 使用方法

1. `/admin/login`にアクセス
2. 管理者アカウントでログイン
3. ダッシュボードで概要を確認
4. 各タブで詳細管理を実行

**注意**: 本番環境では、管理者認証をより安全な方法（JWT、OAuth等）に変更することを強く推奨します。

## 運用・保守

### データベース管理

- Supabaseダッシュボードでデータの確認・管理
- 定期的なバックアップの実行
- マイグレーションファイルの管理

### セキュリティ

- Row Level Security (RLS) の適切な設定
- 入力値のバリデーション
- XSS対策の実装
- CSRF対策の実装
- 管理者認証の強化（本番環境）

### パフォーマンス

- 画像の最適化
- コード分割によるバンドルサイズの最適化
- CDNの活用
- キャッシュ戦略の最適化

### 監視・ログ

- エラートラッキング（Sentry推奨）
- パフォーマンスモニタリング
- アクセスログの確認

## サポート

プロジェクトに関する質問やサポートが必要な場合は、開発チームまでお問い合わせください。

- **メール**: queue@queue-tech.jp
- **Webサイト**: https://queue-tech.jp

---

**Queue株式会社** - AI・AIエージェント・DXの開発パートナー
