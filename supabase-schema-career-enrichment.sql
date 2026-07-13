-- ================================================================
-- career_profiles enrichment — display metadata for report cards
-- (title/color/exams/why used by score-test.js's top_careers output)
-- ================================================================

-- STEP 1: ALTER TABLE
ALTER TABLE career_profiles ADD COLUMN IF NOT EXISTS display_color TEXT DEFAULT '#C8860A';
ALTER TABLE career_profiles ADD COLUMN IF NOT EXISTS why_text TEXT DEFAULT '';
ALTER TABLE career_profiles ADD COLUMN IF NOT EXISTS exams TEXT[] DEFAULT '{}';

-- STEP 2: Seed display_color from stream (mechanical — reuses the stream
-- colors that used to live in report/index.html's computeScores())
UPDATE career_profiles SET display_color = CASE stream_code
  WHEN 'non' THEN '#1A5FA8' WHEN 'med' THEN '#7B2FBE'
  WHEN 'com' THEN '#0A6B5E' WHEN 'hum' THEN '#C0410A' END;

-- STEP 3: Seed exams per career (mechanical — reuses the old EXAMS object
-- that used to live in report/index.html's computeScores())
UPDATE career_profiles SET exams = CASE id
  WHEN 'c001' THEN ARRAY['JEE Main','JEE Advanced','BITSAT']
  WHEN 'c002' THEN ARRAY['JEE Main','JEE Advanced','VITEEE']
  WHEN 'c003' THEN ARRAY['JEE Main','JEE Advanced','GATE']
  WHEN 'c004' THEN ARRAY['JEE Main','JEE Advanced','GATE']
  WHEN 'c005' THEN ARRAY['JEE Paper 2','NATA','CEED']
  WHEN 'c006' THEN ARRAY['JEE Main','JEE Advanced','BITSAT']
  WHEN 'c007' THEN ARRAY['NEET UG']
  WHEN 'c008' THEN ARRAY['NEET UG']
  WHEN 'c009' THEN ARRAY['NEET UG','GPAT']
  WHEN 'c010' THEN ARRAY['NEET','JEE','CUET']
  WHEN 'c011' THEN ARRAY['NEET','CUET']
  WHEN 'c012' THEN ARRAY['UPSC CSE','State PSC']
  WHEN 'c013' THEN ARRAY['CLAT','AILET','LSAT India']
  WHEN 'c014' THEN ARRAY['NID','NIFT','CEED']
  WHEN 'c015' THEN ARRAY['IIMC','ACJ','XIC']
  WHEN 'c016' THEN ARRAY['CUET','NIMHANS','MA Psychology']
  WHEN 'c017' THEN ARRAY['CA Foundation','CA Intermediate']
  WHEN 'c018' THEN ARRAY['CS Foundation']
  WHEN 'c019' THEN ARRAY['CAT','XAT','SNAP']
  WHEN 'c020' THEN ARRAY['CFA','FRM','MBA Finance']
  WHEN 'c021' THEN ARRAY['Startup India','IIM Programs']
END;

-- why_text intentionally left at its '' default — real per-career copy
-- comes from psycho.docx in Phase 5. The generic fallback sentence built
-- into score-test.js's enrichment step covers this until then.

-- STEP 4: Seed degrees per career (mechanical, factual — same category as
-- exams above). Added for Phase 6 Step 7 (S6 Wildcard / S7 career breakdown).
UPDATE career_profiles SET degrees = CASE id
  WHEN 'c001' THEN 'B.Tech Computer Science, B.Tech AI & ML, BS Computer Science'
  WHEN 'c002' THEN 'B.Tech Electronics & Communication, B.Tech Electrical Engineering'
  WHEN 'c003' THEN 'B.Tech Civil Engineering'
  WHEN 'c004' THEN 'B.Tech Mechanical Engineering'
  WHEN 'c005' THEN 'B.Arch'
  WHEN 'c006' THEN 'B.Tech Robotics, B.Tech Mechatronics'
  WHEN 'c007' THEN 'MBBS'
  WHEN 'c008' THEN 'BDS'
  WHEN 'c009' THEN 'B.Pharm'
  WHEN 'c010' THEN 'B.Tech Biotechnology, B.Sc Biotechnology'
  WHEN 'c011' THEN 'BPT (Bachelor of Physiotherapy)'
  WHEN 'c012' THEN 'BA Political Science, BA Public Administration (any degree + UPSC)'
  WHEN 'c013' THEN 'BA LLB, LLB'
  WHEN 'c014' THEN 'B.Des'
  WHEN 'c015' THEN 'BA Journalism & Mass Communication'
  WHEN 'c016' THEN 'BA Psychology, BSc Psychology'
  WHEN 'c017' THEN 'B.Com + CA'
  WHEN 'c018' THEN 'B.Com + CS'
  WHEN 'c019' THEN 'BBA, B.Com + MBA'
  WHEN 'c020' THEN 'B.Com + CFA, BBA Finance'
  WHEN 'c021' THEN 'BBA, B.Com (any degree)'
END;
