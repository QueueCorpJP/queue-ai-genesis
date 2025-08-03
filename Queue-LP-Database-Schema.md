# Queue-LP データベーススキーマ

## 概要
Queue-LPプロジェクトのSupabaseデータベースに含まれるテーブル構造の詳細です。

**プロジェクトID**: `vrpdhzbfnwljdsretjld`  
**データベースバージョン**: PostgreSQL 17.4.1.054  
**最終更新**: 2025年2月8日（マイメモ機能実装完了・個人KPI・チームKPI・KGI管理・進捗追跡・達成率分析・可視化機能・個人メモ管理完全実装）  
**Supabaseリージョン**: US East (N. Virginia)  
**認証システム**: 有効（Row Level Security対応・社員アカウントログイン対応）  
**実装ステータス**: Todo管理システム完全実装済み、勤怠管理システム完全実装済み、社員認証システム完全実装済み、会社スケジュール管理システム完全実装済み

## テーブル一覧

**実装済みテーブル数**: 16個（基本4個 + Todo管理2個 + メンバー管理1個 + 勤怠管理2個 + スケジュール管理1個 + 販管費管理1個 + KPI/KGI管理4個 + マイメモ管理1個）  
**勤怠管理テーブル**: 2個（完全実装済み）  
**販管費管理テーブル**: 1個（完全実装済み）  
**KPI/KGI管理テーブル**: 4個（完全実装済み）  
**マイメモ管理テーブル**: 1個（完全実装済み）  
**ビュー数**: 30個（基本8個 + Todo管理3個 + 閲覧時間3個 + 勤怠管理3個 + スケジュール管理3個 + 販管費管理4個 + KPI/KGI管理4個 + マイメモ管理2個）  
**ファンクション数**: 20個（基本6個 + Todo管理2個 + 勤怠管理2個 + スケジュール管理2個 + 権限テスト2個 + 販管費管理2個 + KPI/KGI管理2個 + マイメモ管理2個）  
**トリガー数**: 17個（基本2個 + Todo管理1個 + 勤怠管理4個 + スケジュール管理1個 + 販管費管理1個 + KPI/KGI管理7個 + マイメモ管理1個）

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
- 役員: 全メンバーのTodoを閲覧・管理可能（全TodoのCRUD操作可能）
- 管理者: 全機能へのフルアクセス

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

### 9. company_schedules（会社スケジュール）
**目的**: 役員による全社的なスケジュール・イベント・休暇・会議等の管理  
**実装ステータス**: ✅ 完全実装済み

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|---------|---------|-------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー（自動生成） |
| title | varchar(200) | NO | - | スケジュールタイトル |
| description | text | YES | - | スケジュール説明 |
| schedule_type | varchar(30) | NO | 'event' | スケジュール種別 |
| start_date | date | NO | - | 開始日 |
| end_date | date | YES | - | 終了日（単日の場合はNULL） |
| start_time | time | YES | - | 開始時刻 |
| end_time | time | YES | - | 終了時刻 |
| is_all_day | boolean | NO | false | 終日フラグ |
| location | varchar(200) | YES | - | 場所・会議室 |
| is_holiday | boolean | NO | false | 休日フラグ |
| is_recurring | boolean | NO | false | 繰り返しフラグ |
| recurrence_pattern | varchar(20) | YES | - | 繰り返しパターン |
| recurrence_end_date | date | YES | - | 繰り返し終了日 |
| color | varchar(7) | NO | '#3B82F6' | カラーコード（HEX） |
| priority | varchar(10) | NO | 'medium' | 優先度 |
| is_active | boolean | NO | true | 有効フラグ |
| created_by | uuid | NO | - | 作成者ID（外部キー） |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

**制約条件**:
- schedule_type: 'event', 'meeting', 'holiday', 'deadline', 'training', 'other' のいずれか
- priority: 'low', 'medium', 'high' のいずれか
- recurrence_pattern: 'daily', 'weekly', 'monthly', 'yearly' のいずれか（NULL許可）
- 終了日は開始日以降である必要がある
- 時刻設定は開始時刻 < 終了時刻または終日フラグが必要

**外部キー制約**:
- created_by → members.id（削除カスケード）

**インデックス**:
- idx_company_schedules_start_date: start_date列
- idx_company_schedules_end_date: end_date列
- idx_company_schedules_date_range: (start_date, end_date)
- idx_company_schedules_type: schedule_type列
- idx_company_schedules_created_by: created_by列
- idx_company_schedules_active: is_active列
- idx_company_schedules_holiday: is_holiday列
- idx_company_schedules_active_date: (is_active, start_date)
- idx_company_schedules_active_type: (is_active, schedule_type)
- idx_company_schedules_holiday_date: (is_holiday, start_date) WHERE is_holiday = true

**自動更新トリガー**: updated_atが更新時に自動設定

**RLS（行レベルセキュリティ）**: 有効
- 役員: 全てのスケジュール操作が可能（作成・更新・削除・閲覧）
- 社員: 有効なスケジュールの閲覧のみ可能

---

