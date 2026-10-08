import React from 'react';
import { UserProfile } from '../../services/storageService.ts';
import { MASTER_ADMIN_EMAIL } from '../../services/authService.ts';
import {
  Compass,
  LayoutDashboard,
  Target,
  BookOpen,
  TrendingUp,
  Award,
  Shield,
  User,
  LogOut,
  Zap,
  LogIn,
  UserPlus,
  ShieldAlert
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'landing' | 'dashboard' | 'blueprint' | 'assessment' | 'training' | 'practice' | 'progress' | 'admin' | 'result';
  onNavigate: (tab: 'landing' | 'dashboard' | 'blueprint' | 'training' | 'practice' | 'progress' | 'admin') => void;
  user: UserProfile | null;
  onOpenAuth: (mode?: 'student-login' | 'student-register' | 'admin-login') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  user,
  onOpenAuth,
  onLogout
}) => {
  const isAdmin = user?.role === 'admin' && user.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Lockup */}
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-indigo-600/20 group-hover:bg-indigo-500 transition-colors">
            A
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
              AptIQ
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider block mt-0.5">
              Diagnose · Practice · Improve
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentTab === 'dashboard'
                ? 'bg-slate-900 text-white border border-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onNavigate('blueprint')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentTab === 'blueprint' || currentTab === 'assessment'
                ? 'bg-slate-900 text-white border border-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            <span>Diagnostic Test</span>
          </button>

          <button
            onClick={() => onNavigate('training')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentTab === 'training'
                ? 'bg-slate-900 text-white border border-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Targeted Training</span>
          </button>

          <button
            onClick={() => onNavigate('practice')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentTab === 'practice'
                ? 'bg-slate-900 text-white border border-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Adaptive Practice</span>
          </button>

          <button
            onClick={() => onNavigate('progress')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentTab === 'progress'
                ? 'bg-slate-900 text-white border border-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
            <span>Progress & Growth</span>
          </button>

          {/* Admin link strictly visible only if authenticated as Master Admin */}
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                currentTab === 'admin'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800 font-bold'
                  : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span>Admin Console</span>
            </button>
          )}
        </nav>

        {/* Right User & Auth Controls */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              {/* Profile Chip */}
              <div className="flex items-center gap-2 pl-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                    isAdmin
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                  }`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left text-xs leading-tight">
                  <span className="block font-medium text-slate-200 truncate max-w-[120px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {isAdmin ? 'Master Admin' : `${user.branch || 'Student'}`}
                  </span>
                </div>
              </div>

              {/* If not logged in as admin, provide quick Admin Portal Login link */}
              {!isAdmin && (
                <button
                  onClick={() => onOpenAuth('admin-login')}
                  className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 text-xs font-semibold transition-colors"
                  title="Admin Sign In (Only authorized administrator email allowed)"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              )}

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-rose-400 text-xs font-medium transition-colors flex items-center gap-1.5"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('student-login')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
              <button
                onClick={() => onOpenAuth('student-register')}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
              <button
                onClick={() => onOpenAuth('admin-login')}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                title="Admin Login (Restricted)"
              >
                <Shield className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
