-- 採用管理システム実装
-- 作成日時: 2025年2月12日
-- 作成者: Queue株式会社
-- 説明: 採用面接テンプレート、候補者管理、面接評価システムの実装

-- =====================================================
-- 1. 面接テンプレート（採用概要＋候補者情報＋最終評価＋決定事項）
-- =====================================================

CREATE TABLE recruitment_interviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- 採用概要
    position_title VARCHAR(200) NOT NULL,  -- 採用予定ポジション
    hiring_count INTEGER NOT NULL DEFAULT 1,  -- 採用人数
    hiring_deadline DATE,  -- 採用期限
    interview_date DATE,  -- 面接日
    interviewer_name VARCHAR(100),  -- 面接官
    
    -- 候補者情報
    candidate_name VARCHAR(100) NOT NULL,  -- 氏名
    candidate_age INTEGER,  -- 年齢
    current_job VARCHAR(200),  -- 現職
    contact_email VARCHAR(255),  -- 連絡先
    contact_phone VARCHAR(50),  -- 電話番号
    
    -- 最終評価
    total_score INTEGER DEFAULT 0,  -- 合計点
    max_score INTEGER DEFAULT 45,  -- 満点
    strengths TEXT,  -- 強み
    concerns TEXT,  -- 懸念点
    final_decision VARCHAR(20) DEFAULT 'pending',  -- 最終判断
    
    -- 決定事項
    hiring_status VARCHAR(20) DEFAULT 'under_review',  -- 採用有無
    expected_start_date DATE,  -- 入社予定日
    offer_conditions TEXT,  -- オファー条件
    salary_offer DECIMAL(12,2),  -- 提示給与
    
    -- システム情報
    interview_status VARCHAR(20) DEFAULT 'scheduled',  -- 面接ステータス
    notes TEXT,  -- 備考
    created_by UUID NOT NULL,  -- 作成者ID
    updated_by UUID,  -- 更新者ID
    created_at TIMESTAMPTZ DEFAULT NOW(),  -- 作成日時
    updated_at TIMESTAMPTZ DEFAULT NOW()   -- 更新日時
);

-- 制約条件
ALTER TABLE recruitment_interviews 
ADD CONSTRAINT check_final_decision 
CHECK (final_decision IN ('pending', 'hire', 'hold', 'reject'));

ALTER TABLE recruitment_interviews 
ADD CONSTRAINT check_hiring_status 
CHECK (hiring_status IN ('under_review', 'hired', 'rejected', 'offer_sent', 'offer_accepted', 'offer_declined'));

ALTER TABLE recruitment_interviews 
ADD CONSTRAINT check_interview_status 
CHECK (interview_status IN ('scheduled', 'completed', 'cancelled', 'rescheduled'));

-- 外部キー制約
ALTER TABLE recruitment_interviews 
ADD CONSTRAINT fk_recruitment_interviews_created_by 
FOREIGN KEY (created_by) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE recruitment_interviews 
ADD CONSTRAINT fk_recruitment_interviews_updated_by 
FOREIGN KEY (updated_by) REFERENCES members(id) ON DELETE SET NULL;

-- インデックス
CREATE INDEX idx_recruitment_interviews_interview_date ON recruitment_interviews(interview_date);
CREATE INDEX idx_recruitment_interviews_hiring_deadline ON recruitment_interviews(hiring_deadline);
CREATE INDEX idx_recruitment_interviews_position_title ON recruitment_interviews(position_title);
CREATE INDEX idx_recruitment_interviews_final_decision ON recruitment_interviews(final_decision);
CREATE INDEX idx_recruitment_interviews_hiring_status ON recruitment_interviews(hiring_status);
CREATE INDEX idx_recruitment_interviews_created_by ON recruitment_interviews(created_by);
CREATE INDEX idx_recruitment_interviews_candidate_name ON recruitment_interviews(candidate_name);

-- =====================================================
-- 2. 面接質問項目テンプレート
-- =====================================================

CREATE TABLE interview_question_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(100) NOT NULL,  -- 質問カテゴリ
    question_title VARCHAR(200) NOT NULL,  -- 質問項目
    question_detail TEXT,  -- 詳細質問例
    evaluation_criteria TEXT,  -- 評価基準
    max_score INTEGER DEFAULT 5,  -- 最大スコア
    is_default BOOLEAN DEFAULT false,  -- デフォルト質問フラグ
    sort_order INTEGER DEFAULT 0,  -- 表示順序
    is_active BOOLEAN DEFAULT true,  -- 有効フラグ
    created_by UUID NOT NULL,  -- 作成者ID
    created_at TIMESTAMPTZ DEFAULT NOW(),  -- 作成日時
    updated_at TIMESTAMPTZ DEFAULT NOW()   -- 更新日時
);

