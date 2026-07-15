// netlify/functions/score-test.js
//
// Server-side scoring engine — computes skill scores, stream scores, and
// top career fits from a student's stable-ID-keyed answers, then persists
// the result to test_sessions and skill_scores.

const { createClient } = require('@supabase/supabase-js');

const STREAMS = ['non', 'med', 'com', 'hum'];

const DIMENSIONS = [
  'apt_numerical','apt_logical','apt_verbal','apt_spatial','apt_pattern',
  'int_investigative','int_artistic','int_social','int_enterprising','int_realistic','int_conventional',
  'per_extraversion','per_agreeableness','per_conscientiousness','per_stability','per_openness',
  'eq_empathy','eq_stress_regulation','eq_social_skill','eq_self_awareness',
  'val_wealth','val_impact','val_recognition','val_growth','val_stability_value','val_creativity_value',
  'emotional_resilience','leadership','divergent_thinking',
];

// Maps the raw `skill` string on each question (e.g. 'logical', 'self_awareness')
// to the career_profiles dimension column suffix (e.g. 'apt_logical', 'eq_self_awareness').
// Verified against the actual skill values seeded in module_questions.
const SKILL_TO_DIMENSION = {
  logical: 'apt_logical', numerical: 'apt_numerical', pattern: 'apt_pattern',
  spatial: 'apt_spatial', verbal: 'apt_verbal',
  agreeableness: 'per_agreeableness', conscientiousness: 'per_conscientiousness',
  extraversion: 'per_extraversion', openness: 'per_openness', stability: 'per_stability',
  artistic: 'int_artistic', conventional: 'int_conventional', enterprising: 'int_enterprising',
  investigative: 'int_investigative', realistic: 'int_realistic', social: 'int_social',
  empathy: 'eq_empathy', self_awareness: 'eq_self_awareness',
  social_skill: 'eq_social_skill', stress_regulation: 'eq_stress_regulation',
  creativity_value: 'val_creativity_value', growth: 'val_growth', impact: 'val_impact',
  recognition: 'val_recognition', stability_value: 'val_stability_value', wealth: 'val_wealth',
  leadership_judgement: 'sit_leadership',
  integrity: 'sit_integrity',
  adaptability: 'sit_adaptability',
  collaboration: 'sit_collaboration',
};

