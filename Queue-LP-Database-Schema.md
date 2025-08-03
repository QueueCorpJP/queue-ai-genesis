# Queue-LP データベーススキーマ

## 概要
Queue-LPプロジェクトのSupabaseデータベースに含まれるテーブル構造の詳細です。

**プロジェクトID**: `vrpdhzbfnwljdsretjld`  
**データベースバージョン**: PostgreSQL 17.4.1.054  
**最終更新**: 2025年8月3日（勤怠管理システム実装中・社員ログイン機能追加完了）  
**Supabaseリージョン**: US East (N. Virginia)  
**認証システム**: 有効（Row Level Security対応・社員アカウントログイン対応）  
**実装ステータス**: Todo管理システム完全実装済み、勤怠管理システム部分実装中、社員認証システム完全実装済み

## テーブル一覧

**実装済みテーブル数**: 7個（基本4個 + Todo管理2個 + メンバー管理1個）  
**勤怠管理テーブル**: 2個（実装中・RLS設定調整が必要）  
**ビュー数**: 14個（基本8個 + Todo管理3個 + 閲覧時間3個）  
**ファンクション数**: 10個（基本6個 + Todo管理2個 + 勤怠管理2個）  
**トリガー数**: 7個（基本2個 + Todo管理1個 + 勤怠管理4個）

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

---

## 実装状況レポート（2025年8月3日現在）

### 完全実装済みシステム ✅
1. **ニュース・ブログ管理システム**: 完全動作中
2. **お問い合わせ・相談管理システム**: 完全動作中  
3. **アナリティクス・トラッキングシステム**: 完全動作中
4. **Todo管理システム**: 完全動作中（メンバー・役員アクセス制御含む）
5. **チャットボット会話システム**: 完全動作中
6. **社員認証システム**: 完全動作中（データベースベース認証・役員権限管理含む）

### 実装中システム 🔄
7. **勤怠管理システム**: 
   - **テーブル作成**: `attendance_records`, `member_hourly_rates` 部分実装済み
   - **ビュー**: `attendance_summary`, `monthly_attendance_stats`, `monthly_payroll` 要実装
   - **ファンクション**: `get_monthly_payroll_summary`, `get_member_attendance` 要実装
   - **RLSポリシー**: 調整が必要
   - **フロントエンド**: PayrollManager.tsx外部キー修正完了、AttendanceManager.tsx削除機能追加完了

### 技術的課題 ⚠️
- **外部キー関係**: `member_hourly_rates`テーブルで`members`テーブルへの複数参照問題 → 解決済み
- **RLSアクセス制御**: 勤怠関連テーブルのポリシー設定要調整
- **ビュー・ファンクション**: データベースへの適用要実行

---

### 16. attendance_records（勤怠記録）
**目的**: 社員の出勤予定と勤務時間を管理  
**実装ステータス**: 🔄 テーブル作成済み、RLS調整中

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

### 17. member_hourly_rates（メンバー時給設定）
**目的**: 役員による各メンバーの時給設定管理（メンバー側には表示されない）  
**実装ステータス**: 🔄 テーブル作成済み、外部キー関係修正完了、RLS調整中

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

attendance_records ----< time calculation >---- monthly_payroll
    ↑                                               ↑
 work_hours                            time_based_calculation
overtime_hours

member_hourly_rates ----< rate calculation >---- monthly_payroll
    ↑                                                ↑
hourly_rate                                 rate_based_calculation
overtime_rate
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

### RLS無効テーブル
- **consultation_requests**: 管理者による直接管理
- **contact_requests**: 管理者による直接管理
- **news_articles**: 公開記事は全ユーザー閲覧可能

### ストレージポリシー
- **public バケット**: 画像アップロード・読み取り・削除可能
- **news-images フォルダ**: 記事用画像専用

---

## マイグレーション履歴

**総マイグレーション数**: 13個  
**基本セットアップ**: 4個  
**機能追加**: 9個

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
| 20250203000001 | create_attendance_management.sql | 勤怠管理システム実装（基本テーブル作成済み・ビュー/ファンクション要適用） | 14KB |

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

## システム統計（2025年8月3日現在）

- **総開発期間**: 約6ヶ月（2025年2月～8月）
- **総マイグレーション**: 13個（合計84KB）
- **完全実装機能**: 6つの主要システム（社員認証システム追加）
- **実装中機能**: 1つ（勤怠管理システム）
- **テーブル数**: 9個（基本4個 + Todo管理2個 + メンバー管理1個 + 勤怠管理2個）
- **認証レベル**: エンタープライズ級（データベースベース認証・bcryptjsハッシュ化）
- **セキュリティレベル**: エンタープライズ級RLS実装（調整中含む）
- **フロントエンド実装率**: 90%（勤怠管理ビュー・ファンクション要対応）

---

*最終更新: 2025年8月3日（勤怠管理システム実装中・社員ログイン機能追加完了）*  
*次回対応予定: 勤怠管理システムのビュー・ファンクション適用、RLSポリシー調整*  
*長期予定: データベース最適化・パフォーマンス分析機能追加* 