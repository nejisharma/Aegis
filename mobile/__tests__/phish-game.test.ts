import type { PhishCard } from '../src/data/phish-cards';
import { gradeFor, maxScore, pickRound, ROUND_SHAPE, scoreAnswer } from '../src/lib/phish-game';

function fakeCards(): PhishCard[] {
  const out: PhishCard[] = [];
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    for (let i = 0; i < 20; i++) {
      out.push({ id: `${difficulty}-${i}`, difficulty, channel: 'email', from: 'x', body: 'b', isPhish: i % 2 === 0, tells: ['t'] });
    }
  }
  return out;
}

describe('pickRound', () => {
  it('returns 10 cards with 3 easy / 4 medium / 3 hard', () => {
    const round = pickRound(fakeCards());
    expect(round).toHaveLength(10);
    for (const d of ['easy', 'medium', 'hard'] as const) {
      expect(round.filter((c) => c.difficulty === d)).toHaveLength(ROUND_SHAPE[d]);
    }
    expect(new Set(round.map((c) => c.id)).size).toBe(10);
  });

  it('avoids excluded cards when enough remain, and falls back otherwise', () => {
    const cards = fakeCards();
    const exclude = new Set(cards.filter((c) => c.difficulty === 'easy').slice(0, 10).map((c) => c.id));
    const round = pickRound(cards, exclude);
    expect(round.filter((c) => exclude.has(c.id))).toHaveLength(0);

    const all = new Set(cards.filter((c) => c.difficulty === 'hard').map((c) => c.id));
    const fallback = pickRound(cards, all);
    expect(fallback.filter((c) => c.difficulty === 'hard')).toHaveLength(3);
  });

  it('is deterministic with a seeded rand', () => {
    let s = 1;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    let t = 1;
    const rand2 = () => ((t = (t * 16807) % 2147483647) / 2147483647);
    expect(pickRound(fakeCards(), new Set(), rand).map((c) => c.id)).toEqual(pickRound(fakeCards(), new Set(), rand2).map((c) => c.id));
  });
});

describe('scoring', () => {
  const card = fakeCards()[0]; // easy, isPhish true
  it('awards base points plus streak bonus on correct answers', () => {
    expect(scoreAnswer(card, true, 0).points).toBe(10);
    expect(scoreAnswer(card, true, 3).points).toBe(16);
    expect(scoreAnswer(card, true, 9).points).toBe(20);
  });
  it('awards nothing on wrong answers', () => {
    const a = scoreAnswer(card, false, 4);
    expect(a.correct).toBe(false);
    expect(a.points).toBe(0);
  });
  it('maxScore matches a perfect run', () => {
    const round = pickRound(fakeCards());
    let streak = 0;
    let total = 0;
    for (const c of round) {
      total += scoreAnswer(c, c.isPhish, streak).points;
      streak += 1;
    }
    expect(maxScore(round)).toBe(total);
  });
  it('grades', () => {
    expect(gradeFor(100, 100).title).toBe('Threat Hunter');
    expect(gradeFor(0, 100).title).toBe('Patient Zero');
  });
});

import { DEFAULT_STREAK, effectiveStreak, recordRound } from '../src/lib/streak';

describe('daily streak', () => {
  it('starts at 1, continues on consecutive days, resets after a gap', () => {
    let s = recordRound(DEFAULT_STREAK, '2026-08-21');
    expect(s.days).toBe(1);
    expect(s.roundsToday).toBe(1);
    s = recordRound(s, '2026-08-21');
    expect(s.roundsToday).toBe(2);
    expect(s.days).toBe(1);
    s = recordRound(s, '2026-08-22');
    expect(s.days).toBe(2);
    expect(s.roundsToday).toBe(1);
    s = recordRound(s, '2026-08-25');
    expect(s.days).toBe(1);
    expect(s.totalRounds).toBe(4);
  });
  it('effectiveStreak shows 0 once a day has been missed', () => {
    const s = recordRound(DEFAULT_STREAK, '2026-08-21');
    expect(effectiveStreak(s, '2026-08-22')).toBe(1);
    expect(effectiveStreak(s, '2026-08-23')).toBe(0);
  });
});
