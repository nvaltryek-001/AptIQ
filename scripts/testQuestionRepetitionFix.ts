import { assessmentEngine, QuestionDeduplicator, normalizeQuestionText, isDuplicateQuestion, deduplicateQuestions } from '../src/services/assessmentEngine.ts';
import { firebaseQuestionService } from '../src/services/firebaseQuestionService.ts';
import { AptitudeQuestion, ASSESSMENT_BLUEPRINTS, AssessmentSize } from '../src/types/assessment.ts';
import { storageService, defaultStudentUser } from '../src/services/storageService.ts';

// Simple assertion helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('====================================================');
console.log('   AptIQ QUESTION REPETITION FIX VERIFICATION TEST  ');
console.log('====================================================\n');

// ---------------------------------------------------------------------------
// TEST SCENARIO 1: Start a test with 20 questions and verify all 20 are unique
// ---------------------------------------------------------------------------
console.log('--- TEST SCENARIO 1: 20-Question Test Uniqueness ---');
{
  const { questions, blueprint } = assessmentEngine.generateAssessment(20);
  assert(questions.length === 20, `Generated exactly 20 questions (got ${questions.length})`);
  assert(blueprint.size === 20, `Blueprint size is 20`);

  // Check unique IDs
  const idSet = new Set(questions.map(q => q.id));
  assert(idSet.size === 20, `All 20 question IDs are unique (unique count: ${idSet.size})`);

  // Check unique normalized question texts
  const textSet = new Set(questions.map(q => normalizeQuestionText(q.question)));
  assert(textSet.size === 20, `All 20 normalized question texts are unique (unique count: ${textSet.size})`);

  // Section breakdown checks for 20 questions
  const quantCount = questions.filter(q => q.section === 'Quantitative Aptitude').length;
  const logicCount = questions.filter(q => q.section === 'Logical Reasoning').length;
  const verbalCount = questions.filter(q => q.section === 'Verbal Ability').length;
  console.log(`   Section breakdown: Quant=${quantCount}, Logic=${logicCount}, Verbal=${verbalCount}`);
  assert(quantCount === 7, `Quantitative section has exactly 7 questions`);
  assert(logicCount === 7, `Logical Reasoning section has exactly 7 questions`);
  assert(verbalCount === 6, `Verbal Ability section has exactly 6 questions`);
  assert(quantCount + logicCount + verbalCount === 20, `Sum of section questions equals 20`);
}
console.log('');

// ---------------------------------------------------------------------------
// TEST SCENARIO 2: Randomization between consecutive tests
// ---------------------------------------------------------------------------
console.log('--- TEST SCENARIO 2: Question Combination & Order Randomization ---');
{
  const test1 = assessmentEngine.generateAssessment(20);
  const test2 = assessmentEngine.generateAssessment(20);
  const test3 = assessmentEngine.generateAssessment(30);
  const test4 = assessmentEngine.generateAssessment(30);

  const ids1 = test1.questions.map(q => q.id);
  const ids2 = test2.questions.map(q => q.id);

  // 1. Combination should not be identical
  const identicalOrder = ids1.every((id, idx) => id === ids2[idx]);
  assert(!identicalOrder, `Question order is randomized between test runs`);

  // 2. Set of questions should differ between runs
  const set1 = new Set(ids1);
  const commonInTest2 = ids2.filter(id => set1.has(id));
  console.log(`   Common questions between Test 1 (20Q) and Test 2 (20Q): ${commonInTest2.length}/20`);
  assert(commonInTest2.length < 20, `New test run selects a distinct randomized question combination`);

  // 3. First question is not always from the same section/module
  const firstQuestions = [
    test1.questions[0],
    test2.questions[0],
    test3.questions[0],
    test4.questions[0]
  ];
  console.log('   First questions across 4 independent tests:');
  firstQuestions.forEach((q, i) => console.log(`     Test ${i + 1}: [${q.section} - ${q.module}] ${q.id}`));
  assert(
    new Set(firstQuestions.map(q => q.id)).size > 1,
    `Initial question is not repetitively picking the same question from the bank`
  );
}
console.log('');

