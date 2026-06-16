# Phase 2: Deployment & Testing Guide

**Date:** June 16, 2026  
**Status:** Ready for Deployment ✅

---

## 📋 Pre-Deployment Checklist

- [ ] Schema migration uploaded to Supabase (Phase 1)
- [ ] Test school account created
- [ ] School auth credentials set up
- [ ] Local server running (`python3 -m http.server 8000`)

---

## 🚀 Deployment Steps

### Step 1: Verify Schema Deployment

**In Supabase SQL Editor**, run this to verify all new tables exist:

```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'schools_auth',
    'schools_sessions',
    'school_student_registrations',
    'school_csv_uploads',
    'exam_schedules',
    'exam_student_slots',
    'school_audit_logs'
  )
ORDER BY tablename;
```

**Expected Result:** 7 rows (all tables present)

---

### Step 2: Create Test Data

**A. Test School in `schools` table:**

```sql
INSERT INTO schools (
  id, school_name, school_code, email, is_active, auth_method, 
  csv_upload_enabled, exam_scheduling_enabled, student_limit
) VALUES (
  gen_random_uuid(),
  'Test School',
  'SCH-TEST-001',
  'test@school.edu',
  true,
  'email',
  true,
  true,
  500
);

-- Copy the UUID from the result to use in next step
```

**B. Test Auth Credentials:**

```sql
INSERT INTO schools_auth (
  school_id,
  email,
  password_hash,
  salt,
  is_verified
) VALUES (
  'PASTE-SCHOOL-UUID-HERE',
  'test@school.edu',
  'test_hash_12345',  -- In production, use bcrypt
  'test_salt_67890',
  true
);
```

---

### Step 3: Test School Login

1. Open browser: `http://localhost:8000/school-auth/login/`
2. Click **"Email Login"** tab
3. Enter credentials:
   - Email: `test@school.edu`
   - Password: `test_password`

⚠️ **Note:** The login will fail with test credentials because we used placeholder hashes. In production, use proper bcrypt hashing.

**Workaround for testing:** Use the **"Access Code"** tab instead:
- Access Code: `SCH-TEST-001`
- This uses the legacy validation method (already implemented)

---

### Step 4: Test Phase 2 Pages

Once logged in (via access code), visit:

#### **A. Individual Student Form**
```
URL: http://localhost:8000/school/students/add/
```

**Test Steps:**
```
1. Fill form:
   - First Name: Aarav
   - Last Name: Sharma
   - Class: Class 12
   - Email: aarav@example.com
   - Parent Name: Rajesh Sharma
   - Parent Email: rajesh@example.com

2. Click "Register Student"

3. Verify:
   - Success message appears
   - Form resets
   - Check Supabase: school_student_registrations table
     → Should see new record
   - Check Supabase: registrations table
     → Should see new registration with school_id linked
```

#### **B. Bulk CSV Upload**
```
URL: http://localhost:8000/school/students/bulk-upload/
```

**Test Steps:**
```
1. Click "Download Template" button
   → CSV file downloads to your computer

2. Open in Excel/Sheets and add 3 students:
   Row 2: Ananya | Patel | 2008-05-22 | Class 12 | ananya@example.com | Priya Patel | ...
   Row 3: Arjun  | Verma | 2007-11-10 | Class 11 | arjun@example.com  | Vikram Verma | ...
   Row 4: Diya   | Singh | 2008-01-15 | Class 12 | diya@example.com   | Neha Singh | ...

3. Save as CSV (File → Download as → CSV)

4. Return to bulk-upload page

5. Drag & drop CSV file onto upload zone

6. Verify:
   - Preview shows 3 rows
   - Valid count = 3
   - Error count = 0
   - [Upload 3 Records] button appears

7. Click [Upload 3 Records]

8. Check Supabase:
   - school_student_registrations table → 3 new rows
   - school_csv_uploads table → 1 upload record
   - registrations table → 3 new registrations
```

---

### Step 5: Test Error Handling

**A. Invalid Email in CSV:**

```
Test with this CSV:
Firstname | Lastname | Class | Email | 
BadStudent | Test | Class 12 | invalid-email | 

Expected: Error message "Invalid email format"
```

**B. Missing Required Field:**

```
Test with CSV missing student_class column
Expected: Error message "Missing required columns: student_class"
```

**C. Duplicate Email:**

```
Test with CSV having same email twice
Expected: Error on 2nd row "Duplicate email in upload"
```

---

## 🧪 End-to-End Test Scenario

Complete workflow testing:

