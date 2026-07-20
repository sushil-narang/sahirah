// netlify/functions/submit-feedback.js
//
// Records one validator's review of one question. UPSERT keyed on
// (question_id, validator_id) so revisiting a previously reviewed
// question overwrites that validator's own feedback, not anyone else's.
// Validator identity comes from access_token, never from the client-
// supplied validator_id — the token is what's trusted.

const { createClient } = require('@supabase/supabase-js');

const REVIEW_DECISIONS = ['approved', 'needs_revision', 'reject'];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Bad Request' }) }; }

  const {
    access_token, question_id,
    clarity_rating, skill_correct, suggested_skill,
    difficulty_appropriate, review_decision,
    time_spent_seconds, remarks,
  } = body;

  if (!access_token || !question_id) {
    return respond({ success: false, error: 'access_token and question_id are required' });
  }
  if (!Number.isInteger(clarity_rating) || clarity_rating < 1 || clarity_rating > 5) {
    return respond({ success: false, error: 'clarity_rating must be an integer 1-5' });
  }
  if (typeof skill_correct !== 'boolean') {
    return respond({ success: false, error: 'skill_correct must be a boolean' });
  }
  if (!Number.isInteger(difficulty_appropriate) || difficulty_appropriate < 1 || difficulty_appropriate > 5) {
    return respond({ success: false, error: 'difficulty_appropriate must be an integer 1-5' });
  }
  if (!REVIEW_DECISIONS.includes(review_decision)) {
    return respond({ success: false, error: `review_decision must be one of ${REVIEW_DECISIONS.join(', ')}` });
  }

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    // Step 1: resolve validator identity from the token
    const { data: validator, error: findErr } = await db
      .from('validators')
      .select('id')
      .eq('access_token', access_token)
      .eq('is_active', true)
      .maybeSingle();
    if (findErr) throw findErr;
    if (!validator) return respond({ success: false, error: 'Unauthorised' });

    const validator_id = validator.id;

    // Step 2: upsert this validator's feedback on this question
    const { error: upsertErr } = await db
      .from('question_feedback')
      .upsert({
        question_id,
        validator_id,
        clarity_rating,
        skill_correct,
        suggested_skill: suggested_skill || null,
        difficulty_appropriate,
        review_decision,
        time_spent_seconds: Number.isInteger(time_spent_seconds) ? time_spent_seconds : null,
        remarks: remarks || null,
      }, { onConflict: 'question_id,validator_id' });
    if (upsertErr) throw upsertErr;

    // Step 3: recompute this validator's total reviewed count, refresh last_active_at
    const { count, error: countErr } = await db
      .from('question_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('validator_id', validator_id);
    if (countErr) throw countErr;

    const { error: updateValidatorErr } = await db
      .from('validators')
      .update({ questions_reviewed: count, last_active_at: new Date().toISOString() })
      .eq('id', validator_id);
    if (updateValidatorErr) throw updateValidatorErr;

    // Step 4: mirror progress onto the validator's active session
    const { error: sessionErr } = await db
      .from('validator_sessions')
      .update({ last_question_id: question_id, questions_reviewed: count })
      .eq('validator_id', validator_id)
      .eq('is_complete', false);
    if (sessionErr) throw sessionErr;

    return respond({ success: true, questions_reviewed: count });
  } catch (err) {
    console.error('submit-feedback error:', err);
    return respond({ success: false, error: err.message });
  }
};

function respond(payload) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}
