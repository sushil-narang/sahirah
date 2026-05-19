-- ================================================================
-- Sahirah.in — Supabase Schema
--
-- HOW TO RUN:
--   1. Open your Supabase project dashboard
--   2. Go to SQL Editor → New query
--   3. Paste this entire file and click Run
-- ================================================================

-- 1. REGISTRATIONS
--    One row per child registration. Stores all form fields from the
--    4-step registration flow, plus login credentials (hashed password).
CREATE TABLE IF NOT EXISTS registrations (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  reg_id           text        UNIQUE NOT NULL,           -- e.g. SHR-AB3XY7
  child_first_name text        NOT NULL,
  child_last_name  text        NOT NULL,
  child_dob        text,
  child_gender     text,
  child_class      text        NOT NULL,
  child_age        text,
  child_school     text,
  child_city       text,
  child_state      text,
  parent_name      text,
  parent_mobile    text,
  parent_email     text        NOT NULL,
  parent_rel       text,
  referral         text,
  login_id         text        UNIQUE NOT NULL,
  password_hash    text        NOT NULL,                  -- SHA-256 with salt, never plaintext
  slot             text,                                  -- e.g. "15 Apr · 10:00 AM"
  test_language    text        DEFAULT 'english',
  test_device      text,
  status           text        DEFAULT 'Registered',      -- Registered | Scheduled | In Progress | Completed | Cancelled
  created_at       timestamptz DEFAULT now()
);

-- 2. DISCOVERY ANSWERS
--    The 12 pre-assessment questions answered during registration step 2.
--    One row per question per registration.
CREATE TABLE IF NOT EXISTS discovery_answers (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reg_id        text NOT NULL REFERENCES registrations(reg_id) ON DELETE CASCADE,
  question_key  text NOT NULL,   -- e.g. q1, q2, q7_rank, q12
  answer_value  text NOT NULL    -- value or comma-separated rank order
);

-- 3. TEST SESSIONS
--    Created when a child starts the 2-hour evaluation.
--    One row per sitting (a child may have multiple if they retake).
CREATE TABLE IF NOT EXISTS test_sessions (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  reg_id       text        NOT NULL REFERENCES registrations(reg_id) ON DELETE CASCADE,
  started_at   timestamptz DEFAULT now(),
  completed_at timestamptz,
  status       text        DEFAULT 'in_progress'   -- in_progress | completed | abandoned
);

-- 4. TEST RESPONSES
--    Every individual question answer during the evaluation.
--    One row per question answered.
CREATE TABLE IF NOT EXISTS test_responses (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    uuid        NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  question_id   text        NOT NULL,    -- e.g. apt-001, per-003
  question_type text        NOT NULL,    -- apt | per | eq | int | val | sit
  answer_value  text        NOT NULL,    -- option letter, score 1-5, or JSON array for ranking
  answered_at   timestamptz DEFAULT now()
);

-- ================================================================
-- ROW-LEVEL SECURITY
-- The anon key is embedded in the frontend (unavoidable for a static
-- site). RLS prevents a caller with the anon key from doing more than
-- the app needs. Policies below are permissive for the MVP; tighten
-- them when you add proper Supabase Auth.
-- ================================================================
ALTER TABLE registrations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_responses    ENABLE ROW LEVEL SECURITY;

-- Registrations: anyone can register (INSERT), anyone can look up by loginId (SELECT)
CREATE POLICY "anon_insert_reg"  ON registrations     FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_select_reg"  ON registrations     FOR SELECT USING     (true);

-- Discovery answers
CREATE POLICY "anon_insert_disc" ON discovery_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_select_disc" ON discovery_answers FOR SELECT USING     (true);

-- Test sessions
CREATE POLICY "anon_insert_sess" ON test_sessions     FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_sess" ON test_sessions     FOR UPDATE USING     (true);
CREATE POLICY "anon_select_sess" ON test_sessions     FOR SELECT USING     (true);

-- Test responses
CREATE POLICY "anon_insert_resp" ON test_responses    FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_select_resp" ON test_responses    FOR SELECT USING     (true);