-- 外部キー制約
ALTER TABLE interview_question_templates 
ADD CONSTRAINT fk_interview_question_templates_created_by 
FOREIGN KEY (created_by) REFERENCES members(id) ON DELETE CASCADE;

-- インデックス
CREATE INDEX idx_interview_question_templates_category ON interview_question_templates(category);
CREATE INDEX idx_interview_question_templates_is_active ON interview_question_templates(is_active);
CREATE INDEX idx_interview_question_templates_sort_order ON interview_question_templates(sort_order);
CREATE INDEX idx_interview_question_templates_is_default ON interview_question_templates(is_default);

-- =====================================================
-- 3. 面接質問項目別評価
-- =====================================================

CREATE TABLE interview_question_evaluations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    interview_id UUID NOT NULL,  -- 面接ID
    question_template_id UUID,  -- 質問テンプレートID（NULL可：カスタム質問用）
    question_title VARCHAR(200) NOT NULL,  -- 質問項目（テンプレートまたはカスタム）
    question_detail TEXT,  -- 詳細質問
    evaluation_score INTEGER DEFAULT 0,  -- 評価点（0-5）
    comments TEXT,  -- コメント
    max_score INTEGER DEFAULT 5,  -- 最大スコア
    created_at TIMESTAMPTZ DEFAULT NOW(),  -- 作成日時
    updated_at TIMESTAMPTZ DEFAULT NOW()   -- 更新日時
);

-- 制約条件
ALTER TABLE interview_question_evaluations 
ADD CONSTRAINT check_evaluation_score 
CHECK (evaluation_score >= 0 AND evaluation_score <= max_score);

-- 外部キー制約
ALTER TABLE interview_question_evaluations 
ADD CONSTRAINT fk_interview_question_evaluations_interview_id 
FOREIGN KEY (interview_id) REFERENCES recruitment_interviews(id) ON DELETE CASCADE;

ALTER TABLE interview_question_evaluations 
ADD CONSTRAINT fk_interview_question_evaluations_question_template_id 
FOREIGN KEY (question_template_id) REFERENCES interview_question_templates(id) ON DELETE SET NULL;

-- インデックス
CREATE INDEX idx_interview_question_evaluations_interview_id ON interview_question_evaluations(interview_id);
CREATE INDEX idx_interview_question_evaluations_question_template_id ON interview_question_evaluations(question_template_id);

-- =====================================================
-- 4. 自動更新トリガー
-- =====================================================

-- updated_atの自動更新（面接テーブル）
CREATE OR REPLACE FUNCTION trigger_update_recruitment_interviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recruitment_interviews_updated_at
    BEFORE UPDATE ON recruitment_interviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_recruitment_interviews_updated_at();

-- updated_atの自動更新（質問テンプレートテーブル）
CREATE OR REPLACE FUNCTION trigger_update_interview_question_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_interview_question_templates_updated_at
    BEFORE UPDATE ON interview_question_templates
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_interview_question_templates_updated_at();

-- updated_atの自動更新（質問評価テーブル）
CREATE OR REPLACE FUNCTION trigger_update_interview_question_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_interview_question_evaluations_updated_at
    BEFORE UPDATE ON interview_question_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_interview_question_evaluations_updated_at();

-- =====================================================
-- 5. 面接合計点数自動計算トリガー
-- =====================================================

