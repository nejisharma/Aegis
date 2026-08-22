import { getPref, setPref } from './storage';

export interface StreakState {
  /** YYYY-MM-DD of the last day with a completed round. */
  lastDay: string | null;
  /** Consecutive days with at least one completed round. */
  days: number;
  /** Rounds completed on `lastDay`. */
  roundsToday: number;
  /** Lifetime completed rounds. */
  totalRounds: number;
}

const KEY = 'phish-streak';
export const DEFAULT_STREAK: StreakState = { lastDay: null, days: 0, roundsToday: 0, totalRounds: 0 };
export const DAILY_GOAL = 3;

export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

/** Pure: apply one completed round on `today` to the streak state. */
export function recordRound(state: StreakState, today: string): StreakState {
  if (state.lastDay === today) {
    return { ...state, roundsToday: state.roundsToday + 1, totalRounds: state.totalRounds + 1 };
  }
  const continues = state.lastDay !== null && daysBetween(state.lastDay, today) === 1;
  return { lastDay: today, days: continues ? state.days + 1 : 1, roundsToday: 1, totalRounds: state.totalRounds + 1 };
}

/** Pure: the streak as it should be displayed today (a missed day resets it to 0 without writing). */
export function effectiveStreak(state: StreakState, today: string): number {
  if (!state.lastDay) return 0;
  const gap = daysBetween(state.lastDay, today);
  return gap <= 1 ? state.days : 0;
}

export const loadStreak = () => getPref<StreakState>(KEY, DEFAULT_STREAK);
export const saveStreak = (s: StreakState) => setPref(KEY, s);