// ---------------------------------------------------------------------------
// TEST SCENARIO 3: Duplicate prevention across different aptitude categories
// ---------------------------------------------------------------------------
console.log('--- TEST SCENARIO 3: Cross-Category Duplicate Prevention ---');
{
  // Test with larger tests (60, 90, 120 questions) to verify high volume uniqueness
  [30, 60, 90, 120].forEach(size => {
    const { questions } = assessmentEngine.generateAssessment(size as AssessmentSize);
    const deduplicator = new QuestionDeduplicator();
    let hasDuplicate = false;

    for (const q of questions) {
      if (deduplicator.isDuplicate(q)) {
        hasDuplicate = true;
        console.error(`   Found cross-category duplicate: ${q.id} - "${q.question}"`);
        break;
      }
      deduplicator.add(q);
    }
    assert(!hasDuplicate, `Zero duplicates across all categories in ${size}-question test`);
    assert(deduplicator.size() === size, `Deduplicator registered exactly ${size} distinct questions`);
  });

  // Edge case: Test with simulated Firebase duplicate questions
  // Two questions with different IDs but identical normalized text
  const originalBank = assessmentEngine.getAllQuestions();
  const simulatedDuplicates: AptitudeQuestion[] = [
    ...originalBank.slice(0, 50),
    // Duplicate 1: same question text, different simulated Firestore ID
    {
      ...originalBank[0],
      id: 'FB_AUTO_DOC_ID_99999',
      question: `   ${originalBank[0].question.toUpperCase()}   ` // different case & whitespace
    },
    // Duplicate 2: same ID, different formatting
    {
      ...originalBank[1],
      id: originalBank[1].id
    }
  ];

  const deduplicatedBank = deduplicateQuestions(simulatedDuplicates);
  assert(
    deduplicatedBank.length === 50,
    `deduplicateQuestions cleanly stripped simulated duplicate Firestore documents (from ${simulatedDuplicates.length} to ${deduplicatedBank.length})`
  );
}
console.log('');

// ---------------------------------------------------------------------------
// TEST SCENARIO 4: Insufficient questions handling
// ---------------------------------------------------------------------------
console.log('--- TEST SCENARIO 4: Insufficient Questions Handling ---');
{
  // Test requesting an impossible number of questions (e.g. 5000)
  const checkHuge = assessmentEngine.validateQuestionAvailability(5000);
  assert(!checkHuge.available, `validateQuestionAvailability correctly flags 5000 questions as unavailable`);
  assert(Boolean(checkHuge.error), `Returns clear descriptive warning message: "${checkHuge.error}"`);

  // Verify generateAssessment throws an error instead of repeating questions
  let threw = false;
  try {
    assessmentEngine.generateAssessment(5000 as any);
  } catch (err: any) {
    threw = true;
    assert(err.message.includes('Insufficient'), `generateAssessment throws error with clear insufficient warning`);
  }
  assert(threw, `Never silently pads or repeats questions when insufficient`);

  // Test restricted pool: only 5 questions available for a 20-question test
  const originalBank = assessmentEngine.getAllQuestions();
  try {
    assessmentEngine.setQuestionBank(originalBank.slice(0, 5));
    const smallCheck = assessmentEngine.validateQuestionAvailability(20);
    assert(!smallCheck.available, `Correctly identifies insufficient questions when bank has only 5 questions`);
    console.log(`   Insufficient warning message: "${smallCheck.error}"`);
  } finally {
    // Restore original question bank
    assessmentEngine.setQuestionBank(originalBank);
  }
}
console.log('');

