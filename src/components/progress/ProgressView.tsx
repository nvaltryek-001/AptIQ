import React from 'react';
import { AssessmentAttempt } from '../../types/assessment.ts';
import {
  TrendingUp,
  Award,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  BarChart2,
  Calendar
} from 'lucide-react';

interface ProgressViewProps {
  attempts: AssessmentAttempt[];
  onTakeTest: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ attempts, onTakeTest }) => {
  const hasAttempts = attempts.length > 0;
  const latestAttempt = attempts[0];
  const firstAttempt = attempts[attempts.length - 1];
  const totalTests = attempts.length;
  const latestScore = latestAttempt?.percentage ?? 0;
  const firstScore = firstAttempt?.percentage ?? 0;
  const totalGrowth = latestScore - firstScore;

  // Topics from latest attempt
  const sortedTopics = latestAttempt?.topicBreakdown ? [...latestAttempt.topicBreakdown].sort((a, b) => b.percentage - a.percentage) : [];
  const bestTopic = sortedTopics[0];
  const weakestTopic = sortedTopics.length > 0 ? sortedTopics[sortedTopics.length - 1] : null;

  // Comparative topic growth if at least 2 attempts exist
  const topicDeltas = (attempts.length >= 2 && firstAttempt && latestAttempt)
    ? latestAttempt.topicBreakdown
        .map(latestT => {
          const firstT = firstAttempt.topicBreakdown.find(f => f.module === latestT.module);
          if (!firstT) return null;
          return {
            mod: latestT.module,
            sec: latestT.section,
            before: firstT.percentage,
            after: latestT.percentage,
            diff: latestT.percentage - firstT.percentage
          };
        })
        .filter((d): d is NonNullable<typeof d> => d !== null)
    : [];

  const mostImprovedTopic = [...topicDeltas].sort((a, b) => b.diff - a.diff)[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>LEARNING ANALYTICS & IMPROVEMENT TRACKER</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Aptitude Growth & Trajectory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tracking score improvements across Quantitative, Logical Reasoning, and Verbal Ability.
          </p>
        </div>

        <button
          onClick={onTakeTest}
          className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shrink-0 shadow-sm"
        >
          <Target className="w-4 h-4" />
          <span>{hasAttempts ? 'Launch Reassessment' : 'Start First Diagnostic'}</span>
        </button>
      </div>

      {!hasAttempts ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
            <BarChart2 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-bold text-white">No Growth Data Yet</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete your initial diagnostic test to start tracking your aptitude growth, speed improvements, and topic mastery trajectory.
            </p>
          </div>
          <button
            onClick={onTakeTest}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all inline-flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <Target className="w-4 h-4" />
            <span>Take Diagnostic Assessment</span>
          </button>
        </div>
      ) : (
        <>
          {/* Highlights: Best Topic, Weakest Topic, Most Improved */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
              <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider block">
                Best Performing Topic
              </span>
              <div className="text-xl font-bold text-white">{bestTopic ? bestTopic.module : '--'}</div>
              <p className="text-xs text-slate-400 font-mono">
                {bestTopic ? `${bestTopic.percentage}% Accuracy · Avg Time ${bestTopic.averageTime || 45}s` : 'Take test to evaluate'}
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
              <span className="text-xs text-rose-400 font-semibold uppercase tracking-wider block">
                Current Weakest Topic
              </span>
              <div className="text-xl font-bold text-white">{weakestTopic ? weakestTopic.module : '--'}</div>
              <p className="text-xs text-slate-400 font-mono">
                {weakestTopic ? `${weakestTopic.percentage}% Accuracy · Needs Training` : 'Take test to evaluate'}
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
              <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider block">
                Most Improved Topic
              </span>
              <div className="text-xl font-bold text-white">
                {mostImprovedTopic ? mostImprovedTopic.mod : (totalTests === 1 ? 'Baseline Set' : '--')}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {mostImprovedTopic
                  ? `${mostImprovedTopic.before}% → ${mostImprovedTopic.after}% (+${mostImprovedTopic.diff}%)`
                  : totalTests === 1
                  ? 'Complete retest after training'
                  : 'Pending multiple tests'}
              </p>
            </div>
          </div>

          {/* Growth Comparison Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                <span>Before vs After Topic Mastery Delta</span>
              </h2>
              {topicDeltas.length > 0 && (
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {totalGrowth >= 0 ? `+${totalGrowth}%` : `${totalGrowth}%`} Overall Delta
                </span>
              )}
            </div>

            {topicDeltas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-semibold">Aptitude Module</th>
                      <th className="pb-3 font-semibold">Section</th>
                      <th className="pb-3 font-semibold">Initial Diagnostic</th>
                      <th className="pb-3 font-semibold">Latest Test</th>
                      <th className="pb-3 font-semibold text-right">Net Improvement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {topicDeltas.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-900/40">
                        <td className="py-3 font-sans font-medium text-slate-200">{row.mod}</td>
                        <td className="py-3 text-slate-400 font-sans">{row.sec}</td>
                        <td className="py-3 text-slate-400">{row.before}%</td>
                        <td className="py-3 font-bold text-white">{row.after}%</td>
                        <td className={`py-3 text-right font-bold ${row.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {row.diff >= 0 ? `+${row.diff}%` : `${row.diff}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800/80 text-center space-y-2">
                <span className="text-xs font-semibold text-indigo-300 block">Baseline Assessment Recorded</span>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                  You have completed 1 diagnostic assessment. Practice recommended training modules and take a reassessment to compare your Before vs After mastery metrics.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
