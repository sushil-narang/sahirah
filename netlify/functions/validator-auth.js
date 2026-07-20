// netlify/functions/validator-auth.js
//
// Validator registration and token verification for the question-bank
// validation portal (validate/index.html). Uses the service key —
// validator identity is a custom bearer token, not Supabase Auth.

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Bad Request' }) }; }

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    if (body.action === 'register') return await handleRegister(db, body);
    if (body.action === 'verify') return await handleVerify(db, body);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Unknown action' }),
    };
  } catch (err) {
    console.error('validator-auth error:', err);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};

async function handleRegister(db, body) {
  const { name, email, phone, expertise, institution } = body;

  if (!name || !email || !expertise) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'name, email, and expertise are required' }),
    };
  }

  const { data: existing, error: findErr } = await db
    .from('validators')
    .select('id, name, access_token, questions_reviewed')
    .eq('email', email)
    .maybeSingle();
  if (findErr) throw findErr;

  if (existing) {
    const { error: updateErr } = await db
      .from('validators')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (updateErr) throw updateErr;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        access_token: existing.access_token,
        validator_id: existing.id,
        validator_name: existing.name,
        is_returning: true,
        questions_reviewed: existing.questions_reviewed,
      }),
    };
  }

  const access_token = crypto.randomBytes(32).toString('hex');

  const { data: created, error: insertErr } = await db
    .from('validators')
    .insert({
      name, email, phone, expertise,
      institution: institution || null,
      access_token, is_active: true, questions_reviewed: 0,
    })
    .select('id')
    .single();
  if (insertErr) throw insertErr;

  const { error: sessionErr } = await db
    .from('validator_sessions')
    .insert({ validator_id: created.id, questions_reviewed: 0, is_complete: false });
  if (sessionErr) throw sessionErr;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: true,
      access_token,
      validator_id: created.id,
      validator_name: name,
      is_returning: false,
    }),
  };
}

async function handleVerify(db, body) {
  const { token } = body;
  if (!token) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'token required' }),
    };
  }

  const { data: validator, error } = await db
    .from('validators')
    .select('id, name, email, questions_reviewed, is_active')
    .eq('access_token', token)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;

  if (!validator) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Invalid or inactive token' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: true,
      validator_id: validator.id,
      validator_name: validator.name,
      questions_reviewed: validator.questions_reviewed,
      email: validator.email,
    }),
  };
}
