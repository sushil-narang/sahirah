// netlify/functions/verify-razorpay-payment.js
// Verifies a Razorpay payment signature server-side before granting access.
//
// Algorithm (Razorpay spec):
//   HMAC-SHA256( order_id + "|" + payment_id , KEY_SECRET )
//   must equal razorpay_signature received from checkout

const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
  if (!KEY_SECRET) {
    console.error('RAZORPAY_KEY_SECRET not set');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Payment verification not configured' }),
    };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: 'Invalid JSON' }; }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Missing required fields' }),
    };
  }

  const generated = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generated !== razorpay_signature) {
    console.warn('Razorpay signature mismatch', { razorpay_order_id, razorpay_payment_id });
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Signature verification failed' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, verified: true, payment_id: razorpay_payment_id }),
  };
};