-- 面接の合計点数を自動計算するファンクション
CREATE OR REPLACE FUNCTION calculate_interview_total_score()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE recruitment_interviews 
    SET total_score = (
        SELECT COALESCE(SUM(evaluation_score), 0)
        FROM interview_question_evaluations 
        WHERE interview_id = COALESCE(NEW.interview_id, OLD.interview_id)
    ),
    max_score = (
        SELECT COALESCE(SUM(max_score), 0)
        FROM interview_question_evaluations 
        WHERE interview_id = COALESCE(NEW.interview_id, OLD.interview_id)
    )
    WHERE id = COALESCE(NEW.interview_id, OLD.interview_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 質問評価の挿入・更新・削除時に合計点数を再計算
CREATE TRIGGER trigger_calculate_total_score_insert
    AFTER INSERT ON interview_question_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_interview_total_score();

CREATE TRIGGER trigger_calculate_total_score_update
    AFTER UPDATE ON interview_question_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_interview_total_score();

CREATE TRIGGER trigger_calculate_total_score_delete
    AFTER DELETE ON interview_question_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_interview_total_score();

-- =====================================================
-- 6. ビュー定義
-- =====================================================

-- 面接概要ビュー（詳細情報統合）
CREATE VIEW recruitment_interviews_overview AS
SELECT 
    ri.id,
    ri.position_title,
    ri.hiring_count,
    ri.hiring_deadline,
    ri.interview_date,
    ri.interviewer_name,
    ri.candidate_name,
    ri.candidate_age,
    ri.current_job,
    ri.contact_email,
    ri.contact_phone,
    ri.total_score,
    ri.max_score,
    CASE 
        WHEN ri.max_score > 0 THEN ROUND((ri.total_score::DECIMAL / ri.max_score::DECIMAL) * 100, 1)
        ELSE 0
    END AS achievement_percentage,
    ri.strengths,
    ri.concerns,
    ri.final_decision,
    ri.hiring_status,
    ri.expected_start_date,
    ri.offer_conditions,
    ri.salary_offer,
    ri.interview_status,
    ri.notes,
    ri.created_at,
    ri.updated_at,
    m.name AS created_by_name,
    m.email AS created_by_email,
    um.name AS updated_by_name,
    -- 面接までの日数
    CASE 
        WHEN ri.interview_date IS NOT NULL THEN 
            (ri.interview_date::date - CURRENT_DATE::date)
        ELSE NULL
    END AS days_until_interview,
    -- 採用期限までの日数
    CASE 
        WHEN ri.hiring_deadline IS NOT NULL THEN 
            (ri.hiring_deadline::date - CURRENT_DATE::date)
        ELSE NULL
    END AS days_until_deadline,
    -- 評価質問数
    (SELECT COUNT(*) FROM interview_question_evaluations WHERE interview_id = ri.id) AS question_count
FROM recruitment_interviews ri
LEFT JOIN members m ON ri.created_by = m.id
LEFT JOIN members um ON ri.updated_by = um.id
ORDER BY ri.created_at DESC;

-- 面接統計ビュー
CREATE VIEW recruitment_statistics AS
SELECT 
    COUNT(*) AS total_interviews,
    COUNT(CASE WHEN interview_status = 'scheduled' THEN 1 END) AS scheduled_interviews,
    COUNT(CASE WHEN interview_status = 'completed' THEN 1 END) AS completed_interviews,
    COUNT(CASE WHEN final_decision = 'hire' THEN 1 END) AS hire_decisions,
    COUNT(CASE WHEN final_decision = 'reject' THEN 1 END) AS reject_decisions,
    COUNT(CASE WHEN final_decision = 'hold' THEN 1 END) AS hold_decisions,
    COUNT(CASE WHEN hiring_status = 'hired' THEN 1 END) AS actual_hires,
    COUNT(CASE WHEN hiring_status = 'offer_sent' THEN 1 END) AS offers_sent,
    COUNT(CASE WHEN hiring_status = 'offer_accepted' THEN 1 END) AS offers_accepted,
    COUNT(CASE WHEN hiring_status = 'offer_declined' THEN 1 END) AS offers_declined,
    ROUND(AVG(CASE WHEN max_score > 0 THEN (total_score::DECIMAL / max_score::DECIMAL) * 100 ELSE 0 END), 1) AS avg_score_percentage,
    COUNT(CASE WHEN interview_date >= CURRENT_DATE THEN 1 END) AS upcoming_interviews,
    COUNT(CASE WHEN hiring_deadline >= CURRENT_DATE AND hiring_deadline <= CURRENT_DATE + INTERVAL '7 days' THEN 1 END) AS urgent_deadlines
FROM recruitment_interviews;

-- =====================================================
-- 7. デフォルト質問テンプレートの挿入
-- =====================================================

-- 初期面接質問テンプレートの挿入（ユーザーの要望に基づく）
-- queue@queue-tech.jpユーザーのIDを取得してcreated_byに設定
INSERT INTO interview_question_templates (category, question_title, question_detail, evaluation_criteria, max_score, is_default, sort_order, created_by) 
SELECT 
    t.category, 
    t.question_title, 
    t.question_detail, 
    t.evaluation_criteria, 
    t.max_score, 
    t.is_default, 
    t.sort_order, 
    m.id as created_by
FROM (VALUES
-- 基本的なスキル・経験評価
('スキル適合度', 'これまでの開発経験・得意分野は？', 'どのような技術スタック、プロジェクト規模での開発経験がありますか？現在最も得意としている分野について教えてください。', '技術的バックグラウンドが募集ポジションとどの程度合致するか。実務経験の深さと広さを評価。0=全く合致しない、3=基本的に合致、5=非常に優秀な経験', 5, true, 1),
('問題解決力', 'トラブル発生時の解決方法は？', '過去に大きな技術的課題やトラブルに直面した時、どのようなアプローチで解決しましたか？具体的な事例を教えてください。', '論理的思考力、状況分析能力、解決策の実効性を評価。0=解決能力なし、3=標準的な解決力、5=卓越した問題解決力', 5, true, 2),
('学習意欲', '新しい技術をどう習得している？', '最近学習した新しい技術や手法はありますか？どのような方法で効率的に学習していますか？', '継続的学習意欲、自己成長への取り組み、技術キャッチアップ能力を評価。0=学習意欲なし、3=標準的な学習力、5=非常に積極的', 5, true, 3),
('AI知識', 'LLMや生成AIの活用経験は？', 'ChatGPT、Claude、GitHub Copilotなどの生成AIツールの業務活用経験はありますか？どのような使い方をしていますか？', 'AI時代に適応した開発手法への理解度。実用的な活用経験があるかを評価。0=全く経験なし、3=基本的な活用経験、5=高度な活用スキル', 5, true, 4),
('プロジェクト管理', 'WBSやPERTの経験は？', 'プロジェクト管理の経験はありますか？WBS作成、進捗管理、チームリーダーの経験について教えてください。', 'PM兼エンジニアとしての管理能力。計画性、統率力、プロジェクト推進力を評価。0=管理経験なし、3=基本的な管理経験、5=優秀な管理能力', 5, true, 5),

-- コミュニケーション・チームワーク評価
('コミュニケーション力', 'チーム連携で意識していることは？', 'チーム開発において、円滑なコミュニケーションのために普段から意識していることはありますか？', 'チーム内での協調性、意思疎通能力、建設的な議論ができるかを評価。0=コミュニケーション困難、3=標準的、5=優秀なファシリテーター', 5, true, 6),
('素直さ／他責回避', 'ミスをした時の対応は？', '過去に仕事でミスをした経験と、その時どのように対応しましたか？失敗から何を学びましたか？', '責任感、素直さ、他責にしない姿勢、失敗からの学習能力を評価。0=他責的、3=適切な対応、5=模範的な責任感', 5, true, 7),
('連絡スピード', 'Slackやメールの返信の速さ', '業務での連絡ツール（Slack、メール等）の利用頻度と、返信のタイミングについて教えてください。', 'レスポンシブネス、迅速な意思疎通ができるかを評価。0=連絡が遅い、3=標準的な速度、5=非常に迅速', 5, true, 8),
('文化適合性', '当社Valueとの相性は？', '当社の企業文化や価値観について調べてきましたか？どの部分に共感しましたか？', '企業文化への理解度、価値観の合致度、長期的な定着可能性を評価。0=全く合致しない、3=基本的に合致、5=非常に高い親和性', 5, true, 9)
) as t(category, question_title, question_detail, evaluation_criteria, max_score, is_default, sort_order)
CROSS JOIN (
    SELECT id FROM members 
    WHERE email = 'queue@queue-tech.jp' 
    AND is_active = true 
    LIMIT 1
) as m;

-- =====================================================
-- 8. RLS（行レベルセキュリティ）設定
-- =====================================================

-- 面接テーブルのRLS有効化
ALTER TABLE recruitment_interviews ENABLE ROW LEVEL SECURITY;

-- 役員のみアクセス可能（executive, ceo, admin）
CREATE POLICY "recruitment_interviews_policy_executives" ON recruitment_interviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE members.id = auth.uid() 
            AND members.role IN ('executive', 'ceo', 'admin')
            AND members.is_active = true
        )
    );

