# Sahirah.in — Sahi Raah, The Right Path

> India's first AI-powered psychometric platform for school children — helping parents and children discover the right stream, the right career, and the right path before Class 10 decides it for them.

---

## 🌐 Live Demo

Open `index.html` in any modern browser — no installation, no server, no build step required.

Or deploy to GitHub Pages: `Settings → Pages → Deploy from main → /root`

---



## 📁 Project Structure

```
sahirah/
├── index.html                    ← Root redirect for GitHub Pages
├── README.md
├── LICENSE
├── .gitignore
│
├── pages/                        ← All 5 phase HTML files
│   ├── sahirah.html              ← Phase 1: Landing page + Avanya AI
│   ├── sahirah-register.html     ← Phase 2: Registration + sign-up
│   ├── sahirah-login.html        ← Phase 3: Login + test portal (2 hrs)
│   ├── sahirah-report.html       ← Phase 4: AI report + PDF download
│   └── sahirah-admin.html        ← Phase 5: Admin panel (10 sections)
│
├── assets/
│   ├── css/
│   │   ├── variables.css         ← Shared CSS custom properties
│   │   └── shared.css            ← Common layout, nav, footer styles
│   ├── js/
│   │   ├── questions.js          ← Question bank data (all 6 modules)
│   │   ├── scoring.js            ← Stream + career scoring engine
│   │   └── sahira.js             ← Avanya AI chat logic
│   ├── images/
│   │   ├── logo.svg              ← Sahirah.in logo
│   │   ├── favicon.ico
│   │   └── og-image.png          ← Social share preview image
│   └── fonts/                    ← (optional) self-hosted Google Fonts
│
├── data/                         ← Question bank JSON files (future)
│   ├── questions-aptitude.json
│   ├── questions-personality.json
│   ├── questions-interest.json
│   ├── questions-eq.json
│   ├── questions-values.json
│   └── questions-situational.json
│
├── docs/                         ← Documentation
│   ├── SETUP.md                  ← Detailed setup guide
│   ├── SCORING.md                ← How the scoring algorithm works
│   ├── QUESTION-BANK.md          ← Question bank structure and tagging
│   └── API.md                    ← Claude API integration guide
│
└── .github/
    └── workflows/
        └── deploy.yml            ← Auto-deploy to GitHub Pages
```

---

## 🚀 How to Run

### Option A — Simplest (no install)

1. Download or clone this repository
2. Open `index.html` in Chrome, Edge, or Firefox
3. That's it — the entire platform runs in the browser

```bash
git clone https://github.com/YOUR_USERNAME/sahirah.git
cd sahirah
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

### Option B — VS Code Live Server

1. Install VS Code + the **Live Server** extension (Ritwick Dey)
2. Open the `sahirah/` folder in VS Code
3. Right-click `index.html` → **Open with Live Server**
4. Opens at `http://localhost:5500`

### Option C — Python server

```bash
cd sahirah
python -m http.server 8080
# Open http://localhost:8080
```

### Option D — Deploy to GitHub Pages (free hosting)

```bash
git add .
git commit -m "Deploy Sahirah.in"
git push origin main
# Then: GitHub repo → Settings → Pages → Source: main / root
# Live at: https://YOUR_USERNAME.github.io/sahirah
```

---

## 🔑 API Setup

Avanya (AI assistant) and the AI-generated report narrative are powered by the **Anthropic Claude API**.

### For local testing

Open `pages/sahirah.html` and `pages/sahirah-report.html` in a text editor. Find the `fetch` call to `api.anthropic.com` and add your key:

```javascript
headers: {
  'Content-Type': 'application/json',
  'x-api-key': 'sk-ant-YOUR_KEY_HERE',
  'anthropic-version': '2023-06-01'
}
```

### For production (recommended)

**Never expose your API key in client-side code.** Use a serverless proxy:

```
Browser → Netlify Function / Vercel Edge Function → Anthropic API
```

Create a function at `netlify/functions/claude.js` that holds the key server-side and forwards requests.

### Without an API key

Both Avanya chat and the report narrative fall back to high-quality pre-written responses automatically. The rest of the platform (charts, PDF, scoring, admin panel) works fully without any API key.

---

## 🧠 The Test — 6 Modules, 2 Hours

| Module | Type | Duration |
|--------|------|----------|
| Aptitude Assessment | MCQ / Scenario / Pattern — 3 tiers | ~55 min |
| Personality Profile | Likert scale / Matrix | ~20 min |
| Interest Inventory | MCQ / Likert | ~15 min |
| Emotional Intelligence | Scenario / Likert | ~15 min |
| Values & Motivation | MCQ / Likert | ~8 min |
| Situational Judgement | Real-life scenarios | ~7 min |

**Question bank:** 900+ questions · 75% standardised · 25% randomised · 5-tag system

---

## 🇮🇳 The Four Streams

| Stream | Brain wired for | Careers |
|--------|----------------|---------|
| **Humanities** | Verbal, policy, empathy, creativity | IAS/IPS, Law, B.Des, Journalism, Psychology |
| **Commerce** | Numerical, strategic, organisational | CA, CS, MBA, CFA, Banking, Entrepreneurship |
| **Medical** | Biological, precise, service-driven | MBBS, BDS, Pharmacy, Physiotherapy, Biotech |
| **Non-Medical** | Logical, spatial, systems thinking | CS/AI, Electronics, Civil, Mechanical, Architecture, Robotics |

---

## 📊 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML5 + CSS3 + JavaScript (ES6+) |
| AI | Claude Sonnet API (Anthropic) |
| Charts | Chart.js 4.4 (CDN) |
| PDF Export | jsPDF 2.5 (CDN) |
| Fonts | Google Fonts (Playfair Display + DM Sans + DM Mono) |
| Storage | localStorage (demo) |
| Backend | None for demo — replace with Node.js + MongoDB for production |
| Hosting | Any static host — GitHub Pages, Netlify, Vercel |

**Total size:** ~130 KB across 5 HTML files. Zero npm. Zero build step. Zero dependencies to install.

---

## 🗺️ Roadmap

- [ ] Backend API (Node.js + Express + MongoDB)
- [ ] Real email delivery (credentials + reminders via SendGrid/Nodemailer)
- [ ] Hindi language support for test and report
- [ ] Mobile app (React Native)
- [ ] School counsellor dashboard
- [ ] Batch registration for schools
- [ ] Question bank admin editor
- [ ] Longitudinal tracking (re-test after 1 year)
- [ ] Payment gateway integration

---

## 📄 License

MIT License — free to use, modify, and distribute with attribution.

---

## 🙏 Built with

- Science: Big Five personality model, Holland RIASEC, psychometric best practices
- Design: Playfair Display + DM Sans, warm cream and gold palette
- AI: Anthropic Claude (Avanya assistant + report generation)
- Love: For India's children — Sahi Raah, the right path 🇮🇳

---

*Sahirah.in — Sahi Raah — The Right Path*
