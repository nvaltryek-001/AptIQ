import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseAssessmentTimerOptions {
  assessmentId: string;
  initialDurationSeconds: number;
  onTimeExpired: () => void;
  storageType?: 'localStorage' | 'sessionStorage';
}

export interface AssessmentTimerResult {
  remainingSeconds: number;
  elapsedSeconds: number;
  isRunning: boolean;
  isWarning: boolean; // <= 5 minutes
  isUrgent: boolean;  // <= 1 minute
  formattedTime: string;
  formattedElapsed: string;
  pause: () => void;
  resume: () => void;
  clearPersistedTimer: () => void;
}

interface StoredTimerData {
  assessmentId: string;
  startTimestamp: number;
  endTimestamp: number;
  initialDurationSeconds: number;
}

export function useAssessmentTimer({
  assessmentId,
  initialDurationSeconds,
  onTimeExpired,
  storageType = 'localStorage'
}: UseAssessmentTimerOptions): AssessmentTimerResult {
  const storage = storageType === 'localStorage' ? window.localStorage : window.sessionStorage;
  const storageKey = `aptiq_timer_${assessmentId}`;

  const hasExpiredTriggeredRef = useRef<boolean>(false);
  const onTimeExpiredRef = useRef(onTimeExpired);
  onTimeExpiredRef.current = onTimeExpired;

  // Initialize start/end timestamps from storage or initialize fresh
  const [timerState, setTimerState] = useState<{
    startTimestamp: number;
    endTimestamp: number;
    remaining: number;
  }>(() => {
    try {
      const saved = storage.getItem(storageKey);
      if (saved) {
        const data: StoredTimerData = JSON.parse(saved);
        if (data.assessmentId === assessmentId) {
          const now = Date.now();
          const calcRemaining = Math.max(0, Math.floor((data.endTimestamp - now) / 1000));
          return {
            startTimestamp: data.startTimestamp,
            endTimestamp: data.endTimestamp,
            remaining: calcRemaining
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse persisted assessment timer', e);
    }

    const now = Date.now();
    const end = now + initialDurationSeconds * 1000;
    const initialData: StoredTimerData = {
      assessmentId,
      startTimestamp: now,
      endTimestamp: end,
      initialDurationSeconds
    };
    try {
      storage.setItem(storageKey, JSON.stringify(initialData));
    } catch (e) {
      console.warn('Failed to persist assessment timer', e);
    }

    return {
      startTimestamp: now,
      endTimestamp: end,
      remaining: initialDurationSeconds
    };
  });

  const [isRunning, setIsRunning] = useState<boolean>(true);

  // Helper to clear storage
  const clearPersistedTimer = useCallback(() => {
    try {
      storage.removeItem(storageKey);
    } catch (e) {
      console.warn('Failed to remove persisted timer', e);
    }
  }, [storage, storageKey]);

  // Main countdown tick
  useEffect(() => {
    if (!isRunning) return;

    // Check if already expired on mount/restore
    const now = Date.now();
    const initialRemaining = Math.max(0, Math.floor((timerState.endTimestamp - now) / 1000));
    if (initialRemaining <= 0) {
      setTimerState(prev => ({ ...prev, remaining: 0 }));
      if (!hasExpiredTriggeredRef.current) {
        hasExpiredTriggeredRef.current = true;
        clearPersistedTimer();
        onTimeExpiredRef.current();
      }
      return;
    }

    const interval = setInterval(() => {
      const currentNow = Date.now();
      const currentRemaining = Math.max(0, Math.floor((timerState.endTimestamp - currentNow) / 1000));

      setTimerState(prev => ({
        ...prev,
        remaining: currentRemaining
      }));

      if (currentRemaining <= 0) {
        clearInterval(interval);
        if (!hasExpiredTriggeredRef.current) {
          hasExpiredTriggeredRef.current = true;
          clearPersistedTimer();
          onTimeExpiredRef.current();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timerState.endTimestamp, clearPersistedTimer]);

  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => setIsRunning(true), []);

  const remainingSeconds = timerState.remaining;
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timerState.startTimestamp) / 1000));

  // Time formatters
  const formatSeconds = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isWarning = remainingSeconds > 0 && remainingSeconds <= 300 && remainingSeconds > 60;
  const isUrgent = remainingSeconds > 0 && remainingSeconds <= 60;

  return {
    remainingSeconds,
    elapsedSeconds,
    isRunning,
    isWarning,
    isUrgent,
    formattedTime: formatSeconds(remainingSeconds),
    formattedElapsed: formatSeconds(elapsedSeconds),
    pause,
    resume,
    clearPersistedTimer
  };
}
