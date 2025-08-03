# Queue-LP データベーススキーマ

## 概要
Queue-LPプロジェクトのSupabaseデータベースに含まれるテーブル構造の詳細です。

**プロジェクトID**: `vrpdhzbfnwljdsretjld`  
**データベースバージョン**: PostgreSQL 17.4.1.054  
**最終更新**: 2025年2月3日（最新マイグレーション 20250202000001 適用済み）

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
| title | varchar(500) | NO | - | 記事タイトル |
| summary | text | NO | - | 記事概要（HTMLリッチテキスト対応） |
| content | text | NO | - | 記事本文（HTMLリッチテキスト対応） |
| source_name | varchar(255) | NO | - | 情報源名 |
| source_url | varchar(1000) | YES | - | 情報源URL |
| image_url | varchar(1000) | YES | - | 画像URL |
| tags | text[] | YES | '{}' | タグ配列 |
| status | varchar(20) | NO | 'draft' | 公開状況 |
| published_at | timestamptz | YES | - | 公開日時 |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

**制約条件**:
- status: 'draft', 'published', 'archived' のいずれか

**インデックス**:
- idx_news_articles_status: status列
- idx_news_articles_published_at: published_at列
- idx_news_articles_created_at: created_at列
- idx_news_articles_tags: tags列（GINインデックス）

**自動更新トリガー**: updated_atが更新時に自動設定

---

### 4. news_article_views（記事閲覧履歴）
**目的**: ニュース記事の閲覧統計と詳細な閲覧時間を記録

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|---------|---------|-------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー（自動生成） |
| article_id | uuid | NO | - | 記事ID（外部キー） |
| ip_address | text | NO | - | 閲覧者IPアドレス |
| user_agent | text | YES | - | ユーザーエージェント |
| session_id | text | YES | - | ブラウザセッションID |
| view_start_time | timestamptz | YES | now() | 記事閲覧開始時刻 |
| view_end_time | timestamptz | YES | - | 記事閲覧終了時刻 |
| reading_duration_seconds | integer | YES | - | 閲覧時間（秒） |
| scroll_depth_percentage | integer | YES | 0 | スクロール深度（%） |
| is_bounce | boolean | YES | false | 直帰フラグ |
| referrer_url | text | YES | - | 参照元URL |
| exit_url | text | YES | - | 離脱先URL |
| created_at | timestamptz | NO | now() | 閲覧日時 |

**外部キー制約**:
- article_id → news_articles.id

**インデックス**:
- idx_news_article_views_session_id: session_id列
- idx_news_article_views_reading_duration: reading_duration_seconds列  
- idx_news_article_views_view_start_time: view_start_time列
- idx_news_article_views_ip_created_at: (ip_address, created_at)

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

**インデックス**:
- idx_chatbot_conversations_session_id: session_id列
- idx_chatbot_conversations_timestamp: timestamp列
- idx_chatbot_conversations_created_at: created_at列

**RLS（行レベルセキュリティ）**: 有効
- 匿名ユーザー: SELECT, INSERT可能
- 認証ユーザー: 全操作可能

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
- article_id → news_articles.id（削除カスケード）

**インデックス**:
- idx_cta_clicks_article_id: article_id列
- idx_cta_clicks_cta_type: cta_type列
- idx_cta_clicks_clicked_at: clicked_at列
- idx_cta_clicks_consultation_analysis: (cta_type, clicked_at, ip_address) コンバージョン分析用

**RLS（行レベルセキュリティ）**: 有効
- 管理者: 全操作可能
- 一般ユーザー: INSERT可能

---

### 7. todos（Todo管理）
**目的**: 各メンバーのタスク管理とTodo追跡

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|---------|---------|-------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー（自動生成） |
| member_id | uuid | NO | - | メンバーID（外部キー） |
| title | varchar(200) | NO | - | Todoタイトル |
| description | text | YES | - | Todo詳細説明 |
| priority | varchar(10) | NO | 'medium' | 優先度 |
| status | varchar(20) | NO | 'pending' | ステータス |
| due_date | timestamptz | YES | - | 期限日 |
| assigned_by | uuid | YES | - | 割り当て者ID（外部キー） |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

**制約条件**:
- priority: 'low', 'medium', 'high' のいずれか
- status: 'pending', 'in_progress', 'completed', 'cancelled' のいずれか

**外部キー制約**:
- member_id → members.id（削除カスケード）
- assigned_by → members.id

