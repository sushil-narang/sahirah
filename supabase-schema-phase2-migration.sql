-- ================================================================
-- Phase 2A — test_sessions schema expansion for server-side scoring
-- Sahirah.in — generated for manual review and execution in the
-- Supabase SQL editor. Not executed automatically.
-- ================================================================

ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS answers_json JSONB;
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS score_json JSONB;
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS primary_stream TEXT;
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS report_generated BOOLEAN DEFAULT false;
