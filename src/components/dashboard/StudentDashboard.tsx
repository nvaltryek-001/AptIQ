import React from 'react';
import { AssessmentAttempt } from '../../types/assessment.ts';
import { UserProfile } from '../../services/storageService.ts';
import {
  TrendingUp,
  Target,
  Clock,
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
  const hasAttempts = attempts.length > 0;
  const latestAttempt = attempts[0];
  const previousAttempt = attempts[1];

  // Global calculations derived strictly from the active user's attempts
  const totalQuestionsAttempted = attempts.reduce((acc, a) => acc + (a.correctCount + a.wrongCount), 0);
  const totalCorrect = attempts.reduce((acc, a) => acc + a.correctCount, 0);
  const overallAccuracy = totalQuestionsAttempted > 0 ? Math.round((totalCorrect / totalQuestionsAttempted) * 100) : 0;

  const overallScore = latestAttempt ? latestAttempt.percentage : null;
  const quantScore = latestAttempt?.sectionBreakdown.find(s => s.section === 'Quantitative Aptitude')?.percentage ?? null;
  const logicScore = latestAttempt?.sectionBreakdown.find(s => s.section === 'Logical Reasoning')?.percentage ?? null;
  const verbalScore = latestAttempt?.sectionBreakdown.find(s => s.section === 'Verbal Ability')?.percentage ?? null;

  // Improvement comparison
  const improvement = previousAttempt && latestAttempt ? latestAttempt.percentage - previousAttempt.percentage : null;

  // Focus areas derived strictly from latest attempt
  const focusAreas = latestAttempt?.topicBreakdown?.slice(0, 5) || [];

  // Real topic comparison between previous and latest attempt
  const topicDeltas = (latestAttempt && previousAttempt)
    ? latestAttempt.topicBreakdown
        .map(latestTopic => {
          const prevTopic = previousAttempt.topicBreakdown.find(p => p.module === latestTopic.module);
          if (!prevTopic) return null;
          return {
            module: latestTopic.module,
            before: prevTopic.percentage,
            after: latestTopic.percentage,
            diff: latestTopic.percentage - prevTopic.percentage
          };
        })
        .filter((d): d is NonNullable<typeof d> => d !== null)
        .slice(0, 3)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/40 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>CAMPUS RECRUITMENT 2026 READINESS TRACK</span>
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {hasAttempts ? `Welcome back, ${user.name}` : `Welcome, ${user.name}`}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
            {user.college} · {user.branch} · Target: {user.targetCompany || 'Tier-1 Engineering Roles'}
            {!hasAttempts && ' · Complete your initial diagnostic assessment to calibrate your aptitude profile.'}
          </p>
        </div>

        <button
          onClick={onStartDiagnostic}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0 group"
        >
          <Target className="w-4 h-4 text-indigo-200" />
          <span>{hasAttempts ? 'Take New Diagnostic Test' : 'Start First Diagnostic Test'}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Core Aptitude Score Cards (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Aptitude Score */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Aptitude Score</span>
            {hasAttempts ? (
              <span className={`text-[11px] font-semibold ${improvement !== null && improvement >= 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {improvement !== null ? `${improvement >= 0 ? '+' : ''}${improvement}% vs Previous` : 'Initial Baseline'}
              </span>
            ) : (
              <span className="text-[11px] font-mono text-slate-500">Not Attempted</span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black font-mono text-white tracking-tight">
              {hasAttempts ? `${overallScore}%` : '--'}
            </span>
            <span className="text-xs text-slate-500">Benchmark: 75%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${overallScore ?? 0}%` }} />
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
              {hasAttempts && quantScore !== null ? `${quantScore}%` : '--'}
            </span>
            <span className="text-xs text-slate-500">
              {hasAttempts && latestAttempt?.averageTimePerQuestion ? `Speed: ~${latestAttempt.averageTimePerQuestion}s/Q` : 'Pending test'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${quantScore ?? 0}%` }} />
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
              {hasAttempts && logicScore !== null ? `${logicScore}%` : '--'}
            </span>
            <span className="text-xs text-slate-500">
              {hasAttempts && latestAttempt?.averageTimePerQuestion ? `Speed: ~${latestAttempt.averageTimePerQuestion}s/Q` : 'Pending test'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${logicScore ?? 0}%` }} />
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
              {hasAttempts && verbalScore !== null ? `${verbalScore}%` : '--'}
            </span>
            <span className="text-xs text-slate-500">
              {hasAttempts && latestAttempt?.averageTimePerQuestion ? `Speed: ~${latestAttempt.averageTimePerQuestion}s/Q` : 'Pending test'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${verbalScore ?? 0}%` }} />
          </div>
        </div>
      </div>

      {/* Additional Stats: Questions Attempted, Accuracy, Avg Time, Weak Topics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Questions Attempted</span>
          <div className="text-xl font-bold font-mono text-white">
            {totalQuestionsAttempted} <span className="text-xs text-slate-500 font-sans">solved</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Average Accuracy</span>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {hasAttempts ? `${overallAccuracy}%` : '--'}
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Avg Time / Question</span>
          <div className="text-xl font-bold font-mono text-white">
            {hasAttempts && latestAttempt?.averageTimePerQuestion ? `${latestAttempt.averageTimePerQuestion}s` : '--'}
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

          {hasAttempts && focusAreas.length > 0 ? (
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
          ) : (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No Diagnostic Data Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Complete your first diagnostic assessment to analyze your topic-level mastery and unlock personalized recommendations.
                </p>
              </div>
              <button
                onClick={onStartDiagnostic}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Start Diagnostic Assessment</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: AptIQ Before vs After Improvement Visualizer (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Improvement Delta</span>
              </h2>
              {topicDeltas.length > 0 && (
                <span className="text-xs font-semibold text-emerald-400 font-mono">
                  Active Growth Tracker
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Real measured impact after targeted training module completion.
            </p>

            {topicDeltas.length > 0 ? (
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800 text-[11px]">
                  <span>TOPIC</span>
                  <span>BEFORE → AFTER</span>
                  <span>GROWTH</span>
                </div>

                {topicDeltas.map((delta, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-medium text-slate-200">{delta.module}</span>
                    <span className="font-mono text-slate-400">
                      {delta.before}% → <strong className="text-white">{delta.after}%</strong>
                    </span>
                    <span className={`font-mono font-bold ${delta.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {delta.diff >= 0 ? `+${delta.diff}%` : `${delta.diff}%`}
                    </span>
                  </div>
                ))}
              </div>
            ) : hasAttempts ? (
              <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800/80 text-center space-y-2">
                <span className="text-xs font-semibold text-indigo-300 block">Baseline Test Completed</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You have completed 1 assessment. Take another test after targeted training to measure your Before vs After improvement delta!
                </p>
              </div>
            ) : (
              <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800/80 text-center space-y-2">
                <span className="text-xs font-semibold text-slate-400 block">Awaiting First Assessment</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Take your baseline diagnostic test. As you practice and retake assessments, your progress delta across topics will automatically appear here.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {hasAttempts ? 'Next Recommended Test:' : 'Get Started:'}
            </span>
            <button
              onClick={onStartDiagnostic}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>{hasAttempts ? 'Retake 30Q Diagnostic' : 'Take 30Q Diagnostic'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Assessment Attempts Table */}
      {hasAttempts ? (
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
      ) : (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-white">No Assessment History Yet</h3>
            <p className="text-xs text-slate-400">
              You haven't taken any assessments yet. Choose a diagnostic blueprint to test your aptitude and generate your initial placement readiness report.
            </p>
          </div>
          <button
            onClick={onStartDiagnostic}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all inline-flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <Target className="w-4 h-4" />
            <span>Take First Diagnostic Test</span>
          </button>
        </div>
      )}
    </div>
  );
};
