import React, { useState, useEffect } from 'react';
import { authService, RegistrationParams } from '../../services/authService.ts';
import { firebaseAuthService } from '../../services/firebaseAuthService.ts';
import { UserProfile } from '../../services/storageService.ts';
import {
  User,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export type AuthMode = 'student-login' | 'student-register';

interface AuthModalProps {
  isOpen?: boolean;
  isPageMode?: boolean;
  onClose?: () => void;
  initialMode?: AuthMode;
  onAuthSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen = true,
  isPageMode = false,
  onClose,
  initialMode = 'student-login',
  onAuthSuccess
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Form states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [college, setCollege] = useState<string>('');
  const [branch, setBranch] = useState<string>('Computer Science & Engineering');
  const [graduationYear, setGraduationYear] = useState<number>(2026);
  const [targetCompany, setTargetCompany] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('Software Engineer');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen && !isPageMode) return null;

  const handleReset = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
  };

  // Main Form Submit (Registration or Login)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (mode === 'student-login') {
        const res = await authService.login(cleanEmail, password, 'student');
        if (res.success && res.user) {
          onAuthSuccess(res.user);
          if (onClose) onClose();
        } else {
          setError(res.error || 'Invalid student email or password.');
        }
      } else if (mode === 'student-register') {
        const registrationParams: RegistrationParams = {
          name,
          email: cleanEmail,
          password,
          college,
          branch,
          graduationYear,
          targetCompany,
          targetRole
        };

        const res = await firebaseAuthService.registerStudent(registrationParams);
        if (res.success && res.user) {
          onAuthSuccess(res.user);
          if (onClose) onClose();
        } else {
          setError(res.error || 'Failed to register student account.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cardContent = (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {mode === 'student-login' ? 'Student Sign In' : 'Student Registration'}
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Campus Placement Aptitude
            </span>
          </div>
        </div>

        {!isPageMode && onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tab switchers */}
      <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => handleReset('student-login')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
            mode === 'student-login'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Student Login
        </button>
        <button
          type="button"
          onClick={() => handleReset('student-register')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
            mode === 'student-register'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          New Student
        </button>
      </div>

      {/* Error notification banner */}
      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* STANDARD REGISTRATION & LOGIN FORM */}
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {/* Full Name (Registration only) */}
        {mode === 'student-register' && (
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* College and Branch (Registration only) */}
        {mode === 'student-register' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                College / Institute <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. RV College of Engg"
                value={college}
                onChange={e => setCollege(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Branch <span className="text-rose-400">*</span>
              </label>
              <select
                value={branch}
                onChange={e => setBranch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-indigo-500"
              >
                <option value="Computer Science & Engineering">Computer Science (CSE)</option>
                <option value="Information Science & Engineering">Information Science (ISE)</option>
                <option value="Electronics & Communication">Electronics & Comm (ECE)</option>
                <option value="Electrical & Electronics">Electrical (EEE)</option>
                <option value="Mechanical Engineering">Mechanical (ME)</option>
                <option value="Civil Engineering">Civil (CE)</option>
                <option value="Other Engineering Branch">Other Branch</option>
              </select>
            </div>
          </div>
        )}

        {/* Graduation Year & Career Target (Registration only) */}
        {mode === 'student-register' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Batch Year <span className="text-rose-400">*</span>
              </label>
              <select
                value={graduationYear}
                onChange={e => setGraduationYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-indigo-500"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Target Company (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Google, Amazon, TCS Digital"
                value={targetCompany}
                onChange={e => setTargetCompany(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Email Address */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Email Address <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="email"
              required
              placeholder="student@college.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-indigo-500 font-mono transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Password <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-indigo-500 font-mono transition-colors"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer mt-4 bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : mode === 'student-login' ? (
            <>
              <span>Sign In to Student Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Create Student Account</span>
            </>
          )}
        </button>
      </form>

      {/* Footer switch prompt */}
      <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800">
        {mode === 'student-login' && (
          <span>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => handleReset('student-register')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Register as Student
            </button>
          </span>
        )}
        {mode === 'student-register' && (
          <span>
            Already registered?{' '}
            <button
              type="button"
              onClick={() => handleReset('student-login')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Log In Here
            </button>
          </span>
        )}
      </div>
    </div>
  );

  // If used in page mode (unauthenticated visit), render centered in page container
  if (isPageMode) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <span>AptIQ Campus Assessment System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sign In or Create Account
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Please log in or register below to access your diagnostic tests, training modules, and placement analytics.
          </p>
        </div>
        {cardContent}
      </div>
    );
  }

  // Modal mode
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {cardContent}
    </div>
  );
};
