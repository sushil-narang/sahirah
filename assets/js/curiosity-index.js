/**
 * Curiosity Index Handler
 * Tracks and categorizes questions asked during assessments
 * Categories: WHO, WHAT, HOW, WHY
 */

class CuriosityIndex {
  constructor() {
    this.questions = [];
    this.sessionId = null;
  }

  /**
   * Initialize curiosity tracking for a test session
   */
  init(sessionId) {
    this.sessionId = sessionId;
    this.questions = [];
  }

  /**
   * Add a question asked by student
   * @param {string} text - The question text
   * @param {string} module - Module name where question was asked
   */
  addQuestion(text, module) {
    if (!text || !text.trim()) return;

    const category = this.categorizeQuestion(text);
    const timestamp = new Date().toISOString();

    const question = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      module: module,
      category: category,
      timestamp: timestamp
    };

    this.questions.push(question);
    this.saveToSession();
    return question;
  }

  /**
   * Categorize question based on keyword matching
   * Simple: Look for WHO, WHAT, HOW, WHY at start of question
   * @param {string} text - Question text
   * @returns {string} - Category: WHO, WHAT, HOW, WHY, or UNCATEGORIZED
   */
  categorizeQuestion(text) {
    const normalized = text.toLowerCase().trim();

    // Check for question markers (more reliable than just first letter)
    if (normalized.match(/^(who|whose|whom)\s|who\s(is|are|was|were|does|did|will|can)/i)) {
      return 'WHO';
    }

    if (normalized.match(/^(what|which)\s|what\s(is|are|was|were|does|did|will|can)/i)) {
      return 'WHAT';
    }

    if (normalized.match(/^(how)\s|how\s(do|does|did|will|can|to|is|are)/i)) {
      return 'HOW';
    }

    if (normalized.match(/^(why)\s|why\s(do|does|did|is|are|was|were)/i)) {
      return 'WHY';
    }

    // Fallback: check first word more broadly
    const firstWord = normalized.split(/[\s?!.]+/)[0];

    if (['who', 'whose', 'whom'].includes(firstWord)) return 'WHO';
    if (['what', 'which'].includes(firstWord)) return 'WHAT';
    if (firstWord === 'how') return 'HOW';
    if (firstWord === 'why') return 'WHY';

    return 'UNCATEGORIZED';
  }

  /**
   * Get all questions asked in a module
   * @param {string} module - Module name
   * @returns {Array} - Questions in that module
   */
  getModuleQuestions(module) {
    return this.questions.filter(q => q.module === module);
  }

  /**
   * Get categorization distribution
   * @returns {Object} - {WHO: %, WHAT: %, HOW: %, WHY: %, total: count}
   */
  getDistribution() {
    const total = this.questions.length;

    if (total === 0) {
      return {
        WHO: 0,
        WHAT: 0,
        HOW: 0,
        WHY: 0,
        UNCATEGORIZED: 0,
        total: 0
      };
    }

    const categories = {};
    this.questions.forEach(q => {
      categories[q.category] = (categories[q.category] || 0) + 1;
    });

    const distribution = {
      WHO: Math.round((categories.WHO || 0) / total * 100),
      WHAT: Math.round((categories.WHAT || 0) / total * 100),
      HOW: Math.round((categories.HOW || 0) / total * 100),
      WHY: Math.round((categories.WHY || 0) / total * 100),
      UNCATEGORIZED: Math.round((categories.UNCATEGORIZED || 0) / total * 100),
      total: total
    };

    return distribution;
  }

  /**
   * Get curiosity score (0-100)
   * Based on question diversity and quantity
   * @returns {Object} - {score: 0-100, profile: string}
   */
  getScore() {
    const dist = this.getDistribution();
    const total = dist.total;

    // Scoring logic:
    // Quantity: more questions = higher score (up to 50 points)
    // Diversity: balanced mix of categories = higher score (up to 50 points)

    let quantityScore = Math.min(50, (total / 20) * 50); // Max 50 points for 20+ questions

    // Diversity score: measure how balanced the distribution is
    const categories = [dist.WHO, dist.WHAT, dist.HOW, dist.WHY]
      .filter(v => v > 0)
      .length;

    let diversityScore = 0;
    if (total > 0) {
      const avgExpected = 25; // Equal distribution = 25% each
      const variance = Math.abs(dist.WHO - avgExpected) +
                      Math.abs(dist.WHAT - avgExpected) +
                      Math.abs(dist.HOW - avgExpected) +
                      Math.abs(dist.WHY - avgExpected);
      diversityScore = Math.max(0, 50 - (variance / 4)); // 50 points for perfect balance
    }

    const totalScore = Math.round(quantityScore + diversityScore);

    // Determine profile
    let profile = 'Emerging Curious';
    if (totalScore >= 80) profile = 'Highly Curious';
    else if (totalScore >= 60) profile = 'Well Curious';
    else if (totalScore >= 40) profile = 'Moderately Curious';
    else if (totalScore >= 20) profile = 'Somewhat Curious';

    // Determine dominant question type
    let dominantType = 'Balanced';
    const max = Math.max(dist.WHO, dist.WHAT, dist.HOW, dist.WHY);
    if (max > 0) {
      if (dist.WHO === max) dominantType = 'WHO (People-focused)';
      else if (dist.WHAT === max) dominantType = 'WHAT (Knowledge-focused)';
      else if (dist.HOW === max) dominantType = 'HOW (Problem-solving)';
      else if (dist.WHY === max) dominantType = 'WHY (Research-focused)';
    }

    return {
      score: Math.min(100, totalScore),
      profile: profile,
      dominantType: dominantType,
      interpretation: this.getInterpretation(totalScore, dominantType)
    };
  }

  /**
   * Get interpretation text for the curiosity profile
   */
  getInterpretation(score, dominantType) {
    const profiles = {
      'Highly Curious': 'Your strong curiosity indicates deep engagement with learning. You ask thoughtful questions across multiple dimensions, showing intellectual maturity and a drive to understand concepts thoroughly.',
      'Well Curious': 'You demonstrate healthy curiosity with good engagement in learning. Your questions reflect genuine interest in understanding concepts and solving problems effectively.',
      'Moderately Curious': 'You show moderate curiosity with steady engagement. You ask relevant questions when needed, indicating a practical approach to learning and problem-solving.',
      'Somewhat Curious': 'You have emerging curiosity. Consider asking more questions to deepen your understanding - curiosity is a powerful tool for learning.',
      'Emerging Curious': 'You\'re beginning to develop your questioning skills. Remember: no question is too simple. Asking questions is how we learn and grow.'
    };

    const typeInterpretations = {
      'WHO (People-focused)': 'Your questions focus on people, relationships, and social contexts. You\'re interested in understanding human behavior and social dynamics.',
      'WHAT (Knowledge-focused)': 'Your questions seek to understand facts, concepts, and knowledge. You\'re driven to learn what things are and how they work.',
      'HOW (Problem-solving)': 'Your questions focus on processes and solutions. You\'re interested in understanding how things work and how to solve practical problems.',
      'WHY (Research-focused)': 'Your questions dig into reasons and deeper meaning. You\'re driven by understanding the "why" behind concepts - a research and philosophy orientation.',
      'Balanced': 'Your questions show a balanced curiosity across multiple dimensions, indicating intellectual flexibility and diverse interests.'
    };

    const profile = Object.keys(profiles).find(key => {
      if (key === 'Highly Curious' && score >= 80) return true;
      if (key === 'Well Curious' && score >= 60 && score < 80) return true;
      if (key === 'Moderately Curious' && score >= 40 && score < 60) return true;
      if (key === 'Somewhat Curious' && score >= 20 && score < 40) return true;
      if (key === 'Emerging Curious' && score < 20) return true;
    });

    return {
      profile: profiles[profile] || profiles['Emerging Curious'],
      dominantType: typeInterpretations[dominantType] || typeInterpretations['Balanced']
    };
  }

  /**
   * Save to session storage
   */
  saveToSession() {
    try {
      const data = {
        sessionId: this.sessionId,
        questions: this.questions,
        savedAt: new Date().toISOString()
      };
      sessionStorage.setItem('curiosity_index_data', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save curiosity index:', e);
    }
  }

  /**
   * Load from session storage
   */
  loadFromSession() {
    try {
      const data = JSON.parse(sessionStorage.getItem('curiosity_index_data') || '{}');
      this.questions = data.questions || [];
      this.sessionId = data.sessionId;
      return true;
    } catch (e) {
      console.error('Failed to load curiosity index:', e);
      return false;
    }
  }

  /**
   * Export data for final report
   */
  exportForReport() {
    const distribution = this.getDistribution();
    const score = this.getScore();

    return {
      questions_count: this.questions.length,
      distribution: {
        WHO_percent: distribution.WHO,
        WHAT_percent: distribution.WHAT,
        HOW_percent: distribution.HOW,
        WHY_percent: distribution.WHY
      },
      score: score.score,
      profile: score.profile,
      dominantType: score.dominantType,
      interpretation: score.interpretation,
      all_questions: this.questions
    };
  }

  /**
   * Clear all data
   */
  clear() {
    this.questions = [];
    this.sessionId = null;
    sessionStorage.removeItem('curiosity_index_data');
  }
}

// Create global instance
const curiosityIndex = new CuriosityIndex();