**インデックス**:
- idx_todos_member_id: member_id列
- idx_todos_status: status列
- idx_todos_priority: priority列
- idx_todos_due_date: due_date列
- idx_todos_created_at: created_at列

**自動更新トリガー**: updated_atが更新時に自動設定

**RLS（行レベルセキュリティ）**: 有効
- メンバー: 自分のTodoのみ閲覧・操作可能
- 役員: 全TodoのCRUD操作可能

---

### 8. todo_progress_logs（Todo進捗ログ）
**目的**: Todoのステータス変更履歴を記録

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|---------|---------|-------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー（自動生成） |
| todo_id | uuid | NO | - | TodoID（外部キー） |
| previous_status | varchar(20) | YES | - | 変更前ステータス |
| new_status | varchar(20) | NO | - | 変更後ステータス |
| comment | text | YES | - | 変更コメント |
| changed_by | uuid | NO | - | 変更者ID（外部キー） |
| created_at | timestamptz | NO | now() | 変更日時 |

**外部キー制約**:
- todo_id → todos.id（削除カスケード）
- changed_by → members.id

**インデックス**:
- idx_todo_progress_logs_todo_id: todo_id列
- idx_todo_progress_logs_created_at: created_at列

**RLS（行レベルセキュリティ）**: 有効
- メンバー: 自分のTodo進捗ログのみ閲覧・作成可能
- 役員: 全Todo進捗ログの閲覧・作成可能

---

## ビューとファンクション

### 1. cta_click_stats（CTAクリック統計ビュー）
**目的**: 記事別のCTAクリック統計を提供

**取得データ**:
- article_id: 記事ID
- article_title: 記事タイトル
- published_at: 公開日時
- total_clicks: 総クリック数
- unique_clicks: ユニーククリック数
- consultation_clicks: 相談CTAクリック数
- total_views: 総閲覧数
- click_rate_percentage: クリック率（%）

### 2. daily_conversion_stats（日別コンバージョン統計ビュー）
**目的**: CTAクリックから相談申し込みまでの日別統計

**取得データ**:
- date: 日付
- cta_clicks: CTAクリック数
- consultation_requests: 相談申し込み数
- conversion_rate: コンバージョン率

### 3. ip_based_conversion_tracking（IPベースコンバージョン追跡ビュー）
**目的**: 同一IPでのCTAクリック→相談申し込みの流れを分析

### 4. monthly_conversion_summary（月別コンバージョンサマリービュー）
**目的**: 月次のコンバージョン統計を提供

### 5. analyze_cta_conversions()（コンバージョン分析ファンクション）
**目的**: CTAコンバージョン分析データを取得
**戻り値**: 期間別のCTAクリック数、相談申し込み数、コンバージョン率、平均コンバージョン時間

### 6. get_conversion_insights()（コンバージョンインサイトファンクション）
**目的**: コンバージョンパフォーマンスの主要指標を取得
**戻り値**: 各種コンバージョン指標と説明

### 7. reading_time_stats（閲覧時間統計ビュー）
**目的**: 記事別の詳細な閲覧時間統計を提供

**取得データ**:
- article_id: 記事ID
- article_title: 記事タイトル
- published_at: 公開日時
- total_views: 総閲覧数
- unique_visitors: ユニーク訪問者数
- avg_reading_time_seconds: 平均閲覧時間（秒）
- avg_reading_time_minutes: 平均閲覧時間（分）
- max_reading_time_seconds: 最長閲覧時間（秒）
- min_reading_time_seconds: 最短閲覧時間（秒）
- avg_scroll_depth_percentage: 平均スクロール深度（%）
- bounce_count: 直帰数
- bounce_rate_percentage: 直帰率（%）
- views_0_30_seconds: 0-30秒閲覧数
- views_31_60_seconds: 31-60秒閲覧数
- views_1_3_minutes: 1-3分閲覧数
- views_3_5_minutes: 3-5分閲覧数
- views_over_5_minutes: 5分超閲覧数

### 8. daily_reading_stats（日別閲覧時間統計ビュー）
**目的**: 日別の閲覧時間パフォーマンス統計

**取得データ**:
- date: 日付
- total_views: 総閲覧数
- unique_visitors: ユニーク訪問者数
- avg_reading_time_seconds: 平均閲覧時間（秒）
- avg_reading_time_minutes: 平均閲覧時間（分）
- avg_scroll_depth_percentage: 平均スクロール深度（%）
- bounce_rate_percentage: 直帰率（%）

### 9. user_reading_history（ユーザー別閲覧履歴ビュー）
**目的**: IPアドレスベースのユーザー行動分析