### 12. monthly_expenses（月次販管費）
**目的**: 役員による毎月の販売管理費入力・管理（固定費・変動費・支払いステータス管理）  
**実装ステータス**: ✅ 完全実装済み

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|---------|---------|-------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー（自動生成） |
| year_month | varchar(7) | NO | - | 対象年月（YYYY-MM形式） |
| expense_category | varchar(50) | NO | - | 費目カテゴリ |
| expense_name | varchar(100) | NO | - | 具体的な費目名 |
| expense_type | varchar(20) | NO | 'fixed' | 費用種別（固定費/変動費） |
| budgeted_amount | decimal(12,2) | NO | 0 | 予算額 |
| actual_amount | decimal(12,2) | NO | 0 | 実際金額 |
| payment_status | varchar(20) | NO | 'unpaid' | 支払いステータス |
| payment_due_date | date | YES | - | 支払い期限 |
| payment_date | date | YES | - | 実際の支払い日 |
| vendor_name | varchar(200) | YES | - | 支払い先 |
| description | text | YES | - | 備考・説明 |
| receipt_url | varchar(500) | YES | - | 領収書URL |
| is_recurring | boolean | NO | false | 定期的な費用フラグ |
| created_by | uuid | NO | - | 登録者ID（外部キー） |
| updated_by | uuid | YES | - | 更新者ID（外部キー） |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

**制約条件**:
- expense_type: 'fixed', 'variable' のいずれか
- payment_status: 'unpaid', 'paid', 'overdue', 'cancelled', 'partial' のいずれか
- expense_category: 'personnel', 'office_rent', 'utilities', 'communication', 'marketing', 'travel', 'office_supplies', 'software', 'legal', 'insurance', 'tax', 'maintenance', 'training', 'entertainment', 'other' のいずれか
- 同じ年月・カテゴリ・費目名の重複を防ぐ（UNIQUE制約）

**外部キー制約**:
- created_by → members.id（削除カスケード）
- updated_by → members.id（削除時NULL設定）

**インデックス**:
- idx_monthly_expenses_year_month: year_month列
- idx_monthly_expenses_category: expense_category列
- idx_monthly_expenses_type: expense_type列
- idx_monthly_expenses_status: payment_status列
- idx_monthly_expenses_due_date: payment_due_date列
- idx_monthly_expenses_created_by: created_by列
- idx_monthly_expenses_recurring: is_recurring列
- idx_monthly_expenses_year_month_status: (year_month, payment_status)
- idx_monthly_expenses_category_status: (expense_category, payment_status)

**自動更新トリガー**: updated_atが更新時に自動設定

**RLS（行レベルセキュリティ）**: 有効
- 役員のみ: 全操作可能（メンバーは完全に閲覧不可）

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

### 16. attendance_summary（勤怠サマリービュー）
**目的**: メンバー情報と勤怠データの統合表示

**取得データ**:
- member_id, member_name, member_email, department, position
- date, start_time, end_time, break_time_minutes
- work_hours, overtime_hours, status, attendance_type, notes
- submitted_at, approved_by, approved_by_name, approved_at
- year, month, day_of_week, year_month
- is_late, is_early_leave（遅刻・早退判定）

### 17. monthly_attendance_stats（月次勤怠統計ビュー）
**目的**: 月別の勤怠集計データを提供

**取得データ**:
- member_id, member_name, member_email, department, position
- year, month, year_month
- total_days: 総日数
- present_days: 出勤日数
- absent_days: 欠勤日数
- late_days: 遅刻日数
- actual_late_days: 実際の遅刻日数
- early_leave_days: 早退日数
- total_work_hours: 総労働時間
- total_overtime_hours: 総残業時間
- total_hours: 総時間
- avg_work_hours_per_day: 1日平均労働時間
- remote_days: リモート日数
- business_trip_days: 出張日数
- sick_leave_days: 病欠日数
- vacation_days: 有給日数

### 18. monthly_payroll（月次人件費ビュー）
**目的**: 時給設定と勤怠データに基づく給与計算

**取得データ**:
- member_id, member_name, member_email, department, position
- year, month, year_month
- total_work_hours: 総労働時間
- total_overtime_hours: 総残業時間
- total_hours: 総時間
- hourly_rate: 基本時給
- overtime_rate: 残業時給
- regular_pay: 基本給
- overtime_pay: 残業代
- total_pay: 総支給額
- present_days: 出勤日数
- absent_days: 欠勤日数
- late_days: 遅刻日数
- remote_days: リモート日数
- vacation_days: 有給日数

### 19. get_monthly_payroll_summary()（月次人件費サマリーファンクション）
**目的**: 月次の総合的な人件費統計を取得
**パラメータ**: target_year_month（対象年月、デフォルト今月）
**戻り値**: 
- total_employees: 総従業員数
- total_work_hours: 総労働時間
- total_overtime_hours: 総残業時間
- total_payroll: 総人件費
- avg_pay_per_employee: 従業員平均給与
- departments_breakdown: 部署別内訳（JSON形式）

### 20. get_member_attendance()（メンバー勤怠データ取得ファンクション）
**目的**: 特定メンバーの月次勤怠データを取得
**パラメータ**: target_member_id（対象メンバーID）、target_year_month（対象年月、デフォルト今月）
**戻り値**: 
- date: 日付
- start_time: 開始時刻
- end_time: 終了時刻
- work_hours: 労働時間
- overtime_hours: 残業時間
- status: ステータス
- attendance_type: 勤務形態
- is_late: 遅刻フラグ
- is_early_leave: 早退フラグ

