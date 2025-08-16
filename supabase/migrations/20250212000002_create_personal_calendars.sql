-- Personal Calendars Management System
-- 個人カレンダー管理システム - 各メンバーの個人予定管理とプライバシー保護

-- 1. Personal Calendars Table (個人カレンダーテーブル)
CREATE TABLE IF NOT EXISTS personal_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type VARCHAR(30) NOT NULL DEFAULT 'personal',
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  location VARCHAR(200),
  is_private BOOLEAN NOT NULL DEFAULT true, -- デフォルトはプライベート
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_pattern VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'yearly'
  recurrence_end_date DATE,
  color VARCHAR(7) NOT NULL DEFAULT '#10B981', -- 個人予定用のデフォルトカラー
  priority VARCHAR(10) NOT NULL DEFAULT 'medium',
  reminder_minutes INTEGER DEFAULT 15, -- リマインダー設定（分）
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- 制約条件
  CONSTRAINT chk_personal_calendar_event_type 
    CHECK (event_type IN ('personal', 'meeting', 'appointment', 'task', 'reminder', 'other')),
  CONSTRAINT chk_personal_calendar_priority 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT chk_personal_calendar_recurrence_pattern 
    CHECK (recurrence_pattern IS NULL OR recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
  CONSTRAINT chk_personal_calendar_date_consistency 
    CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT chk_personal_calendar_time_consistency 
    CHECK (
      (is_all_day = true) OR 
      (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time) OR
      (start_time IS NULL AND end_time IS NULL)
    ),
  CONSTRAINT chk_personal_calendar_color_format 
    CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- 2. Indexes for Performance (パフォーマンス用インデックス)
CREATE INDEX idx_personal_calendars_member_id ON personal_calendars(member_id);
CREATE INDEX idx_personal_calendars_start_date ON personal_calendars(start_date);
CREATE INDEX idx_personal_calendars_end_date ON personal_calendars(end_date);
CREATE INDEX idx_personal_calendars_date_range ON personal_calendars(start_date, end_date);
CREATE INDEX idx_personal_calendars_event_type ON personal_calendars(event_type);
CREATE INDEX idx_personal_calendars_is_private ON personal_calendars(is_private);
CREATE INDEX idx_personal_calendars_is_active ON personal_calendars(is_active);
CREATE INDEX idx_personal_calendars_member_date ON personal_calendars(member_id, start_date);
CREATE INDEX idx_personal_calendars_member_active ON personal_calendars(member_id, is_active) WHERE is_active = true;
CREATE INDEX idx_personal_calendars_active_date ON personal_calendars(is_active, start_date) WHERE is_active = true;

-- 3. Updated At Trigger (更新日時自動設定トリガー)
CREATE OR REPLACE FUNCTION update_personal_calendars_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_personal_calendars_updated_at
  BEFORE UPDATE ON personal_calendars
  FOR EACH ROW
  EXECUTE FUNCTION update_personal_calendars_updated_at();

-- 4. Row Level Security (行レベルセキュリティ)
ALTER TABLE personal_calendars ENABLE ROW LEVEL SECURITY;

-- 個人: 自分のカレンダーのみCRUD操作可能
CREATE POLICY personal_calendars_personal_access ON personal_calendars
  FOR ALL
  TO authenticated
  USING (
    -- 自分のカレンダーのみアクセス可能
    member_id IN (
      SELECT id FROM members 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_active = true
    )
  )
  WITH CHECK (
    -- 作成時も自分のカレンダーのみ
    member_id IN (
      SELECT id FROM members 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_active = true
    )
  );

-- 役員: 全カレンダー閲覧可能（プライベートでないもの + 全メンバーの基本情報）
CREATE POLICY personal_calendars_executive_read ON personal_calendars
  FOR SELECT
  TO authenticated
  USING (
    -- 役員は全カレンダーを閲覧可能（プライバシー配慮でプライベートでないもののみ）
    EXISTS (
      SELECT 1 FROM members 
      WHERE email = auth.jwt() ->> 'email' 
      AND role IN ('executive', 'ceo', 'admin')
      AND is_active = true
    )
    AND (
      is_private = false OR 
      -- 自分のプライベートカレンダーは閲覧可能
      member_id IN (
        SELECT id FROM members 
        WHERE email = auth.jwt() ->> 'email' 
        AND is_active = true
      )
    )
  );

-- 5. Views for Management (管理用ビュー)

-- Personal Calendar Summary View (個人カレンダー概要ビュー)
CREATE OR REPLACE VIEW personal_calendar_summary AS
SELECT 
  pc.id,
  pc.member_id,
  m.name as member_name,
  m.email as member_email,
  m.department,
  m.position,
  pc.title,
  pc.description,
  pc.event_type,
  pc.start_date,
  pc.end_date,
  pc.start_time,
  pc.end_time,
  pc.is_all_day,
  pc.location,
  pc.is_private,
  pc.color,
  pc.priority,
  pc.reminder_minutes,
  pc.is_active,
  pc.created_at,
  pc.updated_at,
  
  -- 日付計算
  EXTRACT(YEAR FROM pc.start_date) as year,
  EXTRACT(MONTH FROM pc.start_date) as month,
  TO_CHAR(pc.start_date, 'Day') as day_of_week,
  TO_CHAR(pc.start_date, 'YYYY-MM') as year_month,
  
  -- イベント期間計算
  CASE 
    WHEN pc.end_date IS NULL THEN 1
    ELSE (pc.end_date - pc.start_date + 1)
  END as duration_days,
  
  -- イベント種別アイコン
  CASE pc.event_type
    WHEN 'personal' THEN '📅'
    WHEN 'meeting' THEN '🤝'
    WHEN 'appointment' THEN '📋'
    WHEN 'task' THEN '✅'
    WHEN 'reminder' THEN '⏰'
    ELSE '📌'
  END as type_icon,
  
  -- 優先度アイコン
  CASE pc.priority
    WHEN 'urgent' THEN '🔴'
    WHEN 'high' THEN '🟠'
    WHEN 'medium' THEN '🟡'
    WHEN 'low' THEN '🟢'
    ELSE '⚪'
  END as priority_icon
  
FROM personal_calendars pc
JOIN members m ON pc.member_id = m.id
WHERE pc.is_active = true
ORDER BY pc.start_date DESC, pc.start_time ASC;

-- Member Calendar Stats View (メンバー別カレンダー統計ビュー)
CREATE OR REPLACE VIEW member_calendar_stats AS
SELECT 
  m.id as member_id,
  m.name as member_name,
  m.email as member_email,
  m.department,
  m.position,
  
  -- カレンダー統計
  COUNT(*) as total_events,
  COUNT(CASE WHEN pc.event_type = 'personal' THEN 1 END) as personal_events,
  COUNT(CASE WHEN pc.event_type = 'meeting' THEN 1 END) as meeting_events,
  COUNT(CASE WHEN pc.event_type = 'appointment' THEN 1 END) as appointment_events,
  COUNT(CASE WHEN pc.event_type = 'task' THEN 1 END) as task_events,
  COUNT(CASE WHEN pc.is_private = true THEN 1 END) as private_events,
  COUNT(CASE WHEN pc.is_private = false THEN 1 END) as public_events,
  
  -- 優先度別統計
  COUNT(CASE WHEN pc.priority = 'urgent' THEN 1 END) as urgent_events,
  COUNT(CASE WHEN pc.priority = 'high' THEN 1 END) as high_priority_events,
  COUNT(CASE WHEN pc.priority = 'medium' THEN 1 END) as medium_priority_events,
  COUNT(CASE WHEN pc.priority = 'low' THEN 1 END) as low_priority_events,
  
  -- 期間別統計
  COUNT(CASE WHEN pc.start_date >= CURRENT_DATE THEN 1 END) as upcoming_events,
  COUNT(CASE WHEN pc.start_date = CURRENT_DATE THEN 1 END) as today_events,
  COUNT(CASE WHEN pc.start_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as week_events,
  COUNT(CASE WHEN pc.start_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as month_events,
  
  -- 活動指標
  MAX(pc.created_at) as last_event_created,
  MIN(pc.start_date) as earliest_event_date,
  MAX(pc.start_date) as latest_event_date
  
FROM members m
LEFT JOIN personal_calendars pc ON m.id = pc.member_id AND pc.is_active = true
WHERE m.is_active = true
GROUP BY m.id, m.name, m.email, m.department, m.position
ORDER BY total_events DESC;

-- Unified Calendar View (統合カレンダービュー - 管理者向け)
CREATE OR REPLACE VIEW unified_calendar_view AS
(
  -- Company Schedules (会社スケジュール)
  SELECT 
    'company' as calendar_type,
    cs.id,
    cs.created_by as member_id,
    m.name as member_name,
    m.email as member_email,
    m.department,
    cs.title,
    cs.description,
    cs.schedule_type as event_type,
    cs.start_date,
    cs.end_date,
    cs.start_time,
    cs.end_time,
    cs.is_all_day,
    cs.location,
    false as is_private, -- 会社スケジュールは常にパブリック
    cs.color,
    cs.priority,
    null as reminder_minutes,
    cs.is_active,
    cs.created_at,
    cs.updated_at
  FROM company_schedules cs
  JOIN members m ON cs.created_by = m.id
  WHERE cs.is_active = true
)
UNION ALL
(
  -- Personal Calendars (個人カレンダー)
  SELECT 
    'personal' as calendar_type,
    pc.id,
    pc.member_id,
    m.name as member_name,
    m.email as member_email,
    m.department,
    pc.title,
    pc.description,
    pc.event_type,
    pc.start_date,
    pc.end_date,
    pc.start_time,
    pc.end_time,
    pc.is_all_day,
    pc.location,
    pc.is_private,
    pc.color,
    pc.priority,
    pc.reminder_minutes,
    pc.is_active,
    pc.created_at,
    pc.updated_at
  FROM personal_calendars pc
  JOIN members m ON pc.member_id = m.id
  WHERE pc.is_active = true
)
ORDER BY start_date DESC, start_time ASC;

-- 6. Functions for Management (管理用ファンクション)

-- Get Member Calendar Data (メンバーカレンダーデータ取得)
CREATE OR REPLACE FUNCTION get_member_calendar_data(
  target_member_id UUID,
  start_date_param DATE DEFAULT CURRENT_DATE,
  end_date_param DATE DEFAULT CURRENT_DATE + INTERVAL '30 days',
  include_private BOOLEAN DEFAULT false
)
RETURNS TABLE (
  calendar_type TEXT,
  event_id UUID,
  title TEXT,
  description TEXT,
  event_type TEXT,
  start_date DATE,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  is_all_day BOOLEAN,
  location TEXT,
  is_private BOOLEAN,
  color TEXT,
  priority TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ucv.calendar_type,
    ucv.id as event_id,
    ucv.title,
    ucv.description,
    ucv.event_type,
    ucv.start_date,
    ucv.end_date,
    ucv.start_time,
    ucv.end_time,
    ucv.is_all_day,
    ucv.location,
    ucv.is_private,
    ucv.color,
    ucv.priority,
    ucv.created_at
  FROM unified_calendar_view ucv
  WHERE ucv.member_id = target_member_id
    AND ucv.start_date BETWEEN start_date_param AND end_date_param
    AND (include_private = true OR ucv.is_private = false)
  ORDER BY ucv.start_date ASC, ucv.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get All Members Calendar Overview (全メンバーカレンダー概要取得)
CREATE OR REPLACE FUNCTION get_all_members_calendar_overview(
  start_date_param DATE DEFAULT CURRENT_DATE,
  end_date_param DATE DEFAULT CURRENT_DATE + INTERVAL '7 days'
)
RETURNS TABLE (
  member_id UUID,
  member_name TEXT,
  member_email TEXT,
  department TEXT,
  total_events BIGINT,
  company_events BIGINT,
  personal_events BIGINT,
  today_events BIGINT,
  upcoming_events BIGINT,
  events_detail JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as member_id,
    m.name as member_name,
    m.email as member_email,
    m.department,
    COUNT(ucv.id) as total_events,
    COUNT(CASE WHEN ucv.calendar_type = 'company' THEN 1 END) as company_events,
    COUNT(CASE WHEN ucv.calendar_type = 'personal' AND ucv.is_private = false THEN 1 END) as personal_events,
    COUNT(CASE WHEN ucv.start_date = CURRENT_DATE THEN 1 END) as today_events,
    COUNT(CASE WHEN ucv.start_date > CURRENT_DATE THEN 1 END) as upcoming_events,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'calendar_type', ucv.calendar_type,
          'title', ucv.title,
          'start_date', ucv.start_date,
          'start_time', ucv.start_time,
          'event_type', ucv.event_type,
          'priority', ucv.priority,
          'color', ucv.color
        ) ORDER BY ucv.start_date ASC, ucv.start_time ASC
      ) FILTER (WHERE ucv.id IS NOT NULL),
      '[]'::jsonb
    ) as events_detail
  FROM members m
  LEFT JOIN unified_calendar_view ucv ON m.id = ucv.member_id 
    AND ucv.start_date BETWEEN start_date_param AND end_date_param
    AND ucv.is_active = true
    AND (ucv.is_private = false OR ucv.calendar_type = 'company') -- プライベートは除外
  WHERE m.is_active = true
  GROUP BY m.id, m.name, m.email, m.department
  ORDER BY total_events DESC, m.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calendar Insights Function (カレンダー分析ファンクション)
CREATE OR REPLACE FUNCTION get_calendar_insights()
RETURNS TABLE (
  total_members BIGINT,
  total_events BIGINT,
  company_events BIGINT,
  personal_events BIGINT,
  private_events BIGINT,
  public_events BIGINT,
  events_today BIGINT,
  events_this_week BIGINT,
  events_this_month BIGINT,
  most_active_member TEXT,
  most_common_event_type TEXT,
  average_events_per_member NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(DISTINCT id) FROM members WHERE is_active = true) as total_members,
    (SELECT COUNT(*) FROM unified_calendar_view WHERE is_active = true) as total_events,
    (SELECT COUNT(*) FROM unified_calendar_view WHERE calendar_type = 'company' AND is_active = true) as company_events,
    (SELECT COUNT(*) FROM unified_calendar_view WHERE calendar_type = 'personal' AND is_active = true) as personal_events,
    (SELECT COUNT(*) FROM unified_calendar_view WHERE is_private = true AND is_active = true) as private_events,
    (SELECT COUNT(*) FROM unified_calendar_view WHERE is_private = false AND is_active = true) as public_events,
    (SELECT COUNT(*) FROM unified_calendar_view WHERE start_date = CURRENT_DATE AND is_active = true) as events_today,
    (SELECT COUNT(*) FROM unified_calendar_view WHERE start_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND is_active = true) as events_this_week,
    (SELECT COUNT(*) FROM unified_calendar_view WHERE start_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' AND is_active = true) as events_this_month,
    (SELECT member_name FROM member_calendar_stats ORDER BY total_events DESC LIMIT 1) as most_active_member,
    (SELECT event_type FROM unified_calendar_view WHERE is_active = true GROUP BY event_type ORDER BY COUNT(*) DESC LIMIT 1) as most_common_event_type,
    (SELECT ROUND(AVG(total_events), 2) FROM member_calendar_stats) as average_events_per_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Data Migration Support (データ移行サポート)

-- Sample Data Insert (サンプルデータ挿入) - 開発・テスト用
DO $$
DECLARE
  sample_member_id UUID;
BEGIN
  -- 既存メンバーのサンプルデータ作成
  SELECT id INTO sample_member_id FROM members WHERE email = 'queue@queue-tech.jp' LIMIT 1;
  
  IF sample_member_id IS NOT NULL THEN
    -- サンプル個人カレンダーイベント
    INSERT INTO personal_calendars (
      member_id, title, description, event_type, start_date, start_time, end_time, 
      location, is_private, color, priority, reminder_minutes
    ) VALUES 
    (sample_member_id, '定例会議準備', '月次定例会議の資料準備', 'task', CURRENT_DATE + 1, '09:00', '10:30', 'オフィス', false, '#3B82F6', 'medium', 30),
    (sample_member_id, '歯科検診', '定期健康診断', 'appointment', CURRENT_DATE + 3, '14:00', '15:00', '銀座歯科クリニック', true, '#10B981', 'low', 60),
    (sample_member_id, 'プロジェクトレビュー', 'Q1プロジェクトの振り返り', 'meeting', CURRENT_DATE + 7, '15:00', '16:30', '会議室A', false, '#F59E0B', 'high', 15)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Migration Completion Log
INSERT INTO migration_log (migration_name, executed_at, description) 
VALUES (
  '20250212000002_create_personal_calendars', 
  NOW(), 
  'Personal calendar management system - 個人カレンダー管理システム実装: テーブル作成、インデックス設定、RLS設定、ビュー作成、管理用ファンクション追加、サンプルデータ挿入'
) ON CONFLICT (migration_name) DO NOTHING;

-- Success Message
DO $$
BEGIN
  RAISE NOTICE '✅ Personal Calendar Management System successfully created!';
  RAISE NOTICE '📅 Tables: personal_calendars';
  RAISE NOTICE '👀 Views: personal_calendar_summary, member_calendar_stats, unified_calendar_view';
  RAISE NOTICE '🔧 Functions: get_member_calendar_data(), get_all_members_calendar_overview(), get_calendar_insights()';
  RAISE NOTICE '🔒 Security: RLS enabled with member/executive access control';
  RAISE NOTICE '📊 Sample data: Created for testing purposes';
END $$;

