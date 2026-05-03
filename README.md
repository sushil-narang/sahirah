# Sahirah.in — Sahi Raah, The Right Path

> India's first AI-powered psychometric platform for school children — helping parents and children discover the right stream, the right career, and the right path before Class 10 decides it for them.



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

Sahirah India License — free to use, modify, and distribute with attribution.

---

## 🙏 Built with

- Science: Big Five personality model, Holland RIASEC, psychometric best practices
- Design: Playfair Display + DM Sans, warm cream and gold palette
- AI: (Avanya as AI assistant + report generation)
- Love: For India's children — Sahi Raah, the right path 🇮🇳

---

*Sahirah.in — Sahi Raah — The Right Path*