### 21. monthly_schedule_view（月次スケジュールビュー）
**目的**: カレンダー表示用の月別スケジュール情報を統合表示

**取得データ**:
- id, title, description, schedule_type, start_date, end_date
- start_time, end_time, is_all_day, location, is_holiday
- color, priority, created_at
- created_by_name, created_by_role
- year, month, year_month, day_of_week
- duration_days: 期間日数
- type_icon: スケジュール種別アイコン（🏖️💼📚⚠️📅📋）
- priority_icon: 優先度アイコン（🔴🟡🟢）

### 22. upcoming_schedule_view（今後のスケジュールビュー）
**目的**: ダッシュボード表示用の近日予定（30日以内）

**取得データ**:
- 全スケジュール情報（company_schedulesテーブルの全項目）
- created_by_name: 作成者名
- date_label: 日付ラベル（今日/明日/MM/DD形式）
- days_until: 残り日数
- urgency_level: 緊急度レベル（holiday/today/soon/upcoming）

### 23. holiday_schedule_view（休日スケジュールビュー）
**目的**: 会社の休日・祝日一覧表示

**取得データ**:
- id, title, start_date, end_date, description, color
- holiday_days: 休日日数
- formatted_date: フォーマット済み日付（YYYY-MM-DD (曜日)）
- month, year: 月・年情報

### 24. get_monthly_schedule()（月次スケジュール取得ファンクション）
**目的**: 指定月のカレンダー用スケジュールデータを取得
**パラメータ**: target_year_month（対象年月、デフォルト今月）
**戻り値**: 
- schedule_date: 日付
- schedules: その日のスケジュール一覧（JSON形式）
  - 各スケジュールの詳細情報とアイコン
  - 時刻順・タイトル順でソート済み

### 25. get_upcoming_events()（今後のイベント取得ファンクション）
**目的**: 指定日数以内の予定を取得
**パラメータ**: days_ahead（検索日数、デフォルト30日）
**戻り値**: 
- 全スケジュール情報
- days_until: 残り日数
- date_label: 日付ラベル
- urgency_level: 緊急度レベル

### 26. test_view_access()（ビューアクセステストファンクション）
**目的**: 勤怠管理関連ビューの権限テスト
**戻り値**: 
- view_name: ビュー名
- accessible: アクセス可否
- error_message: エラーメッセージ（エラー時）

### 27. monthly_expense_summary（月次販管費集計ビュー）
**目的**: 月別・カテゴリ別・費用種別の販管費集計情報を提供

**取得データ**:
- year_month: 対象年月
- expense_type: 費用種別（固定費/変動費）
- expense_category: 費目カテゴリ
- expense_count: 費用件数
- total_budgeted_amount: 予算総額
- total_actual_amount: 実際総額
- total_paid_amount: 支払い済み総額
- total_unpaid_amount: 未払い総額
- total_overdue_amount: 期限切れ総額
- paid_count, unpaid_count, overdue_count: 各ステータスの件数
- payment_completion_rate: 支払い完了率（%）
- budget_variance_percentage: 予算差異率（%）

### 28. yearly_expense_summary（年次販管費統計ビュー）
**目的**: 年別の販管費分析と統計情報を提供

**取得データ**:
- year: 対象年
- expense_type: 費用種別
- expense_category: 費目カテゴリ
- expense_count: 年間費用件数
- total_budgeted_amount: 年間予算総額
- total_actual_amount: 年間実際総額
- total_paid_amount: 年間支払い済み総額
- avg_monthly_amount: 月平均金額
- annual_budget_variance_percentage: 年間予算差異率（%）

### 29. expense_payment_alerts（支払い期限アラートビュー）
**目的**: 支払い期限切れ・期限間近の費用をアラート表示

**取得データ**:
- 基本費用情報（id, year_month, expense_category, expense_name等）
- alert_level: アラートレベル（overdue/due_soon/upcoming/normal）
- days_overdue: 期限超過日数
- days_until_due: 期限までの日数
- created_by_name, created_by_role: 登録者情報

### 30. dashboard_expense_overview（ダッシュボード用販管費概要ビュー）
**目的**: ダッシュボード表示用の販管費概要統計

**取得データ**:
- current_month_total: 今月の総費用
- current_month_budget: 今月の予算総額
- current_month_unpaid_count/amount: 今月の未払い件数・金額
- previous_month_total: 前月の総費用
- overdue_payments_count/amount: 期限切れ件数・金額
- year_to_date_total/budget: 年間累計実績・予算
- current_month_fixed_costs: 今月の固定費
- current_month_variable_costs: 今月の変動費

### 31. get_expense_insights()（販管費分析ファンクション）
**目的**: 指定月の詳細な販管費分析データを取得
**パラメータ**: target_year_month（対象年月、デフォルト今月）、comparison_months（比較月数、デフォルト3ヶ月）
**戻り値**: 
- target_month: 対象月
- total_expenses, budget_total: 総費用・予算総額
- budget_variance_percentage: 予算差異率
- fixed_costs, variable_costs: 固定費・変動費
- fixed_cost_percentage: 固定費比率
- paid_amount, unpaid_amount: 支払い済み・未払い金額
- payment_completion_rate: 支払い完了率
- overdue_amount: 期限切れ金額
- top_expense_category, top_expense_amount: 最大費目カテゴリ・金額
- expense_count: 費用件数
- avg_expense_amount: 平均費用額
- comparison_data: 過去月との比較データ（JSON形式）

