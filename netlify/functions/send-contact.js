// netlify/functions/send-contact.js
// Sends a contact-form submission to contact@sahirah.in via Resend.
// reply_to is set to the submitter's own email, so replying from the
// inbox goes straight back to them.
//
// Uses the same RESEND_API_KEY as send-email.js / send-receipt.js / resend-credentials.js.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS    = 'Sahirah.in <contact@sahirah.in>';
const TO_ADDRESS      = 'contact@sahirah.in';

function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e); }

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: 'Bad Request' }; }

  const { name, email, message } = body;
  if (!name || !email || !message || !isValidEmail(email)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'name, a valid email, and message are required' }),
    };
  }

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Email service not configured' }),
    };
  }

  const html = buildContactHtml({ name, email, message });

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [TO_ADDRESS],
        reply_to: email,
        subject: `New Contact Form Message from ${name}`,
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
    console.error('send-contact error:', e);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: e.message }),
    };
  }
};

function buildContactHtml({ name, email, message }) {
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
        <div style="font-size:11px;color:rgba(253,248,240,.4);margin-top:4px;letter-spacing:.08em;text-transform:uppercase;">Contact Form Submission</div>
      </td></tr>

      <!-- BODY -->
      <tr><td style="background:#fff;padding:32px 32px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1A1208;border-radius:14px;padding:20px 24px;margin-bottom:20px;">
          <tr><td>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,.07);">
                  <span style="font-size:11px;color:rgba(253,248,240,.4);text-transform:uppercase;letter-spacing:.06em;">Name</span><br/>
                  <span style="font-size:15px;font-weight:700;color:#FDF8F0;">${esc(name)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;">
                  <span style="font-size:11px;color:rgba(253,248,240,.4);text-transform:uppercase;letter-spacing:.06em;">Email</span><br/>
                  <span style="font-family:'Courier New',monospace;font-size:14px;font-weight:700;color:#F5D98A;">${esc(email)}</span>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>

        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(26,18,8,.4);margin-bottom:8px;">Message</div>
        <p style="margin:0;color:rgba(26,18,8,.8);line-height:1.7;white-space:pre-wrap;">${esc(message)}</p>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:#F2EEE6;border-radius:0 0 20px 20px;padding:20px 32px;text-align:center;">
        <p style="margin:0;font-size:11px;color:rgba(26,18,8,.35);line-height:1.7;">
          Sent from the Sahirah.in contact form · Reply to this email to respond directly to ${esc(name)}
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
