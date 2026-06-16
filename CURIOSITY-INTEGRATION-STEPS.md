# Curiosity Index Integration Into Test Interface

**File to modify:** `/login/index.html`  
**Integration points:** 3 locations  
**Estimated time:** 15-20 minutes

---

## Step 1: Add Script Includes (HEAD section)

**Location:** In the `<head>` section, after other script tags

**Add these lines before closing `</head>`:**

```html
<!-- Curiosity Index System -->
<script src="/assets/js/curiosity-index.js"></script>
<script src="/assets/js/curiosity-ui.js"></script>
```

---

## Step 2: Initialize Curiosity Index on Test Start

**Location:** Find the function that shows the test screen (around line 600-650)

**Look for:**
```javascript
// Where test starts - search for this pattern
document.getElementById('screen-test').classList.add('active');
```

**Add after that line:**
```javascript
// Initialize Curiosity Index tracking
const testSessionId = 'test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
curiosityIndex.init(testSessionId);
```

---

## Step 3: Add Curiosity UI After Module Completion

**Location:** Lines 1000-1016 (the module completion screen)

**FIND THIS:**
```javascript
  const content = document.getElementById('test-content');
  content.innerHTML = `
    <div class="mod-complete">
      <div class="mc-icon">${mod.icon}</div>
      <div class="mc-title" style="font-family:'Playfair Display',serif;">${mod.name} complete!</div>
      <div class="mc-sub">Well done. You've completed all questions in this module. Take a short breath and move on to the next section when ready.</div>
      ${nextMod ? `
      <div style="background:#fff;border:1px solid var(--border);border-radius:16px;padding:1.25rem 1.5rem;max-width:380px;margin:0 auto 2rem;text-align:left;">
        <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(26,18,8,.3);margin-bottom:.6rem;">Up next</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="font-size:1.5rem;">${nextMod.icon}</div>
          <div><div style="font-size:.9rem;font-weight:600;">${nextMod.name}</div><div style="font-size:.78rem;color:rgba(26,18,8,.45);">${nextMod.questions.length} questions</div></div>
        </div>
      </div>
      <button class="mc-next-btn" onclick="renderModule(${modIdx+1})">Start ${nextMod.name} →</button>` :
      `<button class="mc-next-btn" onclick="showSubmitConfirm()">✓ Submit Evaluation</button>`}
    </div>`;
  content.scrollTo({top:0, behavior:'smooth'});
  updateSidebar();
```

**REPLACE WITH:**
```javascript
  const content = document.getElementById('test-content');
  content.innerHTML = `
    <div class="mod-complete">
      <div class="mc-icon">${mod.icon}</div>
      <div class="mc-title" style="font-family:'Playfair Display',serif;">${mod.name} complete!</div>
      <div class="mc-sub">Well done. You've completed all questions in this module. Take a short breath and move on to the next section when ready.</div>
      ${nextMod ? `
      <div style="background:#fff;border:1px solid var(--border);border-radius:16px;padding:1.25rem 1.5rem;max-width:380px;margin:0 auto 2rem;text-align:left;">
        <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(26,18,8,.3);margin-bottom:.6rem;">Up next</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="font-size:1.5rem;">${nextMod.icon}</div>
          <div><div style="font-size:.9rem;font-weight:600;">${nextMod.name}</div><div style="font-size:.78rem;color:rgba(26,18,8,.45);">${nextMod.questions.length} questions</div></div>
        </div>
      </div>
      <button class="mc-next-btn" onclick="renderModule(${modIdx+1})">Start ${nextMod.name} →</button>` :
      `<button class="mc-next-btn" onclick="showSubmitConfirm()">✓ Submit Evaluation</button>`}
    </div>`;
  
  // Add Curiosity Index component
  const curiosityUI = createCuriosityIndexUI(mod.name, (question) => {
    console.log('Curiosity question recorded:', question);
  });
  if (curiosityUI) {
    content.appendChild(curiosityUI);
  }
  
  content.scrollTo({top:0, behavior:'smooth'});
  updateSidebar();
```

---

## Step 4: Update Module Navigation to Save Curiosity Data

**Location:** Find and update the `renderModule()` onclick handlers

**For the "Start next module" button:** (around line 1014)

**FIND:**
```javascript
<button class="mc-next-btn" onclick="renderModule(${modIdx+1})">Start ${nextMod.name} →</button>
```

**REPLACE WITH:**
```javascript
<button class="mc-next-btn" onclick="saveCuriosityAndMove(${modIdx+1})">Start ${nextMod.name} →</button>
```

**And add this new function** (around line 750, before `renderModule()`):