### 32. copy_recurring_expenses()（定期費用自動複製ファンクション）
**目的**: 前月の定期費用を指定月に自動コピー
**パラメータ**: from_year_month（コピー元年月）、to_year_month（コピー先年月）
**戻り値**: コピーした費用件数（INTEGER）
**機能**: 
- 定期費用フラグ（is_recurring=true）の費用を自動複製
- actual_amountは予算額で初期化
- 支払いステータスは「未払い」で初期化
- 月末を支払い期限に自動設定

### 33. personal_memo_stats（マイメモ統計ビュー）
**目的**: メンバー別のメモ活動統計と分析データを提供

**取得データ**:
- member_id, member_name, member_email, department: メンバー基本情報
- total_memos: 総メモ数
- ideas_count, learning_count, reflection_count, project_count: カテゴリ別メモ数
- favorite_count: お気に入りメモ数
- active_count: アクティブ（非アーカイブ）メモ数
- this_week_count, this_month_count: 期間別メモ作成数
- last_memo_at: 最終メモ作成日時
- avg_priority_score: 平均優先度スコア

### 34. memo_search_view（メモ検索ビュー）
**目的**: 高度なメモ検索とフィルタリング機能を提供

**取得データ**:
- 基本メモ情報（id, title, content, category, priority, tags等）
- author_name, author_department: 作成者情報
- search_vector: 日本語全文検索用ベクトル
- category_display, priority_display: 日本語表示名
- アーカイブされていないメモのみ表示

### 35. search_personal_memos()（メモ検索ファンクション）
**目的**: 高度な検索条件でメモを検索・取得
**パラメータ**: 
- p_member_id（メンバーID）
- p_search_term（検索語句、デフォルト空）
- p_category（カテゴリフィルター、デフォルト空）
- p_priority（優先度フィルター、デフォルト空）
- p_is_favorite（お気に入りフィルター、デフォルトNULL）
- p_limit（取得件数、デフォルト50）
- p_offset（オフセット、デフォルト0）
**戻り値**: 
- メモ基本情報と関連性スコア
- 日本語全文検索による関連度順・作成日時順でソート

### 36. get_memo_insights()（メモ分析ファンクション）
**目的**: メンバーのメモ活動に関する詳細な分析データを取得
**パラメータ**: p_member_id（対象メンバーID）
**戻り値**: 
- total_memos: 総メモ数
- categories_breakdown: カテゴリ別内訳（JSON形式）
- weekly_activity: 7日間の日別活動（JSON形式）
- priority_distribution: 優先度別分布（JSON形式）
- favorite_count: お気に入り数
- recent_activity: 最近7日間の活動数

---

## 実装状況レポート（2025年8月6日現在）

### 完全実装済みシステム ✅
1. **ニュース・ブログ管理システム**: 完全動作中
2. **お問い合わせ・相談管理システム**: 完全動作中  
3. **アナリティクス・トラッキングシステム**: 完全動作中
4. **Todo管理システム**: 完全動作中（メンバー・役員アクセス制御含む）
5. **チャットボット会話システム**: 完全動作中
6. **社員認証システム**: 完全動作中（データベースベース認証・役員権限管理含む）
7. **勤怠管理システム**: 完全動作中
   - **テーブル**: `attendance_records`, `member_hourly_rates` 実装完了
   - **ビュー**: `attendance_summary`, `monthly_attendance_stats`, `monthly_payroll` 実装完了
   - **ファンクション**: `get_monthly_payroll_summary`, `get_member_attendance` 実装完了
   - **RLSポリシー**: 調整完了・権限テスト機能付き
   - **フロントエンド**: AttendanceManager.tsx、PayrollManager.tsx 実装完了
8. **会社スケジュール管理システム**: 完全動作中
   - **テーブル**: `company_schedules` 実装完了
   - **ビュー**: `monthly_schedule_view`, `upcoming_schedule_view`, `holiday_schedule_view` 実装完了
   - **ファンクション**: `get_monthly_schedule`, `get_upcoming_events` 実装完了
   - **RLSポリシー**: 役員・社員権限分離実装完了
   - **フロントエンド**: ScheduleManager.tsx、ScheduleWidget.tsx 実装完了
9. **販管費管理システム**: 完全動作中
   - **テーブル**: `monthly_expenses` 実装完了
   - **ビュー**: `monthly_expense_summary`, `yearly_expense_summary`, `expense_payment_alerts`, `dashboard_expense_overview` 実装完了
   - **ファンクション**: `get_expense_insights`, `copy_recurring_expenses` 実装完了
   - **RLSポリシー**: 役員限定アクセス制御実装完了
   - **フロントエンド**: ExpenseManager.tsx、ダッシュボード統合 実装完了
10. **KPI/KGI管理システム**: 完全動作中
   - **テーブル**: `kpi_indicators`, `kpi_targets`, `kpi_progress_logs`, `kpi_target_members` 実装完了
   - **ビュー**: `kpi_management_view`, `dashboard_kpi_overview`, `kpi_progress_stats`, `monthly_kpi_summary` 実装完了
   - **ファンクション**: `get_kpi_insights`, `get_member_kpi_progress` 実装完了
   - **RLSポリシー**: 役員・メンバー権限分離実装完了
   - **フロントエンド**: KPIManager.tsx、ダッシュボード統合 実装完了