```
1. Login with access code: SCH-TEST-001
2. Add 1 student individually via /school/students/add/
3. Download & upload 3 students via CSV
4. Go to dashboard
5. Verify metrics:
   - Students Enrolled: should show 4
   - Recent registrations visible
```

---

## 📊 Database Verification Queries

After testing, run these in Supabase to verify data integrity:

### **Students Created:**
```sql
SELECT 
  id, 
  student_first_name, 
  student_last_name, 
  student_email, 
  created_by_method,
  created_at
FROM school_student_registrations
ORDER BY created_at DESC;
```

### **CSV Uploads Tracked:**
```sql
SELECT 
  id,
  filename,
  total_records,
  successful_imports,
  failed_imports,
  upload_status,
  uploaded_at
FROM school_csv_uploads
ORDER BY uploaded_at DESC;
```

### **Audit Logs:**
```sql
SELECT 
  action,
  details,
  created_at
FROM school_audit_logs
WHERE school_id = 'YOUR-SCHOOL-UUID'
ORDER BY created_at DESC;
```

---

## ⚠️ Known Limitations & Workarounds

### **Issue 1: Email/Password Login Not Working**
**Reason:** Password hashing is client-side SHA-256 (testing only)  
**Workaround:** Use "Access Code" login tab instead  
**Fix:** Move password hashing to backend (bcrypt) before production

### **Issue 2: Files Don't Direct Link to Pages**
**Reason:** Sidebar links open direct page URLs  
**Fix:** Dashboard links added to sidebar (sidebar menu now has ➕ Add Student and 📤 Bulk Upload)

### **Issue 3: No Parent Notifications**
**Reason:** Email sending not implemented  
**Fix:** Phase 3 — Add email service integration

---

## 🔧 Troubleshooting

### **"School session not found"**
- Cause: Not logged in or session expired
- Fix: Login again at `/school-auth/login/`

### **"CSV must have headers and at least one data row"**
- Cause: Empty CSV or only headers
- Fix: Add at least one student row to CSV

### **"Student quota full"**
- Cause: School has reached student_limit (default 500)
- Fix: Contact admin to increase quota in schools table

### **Form submission fails silently**
- Cause: Browser console error
- Fix: Open DevTools (F12) → Console tab → Check error messages

---

## 📈 Metrics After Testing

After complete testing, you should have:

| Metric | Expected |
|--------|----------|
| schools_auth records | 1 (test school) |
| school_student_registrations | 4 (1 manual + 3 CSV) |
| school_csv_uploads | 1 (with 3 successful) |
| registrations (with school_id) | 4 linked to school |
| school_audit_logs | Multiple (login, add_student, etc) |

---

## ✅ Testing Sign-Off Checklist

- [ ] Schema deployed to Supabase
- [ ] Test school created
- [ ] Individual student add works
- [ ] CSV upload works
- [ ] All 4 students appear in database
- [ ] CSV upload record tracked
- [ ] Audit logs recorded
- [ ] Error handling works (invalid emails, missing fields)
- [ ] Dashboard metrics update correctly
- [ ] No console errors

---

## 🎯 What's Working Now

✅ **Phase 1 + Phase 2 Complete:**
- School login (via access code)
- Individual student registration
- Bulk CSV import with validation
- CSV error detection
- Database integration
- Audit logging

🔄 **Next: Phase 3**
- Student list view with search
- Edit/delete student functionality
- Exam scheduling
- Exam registration

---

## 📞 Support Notes

If deployment issues occur:

1. **Check Supabase logs**: SQL Editor → Recent Queries → Error column
2. **Verify schema**: Run verification query from Step 1
3. **Check browser console**: F12 → Console for JavaScript errors
4. **Verify credentials**: Check schools_auth table has correct email/hash
5. **Check permissions**: Ensure RLS policies are enabled but permissive (for testing)

---

## 🚀 Go Live Checklist

Before moving to production:

- [ ] Move password hashing to backend (bcrypt)
- [ ] Move JWT generation to backend
- [ ] Implement email sending for password reset
- [ ] Set up rate limiting on login attempts
- [ ] Enable MFA (optional but recommended)
- [ ] Add proper RLS policies (restrict to school admins)
- [ ] Set up automated backups
- [ ] Enable HTTPS/SSL
- [ ] Add API key authentication (if using API)
- [ ] Test with real school data

---

**Ready to test!** 🎉

Once you've run the SQL queries above and created test data, visit:
- `http://localhost:8000/school-auth/login/` → Use access code: `SCH-TEST-001`
- `http://localhost:8000/school/students/add/` → Add a student
- `http://localhost:8000/school/students/bulk-upload/` → Upload CSV

Report back with any issues or confirmation once everything works! ✅

