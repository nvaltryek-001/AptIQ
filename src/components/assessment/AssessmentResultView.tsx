import React, { useState } from 'react';
import { AssessmentAttempt, AptitudeQuestion } from '../../types/assessment.ts';
import { assessmentEngine } from '../../services/assessmentEngine.ts';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Target,
  ChevronDown,
  ChevronUp,
  Filter,
  BarChart3
} from 'lucide-react';

interface AssessmentResultViewProps {
  attempt: AssessmentAttempt;
  onRetake: () => void;
  onGoToTraining: (moduleName: string) => void;
  onGoToDashboard: () => void;
}

export const AssessmentResultView: React.FC<AssessmentResultViewProps> = ({
  attempt,
  onRetake,
  onGoToTraining,
  onGoToDashboard
}) => {
  const [questionFilter, setQuestionFilter] = useState<'all' | 'wrong' | 'correct' | 'unanswered'>('all');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Retrieve questions used in this attempt
  const questions: AptitudeQuestion[] = attempt.questionIds
    .map(id => assessmentEngine.getQuestionById(id))
    .filter((q): q is AptitudeQuestion => q !== undefined);

  // Filter weak topics
  const criticalTopics = attempt.topicBreakdown.filter(t => t.status === 'Critical');
  const weakTopics = attempt.topicBreakdown.filter(t => t.status === 'Weak');
  const strongTopics = attempt.topicBreakdown.filter(t => t.status === 'Strong' || t.status === 'Excellent');

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s}s`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner / Assessment Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>DIAGNOSTIC ASSESSMENT COMPLETED</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {attempt.title}
          </h1>
          <p className="text-xs text-slate-400">
            Completed on {new Date(attempt.submittedAt).toLocaleDateString()} at{' '}
            {new Date(attempt.submittedAt).toLocaleTimeString()}
          </p>
        </div>

        {/* Global Score Metric Circle / Card */}
        <div className="flex items-center gap-6 z-10">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black font-mono text-white tracking-tight">
              {attempt.percentage}%
            </div>
            <span className="text-xs text-slate-400 font-medium">Overall Score</span>
          </div>

          <div className="h-12 w-px bg-slate-800" />

          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black font-mono text-indigo-400 tracking-tight">
              {attempt.accuracy}%
            </div>
            <span className="text-xs text-slate-400 font-medium">Accuracy</span>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards (4 columns) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Score</span>
          <div className="text-2xl font-bold font-mono text-white">
            {attempt.score} <span className="text-xs text-slate-500 font-sans">/ {attempt.totalQuestions}</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Total marks (+1 per correct)</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Correct / Wrong</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {attempt.correctCount} <span className="text-slate-600">/</span> <span className="text-rose-400">{attempt.wrongCount}</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block font-mono">{attempt.unansweredCount} Unanswered</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Total Time Used</span>
          <div className="text-2xl font-bold font-mono text-white">
            {formatSeconds(attempt.totalTimeSpentSeconds)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Full assessment duration</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Avg Time / Question</span>
          <div className="text-2xl font-bold font-mono text-white">
            {attempt.averageTimePerQuestion}s
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Target: ~60s/question</span>
        </div>
      </div>

      {/* Section Performance Comparison */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span>Section Performance Breakdown</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {attempt.sectionBreakdown.map(sec => (
            <div
              key={sec.section}
              className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">{sec.section}</span>
                <span className="text-sm font-bold font-mono text-white">{sec.percentage}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    sec.percentage >= 70
                      ? 'bg-emerald-500'
                      : sec.percentage >= 45
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${sec.percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                <span>Score: <strong className="text-slate-200 font-mono">{sec.score}/{sec.total}</strong></span>
                <span>Accuracy: <strong className="text-slate-200 font-mono">{sec.accuracy}%</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WEAKNESS ANALYSIS ENGINE: Most Critical Product Differentiator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>AptIQ Diagnostic Weakness Engine</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Identified critical gaps where targeted training will yield the largest placement score jump.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {criticalTopics.length + weakTopics.length} Focus Areas Detected
          </span>
        </div>

        {/* Weak Topics List */}
        <div className="space-y-3 pt-2">
          {attempt.topicBreakdown.map((topic, idx) => {
            const isCritical = topic.status === 'Critical';
            const isWeak = topic.status === 'Weak';
            const badgeColor = isCritical
              ? 'bg-rose-950 text-rose-300 border-rose-800'
              : isWeak
              ? 'bg-amber-950 text-amber-300 border-amber-800'
              : 'bg-emerald-950 text-emerald-300 border-emerald-800';

            return (
              <div
                key={idx}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${badgeColor}`}>
                      {topic.status}
                    </span>
                    <h3 className="text-sm font-semibold text-white">{topic.module}</h3>
                    <span className="text-xs text-slate-500">· {topic.section}</span>
                  </div>
                  <p className="text-xs text-indigo-300 flex items-center gap-1 font-medium">
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Recommended Action: {topic.recommendation}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-mono font-bold text-white">
                      {topic.score} / {topic.total} ({topic.percentage}%)
                    </div>
                    <span className="text-[11px] text-slate-400">Accuracy: {topic.accuracy}%</span>
                  </div>

                  {(isCritical || isWeak) && (
                    <button
                      onClick={() => onGoToTraining(topic.module)}
                      className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Start Training</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Question by Question Detailed Review */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Question-by-Question Solution Review</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review every problem with complete step-by-step mathematical & logical explanations.
            </p>
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {(['all', 'wrong', 'correct', 'unanswered'] as const).map(f => (
              <button
                key={f}
                onClick={() => setQuestionFilter(f)}
                className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                  questionFilter === f
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Question Review Cards */}
        <div className="space-y-3 pt-2">
          {questions.map((q, idx) => {
            const studentAns = attempt.answers[q.id];
            const hasAnswered = studentAns && studentAns.selectedOption !== null && studentAns.selectedOption !== '';
            const isCorrect = hasAnswered && studentAns.selectedOption === q.correctAnswer;
            const isWrong = hasAnswered && !isCorrect;
            const isUnanswered = !hasAnswered;

            if (questionFilter === 'wrong' && !isWrong) return null;
            if (questionFilter === 'correct' && !isCorrect) return null;
            if (questionFilter === 'unanswered' && !isUnanswered) return null;

            const isExpanded = expandedQuestionId === q.id;

            return (
              <div
                key={q.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 transition-all"
              >
                <div
                  onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                  className="flex items-start justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-slate-400">Q{idx + 1}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-300">{q.module}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-500 text-[11px]">{q.topic}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-200 line-clamp-2">
                      {q.question}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {isCorrect && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Correct</span>
                      </span>
                    )}
                    {isWrong && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Wrong</span>
                      </span>
                    )}
                    {isUnanswered && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Unanswered</span>
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4 text-xs animate-in fade-in duration-150">
                    {/* Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isStudentPick = studentAns?.selectedOption === opt;
                        const isCorrectOpt = opt === q.correctAnswer;

                        let optStyle = 'border-slate-800 bg-slate-900/40 text-slate-400';
                        if (isCorrectOpt) {
                          optStyle = 'border-emerald-600 bg-emerald-950/40 text-emerald-300 font-semibold';
                        } else if (isStudentPick && !isCorrectOpt) {
                          optStyle = 'border-rose-600 bg-rose-950/40 text-rose-300 line-through';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${optStyle}`}
                          >
                            <span>{opt}</span>
                            {isCorrectOpt && (
                              <span className="text-[10px] text-emerald-400 font-bold">CORRECT</span>
                            )}
                            {isStudentPick && !isCorrectOpt && (
                              <span className="text-[10px] text-rose-400 font-bold">YOUR PICK</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Step by Step Explanation */}
                    <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800/80">
                      <strong className="text-indigo-400 block mb-1">Step-by-Step Explanation:</strong>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <button
          onClick={onGoToDashboard}
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
        >
          View Student Dashboard
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onRetake}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Assessment</span>
          </button>
          <button
            onClick={() => onGoToTraining(criticalTopics[0]?.module || 'Percentages')}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Train Weak Topics Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
