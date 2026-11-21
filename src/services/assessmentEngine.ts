import {
  AptitudeQuestion,
  AssessmentSize,
  ASSESSMENT_BLUEPRINTS,
  BlueprintConfig,
  StudentAnswer,
  AssessmentAttempt
} from '../types/assessment.ts';
import questionBankData from '../data/questionBank.json';
import {
  normalizeQuestionText,
  isDuplicateQuestion,
  deduplicateQuestions,
  firebaseQuestionService
} from './firebaseQuestionService.ts';

export { normalizeQuestionText, isDuplicateQuestion, deduplicateQuestions };

/**
 * High-performance Fisher-Yates array shuffling to ensure 100% unbiased randomization.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * QuestionDeduplicator tracks seen questions across a test session using both unique IDs
 * and normalized question texts as fallback.
 */
export class QuestionDeduplicator {
  private seenIds = new Set<string>();
  private seenTexts = new Set<string>();

  constructor(initialQuestions: AptitudeQuestion[] = []) {
    initialQuestions.forEach(q => this.add(q));
  }

  isDuplicate(q: AptitudeQuestion): boolean {
    if (q.id && this.seenIds.has(q.id.trim().toLowerCase())) {
      return true;
    }
    const norm = normalizeQuestionText(q.question);
    if (norm && this.seenTexts.has(norm)) {
      return true;
    }
    return false;
  }

  add(q: AptitudeQuestion): boolean {
    if (this.isDuplicate(q)) {
      return false;
    }
    if (q.id) {
      this.seenIds.add(q.id.trim().toLowerCase());
    }
    const norm = normalizeQuestionText(q.question);
    if (norm) {
      this.seenTexts.add(norm);
    }
    return true;
  }

  size(): number {
    return Math.max(this.seenIds.size, this.seenTexts.size);
  }
}

// Initial deduplicated question bank
let allQuestions: AptitudeQuestion[] = deduplicateQuestions(questionBankData as AptitudeQuestion[]);

