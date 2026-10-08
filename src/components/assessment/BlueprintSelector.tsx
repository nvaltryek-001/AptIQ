import React, { useState } from 'react';
import { ASSESSMENT_BLUEPRINTS, AssessmentSize } from '../../types/assessment.ts';
import { Clock, CheckCircle2, Zap, Award, Target, BookOpen, ChevronRight, BarChart3 } from 'lucide-react';

interface BlueprintSelectorProps {
  onSelectBlueprint: (size: AssessmentSize) => void;
  onCancel?: () => void;
}

export const BlueprintSelector: React.FC<BlueprintSelectorProps> = ({ onSelectBlueprint, onCancel }) => {
  const [selectedSize, setSelectedSize] = useState<AssessmentSize>(30);

  const blueprintSizes: AssessmentSize[] = [30, 60, 90, 120];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header section */}
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
          <Target className="w-3.5 h-3.5" />
          <span>DIAGNOSTIC TEST CONFIGURATION</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Select Your Assessment Blueprint
        </h1>
        <p className="text-sm text-slate-400">
          AptIQ balances questions equally across Quantitative Aptitude, Logical Reasoning, and Verbal Ability to diagnose topic-level strengths and weaknesses.
        </p>
      </div>

      {/* Blueprint Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {blueprintSizes.map((size) => {
          const bp = ASSESSMENT_BLUEPRINTS[size];
          const isSelected = selectedSize === size;

          return (
            <div
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`relative cursor-pointer rounded-xl border p-5 transition-all duration-200 text-left ${
                isSelected
                  ? 'border-indigo-500 bg-slate-900/90 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {/* Header badge */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white font-mono">{size}</span>
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Questions</span>
                  </div>
                  <h3 className="text-base font-semibold text-white mt-1">{bp.title}</h3>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'border-slate-700 bg-slate-800/50 text-transparent'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                {bp.description}
              </p>

              {/* Time and Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Duration: <strong className="font-mono text-white">{bp.durationMinutes} mins</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Speed: <strong className="font-mono text-white">~60s / question</strong></span>
                </div>
              </div>

              {/* Section allocation */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800/60">
                <span>Quant: <strong className="text-indigo-300 font-mono">{bp.sections.quantitative}Q</strong></span>
                <span className="text-slate-600">·</span>
                <span>Logical: <strong className="text-violet-300 font-mono">{bp.sections.logical}Q</strong></span>
                <span className="text-slate-600">·</span>
                <span>Verbal: <strong className="text-teal-300 font-mono">{bp.sections.verbal}Q</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Test instructions & launch bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-slate-200">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Real-time Scoring & Weak-Topic Detection Enabled</span>
          </div>
          <p className="text-xs text-slate-400">
            Once started, the timer initiates automatically. You can navigate, review questions, and submit anytime.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => onSelectBlueprint(selectedSize)}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Start {selectedSize}-Question Diagnostic</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
