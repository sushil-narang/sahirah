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
