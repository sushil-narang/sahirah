// netlify/functions/create-razorpay-order.js
// Creates a Razorpay order server-side and returns the order_id to the frontend.
//
// SETUP (one-time):
//   1. Create a Razorpay account at https://razorpay.com
//   2. Dashboard → Settings → API Keys → Generate Test Key
//   3. In Netlify → Site Settings → Environment Variables → add:
//        RAZORPAY_KEY_ID     = rzp_test_XXXXXXXXXXXX  (or rzp_live_XXX for production)
//        RAZORPAY_KEY_SECRET = your_key_secret
//   4. Also add RAZORPAY_KEY_ID to the payment page JS (frontend uses it to open checkout)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const KEY_ID     = process.env.RAZORPAY_KEY_ID;
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  if (!KEY_ID || !KEY_SECRET) {
    console.warn('Razorpay keys not configured — returning mock order');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Razorpay not configured' }),
    };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: 'Invalid JSON' }; }

  const amountPaise = Math.round((body.amount || 0) * 100); // rupees → paise
  if (amountPaise < 100) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Invalid amount' }),
    };
  }

  const credentials = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');

  try {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify({
        amount:   amountPaise,
        currency: 'INR',
        receipt:  body.receipt || `shrs_${Date.now()}`,
        notes: {
          plan:   body.plan   || 'basic',
          source: 'sahirah.in',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Razorpay API error:', errText);
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, error: 'Order creation failed' }),
      };
    }

    const order = await response.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, order_id: order.id, amount: order.amount }),
    };
  } catch (e) {
    console.error('create-razorpay-order error:', e);
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Network error' }),
    };
  }
};
