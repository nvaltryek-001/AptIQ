import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Lightbulb,
  AlertOctagon,
  Target,
  Zap,
  RotateCcw
} from 'lucide-react';

interface TrainingModuleViewProps {
  initialModule?: string;
  onGoToAssessment: () => void;
}

export const TrainingModuleView: React.FC<TrainingModuleViewProps> = ({
  initialModule = 'Percentages',
  onGoToAssessment
}) => {
  const [selectedModule, setSelectedModule] = useState<string>(initialModule);
  const [activeStage, setActiveStage] = useState<number>(1);
  const [practiceAnswer, setPracticeAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const modules = [
    'Percentages',
    'Time and Work',
    'Profit, Loss and Discounts',
    'Seating Arrangement',
    'Blood Relations',
    'Probability',
    'Tenses and Subject-Verb Agreement',
    'Articles and Prepositions',
    'Time, Speed and Distance'
  ];

  const stages = [
    { num: 1, title: 'Concept & Formulas', status: 'completed' },
    { num: 2, title: 'Basic Foundation Questions', status: 'completed' },
    { num: 3, title: 'Intermediate Placement Drills', status: 'current' },
    { num: 4, title: 'Advanced High-Difficulty Scenarios', status: 'locked' },
    { num: 5, title: 'Mastery Test (Threshold 80%+)', status: 'locked' }
  ];

  const formulasByModule: Record<string, { formulas: string[]; tips: string[]; commonMistakes: string[] }> = {
    Percentages: {
      formulas: [
        'Percentage = (Part / Whole) × 100',
        'Percentage Change = (|New - Old| / Old) × 100',
        'If price increases by R%, consumption reduction = [R / (100 + R)] × 100%',
        'Successive Change formula = a + b + (ab / 100)%'
      ],
      tips: [
        'Convert fractions to decimals swiftly: 1/8 = 12.5%, 1/6 = 16.67%, 1/7 = 14.28%.',
        'Use base 100 for percentage price problems with unknown amounts.'
      ],
      commonMistakes: [
        'Confusing "increased by 20%" (120%) with "increased to 20%" (20%).',
        'Applying percentage increase and subsequent decrease to the same base.'
      ]
    },
    'Time and Work': {
      formulas: [
        'If A completes work in n days, 1-day work = 1/n',
        'Total Work = Efficiency × Time',
        'Wages are directly proportional to work done (or efficiency for equal time)',
        'Alternate days: calculate 2-day cycles using LCM of individual days'
      ],
      tips: [
        'Take LCM of all individual days as the Total Work units to avoid fractions.',
        'Negative work applies to emptying pipes or dismantling workers.'
      ],
      commonMistakes: [
        'Adding days directly (e.g. 10 days + 15 days != 25 days combined).',
        'Forgetting to adjust work units remaining when a worker leaves.'
      ]
    }
  };

  const moduleData = formulasByModule[selectedModule] || formulasByModule['Percentages'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>TARGETED TRAINING MODULE</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {selectedModule} Master Training
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Current Score: <strong className="text-rose-400 font-mono">32%</strong> · Placement Target: <strong className="text-emerald-400 font-mono">80%+</strong>
          </p>
        </div>

        {/* Quick Module Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Module:</span>
          <select
            value={selectedModule}
            onChange={(e) => {
              setSelectedModule(e.target.value);
              setPracticeAnswer(null);
              setShowExplanation(false);
            }}
            className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            {modules.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 5 Guided Stages Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {stages.map((st) => {
          const isCompleted = st.status === 'completed';
          const isCurrent = st.status === 'current';
          const isLocked = st.status === 'locked';

          return (
            <div
              key={st.num}
              onClick={() => !isLocked && setActiveStage(st.num)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                activeStage === st.num
                  ? 'border-indigo-500 bg-slate-900 ring-1 ring-indigo-500/50 shadow-md'
                  : isCompleted
                  ? 'border-emerald-900/60 bg-emerald-950/20 hover:border-emerald-700'
                  : 'border-slate-800/80 bg-slate-900/40 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-mono font-bold text-slate-400">Stage {st.num}</span>
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {isCurrent && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />}
                {isLocked && <Lock className="w-3.5 h-3.5 text-slate-600" />}
              </div>
              <h3 className={`text-xs font-semibold ${isLocked ? 'text-slate-500' : 'text-slate-200'}`}>
                {st.title}
              </h3>
            </div>
          );
        })}
      </div>

      {/* Stage Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Concept, Formula Sheet & Traps (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Formula Sheet */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Core Formulas & Placement Shortcuts</span>
            </h2>

            <div className="space-y-2 pt-1 font-mono text-xs">
              {moduleData.formulas.map((f, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-indigo-300">
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Exam Tips & Common Traps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" />
                <span>Placement Speed Tips</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed list-disc list-inside">
                {moduleData.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4" />
                <span>Common Traps to Avoid</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed list-disc list-inside">
                {moduleData.commonMistakes.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right: Guided Interactive Problem (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
              <span className="font-semibold text-slate-300">Stage 3 Practice Problem</span>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">Medium Difficulty</span>
            </div>

            <p className="text-sm font-medium text-slate-100 leading-relaxed">
              If the price of sugar rises by 25%, by what percentage must a family reduce its consumption so that the total expenditure remains unchanged?
            </p>

            {/* Interactive Options */}
            <div className="space-y-2 pt-2">
              {[
                { val: '16.67%', isCorrect: false },
                { val: '20%', isCorrect: true },
                { val: '25%', isCorrect: false },
                { val: '30%', isCorrect: false }
              ].map((opt, i) => {
                const isSelected = practiceAnswer === opt.val;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setPracticeAnswer(opt.val);
                      setShowExplanation(true);
                    }}
                    className={`w-full text-left p-3 rounded-lg border text-xs font-mono transition-all flex items-center justify-between ${
                      isSelected
                        ? opt.isCorrect
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-bold'
                          : 'border-rose-500 bg-rose-950/40 text-rose-300'
                        : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{opt.val}</span>
                    {isSelected && opt.isCorrect && (
                      <span className="text-[10px] text-emerald-400 font-bold uppercase">Correct ✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation card */}
            {showExplanation && (
              <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 text-xs text-slate-300 space-y-1 animate-in fade-in">
                <strong className="text-indigo-400 block font-semibold">Solution:</strong>
                <p>
                  Reduction % = [R / (100 + R)] × 100% = [25 / (100 + 25)] × 100% = (25 / 125) × 100% = 20%.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                setPracticeAnswer(null);
                setShowExplanation(false);
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Reset Drill
            </button>
            <button
              onClick={onGoToAssessment}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Take Reassessment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
