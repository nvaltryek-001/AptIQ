import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Lightbulb,
  AlertOctagon,
  Target,
  Zap,
  RotateCcw,
  AlertCircle,
  Award,
  ChevronRight,
  ChevronLeft,
  RefreshCw
} from 'lucide-react';
import { UserProfile, storageService, ModuleTrainingProgress } from '../../services/storageService.ts';
import { trainingQuestionService } from '../../services/trainingQuestionService.ts';
import { AptitudeQuestion } from '../../types/assessment.ts';

interface TrainingModuleViewProps {
  initialModule?: string;
  user?: UserProfile | null;
  onGoToAssessment: () => void;
}

export const TrainingModuleView: React.FC<TrainingModuleViewProps> = ({
  initialModule = 'Percentages',
  user,
  onGoToAssessment
}) => {
  const [selectedModule, setSelectedModule] = useState<string>(initialModule);
  const [activeStage, setActiveStage] = useState<number>(1);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  // Question navigation and answer tracking per stage (each stage has 5 questions)
  const [stageQuestionIdx, setStageQuestionIdx] = useState<number>(0);
  const [stageAnswers, setStageAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Stage 5 Target Training Test state
  const [isTestStarted, setIsTestStarted] = useState<boolean>(false);
  const [isTestSubmitted, setIsTestSubmitted] = useState<boolean>(false);
  const [testScoreResult, setTestScoreResult] = useState<{ score: number; total: number; percentage: number } | null>(null);
  const [retestNotice, setRetestNotice] = useState<string | null>(null);

  const userId = user?.id || 'guest';

  // Load module progress from storage
  const [progress, setProgress] = useState<ModuleTrainingProgress>(() =>
    storageService.getModuleProgress(userId, selectedModule)
  );

  // When module or user changes, refresh progress and states
  useEffect(() => {
    const loaded = storageService.getModuleProgress(userId, selectedModule);
    setProgress(loaded);
    setActiveStage(1);
    setStageQuestionIdx(0);
    setStageAnswers({});
    setShowExplanation(false);
    setLockedNotice(null);
    setIsTestStarted(false);
    setIsTestSubmitted(false);
    setTestScoreResult(null);
    setRetestNotice(null);
  }, [userId, selectedModule]);

  // When active stage changes, reset stage question index and answers
  useEffect(() => {
    setStageQuestionIdx(0);
    setStageAnswers({});
    setShowExplanation(false);
    setLockedNotice(null);
  }, [activeStage]);

  const modules = [
    'Percentages',
    'Time and Work',
    'Profit, Loss and Discounts',
    'Seating Arrangement',
    'Blood Relations',
    'Probability',
    'Tenses and Subject-Verb Agreement',
    'Articles and Prepositions',
    'Time, Speed and Distance',
    'Number System',
    'Simple and Compound Interest',
    'Ratios, Proportions and Variations',
    'Averages',
    'Direction Sense Test',
    'Coding and Decoding',
    'Permutation and Combination'
  ];

  // Stage definition with strict locking: Stage 2 only opens after Stage 1 is completed
  const isStageUnlocked = (num: number): boolean => {
    if (num === 1) return true; // Stage 1 is always open
    return progress.completedStages.includes(num - 1);
  };

  const stages = [
    {
      num: 1,
      title: 'Concept & Formulas',
      isCompleted: progress.completedStages.includes(1),
      isUnlocked: true
    },
    {
      num: 2,
      title: 'Basic Foundation Questions',
      isCompleted: progress.completedStages.includes(2),
      isUnlocked: isStageUnlocked(2)
    },
    {
      num: 3,
      title: 'Intermediate Placement Drills',
      isCompleted: progress.completedStages.includes(3),
      isUnlocked: isStageUnlocked(3)
    },
    {
      num: 4,
      title: 'Advanced High-Difficulty Scenarios',
      isCompleted: progress.completedStages.includes(4),
      isUnlocked: isStageUnlocked(4)
    },
    {
      num: 5,
      title: 'Mastery Test (Threshold 80%+)',
      isCompleted: progress.testAttended,
      isUnlocked: isStageUnlocked(5)
    }
  ];

  // Fetch exactly 5 questions of the same type for the current active stage and cycle
  const currentStageQuestions: AptitudeQuestion[] = trainingQuestionService.getQuestionsForStage(
    selectedModule,
    activeStage,
    progress.cycle || 0
  );

  const currentQ: AptitudeQuestion | undefined = currentStageQuestions[stageQuestionIdx];

  const handleStageClick = (num: number) => {
    if (isStageUnlocked(num)) {
      setActiveStage(num);
      setLockedNotice(null);
    } else {
      if (num === 2) {
        setLockedNotice('Stage 2 is locked. Complete Stage 1 (Concept & Formulas) first to unlock Stage 2.');
      } else {
        setLockedNotice(`Stage ${num} is locked. You must complete Stage ${num - 1} before proceeding.`);
      }
    }
  };

  const handleSelectOption = (opt: string) => {
    setStageAnswers(prev => ({
      ...prev,
      [stageQuestionIdx]: opt
    }));
    setShowExplanation(true);
  };

  const handleCompleteStage = (stageNum: number) => {
    const updatedStages = Array.from(new Set([...progress.completedStages, stageNum])).sort((a, b) => a - b);
    const updatedProgress: ModuleTrainingProgress = {
      ...progress,
      completedStages: updatedStages
    };
    storageService.saveModuleProgress(userId, updatedProgress);
    setProgress(updatedProgress);
    setLockedNotice(null);

    // Automatically transition to the next stage
    if (stageNum < 5) {
      setActiveStage(stageNum + 1);
    }
  };

  // Submit Stage 5 Target Training Test
  const handleSubmitTest = () => {
    if (currentStageQuestions.length === 0) return;

    let correct = 0;
    currentStageQuestions.forEach((q, idx) => {
      if (stageAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });

    const scorePct = Math.round((correct / currentStageQuestions.length) * 100);
    const result = {
      score: correct,
      total: currentStageQuestions.length,
      percentage: scorePct
    };
    setTestScoreResult(result);
    setIsTestSubmitted(true);

    // Save module progress: marks test as attended and updates score & placement target
    const updatedStages = Array.from(new Set([...progress.completedStages, 5]));
    const updatedProgress: ModuleTrainingProgress = {
      ...progress,
      completedStages: updatedStages,
      testAttended: true,
      score: scorePct,
      placementTarget: 80,
      lastAttemptAt: new Date().toISOString()
    };
    storageService.saveModuleProgress(userId, updatedProgress);
    setProgress(updatedProgress);
  };

  // Retest trigger: Once 5 stages are completed, user can take a retest with DIFFERENT questions
  const handleStartRetest = (stageToStart: number = 1) => {
    const nextCycle = (progress.cycle || 0) + 1;
    const updatedProgress: ModuleTrainingProgress = {
      ...progress,
      cycle: nextCycle,
      // Keep stages unlocked so user can practice freely on retest
      completedStages: [1],
      testAttended: false,
      score: 0,
      placementTarget: 0
    };
    storageService.saveModuleProgress(userId, updatedProgress);
    setProgress(updatedProgress);

    setActiveStage(stageToStart);
    setStageQuestionIdx(0);
    setStageAnswers({});
    setShowExplanation(false);
    setIsTestStarted(stageToStart === 5);
    setIsTestSubmitted(false);
    setTestScoreResult(null);
    setRetestNotice(`Retest #${nextCycle} started! Fresh, different questions have been loaded for each stage.`);
  };

  // Formulas and reference tips for Stage 1
  const formulasByModule: Record<string, { formulas: string[]; tips: string[]; commonMistakes: string[] }> = {
    Percentages: {
      formulas: [
        'Percentage = (Part / Whole) × 100',
        'Percentage Change = (|New - Old| / Old) × 100',
        'If price increases by R%, consumption reduction = [R / (100 + R)] × 100%',
        'Successive Change formula = a + b + (ab / 100)%'
      ],
      tips: [
        'Convert fractions to decimals swiftly: 1/8 = 12.5%, 1/6 = 16.67%, 1/7 = 14.28%.',
        'Use base 100 for percentage price problems with unknown amounts.'
      ],
      commonMistakes: [
        'Confusing "increased by 20%" (120%) with "increased to 20%" (20%).',
        'Applying percentage increase and subsequent decrease to the same base.'
      ]
    },
    'Time and Work': {
      formulas: [
        'If A completes work in n days, 1-day work = 1/n',
        'Total Work = Efficiency × Time',
        'Wages are directly proportional to work done (or efficiency for equal time)',
        'Alternate days: calculate 2-day cycles using LCM of individual days'
      ],
      tips: [
        'Take LCM of all individual days as the Total Work units to avoid fractions.',
        'Negative work applies to emptying pipes or dismantling workers.'
      ],
      commonMistakes: [
        'Adding days directly (e.g. 10 days + 15 days != 25 days combined).',
        'Forgetting to adjust work units remaining when a worker leaves.'
      ]
    },
    'Profit, Loss and Discounts': {
      formulas: [
        'Profit = SP - CP (when SP > CP)',
        'Profit % = (Profit / CP) × 100',
        'Loss % = (Loss / CP) × 100',
        'SP = CP × (100 + P%) / 100',
        'Discount % = (Discount / Marked Price) × 100'
      ],
      tips: [
        'Profit and Loss % are always computed on CP unless explicitly stated.',
        'Discount is always calculated on Marked Price (MP).'
      ],
      commonMistakes: [
        'Calculating Profit % or Loss % on Selling Price instead of Cost Price.',
        'Applying successive discounts simply by adding them.'
      ]
    }
  };

  const moduleData = formulasByModule[selectedModule] || {
    formulas: [
      `Key definition and foundational relationship for ${selectedModule}`,
      'Speed calculation multiplier: simplify ratios before operations',
      'Benchmark proportionality rule: Target = (Part / Total) × 100%'
    ],
    tips: [
      'Eliminate extreme options immediately using parity and digit checks.',
      'Always verify units and benchmark values before submitting.'
    ],
    commonMistakes: [
      'Misreading question constraints (e.g. least vs greatest, not true).',
      'Rushing mental math on intermediate fractions.'
    ]
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>TARGETED TRAINING MODULE</span>
            {progress.cycle > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                Retest Set #{progress.cycle + 1}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {selectedModule} Master Training
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Current Score:{' '}
            <strong className={`font-mono ${progress.testAttended ? 'text-emerald-400' : 'text-slate-400'}`}>
              {progress.testAttended ? `${progress.score}%` : '0%'}
            </strong>{' '}
            · Placement Target:{' '}
            <strong className={`font-mono ${progress.testAttended ? 'text-emerald-400' : 'text-slate-400'}`}>
              {progress.testAttended ? `${progress.placementTarget}%+` : '0%'}
            </strong>
            <span className="text-[11px] text-slate-500 ml-2">
              {progress.testAttended
                ? '· (Updated from Target Training Test)'
                : '· (Zero until Target Training Test is attended)'}
            </span>
          </p>
        </div>

        {/* Quick Module Selector & Retest Button */}
        <div className="flex items-center gap-3">
          {progress.completedStages.includes(5) && (
            <button
              onClick={() => handleStartRetest(1)}
              className="px-3 py-2 rounded-lg bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Start a retest with different questions across all 5 stages"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retest with Different Questions</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Module:</span>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              {modules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Retest Banner Notification */}
      {retestNotice && (
        <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-indigo-300 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{retestNotice}</span>
          </div>
          <button
            onClick={() => setRetestNotice(null)}
            className="text-indigo-400 hover:text-white font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Locked Stage Notification Alert */}
      {lockedNotice && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-rose-300 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{lockedNotice}</span>
          </div>
          <button
            onClick={() => setLockedNotice(null)}
            className="text-rose-400 hover:text-white font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 5 Guided Stages Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {stages.map((st) => {
          const isCompleted = st.isCompleted;
          const isCurrent = activeStage === st.num;
          const isLocked = !st.isUnlocked;

          return (
            <div
              key={st.num}
              onClick={() => handleStageClick(st.num)}
              className={`p-3.5 rounded-xl border transition-all select-none ${
                isLocked
                  ? 'border-slate-800/60 bg-slate-950/40 text-slate-600 cursor-not-allowed opacity-60'
                  : isCurrent
                  ? 'border-indigo-500 bg-slate-900 ring-1 ring-indigo-500/50 shadow-md cursor-pointer'
                  : isCompleted
                  ? 'border-emerald-900/60 bg-emerald-950/20 hover:border-emerald-700 cursor-pointer'
                  : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:border-slate-700 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-mono font-bold text-slate-400">Stage {st.num}</span>
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {!isCompleted && isCurrent && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />}
                {isLocked && <Lock className="w-3.5 h-3.5 text-slate-600" />}
              </div>
              <h3 className={`text-xs font-semibold ${isLocked ? 'text-slate-500' : isCompleted ? 'text-slate-200' : 'text-slate-300'}`}>
                {st.title}
              </h3>
              <span className="text-[10px] text-slate-500 block mt-1">
                {st.num === 5 ? '5-Question Test' : '5 Typed Questions'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stage 1 to Stage 4: Interactive 5-Question Stage Drills */}
      {activeStage >= 1 && activeStage <= 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Stage Objective & Formula References (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {activeStage === 1 && (
              <>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Core Formulas & Placement Shortcuts</span>
                  </h2>
                  <div className="space-y-2 pt-1 font-mono text-xs">
                    {moduleData.formulas.map((f, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-indigo-300">
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4" />
                    <span>Placement Speed Tips</span>
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed list-disc list-inside">
                    {moduleData.tips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h3 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4" />
                    <span>Common Traps to Avoid</span>
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed list-disc list-inside">
                    {moduleData.commonMistakes.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {activeStage === 2 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <span>STAGE 2: FOUNDATION DRILL</span>
                </div>
                <h2 className="text-lg font-bold text-white">Basic Foundation Questions</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Stage 2 tests 5 fundamental single-step problems for {selectedModule}. Solve all 5 questions on the right to build speed and accuracy before advancing to intermediate placement drills.
                </p>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-300 block">Stage Benchmark:</span>
                  <p className="text-slate-400">5 Easy-level questions. Target speed: under 45s per question.</p>
                </div>
              </div>
            )}

            {activeStage === 3 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold">
                  <span>STAGE 3: PLACEMENT DRILL</span>
                </div>
                <h2 className="text-lg font-bold text-white">Intermediate Placement Drills</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Stage 3 presents 5 standard multi-step placement problems for {selectedModule}. These reflect typical campus recruitment aptitude test filters.
                </p>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-300 block">Stage Benchmark:</span>
                  <p className="text-slate-400">5 Medium-level questions. Target speed: under 65s per question.</p>
                </div>
              </div>
            )}

            {activeStage === 4 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                  <span>STAGE 4: ADVANCED SCENARIOS</span>
                </div>
                <h2 className="text-lg font-bold text-white">Advanced High-Difficulty Scenarios</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Stage 4 tests 5 complex scenario drills for {selectedModule}. Master these to unlock the final Stage 5 Target Training Mastery Test.
                </p>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-300 block">Stage Benchmark:</span>
                  <p className="text-slate-400">5 Hard-level questions. Target speed: under 85s per question.</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: 5 Questions of the Same Type for this Stage (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6 flex flex-col justify-between">
            {currentQ ? (
              <div className="space-y-4">
                {/* Stage Question Header & Pagination */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400">
                      Question {stageQuestionIdx + 1} of 5
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      · Stage {activeStage} {activeStage === 1 ? 'Concept' : currentQ.difficulty}
                    </span>
                  </div>

                  {/* 5-Question Quick Jump Circles */}
                  <div className="flex items-center gap-1.5">
                    {currentStageQuestions.map((_, i) => {
                      const isAnswered = stageAnswers[i] !== undefined;
                      const isCurrent = stageQuestionIdx === i;
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            setStageQuestionIdx(i);
                            setShowExplanation(stageAnswers[i] !== undefined);
                          }}
                          className={`w-6 h-6 rounded-full text-[10px] font-mono font-bold flex items-center justify-center transition-all ${
                            isCurrent
                              ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                              : isAnswered
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question Text */}
                <p className="text-sm font-medium text-slate-100 leading-relaxed">
                  {currentQ.question}
                </p>

                {/* 4 Interactive Options */}
                <div className="space-y-2 pt-1">
                  {currentQ.options.map((opt, i) => {
                    const isSelected = stageAnswers[stageQuestionIdx] === opt;
                    const isCorrect = opt === currentQ.correctAnswer;
                    const hasAnswered = stageAnswers[stageQuestionIdx] !== undefined;

                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectOption(opt)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs font-mono transition-all flex items-center justify-between ${
                          isSelected
                            ? isCorrect
                              ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-bold'
                              : 'border-rose-500 bg-rose-950/40 text-rose-300'
                            : hasAnswered && isCorrect
                            ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-400 font-semibold'
                            : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span>{opt}</span>
                        {isSelected && isCorrect && (
                          <span className="text-[10px] text-emerald-400 font-bold uppercase">Correct ✓</span>
                        )}
                        {isSelected && !isCorrect && (
                          <span className="text-[10px] text-rose-400 font-bold uppercase">Incorrect ✕</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Card */}
                {showExplanation && (
                  <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-xs text-slate-300 space-y-1 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <strong className="text-indigo-400 font-semibold">Solution Explanation:</strong>
                      <span className="text-emerald-400 font-mono font-bold">Answer: {currentQ.correctAnswer}</span>
                    </div>
                    <p className="leading-relaxed mt-1">{currentQ.explanation}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Loading questions for Stage {activeStage}...</p>
            )}

            {/* Bottom Controls: Previous / Next Question & Stage Unlocking */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  disabled={stageQuestionIdx === 0}
                  onClick={() => {
                    setStageQuestionIdx(prev => prev - 1);
                    setShowExplanation(stageAnswers[stageQuestionIdx - 1] !== undefined);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-slate-300 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev Question</span>
                </button>

                {stageQuestionIdx < 4 && (
                  <button
                    onClick={() => {
                      setStageQuestionIdx(prev => prev + 1);
                      setShowExplanation(stageAnswers[stageQuestionIdx + 1] !== undefined);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Complete Stage & Unlock Next Button */}
              <button
                onClick={() => handleCompleteStage(activeStage)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
              >
                <span>
                  {activeStage === 1
                    ? 'Complete Stage 1 & Unlock Stage 2'
                    : activeStage === 4
                    ? 'Complete Stage 4 & Unlock Mastery Test'
                    : `Complete Stage ${activeStage} & Unlock Stage ${activeStage + 1}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage 5 Content: Target Training Mastery Test (5 Questions) */}
      {activeStage === 5 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          {!isTestStarted && !isTestSubmitted ? (
            /* Test Briefing / Start View */
            <div className="max-w-2xl mx-auto text-center space-y-5 py-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
                <Award className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  Target Training Test: {selectedModule}
                </h2>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                  Attend this 5-question mastery test to benchmark your performance in {selectedModule}.
                  Before attending, your Current Score and Placement Target remain at 0%. Submitting this test will establish your verified module score and activate your 80%+ placement target.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-center py-2">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Questions</span>
                  <span className="text-base font-bold font-mono text-white">5</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Benchmark</span>
                  <span className="text-base font-bold font-mono text-emerald-400">80%+</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Time</span>
                  <span className="text-base font-bold font-mono text-indigo-400">5 Mins</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsTestStarted(true);
                    setStageQuestionIdx(0);
                    setStageAnswers({});
                  }}
                  className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all inline-flex items-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  <span>Attend Target Training Test</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : isTestStarted && !isTestSubmitted ? (
            /* Active Test In Progress (5 Questions) */
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-400">
                    Question {stageQuestionIdx + 1} of 5
                  </span>
                  <span className="text-xs text-slate-500">· {selectedModule} Mastery Test</span>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Answered: {Object.keys(stageAnswers).length}/5
                </div>
              </div>

              {currentQ && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-100 leading-relaxed">
                    {currentQ.question}
                  </p>

                  <div className="space-y-2 pt-2">
                    {currentQ.options.map((opt, i) => {
                      const isSelected = stageAnswers[stageQuestionIdx] === opt;
                      return (
                        <button
                          key={i}
                          onClick={() => setStageAnswers(prev => ({ ...prev, [stageQuestionIdx]: opt }))}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs font-mono transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-950/40 text-white font-bold ring-1 ring-indigo-500'
                              : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span>{opt}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  disabled={stageQuestionIdx === 0}
                  onClick={() => setStageQuestionIdx(prev => prev - 1)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-slate-300 flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {stageQuestionIdx < 4 ? (
                  <button
                    onClick={() => setStageQuestionIdx(prev => prev + 1)}
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitTest}
                    className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
                  >
                    <span>Submit Target Training Test</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Test Submitted Result View */
            <div className="space-y-6 max-w-2xl mx-auto text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <Award className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Test Completed & Calibrated
                </span>
                <h2 className="text-2xl font-bold text-white">
                  Target Training Test Result
                </h2>
                <div className="flex items-center justify-center gap-4 pt-2">
                  <div className="text-4xl font-black font-mono text-emerald-400">
                    {testScoreResult?.percentage}%
                  </div>
                  <div className="text-left text-xs text-slate-400 font-mono">
                    <div>Score: {testScoreResult?.score} / {testScoreResult?.total}</div>
                    <div className={testScoreResult && testScoreResult.percentage >= 80 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                      {testScoreResult && testScoreResult.percentage >= 80 ? '✓ Placement Target Met (80%+)' : 'Needs Practice (< 80%)'}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 max-w-lg mx-auto bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                Your Current Score has been updated to <strong>{testScoreResult?.percentage}%</strong> and your Placement Target is now calibrated at <strong>80%+</strong>.
              </p>

              {/* Action Buttons: Retest with Different Questions or Retake Test */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => handleStartRetest(5)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold flex items-center gap-2"
                  title="Retake Stage 5 test with 5 different questions"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake Test (Different Questions)</span>
                </button>

                <button
                  onClick={() => handleStartRetest(1)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2"
                  title="Retake all 5 stages from Stage 1 with completely different questions"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake All 5 Stages (Fresh Questions)</span>
                </button>

                <button
                  onClick={onGoToAssessment}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <span>Take Full Diagnostic Assessment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
