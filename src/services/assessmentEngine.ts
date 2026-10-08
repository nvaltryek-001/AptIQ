import {
  AptitudeQuestion,
  AssessmentSize,
  ASSESSMENT_BLUEPRINTS,
  StudentAnswer,
  AssessmentAttempt
} from '../types/assessment.ts';
import questionBankData from '../data/questionBank.json';

const allQuestions = questionBankData as AptitudeQuestion[];

export const assessmentEngine = {
  getAllQuestions(): AptitudeQuestion[] {
    return allQuestions;
  },

  getQuestionById(id: string): AptitudeQuestion | undefined {
    return allQuestions.find(q => q.id === id);
  },

  // Generates balanced question set for a given blueprint size
  generateAssessment(size: AssessmentSize): { questions: AptitudeQuestion[]; blueprint: typeof ASSESSMENT_BLUEPRINTS[AssessmentSize] } {
    const blueprint = ASSESSMENT_BLUEPRINTS[size] || ASSESSMENT_BLUEPRINTS[30];
    const { quantitative, logical, verbal } = blueprint.sections;

    const quantPool = allQuestions.filter(q => q.section === 'Quantitative Aptitude');
    const logicPool = allQuestions.filter(q => q.section === 'Logical Reasoning');
    const verbalPool = allQuestions.filter(q => q.section === 'Verbal Ability');

    // Deterministic pseudo-random distribution across modules to maximize variety
    const sampleBalanced = (pool: AptitudeQuestion[], count: number): AptitudeQuestion[] => {
      // Group by module
      const byModule: Record<string, AptitudeQuestion[]> = {};
      pool.forEach(q => {
        if (!byModule[q.module]) byModule[q.module] = [];
        byModule[q.module].push(q);
      });

      const modules = Object.keys(byModule);
      const selected: AptitudeQuestion[] = [];
      let round = 0;

      while (selected.length < count && round < 25) {
        for (const mod of modules) {
          if (selected.length >= count) break;
          const modQuestions = byModule[mod];
          const available = modQuestions.filter(q => !selected.some(s => s.id === q.id));
          if (available.length > 0) {
            // Pick based on difficulty mix (prefer Medium, then Easy, then Hard)
            const pick = available[Math.floor(Math.random() * available.length)];
            selected.push(pick);
          }
        }
        round++;
      }

      // If still need more, sample remaining
      if (selected.length < count) {
        const remaining = pool.filter(q => !selected.some(s => s.id === q.id));
        for (let i = 0; i < count - selected.length && i < remaining.length; i++) {
          selected.push(remaining[i]);
        }
      }

      return selected;
    };

    const selectedQuant = sampleBalanced(quantPool, quantitative);
    const selectedLogic = sampleBalanced(logicPool, logical);
    const selectedVerbal = sampleBalanced(verbalPool, verbal);

    const questions = [...selectedQuant, ...selectedLogic, ...selectedVerbal];
    return { questions, blueprint };
  },

  // Scores an assessment submission
  scoreAssessment(
    userId: string,
    size: AssessmentSize,
    startedAtMs: number,
    totalTimeSpentSeconds: number,
    answers: Record<string, StudentAnswer>,
    questionIds: string[]
  ): AssessmentAttempt {
    const blueprint = ASSESSMENT_BLUEPRINTS[size];
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
    const averageTimePerQuestion = totalQuestions > 0 ? Math.round(totalTimeSpentSeconds / totalQuestions) : 0;

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

      // Thresholds:
      // 0–39% = Critical
      // 40–59% = Weak
      // 60–74% = Average
      // 75–89% = Strong
      // 90–100% = Excellent
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
      blueprintSize: size,
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
