import React, { useState, useEffect } from 'react';
import { AssessmentSize, AssessmentAttempt } from './types/assessment.ts';
import { storageService, UserProfile } from './services/storageService.ts';
import { authService, MASTER_ADMIN_EMAIL } from './services/authService.ts';
import { Navbar } from './components/layout/Navbar.tsx';
import { LandingPage } from './components/landing/LandingPage.tsx';
import { StudentDashboard } from './components/dashboard/StudentDashboard.tsx';
import { BlueprintSelector } from './components/assessment/BlueprintSelector.tsx';
import { AssessmentView } from './components/assessment/AssessmentView.tsx';
import { AssessmentResultView } from './components/assessment/AssessmentResultView.tsx';
import { TrainingModuleView } from './components/training/TrainingModuleView.tsx';
import { AdaptivePracticeView } from './components/practice/AdaptivePracticeView.tsx';
import { ProgressView } from './components/progress/ProgressView.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => storageService.getUser());
  const [currentTab, setCurrentTab] = useState<
    'landing' | 'dashboard' | 'blueprint' | 'assessment' | 'result' | 'training' | 'practice' | 'progress' | 'admin'
  >('dashboard');

  const [assessmentSize, setAssessmentSize] = useState<AssessmentSize>(30);
  const [currentAttempt, setCurrentAttempt] = useState<AssessmentAttempt | null>(null);
  const [trainingModule, setTrainingModule] = useState<string>('Percentages');
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>(() => storageService.getAttempts());

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'student-login' | 'student-register' | 'admin-login'>('student-login');

  // Check if an assessment is already in progress on load
  useEffect(() => {
    const activeSession = storageService.getCurrentSession();
    if (activeSession && activeSession.questionIds.length > 0) {
      setAssessmentSize(activeSession.blueprintSize);
      setCurrentTab('assessment');
    }
  }, []);

  const handleOpenAuth = (mode: 'student-login' | 'student-register' | 'admin-login' = 'student-login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    setIsAuthModalOpen(false);
    if (authenticatedUser.role === 'admin') {
      setCurrentTab('admin');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setCurrentTab('landing');
  };

  const handleNavigate = (tab: 'landing' | 'dashboard' | 'blueprint' | 'training' | 'practice' | 'progress' | 'admin') => {
    if (tab === 'admin') {
      // STRICT CHECK: Only rajathdrajathd@gmail.com can enter admin tab
      if (user?.role === 'admin' && user?.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
        setCurrentTab('admin');
      } else {
        // Prompt admin login modal
        handleOpenAuth('admin-login');
      }
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
    setAttempts(storageService.getAttempts());
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
      {/* Hide navbar during active assessment to provide distraction-free testing environment */}
      {currentTab !== 'assessment' && currentTab !== 'landing' && (
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
        {currentTab === 'landing' && (
          <LandingPage
            onStartAssessment={() => setCurrentTab('blueprint')}
            onLoginStudent={() => handleOpenAuth('student-login')}
            onLoginAdmin={() => handleOpenAuth('admin-login')}
          />
        )}

        {currentTab === 'dashboard' && (
          <StudentDashboard
            user={user || {
              id: 'guest',
              name: 'Guest Student',
              email: 'guest@aptiq.com',
              role: 'student',
              college: 'Engineering Institute',
              branch: 'Computer Science',
              graduationYear: 2026
            }}
            attempts={attempts}
            onStartDiagnostic={() => setCurrentTab('blueprint')}
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
            onRetake={() => setCurrentTab('blueprint')}
            onGoToTraining={handleGoToTraining}
            onGoToDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'training' && (
          <TrainingModuleView
            initialModule={trainingModule}
            onGoToAssessment={() => setCurrentTab('blueprint')}
          />
        )}

        {currentTab === 'practice' && (
          <AdaptivePracticeView />
        )}

        {currentTab === 'progress' && (
          <ProgressView
            attempts={attempts}
            onTakeTest={() => setCurrentTab('blueprint')}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard
            currentUser={user}
            onAuthenticateAdmin={() => handleOpenAuth('admin-login')}
          />
        )}
      </div>

      {/* Global Authentication Modal (Student Login, Student Registration, Master Admin Access) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
