import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  where,
  Firestore
} from 'firebase/firestore';
import { AptitudeQuestion } from '../types/assessment.ts';
import { firebaseAuthService } from './firebaseAuthService.ts';

/**
 * Normalizes question text for consistent duplicate detection.
 * Strips numbering/prefix tags (e.g. "Q1 [Percentages]: "), punctuation, and excessive whitespace.
 */
export function normalizeQuestionText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/^q\d+\s*(\[[^\]]+\]\s*:?)?\s*/i, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a question is a duplicate of any question in an existing list.
 * 1. Checks using unique question ID.
 * 2. If IDs are missing or different, falls back to normalized question text.
 */
export function isDuplicateQuestion(
  q: AptitudeQuestion,
  existingList: AptitudeQuestion[]
): boolean {
  const normQ = normalizeQuestionText(q.question);
  for (const existing of existingList) {
    // 1. Check unique question ID
    if (q.id && existing.id && q.id.trim().toLowerCase() === existing.id.trim().toLowerCase()) {
      return true;
    }
    // 2. Fallback to normalized question text
    if (normQ && normalizeQuestionText(existing.question) === normQ) {
      return true;
    }
  }
  return false;
}

/**
 * Filters an array of questions, eliminating any duplicates by ID or normalized question text.
 */
export function deduplicateQuestions(questions: AptitudeQuestion[]): AptitudeQuestion[] {
  const seenIds = new Set<string>();
  const seenTexts = new Set<string>();
  const unique: AptitudeQuestion[] = [];

  for (const q of questions) {
    const idKey = q.id ? q.id.trim().toLowerCase() : '';
    const textKey = normalizeQuestionText(q.question);

    const isDup = (idKey && seenIds.has(idKey)) || (textKey && seenTexts.has(textKey));
    if (!isDup) {
      if (idKey) seenIds.add(idKey);
      if (textKey) seenTexts.add(textKey);
      unique.push(q);
    }
  }

  return unique;
}

class FirebaseQuestionService {
  private db: Firestore | null = null;

  /**
   * Returns active Firestore database instance if Firebase is configured.
   */
  getFirestore(): Firestore | null {
    if (this.db) return this.db;

    if (!firebaseAuthService.isConfigured()) {
      return null;
    }

    try {
      let app: FirebaseApp;
      if (getApps().length === 0) {
        const config = firebaseAuthService.getConfig();
        if (!config) return null;
        app = initializeApp(config);
      } else {
        app = getApp();
      }
      this.db = getFirestore(app);
      return this.db;
    } catch (err) {
      console.warn('[AptIQ Firebase] Firestore initialization failed:', err);
      return null;
    }
  }

  /**
   * Fetches questions from Firestore 'questions' collection.
   * Deduplicates questions so the caller never receives duplicates,
   * even if duplicates exist in the remote database.
   */
  async fetchQuestionsFromFirestore(): Promise<AptitudeQuestion[]> {
    const db = this.getFirestore();
    if (!db) {
      return [];
    }

    try {
      const questionsCol = collection(db, 'questions');
      const snapshot = await getDocs(questionsCol);
      const rawQuestions: AptitudeQuestion[] = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Partial<AptitudeQuestion>;
        if (data.question && data.section) {
          rawQuestions.push({
            id: data.id || docSnap.id,
            section: data.section as any,
            module: data.module || 'General',
            topic: data.topic || 'General',
            difficulty: data.difficulty || 'Medium',
            question: data.question,
            options: data.options || ['', '', '', ''],
            correctAnswer: data.correctAnswer || '',
            explanation: data.explanation || '',
            timeLimit: data.timeLimit || 60,
            tags: data.tags || []
          });
        }
      });

      // Guarantee no duplicate questions are returned
      return deduplicateQuestions(rawQuestions);
    } catch (err) {
      console.warn('[AptIQ Firebase] Failed to fetch questions from Firestore:', err);
      return [];
    }
  }

  /**
   * Adds a question to Firestore 'questions' collection.
   * Avoids inserting duplicate questions into the database:
   * verifies against existing questions using both ID and normalized question text.
   */
  async addQuestionToFirestore(
    question: AptitudeQuestion
  ): Promise<{ success: boolean; duplicate?: boolean; error?: string }> {
    const db = this.getFirestore();
    if (!db) {
      return { success: false, error: 'Firebase Firestore is not configured.' };
    }

    try {
      const existing = await this.fetchQuestionsFromFirestore();
      if (isDuplicateQuestion(question, existing)) {
        return {
          success: false,
          duplicate: true,
          error: `Question already exists in the database (ID: ${question.id}). Duplicate insertion prevented.`
        };
      }

      const docRef = doc(db, 'questions', question.id);
      await setDoc(docRef, { ...question });
      return { success: true };
    } catch (err: any) {
      console.error('[AptIQ Firebase] Failed to insert question into Firestore:', err);
      return { success: false, error: err.message || 'Failed to save question' };
    }
  }

  /**
   * Safely syncs an array of questions to Firestore.
   * Inserts only unique questions and never duplicates existing documents.
   */
  async syncQuestionsToFirestore(
    questions: AptitudeQuestion[]
  ): Promise<{ added: number; skipped: number; total: number }> {
    const db = this.getFirestore();
    if (!db) {
      return { added: 0, skipped: questions.length, total: questions.length };
    }

    const existing = await this.fetchQuestionsFromFirestore();
    const existingList = [...existing];
    let addedCount = 0;
    let skippedCount = 0;

    for (const q of questions) {
      if (isDuplicateQuestion(q, existingList)) {
        skippedCount++;
      } else {
        try {
          const docRef = doc(db, 'questions', q.id);
          await setDoc(docRef, { ...q });
          existingList.push(q);
          addedCount++;
        } catch (e) {
          skippedCount++;
        }
      }
    }

    return { added: addedCount, skipped: skippedCount, total: questions.length };
  }
}

export const firebaseQuestionService = new FirebaseQuestionService();