**取得データ**:
- ip_address: IPアドレス
- user_agent: ユーザーエージェント
- articles_read: 読んだ記事数
- total_page_views: 総ページビュー数
- avg_reading_time_seconds: 平均閲覧時間
- total_reading_time_seconds: 総閲覧時間
- avg_scroll_depth_percentage: 平均スクロール深度
- first_visit: 初回訪問日時
- last_visit: 最終訪問日時
- bounce_count: 直帰回数
- bounce_rate_percentage: 直帰率

### 10. detailed_reading_sessions（詳細閲覧セッションビュー）
**目的**: 個別の閲覧セッション詳細情報

**取得データ**:
- session_id: セッションID
- article_id: 記事ID
- article_title: 記事タイトル
- ip_address: IPアドレス
- view_start_time: 閲覧開始時刻
- view_end_time: 閲覧終了時刻
- reading_duration_seconds: 閲覧時間（秒）
- reading_category: 閲覧カテゴリ（短時間/通常/中程度/長時間/詳細）
- scroll_depth_percentage: スクロール深度
- is_bounce: 直帰フラグ
- referrer_url: 参照元URL
- exit_url: 離脱先URL

### 11. get_reading_insights()（閲覧時間分析ファンクション）
**目的**: 閲覧時間の詳細インサイトを取得
**パラメータ**: article_id（特定記事分析用、オプション）、days_back（分析期間、デフォルト30日）
**戻り値**: 総閲覧数、ユニーク訪問者数、平均閲覧時間、最長閲覧時間、スクロール深度、直帰率、エンゲージメント率

### 12. todo_management_view（Todo管理ビュー）
**目的**: Todoとメンバー情報を統合した包括的なビュー

**取得データ**:
- id, title, description, priority, status, due_date
- created_at, updated_at
- member_id, member_name, member_email, member_role
- member_department, member_position
- assigned_by_id, assigned_by_name, assigned_by_email
- is_overdue, is_due_soon, days_until_due
- completion_hours（完了時間）

### 13. member_todo_stats（メンバー別Todo統計ビュー）
**目的**: 各メンバーのTodo進捗状況統計

**取得データ**:
- member_id, member_name, member_email, member_role, member_department
- total_todos, pending_todos, in_progress_todos, completed_todos, cancelled_todos
- high_priority_pending, medium_priority_pending, low_priority_pending
- overdue_todos, due_soon_todos
- completion_rate_percentage, avg_completion_hours
- last_todo_activity, todos_this_month, completed_this_month

### 14. daily_todo_progress（日別Todo進捗ビュー）
**目的**: 日次のTodo作成・完了統計

**取得データ**:
- date: 日付
- todos_created: 作成されたTodo数
- todos_completed: 完了したTodo数
- high_priority_todos: 高優先度Todo数
- overdue_todos: 期限切れTodo数

### 15. get_todo_insights()（Todo分析ファンクション）
**目的**: 役員向けの総合的なTodo分析データを取得
**パラメータ**: start_date（開始日、デフォルト30日前）、end_date（終了日、デフォルト今日）
**戻り値**: 
- total_todos: 総Todo数
- completed_todos: 完了Todo数
- overdue_todos: 期限切れTodo数
- high_priority_pending: 高優先度未完了数
- completion_rate: 完了率
- avg_completion_time_hours: 平均完了時間
- most_productive_member: 最も生産的なメンバー
- department_with_most_overdue: 最も遅れが目立つ部署

---

## テーブル関係図

```
news_articles (1) ----< (many) news_article_views
    ↑                              ↓
   id                        article_id
    
news_articles (1) ----< (many) cta_clicks
    ↑                              ↓
   id                        article_id

cta_clicks ----< conversion tracking >---- consultation_requests
    ↑                                            ↑
ip_address                                   (IP correlation)

members (1) ----< (many) todos
    ↑                     ↓
   id               member_id

todos (1) ----< (many) todo_progress_logs
    ↑                        ↓
   id                    todo_id

members (1) ----< (many) todo_progress_logs
    ↑                              ↓
   id                       changed_by

members (1) ----< (many) todos (assigned_by)
    ↑                        ↓
   id                 assigned_by
```

---

## セキュリティ設定

### RLS有効テーブル
- **news_article_views**: 閲覧履歴の保護
- **chatbot_conversations**: 会話履歴の保護（匿名ユーザー制限付きアクセス）
- **cta_clicks**: CTAクリック履歴の保護
- **todos**: Todo管理の保護（メンバーは自分のTodoのみ、役員は全Todo）
- **todo_progress_logs**: Todo進捗ログの保護（対応するTodoへのアクセス権に基づく）

