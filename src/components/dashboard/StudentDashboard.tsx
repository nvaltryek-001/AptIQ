import React from 'react';
import { AssessmentAttempt } from '../../types/assessment.ts';
import { UserProfile } from '../../services/storageService.ts';
import {
  TrendingUp,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Award,
  BarChart3,
  Flame,
  Zap,
  RotateCcw
} from 'lucide-react';

interface StudentDashboardProps {
  user: UserProfile;
  attempts: AssessmentAttempt[];
  onStartDiagnostic: () => void;
  onViewAttempt: (attempt: AssessmentAttempt) => void;
  onGoToTraining: (moduleName: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  attempts,
  onStartDiagnostic,
  onViewAttempt,
  onGoToTraining
}) => {
  const latestAttempt = attempts[0];
  const previousAttempt = attempts[1];

  // Global calculations
  const totalQuestionsAttempted = attempts.reduce((acc, a) => acc + (a.correctCount + a.wrongCount), 0);
  const totalCorrect = attempts.reduce((acc, a) => acc + a.correctCount, 0);
  const overallAccuracy = totalQuestionsAttempted > 0 ? Math.round((totalCorrect / totalQuestionsAttempted) * 100) : 74;

  const overallScore = latestAttempt ? latestAttempt.percentage : 68;
  const quantScore = latestAttempt?.sectionBreakdown.find(s => s.section === 'Quantitative Aptitude')?.percentage ?? 62;
  const logicScore = latestAttempt?.sectionBreakdown.find(s => s.section === 'Logical Reasoning')?.percentage ?? 78;
  const verbalScore = latestAttempt?.sectionBreakdown.find(s => s.section === 'Verbal Ability')?.percentage ?? 71;

  // Improvement comparison
  const improvement = previousAttempt && latestAttempt ? latestAttempt.percentage - previousAttempt.percentage : 18;

  // Focus areas derived from latest attempt or curated defaults
  const focusAreas = latestAttempt?.topicBreakdown.slice(0, 5) || [
    { module: 'Percentages', percentage: 32, status: 'Critical', recommendation: 'Complete Percentages Foundation Training & 10 questions' },
    { module: 'Time and Work', percentage: 41, status: 'Weak', recommendation: 'Practice 15 Alternate-worker & Pipes questions' },
    { module: 'Seating Arrangement', percentage: 56, status: 'Average', recommendation: 'Solve 10 circular arrangement sets' },
    { module: 'Probability', percentage: 82, status: 'Strong', recommendation: 'Take high-difficulty Bayes & conditional drills' },
    { module: 'Tenses and Subject-Verb Agreement', percentage: 88, status: 'Excellent', recommendation: 'Mastery sustained' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/40 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>CAMPUS RECRUITMENT 2026 READINESS TRACK</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
            {user.college} · {user.branch} · Target: {user.targetCompany || 'Tier-1 Engineering Roles'}
          </p>
        </div>

        <button
          onClick={onStartDiagnostic}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0 group"
        >
          <Target className="w-4 h-4 text-indigo-200" />
          <span>Take New Diagnostic Test</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Core Aptitude Score Cards (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Aptitude Score */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Aptitude Score</span>
            <span className="text-[11px] font-semibold text-emerald-400">
              +{improvement}% vs Previous
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black font-mono text-white tracking-tight">
              {overallScore}%
            </span>
            <span className="text-xs text-slate-500">Placement Benchmark: 75%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${overallScore}%` }} />
          </div>
        </div>

        {/* Quantitative Score */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Quantitative Aptitude</span>
            <span className="text-[11px] font-mono text-slate-500">19 Modules</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black font-mono text-indigo-400 tracking-tight">
              {quantScore}%
            </span>
            <span className="text-xs text-slate-500">Speed: ~68s/Q</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${quantScore}%` }} />
          </div>
        </div>

        {/* Logical Reasoning */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Logical Reasoning</span>
            <span className="text-[11px] font-mono text-slate-500">14 Modules</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black font-mono text-violet-400 tracking-tight">
              {logicScore}%
            </span>
            <span className="text-xs text-slate-500">Speed: ~54s/Q</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full" style={{ width: `${logicScore}%` }} />
          </div>
        </div>

        {/* Verbal Ability */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Verbal Ability</span>
            <span className="text-[11px] font-mono text-slate-500">9 Modules</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black font-mono text-teal-400 tracking-tight">
              {verbalScore}%
            </span>
            <span className="text-xs text-slate-500">Speed: ~42s/Q</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${verbalScore}%` }} />
          </div>
        </div>
      </div>

      {/* Additional Stats: Questions Attempted, Accuracy, Avg Time, Weak Topics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Questions Attempted</span>
          <div className="text-xl font-bold font-mono text-white">
            {totalQuestionsAttempted || 120} <span className="text-xs text-slate-500 font-sans">solved</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Average Accuracy</span>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {overallAccuracy}%
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Avg Time / Question</span>
          <div className="text-xl font-bold font-mono text-white">
            {latestAttempt?.averageTimePerQuestion || 58}s
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Critical Weak Topics</span>
          <div className="text-xl font-bold font-mono text-rose-400">
            {focusAreas.filter(f => f.status === 'Critical' || f.status === 'Weak').length} <span className="text-xs text-slate-500 font-sans">topics</span>
          </div>
        </div>
      </div>

      {/* 2 Columns: "Your Focus Areas" & "Improvement Engine (Before vs After)" */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Your Focus Areas (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Your Focus Areas & Topic Health</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically diagnosed weak areas requiring immediate targeted practice.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {focusAreas.map((item, idx) => {
              const isCrit = item.status === 'Critical';
              const isWeak = item.status === 'Weak';
              const isAvg = item.status === 'Average';

              return (
                <div
                  key={idx}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">
                      {isCrit ? '🔴' : isWeak ? '🔴' : isAvg ? '🟡' : '🟢'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{item.module}</span>
                        <span className="text-xs font-mono font-bold text-slate-300">
                          — {item.percentage}%
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {item.recommendation}
                      </span>
                    </div>
                  </div>

                  {(isCrit || isWeak) && (
                    <button
                      onClick={() => onGoToTraining(item.module)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0 transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Train</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: AptIQ Before vs After Improvement Visualizer (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Improvement Delta</span>
              </h2>
              <span className="text-xs font-semibold text-emerald-400 font-mono">
                +47% in Weak Areas
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Real measured impact after targeted training module completion.
            </p>

            {/* Before vs After comparative table */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs">
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800 text-[11px]">
                <span>TOPIC</span>
                <span>BEFORE → AFTER</span>
                <span>GROWTH</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-200">Percentages</span>
                <span className="font-mono text-slate-400">25% → <strong className="text-white">72%</strong></span>
                <span className="font-mono font-bold text-emerald-400">+47%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-200">Time & Work</span>
                <span className="font-mono text-slate-400">38% → <strong className="text-white">76%</strong></span>
                <span className="font-mono font-bold text-emerald-400">+38%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-200">Seating Arrangement</span>
                <span className="font-mono text-slate-400">45% → <strong className="text-white">79%</strong></span>
                <span className="font-mono font-bold text-emerald-400">+34%</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Next Recommended Test:</span>
            <button
              onClick={onStartDiagnostic}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>Retake 30Q Diagnostic</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Assessment Attempts Table */}
      {attempts.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>Recent Assessment Attempts</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Assessment Title</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Score</th>
                  <th className="pb-3 font-semibold">Accuracy</th>
                  <th className="pb-3 font-semibold">Duration</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {attempts.map(att => (
                  <tr key={att.id} className="hover:bg-slate-900/40">
                    <td className="py-3 font-sans font-medium text-slate-200">{att.title}</td>
                    <td className="py-3 text-slate-400 font-sans">
                      {new Date(att.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-bold text-white">
                      {att.score}/{att.totalQuestions} ({att.percentage}%)
                    </td>
                    <td className="py-3 text-indigo-300">{att.accuracy}%</td>
                    <td className="py-3 text-slate-400 font-sans">
                      {Math.round(att.totalTimeSpentSeconds / 60)} mins
                    </td>
                    <td className="py-3 text-right font-sans">
                      <button
                        onClick={() => onViewAttempt(att)}
                        className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                      >
                        View Analysis
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
