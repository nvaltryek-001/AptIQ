import React from 'react';
import {
  Target,
  Zap,
  TrendingUp,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  Flame,
  Award,
  Layers
} from 'lucide-react';

interface LandingPageProps {
  onStartAssessment: () => void;
  onLoginStudent: () => void;
  onLoginAdmin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAssessment,
  onLoginStudent,
  onLoginAdmin
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-20 text-center space-y-8">
        {/* Micro Kicker */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Target className="w-3.5 h-3.5 text-indigo-400" />
          <span>PRECISION PLACEMENT APTITUDE SYSTEM</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Know exactly where you’re weak.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-200 to-emerald-400">
            Train exactly what you need.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          AptIQ is not a generic exam platform. It runs granular topic-level diagnostic tests across 42 engineering placement modules, exposes your mark-loss root causes, and guides targeted training to guarantee score jumps.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={onStartAssessment}
            className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2 group"
          >
            <span>Start Free Diagnostic Assessment</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onLoginStudent}
            className="px-6 py-3.5 rounded-xl border border-slate-700 hover:bg-slate-900 active:bg-slate-800 text-slate-200 font-semibold text-sm transition-colors"
          >
            Student Login / Register
          </button>

          <button
            onClick={onLoginAdmin}
            className="px-6 py-3.5 rounded-xl border border-slate-800 hover:bg-slate-900/60 text-slate-400 hover:text-rose-400 font-semibold text-sm transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Innovation Pipeline Diagram */}
        <div className="pt-12">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 max-w-4xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-slate-500 font-bold block mb-4">
              THE APTIQ CLOSED-LOOP IMPROVEMENT CYCLE
            </span>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center text-xs font-semibold">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="block text-indigo-400 font-mono mb-1">01</span>
                <span>Diagnostic Test</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="block text-indigo-400 font-mono mb-1">02</span>
                <span>Topic Analysis</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="block text-rose-400 font-mono mb-1">03</span>
                <span>Identify Weak Topics</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="block text-amber-400 font-mono mb-1">04</span>
                <span>Targeted Training</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="block text-teal-400 font-mono mb-1">05</span>
                <span>Reassessment</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-emerald-800/80 bg-emerald-950/20 text-emerald-300">
                <span className="block text-emerald-400 font-mono mb-1">06</span>
                <span>Measure +47% Gain</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 text-left">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">42 Curated Modules</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full coverage across Quantitative Aptitude (19), Logical Reasoning (14), and Verbal Ability (9) aligned with campus hiring tests.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Weak-Topic Detection</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Algorithms instantly classify performance into Critical (&lt;40%), Weak (&lt;60%), Average, and Strong with specific tactical remediation.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Adaptive Practice</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamic difficulty ramp-up when you solve correctly, with automated fallback to foundation drills and formulas when you stumble.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-mono">
        AptIQ · Placement Aptitude Assessment & Targeted Diagnostics · Only Authorized Administrator Access Allowed
      </footer>
    </div>
  );
};