```javascript
function saveCuriosityAndMove(nextModIdx) {
  // Save current module's curiosity data
  // Then move to next module
  renderModule(nextModIdx);
}
```

---

## Step 5: Export Curiosity Data on Submit

**Location:** Find the `confirmSubmit()` function (around line 1049)

**Look for where results are being prepared:**

**Add before sending results:**

```javascript
// Collect all curiosity data
const curiosityData = curiosityIndex.exportForReport();

// Add to test results
const allResults = {
  // ... existing results ...
  curiosity_index: curiosityData
};
```

---

## Complete Integration Checklist

- [ ] Step 1: Added script includes in `<head>`
- [ ] Step 2: Initialized curiosityIndex when test starts
- [ ] Step 3: Added curiosity UI after module completion
- [ ] Step 4: Updated button click handlers
- [ ] Step 5: Export curiosity data on submit
- [ ] Test: Load test page and verify no JS errors in console
- [ ] Test: Complete first module and see curiosity prompt
- [ ] Test: Ask a question and verify it's recorded
- [ ] Test: Submit and verify curiosity data is included

---

## Testing the Integration

### Quick Test in Browser Console:

```javascript
// After page loads
console.log('Curiosity system ready:', typeof curiosityIndex !== 'undefined');

// After completing a module
console.log('Questions recorded:', curiosityIndex.questions);

// Check distribution
console.log('Distribution:', curiosityIndex.getDistribution());

// Check score
console.log('Curiosity Score:', curiosityIndex.getScore());
```

---

## Troubleshooting

**Issue: "curiosityIndex is not defined"**
- ✅ Check that both JS files are included in `<head>`
- ✅ Hard refresh browser (Ctrl+Shift+R)

**Issue: Curiosity UI doesn't appear**
- ✅ Check module name matches exactly (case-sensitive)
- ✅ Verify `createCuriosityIndexUI()` is called with correct module name

**Issue: Questions not showing after input**
- ✅ Check browser console for errors
- ✅ Verify sessionStorage is not disabled

**Issue: Data not persisting**
- ✅ Check that `curiosityIndex.saveToSession()` is being called
- ✅ Verify sessionStorage is enabled in browser

---

## Module Name Reference

Use these exact names when displaying Curiosity UI:

```javascript
// Original 6 modules
'Aptitude Assessment'
'Personality Profile'
'Interest Inventory'
'Emotional Intelligence'
'Values & Motivation'
'Situational Judgement'

// New 4 modules
'Learning Style'
'Resilience Index'
'Creativity Index'
'Leadership Readiness'
```

---

## Complete Example: Modified Module Completion

Here's what the modified section should look like:

```javascript
function completeModule(modIdx) {
  const mod = MODULES[modIdx];
  const nextMod = MODULES[modIdx + 1];
  const content = document.getElementById('test-content');
  
  content.innerHTML = `
    <div class="mod-complete">
      <div class="mc-icon">${mod.icon}</div>
      <div class="mc-title" style="font-family:'Playfair Display',serif;">${mod.name} complete!</div>
      <div class="mc-sub">Well done. You've completed all questions in this module.</div>
      ${nextMod ? `
        <div style="background:#fff;border:1px solid var(--border);border-radius:16px;padding:1.25rem 1.5rem;margin:2rem auto;max-width:380px;">
          <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;margin-bottom:.6rem;">Up next</div>
          <div style="display:flex;gap:10px;">
            <div style="font-size:1.5rem;">${nextMod.icon}</div>
            <div>
              <div style="font-weight:600;">${nextMod.name}</div>
              <div style="font-size:.78rem;color:rgba(26,18,8,.45);">${nextMod.questions.length} questions</div>
            </div>
          </div>
        </div>
        <button class="mc-next-btn" onclick="saveCuriosityAndMove(${modIdx+1})">Start ${nextMod.name} →</button>
      ` : `
        <button class="mc-next-btn" onclick="showSubmitConfirm()">✓ Submit Evaluation</button>
      `}
    </div>`;
  
  // ← INSERT CURIOSITY UI HERE ←
  const curiosityUI = createCuriosityIndexUI(mod.name, (question) => {
    console.log('Question:', question.text, 'Category:', question.category);
  });
  if (curiosityUI) {
    content.appendChild(curiosityUI);
  }
  // ← END CURIOSITY UI ←
  
  content.scrollTo({top:0, behavior:'smooth'});
  updateSidebar();
}
```

---

## Next Steps

1. **Make the 5 changes** listed above
2. **Test in browser** - complete a module and see curiosity prompt
3. **Ask a test question** - verify it's categorized and recorded
4. **Submit test** - verify curiosity data is exported
5. **Commit changes** to git

Ready to implement? Let me know if you need help with any of the specific code changes!

