# Queue-LP (Landing Page)

Queue株式会社のランディングページです。

## 🚀 主な機能

- レスポンシブデザイン
- 無料相談フォーム
- お問い合わせフォーム
- サービス紹介
- 企業情報
- 動的なパーティクル背景
- **管理者ダッシュボード**
  - 各種統計情報の表示
  - 相談・問い合わせ管理
  - ニュース記事管理
  - 検索・フィルター機能
  - レスポンシブデザイン

## 🛠️ 技術スタック

- **Frontend**: React, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase
- **Form**: React Hook Form, Zod
- **State Management**: React Query

## 📋 セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseの設定

#### 2.1 Supabaseプロジェクトの作成
1. [Supabase](https://supabase.com/)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクトのURLとAnon Keyを取得

#### 2.2 環境変数の設定
プロジェクトルートに`.env`ファイルを作成：

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

#### 2.3 データベースの設定

**新規セットアップの場合（推奨）:**
Supabaseのダッシュボードで、SQL Editorを使用して以下のファイルを実行：
- `database_setup.sql` - 全テーブル作成（画像機能含む）

**既存環境に画像機能を追加する場合:**
- `database_migration_add_images.sql` - 画像機能の追加

**手動セットアップする場合:**
Supabaseのダッシュボードで、SQL Editorを使用して以下のテーブルを作成：

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

### 3. 開発サーバーの起動

```bash
npm run dev
```

### 4. ビルド

```bash
npm run build
```

## 📁 プロジェクト構成

```
queue-ai-genesis/
├── src/
│   ├── components/          # UIコンポーネント
│   │   ├── ui/             # shadcn/ui コンポーネント
│   │   ├── ContactSection.tsx
│   │   ├── ConsultationManager.tsx
│   │   ├── ContactManager.tsx
│   │   ├── AdminLogin.tsx
│   │   ├── Navbar.tsx
│   │   └── ...
│   ├── pages/              # ページコンポーネント
│   │   ├── Consultation.tsx
│   │   ├── Contact.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── ...
│   ├── contexts/           # Reactコンテキスト
│   │   └── AdminContext.tsx
│   ├── lib/                # ユーティリティ
│   │   ├── supabase.ts     # Supabaseクライアント
│   │   └── utils.ts
│   ├── hooks/              # カスタムフック
│   └── ...
├── database_structure.md   # データベース構造の詳細
├── public/                 # 静的ファイル
└── ...
```

## 🗄️ データベース構造

詳細なデータベース構造については、[database_structure.md](./database_structure.md)を参照してください。

## 📝 フォーム機能

### 無料相談フォーム (`/consultation`)
- お名前（必須）
- 会社名（必須）
- メールアドレス（必須）
- 電話番号（必須）
- 興味のあるサービス（必須）
- メッセージ（必須）

### お問い合わせフォーム (`/contact`)
- お名前（必須）
- 会社名（必須）
- メールアドレス（必須）
- 電話番号（任意）
- お問い合わせ内容（必須）

## 🔐 管理者ページ

### アクセス方法
管理者ページには以下のURLからアクセスできます：
- **ログインページ**: `/admin/login`
- **ダッシュボード**: `/admin/dashboard`
- **リダイレクト**: `/admin` → 認証状況に応じてログインまたはダッシュボードへ

### 管理者アカウント
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
- **画像アップロード機能**
  - ファイルアップロード（JPEG、PNG、WebP対応、最大5MB）
  - 外部画像URL指定
  - 画像プレビュー機能
- タグ機能
- 出典情報の管理
- 公開日時の設定
- 検索・フィルタリング

#### 5. セキュリティ機能
- セッション管理
- 自動ログアウト
- ローカルストレージでの認証状態保持

### 使用方法

1. `/admin/login`にアクセス
2. 管理者アカウントでログイン
3. ダッシュボードで概要を確認
4. 各タブで詳細管理を実行

**注意**: 本番環境では、管理者認証をより安全な方法（JWT、OAuth等）に変更することを推奨します。

## 🔧 運用・保守

### データベース管理
- Supabaseダッシュボードでデータの確認・管理
- 定期的なバックアップの実行

### セキュリティ
- Row Level Security (RLS) の適切な設定
- 入力値のバリデーション
- XSS対策の実装
- 管理者認証の強化（本番環境）

## 📞 サポート

プロジェクトに関する質問やサポートが必要な場合は、開発チームまでお問い合わせください。