// Each stream is an array of 25 slots, index = position_index (0-based).
// Each slot is an array of career_profiles.name substrings (case-insensitive)
// that should claim that position. Empty array = no real career_profiles row
// matches this ladder position. A name can appear in exactly one slot per
// stream — collisions are resolved at match time by longest-substring-wins
// (see findLadderPosition), not by array order.
const LADDER_NAME_MAP = {
  non: [
    /* 0  CS / AI Engineer               */ ['Software Developer', 'Machine Learning', 'Cloud Architect', 'DevOps Engineer', 'Cybersecurity Analyst', 'Network Engineer'],
    /* 1  Electronics Engineer           */ ['Electrical Engineer'],
    /* 2  Mechanical Engineer            */ ['Mechanical Engineer'],
    /* 3  Civil Engineer                 */ ['Civil Engineer'],
    /* 4  Aerospace Engineer             */ ['Aerospace Engineer'],
    /* 5  Chemical Engineer              */ ['Chemical Engineer'],
    /* 6  Architecture (B.Arch)          */ ['Architect'],
    /* 7  Product / Industrial Design    */ ['Product Designer', 'Industrial Designer'],
    /* 8  Data Scientist                 */ ['Data Scientist'],
    /* 9  Marine Engineer (Merchant Navy)*/ ['Marine Engineer'],
    /* 10 Naval Architect                */ ['Naval Architect'],
    /* 11 Nautical Science Officer       */ ['Nautical Science Officer'],
    /* 12 Robotics / Mechatronics        */ [],
    /* 13 Biotech / Bioinformatics       */ ['Bioinformatician'],
    /* 14 Automobile Engineer            */ ['Automobile Engineer'],
    /* 15 Embedded Systems Engineer      */ ['Embedded Systems'],
    /* 16 Quant Developer / FinTech      */ ['Quant Developer'],
    /* 17 Environmental Science          */ [],
    /* 18 Geologist / Earth Scientist    */ ['Geologist'],
    /* 19 Research Physicist             */ ['Physicist'],
    /* 20 Nuclear Engineer               */ ['Nuclear Engineer'],
    /* 21 Defence / NDA                  */ ['Defense Services'],
    /* 22 Pilot (CPL)                    */ ['Commercial Pilot'],
    /* 23 Climate Scientist              */ ['Meteorologist'],
    /* 24 Industrial Designer (remaining)*/ [],
  ],
  med: [
    /* 0  MBBS (General Physician)       */ ['General Physician'],
    /* 1  BDS (Dentistry)                */ ['Dentist'],
    /* 2  BPT (Physiotherapy)            */ ['Physiotherapist'],
    /* 3  B.Pharm (Pharmacy)             */ ['Pharmacologist'],
    /* 4  B.Sc Nursing                   */ [],
    /* 5  MBBS → Cardiology (DM)         */ ['Cardiologist'],
    /* 6  MBBS → Neurology (DM)          */ ['Neurologist'],
    /* 7  MBBS → Surgery (MS)            */ ['General Surgeon'],
    /* 8  MBBS → Anaesthesiology (MD)    */ ['Anesthesiologist'],
    /* 9  MBBS → Radiology (MD)          */ ['Radiologist'],
    /* 10 MBBS → Dermatology (MD)        */ ['Dermatologist'],
    /* 11 MBBS → Psychiatry (MD)         */ ['Psychiatrist'],
    /* 12 MBBS → Paediatrics (MD)        */ ['Pediatrician'],
    /* 13 MBBS → Obstetrics (MD/MS)      */ ['Gynecologist'],
    /* 14 MBBS → Pathology (MD)          */ ['Pathologist'],
    /* 15 MBBS → General Medicine (MD)   */ [],
    /* 16 BVSc (Veterinary)              */ ['Veterinarian'],
    /* 17 BAMS (Ayurveda)                */ ['BAMS Practitioner'],
    /* 18 BHMS (Homeopathy)              */ ['BHMS Practitioner'],
    /* 19 BASLP (Audiology / Speech)     */ ['Speech-Language'],
    /* 20 B.Optom (Optometry)            */ ['Optometrist'],
    /* 21 BMLT (Medical Lab Technology)  */ ['Medical Lab'],
    /* 22 B.Sc Radiology Technology      */ ['Radiology Technologist'],
    /* 23 B.Sc Cardiovascular Technology */ ['Cardiovascular Technologist'],
    /* 24 Hospital Administrator (MBA)   */ ['Hospital Administrator'],
  ],
  com: [
    /* 0  CA (Chartered Accountant)      */ ['Chartered Accountant'],
    /* 1  MBA / Management Consultant    */ ['Management Consultant'],
    /* 2  CS (Company Secretary)         */ ['Company Secretary'],
    /* 3  CFA / Investment Banking       */ ['Investment Banker'],
    /* 4  Actuary                        */ ['Actuary'],
    /* 5  Economist                      */ ['Economist'],
    /* 6  Marketing Manager              */ ['Marketing Manager'],
    /* 7  Product Manager                */ ['Product Manager'],
    /* 8  HR Business Partner            */ ['HR Business'],
    /* 9  Entrepreneur / Biz Development */ ['Entrepreneur', 'Business Development Executive'],
    /* 10 Operations Manager             */ ['Operations Manager'],
    /* 11 Financial Analyst              */ ['Financial Analyst'],
    /* 12 Risk Manager (FRM)             */ ['Risk Manager'],
    /* 13 Wealth Manager                 */ ['Wealth Manager'],
    /* 14 Tax Consultant                 */ ['Tax Consultant'],
    /* 15 Corporate Strategy Analyst     */ ['Corporate Strategy'],
    /* 16 Commercial Banker / Banking PO */ ['Commercial Banker', 'Banking PO'],
    /* 17 Insurance Underwriter          */ ['Insurance Underwriter'],
    /* 18 Cost Accountant (CMA)          */ ['Cost Accountant'],
    /* 19 Retail Store Manager           */ ['Retail Store'],
    /* 20 International Business         */ [],
    /* 21 Real Estate Manager            */ ['Real Estate'],
    /* 22 Digital Marketing Specialist   */ ['Digital Marketing'],
    /* 23 Event Manager                  */ [],
    /* 24 Logistics / Supply Chain       */ [],
  ],
  hum: [
    /* 0  IAS / Civil Services (UPSC)    */ ['Civil Servant'],
    /* 1  Corporate Lawyer               */ ['Corporate Lawyer'],
    /* 2  Litigation Lawyer              */ ['Litigation Lawyer'],
    /* 3  B.Des / UX / Graphic Design    */ ['Graphic Designer', 'UX Researcher'],
    /* 4  Journalism                     */ ['Investigative Journalist'],
    /* 5  Clinical Psychologist          */ ['Clinical Psychologist'],
    /* 6  Diplomat (IFS)                 */ ['Diplomat'],
    /* 7  Public Policy Analyst          */ ['Public Policy'],
    /* 8  Social Worker (MSW)            */ ['Social Worker'],
    /* 9  Urban Planner / Architect      */ ['Urban Planner'],
    /* 10 Creative Director              */ ['Creative Director'],
    /* 11 Film Director                  */ ['Film Director'],
    /* 12 PR Specialist                  */ ['PR Specialist'],
    /* 13 Content Writer / Author        */ [],
    /* 14 Fashion Designer (NIFT)        */ ['Fashion Designer'],
    /* 15 Interior Designer              */ ['Interior Designer'],
    /* 16 Game Designer                  */ ['Game Designer'],
    /* 17 Music Composer                 */ ['Music Composer'],
    /* 18 Animator / VFX Artist          */ ['Animator'],
    /* 19 Academic / Researcher          */ ['Professor'],
    /* 20 Archaeologist                  */ ['Archaeologist'],
    /* 21 Hotel Manager (BHM)            */ ['Hotel Manager'],
    /* 22 Event Manager (Humanities)     */ ['Event Manager'],
    /* 23 Mass Communication             */ [],
    /* 24 Social Media / Influencer      */ [],
  ],
};

