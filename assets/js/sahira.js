/**
 * Sahirah.in — Avanya AI Assistant
 * Handles all Claude API calls for the chat widget
 *
 * Usage:
 *   <script src="../assets/js/sahira.js"></script>
 *   const sahira = new SahiraChat('container-id', { apiKey: 'YOUR_KEY' });
 *
 * SECURITY NOTE:
 *   Do NOT embed a real Anthropic API key directly in client-side code.
 *   Doing so exposes the key to any user who views the page source or
 *   inspects network traffic. For production, route API calls through a
 *   backend proxy that holds the key server-side and enforces rate limits.
 *   This widget falls back to pre-written responses when no key is provided.
 */

const SAHIRA_SYSTEM_PROMPT = `You are Avanya, the friendly and knowledgeable AI guide for Sahirah.in — India's psychometric testing platform for school children. "Sahirah" means "Sahi Raah" — the right path in Hindi.

Your role:
- Help parents and students understand the four Indian education streams: Humanities, Commerce, Medical, Non-Medical
- Explain careers within each stream (IAS, CA, MBBS, CS/AI, Architecture, etc.)
- Explain how the Sahirah.in psychometric evaluation works (2-hour evaluation, 6 assessment types)
- Help determine if the evaluation is right for a child and at what age (ideal: Class 7-10)
- Encourage registration when appropriate

Key platform facts:
- Evaluation is 2 hours long, 6 assessment types
- Best age: Class 7 to Class 10 (roughly 12-16 years)
- Four streams: Humanities (IAS/Law/Design/Psychology), Commerce (CA/CS/MBA/Banking), Medical (MBBS/BDS/Pharmacy/Biotech), Non-Medical (CS/AI/Electronics/Civil/Mech/Architecture/Robotics)
- Two-stage scoring: first identifies stream, then specific career within stream
- Report includes: stream scores, top 3 careers, personality insights, EQ profile, entrance exam roadmap, skill gap analysis, PDF download
- Registration includes 12 pre-assessment questions
- Test is unique for every child (randomised question selection — 75% standardised, 25% random)
- Entrance exams covered: JEE, NEET, UPSC, CA Foundation, CLAT, NID, NIFT

Tone: Warm, knowledgeable, encouraging. Use simple language. Occasionally use Hindi words naturally (Namaste, bilkul, sahi, etc.). Keep responses concise — 2-4 sentences typically. Always guide toward the right next step.`;

class SahiraChat {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.apiKey = options.apiKey || '';
    this.history = [];
    this._callCount = 0;
    this._callWindowStart = Date.now();
    this._MAX_CALLS_PER_MINUTE = 10;
    this.suggestions = [
      ['Which stream for my child?', 'What is the test like?', 'Right age for the test?', 'Careers in Non-Medical'],
      ['What will the report show?', 'Careers in Medical stream', 'Is my child too young?', 'How do I register?'],
      ['Difference: CS vs Electronics?', 'What is IAS preparation?', 'CA vs MBA — which is better?', 'How is the test scored?'],
    ];
    this.sugIdx = 0;
  }

  _checkRateLimit() {
    const now = Date.now();
    if(now - this._callWindowStart > 60000) {
      this._callWindowStart = now;
      this._callCount = 0;
    }
    if(this._callCount >= this._MAX_CALLS_PER_MINUTE) {
      return false;
    }
    this._callCount++;
    return true;
  }

  async ask(userMessage) {
    this.history.push({ role: 'user', content: userMessage });

    if(!this._checkRateLimit()) {
      return 'You\'re sending messages very quickly! Please wait a moment before asking again.';
    }

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          system: SAHIRA_SYSTEM_PROMPT,
          messages: this.history,
        }),
      });

      const data = await res.json();
      const reply = data.content?.[0]?.text || this.fallback(userMessage);
      this.history.push({ role: 'assistant', content: reply });
      return reply;

    } catch (err) {
      return this.fallback(userMessage);
    }
  }

  fallback(userMessage) {
    const q = userMessage.toLowerCase();
    if (q.includes('stream') || q.includes('humanities') || q.includes('commerce') || q.includes('medical') || q.includes('non-medical')) {
      return 'There are four streams in India — Humanities, Commerce, Medical, and Non-Medical. Each requires a different kind of brain. Our 2-hour evaluation identifies which stream your child is truly wired for, then finds the specific career within that stream. Would you like to know more about a particular stream?';
    }
    if (q.includes('age') || q.includes('class') || q.includes('old')) {
      return 'The ideal age for this evaluation is Class 7 to Class 10 — roughly 12 to 16 years. This gives your child enough time to choose the right stream and prepare before the Class 10 decision. The earlier they know, the better prepared they can be.';
    }
    if (q.includes('report') || q.includes('result')) {
      return 'Your child\'s report includes stream probability scores, top 3 career recommendations with fit percentages, a personality profile, EQ analysis, entrance exam roadmap (JEE, NEET, UPSC, CA, CLAT, NID, NIFT), skill gap analysis, and a beautifully designed PDF download. It reads like it was written by a counsellor who truly understands your child.';
    }
    if (q.includes('register') || q.includes('sign up') || q.includes('book')) {
      return 'Bilkul! Registering is simple — fill in your child\'s details, answer 12 quick discovery questions, and pick an appointment slot. The whole process takes about 10 minutes. Shall I guide you to the registration page?';
    }
    return 'Namaste! I\'m Avanya, your guide on Sahirah.in — Sahi Raah, the right path. I can help you understand streams, explore careers, learn about our evaluation, and figure out if this is the right step for your child. What would you like to know?';
  }

  getNextSuggestions() {
    this.sugIdx = (this.sugIdx + 1) % this.suggestions.length;
    return this.suggestions[this.sugIdx];
  }
}

if (typeof module !== 'undefined') {
  module.exports = { SahiraChat, SAHIRA_SYSTEM_PROMPT };
}