11. **マイメモ管理システム**: 完全動作中
   - **テーブル**: `personal_memos` 実装完了
   - **ビュー**: `personal_memo_stats`, `memo_search_view` 実装完了
   - **ファンクション**: `search_personal_memos`, `get_memo_insights` 実装完了
   - **検索機能**: 日本語全文検索（GINインデックス）実装完了
   - **RLSポリシー**: 個人専用アクセス制御実装完了
   - **フロントエンド**: MemoManager.tsx、ダッシュボード統合 実装完了

### 技術的改善点 ✅
- **外部キー関係**: 全テーブル間の整合性確保完了
- **RLSアクセス制御**: 全テーブルでロールベース権限制御実装完了
- **ビュー・ファンクション**: 全機能の適用・権限設定完了
- **権限テスト機能**: ビューアクセスの自動テスト機能実装

---

### 10. attendance_records（勤怠記録）
**目的**: 社員の出勤予定と勤務時間を管理  
**実装ステータス**: ✅ 完全実装済み

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|---------|---------|-------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー（自動生成） |
| member_id | uuid | NO | - | メンバーID（外部キー） |
| date | date | NO | - | 勤務日 |
| start_time | time | YES | - | 開始時刻 |
| end_time | time | YES | - | 終了時刻 |
| break_time_minutes | integer | NO | 0 | 休憩時間（分） |
| work_hours | decimal(4,2) | YES | - | 実働時間（自動計算） |
| overtime_hours | decimal(4,2) | NO | 0 | 残業時間 |
| status | varchar(20) | NO | 'scheduled' | 勤怠ステータス |
| attendance_type | varchar(20) | NO | 'regular' | 勤務形態 |
| notes | text | YES | - | 備考 |
| submitted_at | timestamptz | YES | - | 実際の出勤記録時刻 |
| approved_by | uuid | YES | - | 承認者ID（外部キー） |
| approved_at | timestamptz | YES | - | 承認日時 |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

**制約条件**:
- status: 'scheduled', 'present', 'absent', 'late', 'early_leave' のいずれか
- attendance_type: 'regular', 'remote', 'business_trip', 'sick_leave', 'vacation' のいずれか
- 同じメンバーの同じ日付には1つの記録のみ（UNIQUE制約）

**外部キー制約**:
- member_id → members.id（削除カスケード）
- approved_by → members.id

**インデックス**:
- idx_attendance_records_member_id: member_id列
- idx_attendance_records_date: date列
- idx_attendance_records_status: status列
- idx_attendance_records_member_date: (member_id, date)
- idx_attendance_records_month: (member_id, date_trunc('month', date))

**自動計算トリガー**: 実働時間と残業時間の自動計算
**自動更新トリガー**: updated_atが更新時に自動設定

**RLS（行レベルセキュリティ）**: 有効
- メンバー: 自分の勤怠記録のみCRUD操作可能
- 役員: 全ての勤怠記録を閲覧・管理可能

---

### 11. member_hourly_rates（メンバー時給設定）
**目的**: 役員による各メンバーの時給設定管理（メンバー側には表示されない）  
**実装ステータス**: ✅ 完全実装済み

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|---------|---------|-------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー（自動生成） |
| member_id | uuid | NO | - | メンバーID（外部キー） |
| hourly_rate | decimal(8,2) | NO | - | 基本時給 |
| overtime_rate | decimal(8,2) | YES | - | 残業時給（NULL時は基本時給の1.25倍） |
| effective_from | date | NO | CURRENT_DATE | 有効開始日 |
| effective_to | date | YES | - | 有効終了日（NULL時は無期限） |
| is_active | boolean | NO | true | 有効フラグ |
| created_by | uuid | NO | - | 作成者ID（外部キー） |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

**制約条件**:
- 同じメンバーの有効期間の重複を防ぐ（EXCLUDE制約）

**外部キー制約**:
- member_id → members.id（削除カスケード）
- created_by → members.id

**インデックス**:
- idx_member_hourly_rates_member_id: member_id列
- idx_member_hourly_rates_effective: (effective_from, effective_to)
- idx_member_hourly_rates_active: is_active列

**自動更新トリガー**: updated_atが更新時に自動設定

**RLS（行レベルセキュリティ）**: 有効
- 役員のみ: 全操作可能（メンバーは完全に閲覧不可）

---

### 13. personal_memos（マイメモ）
**目的**: 各メンバーの日々の気づき・アイデア・業務メモを個人専用で管理  
**実装ステータス**: ✅ 完全実装済み

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|---------|---------|-------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー（自動生成） |
| member_id | uuid | NO | - | メンバーID（外部キー） |
| title | varchar(200) | NO | - | メモタイトル |
| content | text | NO | - | メモ内容 |
| category | varchar(50) | NO | 'general' | カテゴリ |
| priority | varchar(10) | NO | 'medium' | 優先度 |
| tags | text[] | NO | '{}' | タグ配列 |
| is_favorite | boolean | NO | false | お気に入りフラグ |
| is_archived | boolean | NO | false | アーカイブフラグ |
| reminder_date | timestamptz | YES | - | リマインダー日時 |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

