import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RotateCcw,
  Flame,
  ArrowRight,
  HelpCircle,
  Award,
  AlertTriangle,
  Clock,
  Target
} from 'lucide-react';
import { UserProfile } from '../../services/storageService.ts';
import {
  adaptivePracticeService,
  ClientQuestion,
  AdaptiveFeedback,
  AdaptiveUserState
} from '../../services/adaptivePracticeService.ts';

interface AdaptivePracticeViewProps {
  user?: UserProfile | null;
}

export const AdaptivePracticeView: React.FC<AdaptivePracticeViewProps> = ({ user }) => {
  const userId = user?.id || 'guest';

  const [selectedModule, setSelectedModule] = useState<string>('All Topics (Adaptive)');
  const [currentQ, setCurrentQ] = useState<ClientQuestion | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Question interaction state
  const [userSelection, setUserSelection] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<AdaptiveFeedback | null>(null);
  const [servedWeakTopic, setServedWeakTopic] = useState<string | null>(null);

  // Adaptive user state
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveUserState>(() =>
    adaptivePracticeService.getUserState(userId)
  );

  // Time tracking
  const startTimeRef = useRef<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Available modules list for targeted or all-round adaptive practice
  const moduleOptions = [
    'All Topics (Adaptive)',
    'Percentages',
    'Time and Work',
    'Profit, Loss and Discounts',
    'Time, Speed and Distance',
    'Number System',
    'Simple and Compound Interest',
    'Ratios, Proportions and Variations',
    'Probability',
    'Seating Arrangement',
    'Blood Relations',
    'Direction Sense Test',
    'Series',
    'Coding and Decoding',
    'Articles and Prepositions',
    'Tenses and Subject-Verb Agreement'
  ];

  // Load next question
  const loadNextQuestion = async (moduleFilter?: string) => {
    setLoading(true);
    setUserSelection(null);
    setIsSubmitted(false);
    setFeedback(null);
    startTimeRef.current = Date.now();
    setElapsedSeconds(0);

    try {
      const activeFilter = moduleFilter !== undefined ? moduleFilter : selectedModule;
      const res = await adaptivePracticeService.getNextQuestion(userId, activeFilter);
      setCurrentQ(res.question);
      setAdaptiveState(res.adaptiveState);
      setServedWeakTopic(res.servedWeakTopic);
    } catch (e) {
      console.error('Failed to load next adaptive question', e);
    } finally {
      setLoading(false);
    }
  };

  // Reload question when user changes or module changes
  useEffect(() => {
    const freshState = adaptivePracticeService.getUserState(userId);
    setAdaptiveState(freshState);
    loadNextQuestion(selectedModule);
  }, [userId, selectedModule]);

  // Timer tick for current question
  useEffect(() => {
    if (isSubmitted || loading) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, loading]);

  // Handle option selection: immediately attends question, evaluates, and gives answer
  const handleSelectOption = async (opt: string) => {
    if (isSubmitted || isSubmitting || !currentQ) return;

    setUserSelection(opt);
    setIsSubmitting(true);
    const timeSpent = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

    try {
      const res = await adaptivePracticeService.submitAnswer(
        userId,
        currentQ.id,
        opt,
        timeSpent
      );
      setFeedback(res);
      setIsSubmitted(true);

      // Update local state indicators
      setAdaptiveState(prev => ({
        ...prev,
        difficulty: res.nextDifficulty,
        streak: res.streak,
        consecutiveCorrect: res.consecutiveCorrect,
        consecutiveWrong: res.consecutiveWrong,
        totalSolved: res.totalSolved,
        totalCorrect: res.totalCorrect
      }));
    } catch (e) {
      console.error('Failed to submit adaptive answer', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load next question only when clicking Next button
  const handleNextQuestion = () => {
    loadNextQuestion(selectedModule);
  };

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header & Adaptive Stat Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>AI ADAPTIVE PRACTICE ENGINE</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Dynamic Placement Drills
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time adaptive engine: Answer correctly to make the next question harder; answer wrong to make it easier.
          </p>
        </div>

        {/* Adaptive KPIs */}
        <div className="flex items-center gap-4 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 shrink-0 text-xs">
          <div className="text-center">
            <span className="text-[10px] text-slate-500 block">Question Level</span>
            <span
              className={`font-mono font-bold ${
                (currentQ?.difficulty || adaptiveState.difficulty) === 'Easy'
                  ? 'text-emerald-400'
                  : (currentQ?.difficulty || adaptiveState.difficulty) === 'Medium'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {currentQ?.difficulty || adaptiveState.difficulty}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          <div className="text-center">
            <span className="text-[10px] text-slate-500 block">Streak</span>
            <span className="font-mono font-bold text-amber-400 flex items-center justify-center gap-0.5">
              <Flame className="w-3.5 h-3.5" />
              <span>{adaptiveState.streak}</span>
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          <div className="text-center">
            <span className="text-[10px] text-slate-500 block">Solved</span>
            <span className="font-mono font-bold text-white">
              {adaptiveState.totalCorrect}/{adaptiveState.totalSolved}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          <div className="text-center">
            <span className="text-[10px] text-slate-500 block">Time</span>
            <span className="font-mono text-slate-300 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{elapsedSeconds}s</span>
            </span>
          </div>
        </div>
      </div>

      {/* Module Selector & Weak Topic Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Practice Topic:</span>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            disabled={isSubmitted || isSubmitting}
            className="bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            {moduleOptions.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {servedWeakTopic && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Targeting identified weak area: <strong>{servedWeakTopic}</strong></span>
          </div>
        )}
      </div>

      {/* Main Question Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading next adaptive question...</p>
          </div>
        ) : currentQ ? (
          <>
            {/* Question Header */}
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-white font-semibold">{currentQ.module}</span>
                <span>·</span>
                <span>{currentQ.topic}</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  currentQ.difficulty === 'Easy'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : currentQ.difficulty === 'Medium'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}
              >
                {currentQ.difficulty}
              </span>
            </div>

            {/* Question Text */}
            <p className="text-base md:text-lg font-medium text-slate-100 leading-relaxed whitespace-pre-line">
              {currentQ.question}
            </p>

            {/* Post-submit Feedback Banner */}
            {isSubmitted && feedback && (
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in ${
                  feedback.isCorrect
                    ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-600/50 text-rose-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {feedback.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block text-sm font-bold">
                      {feedback.isCorrect ? 'Correct! Excellent problem-solving.' : 'Incorrect answer.'}
                    </strong>
                    {!feedback.isCorrect && (
                      <span className="text-slate-300 mt-0.5 block">
                        Correct answer: <strong className="text-white font-mono">{feedback.correctAnswer}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Adaptive Calibration Indicator */}
                <div className="sm:text-right shrink-0">
                  {feedback.isCorrect ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-xs border border-emerald-500/30">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Next Question: Harder ({feedback.nextDifficulty})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-xs border border-amber-500/30">
                      <Target className="w-3.5 h-3.5" />
                      Next Question: Easier ({feedback.nextDifficulty})
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="space-y-3">
              {currentQ.options.map((opt, i) => {
                const isSelected = userSelection === opt;
                const hasSubmitted = isSubmitted && feedback !== null;
                const isCorrectAnswer = hasSubmitted && opt.trim() === feedback.correctAnswer.trim();
                const isWrongSelection = hasSubmitted && isSelected && !feedback.isCorrect;

                let optionStyle = 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-indigo-500 hover:bg-slate-900';
                let letterStyle = 'bg-slate-800 text-slate-400 border-slate-700';

                if (hasSubmitted) {
                  if (isCorrectAnswer) {
                    optionStyle = 'border-emerald-500 bg-emerald-950/50 text-emerald-200 font-semibold ring-1 ring-emerald-500';
                    letterStyle = 'bg-emerald-600 text-white border-emerald-400';
                  } else if (isWrongSelection) {
                    optionStyle = 'border-rose-500 bg-rose-950/50 text-rose-300 ring-1 ring-rose-500 line-through';
                    letterStyle = 'bg-rose-600 text-white border-rose-400';
                  } else {
                    optionStyle = 'border-slate-800/60 bg-slate-950/20 text-slate-500 opacity-60';
                    letterStyle = 'bg-slate-900 text-slate-600 border-slate-800';
                  }
                } else if (isSelected) {
                  optionStyle = 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500';
                  letterStyle = 'bg-indigo-600 text-white border-indigo-400';
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelectOption(opt)}
                    disabled={isSubmitted || isSubmitting}
                    className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-center justify-between gap-3 ${optionStyle} ${
                      isSubmitted || isSubmitting ? 'cursor-default' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg border text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${letterStyle}`}>
                        {optionLetters[i] || (i + 1)}
                      </span>
                      <span>{opt}</span>
                    </div>

                    {/* Option Status Indicators */}
                    {hasSubmitted && isCorrectAnswer && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 uppercase shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Correct</span>
                      </span>
                    )}
                    {hasSubmitted && isWrongSelection && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 uppercase shrink-0">
                        <XCircle className="w-4 h-4" />
                        <span>Your Choice</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Diagnostic Solution Explanation (Only after attending/submitting) */}
            {isSubmitted && feedback && (
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-xs text-slate-300 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                  <HelpCircle className="w-4 h-4" />
                  <span>Diagnostic Solution & Shortcut:</span>
                </div>
                <p className="leading-relaxed whitespace-pre-line text-slate-300">
                  {feedback.explanation}
                </p>
              </div>
            )}

            {/* Bottom Actions: Status & Next Question Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
              <div className="text-xs text-slate-400 font-mono">
                {!isSubmitted ? (
                  <span className="text-indigo-400">
                    Select an option above to answer and verify
                  </span>
                ) : (
                  <span>
                    Answer submitted · Next question: <strong className="text-white">{feedback?.nextDifficulty}</strong> difficulty
                  </span>
                )}
              </div>

              {isSubmitted && (
                <button
                  onClick={handleNextQuestion}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <span>Next Question ({feedback?.nextDifficulty})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="py-12 text-center space-y-3">
            <p className="text-xs text-slate-400">No question available for this category.</p>
            <button
              onClick={() => loadNextQuestion('All Topics (Adaptive)')}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
            >
              Reset to All Topics
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
