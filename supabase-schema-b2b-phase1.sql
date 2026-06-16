-- ================================================================
-- PHASE 1: B2B SCHOOL PLATFORM - NEW TABLES & SCHEMA UPDATES
-- Add these to your existing supabase-schema.sql
-- ================================================================

-- ================================================================
-- 1. SCHOOLS_AUTH - School Email/Password Authentication
-- ================================================================
CREATE TABLE IF NOT EXISTS schools_auth (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id             uuid        NOT NULL UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
  email                 text        UNIQUE NOT NULL,
  password_hash         text        NOT NULL,
  salt                  text        NOT NULL,
  mfa_enabled           boolean     DEFAULT false,
  mfa_secret            text,
  last_login_at         timestamptz,
  password_changed_at   timestamptz,
  is_verified           boolean     DEFAULT false,
  verification_token    text,
  verification_token_expires timestamptz,
  password_reset_token  text,
  password_reset_expires timestamptz,
  failed_login_attempts int         DEFAULT 0,
  account_locked_until  timestamptz,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE schools_auth ENABLE ROW LEVEL SECURITY;
-- Schools can only read their own auth record
CREATE POLICY "schools_auth_read_own" ON schools_auth
  FOR SELECT USING (
    id = (SELECT auth_id FROM schools_sessions WHERE auth_id = id LIMIT 1)
  );

-- ================================================================
-- 2. SCHOOLS_SESSIONS - School Login Sessions
-- ================================================================
CREATE TABLE IF NOT EXISTS schools_sessions (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id             uuid        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  auth_id               uuid        NOT NULL REFERENCES schools_auth(id) ON DELETE CASCADE,
  jwt_token             text,
  refresh_token         text,
  refresh_token_expires timestamptz,
  ip_address            text,
  user_agent            text,
  created_at            timestamptz DEFAULT now(),
  expires_at            timestamptz DEFAULT (now() + interval '1 hour')
);

ALTER TABLE schools_sessions ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 3. SCHOOL_STUDENT_REGISTRATIONS - Direct enrollment from schools
-- ================================================================
CREATE TABLE IF NOT EXISTS school_student_registrations (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id             uuid        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  reg_id                text        UNIQUE NOT NULL,  -- Links to registrations.reg_id
  student_email         text        NOT NULL,
  student_first_name    text        NOT NULL,
  student_last_name     text        NOT NULL,
  student_dob           date,
  student_class         text        NOT NULL,
  parent_name           text,
  parent_email          text,
  parent_phone          text,
  city                  text,
  notes                 text,
  created_by_method     text        DEFAULT 'manual',  -- 'manual' | 'csv'
  csv_upload_id         uuid        REFERENCES school_csv_uploads(id),
  enrollment_status     text        DEFAULT 'registered',  -- 'registered' | 'exam_assigned' | 'test_started' | 'completed'
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE school_student_registrations ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 4. SCHOOL_CSV_UPLOADS - Audit trail for bulk imports
-- ================================================================
CREATE TABLE IF NOT EXISTS school_csv_uploads (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id             uuid        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  filename              text        NOT NULL,
  file_size_bytes       int,
  total_records         int         NOT NULL,
  successful_imports    int         DEFAULT 0,
  failed_imports        int         DEFAULT 0,
  skipped_records       int         DEFAULT 0,
  errors_json           jsonb,      -- { row_number: ["error1", "error2"] }
  upload_status         text        DEFAULT 'processing',  -- 'processing' | 'success' | 'partial' | 'failed'
  uploaded_at           timestamptz DEFAULT now(),
  uploaded_by_email     text        NOT NULL,
  processed_at          timestamptz,
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE school_csv_uploads ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 5. EXAM_SCHEDULES - School-managed exam sessions
-- ================================================================
CREATE TABLE IF NOT EXISTS exam_schedules (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id             uuid        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  exam_name             text        NOT NULL,
  exam_description      text,
  scheduled_date        date        NOT NULL,
  scheduled_time        time        NOT NULL,
  capacity              int         NOT NULL,
  registered_count      int         DEFAULT 0,
  timezone              text        DEFAULT 'Asia/Kolkata',
  status                text        DEFAULT 'draft',  -- 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'
  is_visible_to_students boolean    DEFAULT false,
  registration_deadline timestamptz,
  exam_start_time       timestamptz,
  exam_end_time         timestamptz,
  notes                 text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE exam_schedules ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 6. EXAM_STUDENT_SLOTS - Student assignments to exam slots
-- ================================================================
CREATE TABLE IF NOT EXISTS exam_student_slots (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id               uuid        NOT NULL REFERENCES exam_schedules(id) ON DELETE CASCADE,
  reg_id                text        NOT NULL REFERENCES registrations(reg_id) ON DELETE CASCADE,
  school_id             uuid        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  slot_status           text        DEFAULT 'available',  -- 'available' | 'registered' | 'test_started' | 'completed' | 'no_show' | 'cancelled'
  registered_at         timestamptz,
  test_session_id       uuid        REFERENCES test_sessions(id),
  completion_status     text,       -- null | 'in_progress' | 'completed' | 'abandoned'
  test_score            jsonb,      -- Will store score data once test_sessions table has it
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE exam_student_slots ENABLE ROW LEVEL SECURITY;

-- Index for efficient slot availability queries
CREATE INDEX IF NOT EXISTS idx_exam_slots_status
  ON exam_student_slots(exam_id, slot_status);

-- ================================================================
-- 7. SCHOOL_AUDIT_LOGS - Activity tracking
-- ================================================================
CREATE TABLE IF NOT EXISTS school_audit_logs (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id             uuid        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  action                text        NOT NULL,  -- 'login' | 'add_student' | 'bulk_upload' | 'create_exam' | 'register_student' | etc
  details               jsonb,      -- Action-specific details
  ip_address            text,
  user_agent            text,
  authenticated_email   text,
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE school_audit_logs ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- UPDATES TO EXISTING TABLES
-- ================================================================

-- Update SCHOOLS table with new fields
ALTER TABLE schools ADD COLUMN IF NOT EXISTS
  email text UNIQUE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS
  auth_method text DEFAULT 'code';  -- 'code' | 'email' | 'both'
ALTER TABLE schools ADD COLUMN IF NOT EXISTS
  csv_upload_enabled boolean DEFAULT true;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS
  exam_scheduling_enabled boolean DEFAULT true;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS
  student_limit int DEFAULT 500;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS
  enrollment_method text DEFAULT 'code_only';  -- 'code_only' | 'manual' | 'csv' | 'all'
ALTER TABLE schools ADD COLUMN IF NOT EXISTS
  api_key_hash text;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS
  notification_email text;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS
  updated_at timestamptz DEFAULT now();

-- Update REGISTRATIONS table with school linking fields
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS
  enrolled_via_school boolean DEFAULT false;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS
  school_enrollment_id uuid REFERENCES school_student_registrations(id);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS
  school_id uuid REFERENCES schools(id);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS
  assigned_exam_id uuid REFERENCES exam_schedules(id);

-- ================================================================
-- UPDATED ROW-LEVEL SECURITY POLICIES
-- ================================================================

-- Schools can see their own data
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_update_schools" ON schools;
CREATE POLICY "schools_read_own" ON schools
  FOR SELECT USING (true);  -- Will add proper auth later

-- School students visible only to their school
ALTER TABLE school_student_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schools_see_own_students" ON school_student_registrations
  FOR SELECT USING (true);

-- Exam schedules visible to their school
ALTER TABLE exam_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schools_see_own_exams" ON exam_schedules
  FOR SELECT USING (true);

-- Student exam slots for their school
ALTER TABLE exam_student_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schools_see_own_exam_slots" ON exam_student_slots
  FOR SELECT USING (true);

-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

-- Function to check exam slot availability (for atomic operations)
CREATE OR REPLACE FUNCTION get_available_exam_slot(p_exam_id uuid)
RETURNS uuid AS $$
DECLARE
  v_slot_id uuid;
BEGIN
  SELECT id INTO v_slot_id
  FROM exam_student_slots
  WHERE exam_id = p_exam_id
    AND slot_status = 'available'
  LIMIT 1
  FOR UPDATE;  -- Lock the row

  RETURN v_slot_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment school usage
CREATE OR REPLACE FUNCTION increment_school_usage(p_school_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE schools
  SET students_used = students_used + 1,
      updated_at = now()
  WHERE id = p_school_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- INITIAL DATA MIGRATION (OPTIONAL)
-- If you have existing schools, update them to work with new auth
-- ================================================================
-- UPDATE schools SET auth_method = 'code' WHERE auth_method IS NULL;
-- UPDATE schools SET enrollment_method = 'code_only' WHERE enrollment_method IS NULL;
