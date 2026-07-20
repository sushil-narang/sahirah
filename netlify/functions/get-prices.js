exports.handler = async () => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    basic:   parseInt(process.env.PRICE_BASIC)   || 499,
    premium: parseInt(process.env.PRICE_PREMIUM) || 1499,
  })
});
