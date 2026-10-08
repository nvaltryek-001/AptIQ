import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService.ts';
import { UserProfile } from '../../services/storageService.ts';
import {
  Shield,
  User,
  Lock,
  Mail,
  GraduationCap,
  Building,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'student-login' | 'student-register' | 'admin-login';
  onAuthSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'student-login',
  onAuthSuccess
}) => {
  const [mode, setMode] = useState<'student-login' | 'student-register' | 'admin-login'>(initialMode);
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
      setEmail('');
      setPassword('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleReset = (newMode: 'student-login' | 'student-register' | 'admin-login') => {
    setMode(newMode);
    setError(null);
    if (newMode === 'admin-login') {
      setEmail('');
      setPassword('');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'admin-login') {
        const res = await authService.login(email, password, 'admin');
        if (res.success && res.user) {
          onAuthSuccess(res.user);
          onClose();
        } else {
          setError(res.error || 'Failed to authenticate as administrator.');
        }
      } else if (mode === 'student-login') {
        const res = await authService.login(email, password, 'student');
        if (res.success && res.user) {
          onAuthSuccess(res.user);
          onClose();
        } else {
          setError(res.error || 'Invalid student email or password.');
        }
      } else {
        // Register Student
        const res = await authService.registerStudent({
          name,
          email,
          password,
          college,
          branch,
          graduationYear,
          targetCompany,
          targetRole
        });
        if (res.success && res.user) {
          onAuthSuccess(res.user);
          onClose();
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {mode === 'admin-login' ? (
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <User className="w-4 h-4" />
              </div>
            )}
            <div>
              <h2 className="text-base font-bold text-white">
                {mode === 'admin-login'
                  ? 'Administrator Sign In'
                  : mode === 'student-login'
                  ? 'Student Sign In'
                  : 'Student Registration'}
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                {mode === 'admin-login' ? 'Strict Single Admin Access' : 'Campus Placement Aptitude'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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
          <button
            type="button"
            onClick={() => handleReset('admin-login')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
              mode === 'admin-login'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Admin Only
          </button>
        </div>

        {/* Security Banner for Admin Mode */}
        {mode === 'admin-login' && (
          <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-xs text-rose-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-400">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Access Restricted</span>
            </div>
            <p className="text-[11px] text-rose-300/80 leading-relaxed">
              Only admin email allowed with authorized master credentials. All other login attempts are strictly rejected.
            </p>
          </div>
        )}

        {/* Error notification banner */}
        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'student-register' && (
            <>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">College / University</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NIT / RVCE"
                    value={college}
                    onChange={e => setCollege(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Graduation Year</label>
                  <select
                    value={graduationYear}
                    onChange={e => setGraduationYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                    <option value={2028}>2028</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Engineering Branch</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science, Information Tech, ECE"
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Company (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Google, Amazon, TCS"
                    value={targetCompany}
                    onChange={e => setTargetCompany(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Role (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. SDE-1, Analyst"
                    value={targetRole}
                    onChange={e => setTargetRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-300 font-semibold">
                {mode === 'admin-login' ? 'Admin Email Address' : 'Email Address'}
              </label>
              {mode === 'admin-login' && (
                <span className="text-[10px] text-rose-400 font-medium">Only admin email allowed</span>
              )}
            </div>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="email"
                required
                placeholder={mode === 'admin-login' ? 'admin@domain.com' : 'student@college.edu'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            {mode === 'student-register' && (
              <span className="text-[10px] text-slate-500 mt-0.5 block">Minimum 6 characters.</span>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg mt-2 ${
              mode === 'admin-login'
                ? 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 shadow-rose-600/20'
                : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-indigo-600/20'
            }`}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : mode === 'admin-login' ? (
              <>
                <Shield className="w-4 h-4" />
                <span>Verify Administrator Credentials</span>
              </>
            ) : mode === 'student-login' ? (
              <>
                <span>Sign In to Student Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Student Registration</span>
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
          {mode === 'admin-login' && (
            <span>
              Are you a student?{' '}
              <button
                type="button"
                onClick={() => handleReset('student-login')}
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Student Sign In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
