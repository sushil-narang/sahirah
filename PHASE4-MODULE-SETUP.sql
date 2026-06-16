-- ============================================================================
-- PHASE 4: Add New Assessment Modules to Database
-- Date: 2026-06-16
-- ============================================================================
-- This SQL adds 4 new assessment modules to support the expanded assessment.
-- Run this in Supabase Query Editor before uploading JSON questions.
-- ============================================================================

-- Create assessment_modules table if it doesn't exist
CREATE TABLE IF NOT EXISTS assessment_modules (
  id SERIAL PRIMARY KEY,
  module_id VARCHAR(20) UNIQUE NOT NULL,
  module_name VARCHAR(100) NOT NULL,
  description TEXT,
  question_count INT,
  scoring_type VARCHAR(50),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert the 6 original modules (if not already present)
INSERT INTO assessment_modules (module_id, module_name, description, question_count, scoring_type, active)
VALUES
  ('aptitude', 'Aptitude Assessment', 'Measures raw reasoning, logical thinking, and problem-solving depth', NULL, 'mixed', true),
  ('personality', 'Personality Profile', 'Understanding thinking, communication, and relational styles', NULL, 'likert_scale', true),
  ('interest', 'Interest Inventory', 'Discovers natural interests and genuine passion areas', NULL, 'categorical', true),
  ('eq', 'Emotional Intelligence', 'Assesses self-awareness, empathy, stress response, and performance under pressure', NULL, 'likert_scale', true),
  ('values', 'Values & Motivation', 'Uncovers what your child fundamentally values in a life''s work', NULL, 'categorical', true),
  ('situational', 'Situational Judgement', 'Real-life scenarios revealing decision-making instincts and professional character', NULL, 'likert_scale', true)
ON CONFLICT (module_id) DO NOTHING;

-- Insert the 4 NEW Phase 4 modules
INSERT INTO assessment_modules (module_id, module_name, description, question_count, scoring_type, active)
VALUES
  ('learning_style', 'Learning Style', 'Identify how you learn best: Visual, Auditory, Reading/Writing, or Kinesthetic', 12, 'categorical', true),
  ('resilience', 'Resilience Index', 'Measure your ability to handle stress, bounce back from challenges, and persist through difficulties', 18, 'likert_scale', true),
  ('creativity', 'Creativity Index', 'Assess your creative thinking, innovation, and ability to generate original solutions', 16, 'likert_scale', true),
  ('leadership', 'Leadership Readiness', 'Evaluate your potential to lead, influence, and manage teams effectively', 16, 'likert_scale', true)
ON CONFLICT (module_id) DO NOTHING;

-- Create a module_questions table to link questions to modules (optional, for organization)
CREATE TABLE IF NOT EXISTS module_questions (
  id SERIAL PRIMARY KEY,
  module_id VARCHAR(20) NOT NULL,
  question_id VARCHAR(50) NOT NULL,
  question_text TEXT,
  question_type VARCHAR(50),
  options JSONB,
  scoring_dimension VARCHAR(100),
  difficulty VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES assessment_modules(module_id),
  UNIQUE(module_id, question_id)
);

-- Verify the modules were inserted
SELECT module_id, module_name, question_count, scoring_type, active
FROM assessment_modules
ORDER BY module_id;
