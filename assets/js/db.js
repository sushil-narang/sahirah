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
  async getLatestSession(regId) {
    const { data } = await _db
      .from('test_sessions')
      .select('id, status')
      .eq('reg_id', regId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  },

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

  // ---- CSE APTITUDE ----
  async saveCseAttempts(attempts) {
    if (!attempts || !attempts.length) return;
    const { error } = await _db.from('cse_question_attempts').insert(attempts);
    if (error) console.error('saveCseAttempts error:', error);
  },

  // ---- COUPON / ACCESS CODE VALIDATION ----
  async validateCode(code) {
    if (!code) return null;
    const upper = code.toUpperCase().trim();

    // Check coupon_codes table
    const { data: coupon } = await _db
      .from('coupon_codes')
      .select('*, schools(*), counselors(*)')
      .eq('code', upper)
      .eq('is_active', true)
      .maybeSingle();
    if (coupon) {
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return { valid: false, reason: 'expired' };
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) return { valid: false, reason: 'limit_reached' };
      return { valid: true, source: 'coupon', coupon };
    }

    // Check schools table
    const { data: school } = await _db
      .from('schools')
      .select('*')
      .eq('school_code', upper)
      .eq('is_active', true)
      .maybeSingle();
    if (school) {
      if (school.student_quota && school.students_used >= school.student_quota) return { valid: false, reason: 'quota_full' };
      return { valid: true, source: 'school', school };
    }

    // Check counselors table
    const { data: counselor } = await _db
      .from('counselors')
      .select('*')
      .eq('counselor_code', upper)
      .eq('is_active', true)
      .maybeSingle();
    if (counselor) return { valid: true, source: 'counselor', counselor };

    return { valid: false, reason: 'not_found' };
  },

  async incrementCouponUsage(code) {
    const upper = code.toUpperCase().trim();
    await _db.rpc('increment_coupon', { coupon_code: upper }).catch(()=>{
      // Fallback: manual increment
      _db.from('coupon_codes').select('used_count').eq('code', upper).maybeSingle().then(({data})=>{
        if (data) _db.from('coupon_codes').update({ used_count: (data.used_count||0)+1 }).eq('code', upper);
      });
    });
  },

  async incrementSchoolUsage(schoolCode) {
    const upper = schoolCode.toUpperCase().trim();
    const { data } = await _db.from('schools').select('students_used').eq('school_code', upper).maybeSingle();
    if (data) await _db.from('schools').update({ students_used: (data.students_used||0)+1 }).eq('school_code', upper);
  },

  // ---- PAYMENTS ----
  async savePaymentRecord(record) {
    const { data, error } = await _db.from('payments').insert([record]).select().single();
    if (error) console.error('savePaymentRecord error:', error);
    return data;
  },

  async getPaymentsByRegId(regId) {
    const { data } = await _db.from('payments').select('*').eq('reg_id', regId).order('created_at', { ascending: false });
    return data || [];
  },

  // ---- SCHOOLS ADMIN ----
  async getAllSchools() {
    const { data, error } = await _db.from('schools').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createSchool(row) {
    const { data, error } = await _db.from('schools').insert([row]).select().single();
    if (error) throw error;
    return data;
  },

  async toggleSchool(id, isActive) {
    await _db.from('schools').update({ is_active: isActive }).eq('id', id);
  },

  async getSchoolStudents(schoolCode) {
    const { data: school } = await _db.from('schools').select('id').eq('school_code', schoolCode.toUpperCase()).maybeSingle();
    if (!school) return [];
    const { data } = await _db.from('payments').select('*, registrations(*)').eq('school_id', school.id).order('created_at', { ascending: false });
    return data || [];
  },

  // ---- COUPONS ADMIN ----
  async getAllCoupons() {
    const { data, error } = await _db.from('coupon_codes').select('*, schools(school_name), counselors(name)').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createCoupon(row) {
    const { data, error } = await _db.from('coupon_codes').insert([row]).select().single();
    if (error) throw error;
    return data;
  },

  async toggleCoupon(id, isActive) {
    await _db.from('coupon_codes').update({ is_active: isActive }).eq('id', id);
  },

  // ---- COUNSELORS ADMIN ----
  async getAllCounselors() {
    const { data, error } = await _db.from('counselors').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createCounselor(row) {
    const { data, error } = await _db.from('counselors').insert([row]).select().single();
    if (error) throw error;
    return data;
  },

  // ---- UPDATE REGISTRATION ACCESS ----
  async updateRegistrationAccess(regId, accessType, accessCode, schoolId, counselorId) {
    await _db.from('registrations').update({
      access_type: accessType,
      access_code: accessCode || null,
      school_id: schoolId || null,
      counselor_id: counselorId || null,
    }).eq('reg_id', regId);
  },
};
