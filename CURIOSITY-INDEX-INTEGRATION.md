# Curiosity Index Integration Guide

**Status:** Implementation files ready  
**Date:** June 16, 2026  
**Approach:** Option A - Simple keyword-based categorization (No dependencies)

---

## 📚 What's Been Created

### 1. Core Logic: `assets/js/curiosity-index.js`
- Tracks questions asked by students during test
- Categorizes questions as: WHO, WHAT, HOW, WHY
- Calculates distribution percentages
- Generates curiosity score (0-100) and profile
- Exports data for final report

**Key Methods:**
```javascript
curiosityIndex.init(sessionId)           // Start tracking
curiosityIndex.addQuestion(text, module) // Record a question
curiosityIndex.getDistribution()         // Get WHO/WHAT/HOW/WHY %
curiosityIndex.getScore()                // Get score & profile
curiosityIndex.exportForReport()         // Export for final report
```

### 2. UI Component: `assets/js/curiosity-ui.js`
- Beautiful, motivational question input interface
- Displays after each assessment module
- Module-specific prompts and guidance
- Shows questions already asked in that module
- Keyword-based categorization with color coding

**Key Functions:**
```javascript
createCuriosityIndexUI(moduleName, callback)  // Create component
displayCuriosityResults()                      // Show results
```

---

## 🔧 Integration Steps

### Step 1: Include Scripts in Test Page

Add these to your test HTML `<head>`:

```html
<!-- Curiosity Index System -->
<script src="/assets/js/curiosity-index.js"></script>
<script src="/assets/js/curiosity-ui.js"></script>
```

### Step 2: Initialize at Test Start

When student starts test:

```javascript
// Initialize curiosity tracking
const testSessionId = 'test_' + Date.now() + '_' + Math.random();
curiosityIndex.init(testSessionId);
```

### Step 3: Add Component After Each Module

After student completes each module assessment, add the UI:

```javascript
// Get the container where you want to display the component
const moduleContainer = document.getElementById('module-end-container');

// Create and append the curiosity UI
const curiosityUI = createCuriosityIndexUI(
  'Aptitude Assessment',  // Module name (must match exactly)
  (question) => {
    console.log('Question asked:', question);
    // Optional: Log to analytics, show toast notification, etc.
  }
);

moduleContainer.appendChild(curiosityUI);
```

### Step 4: Example Integration in Test Flow

```html
<!-- After completing a module section -->
<div id="module-content">
  <!-- Module questions here -->
  <div id="aptitude-questions">
    <!-- All 20 aptitude questions -->
  </div>
</div>

<!-- Add curiosity component here -->
<div id="module-end-container"></div>

<script>
// When module is complete
function completeModule(moduleName) {
  // Show curiosity input
  const container = document.getElementById('module-end-container');
  container.innerHTML = ''; // Clear
  
  const ui = createCuriosityIndexUI(moduleName, (q) => {
    console.log('Question recorded:', q.text, 'Category:', q.category);
  });
  
  container.appendChild(ui);
}
</script>
```

### Step 5: Collect Data at End of Test

When student completes all modules:

```javascript
// Export curiosity data for report
const curiosityData = curiosityIndex.exportForReport();

console.log('Curiosity Score:', curiosityData.score);
console.log('Profile:', curiosityData.profile);
console.log('Distribution:', curiosityData.distribution);
console.log('Total Questions Asked:', curiosityData.questions_count);

// Send to database with test results
const testResults = {
  aptitude_score: 78,
  personality_score: 82,
  // ... other scores
  curiosity_index: curiosityData
};

// Save to database
await saveTestResults(testResults);
```

---

## 🎯 Module Names (Must Match Exactly)

Use these exact names when calling `createCuriosityIndexUI()`:

```
'Aptitude Assessment'
'Personality Profile'
'Interest Inventory'
'Emotional Intelligence'
'Values & Motivation'
'Situational Judgement'
'Learning Style'
'Resilience Index'
'Creativity Index'
'Leadership Readiness'
```

---

## 📊 Question Categorization

**Automatic keyword-based detection:**

| Category | Detection Examples |
|----------|-------------------|
| **WHO** | "Who is...", "Whose...", "Whom..." |
| **WHAT** | "What is...", "What does...", "Which..." |
| **HOW** | "How do...", "How can...", "How to..." |
| **WHY** | "Why do...", "Why is...", "Why does..." |

Examples:
- "Who are the leading researchers?" → WHO
- "What is neuroplasticity?" → WHAT
- "How do I improve my memory?" → HOW
- "Why does practice make perfect?" → WHY

---

## 📈 Curiosity Score Calculation

**Score: 0-100 (Higher = More Curious)**

Combines two factors:

1. **Quantity (50 points max)**
   - 1-5 questions: 10 points
   - 6-10 questions: 25 points
   - 11-20 questions: 40 points
   - 20+ questions: 50 points

2. **Diversity (50 points max)**
   - Perfect balance across WHO/WHAT/HOW/WHY: 50 points
   - Decreases based on unbalanced distribution

