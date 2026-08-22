import type { CVEItem } from '../src/api/types';
import { getRecentCves } from '../src/api/endpoints';
import { loadPrefs } from '../src/notifications/prefs';
import {
  assemblePayload,
  buildWidgetPayload,
  countWatchlistHits,
  matchesTerm,
  readWidgetPayload,
  shortSummary,
  updatedLabel,
  writeWidgetPayload,
} from '../src/widgets/data';

jest.mock('../src/api/endpoints', () => ({ getRecentCves: jest.fn() }));
jest.mock('../src/notifications/prefs', () => ({ loadPrefs: jest.fn() }));

const mockRecent = getRecentCves as jest.MockedFunction<typeof getRecentCves>;
const mockPrefs = loadPrefs as jest.MockedFunction<typeof loadPrefs>;

function cve(id: string, score: number | null, description: string, published = '2026-08-20T00:00:00.000'): CVEItem {
  const base = { id, sourceIdentifier: '', published, lastModified: published, vulnStatus: 'Analyzed', descriptions: [{ lang: 'en', value: description }] };
  if (score === null) return { cve: base };
  return {
    cve: {
      ...base,
      metrics: {
        cvssMetricV31: [
          {
            source: 'nvd',
            type: 'Primary',
            exploitabilityScore: 0,
            impactScore: 0,
            cvssData: {
              version: '3.1',
              vectorString: '',
              attackVector: 'NETWORK',
              attackComplexity: 'LOW',
              privilegesRequired: 'NONE',
              userInteraction: 'NONE',
              scope: 'UNCHANGED',
              confidentialityImpact: 'HIGH',
              integrityImpact: 'HIGH',
              availabilityImpact: 'HIGH',
              baseScore: score,
              baseSeverity: 'CRITICAL',
            },
          },
        ],
      },
    },
  } as CVEItem;
}

describe('matchesTerm', () => {
  const item = cve('CVE-2026-1000', 9.8, 'A flaw in Cisco IOS XE allows remote code execution via node.js module.');

  it('matches whole words in the description, case-insensitively', () => {
    expect(matchesTerm(item, 'cisco')).toBe(true);
    expect(matchesTerm(item, 'CISCO IOS')).toBe(true);
    expect(matchesTerm(item, 'node.js')).toBe(true);
  });

  it('does not match partial words', () => {
    expect(matchesTerm(item, 'cis')).toBe(false);
    expect(matchesTerm(item, 'ode')).toBe(false);
  });

  it('matches CVE ids by substring and ignores empty terms', () => {
    expect(matchesTerm(item, '2026-1000')).toBe(true);
    expect(matchesTerm(item, '')).toBe(false);
  });

  it('counts items hit by any term', () => {
    const items = [item, cve('CVE-2026-2', 5, 'Fortinet FortiOS bug'), cve('CVE-2026-3', 4, 'Unrelated')];
    expect(countWatchlistHits(items, ['fortinet', 'cisco'])).toBe(2);
    expect(countWatchlistHits(items, [])).toBe(0);
  });
});

describe('shortSummary / updatedLabel', () => {
  it('collapses whitespace and trims at a word boundary with an ellipsis', () => {
    const long = 'Word '.repeat(40).trim();
    const s = shortSummary(long, 30);
    expect(s.length).toBeLessThanOrEqual(31);
    expect(s.endsWith('…')).toBe(true);
    expect(s).not.toMatch(/ …$/);
    expect(shortSummary('  short   text  ')).toBe('short text');
  });

  it('formats relative time', () => {
    const now = 1_000_000_000_000;
    expect(updatedLabel(0, now)).toBe('never updated');
    expect(updatedLabel(now - 5_000, now)).toBe('updated just now');
    expect(updatedLabel(now - 3 * 60_000, now)).toBe('updated 3m ago');
    expect(updatedLabel(now - 2 * 3_600_000, now)).toBe('updated 2h ago');
    expect(updatedLabel(now - 3 * 86_400_000, now)).toBe('updated 3d ago');
  });
});

describe('assemblePayload', () => {
  it('keeps at most 3 critical rows with id/score/summary and counts watchlist hits', () => {
    const critical = [cve('CVE-1', 9.8, 'One'), cve('CVE-2', 9.9, 'Two'), cve('CVE-3', null, 'Three'), cve('CVE-4', 9.1, 'Four')];
    const recent = [cve('CVE-9', 5, 'Apache httpd issue'), cve('CVE-10', 3, 'Something else')];
    const p = assemblePayload(critical, recent, ['apache'], 123);
    expect(p.updatedAt).toBe(123);
    expect(p.critical).toEqual([
      { id: 'CVE-1', score: 9.8, summary: 'One' },
      { id: 'CVE-2', score: 9.9, summary: 'Two' },
      { id: 'CVE-3', score: null, summary: 'Three' },
    ]);
    expect(p.watchlistHits).toBe(1);
  });
});

describe('buildWidgetPayload (mocked endpoints)', () => {
  beforeEach(() => {
    mockRecent.mockReset();
    mockPrefs.mockReset();
  });

  it('fetches only the critical list when the watchlist is empty', async () => {
    mockPrefs.mockResolvedValue({ critical_cve: true, news_digest: true, watchlist: true, watchlist_terms: [] });
    mockRecent.mockResolvedValue({ resultsPerPage: 3, startIndex: 0, totalResults: 1, vulnerabilities: [cve('CVE-2026-7', 9.8, 'Critical thing')] });
    const p = await buildWidgetPayload();
    expect(mockRecent).toHaveBeenCalledTimes(1);
    expect(mockRecent).toHaveBeenCalledWith(7, 'CRITICAL', 3);
    expect(p.critical[0]).toEqual({ id: 'CVE-2026-7', score: 9.8, summary: 'Critical thing' });
    expect(p.watchlistHits).toBe(0);
  });

  it('also scans recent CVEs for watchlist terms', async () => {
    mockPrefs.mockResolvedValue({ critical_cve: true, news_digest: true, watchlist: true, watchlist_terms: ['vmware'] });
    mockRecent.mockImplementation(async (_days, severity) => ({
      resultsPerPage: 0,
      startIndex: 0,
      totalResults: 0,
      vulnerabilities: severity === 'CRITICAL' ? [] : [cve('CVE-A', 7, 'VMware ESXi bug'), cve('CVE-B', 7, 'vmware vCenter bug'), cve('CVE-C', 2, 'nothing')],
    }));
    const p = await buildWidgetPayload();
    expect(mockRecent).toHaveBeenCalledWith(7, undefined, 100);
    expect(p.critical).toEqual([]);
    expect(p.watchlistHits).toBe(2);
  });

  it('round-trips through AsyncStorage', async () => {
    const payload = { updatedAt: 42, critical: [{ id: 'CVE-X', score: 9.5, summary: 'x' }], watchlistHits: 1 };
    await writeWidgetPayload(payload);
    expect(await readWidgetPayload()).toEqual(payload);
  });
});
