import React, { useState, useMemo } from 'react';
import { AptitudeQuestion, QuestionStatus, StudentAnswer } from '../../types/assessment.ts';
import {
  Bookmark,
  CheckCircle2,
  HelpCircle,
  Hash,
  Filter,
  Layers,
  ChevronRight,
  Eye,
  Info
} from 'lucide-react';

interface AssessmentPaletteProps {
  questions: AptitudeQuestion[];
  currentIndex: number;
  answers: Record<string, StudentAnswer>;
  onSelectQuestion: (index: number) => void;
}

export const AssessmentPalette: React.FC<AssessmentPaletteProps> = ({
  questions,
  currentIndex,
  answers,
  onSelectQuestion
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'answered' | 'unanswered' | 'marked'>('all');
  const [sectionFilter, setSectionFilter] = useState<'all' | 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability'>('all');
  const [jumpInput, setJumpInput] = useState<string>('');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compute question status
  const getStatus = (q: AptitudeQuestion): QuestionStatus => {
    const ans = answers[q.id];
    const hasSelected = ans && ans.selectedOption !== null && ans.selectedOption !== '';
    const isMarked = ans && ans.isMarkedForReview;

    if (hasSelected && isMarked) return 'marked-answered';
    if (hasSelected) return 'answered';
    if (isMarked) return 'marked';
    return 'unanswered';
  };

  // Status metrics & tallies
  const tallies = useMemo(() => {
    return questions.reduce(
      (acc, q) => {
        const status = getStatus(q);
        if (status === 'answered') {
          acc.answered++;
        } else if (status === 'marked') {
          acc.marked++;
          acc.unanswered++;
        } else if (status === 'marked-answered') {
          acc.answered++;
          acc.marked++;
        } else {
          acc.unanswered++;
        }
        return acc;
      },
      { answered: 0, unanswered: 0, marked: 0 }
    );
  }, [questions, answers]);

  // Handle direct number jump
  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const qNum = parseInt(jumpInput.trim(), 10);
    if (!isNaN(qNum) && qNum >= 1 && qNum <= questions.length) {
      onSelectQuestion(qNum - 1);
      setJumpInput('');
    }
  };

  const previewQuestion = hoveredIndex !== null ? questions[hoveredIndex] : questions[currentIndex];

  return (
    <div
      role="navigation"
      aria-label="Question Navigation Palette"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col h-full shadow-lg"
    >
      {/* Palette Title and Current Location */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Question Palette
          </h2>
        </div>
        <span className="text-xs font-mono font-semibold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60">
          Q {currentIndex + 1} of {questions.length}
        </span>
      </div>

      {/* Status-based Legend (Answered, Unanswered, Marked for Review, Current) */}
      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 mb-3.5">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-md bg-emerald-500 flex items-center justify-center text-[8px] text-white font-bold shrink-0 shadow-sm shadow-emerald-500/20">
            ✓
          </span>
          <span>
            Answered: <strong className="font-mono text-white">{tallies.answered}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-md bg-slate-800 border border-slate-750 shrink-0" />
          <span>
            Unanswered: <strong className="font-mono text-white">{tallies.unanswered}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-md bg-amber-500 flex items-center justify-center text-[8px] text-white font-bold shrink-0 shadow-sm shadow-amber-500/20">
            ★
          </span>
          <span>
            Marked Review: <strong className="font-mono text-white">{tallies.marked}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-md border-2 border-indigo-400 bg-indigo-500/30 shrink-0 animate-pulse" />
          <span>
            Current Focus
          </span>
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-500" />
            <span>Filter Section:</span>
          </span>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-[11px] rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Sections ({questions.length})</option>
            <option value="Quantitative Aptitude">Quant Aptitude</option>
            <option value="Logical Reasoning">Logical Reasoning</option>
            <option value="Verbal Ability">Verbal Ability</option>
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-[11px]">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 py-1 rounded-lg transition-all text-center font-medium ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('answered')}
            className={`flex-1 py-1 rounded-lg transition-all text-center font-medium ${
              statusFilter === 'answered'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ans ({tallies.answered})
          </button>
          <button
            onClick={() => setStatusFilter('unanswered')}
            className={`flex-1 py-1 rounded-lg transition-all text-center font-medium ${
              statusFilter === 'unanswered'
                ? 'bg-slate-800 text-slate-200 border border-slate-700 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unans
          </button>
          <button
            onClick={() => setStatusFilter('marked')}
            className={`flex-1 py-1 rounded-lg transition-all text-center font-medium ${
              statusFilter === 'marked'
                ? 'bg-amber-950 text-amber-300 border border-amber-800/80 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Review ({tallies.marked})
          </button>
        </div>
      </div>

      {/* Grid of Question Number Buttons */}
      <div
        className="flex-1 overflow-y-auto max-h-[340px] pr-1.5 grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 content-start py-1"
        tabIndex={0}
        aria-label="Questions Grid"
      >
        {questions.map((q, idx) => {
          const status = getStatus(q);
          const isCurrent = idx === currentIndex;

          // Section filter
          if (sectionFilter !== 'all' && q.section !== sectionFilter) return null;

          // Status filter
          if (statusFilter === 'answered' && status !== 'answered' && status !== 'marked-answered') return null;
          if (statusFilter === 'unanswered' && (status === 'answered' || status === 'marked-answered')) return null;
          if (statusFilter === 'marked' && status !== 'marked' && status !== 'marked-answered') return null;

          // Distinct status badge styling
          let markerStyle = 'bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600';
          let statusText = 'Unanswered';

          if (status === 'answered') {
            markerStyle = 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-sm shadow-emerald-600/20';
            statusText = 'Answered';
          } else if (status === 'marked') {
            markerStyle = 'bg-amber-600 text-white border-amber-500 font-bold shadow-sm shadow-amber-600/20';
            statusText = 'Marked for Review';
          } else if (status === 'marked-answered') {
            markerStyle = 'bg-violet-600 text-white border-violet-500 font-bold shadow-sm ring-1 ring-amber-400';
            statusText = 'Answered & Marked for Review';
          }

          if (isCurrent) {
            markerStyle += ' ring-2 ring-indigo-400 scale-105 shadow-md shadow-indigo-500/30';
          }

          return (
            <button
              key={q.id}
              onClick={() => onSelectQuestion(idx)}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Question ${idx + 1}, ${statusText}, ${q.section}, ${q.module}`}
              className={`relative h-9 rounded-lg border text-xs transition-all flex items-center justify-center font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 ${markerStyle}`}
              title={`Q${idx + 1}: ${q.module} (${statusText})`}
            >
              <span>{idx + 1}</span>

              {/* Status badges */}
              {(status === 'marked' || status === 'marked-answered') && (
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-900"
                  aria-hidden="true"
                />
              )}
              {status === 'answered' && (
                <span
                  className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-300"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Hover / Current Question Snapshot Card */}
      {previewQuestion && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
          <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 mb-0.5">
            <span className="text-indigo-400 font-bold font-mono">
              Q{(hoveredIndex !== null ? hoveredIndex : currentIndex) + 1} SNAPSHOT
            </span>
            <span className="uppercase text-slate-400">{previewQuestion.difficulty}</span>
          </div>
          <p className="text-slate-200 font-medium truncate">
            {previewQuestion.module} · {previewQuestion.topic}
          </p>
        </div>
      )}

      {/* Immediate Direct Jump Input Form */}
      <form onSubmit={handleJump} className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2">
        <div className="relative flex-1">
          <Hash className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
          <input
            type="number"
            min={1}
            max={questions.length}
            placeholder={`Go to Q# (1-${questions.length})`}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0 transition-colors flex items-center gap-1 shadow-sm"
        >
          <span>Jump</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
