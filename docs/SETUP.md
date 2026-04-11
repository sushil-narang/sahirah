# Sahirah.in — Setup Guide

## Prerequisites

- Any modern browser (Chrome, Edge, Firefox, Safari)
- A text editor (VS Code recommended)
- Git (for version control)
- An Anthropic API key (optional — for Avanya AI and report narrative)

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/sahirah.git
cd sahirah

# 2. Open in browser
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

That's it. No npm install. No build step.

---

## Adding Your Anthropic API Key

The Claude API powers two features:
1. **Avanya chat widget** — in `pages/sahirah.html`
2. **AI report narrative** — in `pages/sahirah-report.html`

### For local testing only

Search for `api.anthropic.com` in both files and add your key to the headers:

```javascript
headers: {
  'Content-Type': 'application/json',
  'x-api-key': 'sk-ant-YOUR_KEY_HERE',
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true'
}
```

### For production

Create a serverless proxy (Netlify Functions or Vercel Edge Functions):

```javascript
// netlify/functions/claude.js
exports.handler = async (event) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: event.body,
  });
  const data = await response.json();
  return { statusCode: 200, body: JSON.stringify(data) };
};
```

Then update the fetch URL in the HTML files from `https://api.anthropic.com/v1/messages` to `/.netlify/functions/claude`.

Set the environment variable in Netlify: `ANTHROPIC_API_KEY = sk-ant-...`

---

## Deploying to GitHub Pages

```bash
# Make sure index.html is at the root (it redirects to pages/sahirah.html)
git add .
git commit -m "Deploy Sahirah.in v1.0"
git push origin main
```

Then: GitHub repo → **Settings** → **Pages** → Source: `main` branch, `/ (root)` folder → Save.

Your site will be live at: `https://YOUR_USERNAME.github.io/sahirah`

---

## Deploying to Netlify (even simpler)

1. Go to [netlify.com/drop](https://netlify.com/drop)
2. Drag the entire `sahirah/` folder into the browser
3. Site is live in 30 seconds with a free `*.netlify.app` URL
4. Add your custom domain `sahirah.in` in Site settings → Domain management

---

## Connecting sahirah.in Domain

1. Register `sahirah.in` at a domain registrar (GoDaddy, Namecheap, etc.)
2. In Netlify: Site settings → Domain management → Add custom domain → `sahirah.in`
3. Copy the Netlify DNS nameservers to your registrar
4. Wait 10–30 minutes for DNS propagation
5. HTTPS is automatically provisioned by Netlify (Let's Encrypt)

---

## Local Development with Live Reload

Install the VS Code **Live Server** extension:

1. Open VS Code
2. Extensions panel → search "Live Server" → Install (Ritwick Dey)
3. Right-click `index.html` → **Open with Live Server**
4. Opens at `http://localhost:5500` with hot reload on save

---

## Credentials Reference

| What | File | Username/ID | Password |
|------|------|-------------|----------|
| Student demo | sahirah-login.html | `demo2025` | `Avanya@9999` |
| Admin panel | sahirah-admin.html | `admin` | `sahirah@admin2025` |
| Real student | After registering | Auto-generated | Shown on confirmation |

---

## Troubleshooting

**Avanya chat not responding?**
The Claude API requires a valid key. Without it, Avanya falls back to pre-written responses. Check the browser console for errors.

**PDF download not working?**
jsPDF loads from cdnjs CDN. Make sure you have an internet connection. If offline, the PDF button will silently fail.

**Fonts not loading?**
Google Fonts requires internet access. Offline, the browser falls back to Georgia/system fonts — the page still looks good.

**localStorage not persisting?**
If you open files directly from the filesystem (`file://`), some browsers restrict localStorage. Use Live Server or any HTTP server instead.

**Charts not rendering?**
Chart.js loads from cdnjs CDN. Requires internet. Without it, chart canvases will be empty but the rest of the report renders fine.
