/**
 * Sahirah.in — Scoring Engine
 * Two-stage scoring: Stream identification → Career matching
 *
 * Stage 1: Compute stream probability scores from aptitude + interest + personality
 * Stage 2: Compute career fit within the primary stream
 */

// ============================================================
// STREAM WEIGHTS
// Maps each question trait to stream affinity scores (0–1)
// ============================================================
const STREAM_WEIGHTS = {
  // Aptitude traits
  logical:           { non: 0.9, med: 0.6, com: 0.5, hum: 0.4 },
  numerical:         { non: 0.8, med: 0.5, com: 0.9, hum: 0.3 },
  verbal:            { non: 0.4, med: 0.5, com: 0.6, hum: 0.9 },
  spatial:           { non: 0.9, med: 0.5, com: 0.3, hum: 0.5 },
  pattern:           { non: 0.8, med: 0.7, com: 0.5, hum: 0.4 },

  // Personality traits
  openness:          { non: 0.6, med: 0.6, com: 0.5, hum: 0.8 },
  conscientiousness: { non: 0.7, med: 0.9, com: 0.8, hum: 0.7 },
  extraversion:      { non: 0.4, med: 0.6, com: 0.7, hum: 0.8 },
  agreeableness:     { non: 0.5, med: 0.8, com: 0.6, hum: 0.7 },

  // RIASEC interest traits
  realistic:         { non: 0.9, med: 0.5, com: 0.3, hum: 0.4 },
  investigative:     { non: 0.8, med: 0.9, com: 0.5, hum: 0.6 },
  artistic:          { non: 0.5, med: 0.3, com: 0.4, hum: 0.8 },
  social:            { non: 0.3, med: 0.7, com: 0.6, hum: 0.9 },
  enterprising:      { non: 0.4, med: 0.4, com: 0.9, hum: 0.7 },
  conventional:      { non: 0.5, med: 0.6, com: 0.8, hum: 0.5 },

  // EQ traits
  empathy:           { non: 0.4, med: 0.9, com: 0.6, hum: 0.8 },
  leadership:        { non: 0.6, med: 0.5, com: 0.7, hum: 0.9 },

  // Values
  impact:            { non: 0.6, med: 0.8, com: 0.5, hum: 0.9 },
  wealth:            { non: 0.5, med: 0.5, com: 0.9, hum: 0.4 },
  creativity:        { non: 0.7, med: 0.4, com: 0.5, hum: 0.8 },
  stability:         { non: 0.5, med: 0.6, com: 0.7, hum: 0.8 },
};

// ============================================================
// CAREER FIT MATRIX
// Career → required traits with weights
// ============================================================
const CAREERS = {
  'Computer Science / AI':    { stream: 'non', traits: { logical:0.9, numerical:0.8, pattern:0.9, investigative:0.8, creativity:0.7 } },
  'Electronics Engineering':  { stream: 'non', traits: { logical:0.8, spatial:0.9, numerical:0.8, realistic:0.8, pattern:0.7 } },
  'Civil Engineering':        { stream: 'non', traits: { spatial:0.9, numerical:0.8, realistic:0.9, conscientiousness:0.8, stability:0.7 } },
  'Mechanical Engineering':   { stream: 'non', traits: { spatial:0.8, numerical:0.8, realistic:0.9, logical:0.7, conscientiousness:0.7 } },
  'Architecture (B.Arch)':    { stream: 'non', traits: { spatial:0.9, artistic:0.8, creativity:0.9, numerical:0.6, openness:0.7 } },
  'Robotics / Mechatronics':  { stream: 'non', traits: { logical:0.9, spatial:0.8, investigative:0.9, realistic:0.8, numerical:0.7 } },

  'MBBS / Medicine':          { stream: 'med', traits: { investigative:0.9, conscientiousness:0.9, empathy:0.8, agreeableness:0.8, stability:0.7 } },
  'BDS (Dentistry)':          { stream: 'med', traits: { spatial:0.8, conscientiousness:0.9, empathy:0.7, investigative:0.7, stability:0.8 } },
  'Pharmacy':                 { stream: 'med', traits: { investigative:0.8, numerical:0.7, conscientiousness:0.8, conventional:0.7, stability:0.8 } },
  'Biotechnology':            { stream: 'med', traits: { investigative:0.9, logical:0.8, numerical:0.7, openness:0.8, creativity:0.6 } },
  'Physiotherapy':            { stream: 'med', traits: { empathy:0.9, agreeableness:0.9, realistic:0.7, social:0.8, conscientiousness:0.7 } },

  'IAS / Civil Services':     { stream: 'hum', traits: { verbal:0.9, leadership:0.9, openness:0.8, impact:0.9, conscientiousness:0.8 } },
  'Law / Judiciary':          { stream: 'hum', traits: { verbal:0.9, logical:0.8, agreeableness:0.6, leadership:0.7, conscientiousness:0.8 } },
  'B.Des / UX Design':        { stream: 'hum', traits: { artistic:0.9, creativity:0.9, spatial:0.7, openness:0.8, social:0.6 } },
  'Journalism / Media':       { stream: 'hum', traits: { verbal:0.9, extraversion:0.8, openness:0.8, social:0.7, creativity:0.7 } },
  'Psychology / Counselling': { stream: 'hum', traits: { empathy:0.9, agreeableness:0.9, verbal:0.8, social:0.9, openness:0.7 } },

  'CA (Chartered Accountant)': { stream: 'com', traits: { numerical:0.9, conscientiousness:0.9, conventional:0.8, wealth:0.7, stability:0.8 } },
  'CS (Company Secretary)':    { stream: 'com', traits: { verbal:0.7, conscientiousness:0.9, conventional:0.9, numerical:0.7, stability:0.7 } },
  'MBA / Finance':             { stream: 'com', traits: { numerical:0.8, leadership:0.8, enterprising:0.9, wealth:0.8, extraversion:0.7 } },
  'Investment Banking / CFA':  { stream: 'com', traits: { numerical:0.9, logical:0.8, enterprising:0.8, wealth:0.9, conscientiousness:0.8 } },
  'Entrepreneurship':          { stream: 'com', traits: { enterprising:0.9, leadership:0.9, creativity:0.8, openness:0.8, wealth:0.7 } },
};