**Profiles:**
- 80-100: "Highly Curious" 🟢
- 60-79: "Well Curious" 🟢
- 40-59: "Moderately Curious" 🟡
- 20-39: "Somewhat Curious" 🟡
- 0-19: "Emerging Curious" 🔴

---

## 💾 Data Storage

Automatically saved to browser `sessionStorage`:

```javascript
// Curiosity data is auto-saved after each question
// Survives page refresh during test session
// Cleared when session ends
```

If you need persistent storage:

```javascript
// Save to database
const data = curiosityIndex.exportForReport();
await fetch('/api/curiosity-save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

---

## 📋 Integration Checklist

- [ ] Include both JS files in test page
- [ ] Initialize curiosityIndex at test start
- [ ] Add UI component after each module (10 modules total)
- [ ] Module names match exactly (see list above)
- [ ] Test question submission and categorization
- [ ] Verify questions display correctly in module
- [ ] Export data at end of test
- [ ] Send curiosity data with test results to database
- [ ] Display results in final report

---

## 🧪 Testing Checklist

```javascript
// Quick test in browser console while on test page:

// 1. Check initialization
console.log(curiosityIndex); // Should show object with methods

// 2. Add test questions
curiosityIndex.addQuestion("Who is Albert Einstein?", "Aptitude Assessment");
curiosityIndex.addQuestion("What is gravity?", "Aptitude Assessment");
curiosityIndex.addQuestion("How does gravity work?", "Aptitude Assessment");
curiosityIndex.addQuestion("Why do apples fall?", "Aptitude Assessment");

// 3. Check distribution
console.log(curiosityIndex.getDistribution());
// Should show: {WHO: 25, WHAT: 25, HOW: 25, WHY: 25, total: 4}

// 4. Check score
console.log(curiosityIndex.getScore());
// Should show: {score: XX, profile: "...", dominantType: "Balanced"}

// 5. Export for report
console.log(curiosityIndex.exportForReport());
```

---

## 🎨 UI Customization

The curiosity UI uses inline styles. To customize:

### Change Colors:
- Edit color values in `curiosity-ui.js`
- Category colors in `getCategoryColor()` function
- Background gradient colors in component

### Change Motivation Text:
- Edit `MODULE_PROMPTS` object in `curiosity-ui.js`
- Add/remove example questions
- Update prompt text for each module

### Change Input Styling:
- Modify CSS in `createCuriosityIndexUI()` function
- Adjust padding, border-radius, font sizes

---

## 🚀 Example: Complete Test Flow

```javascript
// ===== TEST START =====
function startTest() {
  // Initialize tracking
  const sessionId = 'test_' + Date.now();
  curiosityIndex.init(sessionId);
  
  showModule('Aptitude Assessment');
}

// ===== MODULE END =====
function completeModule(moduleName) {
  // Show curiosity prompt
  const container = document.getElementById('module-end');
  const ui = createCuriosityIndexUI(moduleName, (q) => {
    // Optional callback
    showToast('Question recorded: ' + q.text);
  });
  container.appendChild(ui);
  
  // After user clicks "Next Module"
  // Continue to next module...
}

// ===== TEST COMPLETE =====
function completeTest() {
  // Get all results
  const curiosityResults = curiosityIndex.exportForReport();
  
  const finalReport = {
    testId: currentTestId,
    studentId: currentStudentId,
    timestamp: new Date().toISOString(),
    
    // Original 6 assessments
    aptitude: scores.aptitude,
    personality: scores.personality,
    interest: scores.interest,
    eq: scores.eq,
    values: scores.values,
    situational: scores.situational,
    
    // New 4 assessments
    learning_style: scores.learningStyle,
    resilience: scores.resilience,
    creativity: scores.creativity,
    leadership: scores.leadership,
    
    // Behavioral metric
    curiosity_index: curiosityResults,
    
    // Metadata
    testDuration: calculateDuration(),
    completedAt: new Date().toISOString()
  };
  
  // Save to database
  saveTestResults(finalReport);
  
  // Display results
  showFinalReport(finalReport);
}
```

---

## 📞 API Reference

### CuriosityIndex Class

```javascript
// Initialize
curiosityIndex.init(sessionId)

// Add question
curiosityIndex.addQuestion(text, module) → question object

// Get module questions
curiosityIndex.getModuleQuestions(module) → array of questions

// Get distribution
curiosityIndex.getDistribution() → {WHO, WHAT, HOW, WHY, total}

// Get score
curiosityIndex.getScore() → {score, profile, dominantType, interpretation}

// Export for report
curiosityIndex.exportForReport() → complete data object

// Clear data
curiosityIndex.clear()

// Load from session
curiosityIndex.loadFromSession() → boolean

// Save to session
curiosityIndex.saveToSession()
```

---

## ✅ Next Steps

1. **Identify test interface location** - Where are the modules displayed?
2. **Add the script includes** to test HTML
3. **Initialize curiosityIndex** at test start
4. **Add UI component** after each module completes
5. **Export data** when test ends
6. **Display in final report** with other assessment results

**Ready to integrate? Share the test interface file location and I'll help with the specific integration!**