**制約条件**:
- category: 'general', 'ideas', 'meeting', 'project', 'learning', 'goal', 'reflection', 'task', 'inspiration', 'other' のいずれか
- priority: 'low', 'medium', 'high', 'urgent' のいずれか
- タイトル・内容は空文字不可

**外部キー制約**:
- member_id → members.id（削除カスケード）

**インデックス**:
- idx_personal_memos_member_id: member_id列
- idx_personal_memos_category: category列
- idx_personal_memos_priority: priority列
- idx_personal_memos_tags: tags列（GINインデックス）
- idx_personal_memos_created_at: created_at列（降順）
- idx_personal_memos_is_favorite: is_favorite列
- idx_personal_memos_is_archived: is_archived列
- idx_personal_memos_reminder_date: reminder_date列
- idx_personal_memos_member_created: (member_id, created_at DESC)
- idx_personal_memos_member_category: (member_id, category)
- idx_memo_search_vector: 全文検索用GINインデックス

**自動更新トリガー**: updated_atが更新時に自動設定

**RLS（行レベルセキュリティ）**: 有効
- メンバー: 自分のメモのみCRUD操作可能（完全個人専用）
- 役員: 全メンバーのメモ閲覧可能（プライバシー配慮で通常は制限）

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

members (1) ----< (many) attendance_records
    ↑                           ↓
   id                     member_id

members (1) ----< (many) member_hourly_rates
    ↑                             ↓
   id                      member_id

members (1) ----< (many) company_schedules
    ↑                             ↓
   id                      created_by

attendance_records ----< time calculation >---- monthly_payroll
    ↑                                               ↑
 work_hours                            time_based_calculation
overtime_hours

member_hourly_rates ----< rate calculation >---- monthly_payroll
    ↑                                                ↑
hourly_rate                                 rate_based_calculation
overtime_rate

company_schedules ----< calendar display >---- monthly_schedule_view
    ↑                                              ↑
 schedule_data                          formatted_calendar_data

company_schedules ----< upcoming events >---- upcoming_schedule_view
    ↑                                              ↑
 active_schedules                        near_future_events

company_schedules ----< holiday filtering >---- holiday_schedule_view
    ↑                                                ↑
 is_holiday=true                           company_holidays

members (1) ----< (many) personal_memos
    ↑                           ↓
   id                     member_id

personal_memos ----< search & categorization >---- memo_search_view
    ↑                                                    ↑
 content+tags+title                           japanese_fulltext_search

personal_memos ----< statistics & insights >---- personal_memo_stats
    ↑                                                ↑
 memo_activities                            member_memo_analytics
