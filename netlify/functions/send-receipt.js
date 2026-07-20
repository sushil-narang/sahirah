// netlify/functions/send-receipt.js
// Sends a payment receipt email via Resend after a successful Razorpay payment.
//
// parent_name / parent_email / child_name are optional — if omitted, they are
// looked up server-side from the `registrations` table using reg_id. This
// keeps the email correct regardless of which flow (register vs standalone
// payment) triggers it, instead of depending on client-supplied data that
// isn't reliably available in every flow.
//
// SETUP: uses the same RESEND_API_KEY as send-email.js — no new env var needed.

const { createClient } = require('@supabase/supabase-js');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS    = 'Sahirah.in <contact@sahirah.in>';
const REPLY_TO        = 'contact@sahirah.in';
const REPORT_URL      = 'https://sahirah.in/report/';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: 'Bad Request' }; }

  const { reg_id, payment_id, amount, plan_type } = body;
  let { parent_name, parent_email, child_name } = body;

  if (!reg_id || !payment_id || !amount || !plan_type) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'reg_id, payment_id, amount, and plan_type are required' }),
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

  // Fill in any missing name/email fields from the registration record
  if (!parent_name || !parent_email || !child_name) {
    try {
      const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
      const { data: reg } = await db
        .from('registrations')
        .select('child_first_name, child_last_name, parent_name, parent_email')
        .eq('reg_id', reg_id)
        .maybeSingle();

      if (reg) {
        parent_name  = parent_name  || reg.parent_name;
        parent_email = parent_email || reg.parent_email;
        child_name   = child_name   || [reg.child_first_name, reg.child_last_name].filter(Boolean).join(' ');
      }
    } catch (e) {
      console.error('Registration lookup failed:', e);
    }
  }

  if (!parent_email) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'No email address on file for this registration' }),
    };
  }

  const html = buildReceiptHtml({ parent_name, child_name, payment_id, amount, plan_type });

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [parent_email],
        reply_to: REPLY_TO,
        subject: `Payment Confirmed — Sahirah.in Report for ${child_name || 'your child'}`,
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
    console.error('Receipt email send exception:', e);
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
function buildReceiptHtml({ parent_name, child_name, payment_id, amount, plan_type }) {
  const name = parent_name || 'Parent';
  const childStr = child_name || 'your child';
  const amountStr = Number(amount).toLocaleString('en-IN');
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

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
        <div style="text-align:center;margin-bottom:20px;">
          <div style="display:inline-block;background:#E0F2EE;color:#0A6B5E;border-radius:100px;padding:8px 20px;font-size:14px;font-weight:700;">✅ Payment Confirmed</div>
        </div>

        <p style="margin:0 0 16px;font-size:16px;">Dear <strong>${esc(name)}</strong>,</p>
        <p style="margin:0 0 20px;color:rgba(26,18,8,.7);line-height:1.7;">
          Thank you. Your report for <strong>${esc(childStr)}</strong> is now ready.
        </p>

        <!-- RECEIPT BOX -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1A1208;border-radius:14px;padding:20px 24px;margin-bottom:24px;">
          <tr><td>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(253,248,240,.35);margin-bottom:14px;">Payment Receipt</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,.07);">
                  <span style="font-size:11px;color:rgba(253,248,240,.4);text-transform:uppercase;letter-spacing:.06em;">Payment ID</span><br/>
                  <span style="font-family:'Courier New',monospace;font-size:14px;font-weight:700;color:#F5D98A;">${esc(payment_id)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,.07);">
                  <span style="font-size:11px;color:rgba(253,248,240,.4);text-transform:uppercase;letter-spacing:.06em;">Plan</span><br/>
                  <span style="font-size:15px;font-weight:700;color:#FDF8F0;">${esc(plan_type)} (₹${esc(amountStr)})</span>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,.07);">
                  <span style="font-size:11px;color:rgba(253,248,240,.4);text-transform:uppercase;letter-spacing:.06em;">Date</span><br/>
                  <span style="font-size:15px;font-weight:700;color:#FDF8F0;">${esc(dateStr)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;">
                  <span style="font-size:11px;color:rgba(253,248,240,.4);text-transform:uppercase;letter-spacing:.06em;">Student</span><br/>
                  <span style="font-size:15px;font-weight:700;color:#FDF8F0;">${esc(childStr)}</span>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>

        <!-- CTA -->
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${esc(REPORT_URL)}" style="display:inline-block;background:#0A6B5E;color:#fff;text-decoration:none;border-radius:100px;padding:14px 32px;font-size:15px;font-weight:600;">→ View Report Now</a>
        </div>

        <p style="margin:0 0 8px;font-size:13px;color:rgba(26,18,8,.5);line-height:1.7;">
          Save this email as your receipt.
        </p>
        <p style="margin:0;font-size:13px;color:rgba(26,18,8,.5);line-height:1.7;">
          Queries: <a href="mailto:contact@sahirah.in" style="color:#0A6B5E;">contact@sahirah.in</a>
        </p>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:#F2EEE6;border-radius:0 0 20px 20px;padding:20px 32px;text-align:center;">
        <p style="margin:0;font-size:11px;color:rgba(26,18,8,.35);line-height:1.7;">
          Team Sahirah.in · Sahi Raah<br/>
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
