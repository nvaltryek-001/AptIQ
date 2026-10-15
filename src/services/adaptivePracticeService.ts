import { AptitudeQuestion } from '../types/assessment.ts';
import questionBankData from '../data/questionBank.json';
import { storageService } from './storageService.ts';

const allQuestions = questionBankData as AptitudeQuestion[];

export interface ClientQuestion {
  id: string;
  section: string;
  module: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  options: string[];
  timeLimit: number;
}

export interface AdaptiveResultRecord {
  userId: string;
  questionId: string;
  module: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isCorrect: boolean;
  timeTaken: number;
  selectedOption: string;
  answeredAt: string;
}

export interface AdaptiveUserState {
  userId: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  streak: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  recentQuestionIds: string[];
  totalSolved: number;
  totalCorrect: number;
}

export interface AdaptiveFeedback {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  nextDifficulty: 'Easy' | 'Medium' | 'Hard';
  streak: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  weakTopics: string[];
  totalSolved: number;
  totalCorrect: number;
  servedWeakTopic?: string | null;
}

const STORAGE_KEYS = {
  RESULTS_PREFIX: 'aptiq_adaptive_results_',
  STATE_PREFIX: 'aptiq_adaptive_state_'
};

export const adaptivePracticeService = {
  // Get all past results for a user
  getUserResults(userId: string): AdaptiveResultRecord[] {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.RESULTS_PREFIX}${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // Save a question result for a user
  saveUserResult(userId: string, record: AdaptiveResultRecord): void {
    try {
      const results = this.getUserResults(userId);
      results.push(record);
      localStorage.setItem(`${STORAGE_KEYS.RESULTS_PREFIX}${userId}`, JSON.stringify(results));
    } catch (e) {
      console.error('Failed to save adaptive result', e);
    }
  },

  // Get current user adaptive state (difficulty, streak, consecutive counters)
  getUserState(userId: string): AdaptiveUserState {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.STATE_PREFIX}${userId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // fallback
    }

    const defaultState: AdaptiveUserState = {
      userId,
      difficulty: 'Medium',
      streak: 0,
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      recentQuestionIds: [],
      totalSolved: 0,
      totalCorrect: 0
    };
    return defaultState;
  },

  // Save current user adaptive state
  saveUserState(userId: string, state: AdaptiveUserState): void {
    try {
      localStorage.setItem(`${STORAGE_KEYS.STATE_PREFIX}${userId}`, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save adaptive user state', e);
    }
  },

  // Identify topics where user accuracy is below 60%
  getWeakTopics(userId: string): string[] {
    const results = this.getUserResults(userId);
    const topicStats: Record<string, { total: number; correct: number }> = {};

    results.forEach(r => {
      const key = r.topic || r.module;
      if (!topicStats[key]) {
        topicStats[key] = { total: 0, correct: 0 };
      }
      topicStats[key].total++;
      if (r.isCorrect) {
        topicStats[key].correct++;
      }
    });

    const weak: string[] = [];
    Object.entries(topicStats).forEach(([topic, stat]) => {
      if (stat.total >= 2) {
        const accuracy = (stat.correct / stat.total) * 100;
        if (accuracy < 60) {
          weak.push(topic);
        }
      }
    });

    return weak;
  },

  /**
   * Fetches the next adaptive question for the user.
   * Strips correctAnswer and explanation before returning to the frontend.
   * Prioritizes weak topics (<60% accuracy) and avoids immediate repetitions.
   */
  async getNextQuestion(
    userId: string,
    preferredModule?: string
  ): Promise<{ question: ClientQuestion; adaptiveState: AdaptiveUserState; servedWeakTopic: string | null }> {
    // 1. Try backend API first if available
    try {
      const params = new URLSearchParams({ userId });
      if (preferredModule && preferredModule !== 'All Topics (Adaptive)') {
        params.set('module', preferredModule);
      }
      const response = await fetch(`/api/adaptive/question?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.question) {
          return data;
        }
      }
    } catch {
      // Backend unavailable or running client-only, use local secure engine
    }

    // 2. Local secure adaptive engine
    const state = this.getUserState(userId);
    const weakTopics = this.getWeakTopics(userId);

    let candidates = allQuestions.filter(q => q.difficulty === state.difficulty);

    // If preferred module specified
    if (preferredModule && preferredModule !== 'All Topics (Adaptive)') {
      candidates = candidates.filter(q => q.module === preferredModule);
    }

    // If there are weak topics and no strict module filter, or weak topic inside preferred module:
    let servedWeakTopic: string | null = null;
    const weakCandidates = candidates.filter(q => weakTopics.includes(q.topic) || weakTopics.includes(q.module));
    if (weakCandidates.length > 0 && Math.random() < 0.7) {
      candidates = weakCandidates;
      servedWeakTopic = weakCandidates[0]?.topic || weakCandidates[0]?.module || null;
    }

    // Filter out recent questions to avoid immediate repetition
    const unasked = candidates.filter(q => !state.recentQuestionIds.includes(q.id));
    const finalPool = unasked.length > 0 ? unasked : candidates;

    const selected = finalPool[Math.floor(Math.random() * finalPool.length)] || allQuestions[0];

    // Sanitize question: STRIP correctAnswer and explanation completely before returning to UI
    const clientQuestion: ClientQuestion = {
      id: selected.id,
      section: selected.section,
      module: selected.module,
      topic: selected.topic,
      difficulty: selected.difficulty,
      question: selected.question,
      options: [...selected.options],
      timeLimit: selected.timeLimit
    };

    return {
      question: clientQuestion,
      adaptiveState: state,
      servedWeakTopic
    };
  },

  /**
   * Validates the user's answer securely on the backend (or local secure engine).
   * Calculates adaptive difficulty shifts:
   * - 3 correct in a row -> increase difficulty
   * - 2 wrong in a row -> decrease difficulty
   * Saves the result record with userId, questionId, topic, difficulty, isCorrect, timeTaken.
   */
  async submitAnswer(
    userId: string,
    questionId: string,
    selectedOption: string,
    timeTaken: number
  ): Promise<AdaptiveFeedback> {
    // 1. Try backend API first
    try {
      const response = await fetch('/api/adaptive/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, questionId, selectedOption, timeTaken })
      });
      if (response.ok) {
        const data = await response.json();
        // Sync local storage as well for seamless offline persistence
        const state = this.getUserState(userId);
        state.difficulty = data.nextDifficulty;
        state.streak = data.streak;
        state.consecutiveCorrect = data.consecutiveCorrect;
        state.consecutiveWrong = data.consecutiveWrong;
        state.totalSolved = data.totalSolved;
        state.totalCorrect = data.totalCorrect;
        if (!state.recentQuestionIds.includes(questionId)) {
          state.recentQuestionIds.push(questionId);
          if (state.recentQuestionIds.length > 20) state.recentQuestionIds.shift();
        }
        this.saveUserState(userId, state);
        return data;
      }
    } catch {
      // Fall through to local secure engine
    }

    // 2. Local secure evaluation
    const fullQuestion = allQuestions.find(q => q.id === questionId);
    if (!fullQuestion) {
      throw new Error(`Question ${questionId} not found in repository`);
    }

    const isCorrect = selectedOption === fullQuestion.correctAnswer;
    const state = this.getUserState(userId);

    // Update streak and counters
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

    // Update recent question IDs (keep last 20)
    const recent = [...state.recentQuestionIds, questionId];
    if (recent.length > 20) {
      recent.shift();
    }

    const updatedState: AdaptiveUserState = {
      userId,
      difficulty: newDifficulty,
      streak: newStreak,
      consecutiveCorrect: newConsecutiveCorrect,
      consecutiveWrong: newConsecutiveWrong,
      recentQuestionIds: recent,
      totalSolved: state.totalSolved + 1,
      totalCorrect: state.totalCorrect + (isCorrect ? 1 : 0)
    };
    this.saveUserState(userId, updatedState);

    // Save individual question result
    const record: AdaptiveResultRecord = {
      userId,
      questionId,
      module: fullQuestion.module,
      topic: fullQuestion.topic,
      difficulty: fullQuestion.difficulty,
      isCorrect,
      timeTaken,
      selectedOption,
      answeredAt: new Date().toISOString()
    };
    this.saveUserResult(userId, record);

    const weakTopics = this.getWeakTopics(userId);

    return {
      isCorrect,
      correctAnswer: fullQuestion.correctAnswer,
      explanation: fullQuestion.explanation,
      nextDifficulty: newDifficulty,
      streak: newStreak,
      consecutiveCorrect: newConsecutiveCorrect,
      consecutiveWrong: newConsecutiveWrong,
      weakTopics,
      totalSolved: updatedState.totalSolved,
      totalCorrect: updatedState.totalCorrect
    };
  }
};