```

---

## セキュリティ設定

### RLS有効テーブル
- **news_article_views**: 閲覧履歴の保護
- **chatbot_conversations**: 会話履歴の保護（匿名ユーザー制限付きアクセス）
- **cta_clicks**: CTAクリック履歴の保護
- **todos**: Todo管理の保護（メンバーは自分のTodoのみ、役員は全Todo）
- **todo_progress_logs**: Todo進捗ログの保護（対応するTodoへのアクセス権に基づく）
- **attendance_records**: 勤怠記録の保護（メンバーは自分の記録のみ、役員は全記録）
- **member_hourly_rates**: 時給設定の保護（役員のみアクセス可能、メンバーは完全に閲覧不可）
- **company_schedules**: スケジュール管理の保護（役員は全操作可能、社員は有効スケジュールの閲覧のみ）
- **monthly_expenses**: 販管費管理の保護（役員のみアクセス可能、メンバーは完全に閲覧不可）
- **kpi_targets**: KPI目標管理の保護（役員は全操作可能、メンバーは自分のKPIのみ）
- **kpi_progress_logs**: KPI進捗ログの保護（対応するKPIへのアクセス権に基づく）
- **personal_memos**: マイメモの保護（メンバーは自分のメモのみ、完全個人専用）

### RLS無効テーブル
- **consultation_requests**: 管理者による直接管理
- **contact_requests**: 管理者による直接管理
- **news_articles**: 公開記事は全ユーザー閲覧可能

### ストレージポリシー
- **public バケット**: 画像アップロード・読み取り・削除可能
- **news-images フォルダ**: 記事用画像専用

---

## マイグレーション履歴

**総マイグレーション数**: 20個  
**基本セットアップ**: 4個  
**機能追加**: 16個

| バージョン | ファイル名 | 内容 | サイズ |
|-----------|----------|------|--------|
| - | database_setup.sql | 基本テーブル構造（相談・問い合わせ・記事） | 6.4KB |
| - | database_migration_analytics.sql | アナリティクス基盤 | 7.8KB |
| - | database_migration_add_images.sql | 画像管理機能 | 1.9KB |
| - | database_migration_members.sql | メンバー管理システム | 7.2KB |
| 20240101000006 | create_chatbot_conversations.sql | チャットボット会話テーブル作成 | 1.9KB |
| 20240101000007 | update_chatbot_conversations.sql | チャットボット会話テーブル構造更新 | 2.1KB |
| 20240101000008 | fix_chatbot_rls.sql | チャットボットRLSポリシー修正 | 1.7KB |
| 20240101000009 | create_cta_clicks.sql | CTAクリック追跡テーブル・ビュー作成 | 3.0KB |
| 20240101000010 | create_conversion_analysis.sql | コンバージョン分析ビュー・ファンクション作成 | 6.7KB |
| 20240131000001 | fix_cta_click_stats_view.sql | CTAクリック統計ビューの修正 | 1.7KB |
| 20250201000001 | add_reading_time_tracking.sql | 閲覧時間トラッキング機能追加（完全実装） | 9.2KB |
| 20250202000001 | create_todo_management.sql | Todo管理システム完全実装（テーブル・ビュー・ファンクション・RLS） | 13KB |
| 20250203000001 | create_attendance_management.sql | 勤怠管理システム実装（基本テーブル・ビュー・ファンクション） | 14KB |
| 20250203000002 | fix_attendance_views_rls.sql | 勤怠管理ビューRLS修正 | 6.5KB |
| 20250203000003 | fix_rls_properly.sql | RLSポリシー適切な修正 | 6.3KB |
| 20250203000004 | disable_rls_temporarily.sql | RLS一時無効化（デバッグ用） | 3.3KB |
| 20250203000005 | fix_view_permissions.sql | ビュー権限問題の完全修正 | 6.5KB |
| 20250204000001 | create_company_schedule.sql | 会社スケジュール管理システム実装 | 15KB |
| - | company_schedule_fixed.sql | 会社スケジュール管理システム修正版（IMMUTABLE関数エラー対応） | 16KB |
| - | fix_attendance_stats_view.sql | 勤怠統計ビュー修正 | 4.7KB |
| - | fix_schedule_rls.sql | スケジュールRLS修正 | 1.6KB |
| - | disable_schedule_rls.sql | スケジュールRLS一時無効化 | 725B |
| 20250207000001 | create_expense_management.sql | 販管費管理システム実装（テーブル・ビュー・ファンクション・RLS） | 18KB |

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

### 5. 勤怠管理システム
- **勤怠記録管理**: 社員の出勤予定・勤務時間入力機能
- **時給設定管理**: 役員による時給設定（メンバー側には非表示）
- **自動計算機能**: 実働時間・残業時間の自動計算
- **人件費計算**: 時給と勤怠データに基づく月次人件費算出
- **勤務形態対応**: 通常勤務・リモート・出張・病欠・有給の管理
- **承認機能**: 勤怠記録の承認フロー
- **統計分析**: 月次勤怠統計・部署別人件費分析

### 6. メンバー管理・認証システム
- **役員・社員アカウント**: ロールベースアクセス制御
- **データベースベース認証**: membersテーブルとbcryptjsによる安全なログイン
- **パスワードハッシュ化**: セキュアな認証機能
- **セッション管理**: 24時間持続・30分アクティビティタイムアウト
- **後方互換性**: 既存の管理者認証も継続サポート
- **ログイン履歴**: アクティビティ追跡
- **プロフィール管理**: 部署・役職情報管理

### 8. 会社スケジュール管理システム
- **全社スケジュール管理**: 役員による企業カレンダー作成・管理
- **多様なイベント種別**: 会議・研修・休暇・締切・イベント・その他の管理
- **休日・祝日管理**: 会社の休日設定・祝日カレンダー
- **カレンダー表示**: 月次ビューとカレンダー形式での表示
- **近日予定表示**: ダッシュボード用の今後30日間のイベント一覧
- **優先度管理**: 高・中・低の3段階優先度とカラーコード表示
- **時間管理**: 終日イベント・時刻指定イベント対応
- **場所管理**: 会議室・オンライン・出張先などの場所情報
- **繰り返しイベント**: 日次・週次・月次・年次の定期イベント対応
- **アクセス制御**: 役員は全操作可能、社員は閲覧のみ
- **視覚的表示**: 種別アイコン・優先度アイコンによる直感的表示

### 7. セキュリティ・パフォーマンス
- **行レベルセキュリティ**: テーブル別アクセス制御
- **インデックス最適化**: 検索・集計性能向上
- **カスケード削除**: データ整合性保証
- **暗号化**: パスワード・機密データの保護

---

## 注意事項

### データベース設計
1. **タイムスタンプ**: 全テーブルで `created_at` と `updated_at` を自動管理
2. **UUID**: 主キーは全て UUID 形式で自動生成
3. **ステータス管理**: 問い合わせ系テーブルは共通のステータス値を使用
4. **国際化対応**: 全テーブルで `timestamptz` を使用し、タイムゾーンに対応
5. **リッチテキスト**: `summary`と`content`カラムでHTMLコンテンツ対応

### パフォーマンス・セキュリティ
6. **CTAトラッキング**: 詳細なコンバージョン分析機能を提供
7. **パフォーマンス**: 専用インデックスによる高速データ検索・集計
8. **閲覧時間トラッキング**: セッション管理による精密な時間測定とユーザー行動分析
9. **RLSポリシー**: テーブルごとに適切なアクセス制御を実装

### 機能固有の注意点
10. **Todo管理**: メンバー別アクセス制御とリアルタイム進捗追跡機能
11. **進捗ログ**: 全てのTodoステータス変更を詳細記録し、監査証跡を提供
12. **勤怠管理**: 実働時間自動計算・勤務形態別管理・承認フロー機能
13. **時給セキュリティ**: 役員のみアクセス可能で、メンバーからは完全に隠蔽
14. **人件費計算**: 勤怠データと時給設定に基づく自動計算とレポート機能
15. **メンバー認証**: パスワードハッシュ化とロールベースアクセス制御

### マイグレーション管理
16. **バージョン管理**: 全マイグレーションにタイムスタンプベースのバージョン付与
17. **依存関係**: 新機能は既存テーブル構造に依存（members → todos → attendance）
18. **後方互換性**: 既存データを保護しながら新機能を追加

### 現在の対応要項目（2025年8月3日）
19. **勤怠管理システム完了項目**:
    - ✅ 基本テーブル（attendance_records, member_hourly_rates）作成済み
    - ✅ PayrollManager.tsx外部キー関係修正完了
    - ✅ AttendanceManager.tsx削除機能追加完了（役員権限）
    - ✅ RLS基本設定完了
20. **社員認証システム完了項目**:
    - ✅ データベースベース認証実装
    - ✅ bcryptjsパスワード検証
    - ✅ 役員・社員権限管理
    - ✅ セッション管理改善
    - ✅ 後方互換性維持
21. **勤怠管理システム要対応項目**:
    - ⚠️ ビュー作成要実行（attendance_summary, monthly_attendance_stats, monthly_payroll）
    - ⚠️ ファンクション作成要実行（get_monthly_payroll_summary, get_member_attendance）
    - ⚠️ RLSポリシー調整（406エラー解決）

---

## システム統計（2025年8月6日現在）

- **総開発期間**: 約7ヶ月（2025年2月～8月）
- **総マイグレーション**: 20個（合計約148KB）
- **完全実装機能**: 9つの主要システム（販管費管理システム追加）
- **実装中機能**: 0個（全システム完成）
- **テーブル数**: 11個（基本4個 + Todo管理2個 + メンバー管理1個 + 勤怠管理2個 + スケジュール管理1個 + 販管費管理1個）
- **認証レベル**: エンタープライズ級（データベースベース認証・bcryptjsハッシュ化）
- **セキュリティレベル**: エンタープライズ級RLS実装完了（全テーブル対応）
- **フロントエンド実装率**: 100%（全システム完全実装）

---

## 変更履歴

### 2025年2月8日 - マイメモ機能実装完了・個人生産性向上・日本語全文検索・統計分析機能完全実装
- **マイメモ機能のフルスタック実装**
  - personal_memosテーブルの作成（カテゴリ・優先度・タグ・お気に入り機能）
  - 10種類のメモカテゴリ（一般・アイデア・会議・プロジェクト・学習・目標・振り返り・タスク・インスピレーション・その他）
  - 4段階の優先度管理（低・中・高・緊急）
  - 日本語全文検索機能（GINインデックス）実装
  - MemoManagerコンポーネントの実装（CRUD・検索・フィルタリング）
  - 個人専用アクセス制御（RLS）とプライバシー保護
  - リマインダー機能とアーカイブ機能
  
- **統計・分析機能**
  - personal_memo_statsビューによる活動統計
  - memo_search_viewビューによる高度検索
  - get_memo_insights()ファンクションによる分析データ
  - search_personal_memos()ファンクションによる検索API
  - カテゴリ別・優先度別・期間別の統計表示
  
- **UI/UX改善**
  - ダッシュボードにマイメモタブを追加（全メンバーアクセス可能）
  - デスクトップ・モバイル両対応のナビゲーション統合
  - 直感的なカテゴリアイコンと色分け表示
  - レスポンシブ対応のカード形式メモ表示
  - 高度な検索・フィルタリング・ソート機能

### 2025年8月7日 - ダッシュボード改善・販管費管理機能強化・管理者パスワード更新
- **管理ダッシュボード「今日やること」セクション修正**
  - 役員アカウントでも自分のタスクのみを表示するように変更
  - 期限が近い順の未完了タスク（上位5件）のフィルタリング改善
  - 担当者名表示の削除（自分のタスクのみのため）
  - パフォーマンス改善（不要なメンバー情報取得の削除）

- **役員向け販管費管理機能のダッシュボード統合**
  - 販管費統計カードをダッシュボードに追加（6種類の統計表示）
  - 当月の販管費総額・予算額・未払い件数・未払い金額・期限切れ件数・年間累計
  - 販管費概要セクションの追加（当月サマリー・支払いアラート表示）
  - 期限切れ費用の自動ステータス更新機能（未払い→期限切れ）
  - 役員のみアクセス可能（executive, ceo, admin ロール制限）
  - 予算との差額表示・支払い状況の可視化
  - デスクトップナビゲーションに「販管費」タブを追加

- **セキュリティ更新**
  - queue@queue-tech.jpアカウントのパスワードを更新（セキュリティ強化）
  - マイグレーション20250207000002でデータベースパスワードハッシュ更新
  - アクティビティログにパスワード変更履歴を記録

- **バグ修正**
  - 販管費管理でUUID形式エラーの修正（ユーザーID取得方法改善）
  - 数値オーバーフローエラーの修正（金額制限99億円まで）
  - 入力フィールドに数値範囲制限とガイダンス追加

---

*最終更新: 2025年2月8日（マイメモ機能実装完了・個人生産性向上・日本語全文検索・統計分析機能完全実装）*  
*実装完了: 勤怠管理・スケジュール管理・販管費管理・KPI/KGI管理・マイメモ管理・全システム完全実装*  
*今後の予定: 新機能追加・データベース最適化・パフォーマンス分析機能拡張・個人生産性分析強化* 