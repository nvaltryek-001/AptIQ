import fs from 'fs';
import path from 'path';

export interface Question {
  id: string;
  section: 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability';
  module: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  options: [string, string, string, string];
  correctAnswer: string;
  explanation: string;
  timeLimit: number;
  tags: string[];
}

export const MODULES = {
  quantitative: [
    'Number System',
    'HCF and LCM',
    'Decimal Fractions',
    'Simplification',
    'Percentages',
    'Profit, Loss and Discounts',
    'Simple and Compound Interest',
    'Ratios, Proportions and Variations',
    'Partnership',
    'Ages',
    'Averages',
    'Alligations and Mixtures',
    'Time and Work',
    'Time, Speed and Distance',
    'Trains, Boats and Streams, Races',
    'Permutation and Combination',
    'Probability',
    'Data Interpretation',
    'Mensuration'
  ],
  logical: [
    'Blood Relations',
    'Direction Sense Test',
    'Series',
    'Coding and Decoding',
    'Analogy',
    'Seating Arrangement',
    'Data Arrangement',
    'Clocks',
    'Calendars',
    'Syllogisms',
    'Data Sufficiency',
    'Cubes',
    'Visual Reasoning',
    'Cryptarithmetic'
  ],
  verbal: [
    'Articles and Prepositions',
    'Tenses and Subject-Verb Agreement',
    'Change of Voice and Speech',
    'Error Spotting and Sentence Correction',
    'Synonyms, Antonyms, and Verbal Analogy',
    'Sentence Completion and One-Word Substitution',
    'Para Jumbles and Cloze Test',
    'Reading Comprehension',
    'Critical Reasoning'
  ]
};

// Generates slug from module name
export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
