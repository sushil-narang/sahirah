# Sahirah.in — Claude API Integration

## Where the API is used

| Feature | File | Purpose |
|---------|------|---------|
| Sahira chat widget | pages/sahirah.html | Real-time conversational AI assistant |
| Report narrative | pages/sahirah-report.html | Personalised 3-paragraph AI assessment |

---

## API Call — Sahira Chat

```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    system: SAHIRA_SYSTEM_PROMPT,   // see assets/js/sahira.js
    messages: conversationHistory,  // full history for multi-turn
  })
});
```

Sahira maintains conversation history for multi-turn dialogue. The system prompt defines her persona, knowledge, and tone.

---

## API Call — Report Narrative

```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: buildReportPrompt(scores), // child scores injected
    }]
  })
});
```

The report prompt includes all 6 dimension scores and asks Claude to write a warm, specific 3-paragraph assessment in Sahira's voice.

---

## Fallback Behaviour

Both features degrade gracefully without an API key:

- **Sahira chat** — returns keyword-matched pre-written responses
- **Report narrative** — displays a high-quality static narrative based on demo scores

The rest of the platform (registration, test, charts, PDF, admin) works fully without any API calls.

---

## Model

Both calls use `claude-sonnet-4-20250514` — the best balance of quality and speed for real-time chat and report generation.

- Sahira responses: max 400 tokens (~80 words) — keeps chat snappy
- Report narrative: max 1000 tokens (~200 words) — allows rich 3-paragraph output

---

## Rate Limits & Cost Estimates

At launch scale (50 tests/day):
- Sahira: ~5 API calls per session × 50 sessions = 250 calls/day
- Reports: 1 call per completed test = 50 calls/day
- Total: ~300 calls/day — well within free tier / starter plan limits
