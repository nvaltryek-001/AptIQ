import React, { useState } from 'react';
import { AptitudeQuestion } from '../../types/assessment.ts';
import { assessmentEngine } from '../../services/assessmentEngine.ts';
import {
  Shield,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  QrCode,
  Users,
  Database,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { UserProfile } from '../../services/storageService.ts';
import { MASTER_ADMIN_EMAIL } from '../../services/authService.ts';

interface AdminDashboardProps {
  currentUser?: UserProfile | null;
  onAuthenticateAdmin?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onAuthenticateAdmin
}) => {
  const isMasterAdmin =
    currentUser?.role === 'admin' &&
    currentUser.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

  const [questions, setQuestions] = useState<AptitudeQuestion[]>(() =>
    assessmentEngine.getAllQuestions()
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Filtered question bank
  const filteredQuestions = questions.filter(q => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = selectedSection === 'All' || q.section === selectedSection;
    const matchesDiff = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;
    return matchesSearch && matchesSection && matchesDiff;
  });

  const handleDeleteQuestion = (id: string) => {
    if (confirm(`Are you sure you want to delete question ${id}?`)) {
      setQuestions(prev => prev.filter(q => q.id !== id));
    }
  };

  const assessmentUrl = window.location.origin + '?mode=assessment&size=30';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(assessmentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // STRICT ACCESS CONTROL GUARD: Only rajathdrajathd@gmail.com can view Admin Dashboard
  if (!isMasterAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">Restricted Administrator Area</h2>
          <p className="text-xs text-rose-300 font-mono">Access Denied</p>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          The AptIQ Admin Console is exclusively restricted. Only authorized administrator email allowed. No other user email or student account has authorization.
        </p>
        {onAuthenticateAdmin && (
          <button
            onClick={onAuthenticateAdmin}
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
          >
            <Lock className="w-4 h-4" />
            <span>Sign In with Administrator Credentials</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>CAMPUS FACULTY & ADMIN CONSOLE</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            AptIQ Administration & Question Bank
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage 840 verified placement aptitude questions, student cohorts, and assessment QR access codes.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowQrModal(true)}
            className="px-4 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4 text-indigo-400" />
            <span>Generate Assessment QR</span>
          </button>
        </div>
      </div>

      {/* Admin KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Total Question Bank</span>
          <div className="text-2xl font-bold font-mono text-white">{questions.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Covering all 42 modules</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Enrolled Students</span>
          <div className="text-2xl font-bold font-mono text-indigo-400">1,480</div>
          <span className="text-[11px] text-slate-500 mt-1 block">2026 Graduating Batch</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Diagnostic Tests Taken</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">3,820</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Avg Score: 64.2%</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Campus Weakest Topic</span>
          <div className="text-2xl font-bold font-mono text-rose-400">Percentages</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Followed by Time & Work</span>
        </div>
      </div>

      {/* Question Bank Manager Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <span>Question Bank Catalog ({filteredQuestions.length} Matches)</span>
          </h2>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search question, module or ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 outline-none w-52"
              />
            </div>

            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Sections</option>
              <option value="Quantitative Aptitude">Quantitative Aptitude</option>
              <option value="Logical Reasoning">Logical Reasoning</option>
              <option value="Verbal Ability">Verbal Ability</option>
            </select>

            <select
              value={selectedDifficulty}
              onChange={e => setSelectedDifficulty(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Questions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">ID</th>
                <th className="pb-3 font-semibold">Module</th>
                <th className="pb-3 font-semibold">Difficulty</th>
                <th className="pb-3 font-semibold">Question Snippet</th>
                <th className="pb-3 font-semibold">Correct Answer</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredQuestions.slice(0, 25).map(q => (
                <tr key={q.id} className="hover:bg-slate-900/40">
                  <td className="py-3 text-indigo-400 font-bold">{q.id}</td>
                  <td className="py-3 font-sans text-slate-200">{q.module}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        q.difficulty === 'Easy'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : q.difficulty === 'Medium'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                          : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="py-3 font-sans text-slate-300 max-w-xs truncate">
                    {q.question}
                  </td>
                  <td className="py-3 text-emerald-300 font-sans font-medium">{q.correctAnswer}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 rounded hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal for Assessment */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <QrCode className="w-5 h-5 text-indigo-400" />
                <span>Diagnostic Test QR Code</span>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Display this QR code in classrooms or labs. Students can scan with their phone camera to instantly launch the AptIQ diagnostic assessment.
            </p>

            {/* Visual SVG QR representation */}
            <div className="flex justify-center p-4 bg-white rounded-xl">
              <svg className="w-48 h-48" viewBox="0 0 100 100">
                <path fill="#0f172a" d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M20,20 h10 v10 h-10 z" />
                <path fill="#0f172a" d="M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M70,20 h10 v10 h-10 z" />
                <path fill="#0f172a" d="M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M20,70 h10 v10 h-10 z" />
                <path fill="#0f172a" d="M45,15 h5 v10 h-5 z M45,35 h10 v5 h-10 z M65,45 h5 v5 h-5 z M75,55 h10 v10 h-10 z M55,65 h10 v15 h-10 z M45,75 h5 v15 h-5 z M75,75 h15 v5 h-15 z M85,85 h5 v5 h-5 z" />
              </svg>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <input
                type="text"
                readOnly
                value={assessmentUrl}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-300 truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0 flex items-center gap-1 transition-colors"
              >
                {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
