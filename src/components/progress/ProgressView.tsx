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
  const totalTests = attempts.length;
  const latestScore = attempts[0]?.percentage || 72;
  const firstScore = attempts[attempts.length - 1]?.percentage || 38;
  const totalGrowth = latestScore - firstScore;

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
          <span>Launch Reassessment</span>
        </button>
      </div>

      {/* Highlights: Best Topic, Weakest Topic, Most Improved */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
          <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider block">
            Best Performing Topic
          </span>
          <div className="text-xl font-bold text-white">Probability</div>
          <p className="text-xs text-slate-400 font-mono">86% Accuracy · Average Time 48s</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
          <span className="text-xs text-rose-400 font-semibold uppercase tracking-wider block">
            Current Weakest Topic
          </span>
          <div className="text-xl font-bold text-white">Percentages</div>
          <p className="text-xs text-slate-400 font-mono">31% Accuracy · Average Time 82s</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
          <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider block">
            Most Improved Topic
          </span>
          <div className="text-xl font-bold text-white">Time and Work</div>
          <p className="text-xs text-slate-400 font-mono">38% → 76% (+38 percentage points)</p>
        </div>
      </div>

      {/* Growth Comparison Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <span>Before vs After Topic Mastery Delta</span>
          </h2>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            Average Gain: +39.7%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Aptitude Module</th>
                <th className="pb-3 font-semibold">Section</th>
                <th className="pb-3 font-semibold">Initial Diagnostic</th>
                <th className="pb-3 font-semibold">Post-Training Test</th>
                <th className="pb-3 font-semibold text-right">Net Improvement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {[
                { mod: 'Percentages', sec: 'Quantitative Aptitude', before: 25, after: 72, diff: 47 },
                { mod: 'Time and Work', sec: 'Quantitative Aptitude', before: 38, after: 76, diff: 38 },
                { mod: 'Seating Arrangement', sec: 'Logical Reasoning', before: 45, after: 79, diff: 34 },
                { mod: 'Direction Sense Test', sec: 'Logical Reasoning', before: 50, after: 90, diff: 40 },
                { mod: 'Subject-Verb Agreement', sec: 'Verbal Ability', before: 55, after: 88, diff: 33 },
                { mod: 'Profit, Loss and Discounts', sec: 'Quantitative Aptitude', before: 40, after: 85, diff: 45 }
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-900/40">
                  <td className="py-3 font-sans font-medium text-slate-200">{row.mod}</td>
                  <td className="py-3 text-slate-400 font-sans">{row.sec}</td>
                  <td className="py-3 text-slate-400">{row.before}%</td>
                  <td className="py-3 font-bold text-white">{row.after}%</td>
                  <td className="py-3 text-right font-bold text-emerald-400">+{row.diff}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
