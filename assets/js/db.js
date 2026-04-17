// ================================================================
// assets/js/db.js — Supabase data layer for Sahirah.in
//
// FIRST-TIME SETUP (two steps):
//   1. Create a free project at https://supabase.com
//   2. In your project go to Settings → API and copy:
//        Project URL  →  paste as SUPABASE_URL below
//        anon/public key  →  paste as SUPABASE_ANON below
// ================================================================
const SUPABASE_URL  = 'https://chiobdkdhgnbtjxsscpf.supabase.co'; 
const SUPABASE_ANON = 'sb_publishable_ZWCHORwPOxp3gkWaqt722g_3W_vd6i4';            // ← replace

const _db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

const SahirahDB = {

  // ---- REGISTRATION ----
  // Saves the full registration row + all 12 discovery answers in one call.
  async saveRegistration(regRow, discoveryAnswers) {
    const { error } = await _db.from('registrations').insert([regRow]);
    if (error) throw error;
    if (discoveryAnswers && Object.keys(discoveryAnswers).length) {
      const rows = Object.entries(discoveryAnswers).map(([key, val]) => ({
        reg_id:        regRow.reg_id,
        question_key:  key,
        answer_value:  String(val),
      }));
      // Non-fatal — registration is still saved even if discovery answers fail
      await _db.from('discovery_answers').insert(rows);
    }
  },

  async getByLoginId(loginId) {
    const { data } = await _db
      .from('registrations')
      .select('*')
      .eq('login_id', loginId)
      .maybeSingle();
    return data;
  },

  // ---- TEST SESSION ----
  // Call when the child clicks "Start test". Returns the new session row (with its id).
  async startSession(regId) {
    const { data, error } = await _db
      .from('test_sessions')
      .insert([{ reg_id: regId, status: 'in_progress' }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Call on test submit. Saves every answer then marks the session complete.
  async submitSession(sessionId, answers) {
    const rows = Object.entries(answers).map(([qId, val]) => ({
      session_id:    sessionId,
      question_id:   qId,
      question_type: qId.split('-')[0],   // e.g. apt, per, eq, int, val, sit
      answer_value:  typeof val === 'object' ? JSON.stringify(val) : String(val),
    }));
    if (rows.length) {
      await _db.from('test_responses').insert(rows);
    }
    await _db
      .from('test_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', sessionId);
  },

  // ---- ADMIN ----
  // Returns all registrations newest-first.
  async getAllRegistrations() {
    const { data, error } = await _db
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
};
