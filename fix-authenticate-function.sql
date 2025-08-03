-- authenticate_member関数の型エラー修正
-- このファイルの内容をSupabase SQL Editorで実行してください

-- 1. 既存の関数を削除
DROP FUNCTION IF EXISTS authenticate_member(text, text);

-- 2. 修正された関数を作成（型を正確に合わせる）
CREATE OR REPLACE FUNCTION authenticate_member(member_email TEXT, member_password TEXT)
RETURNS TABLE(
    member_id UUID,
    email VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(20),
    department VARCHAR(100),
    position VARCHAR(100),
    is_active BOOLEAN,
    last_login_at TIMESTAMPTZ
) AS $$
DECLARE
    hashed_password TEXT;
BEGIN
    -- パスワードをハッシュ化
    hashed_password := hash_password(member_password);
    
    -- メンバーを認証
    RETURN QUERY
    SELECT 
        m.id,
        m.email,
        m.name,
        m.role,
        m.department,
        m.position,
        m.is_active,
        m.last_login_at
    FROM members m
    WHERE m.email = member_email 
      AND m.password_hash = hashed_password 
      AND m.is_active = true;
      
    -- ログイン回数と最終ログイン時刻を更新
    UPDATE members 
    SET login_count = login_count + 1,
        last_login_at = NOW(),
        updated_at = NOW()
    WHERE email = member_email 
      AND password_hash = hashed_password 
      AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 3. 関数のテスト
SELECT * FROM authenticate_member('queue@queue-tech.jp', 'Taichi00610');

-- 4. テストユーザーでの確認
SELECT * FROM authenticate_member('test@queue-tech.jp', 'test123');
SELECT * FROM authenticate_member('executive@queue-tech.jp', 'exec123'); 