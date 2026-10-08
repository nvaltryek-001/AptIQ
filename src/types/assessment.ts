export interface AptitudeQuestion {
  id: string;
  section: 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability';
  module: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  options: [string, string, string, string];
  correctAnswer: string;
  explanation: string;
  timeLimit: number; // in seconds
  tags: string[];
}

export type AssessmentSize = 30 | 60 | 90 | 120;

export interface BlueprintConfig {
  size: AssessmentSize;
  title: string;
  description: string;
  durationMinutes: number;
  sections: {
    quantitative: number;
    logical: number;
    verbal: number;
  };
}

export const ASSESSMENT_BLUEPRINTS: Record<AssessmentSize, BlueprintConfig> = {
  30: {
    size: 30,
    title: 'Diagnostic Quick Sprint',
    description: 'Fast topic-level diagnostic test to identify your immediate critical weaknesses.',
    durationMinutes: 30,
    sections: { quantitative: 10, logical: 10, verbal: 10 }
  },
  60: {
    size: 60,
    title: 'Standard Placement Diagnostic',
    description: 'Standard campus recruitment test simulation covering core placement topics.',
    durationMinutes: 60,
    sections: { quantitative: 20, logical: 20, verbal: 20 }
  },
  90: {
    size: 90,
    title: 'Comprehensive Assessment',
    description: 'In-depth evaluation simulating Tier-1 tech and product recruitment drives.',
    durationMinutes: 90,
    sections: { quantitative: 30, logical: 30, verbal: 30 }
  },
  120: {
    size: 120,
    title: 'Master Placement Marathon',
    description: 'Exhaustive full-spectrum placement aptitude battery testing speed, stamina and mastery.',
    durationMinutes: 120,
    sections: { quantitative: 40, logical: 40, verbal: 40 }
  }
};

export type QuestionStatus = 'answered' | 'unanswered' | 'marked' | 'marked-answered';

export interface StudentAnswer {
  questionId: string;
  selectedOption: string | null;
  isMarkedForReview: boolean;
  timeSpentSeconds: number;
}

export interface AssessmentAttempt {
  id: string;
  userId: string;
  blueprintSize: AssessmentSize;
  title: string;
  startedAt: string;
  submittedAt: string;
  totalTimeSpentSeconds: number;
  totalQuestions: number;
  score: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  accuracy: number;
  averageTimePerQuestion: number;
  sectionBreakdown: {
    section: 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability';
    score: number;
    total: number;
    percentage: number;
    accuracy: number;
    timeSpentSeconds: number;
  }[];
  topicBreakdown: {
    module: string;
    topic: string;
    section: string;
    score: number;
    total: number;
    percentage: number;
    accuracy: number;
    averageTime: number;
    status: 'Critical' | 'Weak' | 'Average' | 'Strong' | 'Excellent';
    recommendation: string;
  }[];
  answers: Record<string, StudentAnswer>;
  questionIds: string[];
}
