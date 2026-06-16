/**
 * Curiosity Index UI Component
 * Displays motivational prompts and question input at end of each module
 */

const MODULE_PROMPTS = {
  'Aptitude Assessment': {
    title: '🧠 You\'ve completed the Aptitude Assessment!',
    description: 'This section tested your reasoning, logic, and problem-solving abilities across various difficulty levels.',
    prompt: 'Now we\'d love to hear from you:',
    questions: [
      'Did any question confuse you? Ask why it works that way.',
      'Curious about a concept you encountered? Ask what it means or how it applies in real life.',
      'Want to understand the reasoning? Ask how to approach similar problems.',
      'Wondering about deeper principles? Ask why these concepts matter.'
    ],
    placeholder: 'Ask any question related to aptitude, reasoning, or problem-solving...',
    motivation: 'Your questions help us understand your thinking process better. There are no silly questions — ask away!'
  },

  'Personality Profile': {
    title: '🧬 You\'ve completed the Personality Profile!',
    description: 'This section explored how you naturally think, communicate, and interact with others.',
    prompt: 'Questions about your personality?',
    questions: [
      'Curious about how your traits affect your choices? Ask who you naturally gravitate towards.',
      'Want to understand your communication style? Ask what your preferences mean.',
      'Wondering how to work with different personalities? Ask how various types interact.',
      'Interested in personal growth? Ask why certain traits develop.'
    ],
    placeholder: 'Ask about personality types, communication styles, or interpersonal dynamics...',
    motivation: 'Understanding yourself better is the first step to personal growth. Your questions matter!'
  },

  'Interest Inventory': {
    title: '🎯 You\'ve completed the Interest Inventory!',
    description: 'This section revealed what you\'re naturally drawn to and genuinely passionate about.',
    prompt: 'Questions about your interests?',
    questions: [
      'Wondering where your interests lead? Ask who works in fields you\'re curious about.',
      'Want to explore career options? Ask what careers align with your interests.',
      'Curious about skill development? Ask how to develop interests into expertise.',
      'Interested in discovering more? Ask why certain fields fascinate you.'
    ],
    placeholder: 'Ask about career paths, skill development, or exploring new interests...',
    motivation: 'Your authentic interests are clues to your ideal future. Explore them fearlessly!'
  },

  'Emotional Intelligence': {
    title: '❤️ You\'ve completed Emotional Intelligence!',
    description: 'This section assessed your self-awareness, empathy, and ability to navigate emotions and relationships.',
    prompt: 'Questions about emotional intelligence?',
    questions: [
      'Wondering how to manage emotions better? Ask who to turn to for support.',
      'Curious about empathy? Ask what it really means to understand others.',
      'Want to improve relationships? Ask how emotional awareness helps communication.',
      'Interested in stress management? Ask why certain techniques work.'
    ],
    placeholder: 'Ask about emotions, relationships, stress management, or emotional growth...',
    motivation: 'Emotional awareness is a superpower. Your questions show you\'re ready to grow!'
  },

  'Values & Motivation': {
    title: '⭐ You\'ve completed Values & Motivation!',
    description: 'This section uncovered what you fundamentally value and what drives you forward.',
    prompt: 'Questions about your values?',
    questions: [
      'Wondering what matters most? Ask who influences your values.',
      'Want to align life with values? Ask what values mean in practice.',
      'Curious about motivation sources? Ask how different values drive different people.',
      'Seeking deeper meaning? Ask why certain values matter to society.'
    ],
    placeholder: 'Ask about values, life purpose, motivation, or meaningful work...',
    motivation: 'Living by your values is the foundation of fulfillment. Keep exploring!'
  },

  'Situational Judgement': {
    title: '⚡ You\'ve completed Situational Judgement!',
    description: 'This section revealed your decision-making instincts and how you respond under pressure.',
    prompt: 'Questions about decision-making?',
    questions: [
      'Wondering how to handle tough decisions? Ask who to consult in different situations.',
      'Curious about ethical dilemmas? Ask what makes a decision right or wrong.',
      'Want to improve problem-solving? Ask how others approach complex situations.',
      'Interested in leadership? Ask why certain decisions impact teams differently.'
    ],
    placeholder: 'Ask about decision-making, ethics, leadership, or handling challenges...',
    motivation: 'Good judgment comes from reflection. Your questions show wisdom beyond your years!'
  },

  'Learning Style': {
    title: '📚 You\'ve completed Learning Style Assessment!',
    description: 'This section identified how you learn best — whether you\'re Visual, Auditory, Reading/Writing, or Kinesthetic.',
    prompt: 'Questions about your learning style?',
    questions: [
      'Curious about your learning type? Ask who else shares your learning preference.',
      'Want to study smarter? Ask what study methods match your style best.',
      'Wondering about career fit? Ask how different jobs align with your learning strengths.',
      'Interested in growth? Ask why certain learning approaches work better than others.'
    ],
    placeholder: 'Ask about learning styles, study techniques, or matching work to your strengths...',
    motivation: 'Knowing how you learn unlocks academic and professional success. Smart questions!'
  },

  'Resilience Index': {
    title: '💪 You\'ve completed the Resilience Index!',
    description: 'This section measured your ability to handle stress, bounce back from challenges, and persist.',
    prompt: 'Questions about resilience?',
    questions: [
      'Wondering how to build resilience? Ask who demonstrates resilience in your life.',
      'Curious about stress management? Ask what techniques actually work.',
      'Want to handle setbacks better? Ask how successful people bounce back.',
      'Interested in growth mindset? Ask why resilience is learnable and developable.'
    ],
    placeholder: 'Ask about building resilience, handling stress, or overcoming challenges...',
    motivation: 'Resilience isn\'t about never falling — it\'s about getting back up. Your questions show strength!'
  },

  'Creativity Index': {
    title: '🎨 You\'ve completed the Creativity Index!',
    description: 'This section assessed your creative thinking, innovation capacity, and ability to generate novel solutions.',
    prompt: 'Questions about creativity?',
    questions: [
      'Wondering how to boost creativity? Ask who the most creative people are and why.',
      'Curious about innovation? Ask what makes something truly creative.',
      'Want creative career options? Ask how creativity applies across different fields.',
      'Interested in skill building? Ask why creativity can be learned and developed.'
    ],
    placeholder: 'Ask about creative thinking, innovation, artistic expression, or novel problem-solving...',
    motivation: 'Creativity is your superpower — use it to imagine your best future!'
  },

  'Leadership Readiness': {
    title: '🎯 You\'ve completed the Leadership Readiness Assessment!',
    description: 'This section evaluated your potential to lead, influence, and inspire others effectively.',
    prompt: 'Questions about leadership?',
    questions: [
      'Curious about leadership styles? Ask who the great leaders are and what they do differently.',
      'Want to improve influence? Ask what makes someone a natural leader.',
      'Wondering about career growth? Ask how leadership skills open doors.',
      'Interested in impact? Ask why leadership matters in every field.'
    ],
    placeholder: 'Ask about leadership skills, influence, team dynamics, or making an impact...',
    motivation: 'Great leaders start by asking great questions. You\'re already on the path!'
  }
};

