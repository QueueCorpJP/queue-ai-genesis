# Queue-LP データベーススキーマ

## 概要
Queue-LPプロジェクトのSupabaseデータベースに含まれるテーブル構造の詳細です。

**プロジェクトID**: `vrpdhzbfnwljdsretjld`  
**データベースバージョン**: PostgreSQL 17.4.1.054  
**最終更新**: 2025年1月（MCPを使用して実データベースから取得）

## テーブル一覧

### 1. consultation_requests（相談依頼）
**目的**: お客様からの相談・問い合わせ依頼を管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|---------|---------|-------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー（自動生成） |
| name | text | NO | - | 依頼者名 |
| company | text | NO | - | 会社名 |
| email | text | NO | - | メールアドレス |
| phone | text | NO | - | 電話番号 |
| service | text | NO | - | サービス種別 |
| message | text | NO | - | 相談内容 |
| status | text | NO | 'pending' | 処理状況 |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

**制約条件**:
- service: 'ai_development', 'prompt_engineering', 'prototype', 'other' のいずれか
- status: 'pending', 'in_progress', 'completed', 'cancelled' のいずれか

---

### 2. contact_requests（お問い合わせ）
**目的**: 一般的なお問い合わせを管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|---------|---------|-------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー（自動生成） |
| name | text | NO | - | 問い合わせ者名 |
| company | text | NO | - | 会社名 |
| email | text | NO | - | メールアドレス |
| phone | text | YES | - | 電話番号（任意） |
| message | text | NO | - | 問い合わせ内容 |
| status | text | NO | 'pending' | 処理状況 |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

**制約条件**:
- status: 'pending', 'in_progress', 'completed', 'cancelled' のいずれか

---

### 3. news_articles（ニュース記事）
**目的**: ニュース記事やブログ投稿を管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|---------|---------|-------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー（自動生成） |
| title | text | NO | - | 記事タイトル |
| summary | text | NO | - | 記事概要 |
| content | text | NO | - | 記事本文 |
| source_name | text | YES | - | 情報源名（任意）※ |
| source_url | text | YES | - | 情報源URL |
| image_url | text | YES | - | 画像URL |
| tags | text[] | YES | ARRAY[]::text[] | タグ配列 |
| status | text | NO | 'draft' | 公開状況 |
| published_at | timestamptz | YES | - | 公開日時 |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

**制約条件**:
- status: 'draft', 'published', 'archived' のいずれか

**注釈**:
- ※ source_name: "Source name (optional) - can be null if no specific source" とコメント追記済み

---

### 4. news_article_views（記事閲覧履歴）
**目的**: ニュース記事の閲覧統計を記録

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|---------|---------|-------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー（自動生成） |
| article_id | uuid | NO | - | 記事ID（外部キー） |
| ip_address | text | NO | - | 閲覧者IPアドレス |
| user_agent | text | YES | - | ユーザーエージェント |
| created_at | timestamptz | NO | now() | 閲覧日時 |

**外部キー制約**:
- article_id → news_articles.id

**RLS（行レベルセキュリティ）**: 有効

---

### 5. chatbot_conversations（チャットボット会話）
**目的**: チャットボットとの会話履歴を保存

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|---------|---------|-------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー（自動生成） |
| session_id | text | NO | - | セッションID |
| user_message | text | NO | - | ユーザーメッセージ |
| bot_response | text | NO | - | ボットの返答 |
| timestamp | timestamptz | YES | now() | 会話日時 |
| user_ip | text | YES | - | ユーザーIPアドレス |
| user_agent | text | YES | - | ユーザーエージェント |
| created_at | timestamptz | YES | now() | 作成日時 |
| updated_at | timestamptz | YES | now() | 更新日時 |

**RLS（行レベルセキュリティ）**: 有効

---

## テーブル関係図

```
news_articles (1) ----< (many) news_article_views
    ↑                              ↓
   id                        article_id
    
news_articles (1) ----< (many) cta_clicks
    ↑                              ↓
   id                        article_id
```

---

### 6. cta_clicks（CTAクリック履歴）
**目的**: 記事内のCTAボタンのクリックを追跡

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|---------|---------|-------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー（自動生成） |
| article_id | uuid | NO | - | 記事ID（外部キー） |
| cta_type | text | NO | 'consultation' | CTAタイプ |
| ip_address | text | NO | - | クリックしたユーザーのIPアドレス |
| user_agent | text | YES | - | ユーザーエージェント情報 |
| referrer_url | text | YES | - | リファラーURL |
| clicked_at | timestamptz | NO | now() | CTAクリック日時 |
| created_at | timestamptz | NO | now() | 作成日時 |

**制約条件**:
- cta_type: 'consultation', 'contact', 'other' のいずれか（デフォルト: 'consultation'）

**外部キー制約**:
- article_id → news_articles.id

**RLS（行レベルセキュリティ）**: 有効

---

## 統計情報

| テーブル名 | サイズ | 推定行数 |
|-----------|--------|----------|
| consultation_requests | 32 kB | 6行 |
| contact_requests | 48 kB | 8行 |
| news_articles | 32 kB | 0行（削除済み4行） |
| news_article_views | 80 kB | 0行（削除済み33行） |
| chatbot_conversations | 136 kB | 39行 |
| cta_clicks | 80 kB | 0行（削除済み2行） |

## セキュリティ設定

- **RLS有効テーブル**: `news_article_views`, `chatbot_conversations`, `cta_clicks`
- **RLS無効テーブル**: `consultation_requests`, `contact_requests`, `news_articles`

## マイグレーション履歴

| バージョン | 名前 | 内容 |
|-----------|------|------|
| 20250726080725 | make_source_name_optional | news_articles.source_nameをオプショナルに変更 |

## 注意事項

1. **タイムスタンプ**: 全テーブルで `created_at` と `updated_at` を自動管理
2. **UUID**: 主キーは全て UUID 形式で自動生成
3. **ステータス管理**: 問い合わせ系テーブルは共通のステータス値を使用
4. **国際化対応**: 全テーブルで `timestamptz` を使用し、タイムゾーンに対応
5. **CTAトラッキング**: `cta_clicks`テーブルで記事内CTAクリック率を詳細分析
6. **統計ビュー**: `cta_click_stats`ビューで記事別クリック率統計を提供

---

*最終更新: 2025年1月31日（Supabase MCPで実データベースから取得・更新）* 