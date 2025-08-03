-- テストユーザー作成用SQL
-- このファイルの内容をSupabase SQL Editorで実行してください

-- 1. 既存のメンバーを確認
SELECT id, email, name, role, is_active FROM members;

-- 2. パスワードハッシュ関数のテスト
SELECT hash_password('test123') AS hashed_password;

-- 3. テスト社員アカウントの作成（既存の場合は更新）
INSERT INTO members (email, password_hash, name, role, department, position, is_active)
VALUES (
    'test@queue-tech.jp',
    hash_password('test123'),
    'テスト社員',
    'employee',
    'テスト部署',
    'テスト職位',
    true
) ON CONFLICT (email) DO UPDATE SET
    password_hash = hash_password('test123'),
    name = 'テスト社員',
    role = 'employee',
    department = 'テスト部署',
    position = 'テスト職位',
    is_active = true,
    updated_at = NOW();

-- 4. テスト役員アカウントの作成（既存の場合は更新）
INSERT INTO members (email, password_hash, name, role, department, position, is_active)
VALUES (
    'executive@queue-tech.jp',
    hash_password('exec123'),
    'テスト役員',
    'executive',
    '経営陣',
    'テスト役員',
    true
) ON CONFLICT (email) DO UPDATE SET
    password_hash = hash_password('exec123'),
    name = 'テスト役員',
    role = 'executive',
    department = '経営陣',
    position = 'テスト役員',
    is_active = true,
    updated_at = NOW();

-- 5. 認証ファンクションのテスト
SELECT * FROM authenticate_member('test@queue-tech.jp', 'test123');
SELECT * FROM authenticate_member('executive@queue-tech.jp', 'exec123');
SELECT * FROM authenticate_member('queue@queue-tech.jp', 'Taichi00610');

-- 6. 作成されたユーザーの確認
SELECT id, email, name, role, department, position, is_active, created_at 
FROM members 
ORDER BY created_at DESC; 