### RLS無効テーブル
- **consultation_requests**: 管理者による直接管理
- **contact_requests**: 管理者による直接管理
- **news_articles**: 公開記事は全ユーザー閲覧可能

### ストレージポリシー
- **public バケット**: 画像アップロード・読み取り・削除可能
- **news-images フォルダ**: 記事用画像専用

---

## マイグレーション履歴

| バージョン | ファイル名 | 内容 |
|-----------|----------|------|
| 20240101000006 | create_chatbot_conversations.sql | チャットボット会話テーブル作成 |
| 20240101000007 | update_chatbot_conversations.sql | チャットボット会話テーブル構造更新 |
| 20240101000008 | fix_chatbot_rls.sql | チャットボットRLSポリシー修正 |
| 20240101000009 | create_cta_clicks.sql | CTAクリック追跡テーブル・ビュー作成 |
| 20240101000010 | create_conversion_analysis.sql | コンバージョン分析ビュー・ファンクション作成 |
| 20240131000001 | fix_cta_click_stats_view.sql | CTAクリック統計ビューの修正 |
| 20250201000001 | add_reading_time_tracking.sql | 閲覧時間トラッキング機能追加（完全実装） |
| 20250202000001 | create_todo_management.sql | Todo管理システム完全実装（テーブル・ビュー・ファンクション・RLS） |

---

## 機能・用途

### 1. ニュース・ブログ管理
- **リッチテキストエディター**: 概要・本文でHTMLリッチテキスト対応
- **画像管理**: アップロード・URL指定両対応
- **タグシステム**: 配列型による柔軟なタグ管理
- **公開制御**: ドラフト・公開・アーカイブ状態管理

### 2. 高度なアナリティクス・追跡
- **閲覧統計**: 記事別閲覧数追跡
- **詳細閲覧時間分析**: セッション別・ユーザー別の精密な閲覧時間トラッキング
- **行動分析**: スクロール深度・直帰率・エンゲージメント分析
- **セッション追跡**: 個別ユーザーの閲覧セッション詳細記録
- **CTAトラッキング**: クリック率・コンバージョン率分析
- **コンバージョン分析**: CTAクリック→相談申し込みの流れ追跡
- **日次・月次レポート**: 自動集計ビューで統計データ提供
- **リアルタイム分析**: 閲覧開始から終了まで完全トラッキング

### 3. 顧客管理
- **相談申し込み**: サービス別相談管理
- **お問い合わせ**: 一般問い合わせ管理
- **チャットボット**: AI会話履歴保存・分析

### 4. Todo管理システム
- **個人Todo管理**: メンバー個別のタスク作成・管理・追跡
- **役員進捗管理**: 全メンバーのTodo状況確認・分析
- **優先度管理**: 高・中・低の3段階優先度設定
- **期限管理**: 期限切れ・期限間近アラート機能
- **進捗追跡**: ステータス変更履歴の詳細記録
- **統計分析**: 完了率・平均作業時間・部署別分析
- **アクセス制御**: メンバーは自分のTodoのみ、役員は全体管理

### 5. セキュリティ・パフォーマンス
- **行レベルセキュリティ**: テーブル別アクセス制御
- **インデックス最適化**: 検索・集計性能向上
- **カスケード削除**: データ整合性保証

---

## 注意事項

1. **タイムスタンプ**: 全テーブルで `created_at` と `updated_at` を自動管理
2. **UUID**: 主キーは全て UUID 形式で自動生成
3. **ステータス管理**: 問い合わせ系テーブルは共通のステータス値を使用
4. **国際化対応**: 全テーブルで `timestamptz` を使用し、タイムゾーンに対応
5. **リッチテキスト**: `summary`と`content`カラムでHTMLコンテンツ対応
6. **CTAトラッキング**: 詳細なコンバージョン分析機能を提供
7. **パフォーマンス**: 専用インデックスによる高速データ検索・集計
8. **閲覧時間トラッキング**: セッション管理による精密な時間測定とユーザー行動分析
9. **Todo管理**: メンバー別アクセス制御とリアルタイム進捗追跡機能
10. **進捗ログ**: 全てのTodoステータス変更を詳細記録し、監査証跡を提供

---

*最終更新: 2025年2月3日（Todo管理システム完全実装・閲覧時間トラッキング機能・管理画面統合完了）* 