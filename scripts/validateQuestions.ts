import fs from 'fs';
import path from 'path';
import { AptitudeQuestion } from '../src/types/assessment.ts';
import { ALL_MODULES } from './questionHelper.ts';

interface ValidationError {
  questionId: string;
  field: string;
  issue: string;
}

interface ValidationReport {
  timestamp: string;
  totalQuestions: number;
  totalErrors: number;
  isValid: boolean;
  errors: ValidationError[];
  summary: {
    bySection: Record<string, number>;
    byDifficulty: Record<string, number>;
    byModule: Record<string, number>;
  };
}

const dataPath = path.resolve('data/questionBank.json');
if (!fs.existsSync(dataPath)) {
  console.error('questionBank.json not found at', dataPath);
  process.exit(1);
}

const raw = fs.readFileSync(dataPath, 'utf-8');
const questions: AptitudeQuestion[] = JSON.parse(raw);

const allValidModules = new Set([
  ...ALL_MODULES.quantitative,
  ...ALL_MODULES.logical,
  ...ALL_MODULES.verbal
]);

const validSections = new Set([
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability'
]);

const validDifficulties = new Set(['Easy', 'Medium', 'Hard']);

const errors: ValidationError[] = [];
const seenIds = new Set<string>();
const seenQuestions = new Set<string>();

const summary = {
  bySection: {} as Record<string, number>,
  byDifficulty: {} as Record<string, number>,
  byModule: {} as Record<string, number>
};

questions.forEach((q, idx) => {
  const id = q.id || `UNKNOWN_AT_INDEX_${idx}`;

  // 1. Duplicate IDs
  if (!q.id) {
    errors.push({ questionId: id, field: 'id', issue: 'Missing ID' });
  } else if (seenIds.has(q.id)) {
    errors.push({ questionId: q.id, field: 'id', issue: 'Duplicate ID detected' });
  } else {
    seenIds.add(q.id);
  }

  // 2. Duplicate questions
  const cleanQText = (q.question || '').trim().toLowerCase();
  if (!cleanQText) {
    errors.push({ questionId: id, field: 'question', issue: 'Empty question string' });
  } else if (seenQuestions.has(cleanQText)) {
    errors.push({ questionId: id, field: 'question', issue: 'Duplicate question text detected' });
  } else {
    seenQuestions.add(cleanQText);
  }

  // 3. Missing answers
  if (!q.correctAnswer) {
    errors.push({ questionId: id, field: 'correctAnswer', issue: 'Missing correct answer' });
  }

  // 4. Missing explanations
  if (!q.explanation || q.explanation.trim().length === 0) {
    errors.push({ questionId: id, field: 'explanation', issue: 'Missing explanation' });
  }

  // 5. Invalid modules
  if (!q.module || !allValidModules.has(q.module)) {
    errors.push({ questionId: id, field: 'module', issue: `Invalid module: "${q.module}"` });
  }

  // 6. Invalid sections
  if (!q.section || !validSections.has(q.section)) {
    errors.push({ questionId: id, field: 'section', issue: `Invalid section: "${q.section}"` });
  }

  // 7. Questions without exactly 4 options
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    errors.push({ questionId: id, field: 'options', issue: `Does not have exactly 4 options (has ${q.options?.length})` });
  } else {
    // Check for distinct options
    const setOpts = new Set(q.options);
    if (setOpts.size !== 4) {
      errors.push({ questionId: id, field: 'options', issue: 'Options contain duplicate choices' });
    }
  }

  // 8. Multiple correct answers / correct answer not in options
  if (q.options && q.correctAnswer) {
    const matches = q.options.filter(opt => opt === q.correctAnswer);
    if (matches.length === 0) {
      errors.push({ questionId: id, field: 'correctAnswer', issue: 'Correct answer is not present in options' });
    } else if (matches.length > 1) {
      errors.push({ questionId: id, field: 'correctAnswer', issue: 'Multiple identical options match correct answer' });
    }
  }

  // 9. Missing difficulty
  if (!q.difficulty || !validDifficulties.has(q.difficulty)) {
    errors.push({ questionId: id, field: 'difficulty', issue: `Invalid difficulty: "${q.difficulty}"` });
  }

  // 10. Missing topic
  if (!q.topic || q.topic.trim().length === 0) {
    errors.push({ questionId: id, field: 'topic', issue: 'Missing topic' });
  }

  // Aggregates for summary
  summary.bySection[q.section] = (summary.bySection[q.section] || 0) + 1;
  summary.byDifficulty[q.difficulty] = (summary.byDifficulty[q.difficulty] || 0) + 1;
  summary.byModule[q.module] = (summary.byModule[q.module] || 0) + 1;
});

const report: ValidationReport = {
  timestamp: new Date().toISOString(),
  totalQuestions: questions.length,
  totalErrors: errors.length,
  isValid: errors.length === 0,
  errors,
  summary
};

const reportPath = path.resolve('data/validation-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log('=== DATASET VALIDATION REPORT ===');
console.log(`Total Questions: ${questions.length}`);
console.log(`Validation Errors: ${errors.length}`);
console.log(`Validation Status: ${report.isValid ? 'PASSED (100% VALID)' : 'FAILED'}`);
console.log(`Saved report to: ${reportPath}`);

if (!report.isValid) {
  console.error('Errors found:', errors.slice(0, 10));
  process.exit(1);
}
