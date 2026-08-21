import {
  PHISH_CARDS,
  type PhishCard,
  type PhishDifficulty,
} from '@/data/phish-cards';

const DIFFICULTIES: PhishDifficulty[] = ['easy', 'medium', 'hard'];

describe('PHISH_CARDS dataset', () => {
  it('has exactly 300 cards', () => {
    expect(PHISH_CARDS).toHaveLength(300);
  });

  it('has 100 cards per difficulty', () => {
    for (const difficulty of DIFFICULTIES) {
      const cards = PHISH_CARDS.filter((c) => c.difficulty === difficulty);
      expect(cards).toHaveLength(100);
    }
  });

  it('has a 50/50 phish split within each difficulty', () => {
    for (const difficulty of DIFFICULTIES) {
      const cards = PHISH_CARDS.filter((c) => c.difficulty === difficulty);
      const phish = cards.filter((c) => c.isPhish).length;
      const legit = cards.filter((c) => !c.isPhish).length;
      expect(phish).toBe(50);
      expect(legit).toBe(50);
    }
  });

  it('has unique ids', () => {
    const ids = new Set(PHISH_CARDS.map((c) => c.id));
    expect(ids.size).toBe(PHISH_CARDS.length);
  });

  it('keeps every body at or below 320 characters', () => {
    for (const card of PHISH_CARDS) {
      expect(card.body.length).toBeLessThanOrEqual(320);
    }
  });

  it('gives every card between 1 and 3 tells', () => {
    for (const card of PHISH_CARDS) {
      expect(card.tells.length).toBeGreaterThanOrEqual(1);
      expect(card.tells.length).toBeLessThanOrEqual(3);
    }
  });

  it('only uses valid channel values', () => {
    const channels: PhishCard['channel'][] = ['email', 'sms', 'url', 'chat'];
    for (const card of PHISH_CARDS) {
      expect(channels).toContain(card.channel);
    }
  });
});
