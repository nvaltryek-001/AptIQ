import React, { useState, useEffect, useRef } from 'react';
import {
  AptitudeQuestion,
  AssessmentSize,
  ASSESSMENT_BLUEPRINTS,
  StudentAnswer,
  AssessmentAttempt
} from '../../types/assessment.ts';
import { AssessmentPalette } from './AssessmentPalette.tsx';
import { storageService, InProgressSession } from '../../services/storageService.ts';
import { assessmentEngine } from '../../services/assessmentEngine.ts';
import { useAssessmentTimer } from '../../hooks/useAssessmentTimer.ts';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  HelpCircle,
  BarChart2,
  ShieldAlert,
  X
} from 'lucide-react';

interface AssessmentViewProps {
  size: AssessmentSize;
  onFinish: (attempt: AssessmentAttempt) => void;
  onExit: () => void;
}

export const AssessmentView: React.FC<AssessmentViewProps> = ({ size, onFinish, onExit }) => {
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({});
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [showMobilePalette, setShowMobilePalette] = useState<boolean>(false);

  const startTimeRef = useRef<number>(Date.now());
  const questionStartTimeRef = useRef<number>(Date.now());
  const handleFinalSubmitRef = useRef<(isAuto?: boolean) => void>(() => {});

  const initialDurationSec = (ASSESSMENT_BLUEPRINTS[size]?.durationMinutes || 30) * 60;

  // Custom persistent timer hook tracking duration, persisting across reloads, and auto-submitting at zero
  const {
    remainingSeconds,
    elapsedSeconds,
    isWarning,
    isUrgent,
    formattedTime,
    clearPersistedTimer
  } = useAssessmentTimer({
    assessmentId: `diag_${size}`,
    initialDurationSeconds: initialDurationSec,
    onTimeExpired: () => {
      handleFinalSubmitRef.current(true);
    },
    storageType: 'localStorage'
  });

  // Initialize or restore assessment
  useEffect(() => {
    const existingSession = storageService.getCurrentSession();

    if (existingSession && existingSession.blueprintSize === size && existingSession.questionIds.length > 0) {
      // Restore active session
      const loadedQuestions = existingSession.questionIds
        .map(id => assessmentEngine.getQuestionById(id))
        .filter((q): q is AptitudeQuestion => q !== undefined);

      if (loadedQuestions.length === existingSession.questionIds.length) {
        setQuestions(loadedQuestions);
        setAnswers(existingSession.answers || {});
        setCurrentIndex(existingSession.currentQuestionIndex || 0);
        startTimeRef.current = existingSession.startedAt;
        return;
      }
    }

    // Otherwise generate fresh balanced assessment
    const { questions: freshQuestions, blueprint } = assessmentEngine.generateAssessment(size);
    const durationSec = blueprint.durationMinutes * 60;

    setQuestions(freshQuestions);
    setCurrentIndex(0);
    setAnswers({});
    startTimeRef.current = Date.now();

    const newSession: InProgressSession = {
      assessmentId: `session_${Date.now()}`,
      blueprintSize: size,
      startedAt: startTimeRef.current,
      durationSeconds: durationSec,
      remainingSeconds: durationSec,
      questionIds: freshQuestions.map(q => q.id),
      currentQuestionIndex: 0,
      answers: {}
    };
    storageService.saveCurrentSession(newSession);
  }, [size]);

  // Persist session to local storage periodically
  useEffect(() => {
    if (questions.length === 0) return;

    const session: InProgressSession = {
      assessmentId: `session_${startTimeRef.current}`,
      blueprintSize: size,
      startedAt: startTimeRef.current,
      durationSeconds: (ASSESSMENT_BLUEPRINTS[size]?.durationMinutes || 30) * 60,
      remainingSeconds,
      questionIds: questions.map(q => q.id),
      currentQuestionIndex: currentIndex,
      answers
    };
    storageService.saveCurrentSession(session);
  }, [answers, currentIndex, remainingSeconds, questions]);

  // Update time spent on question before switching
  const recordQuestionTime = () => {
    if (!questions[currentIndex]) return;
    const currentQId = questions[currentIndex].id;
    const timeSpent = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));

    setAnswers(prev => {
      const existing = prev[currentQId] || {
        questionId: currentQId,
        selectedOption: null,
        isMarkedForReview: false,
        timeSpentSeconds: 0
      };
      return {
        ...prev,
        [currentQId]: {
          ...existing,
          timeSpentSeconds: existing.timeSpentSeconds + timeSpent
        }
      };
    });
    questionStartTimeRef.current = Date.now();
  };

  // Switch questions
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      recordQuestionTime();
      setCurrentIndex(index);
    }
  };

  // Select an option
  const handleSelectOption = (option: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    setAnswers(prev => {
      const existing = prev[currentQ.id] || {
        questionId: currentQ.id,
        selectedOption: null,
        isMarkedForReview: false,
        timeSpentSeconds: 0
      };

      return {
        ...prev,
        [currentQ.id]: {
          ...existing,
          selectedOption: option
        }
      };
    });
  };

  // Clear answer
  const handleClearAnswer = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    setAnswers(prev => {
      const existing = prev[currentQ.id];
      if (!existing) return prev;
      return {
        ...prev,
        [currentQ.id]: {
          ...existing,
          selectedOption: null
        }
      };
    });
  };

  // Toggle mark for review
  const handleToggleReview = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    setAnswers(prev => {
      const existing = prev[currentQ.id] || {
        questionId: currentQ.id,
        selectedOption: null,
        isMarkedForReview: false,
        timeSpentSeconds: 0
      };
      return {
        ...prev,
        [currentQ.id]: {
          ...existing,
          isMarkedForReview: !existing.isMarkedForReview
        }
      };
    });
  };

  // Submit assessment
  const handleFinalSubmit = (isAuto: boolean = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    clearPersistedTimer();
    recordQuestionTime();

    const user = storageService.getUser();
    const totalTimeSpent = Math.max(
      1,
      elapsedSeconds || Math.round((Date.now() - startTimeRef.current) / 1000)
    );

    const attempt = assessmentEngine.scoreAssessment(
      user.id,
      size,
      startTimeRef.current,
      totalTimeSpent,
      answers,
      questions.map(q => q.id)
    );

    storageService.saveAttempt(attempt);
    storageService.clearCurrentSession();
    onFinish(attempt);
  };
  handleFinalSubmitRef.current = handleFinalSubmit;

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Diagnostic Assessment...</span>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentAnswer = answers[currentQ.id];
  const selectedOption = currentAnswer?.selectedOption || null;
  const isMarked = currentAnswer?.isMarkedForReview || false;

  const totalAnswered = Object.values(answers).filter(a => a.selectedOption !== null && a.selectedOption !== '').length;
  const totalMarked = Object.values(answers).filter(a => a.isMarkedForReview).length;
  const progressPercent = Math.round((totalAnswered / questions.length) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Test Title */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
              AptIQ
            </span>
            <span className="hidden sm:inline-block text-slate-600">/</span>
            <span className="hidden sm:inline-block text-xs font-medium text-slate-400">
              {ASSESSMENT_BLUEPRINTS[size]?.title || 'Diagnostic Assessment'}
            </span>
          </div>

          {/* Center Progress Bar */}
          <div className="hidden md:flex flex-col items-center gap-1 w-64">
            <div className="flex items-center justify-between w-full text-[11px] text-slate-400">
              <span>Progress: <strong className="font-mono text-white">{totalAnswered}</strong>/{questions.length}</span>
              <span className="font-mono">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Right Action / Timer, Mobile Palette, and Submit */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Palette Toggle Button */}
            <button
              onClick={() => setShowMobilePalette(true)}
              className="lg:hidden px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-200 flex items-center gap-1.5 hover:bg-slate-750 transition-colors"
              title="Open Question Palette"
            >
              <span className="font-mono text-indigo-400">Q{currentIndex + 1}</span>
              <span className="text-[11px] text-slate-400">Palette</span>
            </button>

            {/* Timer Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                isUrgent
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                  : isWarning
                  ? 'bg-amber-950/70 border-amber-500 text-amber-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-200'
              }`}
            >
              <Clock className={`w-4 h-4 ${isUrgent ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-indigo-400'}`} />
              <span>{formattedTime}</span>
            </div>

            {/* Submit Test CTA */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-3.5 sm:px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Test</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Question Card (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 md:p-6">
            {/* Question Header & Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="font-mono font-bold text-indigo-400 text-sm">
                  Q{currentIndex + 1}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-300">{currentQ.section}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">{currentQ.module}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px] font-mono">{currentQ.topic}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                    currentQ.difficulty === 'Easy'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                      : currentQ.difficulty === 'Medium'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                      : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                  }`}
                >
                  {currentQ.difficulty}
                </span>
              </div>
            </div>

            {/* Question Text */}
            <div className="text-base md:text-lg font-medium text-slate-100 leading-relaxed mb-6 whitespace-pre-line">
              {currentQ.question}
            </div>

            {/* Options List */}
            <div className="space-y-3 mb-6">
              {currentQ.options.map((opt, optIdx) => {
                const optLetter = String.fromCharCode(65 + optIdx); // A, B, C, D
                const isSelected = selectedOption === opt;

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 border transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      {optLetter}
                    </span>
                    <span className="text-sm font-normal pt-0.5 leading-relaxed break-words flex-1">
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Question Action Bar: Clear Answer & Mark for Review */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs">
              <button
                onClick={handleToggleReview}
                className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 font-medium ${
                  isMarked
                    ? 'bg-amber-950 text-amber-300 border-amber-700'
                    : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isMarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>{isMarked ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>

              {selectedOption && (
                <button
                  onClick={handleClearAnswer}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Answer</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={() => goToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
              className={`px-4 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                currentIndex === 0
                  ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-slate-500 font-mono">
              Question {currentIndex + 1} of {questions.length}
            </span>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => goToQuestion(currentIndex + 1)}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Review & Submit</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Question Navigation Palette (Desktop docked, 4 cols) */}
        <div className="hidden lg:block lg:col-span-4">
          <AssessmentPalette
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            onSelectQuestion={goToQuestion}
          />
        </div>
      </main>

      {/* Mobile Overlay Drawer for Question Navigation Palette */}
      {showMobilePalette && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4 lg:hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <span className="text-sm font-bold text-white">Question Navigator</span>
              <button
                onClick={() => setShowMobilePalette(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close question palette"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto">
              <AssessmentPalette
                questions={questions}
                currentIndex={currentIndex}
                answers={answers}
                onSelectQuestion={(idx) => {
                  goToQuestion(idx);
                  setShowMobilePalette(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <ShieldAlert className="w-5 h-5 text-indigo-400" />
                <span>Confirm Test Submission</span>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to submit your diagnostic assessment? Once submitted, your performance will be calculated and analyzed across all 42 aptitude modules.
            </p>

            {/* Summary Grid */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-center text-xs">
              <div>
                <span className="block text-[11px] text-slate-500 mb-0.5">Answered</span>
                <span className="text-lg font-bold font-mono text-emerald-400">{totalAnswered}</span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-500 mb-0.5">Unanswered</span>
                <span className="text-lg font-bold font-mono text-slate-400">{questions.length - totalAnswered}</span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-500 mb-0.5">For Review</span>
                <span className="text-lg font-bold font-mono text-amber-400">{totalMarked}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Time Remaining:</span>
              <span className="font-mono font-bold text-white">{formattedTime}</span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
              >
                Return to Test
              </button>
              <button
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                {isSubmitting ? (
                  <span>Analyzing...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit & Diagnose</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