// ---------------------------------------------------------------------------
// TEST SCENARIO 5: Scoring and Result Calculation Verification
// ---------------------------------------------------------------------------
console.log('--- TEST SCENARIO 5: Scoring and Result Calculation ---');
{
  const { questions, blueprint } = assessmentEngine.generateAssessment(20);
  const answers: Record<string, any> = {};

  // Answer 15 correctly, 3 wrongly, 2 unanswered
  questions.forEach((q, idx) => {
    if (idx < 15) {
      answers[q.id] = {
        questionId: q.id,
        selectedOption: q.correctAnswer,
        isMarkedForReview: false,
        timeSpentSeconds: 40
      };
    } else if (idx < 18) {
      // Pick a wrong option
      const wrong = q.options.find(opt => opt !== q.correctAnswer) || q.options[0];
      answers[q.id] = {
        questionId: q.id,
        selectedOption: wrong,
        isMarkedForReview: true,
        timeSpentSeconds: 50
      };
    }
    // remaining 2 are left unanswered
  });

  const attempt = assessmentEngine.scoreAssessment(
    'test_user_001',
    20,
    Date.now() - 1000 * 60 * 15,
    900,
    answers,
    questions.map(q => q.id)
  );

  assert(attempt.totalQuestions === 20, `Scored attempt totalQuestions is 20`);
  assert(attempt.correctCount === 15, `Correct count is 15 (got ${attempt.correctCount})`);
  assert(attempt.wrongCount === 3, `Wrong count is 3 (got ${attempt.wrongCount})`);
  assert(attempt.unansweredCount === 2, `Unanswered count is 2 (got ${attempt.unansweredCount})`);
  assert(attempt.score === 15, `Score is 15`);
  assert(attempt.percentage === 75, `Percentage is 75% (got ${attempt.percentage}%)`);
  assert(attempt.accuracy === Math.round((15 / 18) * 100), `Accuracy is 83% (got ${attempt.accuracy}%)`);
  assert(attempt.sectionBreakdown.length === 3, `Section breakdown has 3 sections`);
  assert(attempt.topicBreakdown.length > 0, `Topic breakdown generated with ${attempt.topicBreakdown.length} topics`);

  // Verify attempt questionIds has 0 duplicates
  const scoredIdSet = new Set(attempt.questionIds);
  assert(scoredIdSet.size === 20, `Attempt questionIds array contains 0 duplicate questions`);
}
console.log('');

// ---------------------------------------------------------------------------
// TEST SCENARIO 6: Firebase Question Service Duplicate Prevention
// ---------------------------------------------------------------------------
console.log('--- TEST SCENARIO 6: Firebase Question Service ---');
{
  const sampleQ: AptitudeQuestion = {
    id: 'QA-TEST-001',
    section: 'Quantitative Aptitude',
    module: 'Percentages',
    topic: 'Basic Percentage',
    difficulty: 'Easy',
    question: 'What is 25% of 400?',
    options: ['100', '120', '80', '150'],
    correctAnswer: '100',
    explanation: '25% of 400 is 100.',
    timeLimit: 60,
    tags: ['percentages']
  };

  const dupByText: AptitudeQuestion = {
    ...sampleQ,
    id: 'DIFFERENT-ID-999', // Different ID
    question: '   what is 25% of 400?   ' // Identical text with extra whitespace and lowercase
  };

  const isDup = isDuplicateQuestion(dupByText, [sampleQ]);
  assert(isDup, `isDuplicateQuestion detects duplicate by normalized text even with different ID`);

  const dupById: AptitudeQuestion = {
    ...sampleQ,
    question: 'A completely different question text but same ID'
  };
  assert(isDuplicateQuestion(dupById, [sampleQ]), `isDuplicateQuestion detects duplicate by ID`);

  console.log('✅ Firebase duplicate detection verified.');
}
console.log('\n====================================================');
console.log('  ALL TESTS PASSED: NO QUESTION REPETITION DETECTED ');
console.log('====================================================');
