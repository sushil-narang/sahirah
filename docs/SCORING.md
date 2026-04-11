# Sahirah.in — Scoring Algorithm

## Overview

Scoring happens in two stages:

```
Answers → Trait Scores → Stage 1: Stream Scores → Stage 2: Career Fit
```

---

## Stage 1 — Stream Identification

Each question is tagged with a `trait` (e.g. `logical`, `empathy`, `enterprising`).

Each trait is mapped to four stream affinity weights (0–1):

```javascript
logical: { non: 0.9, med: 0.6, com: 0.5, hum: 0.4 }
empathy: { non: 0.4, med: 0.9, com: 0.6, hum: 0.8 }
```

**Formula:**

```
streamScore[stream] = Σ (traitScore × streamWeight) / Σ (100 × streamWeight)
```

Scores are normalised so all four streams sum to 100%.

**Example output:**
```
Non-Medical: 72%
Medical:     18%
Commerce:     8%
Humanities:   2%
```

---

## Stage 2 — Career Fit Within Stream

Once the primary stream is identified, career fit is computed only for careers within that stream.

Each career has a trait requirement map with weights:

```javascript
'Computer Science / AI': {
  logical: 0.9, numerical: 0.8, pattern: 0.9, investigative: 0.8, creativity: 0.7
}
```

**Formula:**

```
careerFit = Σ (traitScore × careerWeight) / Σ (100 × careerWeight)
```

Top 3 careers by fit score are returned.

---

## Module Contribution to Trait Scores

| Module | Traits derived |
|--------|---------------|
| Aptitude (M1) | logical, numerical, verbal, spatial, pattern |
| Personality (M2) | openness, conscientiousness, extraversion, agreeableness, neuroticism |
| Interest (M3) | realistic, investigative, artistic, social, enterprising, conventional |
| EQ (M4) | empathy, self-awareness, stress, leadership |
| Values (M5) | impact, wealth, creativity, stability, fame |
| Situational (M6) | leadership, conscientiousness, stress, agreeableness |

---

## Aptitude Tier Weighting

Tier 3 (complex problem solving) questions are weighted **2x** compared to Tier 1 for the aptitude depth score. This ensures that only genuinely capable children score in the top range for deep tech / core medical pathways.

```
aptitudeDepth = (T1_score × 1 + T2_score × 1.5 + T3_score × 2) / 4.5
```

---

## Pre-Assessment Contribution

The 12 registration questions contribute **15%** to the initial stream probability scores, acting as a prior before the full test begins. This helps personalise module M2 (Career Aptitude) which is stream-specific.

---

## Randomisation Logic

- **75% Core questions** — always appear in every test (standardised for scoring comparability)
- **25% Variable questions** — randomly drawn from the module's variable pool each time
- Variable questions are tagged with `core: false` in the question bank
- Difficulty distribution within variable questions: 40% Easy, 40% Medium, 20% Hard

See `assets/js/questions.js` → `getTestQuestions()` for the implementation.
