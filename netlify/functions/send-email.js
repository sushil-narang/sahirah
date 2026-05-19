// netlify/functions/send-email.js
// Sends registration confirmation email via Resend API.
//
// SETUP (one-time, ~3 minutes):
//   1. Go to https://resend.com  — sign up free (3,000 emails/month free)
//   2. Dashboard → API Keys → Create API Key → copy it
//   3. In Netlify → Site Settings → Environment Variables → add:
//        RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxx
//   4. (Optional) Verify your domain in Resend for a custom "from" address.
//      Until then, emails send from onboarding@resend.dev (works fine for testing).

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS   = process.env.EMAIL_FROM || 'Sahirah.in <onboarding@resend.dev>';
const REPLY_TO       = process.env.EMAIL_REPLY_TO || 'support@sahirah.in';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return {
      statusCode: 200, // return 200 so registration still completes
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Email service not configured' }),
    };
  }

  let params;
  try { params = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: 'Bad Request' }; }

  const { to_email, to_name, child_name, reg_id, login_id, password, slot, portal_url } = params;

  if (!to_email || !login_id || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  const html = buildEmailHtml({ to_name, child_name, reg_id, login_id, password, slot, portal_url });

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to_email],
        reply_to: REPLY_TO,
        subject: `Your Sahirah.in login credentials — ${child_name || 'Evaluation'}`,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Resend error:', data);
      return { statusCode: 200, body: JSON.stringify({ ok: false, error: data.message }) };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true, id: data.id }) };
  } catch(e) {
    console.error('Email send exception:', e);
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};

// ----------------------------------------------------------------
// HTML email template
// ----------------------------------------------------------------
function buildEmailHtml({ to_name, child_name, reg_id, login_id, password, slot, portal_url }) {
  const name = to_name || 'Parent';
  const childStr = child_name || 'your child';
  const slotStr = slot && slot !== '—' ? slot : 'Your scheduled slot';
  const url = portal_url || 'https://sahirah.in/login';

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
          <strong>${esc(childStr)}</strong> is now registered for the Sahirah.in psychometric evaluation.
          Below are the login credentials — please keep them safe.
        </p>

        <!-- CREDENTIALS BOX -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1A1208;border-radius:14px;padding:20px 24px;margin-bottom:20px;">
          <tr><td>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(253,248,240,.35);margin-bottom:14px;">Login Credentials</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,.07);">
                  <span style="font-size:11px;color:rgba(253,248,240,.4);text-transform:uppercase;letter-spacing:.06em;">Registration ID</span><br/>
                  <span style="font-family:'Courier New',monospace;font-size:15px;font-weight:700;color:#F5D98A;">${esc(reg_id || '')}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,.07);">
                  <span style="font-size:11px;color:rgba(253,248,240,.4);text-transform:uppercase;letter-spacing:.06em;">Login ID</span><br/>
                  <span style="font-family:'Courier New',monospace;font-size:15px;font-weight:700;color:#FDF8F0;">${esc(login_id)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;">
                  <span style="font-size:11px;color:rgba(253,248,240,.4);text-transform:uppercase;letter-spacing:.06em;">Password</span><br/>
                  <span style="font-family:'Courier New',monospace;font-size:15px;font-weight:700;color:#FDF8F0;">${esc(password)}</span>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>

        <!-- SLOT INFO -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF0CC;border:1px solid #F5D98A;border-radius:12px;padding:14px 18px;margin-bottom:24px;">
          <tr><td>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#C8860A;margin-bottom:4px;">Scheduled Slot</div>
            <div style="font-size:16px;font-weight:700;color:#1A1208;">${esc(slotStr)}</div>
            <div style="font-size:12px;color:rgba(26,18,8,.5);margin-top:3px;">The test portal will be accessible from your scheduled time.</div>
          </td></tr>
        </table>

        <!-- CTA -->
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${esc(url)}" style="display:inline-block;background:#0A6B5E;color:#fff;text-decoration:none;border-radius:100px;padding:14px 32px;font-size:15px;font-weight:600;">Login to Test Portal →</a>
        </div>

        <p style="margin:0 0 8px;font-size:13px;color:rgba(26,18,8,.5);line-height:1.7;">
          Use the Login ID and Password above when signing in at <a href="${esc(url)}" style="color:#0A6B5E;">${esc(url)}</a>.
          The 2-hour evaluation window begins at your scheduled slot time.
        </p>
        <p style="margin:0;font-size:13px;color:rgba(26,18,8,.5);line-height:1.7;">
          Need help? Reply to this email or contact us at <a href="mailto:support@sahirah.in" style="color:#0A6B5E;">support@sahirah.in</a>
        </p>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:#F2EEE6;border-radius:0 0 20px 20px;padding:20px 32px;text-align:center;">
        <p style="margin:0;font-size:11px;color:rgba(26,18,8,.35);line-height:1.7;">
          Sahirah.in · AI-powered Psychometric Evaluation for School Children<br/>
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
