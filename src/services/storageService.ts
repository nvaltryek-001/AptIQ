import { AssessmentAttempt, StudentAnswer, AssessmentSize } from '../types/assessment.ts';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  college: string;
  branch: string;
  graduationYear: number;
  targetCompany?: string;
  targetRole?: string;
}

export interface InProgressSession {
  assessmentId: string;
  blueprintSize: AssessmentSize;
  startedAt: number; // timestamp ms
  durationSeconds: number;
  remainingSeconds: number;
  questionIds: string[];
  currentQuestionIndex: number;
  answers: Record<string, StudentAnswer>;
}

const STORAGE_KEYS = {
  USER: 'aptiq_user',
  ATTEMPTS: 'aptiq_attempts',
  CURRENT_SESSION: 'aptiq_in_progress_session',
  BOOKMARKS: 'aptiq_bookmarks'
};

export const defaultStudentUser: UserProfile = {
  id: 'usr_student_01',
  name: 'Aarav Sharma',
  email: 'student@aptiq.com',
  role: 'student',
  college: 'National Institute of Technology',
  branch: 'Computer Science & Engineering',
  graduationYear: 2026,
  targetCompany: 'Google / Amazon / TCS Digital',
  targetRole: 'Software Development Engineer'
};

export const defaultAdminUser: UserProfile = {
  id: 'usr_admin_01',
  name: 'Prof. Raghavan V.',
  email: 'admin@aptiq.com',
  role: 'admin',
  college: 'AptIQ Campus Administration',
  branch: 'Training & Placement Division',
  graduationYear: 2020
};

// Storage helpers
export const storageService = {
  getUser(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : defaultStudentUser;
    } catch {
      return defaultStudentUser;
    }
  },

  setUser(user: UserProfile) {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user', e);
    }
  },

  clearUser() {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (e) {
      console.error('Failed to clear user', e);
    }
  },

  getAttempts(): AssessmentAttempt[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      if (data) return JSON.parse(data);

      // Seed realistic initial demo attempts
      const sampleAttempts: AssessmentAttempt[] = [
        {
          id: 'attempt_demo_current',
          userId: 'usr_student_01',
          blueprintSize: 30,
          title: 'Diagnostic Quick Sprint (30 Questions)',
          startedAt: new Date(Date.now() - 3600000).toISOString(),
          submittedAt: new Date(Date.now() - 1800000).toISOString(),
          totalTimeSpentSeconds: 1680,
          totalQuestions: 30,
          score: 21,
          percentage: 70,
          correctCount: 21,
          wrongCount: 7,
          unansweredCount: 2,
          accuracy: 75,
          averageTimePerQuestion: 56,
          sectionBreakdown: [
            { section: 'Quantitative Aptitude', score: 6, total: 10, percentage: 60, accuracy: 67, timeSpentSeconds: 620 },
            { section: 'Logical Reasoning', score: 8, total: 10, percentage: 80, accuracy: 80, timeSpentSeconds: 540 },
            { section: 'Verbal Ability', score: 7, total: 10, percentage: 70, accuracy: 78, timeSpentSeconds: 520 }
          ],
          topicBreakdown: [
            {
              module: 'Percentages',
              topic: 'Basic Percentage',
              section: 'Quantitative Aptitude',
              score: 1,
              total: 3,
              percentage: 33,
              accuracy: 33,
              averageTime: 78,
              status: 'Critical',
              recommendation: 'Start Percentages Foundation Training & solve 10 guided basic practice problems.'
            },
            {
              module: 'Time and Work',
              topic: 'Individual Work Rates',
              section: 'Quantitative Aptitude',
              score: 1,
              total: 2,
              percentage: 50,
              accuracy: 50,
              averageTime: 82,
              status: 'Weak',
              recommendation: 'Review formula sheets and intermediate speed drills for Time and Work.'
            },
            {
              module: 'Seating Arrangement',
              topic: 'Linear Row Arrangement',
              section: 'Logical Reasoning',
              score: 2,
              total: 3,
              percentage: 67,
              accuracy: 67,
              averageTime: 62,
              status: 'Average',
              recommendation: 'Solve 10 timed practice questions to push accuracy above 80%.'
            },
            {
              module: 'Probability',
              topic: 'Two Dice Sum',
              section: 'Quantitative Aptitude',
              score: 2,
              total: 2,
              percentage: 100,
              accuracy: 100,
              averageTime: 44,
              status: 'Excellent',
              recommendation: 'Mastery achieved. Maintain speed with periodic mock tests.'
            }
          ],
          answers: {
            'QA-PCT-001': { questionId: 'QA-PCT-001', selectedOption: '600', isMarkedForReview: false, timeSpentSeconds: 45 },
            'QA-TWR-001': { questionId: 'QA-TWR-001', selectedOption: '8 days', isMarkedForReview: false, timeSpentSeconds: 60 }
          },
          questionIds: [
            'QA-PCT-001', 'QA-PCT-002', 'QA-TWR-001', 'LR-BLD-001', 'LR-DIR-001', 'VA-ART-001', 'VA-TNS-001'
          ]
        },
        {
          id: 'attempt_demo_previous',
          userId: 'usr_student_01',
          blueprintSize: 30,
          title: 'Initial Baseline Diagnostic (30 Questions)',
          startedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          submittedAt: new Date(Date.now() - 86400000 * 3 + 1800000).toISOString(),
          totalTimeSpentSeconds: 1750,
          totalQuestions: 30,
          score: 15,
          percentage: 50,
          correctCount: 15,
          wrongCount: 12,
          unansweredCount: 3,
          accuracy: 55,
          averageTimePerQuestion: 58,
          sectionBreakdown: [
            { section: 'Quantitative Aptitude', score: 4, total: 10, percentage: 40, accuracy: 44, timeSpentSeconds: 700 },
            { section: 'Logical Reasoning', score: 6, total: 10, percentage: 60, accuracy: 60, timeSpentSeconds: 580 },
            { section: 'Verbal Ability', score: 5, total: 10, percentage: 50, accuracy: 56, timeSpentSeconds: 470 }
          ],
          topicBreakdown: [
            {
              module: 'Percentages',
              topic: 'Basic Percentage',
              section: 'Quantitative Aptitude',
              score: 0,
              total: 3,
              percentage: 0,
              accuracy: 0,
              averageTime: 92,
              status: 'Critical',
              recommendation: 'Start Percentages Foundation Training & solve 10 guided basic practice problems.'
            }
          ],
          answers: {},
          questionIds: ['QA-PCT-001']
        }
      ];

      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(sampleAttempts));
      return sampleAttempts;
    } catch {
      return [];
    }
  },

  saveAttempt(attempt: AssessmentAttempt) {
    try {
      const attempts = this.getAttempts();
      attempts.unshift(attempt); // latest first
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
      // clear session once saved
      this.clearCurrentSession();
    } catch (e) {
      console.error('Failed to save attempt', e);
    }
  },

  getAttemptById(id: string): AssessmentAttempt | undefined {
    return this.getAttempts().find(a => a.id === id);
  },

  getCurrentSession(): InProgressSession | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveCurrentSession(session: InProgressSession) {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
    } catch (e) {
      console.error('Failed to persist session', e);
    }
  },

  clearCurrentSession() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    } catch (e) {
      console.error('Failed to clear session', e);
    }
  }
};
