import { generateThreatEvent } from '../src/lib/threat-simulator';
import { COUNTRY_COORDS } from '../src/lib/geo';
import { cvssSeverity, severityColor, summarizeCve } from '../src/lib/cvss';
import { detectIocType, hashKind } from '../src/lib/ioc';
import { generatePatchDates, getSecondTuesday, getOracleCpuDate, patchDatesInMonth } from '../src/lib/patch-dates';
import { flagEmoji, formatBytes, timeAgo, truncate } from '../src/lib/format';

describe('threat simulator', () => {
  it('produces well-formed events with known countries', () => {
    for (let i = 0; i < 50; i++) {
      const e = generateThreatEvent();
      expect(COUNTRY_COORDS[e.sourceCountryCode]).toBeDefined();
      expect(COUNTRY_COORDS[e.targetCountryCode]).toBeDefined();
      expect(['low', 'medium', 'high', 'critical']).toContain(e.severity);
      expect(e.label).toContain('targeting');
      expect(Math.abs(e.sourceLat - COUNTRY_COORDS[e.sourceCountryCode].lat)).toBeLessThanOrEqual(2);
    }
  });
});

describe('cvss', () => {
  it('maps scores to severities', () => {
    expect(cvssSeverity(0)).toBe('NONE');
    expect(cvssSeverity(3.9)).toBe('LOW');
    expect(cvssSeverity(5)).toBe('MEDIUM');
    expect(cvssSeverity(8.9)).toBe('HIGH');
    expect(cvssSeverity(9)).toBe('CRITICAL');
  });
  it('colors are stable', () => {
    expect(severityColor('CRITICAL')).toBe('#ef4444');
    expect(severityColor('moderate')).toBe('#eab308');
    expect(severityColor('nope')).toBe('#6b7280');
  });
  it('summarizes a CVE without metrics', () => {
    const s = summarizeCve({
      cve: {
        id: 'CVE-2026-1', sourceIdentifier: '', published: '2026-01-01', lastModified: '', vulnStatus: '',
        descriptions: [{ lang: 'es', value: 'hola' }, { lang: 'en', value: 'hello' }],
      },
    });
    expect(s.score).toBeNull();
    expect(s.severity).toBe('NONE');
    expect(s.description).toBe('hello');
  });
});

describe('ioc detection', () => {
  it.each([
    ['8.8.8.8', 'ip'],
    ['2001:db8::1', 'ip'],
    ['example.com', 'domain'],
    ['sub.example.co.uk', 'domain'],
    ['https://evil.example/path', 'url'],
    ['evil.example/login', 'url'],
    ['d41d8cd98f00b204e9800998ecf8427e', 'hash'],
    ['a'.repeat(64), 'hash'],
    ['', 'unknown'],
    ['not a thing!', 'unknown'],
  ])('%s → %s', (input, expected) => {
    expect(detectIocType(input)).toBe(expected);
  });
  it('identifies hash kinds', () => {
    expect(hashKind('a'.repeat(40))).toBe('sha1');
    expect(hashKind('abc')).toBeNull();
  });
});

describe('patch dates', () => {
  it('computes second Tuesday', () => {
    // August 2026: the 1st is a Saturday → first Tuesday Aug 4 → second Aug 11
    expect(getSecondTuesday(2026, 7).getDate()).toBe(11);
  });
  it('computes Oracle CPU closest Tuesday to the 17th', () => {
    const d = getOracleCpuDate(2026, 2)!; // July 2026
    expect(d.getDay()).toBe(2);
    expect(Math.abs(d.getDate() - 17)).toBeLessThanOrEqual(3);
  });
  it('marks exactly one next date and windows the list', () => {
    const list = generatePatchDates(new Date(2026, 7, 21));
    expect(list.filter((d) => d.isNext)).toHaveLength(1);
    expect(list.length).toBeGreaterThanOrEqual(6);
    expect(list.length).toBeLessThanOrEqual(9);
  });
  it('lists dates in a month', () => {
    expect(patchDatesInMonth(2026, 0)).toHaveLength(2);
    expect(patchDatesInMonth(2026, 1)).toHaveLength(1);
  });
});

describe('format', () => {
  it('timeAgo', () => {
    expect(timeAgo(Date.now() - 5 * 60 * 1000)).toBe('5m ago');
    expect(timeAgo('garbage')).toBe('');
  });
  it('bytes and truncate and flags', () => {
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(truncate('abcdef', 4)).toBe('abc…');
    expect(flagEmoji('IN')).toBe('🇮🇳');
    expect(flagEmoji(null)).toBe('');
  });
});
