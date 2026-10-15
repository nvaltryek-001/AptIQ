import React, { useState, useEffect } from 'react';
import { AssessmentSize, AssessmentAttempt } from './types/assessment.ts';
import { storageService, UserProfile } from './services/storageService.ts';
import { authService } from './services/authService.ts';
import { Navbar } from './components/layout/Navbar.tsx';
import { LandingPage } from './components/landing/LandingPage.tsx';
import { StudentDashboard } from './components/dashboard/StudentDashboard.tsx';
import { BlueprintSelector } from './components/assessment/BlueprintSelector.tsx';
import { AssessmentView } from './components/assessment/AssessmentView.tsx';
import { AssessmentResultView } from './components/assessment/AssessmentResultView.tsx';
import { TrainingModuleView } from './components/training/TrainingModuleView.tsx';
import { AdaptivePracticeView } from './components/practice/AdaptivePracticeView.tsx';
import { ProgressView } from './components/progress/ProgressView.tsx';
import { AuthModal, AuthMode } from './components/auth/AuthModal.tsx';
import { firebaseAuthService } from './services/firebaseAuthService.ts';

export type TabType =
  | 'auth'
  | 'landing'
  | 'dashboard'
  | 'blueprint'
  | 'assessment'
  | 'result'
  | 'training'
  | 'practice'
  | 'progress';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => storageService.getUser());

  // Determine initial tab: unauthenticated visits ALWAYS go to 'auth'
  const getInitialTab = (): TabType => {
    const savedUser = storageService.getUser();
    if (!savedUser) {
      return 'auth';
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const requestedTab = params.get('tab') as TabType;
      const mode = params.get('mode');

      if (mode === 'assessment') {
        return 'assessment';
      }

      if (requestedTab) {
        const validTabs: TabType[] = ['dashboard', 'blueprint', 'assessment', 'result', 'training', 'practice', 'progress'];
        if (validTabs.includes(requestedTab)) {
          return requestedTab;
        }
      }
    } catch (e) {
      // ignore URL parsing error
    }

    return 'dashboard';
  };

  const [currentTab, setCurrentTab] = useState<TabType>(getInitialTab);

  const [assessmentSize, setAssessmentSize] = useState<AssessmentSize>(30);
  const [currentAttempt, setCurrentAttempt] = useState<AssessmentAttempt | null>(null);
  const [trainingModule, setTrainingModule] = useState<string>('Percentages');
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>(() => {
    const savedUser = storageService.getUser();
    return savedUser ? storageService.getAttempts(savedUser.id) : [];
  });

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('student-login');

  // Keep attempts strictly in sync with the active authenticated user
  useEffect(() => {
    if (user) {
      setAttempts(storageService.getAttempts(user.id));
    } else {
      setAttempts([]);
    }
  }, [user]);

  // ROUTE GUARD: unauthenticated users must always be redirected to 'auth'
  useEffect(() => {
    if (!user && currentTab !== 'auth') {
      setCurrentTab('auth');
      if (window.location.search) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [user, currentTab]);

  // Sync tab with URL search parameter when authenticated
  useEffect(() => {
    if (user) {
      if (currentTab !== 'auth') {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', currentTab);
        window.history.replaceState({}, '', url.toString());
      }
    } else {
      if (window.location.search) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [user, currentTab]);

  // Check if an assessment is already in progress on load
  useEffect(() => {
    if (!user) return;

    const activeSession = storageService.getCurrentSession();
    if (activeSession && activeSession.questionIds.length > 0 && (!activeSession.userId || activeSession.userId === user.id)) {
      setAssessmentSize(activeSession.blueprintSize);
      setCurrentTab('assessment');
    }
  }, [user]);

  const handleOpenAuth = (mode: AuthMode = 'student-login') => {
    setAuthModalMode(mode);
    if (!user) {
      setCurrentTab('auth');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    setAttempts(storageService.getAttempts(authenticatedUser.id));
    setIsAuthModalOpen(false);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    authService.logout();
    firebaseAuthService.signOut();
    storageService.clearCurrentSession();
    setUser(null);
    setAttempts([]);
    setCurrentAttempt(null);
    setCurrentTab('auth');
    setIsAuthModalOpen(false);
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleNavigate = (tab: TabType) => {
    if (!user) {
      setCurrentTab('auth');
      return;
    }
    setCurrentTab(tab);
  };

  // Launch test from Blueprint Selector
  const handleStartBlueprint = (size: AssessmentSize) => {
    setAssessmentSize(size);
    setCurrentTab('assessment');
  };

  // Assessment submitted
  const handleFinishAssessment = (attempt: AssessmentAttempt) => {
    setCurrentAttempt(attempt);
    const u = storageService.getUser();
    setAttempts(storageService.getAttempts(u?.id));
    setCurrentTab('result');
  };

  // Navigate to training for a specific weak module
  const handleGoToTraining = (moduleName: string) => {
    setTrainingModule(moduleName);
    setCurrentTab('training');
  };

  // View historical attempt
  const handleViewAttempt = (attempt: AssessmentAttempt) => {
    setCurrentAttempt(attempt);
    setCurrentTab('result');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Hide navbar during active assessment */}
      {currentTab !== 'assessment' && (
        <Navbar
          currentTab={currentTab}
          onNavigate={handleNavigate}
          user={user}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
        />
      )}

      {/* Main View Router */}
      <div className="flex-1">
        {!user || currentTab === 'auth' ? (
          <AuthModal
            isPageMode={true}
            initialMode={authModalMode}
            onAuthSuccess={handleAuthSuccess}
          />
        ) : (
          <>
            {currentTab === 'landing' && (
              <LandingPage
                onStartAssessment={() => handleNavigate('blueprint')}
                onLoginStudent={() => handleOpenAuth('student-login')}
              />
            )}

            {currentTab === 'dashboard' && (
              <StudentDashboard
                user={user}
                attempts={attempts}
                onStartDiagnostic={() => handleNavigate('blueprint')}
                onViewAttempt={handleViewAttempt}
                onGoToTraining={handleGoToTraining}
              />
            )}

            {currentTab === 'blueprint' && (
              <BlueprintSelector
                onSelectBlueprint={handleStartBlueprint}
                onCancel={() => setCurrentTab('dashboard')}
              />
            )}

            {currentTab === 'assessment' && (
              <AssessmentView
                size={assessmentSize}
                onFinish={handleFinishAssessment}
                onExit={() => setCurrentTab('dashboard')}
              />
            )}

            {currentTab === 'result' && currentAttempt && (
              <AssessmentResultView
                attempt={currentAttempt}
                onRetake={() => handleNavigate('blueprint')}
                onGoToTraining={handleGoToTraining}
                onGoToDashboard={() => setCurrentTab('dashboard')}
              />
            )}

            {currentTab === 'training' && (
              <TrainingModuleView
                initialModule={trainingModule}
                user={user}
                onGoToAssessment={() => handleNavigate('blueprint')}
              />
            )}

            {currentTab === 'practice' && (
              <AdaptivePracticeView user={user} />
            )}

            {currentTab === 'progress' && (
              <ProgressView
                attempts={attempts}
                onTakeTest={() => handleNavigate('blueprint')}
              />
            )}
          </>
        )}
      </div>

      {/* Modal authentication dialog */}
      {user && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