-- ================================================================
-- 5. CSE QUESTION ATTEMPTS
--    Per-question detail for every CSE aptitude submission.
--    One row per question per attempt — includes answer and time.
-- ================================================================
CREATE TABLE IF NOT EXISTS cse_question_attempts (
  id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id           text        NOT NULL,
  user_id              text,
  user_name            text,
  user_email           text,
  question_id          text        NOT NULL,
  section_name         text,
  difficulty           text,
  question_short       text,        -- first 80 chars of question text
  user_answer_index    int,         -- 0-3, NULL if skipped
  user_answer_text     text,        -- text of the selected option
  correct_answer_index int,
  is_correct           boolean,
  time_spent_seconds   int          DEFAULT 0,
  submitted_at         timestamptz  DEFAULT now()
);

ALTER TABLE cse_question_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_insert_cse_att" ON cse_question_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_select_cse_att" ON cse_question_attempts FOR SELECT USING     (true);

-- ================================================================
-- HYBRID REVENUE MODEL TABLES
-- ================================================================

-- 6. SCHOOLS (B2B model)
CREATE TABLE IF NOT EXISTS schools (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  school_code    text        UNIQUE NOT NULL,   -- e.g. SCH-DPS-001, used by students to unlock
  school_name    text        NOT NULL,
  contact_name   text,
  contact_email  text,
  contact_mobile text,
  city           text,
  state          text,
  plan           text        DEFAULT 'premium', -- 'basic' | 'premium'
  student_quota  int         DEFAULT 100,
  students_used  int         DEFAULT 0,
  is_active      bool        DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_schools" ON schools FOR SELECT USING (true);
CREATE POLICY "anon_insert_schools" ON schools FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_schools" ON schools FOR UPDATE USING (true);

-- 7. COUNSELORS / FRANCHISE NETWORK
CREATE TABLE IF NOT EXISTS counselors (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  counselor_code  text        UNIQUE NOT NULL,  -- e.g. CNS-001
  name            text        NOT NULL,
  email           text,
  mobile          text,
  city            text,
  commission_pct  int         DEFAULT 20,
  is_active       bool        DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE counselors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_counselors" ON counselors FOR SELECT USING (true);
CREATE POLICY "anon_insert_counselors" ON counselors FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_counselors" ON counselors FOR UPDATE USING (true);

-- 8. COUPON CODES (Scholarships + Discounts)
CREATE TABLE IF NOT EXISTS coupon_codes (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  code           text        UNIQUE NOT NULL,
  type           text        NOT NULL,          -- 'scholarship' | 'discount' | 'school' | 'counselor'
  discount_pct   int         DEFAULT 0,         -- 0-100 (100 = free)
  unlocks_tier   text        DEFAULT 'premium', -- 'basic' | 'premium'
  school_id      uuid        REFERENCES schools(id),
  counselor_id   uuid        REFERENCES counselors(id),
  is_active      bool        DEFAULT true,
  usage_limit    int,                           -- NULL = unlimited
  used_count     int         DEFAULT 0,
  expires_at     timestamptz,
  note           text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_coupons" ON coupon_codes FOR SELECT USING (true);
CREATE POLICY "anon_insert_coupons" ON coupon_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_coupons" ON coupon_codes FOR UPDATE USING (true);

-- 9. PAYMENTS / ACCESS RECORDS
CREATE TABLE IF NOT EXISTS payments (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  reg_id         text        REFERENCES registrations(reg_id) ON DELETE CASCADE,
  amount_paise   int         NOT NULL DEFAULT 0,  -- original amount in paise
  final_paise    int         NOT NULL DEFAULT 0,  -- after discount
  coupon_code    text,
  discount_pct   int         DEFAULT 0,
  access_type    text        NOT NULL,             -- 'free'|'basic'|'premium'|'school'|'counselor'|'scholarship'
  school_id      uuid        REFERENCES schools(id),
  counselor_id   uuid        REFERENCES counselors(id),
  payment_status text        DEFAULT 'pending',    -- 'pending'|'completed'|'failed'|'free'
  payment_id     text,                             -- gateway transaction ID
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_insert_payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_select_payments" ON payments FOR SELECT USING (true);
CREATE POLICY "anon_update_payments" ON payments FOR UPDATE USING (true);

-- 10. Add access fields to registrations
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS access_type   text DEFAULT 'free';
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS access_code   text;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS school_id     uuid REFERENCES schools(id);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS counselor_id  uuid REFERENCES counselors(id);
