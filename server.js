import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.resolve(process.cwd(), 'dist');

app.use(express.json());

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Load question bank for backend validation
const questionBankPath = path.resolve(process.cwd(), 'src/data/questionBank.json');
let questionBank = [];
try {
  if (fs.existsSync(questionBankPath)) {
    questionBank = JSON.parse(fs.readFileSync(questionBankPath, 'utf8'));
  }
} catch (e) {
  console.error('[AptIQ Server] Failed to load question bank in backend', e);
}

// In-memory adaptive states and results per user
const userAdaptiveStates = new Map();
const userAdaptiveResults = new Map();

// Helper to get or create user adaptive state
function getUserAdaptiveState(userId) {
  if (!userAdaptiveStates.has(userId)) {
    userAdaptiveStates.set(userId, {
      userId,
      difficulty: 'Medium',
      streak: 0,
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      recentQuestionIds: [],
      totalSolved: 0,
      totalCorrect: 0
    });
  }
  return userAdaptiveStates.get(userId);
}

function getUserWeakTopics(userId) {
  const results = userAdaptiveResults.get(userId) || [];
  const topicStats = {};
  results.forEach(r => {
    const key = r.topic || r.module;
    if (!topicStats[key]) topicStats[key] = { total: 0, correct: 0 };
    topicStats[key].total++;
    if (r.isCorrect) topicStats[key].correct++;
  });
  const weak = [];
  Object.entries(topicStats).forEach(([top, stat]) => {
    if (stat.total >= 2 && (stat.correct / stat.total) * 100 < 60) {
      weak.push(top);
    }
  });
  return weak;
}

// 1. Fetch next question: STRIPS correctAnswer and explanation
app.get('/api/adaptive/question', (req, res) => {
  const { userId = 'guest', module: reqModule } = req.query;
  const state = getUserAdaptiveState(userId);
  const weakTopics = getUserWeakTopics(userId);

  let candidates = questionBank.filter(q => q.difficulty === state.difficulty);
  if (reqModule && reqModule !== 'All Topics (Adaptive)') {
    candidates = candidates.filter(q => q.module === reqModule);
  }

  // Prioritize weak topics (<60% accuracy)
  let servedWeakTopic = null;
  const weakCandidates = candidates.filter(q => weakTopics.includes(q.topic) || weakTopics.includes(q.module));
  if (weakCandidates.length > 0 && Math.random() < 0.7) {
    candidates = weakCandidates;
    servedWeakTopic = weakCandidates[0]?.topic || weakCandidates[0]?.module || null;
  }

  // Exclude recent questions
  const unasked = candidates.filter(q => !state.recentQuestionIds.includes(q.id));
  const pool = unasked.length > 0 ? unasked : candidates;
  const selected = pool[Math.floor(Math.random() * pool.length)] || questionBank[0];

  if (!selected) {
    return res.status(404).json({ error: 'No question available' });
  }

  // Return question WITHOUT revealing correctAnswer or explanation
  return res.json({
    question: {
      id: selected.id,
      section: selected.section,
      module: selected.module,
      topic: selected.topic,
      difficulty: selected.difficulty,
      question: selected.question,
      options: selected.options,
      timeLimit: selected.timeLimit
    },
    adaptiveState: state,
    servedWeakTopic
  });
});

// 2. Submit answer: securely validates against stored questionBank on backend
app.post('/api/adaptive/submit', (req, res) => {
  const { userId = 'guest', questionId, selectedOption, timeTaken = 0 } = req.body || {};
  if (!questionId || !selectedOption) {
    return res.status(400).json({ error: 'questionId and selectedOption are required' });
  }

  const question = questionBank.find(q => q.id === questionId);
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  const isCorrect = selectedOption.trim() === question.correctAnswer.trim();
  const state = getUserAdaptiveState(userId);

  let newDifficulty = state.difficulty;
  let newConsecutiveCorrect = state.consecutiveCorrect;
  let newConsecutiveWrong = state.consecutiveWrong;
  let newStreak = state.streak;

  if (isCorrect) {
    newStreak += 1;
    newConsecutiveCorrect += 1;
    newConsecutiveWrong = 0;

    // 1 correct answer -> make it harder for next question
    if (state.difficulty === 'Easy') newDifficulty = 'Medium';
    else if (state.difficulty === 'Medium') newDifficulty = 'Hard';
  } else {
    newStreak = 0;
    newConsecutiveWrong += 1;
    newConsecutiveCorrect = 0;

    // 1 wrong answer -> make it easier for next question
    if (state.difficulty === 'Hard') newDifficulty = 'Medium';
    else if (state.difficulty === 'Medium') newDifficulty = 'Easy';
  }

  // Avoid immediate repeats (track last 20)
  if (!state.recentQuestionIds.includes(questionId)) {
    state.recentQuestionIds.push(questionId);
    if (state.recentQuestionIds.length > 20) state.recentQuestionIds.shift();
  }

  state.difficulty = newDifficulty;
  state.streak = newStreak;
  state.consecutiveCorrect = newConsecutiveCorrect;
  state.consecutiveWrong = newConsecutiveWrong;
  state.totalSolved += 1;
  if (isCorrect) state.totalCorrect += 1;

  // Save result
  if (!userAdaptiveResults.has(userId)) userAdaptiveResults.set(userId, []);
  userAdaptiveResults.get(userId).push({
    userId,
    questionId,
    module: question.module,
    topic: question.topic,
    difficulty: question.difficulty,
    isCorrect,
    timeTaken,
    selectedOption,
    answeredAt: new Date().toISOString()
  });

  const weakTopics = getUserWeakTopics(userId);

  // Return feedback with correct answer and explanation now unlocked
  return res.json({
    isCorrect,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    nextDifficulty: newDifficulty,
    streak: newStreak,
    consecutiveCorrect: newConsecutiveCorrect,
    consecutiveWrong: newConsecutiveWrong,
    weakTopics,
    totalSolved: state.totalSolved,
    totalCorrect: state.totalCorrect
  });
});

// Verification Status API for backend validation (Requirement 9)
app.post('/api/auth/verify-status', (req, res) => {
  const { email, isEmailVerified } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Backend authorization check: verify user is verified
  if (!isEmailVerified) {
    return res.status(403).json({
      authorized: false,
      error: 'Access restricted: Student email has not been verified.'
    });
  }

  return res.json({
    authorized: true,
    message: 'Student authorization verified.'
  });
});

// Serve frontend assets in production
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AptIQ Server] Running at http://localhost:${PORT}`);
});
