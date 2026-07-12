-- ================================================================
-- Phase 2B-pre — career_profiles table, seeded from the legacy
-- CAREERS object in assets/js/scoring.js (21 careers, 22 of 29
-- dimensions mapped; 8 dimensions default to 0 weight until the
-- full 100-career psycho.docx dataset replaces this in Phase 5).
-- ================================================================

-- STEP 1: CREATE TABLE
CREATE TABLE IF NOT EXISTS career_profiles (
  id TEXT PRIMARY KEY,           -- c001..c021 for now
  name TEXT NOT NULL,
  stream_code TEXT NOT NULL,     -- non|med|com|hum
  degrees TEXT DEFAULT '',
  -- 29 weight columns, all NUMERIC DEFAULT 0
  weight_apt_numerical NUMERIC DEFAULT 0,
  weight_apt_logical NUMERIC DEFAULT 0,
  weight_apt_verbal NUMERIC DEFAULT 0,
  weight_apt_spatial NUMERIC DEFAULT 0,
  weight_apt_pattern NUMERIC DEFAULT 0,
  weight_int_investigative NUMERIC DEFAULT 0,
  weight_int_artistic NUMERIC DEFAULT 0,
  weight_int_social NUMERIC DEFAULT 0,
  weight_int_enterprising NUMERIC DEFAULT 0,
  weight_int_realistic NUMERIC DEFAULT 0,
  weight_int_conventional NUMERIC DEFAULT 0,
  weight_per_extraversion NUMERIC DEFAULT 0,
  weight_per_agreeableness NUMERIC DEFAULT 0,
  weight_per_conscientiousness NUMERIC DEFAULT 0,
  weight_per_stability NUMERIC DEFAULT 0,
  weight_per_openness NUMERIC DEFAULT 0,
  weight_eq_empathy NUMERIC DEFAULT 0,
  weight_eq_stress_regulation NUMERIC DEFAULT 0,
  weight_eq_social_skill NUMERIC DEFAULT 0,
  weight_eq_self_awareness NUMERIC DEFAULT 0,
  weight_val_wealth NUMERIC DEFAULT 0,
  weight_val_impact NUMERIC DEFAULT 0,
  weight_val_recognition NUMERIC DEFAULT 0,
  weight_val_growth NUMERIC DEFAULT 0,
  weight_val_stability_value NUMERIC DEFAULT 0,
  weight_val_creativity_value NUMERIC DEFAULT 0,
  weight_emotional_resilience NUMERIC DEFAULT 0,
  weight_leadership NUMERIC DEFAULT 0,
  weight_divergent_thinking NUMERIC DEFAULT 0,
  -- 29 min_req columns, all NUMERIC DEFAULT 0
  min_req_apt_numerical NUMERIC DEFAULT 0,
  min_req_apt_logical NUMERIC DEFAULT 0,
  min_req_apt_verbal NUMERIC DEFAULT 0,
  min_req_apt_spatial NUMERIC DEFAULT 0,
  min_req_apt_pattern NUMERIC DEFAULT 0,
  min_req_int_investigative NUMERIC DEFAULT 0,
  min_req_int_artistic NUMERIC DEFAULT 0,
  min_req_int_social NUMERIC DEFAULT 0,
  min_req_int_enterprising NUMERIC DEFAULT 0,
  min_req_int_realistic NUMERIC DEFAULT 0,
  min_req_int_conventional NUMERIC DEFAULT 0,
  min_req_per_extraversion NUMERIC DEFAULT 0,
  min_req_per_agreeableness NUMERIC DEFAULT 0,
  min_req_per_conscientiousness NUMERIC DEFAULT 0,
  min_req_per_stability NUMERIC DEFAULT 0,
  min_req_per_openness NUMERIC DEFAULT 0,
  min_req_eq_empathy NUMERIC DEFAULT 0,
  min_req_eq_stress_regulation NUMERIC DEFAULT 0,
  min_req_eq_social_skill NUMERIC DEFAULT 0,
  min_req_eq_self_awareness NUMERIC DEFAULT 0,
  min_req_val_wealth NUMERIC DEFAULT 0,
  min_req_val_impact NUMERIC DEFAULT 0,
  min_req_val_recognition NUMERIC DEFAULT 0,
  min_req_val_growth NUMERIC DEFAULT 0,
  min_req_val_stability_value NUMERIC DEFAULT 0,
  min_req_val_creativity_value NUMERIC DEFAULT 0,
  min_req_emotional_resilience NUMERIC DEFAULT 0,
  min_req_leadership NUMERIC DEFAULT 0,
  min_req_divergent_thinking NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- STEP 2: SEED from legacy CAREERS object (assets/js/scoring.js)
-- Only columns with a non-zero value for at least one career are listed;
-- everything else (8 unmapped dimensions + all 29 min_req_ columns) relies
-- on the DEFAULT 0 above and is intentionally not set here.
INSERT INTO career_profiles (
  id, name, stream_code,
  weight_apt_numerical, weight_apt_logical, weight_apt_verbal, weight_apt_spatial, weight_apt_pattern,
  weight_int_investigative, weight_int_artistic, weight_int_social, weight_int_enterprising,
  weight_int_realistic, weight_int_conventional,
  weight_per_extraversion, weight_per_agreeableness, weight_per_conscientiousness, weight_per_openness,
  weight_eq_empathy,
  weight_val_wealth, weight_val_impact, weight_val_stability_value, weight_val_creativity_value,
  weight_leadership
) VALUES
  ('c001','Computer Science / AI','non',           0.8,0.9,0,  0,  0.9, 0.8,0,  0,  0,  0,  0,   0,0,0,0,     0,   0,0,0,0.7,     0),
  ('c002','Electronics Engineering','non',         0.8,0.8,0,  0.9,0.7, 0,  0,  0,  0,  0.8,0,   0,0,0,0,     0,   0,0,0,0,       0),
  ('c003','Civil Engineering','non',                0.8,0,  0,  0.9,0,   0,  0,  0,  0,  0.9,0,   0,0,0.8,0,   0,   0,0,0.7,0,     0),
  ('c004','Mechanical Engineering','non',           0.8,0.7,0,  0.8,0,   0,  0,  0,  0,  0.9,0,   0,0,0.7,0,   0,   0,0,0,0,       0),
  ('c005','Architecture (B.Arch)','non',            0.6,0,  0,  0.9,0,   0,  0.8,0,  0,  0,  0,   0,0,0,0.7,   0,   0,0,0,0.9,     0),
  ('c006','Robotics / Mechatronics','non',          0.7,0.9,0,  0.8,0,   0.9,0,  0,  0,  0.8,0,   0,0,0,0,     0,   0,0,0,0,       0),
  ('c007','MBBS / Medicine','med',                  0,  0,  0,  0,  0,   0.9,0,  0,  0,  0,  0,   0,0.8,0.9,0, 0.8, 0,0,0.7,0,     0),
  ('c008','BDS (Dentistry)','med',                  0,  0,  0,  0.8,0,   0.7,0,  0,  0,  0,  0,   0,0,0.9,0,   0.7, 0,0,0.8,0,     0),
  ('c009','Pharmacy','med',                         0.7,0,  0,  0,  0,   0.8,0,  0,  0,  0,  0.7, 0,0,0.8,0,   0,   0,0,0.8,0,     0),
  ('c010','Biotechnology','med',                    0.7,0.8,0,  0,  0,   0.9,0,  0,  0,  0,  0,   0,0,0,0.8,   0,   0,0,0,0.6,     0),
  ('c011','Physiotherapy','med',                    0,  0,  0,  0,  0,   0,  0,  0.8,0,  0.7,0,   0,0.9,0.7,0, 0.9, 0,0,0,0,       0),
  ('c012','IAS / Civil Services','hum',             0,  0,  0.9,0,  0,   0,  0,  0,  0,  0,  0,   0,0,0.8,0.8, 0,   0,0.9,0,0,     0.9),
  ('c013','Law / Judiciary','hum',                  0,  0.8,0.9,0,  0,   0,  0,  0,  0,  0,  0,   0,0.6,0.8,0, 0,   0,0,0,0,       0.7),
  ('c014','B.Des / UX Design','hum',                0,  0,  0,  0.7,0,   0,  0.9,0.6,0,  0,  0,   0,0,0,0.8,   0,   0,0,0,0.9,     0),
  ('c015','Journalism / Media','hum',                0,  0,  0.9,0,  0,   0,  0,  0.7,0,  0,  0,   0.8,0,0,0.8, 0,   0,0,0,0.7,     0),
  ('c016','Psychology / Counselling','hum',          0,  0,  0.8,0,  0,   0,  0,  0.9,0,  0,  0,   0,0.9,0,0.7, 0.9, 0,0,0,0,       0),
  ('c017','CA (Chartered Accountant)','com',        0.9,0,  0,  0,  0,   0,  0,  0,  0,  0,  0.8, 0,0,0.9,0,   0,   0.7,0,0.8,0,   0),
  ('c018','CS (Company Secretary)','com',           0.7,0,  0.7,0,  0,   0,  0,  0,  0,  0,  0.9, 0,0,0.9,0,   0,   0,0,0.7,0,     0),
  ('c019','MBA / Finance','com',                    0.8,0,  0,  0,  0,   0,  0,  0,  0.9,0,  0,   0.7,0,0,0,   0,   0.8,0,0,0,     0.8),
  ('c020','Investment Banking / CFA','com',         0.9,0.8,0,  0,  0,   0,  0,  0,  0.8,0,  0,   0,0,0.8,0,   0,   0.9,0,0,0,     0),
  ('c021','Entrepreneurship','com',                 0,  0,  0,  0,  0,   0,  0,  0,  0.9,0,  0,   0,0,0,0.8,   0,   0.7,0,0,0.8,   0.9)
ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name, stream_code=EXCLUDED.stream_code,
  weight_apt_numerical=EXCLUDED.weight_apt_numerical, weight_apt_logical=EXCLUDED.weight_apt_logical,
  weight_apt_verbal=EXCLUDED.weight_apt_verbal, weight_apt_spatial=EXCLUDED.weight_apt_spatial,
  weight_apt_pattern=EXCLUDED.weight_apt_pattern,
  weight_int_investigative=EXCLUDED.weight_int_investigative, weight_int_artistic=EXCLUDED.weight_int_artistic,
  weight_int_social=EXCLUDED.weight_int_social, weight_int_enterprising=EXCLUDED.weight_int_enterprising,
  weight_int_realistic=EXCLUDED.weight_int_realistic, weight_int_conventional=EXCLUDED.weight_int_conventional,
  weight_per_extraversion=EXCLUDED.weight_per_extraversion, weight_per_agreeableness=EXCLUDED.weight_per_agreeableness,
  weight_per_conscientiousness=EXCLUDED.weight_per_conscientiousness, weight_per_openness=EXCLUDED.weight_per_openness,
  weight_eq_empathy=EXCLUDED.weight_eq_empathy,
  weight_val_wealth=EXCLUDED.weight_val_wealth, weight_val_impact=EXCLUDED.weight_val_impact,
  weight_val_stability_value=EXCLUDED.weight_val_stability_value, weight_val_creativity_value=EXCLUDED.weight_val_creativity_value,
  weight_leadership=EXCLUDED.weight_leadership;