-- 質問テンプレートテーブルのRLS有効化
ALTER TABLE interview_question_templates ENABLE ROW LEVEL SECURITY;

-- 役員のみアクセス可能
CREATE POLICY "interview_question_templates_policy_executives" ON interview_question_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE members.id = auth.uid() 
            AND members.role IN ('executive', 'ceo', 'admin')
            AND members.is_active = true
        )
    );

-- 質問評価テーブルのRLS有効化
ALTER TABLE interview_question_evaluations ENABLE ROW LEVEL SECURITY;

-- 役員のみアクセス可能
CREATE POLICY "interview_question_evaluations_policy_executives" ON interview_question_evaluations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE members.id = auth.uid() 
            AND members.role IN ('executive', 'ceo', 'admin')
            AND members.is_active = true
        )
    );

-- =====================================================
-- 9. ファンクション定義
-- =====================================================

-- 採用統計取得ファンクション
CREATE OR REPLACE FUNCTION get_recruitment_insights(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_interviews', COUNT(*),
        'completed_interviews', COUNT(CASE WHEN interview_status = 'completed' THEN 1 END),
        'scheduled_interviews', COUNT(CASE WHEN interview_status = 'scheduled' THEN 1 END),
        'hire_rate', ROUND(
            COUNT(CASE WHEN final_decision = 'hire' THEN 1 END)::DECIMAL / 
            NULLIF(COUNT(CASE WHEN interview_status = 'completed' THEN 1 END), 0) * 100, 1
        ),
        'avg_score', ROUND(AVG(CASE WHEN max_score > 0 THEN (total_score::DECIMAL / max_score::DECIMAL) * 100 ELSE 0 END), 1),
        'top_position', (
            SELECT position_title 
            FROM recruitment_interviews 
            WHERE created_at BETWEEN p_start_date AND p_end_date + INTERVAL '1 day'
            GROUP BY position_title 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ),
        'upcoming_interviews', COUNT(CASE WHEN interview_date >= CURRENT_DATE THEN 1 END),
        'urgent_deadlines', COUNT(CASE WHEN hiring_deadline >= CURRENT_DATE AND hiring_deadline <= CURRENT_DATE + INTERVAL '7 days' THEN 1 END)
    ) INTO result
    FROM recruitment_interviews
    WHERE created_at BETWEEN p_start_date AND p_end_date + INTERVAL '1 day';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 面接質問テンプレート取得ファンクション
