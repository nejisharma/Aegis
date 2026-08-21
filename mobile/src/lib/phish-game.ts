import type { PhishCard, PhishDifficulty } from '../data/phish-cards';

export const ROUND_SHAPE: Record<PhishDifficulty, number> = { easy: 3, medium: 4, hard: 3 };
export const ROUND_SIZE = 10;

export const POINTS: Record<PhishDifficulty, number> = { easy: 10, medium: 20, hard: 30 };

export interface Answer {
  card: PhishCard;
  saidPhish: boolean;
  correct: boolean;
  points: number;
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Picks a round: 3 easy, 4 medium, 3 hard, then shuffled so difficulty is not predictable.
 * `exclude` lets the caller avoid cards seen in recent rounds; falls back to the full pool if too few remain.
 */
export function pickRound(cards: PhishCard[], exclude: Set<string> = new Set(), rand: () => number = Math.random): PhishCard[] {
  const round: PhishCard[] = [];
  for (const difficulty of Object.keys(ROUND_SHAPE) as PhishDifficulty[]) {
    const need = ROUND_SHAPE[difficulty];
    const all = cards.filter((c) => c.difficulty === difficulty);
    let pool = all.filter((c) => !exclude.has(c.id));
    if (pool.length < need) pool = all;
    round.push(...shuffle(pool, rand).slice(0, need));
  }
  return shuffle(round, rand);
}

export function scoreAnswer(card: PhishCard, saidPhish: boolean, streak: number): Answer {
  const correct = card.isPhish === saidPhish;
  const bonus = correct ? Math.min(streak, 5) * 2 : 0;
  return { card, saidPhish, correct, points: correct ? POINTS[card.difficulty] + bonus : 0 };
}

export function maxScore(round: PhishCard[]): number {
  // base points + the streak bonus you would earn with a perfect run
  return round.reduce((sum, c, i) => sum + POINTS[c.difficulty] + Math.min(i, 5) * 2, 0);
}

export function gradeFor(score: number, max: number): { title: string; blurb: string } {
  const pct = max ? score / max : 0;
  if (pct >= 0.95) return { title: 'Threat Hunter', blurb: 'Flawless. The SOC wants you on the night shift.' };
  if (pct >= 0.75) return { title: 'Security Analyst', blurb: 'Sharp eye. One or two lures slipped past.' };
  if (pct >= 0.5) return { title: 'Cautious User', blurb: 'Decent instincts; check the sender domain every time.' };
  if (pct >= 0.25) return { title: 'Clicked Twice', blurb: 'Hover before you click. Urgency is the attacker’s favourite tool.' };
  return { title: 'Patient Zero', blurb: 'Ouch. Re-read the tells and try again.' };
}
