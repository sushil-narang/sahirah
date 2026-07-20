// netlify/functions/resend-credentials.js
// Resets a parent's forgotten password and emails new login credentials.
//
// Password hashing MUST match register/index.html and login/index.html's
// client-side hashPassword(): SHA-256('sahirah.in:' + password), no bcrypt
// and no per-user salt (both files use the exact same fixed-prefix scheme).
// Hashing this any other way would generate a password that could never
// actually be used to log in.
//
// Uses the same RESEND_API_KEY as send-email.js / send-receipt.js.

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS    = 'Sahirah.in <contact@sahirah.in>';
const REPLY_TO        = 'contact@sahirah.in';
const LOGIN_URL       = 'https://sahirah.in/login/';

function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e); }

function hashPassword(password) {
  return crypto.createHash('sha256').update('sahirah.in:' + password).digest('hex');
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: 'Bad Request' }; }

  const { email } = body;
  if (!email || !isValidEmail(email)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Please enter a valid email address.' }),
    };
  }

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    const { data: found, error: findErr } = await db
      .from('registrations')
      .select('reg_id, login_id, child_first_name, parent_name, slot')
      .eq('parent_email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (findErr) throw findErr;

    if (!found) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'No registration found for this email address.' }),
      };
    }

    const newPass = generatePassword();
    const hashedPass = hashPassword(newPass);

    const { error: updateErr } = await db
      .from('registrations')
      .update({ password_hash: hashedPass })
      .eq('reg_id', found.reg_id);
    if (updateErr) throw updateErr;

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not set');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Email service not configured' }),
      };
    }

    const html = buildCredentialsHtml({
      parent_name: found.parent_name,
      child_first_name: found.child_first_name,
      login_id: found.login_id,
      newPass,
    });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [email],
        reply_to: REPLY_TO,
        subject: 'Your Sahirah.in Login Credentials',
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Resend error:', data);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: data.message }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    };
  } catch (e) {
    console.error('resend-credentials error:', e);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: e.message }),
    };
  }
};

// ----------------------------------------------------------------
// HTML email template
// ----------------------------------------------------------------
function buildCredentialsHtml({ parent_name, child_first_name, login_id, newPass }) {
  const name = parent_name || 'Parent';
  const childStr = child_first_name || 'your child';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F2EEE6;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#1A1208;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F2EEE6;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

      <!-- HEADER -->
      <tr><td style="background:#1A1208;border-radius:20px 20px 0 0;padding:28px 32px 24px;text-align:center;">
        <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#FDF8F0;">Sahir<span style="color:#C8860A;">ah</span>.in</div>
        <div style="font-size:11px;color:rgba(253,248,240,.4);margin-top:4px;letter-spacing:.08em;text-transform:uppercase;">Psychometric Evaluation</div>
      </td></tr>

      <!-- BODY -->
      <tr><td style="background:#fff;padding:32px 32px 24px;">
        <p style="margin:0 0 16px;font-size:16px;">Dear <strong>${esc(name)}</strong>,</p>
        <p style="margin:0 0 20px;color:rgba(26,18,8,.7);line-height:1.7;">
          Here are the login credentials for <strong>${esc(childStr)}</strong>'s Sahirah.in evaluation. Your password has been reset.
        </p>

        <!-- CREDENTIALS BOX -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1A1208;border-radius:14px;padding:20px 24px;margin-bottom:20px;">
          <tr><td>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,.07);">
                  <span style="font-size:11px;color:rgba(253,248,240,.4);text-transform:uppercase;letter-spacing:.06em;">Login ID</span><br/>
                  <span style="font-family:'Courier New',monospace;font-size:15px;font-weight:700;color:#FDF8F0;">${esc(login_id)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;">
                  <span style="font-size:11px;color:rgba(253,248,240,.4);text-transform:uppercase;letter-spacing:.06em;">Password</span><br/>
                  <span style="font-family:'Courier New',monospace;font-size:15px;font-weight:700;color:#FDF8F0;">${esc(newPass)}</span>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>

        <!-- CTA -->
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${esc(LOGIN_URL)}" style="display:inline-block;background:#0A6B5E;color:#fff;text-decoration:none;border-radius:100px;padding:14px 32px;font-size:15px;font-weight:600;">Test Portal →</a>
        </div>

        <p style="margin:0 0 8px;font-size:13px;color:rgba(26,18,8,.5);line-height:1.7;">
          Please save these — your previous password no longer works.
        </p>
        <p style="margin:0;font-size:13px;color:rgba(26,18,8,.5);line-height:1.7;">
          Questions? <a href="mailto:contact@sahirah.in" style="color:#0A6B5E;">contact@sahirah.in</a>
        </p>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:#F2EEE6;border-radius:0 0 20px 20px;padding:20px 32px;text-align:center;">
        <p style="margin:0;font-size:11px;color:rgba(26,18,8,.35);line-height:1.7;">
          Team Sahirah.in<br/>
          © 2025 Sahirah.in · All rights reserved
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
