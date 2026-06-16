# Phase 1 Quick Start Guide

## What's New for Schools

### 1. Home Page Navigation
```
                    HOME PAGE
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    Students        Features         🏫 SCHOOL LOGIN ← NEW
       │                               │
       └─► /register                   └─► /school-auth/login
           /login                          (Email + Password)
           /aptitude
```

### 2. School Login Options

#### Option A: Email/Password (NEW - Recommended)
```
Email: principal@school.edu
Password: ••••••••
[Sign In]
↓
Login verification
↓
/school/ dashboard
```

#### Option B: Access Code (Legacy)
```
Access Code: SCH-DPS-001
[Sign In]
↓
Redirects to /school/
```

### 3. Forgot Password Flow

```
[Forgot password?]
    ↓
Enter Email
    ↓
Send 6-digit code
    ↓
Enter Code
    ↓
Set New Password (8+ chars, uppercase, lowercase, numbers)
    ↓
Success → Redirect to login
```

---

## Database Changes

### New Tables (7)
```
schools_auth
  ├─ email (unique login)
  ├─ password_hash + salt
  ├─ MFA enabled (for Phase 2)
  ├─ account lockout tracking
  └─ last login timestamp

schools_sessions
  ├─ JWT token
  ├─ Refresh token
  ├─ Expiry tracking
  └─ IP + user agent

school_student_registrations
  ├─ Links students to schools
  ├─ Manual or CSV imported
  ├─ Enrollment status
  └─ Audit trail

school_csv_uploads
  ├─ Upload history
  ├─ Success/failure counts
  ├─ Error details
  └─ Processed timestamp

exam_schedules
  ├─ Exam name/date/time
  ├─ Capacity
  ├─ Status (draft/published)
  └─ Registration deadline

exam_student_slots
  ├─ Seat allocation
  ├─ Slot availability
  └─ Test session link

school_audit_logs
  ├─ All school actions
  ├─ IP + user agent
  └─ Timestamp
```

### Updated Tables (2)
```
schools
  + email (for auth)
  + auth_method (code/email/both)
  + CSV upload enabled
  + Exam scheduling enabled
  + Student limit
  + API key hash

registrations
  + enrolled_via_school (bool)
  + school_enrollment_id (FK)
  + school_id (FK)
  + assigned_exam_id (FK)
```

---

## Code Structure

### New JavaScript Methods (in `assets/js/db.js`)

**Authentication:**
```javascript
SahirahDB.schoolLoginWithEmail(email, password)
SahirahDB.sendPasswordResetCode(email)
SahirahDB.verifyPasswordResetCode(email, code)
SahirahDB.resetPassword(email, resetToken, newPassword)
```

**Student Management (ready for Phase 2):**
```javascript
SahirahDB.addSchoolStudent(schoolId, studentData)
SahirahDB.trackCsvUpload(schoolId, uploadData)
```

**Exam Scheduling (ready for Phase 3):**
```javascript
SahirahDB.createExamSchedule(schoolId, examData)
SahirahDB.getSchoolExams(schoolId)
```

**Audit:**
```javascript
SahirahDB.logSchoolAction(schoolId, action, details)
```

---

## Security Features Implemented

| Feature | How It Works |
|---------|-------------|
| **Account Lockout** | 5 failed attempts → 15 min lockout |
| **Password Reset** | 6-digit code (15 min expiry) |
| **Session Tokens** | JWT expires after 1 hour |
| **Audit Logging** | All actions tracked with IP/user agent |
| **Data Isolation** | Schools see only their data (RLS policies) |

---

## Testing Without Backend Setup

### Quick Test (No Supabase needed):
```javascript
// In browser console:
// Test password hashing
const pwd = "TestPassword123";
const salt = "testsalt";
const hash = await SahirahDB._hashPassword(pwd, salt);
console.log(hash);

// Test JWT generation
const token = SahirahDB._generateJWT({type: 'test'});
console.log(token);
```

### Full Test (Requires Supabase):
1. Run schema migration: `supabase-schema-b2b-phase1.sql`
2. Create test data in Supabase:
   ```sql
   INSERT INTO schools (id, school_name, email, school_code, is_active)
   VALUES ('uuid-here', 'Test School', 'test@school.edu', 'SCH-TEST-001', true);
   ```
3. Test login at `/school-auth/login/`

---

## Deployment Checklist

Before launching Phase 2:

- [ ] Run schema migration in Supabase
- [ ] Create initial school accounts
- [ ] Test email login flow
- [ ] Test password reset
- [ ] Verify session persistence
- [ ] Check audit logs
- [ ] **CRITICAL:** Move password hashing to backend
- [ ] **CRITICAL:** Move JWT signing to backend
- [ ] Implement email sending for reset codes
- [ ] Add backend rate limiting on login attempts

---

## FAQ

### Q: Can schools still use access codes?
**A:** Yes! Both methods work. The tab selector on `/school-auth/login/` supports both.

### Q: How long are sessions valid?
**A:** JWT tokens expire after 1 hour. Refresh tokens extend the session.

### Q: What happens after 5 failed logins?
**A:** Account is locked for 15 minutes. Failed attempts and lockout timestamp are tracked.

### Q: Can students use the school email/password login?
**A:** No. This is admin-only. Students still register normally and optionally enter school code.

### Q: Is password hashing secure?
**A:** Currently it's SHA-256 (for testing only). **Must switch to bcrypt on backend before production.**

### Q: What about MFA?
**A:** Prepared in database schema but not implemented. Ready for Phase 2 if needed.

---

## Files to Review

1. **`school-auth/login/index.html`** — Login page (2 tabs)
2. **`school-auth/reset/index.html`** — Password reset wizard
3. **`assets/js/db.js`** — Look for "PHASE 1: SCHOOL AUTHENTICATION" section
4. **`supabase-schema-b2b-phase1.sql`** — Database schema
5. **`PHASE1-IMPLEMENTATION-SUMMARY.md`** — Detailed technical docs

---

## What's Next?

### Phase 2 Priority: Student Management
- [ ] Individual student registration form
- [ ] CSV template download
- [ ] Bulk CSV import
- [ ] Student list with CRUD operations
- [ ] Duplicate detection
- [ ] Parent email notifications

### Phase 3: Exam Scheduling
- [ ] Exam calendar UI
- [ ] Create/edit exams
- [ ] Student exam registration
- [ ] Capacity management
- [ ] Exam results view

### Phase 4: Dashboard & Settings
- [ ] Enhanced metrics
- [ ] School settings page
- [ ] API key management
- [ ] Notification preferences
- [ ] Data export

---

## Quick Commands for Testing

```bash
# Start local server (if not running)
python3 -m http.server 8000

# Test login page
open http://localhost:8000/school-auth/login

# Test password reset
open http://localhost:8000/school-auth/reset

# Check console for password reset codes during testing
# (They print to console since email isn't configured yet)
```

---

**Ready for Phase 2!** 🚀

Next session: Student Management Implementation

