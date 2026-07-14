-- Merchant Navy careers — Part B Change 3
-- All weight_* columns not explicitly listed default to 0.05 (Q5).
-- min_req_* columns not listed are omitted (scoring code already does `career['min_req_'+dim] || 0`).
-- Run manually in the Supabase SQL editor. Verify these min_req_* columns exist
-- first (\d career_profiles) — their existence was inferred from score-test.js's
-- generic `career['min_req_' + dim] || 0` access pattern, not confirmed against
-- the live schema.

INSERT INTO career_profiles (
  id, name, stream_code, degrees, exams, display_color, why_text,
  weight_apt_numerical, weight_apt_logical, weight_apt_verbal, weight_apt_spatial, weight_apt_pattern,
  weight_int_investigative, weight_int_artistic, weight_int_social, weight_int_enterprising, weight_int_realistic, weight_int_conventional,
  weight_per_extraversion, weight_per_agreeableness, weight_per_conscientiousness, weight_per_stability, weight_per_openness,
  weight_eq_empathy, weight_eq_stress_regulation, weight_eq_social_skill, weight_eq_self_awareness,
  weight_val_wealth, weight_val_impact, weight_val_recognition, weight_val_growth, weight_val_stability_value, weight_val_creativity_value,
  weight_emotional_resilience, weight_leadership, weight_divergent_thinking,
  min_req_apt_numerical, min_req_apt_spatial, min_req_per_conscientiousness,
  min_req_per_stability, min_req_emotional_resilience
) VALUES
(
  'c101', 'Marine Engineer', 'non',
  'B.Tech Marine Engineering; B.Tech Naval Architecture',
  ARRAY['IMU CET', 'JEE Main', 'TMI-SAT', 'AIMNET'],
  '#1A5FA8',
  'Strong match for your non profile.',
  0.85, 0.80, 0.05, 0.80, 0.70,
  0.05, 0.05, 0.05, 0.05, 0.05, 0.05,
  0.05, 0.05, 0.95, 0.90, 0.05,
  0.05, 0.90, 0.05, 0.05,
  0.85, 0.05, 0.05, 0.05, 0.05, 0.05,
  0.95, 0.70, 0.05,
  60, NULL, 70, NULL, 60
),
(
  'c102', 'Nautical Science Officer', 'non',
  'B.Sc Nautical Science; DNS (Diploma in Nautical Science)',
  ARRAY['IMU CET', 'AIMNET', 'TMI Exam'],
  '#1A5FA8',
  'Strong match for your non profile.',
  0.75, 0.80, 0.05, 0.85, 0.05,
  0.05, 0.05, 0.05, 0.05, 0.05, 0.05,
  0.05, 0.05, 0.90, 0.95, 0.05,
  0.05, 0.90, 0.05, 0.05,
  0.80, 0.05, 0.05, 0.05, 0.05, 0.05,
  0.95, 0.75, 0.05,
  NULL, NULL, NULL, 65, 65
),
(
  'c103', 'Naval Architect', 'non',
  'B.Tech Naval Architecture & Ocean Engineering',
  ARRAY['IMU CET', 'JEE Main', 'NATA'],
  '#1A5FA8',
  'Strong match for your non profile.',
  0.85, 0.85, 0.05, 0.95, 0.80,
  0.05, 0.05, 0.05, 0.05, 0.05, 0.05,
  0.05, 0.05, 0.85, 0.05, 0.75,
  0.05, 0.05, 0.05, 0.05,
  0.05, 0.05, 0.05, 0.05, 0.05, 0.70,
  0.05, 0.05, 0.75,
  60, 65, NULL, NULL, NULL
);
