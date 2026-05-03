const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY not set in Netlify environment variables' } }),
    };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: 'Bad Request' }; }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();
  return {
    statusCode: upstream.status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
};