// ============================================================
// STAGE 1 — computeStreamScores(traitScores)
// @param traitScores: { logical: 88, numerical: 82, ... }
// @returns { non: 72, med: 18, com: 8, hum: 2 }
// ============================================================
function computeStreamScores(traitScores) {
  const streams = { non: 0, med: 0, com: 0, hum: 0 };
  const weights = { non: 0, med: 0, com: 0, hum: 0 };

  Object.entries(traitScores).forEach(([trait, score]) => {
    const w = STREAM_WEIGHTS[trait];
    if (!w) return;
    Object.keys(streams).forEach(s => {
      streams[s] += score * w[s];
      weights[s] += 100 * w[s];
    });
  });

  // Normalise to percentages that sum to 100
  const raw = {};
  Object.keys(streams).forEach(s => {
    raw[s] = weights[s] > 0 ? (streams[s] / weights[s]) * 100 : 0;
  });

  const total = Object.values(raw).reduce((a, b) => a + b, 0);
  const result = {};
  Object.keys(raw).forEach(s => {
    result[s] = Math.round((raw[s] / total) * 100);
  });

  return result;
}

// ============================================================
// STAGE 2 — computeCareerFit(traitScores, primaryStream)
// @returns top 3 careers with fit scores
// ============================================================
function computeCareerFit(traitScores, primaryStream) {
  const careerScores = [];

  Object.entries(CAREERS).forEach(([career, config]) => {
    if (config.stream !== primaryStream) return;

    let score = 0;
    let totalWeight = 0;

    Object.entries(config.traits).forEach(([trait, weight]) => {
      const traitScore = traitScores[trait] || 50;
      score += traitScore * weight;
      totalWeight += 100 * weight;
    });

    const fit = Math.round((score / totalWeight) * 100);
    careerScores.push({ career, fit, stream: primaryStream });
  });

  return careerScores.sort((a, b) => b.fit - a.fit).slice(0, 3);
}

// ============================================================
// FULL SCORING PIPELINE
// @param answers: { "0_0": 1, "0_1": 3, ... } (from localStorage)
// @returns complete scores object
// ============================================================
function runScoringPipeline(answers) {
  // Derive raw trait scores from answer keys
  // (In production, this would use proper psychometric scoring algorithms)
  const traitScores = {
    logical:           deriveTrait(answers, '0_', [0,3,8,9,14], 100),
    numerical:         deriveTrait(answers, '0_', [2,5,10,11,15], 100),
    verbal:            deriveTrait(answers, '0_', [4,7,12], 100),
    spatial:           deriveTrait(answers, '0_', [6,13,16], 100),
    pattern:           deriveTrait(answers, '0_', [1,17,22], 100),
    openness:          deriveTrait(answers, '1_', [2,10], 5),
    conscientiousness: deriveTrait(answers, '1_', [1,7], 5),
    extraversion:      deriveTrait(answers, '1_', [0,5], 5),
    agreeableness:     deriveTrait(answers, '1_', [3,9], 5),
    neuroticism:       deriveTrait(answers, '1_', [4,10], 5),
    realistic:         deriveTrait(answers, '2_', [2], 5),
    investigative:     deriveTrait(answers, '2_', [5], 5),
    artistic:          deriveTrait(answers, '2_', [7], 5),
    social:            deriveTrait(answers, '2_', [3], 5),
    enterprising:      deriveTrait(answers, '2_', [0], 5),
    conventional:      deriveTrait(answers, '2_', [1], 5),
    empathy:           deriveTrait(answers, '3_', [1], 5),
    leadership:        deriveTrait(answers, '3_', [3], 5),
    'self-awareness':  deriveTrait(answers, '3_', [0], 5),
    stress:            deriveTrait(answers, '3_', [4], 5),
    impact:            deriveTrait(answers, '4_', [2], 5),
    wealth:            deriveTrait(answers, '4_', [1], 5),
    creativity:        deriveTrait(answers, '4_', [6], 5),
    stability:         deriveTrait(answers, '4_', [5], 5),
  };

  const streamScores = computeStreamScores(traitScores);
  const primaryStream = Object.entries(streamScores).sort((a,b)=>b[1]-a[1])[0][0];
  const topCareers = computeCareerFit(traitScores, primaryStream);

  return { traitScores, streamScores, primaryStream, topCareers };
}

// Helper: derive a normalised trait score (0–100) from answer keys
function deriveTrait(answers, prefix, questionIndices, maxVal) {
  const vals = questionIndices
    .map(i => answers[prefix + i])
    .filter(v => v !== undefined);
  if (vals.length === 0) return 50 + Math.round(Math.random() * 30);
  const avg = vals.reduce((s, v) => s + Number(v), 0) / vals.length;
  return Math.round((avg / maxVal) * 100);
}

if (typeof module !== 'undefined') {
  module.exports = { computeStreamScores, computeCareerFit, runScoringPipeline, CAREERS, STREAM_WEIGHTS };
}