/**
 * Create curiosity index UI for a module
 * @param {string} moduleName - Name of the module
 * @param {Function} onQuestionSubmit - Callback when question is submitted
 * @returns {HTMLElement} - The component element
 */
function createCuriosityIndexUI(moduleName, onQuestionSubmit) {
  const config = MODULE_PROMPTS[moduleName];
  if (!config) return null;

  const container = document.createElement('div');
  container.className = 'curiosity-container';
  container.id = `curiosity-${moduleName.replace(/\s+/g, '-').toLowerCase()}`;

  // Get questions already asked in this module
  const moduleQuestions = curiosityIndex.getModuleQuestions(moduleName);

  container.innerHTML = `
    <div class="curiosity-section" style="
      background: linear-gradient(135deg, #f5e6ff 0%, #e8f4ff 100%);
      border-radius: 16px;
      padding: 2rem;
      margin: 2rem 0;
      border: 2px solid rgba(123, 47, 190, 0.2);
    ">
      <!-- Header -->
      <div style="margin-bottom: 1.5rem;">
        <h2 style="
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          font-weight: 700;
          color: #1A1208;
          margin-bottom: 0.5rem;
        ">${config.title}</h2>
        <p style="
          font-size: 0.95rem;
          color: rgba(26, 18, 8, 0.65);
          line-height: 1.6;
          margin: 0;
        ">${config.description}</p>
      </div>

      <!-- Motivation Boxes -->
      <div style="
        background: rgba(255, 255, 255, 0.6);
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        border-left: 4px solid #7B2FBE;
      ">
        <p style="
          font-weight: 600;
          color: #7B2FBE;
          margin: 0 0 0.75rem 0;
          font-size: 0.95rem;
        ">${config.prompt}</p>
        <ul style="
          margin: 0;
          padding-left: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        ">
          ${config.questions.map(q => `
            <li style="
              font-size: 0.85rem;
              color: rgba(26, 18, 8, 0.7);
              line-height: 1.5;
            ">${q}</li>
          `).join('')}
        </ul>
      </div>

      <!-- Motivation Text -->
      <div style="
        background: rgba(123, 47, 190, 0.08);
        border-radius: 10px;
        padding: 1rem;
        margin-bottom: 1.5rem;
        border: 1px solid rgba(123, 47, 190, 0.15);
      ">
        <p style="
          margin: 0;
          font-size: 0.9rem;
          color: #7B2FBE;
          font-weight: 500;
          line-height: 1.6;
        ">💭 ${config.motivation}</p>
      </div>

      <!-- Question Input -->
      <div style="margin-bottom: 1rem;">
        <label style="
          display: block;
          font-weight: 600;
          color: rgba(26, 18, 8, 0.7);
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        ">Ask your question:</label>
        <div style="display: flex; gap: 0.5rem;">
          <input
            type="text"
            class="curiosity-input"
            placeholder="${config.placeholder}"
            style="
              flex: 1;
              padding: 0.75rem 1rem;
              border: 2px solid rgba(123, 47, 190, 0.2);
              border-radius: 10px;
              font-size: 0.9rem;
              font-family: inherit;
              transition: all 0.2s;
            "
            onkeypress="if(event.key === 'Enter') this.parentElement.querySelector('.curiosity-btn').click()"
          />
          <button
            class="curiosity-btn"
            style="
              padding: 0.75rem 1.5rem;
              background: #7B2FBE;
              color: white;
              border: none;
              border-radius: 10px;
              font-weight: 600;
              cursor: pointer;
              font-size: 0.9rem;
              transition: all 0.2s;
            "
            onclick="handleCuriositySubmit(this)"
          >Ask</button>
        </div>
      </div>

      <!-- Questions Display -->
      ${moduleQuestions.length > 0 ? `
        <div style="
          background: rgba(255, 255, 255, 0.5);
          border-radius: 10px;
          padding: 1rem;
          max-height: 300px;
          overflow-y: auto;
        ">
          <p style="
            font-weight: 600;
            color: rgba(26, 18, 8, 0.6);
            margin: 0 0 0.75rem 0;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          ">Your questions in this module (${moduleQuestions.length}):</p>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${moduleQuestions.map(q => `
              <div style="
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                padding: 0.75rem;
                background: rgba(123, 47, 190, 0.05);
                border-radius: 8px;
                border-left: 3px solid ${getCategoryColor(q.category)};
              ">
                <span style="
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  width: 24px;
                  height: 24px;
                  background: ${getCategoryColor(q.category)};
                  color: white;
                  border-radius: 50%;
                  font-weight: 700;
                  font-size: 0.7rem;
                  flex-shrink: 0;
                ">${q.category.charAt(0)}</span>
                <div style="flex: 1; min-width: 0;">
                  <p style="
                    margin: 0;
                    font-size: 0.85rem;
                    color: rgba(26, 18, 8, 0.8);
                    line-height: 1.5;
                    word-break: break-word;
                  ">${q.text}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Handle button click
  const submitBtn = container.querySelector('.curiosity-btn');
  const input = container.querySelector('.curiosity-input');

  const handleSubmit = () => {
    const text = input.value.trim();
    if (text) {
      const question = curiosityIndex.addQuestion(text, moduleName);
      input.value = '';
      onQuestionSubmit?.(question);
      // Refresh the component to show the new question
      const parent = container.parentElement;
      if (parent) {
        parent.innerHTML = '';
        parent.appendChild(createCuriosityIndexUI(moduleName, onQuestionSubmit));
      }
    }
  };

  submitBtn.addEventListener('click', handleSubmit);

  return container;
}

/**
 * Get color for category
 */
function getCategoryColor(category) {
  const colors = {
    'WHO': '#C0410A',   // Red-orange (people)
    'WHAT': '#1A5FA8',  // Blue (knowledge)
    'HOW': '#0A6B5E',   // Teal (problem-solving)
    'WHY': '#7B2FBE',   // Purple (research)
    'UNCATEGORIZED': '#999'
  };
  return colors[category] || colors['UNCATEGORIZED'];
}

/**
 * Handle question submission (called from onclick)
 */
function handleCuriositySubmit(button) {
  const input = button.parentElement.querySelector('.curiosity-input');
  const text = input.value.trim();
  if (text) {
    const moduleName = button.closest('.curiosity-container').id
      .replace('curiosity-', '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const question = curiosityIndex.addQuestion(text, moduleName);
    input.value = '';
    input.focus();
  }
}

/**
 * Display curiosity index results
 */
function displayCuriosityResults() {
  const score = curiosityIndex.getScore();
  const dist = curiosityIndex.getDistribution();

  return {
    score: score.score,
    profile: score.profile,
    dominantType: score.dominantType,
    distribution: dist,
    interpretation: score.interpretation,
    totalQuestions: dist.total
  };
}
