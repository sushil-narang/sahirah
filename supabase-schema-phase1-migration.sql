-- ================================================================
-- Phase 1B — Question Bank Migration Schema
-- Sahirah.in — generated for manual review and execution in the
-- Supabase SQL editor. Not executed automatically.
-- ================================================================

-- 1. Expand module_questions
ALTER TABLE module_questions ADD COLUMN IF NOT EXISTS skill TEXT;
ALTER TABLE module_questions ADD COLUMN IF NOT EXISTS stream_weight JSONB;
ALTER TABLE module_questions ADD COLUMN IF NOT EXISTS core BOOLEAN DEFAULT true;
ALTER TABLE module_questions ADD COLUMN IF NOT EXISTS scoring_scheme TEXT;
ALTER TABLE module_questions ADD COLUMN IF NOT EXISTS option_skills JSONB;
ALTER TABLE module_questions ADD COLUMN IF NOT EXISTS option_scores JSONB;
ALTER TABLE module_questions ADD COLUMN IF NOT EXISTS tier INTEGER;
ALTER TABLE module_questions ADD COLUMN IF NOT EXISTS ans INTEGER DEFAULT -1;
ALTER TABLE module_questions ADD COLUMN IF NOT EXISTS scale JSONB;
ALTER TABLE module_questions ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE module_questions ADD COLUMN IF NOT EXISTS rows JSONB;
ALTER TABLE module_questions ADD COLUMN IF NOT EXISTS cols JSONB;

-- 2. Expand assessment_modules
ALTER TABLE assessment_modules ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE assessment_modules ADD COLUMN IF NOT EXISTS dot TEXT;
ALTER TABLE assessment_modules ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE assessment_modules ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. New reference table: stream_profiles
CREATE TABLE IF NOT EXISTS stream_profiles (
  stream_code TEXT PRIMARY KEY,
  stream_name TEXT NOT NULL,
  apt_numerical NUMERIC, apt_logical NUMERIC, apt_verbal NUMERIC,
  apt_spatial NUMERIC, apt_pattern NUMERIC,
  int_investigative NUMERIC, int_artistic NUMERIC, int_social NUMERIC,
  int_enterprising NUMERIC, int_realistic NUMERIC, int_conventional NUMERIC,
  per_extraversion NUMERIC, per_agreeableness NUMERIC,
  per_conscientiousness NUMERIC, per_stability NUMERIC, per_openness NUMERIC,
  eq_empathy NUMERIC, eq_stress_regulation NUMERIC,
  eq_social_skill NUMERIC, eq_self_awareness NUMERIC,
  val_wealth NUMERIC, val_impact NUMERIC, val_recognition NUMERIC,
  val_growth NUMERIC, val_stability_value NUMERIC, val_creativity_value NUMERIC,
  emotional_resilience NUMERIC, leadership NUMERIC, divergent_thinking NUMERIC
);

INSERT INTO stream_profiles VALUES
('non','Non-Medical',90,90,60,85,85,90,40,50,65,80,55,60,50,75,75,85,45,80,60,60,70,60,70,90,60,70,75,70,75),
('med','Medical',70,80,65,80,70,85,30,90,50,50,60,70,85,90,95,65,95,95,85,85,60,90,70,75,75,40,90,70,40),
('com','Commerce',95,75,65,50,70,65,30,60,90,40,95,85,55,90,80,60,60,85,85,75,95,50,85,85,85,45,80,90,50),
('hum','Humanities',45,75,95,60,55,55,90,85,70,30,45,80,80,65,70,90,85,70,85,85,35,95,80,70,65,90,75,85,90)
ON CONFLICT (stream_code) DO UPDATE SET stream_name = EXCLUDED.stream_name;

-- 4. New table: skill_scores
CREATE TABLE IF NOT EXISTS skill_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES test_sessions(id),
  reg_id TEXT NOT NULL,
  skill_scores_json JSONB NOT NULL,
  stream_scores_json JSONB NOT NULL,
  top_careers_json JSONB NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT now()
);

-- 5. New table: validators
CREATE TABLE IF NOT EXISTS validators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  expertise TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. New table: question_feedback
CREATE TABLE IF NOT EXISTS question_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id TEXT NOT NULL,
  validator_id UUID NOT NULL REFERENCES validators(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  skill_correct BOOLEAN,
  suggested_skill TEXT,
  language_clarity INTEGER CHECK (language_clarity BETWEEN 1 AND 5),
  age_appropriateness INTEGER CHECK (age_appropriateness BETWEEN 1 AND 5),
  feedback_text TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(question_id, validator_id)
);

-- 7. Post-seed fix: module_questions had only a composite UNIQUE(module_id, question_id)
-- constraint, but seed-questions.js upserts ON CONFLICT (question_id) alone — question_id
-- is already globally unique by convention (e.g. 'aptitude_000'), so add a matching
-- single-column constraint. Applied 2026-07-12, after the Phase 1C seed run failed with
-- "no unique or exclusion constraint matching the ON CONFLICT specification".
ALTER TABLE module_questions ADD CONSTRAINT module_questions_question_id_key UNIQUE (question_id);