CREATE OR REPLACE FUNCTION get_interview_question_templates()
RETURNS TABLE (
    id UUID,
    category VARCHAR,
    question_title VARCHAR,
    question_detail TEXT,
    evaluation_criteria TEXT,
    max_score INTEGER,
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.category,
        t.question_title,
        t.question_detail,
        t.evaluation_criteria,
        t.max_score,
        t.sort_order
    FROM interview_question_templates t
    WHERE t.is_active = true
    ORDER BY t.sort_order ASC, t.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 面接詳細取得ファンクション（質問評価込み）
CREATE OR REPLACE FUNCTION get_interview_details(p_interview_id UUID)
RETURNS JSON AS $$
DECLARE
    interview_data JSON;
    questions_data JSON;
    result JSON;
BEGIN
    -- 面接基本情報を取得
    SELECT row_to_json(rio) INTO interview_data
    FROM recruitment_interviews_overview rio
    WHERE rio.id = p_interview_id;
    
    -- 質問評価を取得
    SELECT json_agg(
        json_build_object(
            'id', iqe.id,
            'question_title', iqe.question_title,
            'question_detail', iqe.question_detail,
            'evaluation_score', iqe.evaluation_score,
            'max_score', iqe.max_score,
            'comments', iqe.comments
        ) ORDER BY iqe.created_at
    ) INTO questions_data
    FROM interview_question_evaluations iqe
    WHERE iqe.interview_id = p_interview_id;
    
    -- 結果を結合
    SELECT json_build_object(
        'interview', interview_data,
        'questions', COALESCE(questions_data, '[]'::json)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- マイグレーション完了
-- =====================================================

-- マイグレーションログに記録
INSERT INTO migration_log (version, description, executed_at)
VALUES (
    '20250212000001', 
    '採用管理システム実装: 面接テンプレート、候補者管理、質問評価システムの完全実装',
    NOW()
);

-- 完了メッセージ
SELECT 'Recruitment management system created successfully!' AS status;
