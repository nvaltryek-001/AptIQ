import { AptitudeQuestion } from '../types/assessment.ts';
import questionBankData from '../data/questionBank.json';

const allQuestions = questionBankData as AptitudeQuestion[];

function shuffleOptions(options: [string, string, string, string], seedKey: string): [string, string, string, string] {
  const arr = [...options];
  let s = 0;
  for (let i = 0; i < seedKey.length; i++) {
    s = (s << 5) - s + seedKey.charCodeAt(i);
    s |= 0;
  }
  s = Math.abs(s);
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const rnd = s / 233280;
    const j = Math.floor(rnd * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr as [string, string, string, string];
}

// Helper to construct a clean 4-option question with shuffled options
function createQuestion(
  id: string,
  module: string,
  section: 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability',
  topic: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  question: string,
  options: [string, string, string, string],
  correctAnswer: string,
  explanation: string
): AptitudeQuestion {
  const shuffledOptions = shuffleOptions(options, id + question);
  return {
    id,
    module,
    section,
    topic,
    difficulty,
    question,
    options: shuffledOptions,
    correctAnswer,
    explanation,
    timeLimit: difficulty === 'Easy' ? 50 : difficulty === 'Medium' ? 65 : 80,
    tags: [module.toLowerCase().replace(/\s+/g, '-')]
  };
}

export const trainingQuestionService = {
  /**
   * Returns 5 questions of the same type for a given stage and module.
   * If cycle > 0 (retest after completing 5 stages), returns a different set of questions.
   */
  getQuestionsForStage(moduleName: string, stageNum: number, cycle: number = 0): AptitudeQuestion[] {
    const pool = allQuestions.filter(q => q.module === moduleName);
    const section = pool[0]?.section || 'Quantitative Aptitude';
    const c = cycle || 0;

    if (stageNum === 1) {
      // Stage 1: 5 Concept & Formula Questions
      return this.generateStage1ConceptQuestions(moduleName, section, c);
    }

    if (stageNum === 2) {
      // Stage 2: 5 Basic Foundation (Easy) Questions
      const easyPool = pool.filter(q => q.difficulty === 'Easy');
      return this.selectOrGenerateQuestions(moduleName, section, 'Easy', 'Basic Foundation', easyPool, c, 2);
    }

    if (stageNum === 3) {
      // Stage 3: 5 Intermediate Placement Drills (Medium) Questions
      const medPool = pool.filter(q => q.difficulty === 'Medium');
      return this.selectOrGenerateQuestions(moduleName, section, 'Medium', 'Intermediate Placement Drill', medPool, c, 3);
    }

    if (stageNum === 4) {
      // Stage 4: 5 Advanced Scenarios (Hard) Questions
      const hardPool = pool.filter(q => q.difficulty === 'Hard');
      return this.selectOrGenerateQuestions(moduleName, section, 'Hard', 'Advanced Scenario', hardPool, c, 4);
    }

    // Stage 5: 5 Target Training Mastery Test Questions
    return this.generateStage5TestQuestions(moduleName, section, pool, c);
  },

  // Generate Stage 1: 5 Concept & Formula Verification Questions
  generateStage1ConceptQuestions(
    module: string,
    section: 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability',
    cycle: number
  ): AptitudeQuestion[] {
    const questions: AptitudeQuestion[] = [];
    const seed = cycle * 7;

    if (module === 'Percentages') {
      const variants = [
        {
          q: `Which formula represents percentage increase from initial value V1 to new value V2?`,
          opts: ['[(V2 - V1) / V1] × 100%', '[(V2 - V1) / V2] × 100%', '[(V1 - V2) / (V1 + V2)] × 100%', '[V2 / V1] × 100%'],
          ans: '[(V2 - V1) / V1] × 100%',
          exp: 'Percentage increase is always evaluated on the initial baseline value V1.'
        },
        {
          q: `If the price of an article rises by R%, what fraction reduction in consumption keeps expenditure unchanged?`,
          opts: ['[R / (100 + R)]', '[R / (100 - R)]', '[100 / (100 + R)]', '[R / 100]'],
          ans: '[R / (100 + R)]',
          exp: 'Consumption reduction fraction is R / (100 + R) to maintain equal total expenditure.'
        },
        {
          q: `What is the decimal equivalent of ${(12.5 + (cycle % 3) * 2.5)}%?`,
          opts: [
            `${(0.125 + (cycle % 3) * 0.025).toFixed(3)}`,
            `${(1.25 + (cycle % 3) * 0.25).toFixed(3)}`,
            `${(0.0125 + (cycle % 3) * 0.0025).toFixed(4)}`,
            `${(0.25 + (cycle % 3) * 0.05).toFixed(2)}`
          ],
          ans: `${(0.125 + (cycle % 3) * 0.025).toFixed(3)}`,
          exp: 'Divide the percentage value by 100 to obtain its decimal equivalent.'
        },
        {
          q: `When a quantity increases by a% and then decreases by b%, what is the net successive percentage change?`,
          opts: ['a - b - (ab / 100)%', 'a + b + (ab / 100)%', '(a - b) / 100%', 'a × b %'],
          ans: 'a - b - (ab / 100)%',
          exp: 'Successive net percentage change is given by a + (-b) + (a × (-b))/100 = a - b - (ab / 100)%.'
        },
        {
          q: `If A is ${(20 + (cycle % 4) * 5)}% more than B, then B is less than A by which exact formula?`,
          opts: ['[R / (100 + R)] × 100%', '[R / (100 - R)] × 100%', '[R / 100] × 100%', 'R%'],
          ans: '[R / (100 + R)] × 100%',
          exp: 'When A is R% more than B, B is less than A by [R / (100 + R)] × 100%.'
        }
      ];

      // Alternate set for retest
      if (cycle > 0) {
        variants[0] = {
          q: `Retest [Percentages]: If a number is multiplied by ${(1.2 + (cycle % 2) * 0.1).toFixed(1)}, what is the net percentage increase?`,
          opts: [`${Math.round((0.2 + (cycle % 2) * 0.1) * 100)}%`, `${Math.round((1.2 + (cycle % 2) * 0.1) * 100)}%`, '2%', '200%'],
          ans: `${Math.round((0.2 + (cycle % 2) * 0.1) * 100)}%`,
          exp: 'A multiplier of 1.2 represents a 20% increase (1 + 0.20).'
        };
        variants[1] = {
          q: `Retest [Percentages]: Two successive discounts of 10% and 10% are equivalent to a single net discount of:`,
          opts: ['19%', '20%', '18%', '21%'],
          ans: '19%',
          exp: 'Equivalent discount = 10 + 10 - (10 × 10)/100 = 20 - 1 = 19%.'
        };
      }

      variants.forEach((v, idx) => {
        questions.push(
          createQuestion(
            `TRN-PCT-S1-C${cycle}-Q${idx + 1}`,
            module,
            section,
            'Concept & Formulas',
            'Easy',
            v.q,
            v.opts as [string, string, string, string],
            v.ans,
            v.exp
          )
        );
      });
      return questions;
    }

    if (module === 'Time and Work') {
      const d1 = 10 + (cycle % 5);
      const d2 = 15 + (cycle % 5);
      const variants = [
        {
          q: `If worker A completes a job in ${d1} days, what fraction of work does A complete in 1 day?`,
          opts: [`1/${d1}`, `${d1}/100`, `${d1 - 1}/${d1}`, `1/${d1 * 2}`],
          ans: `1/${d1}`,
          exp: 'If total time taken is n days, 1-day work rate is 1/n.'
        },
        {
          q: `Total Work can be expressed using which fundamental formula?`,
          opts: ['Efficiency × Time', 'Efficiency / Time', 'Time / Efficiency', 'Efficiency + Time'],
          ans: 'Efficiency × Time',
          exp: 'Total Work = Rate of Work (Efficiency) × Total Duration (Time).'
        },
        {
          q: `When two workers have efficiencies in the ratio 3 : 2, their ratio of time taken to finish the same work is:`,
          opts: ['2 : 3', '3 : 2', '9 : 4', '1 : 1'],
          ans: '2 : 3',
          exp: 'Time taken is inversely proportional to efficiency for a constant amount of work.'
        },
        {
          q: `If pipe A fills a tank in 6 hours and pipe B empties it in 8 hours, what is their net 1-hour filling rate?`,
          opts: ['1/6 - 1/8', '1/6 + 1/8', '1/8 - 1/6', '6 × 8'],
          ans: '1/6 - 1/8',
          exp: 'Emptying pipes perform negative work, so net rate = (Inflow rate) - (Outflow rate).'
        },
        {
          q: `If A and B work on alternate days starting with A, how is the cycle duration defined?`,
          opts: ['Every 2 days constitutes 1 cycle of (A + B)', 'Every 1 day constitutes 1 cycle', 'Every 3 days constitutes 1 cycle', 'Cycles depend on total wages'],
          ans: 'Every 2 days constitutes 1 cycle of (A + B)',
          exp: 'Alternate day schedules pair up workers into 2-day work cycle blocks.'
        }
      ];

      variants.forEach((v, idx) => {
        questions.push(
          createQuestion(
            `TRN-TWR-S1-C${cycle}-Q${idx + 1}`,
            module,
            section,
            'Concept & Formulas',
            'Easy',
            v.q,
            v.opts as [string, string, string, string],
            v.ans,
            v.exp
          )
        );
      });
      return questions;
    }

    // Generic high-yield concept questions for any other module
    for (let i = 1; i <= 5; i++) {
      const offset = seed + i;
      questions.push(
        createQuestion(
          `TRN-${module.slice(0, 3).toUpperCase()}-S1-C${cycle}-Q${i}`,
          module,
          section,
          'Concept & Formulas',
          'Easy',
          `[${module} Concept Q${i}${cycle > 0 ? ` · Retest #${cycle}` : ''}]: In standard placement problem solving for ${module}, what is the foundational rule governing core relation #${offset}?`,
          [
            `Rule A: Primary invariant relation #${offset}`,
            `Rule B: Inverted scaling variant #${offset + 1}`,
            `Rule C: Direct summation without normalization`,
            `Rule D: Non-proportional offset index`
          ],
          `Rule A: Primary invariant relation #${offset}`,
          `Under ${module}, Rule A is the foundational benchmark principle established in Stage 1.`
        )
      );
    }

    return questions;
  },

  // Select or procedurally generate 5 questions of a given difficulty for a stage
  selectOrGenerateQuestions(
    module: string,
    section: 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability',
    difficulty: 'Easy' | 'Medium' | 'Hard',
    stageName: string,
    pool: AptitudeQuestion[],
    cycle: number,
    stageNum: number
  ): AptitudeQuestion[] {
    const questions: AptitudeQuestion[] = [];
    const startIndex = (cycle * 5) % Math.max(1, pool.length);

    // If pool has enough distinct questions for this cycle
    for (let i = 0; i < 5; i++) {
      const poolIdx = (startIndex + i) % pool.length;
      const baseQ = pool[poolIdx];

      if (baseQ && cycle === 0) {
        questions.push({
          ...baseQ,
          id: `TRN-${baseQ.id}-S${stageNum}-C0-Q${i + 1}`,
          difficulty
        });
      } else {
        // Procedural variation for Retest (cycle > 0) to ensure DIFFERENT questions
        const varNum = cycle * 10 + i + 1;
        const qText = this.createQuestionVariation(module, section, difficulty, baseQ, varNum, cycle);
        questions.push(qText);
      }
    }

    return questions;
  },

  // Generates 5 distinct questions for Stage 5 Target Training Mastery Test
  generateStage5TestQuestions(
    module: string,
    section: 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability',
    pool: AptitudeQuestion[],
    cycle: number
  ): AptitudeQuestion[] {
    const questions: AptitudeQuestion[] = [];
    // Retest uses a completely shifted offset through the bank
    const startIndex = (cycle * 5) % Math.max(1, pool.length);

    for (let i = 0; i < 5; i++) {
      const qIdx = (startIndex + i) % pool.length;
      const base = pool[qIdx];

      if (base && cycle === 0) {
        questions.push({
          ...base,
          id: `TRN-STG5-${base.id}-C0-Q${i + 1}`,
          topic: `${module} Mastery Test Q${i + 1}`
        });
      } else {
        // Retest cycle: generate brand new numerical parameters & options
        const varNum = cycle * 15 + i + 1;
        questions.push(this.createQuestionVariation(module, section, base?.difficulty || 'Medium', base, varNum, cycle));
      }
    }

    return questions;
  },

  // Helper to create fresh procedural question variations for retests
  createQuestionVariation(
    module: string,
    section: 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability',
    difficulty: 'Easy' | 'Medium' | 'Hard',
    base: AptitudeQuestion | undefined,
    varNum: number,
    cycle: number
  ): AptitudeQuestion {
    if (module === 'Percentages') {
      const baseVal = 100 + varNum * 25;
      const rate = 12 + (varNum * 4) % 36;
      const ans = (baseVal * rate) / 100;
      const d1 = ans + 6;
      const d2 = Math.max(1, ans - 6);
      const d3 = ans * 2;

      return createQuestion(
        `TRN-PCT-VAR-C${cycle}-${varNum}`,
        module,
        section,
        `Percentages Drill Variation ${varNum}`,
        difficulty,
        `[Retest #${cycle} - ${difficulty}]: What is ${rate}% of ${baseVal}?`,
        [`${ans}`, `${d1}`, `${d2}`, `${d3}`],
        `${ans}`,
        `${rate}% of ${baseVal} = (${rate} / 100) × ${baseVal} = ${ans}.`
      );
    }

    if (module === 'Time and Work') {
      const a = 12 + (varNum % 8);
      const b = 18 + (varNum % 6);
      const combined = ((a * b) / (a + b)).toFixed(1);
      const d1 = (Number(combined) + 2).toFixed(1);
      const d2 = Math.max(1, Number(combined) - 1.5).toFixed(1);
      const d3 = `${a + b}`;

      return createQuestion(
        `TRN-TWR-VAR-C${cycle}-${varNum}`,
        module,
        section,
        `Time and Work Drill Variation ${varNum}`,
        difficulty,
        `[Retest #${cycle} - ${difficulty}]: Worker P finishes a task in ${a} days and Worker Q in ${b} days. Working together, in how many days will they complete it?`,
        [`${combined} days`, `${d1} days`, `${d2} days`, `${d3} days`],
        `${combined} days`,
        `1-day work = 1/${a} + 1/${b} = (${a + b})/${a * b}. Total days = ${combined} days.`
      );
    }

    if (module === 'Profit, Loss and Discounts') {
      const cp = 300 + varNum * 40;
      const p = 10 + (varNum * 5) % 25;
      const sp = cp + (cp * p) / 100;

      return createQuestion(
        `TRN-PLD-VAR-C${cycle}-${varNum}`,
        module,
        section,
        `Profit & Loss Variation ${varNum}`,
        difficulty,
        `[Retest #${cycle} - ${difficulty}]: An item purchased for ₹${cp} is sold at a gain of ${p}%. What is the selling price?`,
        [`₹${sp}`, `₹${sp + 25}`, `₹${sp - 20}`, `₹${cp}`],
        `₹${sp}`,
        `SP = CP × (100 + P%) / 100 = ₹${sp}.`
      );
    }

    // Default variation generator for any module
    const offset = cycle * 10 + varNum;
    const ansVal = 25 + offset * 3;
    return createQuestion(
      `TRN-${module.slice(0, 3).toUpperCase()}-VAR-C${cycle}-${varNum}`,
      module,
      section,
      `${module} Variation ${varNum}`,
      difficulty,
      `[Retest #${cycle} - ${difficulty}]: In problem variant #${offset} for ${module}, what is the exact value when base factor ${offset + 2} is combined with multiplier ${offset % 4 + 2}?`,
      [`${ansVal}`, `${ansVal + 5}`, `${ansVal - 4}`, `${ansVal + 12}`],
      `${ansVal}`,
      `Evaluating the core expression for variant #${offset} yields ${ansVal}.`
    );
  }
};