export const assessmentEngine = {
  /**
   * Returns all unique questions available in the question bank.
   */
  getAllQuestions(): AptitudeQuestion[] {
    return allQuestions;
  },

  /**
   * Filters an array of questions, eliminating any duplicates by ID or normalized question text.
   */
  deduplicateQuestions(questions: AptitudeQuestion[]): AptitudeQuestion[] {
    return deduplicateQuestions(questions);
  },

  /**
   * Updates or sets the question bank (e.g. after fetching from Firestore).
   * Automatically deduplicates to guarantee 0 duplicate entries.
   */
  setQuestionBank(questions: AptitudeQuestion[]): void {
    allQuestions = deduplicateQuestions(questions);
  },

  /**
   * Attempts to sync questions from Firestore if Firebase is configured,
   * merging with local question bank while strictly preventing duplicates.
   */
  async loadFirestoreQuestions(): Promise<AptitudeQuestion[]> {
    try {
      const fbQuestions = await firebaseQuestionService.fetchQuestionsFromFirestore();
      if (fbQuestions.length > 0) {
        // Merge with existing bank and deduplicate
        const merged = deduplicateQuestions([...fbQuestions, ...allQuestions]);
        allQuestions = merged;
      }
    } catch (e) {
      console.warn('[assessmentEngine] Firestore load failed, using local question bank', e);
    }
    return allQuestions;
  },

  /**
   * Retrieves a question by unique ID, with fallback to normalized question text.
   */
  getQuestionById(id: string): AptitudeQuestion | undefined {
    if (!id) return undefined;
    // 1. Check exact or case-insensitive ID match
    const byId = allQuestions.find(q => q.id === id || q.id.toLowerCase() === id.toLowerCase());
    if (byId) return byId;

    // 2. Fallback to normalized question text matching
    const normTarget = normalizeQuestionText(id);
    if (normTarget) {
      return allQuestions.find(q => normalizeQuestionText(q.question) === normTarget);
    }
    return undefined;
  },

  /**
   * Validates whether sufficient unique questions exist before starting a test.
   * Checks both total required count and section distribution.
   */
  validateQuestionAvailability(size: AssessmentSize | number): {
    available: boolean;
    error?: string;
    required: number;
    totalAvailable: number;
    sectionStats?: Record<string, { required: number; available: number }>;
  } {
    const blueprint = ASSESSMENT_BLUEPRINTS[size as AssessmentSize] || {
      size: size as AssessmentSize,
      title: `Diagnostic Assessment (${size} Questions)`,
      description: 'Custom Diagnostic Test',
      durationMinutes: Math.max(10, Math.round(Number(size))),
      sections: {
        quantitative: Math.round(Number(size) * 0.35),
        logical: Math.round(Number(size) * 0.35),
        verbal: Number(size) - Math.round(Number(size) * 0.35) * 2
      }
    };

    const uniqueBank = deduplicateQuestions(allQuestions);
    const quantAvailable = uniqueBank.filter(q => q.section === 'Quantitative Aptitude').length;
    const logicAvailable = uniqueBank.filter(q => q.section === 'Logical Reasoning').length;
    const verbalAvailable = uniqueBank.filter(q => q.section === 'Verbal Ability').length;

    const { quantitative, logical, verbal } = blueprint.sections;
    const totalRequired = quantitative + logical + verbal;

    const sectionStats = {
      'Quantitative Aptitude': { required: quantitative, available: quantAvailable },
      'Logical Reasoning': { required: logical, available: logicAvailable },
      'Verbal Ability': { required: verbal, available: verbalAvailable }
    };

    if (uniqueBank.length < totalRequired) {
      return {
        available: false,
        error: `Insufficient questions available. Requested: ${totalRequired} unique questions, but only ${uniqueBank.length} unique questions exist in the question bank.`,
        required: totalRequired,
        totalAvailable: uniqueBank.length,
        sectionStats
      };
    }

    if (quantAvailable < quantitative) {
      return {
        available: false,
        error: `Insufficient unique questions for Quantitative Aptitude. Required: ${quantitative}, Available: ${quantAvailable}.`,
        required: totalRequired,
        totalAvailable: uniqueBank.length,
        sectionStats
      };
    }

    if (logicAvailable < logical) {
      return {
        available: false,
        error: `Insufficient unique questions for Logical Reasoning. Required: ${logical}, Available: ${logicAvailable}.`,
        required: totalRequired,
        totalAvailable: uniqueBank.length,
        sectionStats
      };
    }

    if (verbalAvailable < verbal) {
      return {
        available: false,
        error: `Insufficient unique questions for Verbal Ability. Required: ${verbal}, Available: ${verbalAvailable}.`,
        required: totalRequired,
        totalAvailable: uniqueBank.length,
        sectionStats
      };
    }

    return {
      available: true,
      required: totalRequired,
      totalAvailable: uniqueBank.length,
      sectionStats
    };
  },

  /**
   * Generates a balanced, randomized assessment without any duplicate questions.
   * Guarantees:
   * 1. Every question is 100% unique (checked via ID and normalized text fallback).
   * 2. Questions are selected randomly, avoiding repetitive selections.
   * 3. Category distribution (Quantitative, Logical, Verbal) is strictly preserved.
   * 4. Pre-test check guarantees sufficient questions exist; never silently pads with duplicates.
   * 5. Question presentation order is randomized.
   */
  generateAssessment(size: AssessmentSize | number): {
    questions: AptitudeQuestion[];
    blueprint: BlueprintConfig;
  } {
    // 1. Availability validation (Requirement 5)
    const availabilityCheck = this.validateQuestionAvailability(size);
    if (!availabilityCheck.available) {
      throw new Error(
        availabilityCheck.error ||
          `Insufficient unique questions available to generate a ${size}-question test.`
      );
    }

    const blueprint = ASSESSMENT_BLUEPRINTS[size as AssessmentSize] || {
      size: size as AssessmentSize,
      title: `Diagnostic Assessment (${size} Questions)`,
      description: 'Balanced placement aptitude evaluation.',
      durationMinutes: Math.max(10, Math.round(Number(size))),
      sections: {
        quantitative: Math.round(Number(size) * 0.35),
        logical: Math.round(Number(size) * 0.35),
        verbal: Number(size) - Math.round(Number(size) * 0.35) * 2
      }
    };

    const { quantitative, logical, verbal } = blueprint.sections;

    // Deduplicate entire question bank first (Requirement 1 & 4)
    const uniquePool = deduplicateQuestions(allQuestions);

    // Global test-wide deduplicator (Requirement 1 & 3: duplicate prevention works across entire test)
    const testDeduplicator = new QuestionDeduplicator();

    // Helper: Selects random, balanced, unique questions for a specific section
    const sampleCategory = (
      sectionName: 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability',
      count: number
    ): AptitudeQuestion[] => {
      // 1. Get unused unique questions for this section
      const candidates = shuffleArray(
        uniquePool.filter(q => q.section === sectionName && !testDeduplicator.isDuplicate(q))
      );

      // 2. Group candidates by module
      const byModule: Record<string, AptitudeQuestion[]> = {};
      candidates.forEach(q => {
        if (!byModule[q.module]) byModule[q.module] = [];
        byModule[q.module].push(q);
      });

      // 3. Shuffle module list for random module traversal
      const shuffledModules = shuffleArray(Object.keys(byModule));

      // 4. Shuffle questions within each module
      for (const mod of shuffledModules) {
        byModule[mod] = shuffleArray(byModule[mod]);
      }

      const sectionSelected: AptitudeQuestion[] = [];
      let round = 0;

      // Round-robin selection across modules to ensure broad topic balance
      while (sectionSelected.length < count && round < 30) {
        for (const mod of shuffledModules) {
          if (sectionSelected.length >= count) break;
          const modQuestions = byModule[mod];
          const available = modQuestions.filter(
            q => !sectionSelected.some(s => s.id === q.id) && !testDeduplicator.isDuplicate(q)
          );
          if (available.length > 0) {
            // Pick a random question from available in this module
            const pick = available[Math.floor(Math.random() * available.length)];
            sectionSelected.push(pick);
            testDeduplicator.add(pick);
          }
        }
        round++;
      }

      // If more questions needed, randomly pick from any remaining unused questions in category
      if (sectionSelected.length < count) {
        const remaining = shuffleArray(
          candidates.filter(
            q => !sectionSelected.some(s => s.id === q.id) && !testDeduplicator.isDuplicate(q)
          )
        );
        for (const q of remaining) {
          if (sectionSelected.length >= count) break;
          sectionSelected.push(q);
          testDeduplicator.add(q);
        }
      }

      if (sectionSelected.length < count) {
        throw new Error(
          `Could not select ${count} unique questions for ${sectionName}. Only ${sectionSelected.length} unique questions available without duplication.`
        );
      }

      return sectionSelected;
    };

    // Category-wise selection maintaining section distributions
    const quantQuestions = sampleCategory('Quantitative Aptitude', quantitative);
    const logicQuestions = sampleCategory('Logical Reasoning', logical);
    const verbalQuestions = sampleCategory('Verbal Ability', verbal);

    // Combine all selected questions
    const combined = [...quantQuestions, ...logicQuestions, ...verbalQuestions];

    // Final verification: ensure strictly 100% unique questions in the test (Requirement 1)
    const finalCheck = deduplicateQuestions(combined);
    if (finalCheck.length !== combined.length) {
      throw new Error(
        'Duplicate detected during assessment generation. Aborting test creation to preserve test integrity.'
      );
    }

    // Randomize final question order (Requirement 2)
    const questions = shuffleArray(combined);

    return { questions, blueprint };
  },

  /**
   * Scores an assessment submission.
   */
  scoreAssessment(
    userId: string,
    size: AssessmentSize | number,
    startedAtMs: number,
    totalTimeSpentSeconds: number,
    answers: Record<string, StudentAnswer>,
    questionIds: string[]
  ): AssessmentAttempt {
    const blueprint = ASSESSMENT_BLUEPRINTS[size as AssessmentSize] || {
      size: size as AssessmentSize,
      title: `Diagnostic Assessment (${size} Questions)`,
      description: 'Placement Diagnostic Assessment',
      durationMinutes: Math.max(10, Math.round(Number(size))),
      sections: {
        quantitative: Math.round(Number(size) * 0.35),
        logical: Math.round(Number(size) * 0.35),
        verbal: Number(size) - Math.round(Number(size) * 0.35) * 2
      }
    };

    const assessmentQuestions = questionIds
      .map(id => this.getQuestionById(id))
      .filter((q): q is AptitudeQuestion => q !== undefined);

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const sectionStats: Record<
      string,
      { score: number; total: number; correct: number; attempted: number; timeSpent: number }
    > = {
      'Quantitative Aptitude': { score: 0, total: 0, correct: 0, attempted: 0, timeSpent: 0 },
      'Logical Reasoning': { score: 0, total: 0, correct: 0, attempted: 0, timeSpent: 0 },
      'Verbal Ability': { score: 0, total: 0, correct: 0, attempted: 0, timeSpent: 0 }
    };

    const topicStats: Record<
      string,
      {
        module: string;
        topic: string;
        section: string;
        score: number;
        total: number;
        correct: number;
        attempted: number;
        timeSpent: number;
      }
    > = {};

    assessmentQuestions.forEach(q => {
      const ans = answers[q.id];
      const hasAnswer = ans && ans.selectedOption !== null && ans.selectedOption !== '';
      const isCorrect = hasAnswer && ans.selectedOption === q.correctAnswer;
      const timeSpent = ans?.timeSpentSeconds || 0;

      // Global
      if (hasAnswer) {
        if (isCorrect) correctCount++;
        else wrongCount++;
      } else {
        unansweredCount++;
      }

      // Section
      if (sectionStats[q.section]) {
        sectionStats[q.section].total++;
        sectionStats[q.section].timeSpent += timeSpent;
        if (hasAnswer) sectionStats[q.section].attempted++;
        if (isCorrect) {
          sectionStats[q.section].score += 1;
          sectionStats[q.section].correct++;
        }
      }

      // Topic & Module
      const topicKey = `${q.module}:::${q.topic}`;
      if (!topicStats[topicKey]) {
        topicStats[topicKey] = {
          module: q.module,
          topic: q.topic,
          section: q.section,
          score: 0,
          total: 0,
          correct: 0,
          attempted: 0,
          timeSpent: 0
        };
      }
      topicStats[topicKey].total++;
      topicStats[topicKey].timeSpent += timeSpent;
      if (hasAnswer) topicStats[topicKey].attempted++;
      if (isCorrect) {
        topicStats[topicKey].score += 1;
        topicStats[topicKey].correct++;
      }
    });

    const totalQuestions = assessmentQuestions.length;
    const score = correctCount;
    const percentage = Math.round((score / Math.max(1, totalQuestions)) * 100);
    const totalAttempted = correctCount + wrongCount;
    const accuracy = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;
    const averageTimePerQuestion =
      totalQuestions > 0 ? Math.round(totalTimeSpentSeconds / totalQuestions) : 0;

    // Build section breakdown
    const sectionBreakdown = Object.entries(sectionStats).map(([section, data]) => {
      const secPercentage = data.total > 0 ? Math.round((data.score / data.total) * 100) : 0;
      const secAccuracy = data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0;
      return {
        section: section as 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability',
        score: data.score,
        total: data.total,
        percentage: secPercentage,
        accuracy: secAccuracy,
        timeSpentSeconds: data.timeSpent
      };
    });

    // Build topic breakdown with weak topic detection thresholds
    const topicBreakdown = Object.values(topicStats).map(t => {
      const topicPct = t.total > 0 ? Math.round((t.score / t.total) * 100) : 0;
      const topicAcc = t.attempted > 0 ? Math.round((t.correct / t.attempted) * 100) : 0;
      const avgTime = t.total > 0 ? Math.round(t.timeSpent / t.total) : 0;

      let status: 'Critical' | 'Weak' | 'Average' | 'Strong' | 'Excellent' = 'Average';
      let recommendation = '';

      if (topicPct < 40) {
        status = 'Critical';
        recommendation = `Start ${t.module} Foundation Training & solve 10 guided basic practice problems.`;
      } else if (topicPct < 60) {
        status = 'Weak';
        recommendation = `Review formula sheets and intermediate speed drills for ${t.module}.`;
      } else if (topicPct < 75) {
        status = 'Average';
        recommendation = `Solve 10 timed practice questions to push accuracy above 80%.`;
      } else if (topicPct < 90) {
        status = 'Strong';
        recommendation = `Practice advanced placement questions to achieve complete mastery.`;
      } else {
        status = 'Excellent';
        recommendation = `Mastery achieved. Maintain speed with periodic mock tests.`;
      }

      return {
        module: t.module,
        topic: t.topic,
        section: t.section,
        score: t.score,
        total: t.total,
        percentage: topicPct,
        accuracy: topicAcc,
        averageTime: avgTime,
        status,
        recommendation
      };
    });

    // Sort topicBreakdown so Critical and Weak topics appear at the top
    topicBreakdown.sort((a, b) => a.percentage - b.percentage);

    return {
      id: `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      blueprintSize: size as AssessmentSize,
      title: `${blueprint.title} (${size} Questions)`,
      startedAt: new Date(startedAtMs).toISOString(),
      submittedAt: new Date().toISOString(),
      totalTimeSpentSeconds,
      totalQuestions,
      score,
      percentage,
      correctCount,
      wrongCount,
      unansweredCount,
      accuracy,
      averageTimePerQuestion,
      sectionBreakdown,
      topicBreakdown,
      answers,
      questionIds
    };
  }
};