// Returns the ladder position_index for a career name within a stream's ladder,
// or null if nothing matches. Longest matching substring wins, so specific names
// (e.g. 'Naval Architect') correctly beat generic ones (e.g. 'Architect').
function findLadderPosition(careerName, ladder) {
  const lower = careerName.toLowerCase();
  let best = null; // { index, len }
  ladder.forEach((names, index) => {
    names.forEach(n => {
      if (lower.includes(n.toLowerCase())) {
        if (!best || n.length > best.len) best = { index, len: n.length };
      }
    });
  });
  return best ? best.index : null;
}

// priority_rank_score = (25 - position_index) / 25 × 100. Unmatched careers get
// 25 — neutral, competes purely on dimension fit.
function getPriorityScore(careerName, streamCode) {
  const ladder = LADDER_NAME_MAP[streamCode] || [];
  const idx = findLadderPosition(careerName, ladder);
  return idx === null ? 25 : (25 - idx) / 25 * 100;
}

function getBlendedScore(priorityScore, fitScore) {
  return Math.round(priorityScore * 0.4 + fitScore * 0.6);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: 'Bad Request' }; }

  const { session_id } = body;
  if (!session_id) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'session_id required' }) };
  }

  // Service key used because this is a server function and we already have
  // it available — not to bypass RLS. test_sessions already has permissive
  // anon read/write policies.
  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    // ---- STEP 1: Fetch answers and questions ----
    const { data: session, error: sessionErr } = await db
      .from('test_sessions')
      .select('answers_json, reg_id')
      .eq('id', session_id)
      .single();

    if (sessionErr || !session) throw sessionErr || new Error('Session not found');

    const answers = session.answers_json || body.answers || {};
    const reg_id = session.reg_id;

    const { data: questions, error: qErr } = await db
      .from('module_questions')
      .select('question_id, skill, scoring_scheme, stream_weight, ans, scale, option_skills, option_scores, options')
      .in('module_id', ['aptitude','personality','interest','eq','values','situational']);

    if (qErr || !questions || !questions.length) throw qErr || new Error('No questions found');

    // TODO: skills with < 3 questions produce 0 scores that are
    // hidden in reports per Part E zero-score rule.
    // Affected: apt_verbal (1 question), apt_spatial (3 questions)
    // Fix: add more questions to these skills in the question bank.

    // ---- STEP 2: Score each answered question by its scoring_scheme ----
    const clampScore = s => Math.min(100, Math.max(0, Math.round(s)));
    const contributions = [];               // [{skill, score, weight}]
    const skillStreamWeight = {};            // skill -> stream_weight object
    const categoricalTally = {};             // skill -> count

    questions.forEach(q => {
      const given = answers[q.question_id];
      if (given === undefined) return;
      if (q.skill && q.stream_weight) skillStreamWeight[q.skill] = q.stream_weight;

      switch (q.scoring_scheme) {
        case 'correct_answer': {
          const score = clampScore(Number(given) === q.ans ? 100 : 0);
          contributions.push({ skill: q.skill, score, weight: q.stream_weight });
          break;
        }
        case 'likert_scale': {
          const idx = Number(given);
          const n = q.scale?.length || 5;
          const score = clampScore((idx / (n - 1)) * 100);
          contributions.push({ skill: q.skill, score, weight: q.stream_weight });
          break;
        }
        case 'matrix_scale': {
          const rowVals = Object.values(given).map(Number);
          const n = 5;
          const score = clampScore((rowVals.reduce((a, b) => a + b, 0) / rowVals.length / (n - 1)) * 100);
          contributions.push({ skill: q.skill, score, weight: q.stream_weight });
          break;
        }
        case 'categorical': {
          const picked = q.option_skills?.[Number(given)];
          if (picked) categoricalTally[picked] = (categoricalTally[picked] || 0) + 1;
          break;
        }
        case 'quality_scale': {
          const score = clampScore(q.option_scores?.[Number(given)] ?? 0);
          contributions.push({ skill: q.skill, score, weight: q.stream_weight });
          break;
        }
        default:
          break;
      }
    });

    // ---- STEP 3: Aggregate per-skill scores ----
    const skillGroups = {};
    contributions.forEach(({ skill, score }) => {
      if (!skill) return;
      (skillGroups[skill] = skillGroups[skill] || []).push(score);
    });
    const skill_scores = {};
    Object.entries(skillGroups).forEach(([skill, scores]) => {
      skill_scores[skill] = clampScore(scores.reduce((a, b) => a + b, 0) / scores.length);
    });

    const maxTally = Math.max(0, ...Object.values(categoricalTally));
    if (maxTally > 0) {
      Object.entries(categoricalTally).forEach(([skill, count]) => {
        skill_scores[skill] = clampScore((count / maxTally) * 100);
      });
    }

    // ---- STEP 3.5: Translate skill_scores to career_profiles dimension names ----
    const dimension_scores = {};
    Object.entries(skill_scores).forEach(([skill, score]) => {
      const dim = SKILL_TO_DIMENSION[skill];
      if (dim) dimension_scores[dim] = score;
      else dimension_scores[skill] = score; // pass through if no mapping
    });

    // ---- STEP 4: Stage 1 — stream scores ----
    const raw = {};
    STREAMS.forEach(s => {
      let numerator = 0, denominator = 0;
      Object.entries(skill_scores).forEach(([skill, score]) => {
        const w = skillStreamWeight[skill]?.[s];
        if (w === undefined) return;
        numerator += score * w;
        denominator += 100 * w;
      });
      raw[s] = denominator > 0 ? (numerator / denominator) * 100 : 0;
    });
    const rawTotal = STREAMS.reduce((sum, s) => sum + raw[s], 0);
    const stream_scores = {};
    STREAMS.forEach(s => {
      stream_scores[s] = rawTotal > 0 ? Math.round((raw[s] / rawTotal) * 100) : 0;
    });
    const primary_stream = Object.entries(stream_scores).sort((a, b) => b[1] - a[1])[0][0];

    // ---- confidence_level: how decisively primary_stream won ----
    const topStreamScore = stream_scores[primary_stream];
    let confidence_level;
    if (topStreamScore >= 55) confidence_level = 'high';
    else if (topStreamScore >= 40) confidence_level = 'moderate';
    else if (topStreamScore >= 30) confidence_level = 'low';
    else confidence_level = 'very_low';

    // ---- STEP 5: Stage 2 — career fit, all streams ----
    // Fetches every stream's careers (not just primary_stream) so the wildcard
    // can be picked from anywhere outside primary_stream.
    const { data: careers, error: careerErr } = await db
      .from('career_profiles')
      .select('*');

    if (careerErr) throw careerErr;

    const careerFits = (careers || []).map(career => {
      let num = 0, den = 0;
      let below_cutoff = false;
      const dimensionWeights = [];

      DIMENSIONS.forEach(dim => {
        const w = career['weight_' + dim] || 0;
        const s = dimension_scores[dim] ?? 50;
        num += s * w;
        den += 100 * w;
        dimensionWeights.push({ dim, weight: w });

        const minReq = career['min_req_' + dim] || 0;
        if (minReq > 0 && (dimension_scores[dim] ?? 0) < minReq) below_cutoff = true;
      });

      // Zero-score dims (insufficient question coverage) are excluded from both
      // selections below — a 0 is missing data, not a real strength or weakness,
      // and must never be presented to the student as either.
      const stableSort = (a, b) => b.weight - a.weight || a.dim.localeCompare(b.dim);

      const top_dimensions = dimensionWeights
        .filter(d => d.weight > 0 && (dimension_scores[d.dim] ?? 0) > 0)
        .sort(stableSort)
        .slice(0, 3)
        .map(d => d.dim);

      // Reality check: this career's highest-weighted dimension where the student
      // scored below 70 (and above 0 — see zero-score note above).
      const realityCheckCandidates = dimensionWeights
        .filter(d => d.weight > 0 && (dimension_scores[d.dim] ?? 0) > 0 && (dimension_scores[d.dim] ?? 0) < 70)
        .sort(stableSort);
      const reality_check_dim = realityCheckCandidates[0]?.dim ?? null;
      const reality_check_score = reality_check_dim ? dimension_scores[reality_check_dim] : null;

      const fit = den > 0 ? Math.round((num / den) * 100) : 0;
      const priorityScore = getPriorityScore(career.name, career.stream_code);
      const blended = getBlendedScore(priorityScore, fit);
      return {
        title: career.name,
        career_id: career.id,
        fit,        // internal only — never shown to the user; blended drives ranking/display
        blended,
        below_cutoff,
        stream: career.stream_code,
        color: career.display_color || '#C8860A',
        bg: career.display_color ? career.display_color + '11' : '#FDF8F0',
        why: career.why_text || `Strong match for your ${career.stream_code} profile.`,
        exams: career.exams || [],
        degrees: career.degrees || '',
        top_dimensions,
        reality_check_dim,
        reality_check_score,
      };
    });

    const blendedSort = (a, b) => b.blended - a.blended || String(a.career_id).localeCompare(String(b.career_id));

    const top_careers = careerFits
      .filter(c => c.stream === primary_stream)
      .sort(blendedSort)
      .slice(0, 5);

    // Single highest-blended career from any stream other than primary_stream —
    // the global best among non-primary careers, not the best-of-each-stream.
    const wildcard_career = careerFits
      .filter(c => c.stream !== primary_stream)
      .sort(blendedSort)[0] || null;

    const primaryCareerRow = (careers || []).find(c => c.id === top_careers[0]?.career_id);
    const top_career_high_weight_dims = primaryCareerRow
      ? DIMENSIONS.filter(dim => (primaryCareerRow['weight_' + dim] || 0) > 0.5)
      : [];

    // ---- STEP 6: Write results ----
    const score_json = {
      skill_scores, dimension_scores, stream_scores, primary_stream,
      confidence_level, top_careers, wildcard_career, top_career_high_weight_dims,
    };

    const { error: updateErr } = await db.from('test_sessions').update({
      score_json,
      primary_stream,
      status: 'scored',
      completed_at: new Date().toISOString(),
    }).eq('id', session_id);
    if (updateErr) throw updateErr;

    const { error: insertErr } = await db.from('skill_scores').insert({
      session_id,
      reg_id,
      skill_scores_json: skill_scores,
      stream_scores_json: stream_scores,
      top_careers_json: top_careers,
    });
    if (insertErr) throw insertErr;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        session_id,
        primary_stream,
        confidence_level,
        stream_scores,
        skill_scores,
        top_careers: top_careers.slice(0, 3),
        wildcard_career,
      }),
    };
  } catch (err) {
    console.error('score-test error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
