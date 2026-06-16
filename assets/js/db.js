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

  async saveCseUser(user) {
    const { error } = await _db.from('cse_users').upsert([{
      email:      user.email,
      local_id:   user.id,
      name:       user.name,
      phone:      user.phone || null,
      created_at: user.created_at || new Date().toISOString(),
    }], { onConflict: 'email' });
    if (error) console.error('saveCseUser error:', error);
  },

  async getCseUsers() {
    const { data, error } = await _db.from('cse_users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(u => ({
      id:         u.local_id || u.email,
      name:       u.name,
      email:      u.email,
      phone:      u.phone,
      created_at: u.created_at,
    }));
  },

  async saveCseSession(session) {
    const { error } = await _db.from('cse_sessions').upsert([{
      id:             session.id,
      user_email:     session.user_email,
      user_name:      session.user_name,
      user_id:        session.user_id,
      started_at:     session.started_at,
      completed_at:   session.completed_at,
      status:         session.status,
      score:          session.score || null,
      flags:          session.flags || [],
      flag_count:     session.flag_count || 0,
      answer_details: session.answer_details || [],
    }], { onConflict: 'id' });
    if (error) console.error('saveCseSession error:', error);
  },

  async getCseSessions() {
    const { data, error } = await _db.from('cse_sessions')
      .select('*')
      .order('started_at', { ascending: false });
    if (error) throw error;
    return data || [];
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

  // ================================================================
  // PHASE 1: SCHOOL AUTHENTICATION (B2B Model)
  // ================================================================

  // ---- SCHOOL LOGIN WITH EMAIL/PASSWORD ----
  async schoolLoginWithEmail(email, password) {
    try {
      // Validate inputs
      if (!email || !password) {
        return { success: false, error: 'Email and password required' };
      }

      // Check schools_auth table
      const { data: auth, error: authError } = await _db
        .from('schools_auth')
        .select('*, schools(*)')
        .eq('email', email.toLowerCase())
        .eq('is_verified', true)
        .maybeSingle();

      if (authError || !auth) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if account is locked
      if (auth.account_locked_until && new Date(auth.account_locked_until) > new Date()) {
        return { success: false, error: 'Account temporarily locked. Try again later.' };
      }

      // Verify password (Note: In production, use bcrypt on backend)
      const isValidPassword = await this._verifyPassword(password, auth.password_hash, auth.salt);

      if (!isValidPassword) {
        // Increment failed login attempts
        const attempts = (auth.failed_login_attempts || 0) + 1;
        let lockUntil = null;
        if (attempts >= 5) {
          lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
        }

        await _db.from('schools_auth')
          .update({
            failed_login_attempts: attempts,
            account_locked_until: lockUntil
          })
          .eq('id', auth.id);

        return { success: false, error: 'Invalid credentials' };
      }

      // Reset failed attempts
      await _db.from('schools_auth')
        .update({
          failed_login_attempts: 0,
          account_locked_until: null,
          last_login_at: new Date().toISOString()
        })
        .eq('id', auth.id);

      // Generate JWT token (simplified - use backend for production)
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour
      const token = this._generateJWT({
        type: 'school_session',
        school_id: auth.school_id,
        auth_id: auth.id,
        email: auth.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(expiresAt.getTime() / 1000)
      });

      // Create session record
      const { data: session } = await _db
        .from('schools_sessions')
        .insert([{
          school_id: auth.school_id,
          auth_id: auth.id,
          jwt_token: token,
          ip_address: 'browser', // Can't reliably get IP from client
          expires_at: expiresAt.toISOString()
        }])
        .select()
        .single();

      // Log audit event
      await this.logSchoolAction(auth.school_id, 'login', { email: auth.email });

      return {
        success: true,
        school_id: auth.school_id,
        school_name: auth.schools.school_name,
        email: auth.email,
        token: token,
        refresh_token: session?.id,
        expires_at: expiresAt.toISOString()
      };

    } catch(e) {
      console.error('School login error:', e);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  },

  // ---- SCHOOL PASSWORD RESET ----
  async sendPasswordResetCode(email) {
    try {
      // Find school by email
      const { data: auth } = await _db
        .from('schools_auth')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (!auth) {
        // For security, don't reveal if email exists
        return { success: true, message: 'If email exists, reset code will be sent' };
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store reset token
      await _db.from('schools_auth')
        .update({
          password_reset_token: code,
          password_reset_expires: expiresAt.toISOString()
        })
        .eq('id', auth.id);

      // In production, send email here via backend
      console.log(`Reset code for ${email}: ${code}`);

      // For testing: store in localStorage temporarily
      localStorage.setItem(`_reset_code_${email}`, code);

      return { success: true, message: 'Reset code sent' };
    } catch(e) {
      console.error('Reset code error:', e);
      return { success: false, error: 'Failed to send reset code' };
    }
  },

  async verifyPasswordResetCode(email, code) {
    try {
      const { data: auth } = await _db
        .from('schools_auth')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (!auth) {
        return { success: false, error: 'Email not found' };
      }

      // In production: verify against database
      // For now: check localStorage (testing only)
      const storedCode = localStorage.getItem(`_reset_code_${email}`);

      if (storedCode !== code) {
        return { success: false, error: 'Invalid or expired code' };
      }

      // Generate reset token
      const resetToken = Math.random().toString(36).substring(2, 15);

      // Store temp reset token
      localStorage.setItem(`_reset_token_${email}`, resetToken);

      return { success: true, token: resetToken };
    } catch(e) {
      console.error('Verify code error:', e);
      return { success: false, error: 'Verification failed' };
    }
  },

  async resetPassword(email, resetToken, newPassword) {
    try {
      const storedToken = localStorage.getItem(`_reset_token_${email}`);
      if (storedToken !== resetToken) {
        return { success: false, error: 'Invalid reset token' };
      }

      if (!newPassword || newPassword.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters' };
      }

      // Hash new password (in production, do this on backend)
      const salt = Math.random().toString(36).substring(2, 15);
      const passwordHash = await this._hashPassword(newPassword, salt);

      // Update password
      const { error } = await _db
        .from('schools_auth')
        .update({
          password_hash: passwordHash,
          salt: salt,
          password_changed_at: new Date().toISOString(),
          password_reset_token: null,
          password_reset_expires: null
        })
        .eq('email', email.toLowerCase());

      if (error) throw error;

      // Clear temp storage
      localStorage.removeItem(`_reset_code_${email}`);
      localStorage.removeItem(`_reset_token_${email}`);

      return { success: true, message: 'Password reset successfully' };
    } catch(e) {
      console.error('Reset password error:', e);
      return { success: false, error: 'Failed to reset password' };
    }
  },

  // ---- SCHOOL STUDENT REGISTRATION ----
  async addSchoolStudent(schoolId, studentData) {
    try {
      // Generate reg_id (same format as regular registrations)
      const regId = 'SHR-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create registration record
      const { data: registration, error: regError } = await _db
        .from('registrations')
        .insert([{
          reg_id: regId,
          child_first_name: studentData.first_name,
          child_last_name: studentData.last_name,
          child_dob: studentData.dob || null,
          child_class: studentData.class,
          parent_email: studentData.parent_email || studentData.email,
          parent_name: studentData.parent_name || null,
          parent_mobile: studentData.parent_phone || null,
          child_city: studentData.city || null,
          login_id: regId.toLowerCase(),
          password_hash: '', // Will be generated on first login
          status: 'Registered',
          enrolled_via_school: true,
          school_id: schoolId
        }])
        .select()
        .single();

      if (regError) throw regError;

      // Create school student enrollment record
      const { error: enrollError } = await _db
        .from('school_student_registrations')
        .insert([{
          school_id: schoolId,
          reg_id: regId,
          student_email: studentData.email,
          student_first_name: studentData.first_name,
          student_last_name: studentData.last_name,
          student_dob: studentData.dob || null,
          student_class: studentData.class,
          parent_name: studentData.parent_name || null,
          parent_email: studentData.parent_email || null,
          parent_phone: studentData.parent_phone || null,
          city: studentData.city || null,
          notes: studentData.notes || null,
          created_by_method: 'manual'
        }]);

      if (enrollError) throw enrollError;

      // Increment school usage
      await this.incrementSchoolUsage(schoolId);

      return {
        success: true,
        reg_id: regId,
        message: `${studentData.first_name} ${studentData.last_name} registered successfully`
      };
    } catch(e) {
      console.error('Add student error:', e);
      return { success: false, error: 'Failed to register student' };
    }
  },

  // ---- CSV UPLOAD TRACKING ----
  async trackCsvUpload(schoolId, uploadData) {
    try {
      const { data, error } = await _db
        .from('school_csv_uploads')
        .insert([{
          school_id: schoolId,
          filename: uploadData.filename,
          file_size_bytes: uploadData.file_size || 0,
          total_records: uploadData.total_records,
          successful_imports: uploadData.successful_imports || 0,
          failed_imports: uploadData.failed_imports || 0,
          skipped_records: uploadData.skipped_records || 0,
          errors_json: uploadData.errors || null,
          upload_status: uploadData.status,
          uploaded_by_email: uploadData.uploaded_by_email,
          processed_at: uploadData.processed_at || null
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, upload_id: data.id };
    } catch(e) {
      console.error('Track CSV upload error:', e);
      return { success: false, error: 'Failed to track upload' };
    }
  },

  // ---- EXAM SCHEDULING ----
  async createExamSchedule(schoolId, examData) {
    try {
      const { data, error } = await _db
        .from('exam_schedules')
        .insert([{
          school_id: schoolId,
          exam_name: examData.name,
          exam_description: examData.description || null,
          scheduled_date: examData.date,
          scheduled_time: examData.time,
          capacity: examData.capacity,
          timezone: examData.timezone || 'Asia/Kolkata',
          status: 'draft',
          is_visible_to_students: false,
          registration_deadline: examData.registration_deadline || null,
          notes: examData.notes || null
        }])
        .select()
        .single();

      if (error) throw error;

      // Create capacity slots
      const slots = [];
      for (let i = 0; i < examData.capacity; i++) {
        slots.push({
          exam_id: data.id,
          slot_status: 'available'
        });
      }

      await _db.from('exam_student_slots').insert(slots);

      return { success: true, exam_id: data.id, exam: data };
    } catch(e) {
      console.error('Create exam error:', e);
      return { success: false, error: 'Failed to create exam' };
    }
  },

  async getSchoolExams(schoolId) {
    try {
      const { data, error } = await _db
        .from('exam_schedules')
        .select('*')
        .eq('school_id', schoolId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return { success: true, exams: data || [] };
    } catch(e) {
      console.error('Get exams error:', e);
      return { success: false, exams: [] };
    }
  },

  // ---- AUDIT LOGGING ----
  async logSchoolAction(schoolId, action, details = {}) {
    try {
      await _db.from('school_audit_logs').insert([{
        school_id: schoolId,
        action: action,
        details: details,
        ip_address: 'browser',
        created_at: new Date().toISOString()
      }]);
    } catch(e) {
      console.error('Audit log error:', e);
    }
  },

  // ---- HELPER FUNCTIONS (Client-side - use backend for production) ----
  async _hashPassword(password, salt) {
    // IMPORTANT: This is a simplified hash for testing only.
    // In production, implement proper bcrypt hashing on the backend.
    const data = new TextEncoder().encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async _verifyPassword(password, hash, salt) {
    const computedHash = await this._hashPassword(password, salt);
    return computedHash === hash;
  },

  _generateJWT(payload) {
    // IMPORTANT: This is a simplified JWT for client-side use only.
    // In production, generate JWTs on the backend for security.
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    const signature = btoa('client-side-signature-not-secure');
    return `${header}.${body}.${signature}`;
  },
};
