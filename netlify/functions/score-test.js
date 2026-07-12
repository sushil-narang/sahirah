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

    const answers = session.answers_json || {};
    const reg_id = session.reg_id;

    const { data: questions, error: qErr } = await db
      .from('module_questions')
      .select('question_id, skill, scoring_scheme, stream_weight, ans, scale, option_skills, option_scores, options')
      .in('module_id', ['aptitude','personality','interest','eq','values','situational']);

    if (qErr || !questions || !questions.length) throw qErr || new Error('No questions found');

    // ---- STEP 2: Score each answered question by its scoring_scheme ----
    const contributions = [];               // [{skill, score, weight}]
    const skillStreamWeight = {};            // skill -> stream_weight object
    const categoricalTally = {};             // skill -> count

    questions.forEach(q => {
      const given = answers[q.question_id];
      if (given === undefined) return;
      if (q.skill && q.stream_weight) skillStreamWeight[q.skill] = q.stream_weight;

      switch (q.scoring_scheme) {
        case 'correct_answer': {
          const score = Number(given) === q.ans ? 100 : 0;
          contributions.push({ skill: q.skill, score, weight: q.stream_weight });
          break;
        }
        case 'likert_scale': {
          const idx = Number(given);
          const n = q.scale?.length || 5;
          const score = (idx / (n - 1)) * 100;
          contributions.push({ skill: q.skill, score, weight: q.stream_weight });
          break;
        }
        case 'matrix_scale': {
          const rowVals = Object.values(given).map(Number);
          const n = 5;
          const score = (rowVals.reduce((a, b) => a + b, 0) / rowVals.length / (n - 1)) * 100;
          contributions.push({ skill: q.skill, score, weight: q.stream_weight });
          break;
        }
        case 'categorical': {
          const picked = q.option_skills?.[Number(given)];
          if (picked) categoricalTally[picked] = (categoricalTally[picked] || 0) + 1;
          break;
        }
        case 'quality_scale': {
          const score = q.option_scores?.[Number(given)] ?? 0;
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
      skill_scores[skill] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    });

    const maxTally = Math.max(0, ...Object.values(categoricalTally));
    if (maxTally > 0) {
      Object.entries(categoricalTally).forEach(([skill, count]) => {
        skill_scores[skill] = Math.round((count / maxTally) * 100);
      });
    }

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

    // ---- STEP 5: Stage 2 — career fit (primary stream only) ----
    const { data: careers, error: careerErr } = await db
      .from('career_profiles')
      .select('*')
      .eq('stream_code', primary_stream);

    if (careerErr) throw careerErr;

    const careerFits = (careers || []).map(career => {
      let num = 0, den = 0;
      let below_cutoff = false;

      DIMENSIONS.forEach(dim => {
        const w = career['weight_' + dim] || 0;
        const s = skill_scores[dim] ?? 50;
        num += s * w;
        den += 100 * w;

        const minReq = career['min_req_' + dim] || 0;
        if (minReq > 0 && (skill_scores[dim] ?? 0) < minReq) below_cutoff = true;
      });

      const fit = den > 0 ? Math.round((num / den) * 100) : 0;
      return { career: career.name, career_id: career.id, fit, below_cutoff };
    });

    const top_careers = careerFits.sort((a, b) => b.fit - a.fit).slice(0, 3);

    // ---- STEP 6: Write results ----
    const score_json = { skill_scores, stream_scores, primary_stream, top_careers };

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
        stream_scores,
        skill_scores,
        top_careers: top_careers.slice(0, 3),
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
