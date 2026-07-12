// netlify/functions/admin-write-question.js
//
// Server-side write gateway for the admin question bank editor.
// Uses the Supabase service role key so client-side RLS restrictions
// on module_questions don't need a public write policy.

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (event.headers['x-admin-secret'] !== process.env.ADMIN_WRITE_SECRET) {
    return { statusCode: 403, body: 'Forbidden' };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: 'Bad Request' }; }

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    if (body.action === 'upsert') {
      const { error } = await db.from('module_questions').upsert(body.row, { onConflict: 'question_id' });
      if (error) throw error;
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
    }

    if (body.action === 'upsert_batch') {
      const { error } = await db.from('module_questions').upsert(body.rows, { onConflict: 'question_id' });
      if (error) throw error;
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, count: body.rows.length }) };
    }

    if (body.action === 'delete') {
      const { error } = await db.from('module_questions').delete().eq('question_id', body.question_id);
      if (error) throw error;
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, body: 'Unknown action' };
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
