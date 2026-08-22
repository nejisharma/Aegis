import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickNewCriticalCves, buildDigest, cveMatchesTerm, pickWatchlistHits } from './detectors';
import type { CVEItem } from '../../types/cve';
import type { NewsItem } from '../../types/news';

function cve(id: string, score: number): CVEItem {
  return {
    cve: {
      id,
      sourceIdentifier: 'x',
      published: '2026-08-21T00:00:00Z',
      lastModified: '2026-08-21T00:00:00Z',
      vulnStatus: 'Analyzed',
      descriptions: [{ lang: 'en', value: `Description of ${id}` }],
      metrics: {
        cvssMetricV31: [
          {
            source: 'nvd', type: 'Primary', exploitabilityScore: 1, impactScore: 1,
            cvssData: {
              version: '3.1', vectorString: '', attackVector: '', attackComplexity: '',
              privilegesRequired: '', userInteraction: '', scope: '', confidentialityImpact: '',
              integrityImpact: '', availabilityImpact: '', baseScore: score,
              baseSeverity: score >= 9 ? 'CRITICAL' : 'HIGH',
            },
          },
        ],
      },
    },
  };
}

function news(id: string, title: string): NewsItem {
  return { id, title, link: 'https://x', description: '', pubDate: '2026-08-21T00:00:00Z', source: 'S', sourceIcon: '' };
}

test('pickNewCriticalCves filters seen, below 9.0, and caps', () => {
  const vulns = [cve('CVE-1', 9.8), cve('CVE-2', 7.5), cve('CVE-3', 9.0), cve('CVE-4', 10), cve('CVE-5', 9.1)];
  const out = pickNewCriticalCves(vulns, new Set(['CVE-4']), 2);
  assert.deepEqual(out.map((v) => v.cve.id), ['CVE-1', 'CVE-3']);
});

test('pickNewCriticalCves ignores items without v3.1 metrics', () => {
  const item = cve('CVE-9', 9.9);
  delete item.cve.metrics;
  assert.deepEqual(pickNewCriticalCves([item], new Set()), []);
});

test('buildDigest returns null when nothing new', () => {
  assert.equal(buildDigest([news('a', 'A')], new Set(['a']), null, new Date()), null);
});

test('buildDigest returns null when last digest is recent', () => {
  const now = new Date('2026-08-21T12:00:00Z');
  assert.equal(buildDigest([news('a', 'A')], new Set(), '2026-08-21T10:30:00Z', now), null);
});

test('buildDigest counts new items when older than 3h', () => {
  const now = new Date('2026-08-21T12:00:00Z');
  const d = buildDigest([news('a', 'A'), news('b', 'B'), news('c', 'C')], new Set(['c']), '2026-08-21T08:00:00Z', now);
  assert.ok(d);
  assert.equal(d.count, 2);
  assert.equal(d.newest.id, 'a');
  assert.deepEqual(d.newIds, ['a', 'b']);
});

test('cveMatchesTerm matches words in the description and ids, not substrings of other words', () => {
  const item = cve('CVE-2026-1', 5);
  item.cve.descriptions = [{ lang: 'en', value: 'A flaw in Fortinet FortiOS SSL-VPN allows remote code execution.' }];
  assert.equal(cveMatchesTerm(item, 'fortinet'), true);
  assert.equal(cveMatchesTerm(item, 'fortios'), true);
  assert.equal(cveMatchesTerm(item, 'ssl-vpn'), true);
  assert.equal(cveMatchesTerm(item, 'forti'), false);
  assert.equal(cveMatchesTerm(item, 'cve-2026-1'), true);
});

test('pickWatchlistHits returns unseen matches with the term, capped', () => {
  const a = cve('CVE-1', 5); a.cve.descriptions = [{ lang: 'en', value: 'Apache HTTP Server bug' }];
  const b = cve('CVE-2', 5); b.cve.descriptions = [{ lang: 'en', value: 'Microsoft Exchange bug' }];
  const c = cve('CVE-3', 5); c.cve.descriptions = [{ lang: 'en', value: 'Apache Tomcat bug' }];
  const hits = pickWatchlistHits([a, b, c], ['exchange', 'apache'], new Set(['CVE-3']), 5);
  assert.deepEqual(hits.map((h) => [h.cve.cve.id, h.term]), [['CVE-1', 'apache'], ['CVE-2', 'exchange']]);
});
