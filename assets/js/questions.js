/**
 * Sahirah.in — Question Bank
 * All questions across 6 modules with full metadata tagging
 *
 * Tag system (5 tags per question):
 *   module    : aptitude | personality | interest | eq | values | situational
 *   stream    : non-medical | medical | commerce | humanities | all
 *   difficulty: 1 (easy) | 2 (medium) | 3 (hard)
 *   trait     : logical | numerical | verbal | spatial | pattern | openness |
 *               conscientiousness | extraversion | agreeableness | neuroticism |
 *               realistic | investigative | artistic | social | enterprising | conventional |
 *               self-awareness | empathy | stress | leadership |
 *               impact | wealth | creativity | stability | fame
 *   type      : mcq | likert | matrix | scenario | pattern | rank | open
 *
 * Core (75%) vs Variable (25%):
 *   core: true  → always appears in every test (standardised for scoring)
 *   core: false → drawn from random pool (25% of each module)
 */

const QUESTION_BANK = {

  // ============================================================
  // MODULE 1 — APTITUDE (65 questions: 20 T1, 25 T2, 20 T3)
  // ============================================================
  aptitude: [

    // TIER 1 — Foundational (core: true = 15, core: false = 5)
    {
      id: 'apt_001',
      tags: { module:'aptitude', stream:'all', difficulty:1, trait:'logical', type:'mcq' },
      core: true,
      text: 'Which number comes next in the series: 2, 6, 12, 20, 30, __?',
      options: ['40', '42', '36', '44'],
      answer: 1,
    },
    {
      id: 'apt_002',
      tags: { module:'aptitude', stream:'all', difficulty:1, trait:'logical', type:'mcq' },
      core: true,
      text: 'If all Roses are Flowers and some Flowers are Red, which conclusion is definitely true?',
      options: ['All roses are red', 'Some roses may be red', 'No roses are red', 'All flowers are roses'],
      answer: 1,
    },
    {
      id: 'apt_003',
      tags: { module:'aptitude', stream:'all', difficulty:1, trait:'numerical', type:'mcq' },
      core: true,
      text: 'A train travels 240 km in 3 hours. At the same speed, how far will it travel in 5 hours?',
      options: ['350 km', '400 km', '380 km', '420 km'],
      answer: 1,
    },
    {
      id: 'apt_004',
      tags: { module:'aptitude', stream:'all', difficulty:1, trait:'pattern', type:'mcq' },
      core: true,
      text: 'Find the odd one out: Triangle, Square, Circle, Sphere, Rectangle',
      options: ['Triangle', 'Circle', 'Sphere', 'Rectangle'],
      answer: 2,
    },
    {
      id: 'apt_005',
      tags: { module:'aptitude', stream:'all', difficulty:1, trait:'verbal', type:'mcq' },
      core: true,
      text: 'Rearrange TNEELENCXLE to form a meaningful English word:',
      options: ['EXCELLENCE', 'EXELLENCTE', 'EXCELTENLE', 'NELLECTEXE'],
      answer: 0,
    },

    // TIER 2 — Intermediate (core: true = 19, core: false = 6)
    {
      id: 'apt_021',
      tags: { module:'aptitude', stream:'commerce', difficulty:2, trait:'numerical', type:'mcq' },
      core: true,
      text: 'A shopkeeper marks a product 40% above cost and gives a 20% discount. What is the profit %?',
      options: ['10%', '12%', '14%', '16%'],
      answer: 1,
    },
    {
      id: 'apt_022',
      tags: { module:'aptitude', stream:'all', difficulty:2, trait:'numerical', type:'mcq' },
      core: true,
      text: 'If the sum of 5 consecutive integers is 265, what is the middle integer?',
      options: ['51', '53', '55', '57'],
      answer: 1,
    },
    {
      id: 'apt_023',
      tags: { module:'aptitude', stream:'non-medical', difficulty:2, trait:'spatial', type:'mcq' },
      core: true,
      text: 'A cube is painted red on all faces and cut into 125 smaller equal cubes. How many cubes have exactly 2 red faces?',
      options: ['12', '24', '36', '48'],
      answer: 2,
    },

    // TIER 3 — Advanced (core: true = 15, core: false = 5)
    {
      id: 'apt_041',
      tags: { module:'aptitude', stream:'non-medical', difficulty:3, trait:'logical', type:'mcq' },
      core: true,
      text: 'In a network of 7 cities, each pair connected by exactly one road, how many roads exist in total?',
      options: ['14', '18', '21', '28'],
      answer: 2,
    },
    {
      id: 'apt_042',
      tags: { module:'aptitude', stream:'non-medical', difficulty:3, trait:'numerical', type:'mcq' },
      core: true,
      text: 'A sequence is defined by a₁=2, aₙ=3aₙ₋₁−1. What is a₅?',
      options: ['40', '41', '44', '48'],
      answer: 1,
    },
    {
      id: 'apt_043',
      tags: { module:'aptitude', stream:'non-medical', difficulty:3, trait:'logical', type:'mcq' },
      core: true,
      text: 'A convex polygon has 20 diagonals. How many sides does it have?',
      options: ['7', '8', '9', '10'],
      answer: 1,
    },
  ],

  // ============================================================
  // MODULE 2 — PERSONALITY (32 questions)
  // ============================================================
  personality: [
    {
      id: 'per_001',
      tags: { module:'personality', stream:'all', difficulty:1, trait:'extraversion', type:'likert' },
      core: true,
      text: 'I enjoy meeting new people and feel energised after social interactions.',
      scale: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
    },
    {
      id: 'per_002',
      tags: { module:'personality', stream:'all', difficulty:1, trait:'conscientiousness', type:'likert' },
      core: true,
      text: 'I prefer to have a detailed plan before starting any task rather than figuring it out as I go.',
      scale: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
    },
    {
      id: 'per_003',
      tags: { module:'personality', stream:'all', difficulty:1, trait:'openness', type:'likert' },
      core: true,
      text: 'I often think about abstract ideas, theories, and hypothetical scenarios for fun.',
      scale: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
    },
    {
      id: 'per_004',
      tags: { module:'personality', stream:'all', difficulty:1, trait:'agreeableness', type:'likert' },
      core: true,
      text: 'I find it easy to understand and share the feelings of others.',
      scale: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
    },
    {
      id: 'per_005',
      tags: { module:'personality', stream:'all', difficulty:1, trait:'neuroticism', type:'likert' },
      core: true,
      text: 'I stay calm and focused even when facing unexpected problems or setbacks.',
      scale: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
    },
  ],

  // ============================================================
  // MODULE 3 — INTEREST INVENTORY (24 questions)
  // ============================================================
  interest: [
    {
      id: 'int_001',
      tags: { module:'interest', stream:'all', difficulty:1, trait:'investigative', type:'mcq' },
      core: true,
      text: 'Which activity would you most enjoy doing for a full week?',
      options: ['Coding an app or website', 'Designing a logo or illustration', 'Running a small business', 'Conducting a science experiment', 'Writing a speech or article', 'Organising a community event'],
      answer: -1, // interest inventory — no wrong answer
    },
    {
      id: 'int_002',
      tags: { module:'interest', stream:'all', difficulty:1, trait:'realistic', type:'likert' },
      core: true,
      text: 'I would enjoy a career that involves working outdoors or with my hands.',
      scale: ['Not at all', 'Unlikely', 'Neutral', 'Possibly', 'Definitely'],
    },
    {
      id: 'int_003',
      tags: { module:'interest', stream:'all', difficulty:1, trait:'artistic', type:'likert' },
      core: true,
      text: 'I find artistic and creative activities more satisfying than technical ones.',
      scale: ['Not at all', 'Unlikely', 'Neutral', 'Possibly', 'Definitely'],
    },
  ],

  // ============================================================
  // MODULE 4 — EMOTIONAL INTELLIGENCE (24 questions)
  // ============================================================
  eq: [
    {
      id: 'eq_001',
      tags: { module:'eq', stream:'all', difficulty:1, trait:'empathy', type:'scenario' },
      core: true,
      context: 'Your close friend just failed an important exam they had studied very hard for. They are not saying much but look upset.',
      text: 'What is your most natural response?',
      options: ['Give them space — they\'ll talk when ready', 'Immediately try to cheer them up with jokes', 'Sit with them quietly and let them know you\'re there', 'Suggest practical steps to improve next time'],
      answer: -1,
    },
    {
      id: 'eq_002',
      tags: { module:'eq', stream:'all', difficulty:1, trait:'self-awareness', type:'likert' },
      core: true,
      text: 'I notice when someone is feeling upset or uncomfortable, even when they don\'t say anything.',
      scale: ['Never', 'Rarely', 'Sometimes', 'Usually', 'Always'],
    },
    {
      id: 'eq_003',
      tags: { module:'eq', stream:'all', difficulty:2, trait:'stress', type:'likert' },
      core: true,
      text: 'I can stay focused and perform well even when I am nervous or under pressure.',
      scale: ['Never', 'Rarely', 'Sometimes', 'Usually', 'Always'],
    },
  ],

  // ============================================================
  // MODULE 5 — VALUES & MOTIVATION (20 questions)
  // ============================================================
  values: [
    {
      id: 'val_001',
      tags: { module:'values', stream:'all', difficulty:1, trait:'impact', type:'mcq' },
      core: true,
      text: 'Which of these would make you feel most proud of your career?',
      options: ['Inventing or building something used by millions', 'Earning enough to give your family a great life', 'Being recognised as the best in your field', 'Making a positive difference in people\'s daily lives', 'Having the freedom to create whatever you want', 'Holding a position of authority and responsibility'],
      answer: -1,
    },
    {
      id: 'val_002',
      tags: { module:'values', stream:'all', difficulty:1, trait:'wealth', type:'likert' },
      core: true,
      text: 'Having financial security is more important to me than doing work I am passionate about.',
      scale: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
    },
    {
      id: 'val_003',
      tags: { module:'values', stream:'all', difficulty:1, trait:'stability', type:'likert' },
      core: true,
      text: 'I would rather work in a stable government job than a risky but exciting startup.',
      scale: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
    },
  ],

  // ============================================================
  // MODULE 6 — SITUATIONAL JUDGEMENT (20 questions)
  // ============================================================
  situational: [
    {
      id: 'sit_001',
      tags: { module:'situational', stream:'humanities', difficulty:2, trait:'leadership', type:'scenario' },
      core: true,
      context: 'You are selected as team leader for a school science fair project. Two team members have a strong disagreement about the project direction and neither will back down.',
      text: 'As leader, what do you do first?',
      options: ['Decide yourself and ask everyone to follow', 'Let them argue it out — the better idea will win', 'Facilitate a structured discussion where both sides present their case', 'Ask a teacher to resolve it'],
      answer: -1,
    },
    {
      id: 'sit_002',
      tags: { module:'situational', stream:'all', difficulty:2, trait:'self-awareness', type:'scenario' },
      core: true,
      context: 'You discover that a classmate copied answers from you in an exam without your knowledge. The teacher suspects you were both cheating.',
      text: 'How do you respond?',
      options: ['Deny everything — you didn\'t do anything wrong', 'Tell the teacher exactly what happened honestly', 'Protect your classmate — it\'s not a big deal', 'Stay quiet and hope it blows over'],
      answer: -1,
    },
    {
      id: 'sit_003',
      tags: { module:'situational', stream:'non-medical', difficulty:3, trait:'conscientiousness', type:'scenario' },
      core: true,
      context: 'You are midway through a 3-month project when you realise the approach you\'ve been using has a fundamental flaw. Starting over will cost weeks.',
      text: 'What is your most likely action?',
      options: ['Keep going — too much work already done', 'Immediately restart with the correct approach', 'Find a workaround to patch the flaw without restarting', 'Discuss with your mentor or team before deciding'],
      answer: -1,
    },
  ],

};

/**
 * getTestQuestions(config)
 * Generates a unique randomised test for each child.
 *
 * @param {object} config
 * @param {string} config.primaryStream  - 'non-medical' | 'medical' | 'commerce' | 'humanities'
 * @param {number} config.variablePct    - percentage of questions to randomise (default: 25)
 * @returns {object} - questions keyed by module
 */
function getTestQuestions(config = {}) {
  const { primaryStream = 'all', variablePct = 25 } = config;
  const result = {};

  Object.entries(QUESTION_BANK).forEach(([module, questions]) => {
    const core = questions.filter(q => q.core);
    const variable = questions.filter(q => !q.core);

    // Shuffle variable questions and pick the right amount
    const shuffled = variable.sort(() => Math.random() - 0.5);
    const variableCount = Math.round(questions.length * (variablePct / 100));
    const selected = shuffled.slice(0, variableCount);

    // Combine and shuffle the final set
    result[module] = [...core, ...selected].sort(() => Math.random() - 0.5);
  });

  return result;
}

// Export for module systems (Node.js / bundlers)
if (typeof module !== 'undefined') {
  module.exports = { QUESTION_BANK, getTestQuestions };
}
