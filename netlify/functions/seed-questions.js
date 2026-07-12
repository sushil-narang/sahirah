// netlify/functions/seed-questions.js
//
// One-time (re-runnable) seed of the validated 185-question bank into Supabase.
// Trigger manually with: curl -X POST .../seed-questions -H "x-seed-secret: ..."

const { createClient } = require('@supabase/supabase-js');
const questionBank = require('../../psychometric-question-bank-final-validated.json');

const MODULE_META = {
  aptitude:      { color: '#C8860A', dot: '#C8860A', icon: '🎯', description: 'Measures reasoning ability, logical thinking and complex problem-solving depth.' },
  personality:   { color: '#7B2FBE', dot: '#7B2FBE', icon: '🧠', description: 'Understands how you think, communicate and relate to others.' },
  interest:      { color: '#0A6B5E', dot: '#0A6B5E', icon: '🌱', description: 'Discovers what you are naturally drawn to and passionate about.' },
  eq:            { color: '#C0410A', dot: '#C0410A', icon: '❤️', description: 'Assesses empathy, self-awareness and how you handle pressure.' },
  values:        { color: '#1A5FA8', dot: '#1A5FA8', icon: '⭐', description: 'Finds what drives you — service, creativity, stability or impact.' },
  situational:   { color: '#5F5E5A', dot: '#888',    icon: '⚡', description: 'Real-life scenarios that reveal your decision-making instincts.' },
  learning_style:{ color: '#888888', dot: '#888888', icon: '📚', description: '' },
  resilience:    { color: '#888888', dot: '#888888', icon: '📚', description: '' },
  creativity:    { color: '#888888', dot: '#888888', icon: '📚', description: '' },
  leadership:    { color: '#888888', dot: '#888888', icon: '📚', description: '' },
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (event.headers['x-seed-secret'] !== process.env.SEED_SECRET) {
    return { statusCode: 403, body: 'Forbidden' };
  }

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const errors = [];
  let modulesUpserted = 0;
  let questionsUpserted = 0;

  // ---- SEED assessment_modules ----
  for (const mod of questionBank) {
    const moduleId = mod.questions[0]?.module_id;
    if (!moduleId) {
      errors.push({ question_id: null, error: `Module "${mod.module}" has no questions / no module_id` });
      continue;
    }
    const meta = MODULE_META[moduleId] || { color: '#888888', dot: '#888888', icon: '📚', description: '' };

    try {
      const { error } = await db.from('assessment_modules').upsert({
        module_id:   moduleId,
        module_name: mod.module,
        color:       meta.color,
        dot:         meta.dot,
        icon:        meta.icon,
        description: meta.description,
      }, { onConflict: 'module_id' });

      if (error) {
        errors.push({ question_id: null, error: `Module "${moduleId}": ${error.message}` });
      } else {
        modulesUpserted++;
      }
    } catch (err) {
      errors.push({ question_id: null, error: `Module "${moduleId}": ${err.message}` });
    }
  }

  // ---- SEED module_questions ----
  for (const mod of questionBank) {
    for (const q of mod.questions) {
      const row = {
        question_id:     q.id ?? null,
        module_id:       q.module_id ?? null,
        question_text:   q.text ?? null,
        question_type:   q.type ?? null,
        options:         q.opts ?? null,
        ans:             q.ans ?? null,
        scale:           q.scale ?? null,
        context:         q.context ?? null,
        tier:            q.tier ?? null,
        skill:           q.skill ?? null,
        stream_weight:   q.stream_weight ?? null,
        core:            q.core ?? null,
        scoring_scheme:  q.scoring_scheme ?? null,
        option_skills:   q.option_skills ?? null,
        option_scores:   q.option_scores ?? null,
        rows:            q.rows ?? null,
        cols:            q.cols ?? null,
      };

      try {
        const { error } = await db.from('module_questions').upsert(row, { onConflict: 'question_id' });
        if (error) {
          errors.push({ question_id: row.question_id, error: error.message });
        } else {
          questionsUpserted++;
        }
      } catch (err) {
        errors.push({ question_id: row.question_id, error: err.message });
      }
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: errors.length === 0,
      modules_upserted: modulesUpserted,
      questions_upserted: questionsUpserted,
      errors,
    }),
  };
};
