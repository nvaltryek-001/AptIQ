import React, { useState } from 'react';
import { AptitudeQuestion } from '../../types/assessment.ts';
import { assessmentEngine } from '../../services/assessmentEngine.ts';
import {
  Zap,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RotateCcw,
  Flame,
  ArrowRight,
  HelpCircle,
  Award
} from 'lucide-react';

export const AdaptivePracticeView: React.FC = () => {
  const allQuestions = assessmentEngine.getAllQuestions();

  const [currentDiff, setCurrentDiff] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [selectedModule, setSelectedModule] = useState<string>('Percentages');
  const [streak, setStreak] = useState<number>(0);
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [userSelection, setUserSelection] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);

  // Filter candidate questions by module and adaptive difficulty
  const candidates = allQuestions.filter(
    q => q.module === selectedModule && q.difficulty === currentDiff
  );
  const fallbackCandidates = allQuestions.filter(q => q.module === selectedModule);

  const activePool = candidates.length > 0 ? candidates : fallbackCandidates;
  const currentQ: AptitudeQuestion = activePool[questionsAnswered % activePool.length] || allQuestions[0];

  const handleSelectOption = (opt: string) => {
    if (isAnswerChecked) return;
    setUserSelection(opt);
  };

  const handleCheckAnswer = () => {
    if (!userSelection || isAnswerChecked) return;
    setIsAnswerChecked(true);
    setQuestionsAnswered(prev => prev + 1);

    const isCorrect = userSelection === currentQ.correctAnswer;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setStreak(prev => prev + 1);
      // Adaptive difficulty ramp up
      if (currentDiff === 'Easy') setCurrentDiff('Medium');
      else if (currentDiff === 'Medium' && streak >= 2) setCurrentDiff('Hard');
    } else {
      setStreak(0);
      // Adaptive difficulty step down to reinforce basics
      if (currentDiff === 'Hard') setCurrentDiff('Medium');
      else if (currentDiff === 'Medium') setCurrentDiff('Easy');
    }
  };

  const handleNext = () => {
    setUserSelection(null);
    setIsAnswerChecked(false);
  };

  const isCorrect = userSelection === currentQ.correctAnswer;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header & Adaptive Stat Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>ADAPTIVE PRACTICE ENGINE</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Dynamic Placement Drills
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Difficulty shifts dynamically based on your accuracy streak.
          </p>
        </div>

        {/* Adaptive KPIs */}
        <div className="flex items-center gap-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800 shrink-0 text-xs">
          <div className="text-center">
            <span className="text-[10px] text-slate-500 block">Current Level</span>
            <span
              className={`font-mono font-bold ${
                currentDiff === 'Easy'
                  ? 'text-emerald-400'
                  : currentDiff === 'Medium'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {currentDiff}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          <div className="text-center">
            <span className="text-[10px] text-slate-500 block">Streak</span>
            <span className="font-mono font-bold text-amber-400 flex items-center justify-center gap-0.5">
              <Flame className="w-3.5 h-3.5" />
              <span>{streak}</span>
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          <div className="text-center">
            <span className="text-[10px] text-slate-500 block">Solved</span>
            <span className="font-mono font-bold text-white">
              {correctCount}/{questionsAnswered}
            </span>
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-white font-semibold">{currentQ.module}</span>
            <span>·</span>
            <span>{currentQ.topic}</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
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

        {/* Options */}
        <div className="space-y-3">
          {currentQ.options.map((opt, i) => {
            const isSelected = userSelection === opt;
            const isCorrectOption = opt === currentQ.correctAnswer;

            let style = 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700';

            if (isAnswerChecked) {
              if (isCorrectOption) {
                style = 'border-emerald-500 bg-emerald-950/40 text-emerald-200 font-semibold ring-1 ring-emerald-500';
              } else if (isSelected && !isCorrectOption) {
                style = 'border-rose-500 bg-rose-950/40 text-rose-300 ring-1 ring-rose-500 line-through';
              }
            } else if (isSelected) {
              style = 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500';
            }

            return (
              <button
                key={i}
                onClick={() => handleSelectOption(opt)}
                disabled={isAnswerChecked}
                className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-center justify-between ${style}`}
              >
                <span>{opt}</span>
                {isAnswerChecked && isCorrectOption && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                {isAnswerChecked && isSelected && !isCorrectOption && (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Solution Explanation if checked */}
        {isAnswerChecked && (
          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-xs text-slate-300 space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-bold text-indigo-400">
              <HelpCircle className="w-4 h-4" />
              <span>Diagnostic Explanation:</span>
            </div>
            <p className="leading-relaxed whitespace-pre-line text-slate-300">
              {currentQ.explanation}
            </p>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
          <span className="text-xs text-slate-500 font-mono">
            {streak > 1 ? `🔥 ${streak} streak multiplier active` : 'Adaptive difficulty active'}
          </span>

          {!isAnswerChecked ? (
            <button
              onClick={handleCheckAnswer}
              disabled={!userSelection}
              className={`px-6 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                userSelection
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Verify Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span>Next Adaptive Question</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
