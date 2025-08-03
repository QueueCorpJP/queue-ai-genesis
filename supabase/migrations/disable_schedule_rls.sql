-- スケジュールテーブルのRLS一時無効化
-- 認証問題のテスト用（本番環境では使用しないでください）

-- 既存のRLSポリシーを全て削除
DROP POLICY IF EXISTS "認証されたユーザーはスケジュール閲覧可能" ON company_schedules;
DROP POLICY IF EXISTS "役員のみスケジュール編集可能" ON company_schedules;
DROP POLICY IF EXISTS "管理者は全スケジュール操作可能" ON company_schedules;

-- RLSを無効化（一時的）
ALTER TABLE company_schedules DISABLE ROW LEVEL SECURITY;

-- 注意: 本番環境では以下を実行してRLSを再有効化してください
-- ALTER TABLE company_schedules ENABLE ROW LEVEL SECURITY; 