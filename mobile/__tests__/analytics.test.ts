import type { CVEItem, ThreatEvent } from '../src/api/types';
import {
  attackVectorDistribution,
  donutArcs,
  groupCounts,
  severityCounts,
  severityDistribution,
  threatRadar,
  threatTypeDistribution,
  topCountries,
  topTechniquesByUsage,
} from '../src/lib/analytics';
import { generateBatch } from '../src/lib/threat-simulator';

function cve(id: string, score: number | null, attackVector = 'NETWORK'): CVEItem {
  const base = { id, sourceIdentifier: '', published: '2024-01-01', lastModified: '2024-01-01', vulnStatus: 'Analyzed', descriptions: [{ lang: 'en', value: id }] };
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
              attackVector,
              attackComplexity: 'LOW',
              privilegesRequired: 'NONE',
              userInteraction: 'NONE',
              scope: 'UNCHANGED',
              confidentialityImpact: 'HIGH',
              integrityImpact: 'HIGH',
              availabilityImpact: 'HIGH',
              baseScore: score,
              baseSeverity: '',
            },
          },
        ],
      },
    },
  };
}

const items = [cve('a', 9.8), cve('b', 7.5, 'LOCAL'), cve('c', 7.0, 'ADJACENT_NETWORK'), cve('d', 4.3, 'PHYSICAL'), cve('e', 2.0), cve('f', null)];

describe('analytics helpers', () => {
  it('buckets CVSS severities and ignores unscored items', () => {
    const dist = severityDistribution(items);
    expect(dist.map((b) => [b.label, b.count])).toEqual([
      ['CRITICAL', 1],
      ['HIGH', 2],
      ['MEDIUM', 1],
      ['LOW', 1],
    ]);
    expect(dist[1].pct).toBeCloseTo(0.4);
    expect(severityDistribution([]).every((b) => b.count === 0 && b.pct === 0)).toBe(true);
  });

  it('buckets attack vectors with ADJACENT normalised', () => {
    const dist = attackVectorDistribution(items);
    expect(dist.map((b) => [b.label, b.count])).toEqual([
      ['NETWORK', 2],
      ['ADJACENT', 1],
      ['LOCAL', 1],
      ['PHYSICAL', 1],
    ]);
  });

  it('ranks countries by event count with bars relative to the top entry', () => {
    const ev = (s: string, t: string): ThreatEvent => ({
      id: `${s}${t}`,
      sourceCountry: s,
      sourceCountryCode: s,
      sourceLat: 0,
      sourceLng: 0,
      targetCountry: t,
      targetCountryCode: t,
      targetLat: 0,
      targetLng: 0,
      type: 'malware',
      severity: 'low',
      timestamp: 0,
      label: '',
    });
    const events = [ev('CN', 'US'), ev('CN', 'GB'), ev('RU', 'US')];
    const src = topCountries(events, 'source');
    expect(src.map((c) => [c.code, c.count, c.pct])).toEqual([
      ['CN', 2, 1],
      ['RU', 1, 0.5],
    ]);
    expect(src[0].name).toBe('China');
    const tgt = topCountries(events, 'target', 1);
    expect(tgt).toHaveLength(1);
    expect(tgt[0].code).toBe('US');
  });

  it('works on a simulated batch', () => {
    const batch = generateBatch(200);
    const src = topCountries(batch, 'source', 5);
    expect(src.length).toBeGreaterThan(0);
    expect(src.length).toBeLessThanOrEqual(5);
    expect(src[0].pct).toBe(1);
  });

  it('ranks techniques by group usage', () => {
    const top = topTechniquesByUsage([{ id: 'T1', name: 'Phishing' }], [{ techniqueIds: ['T1', 'T2'] }, { techniqueIds: ['T1'] }]);
    expect(top).toEqual([
      { id: 'T1', name: 'Phishing', count: 2, pct: 1 },
      { id: 'T2', name: 'T2', count: 1, pct: 0.5 },
    ]);
  });
});

describe('analytics (website parity helpers)', () => {
  const ev = (type: ThreatEvent['type'], severity: ThreatEvent['severity'] = 'low'): ThreatEvent => ({
    id: `${type}-${Math.random()}`,
    sourceCountry: 'China',
    sourceCountryCode: 'CN',
    sourceLat: 0,
    sourceLng: 0,
    targetCountry: 'United States',
    targetCountryCode: 'US',
    targetLat: 0,
    targetLng: 0,
    type,
    severity,
    timestamp: Date.now(),
    label: '',
  });

  it('threatTypeDistribution counts and sorts with web colours', () => {
    const d = threatTypeDistribution([ev('malware'), ev('ddos'), ev('malware')]);
    expect(d).toEqual([
      { type: 'malware', count: 2, color: '#ef4444' },
      { type: 'ddos', count: 1, color: '#3b82f6' },
    ]);
    expect(threatTypeDistribution([])).toEqual([]);
  });

  it('severityCounts always returns the four buckets in order', () => {
    const c = severityCounts([ev('apt', 'critical'), ev('apt', 'low'), ev('apt', 'low')]);
    expect(c).toEqual([
      { severity: 'critical', count: 1 },
      { severity: 'high', count: 0 },
      { severity: 'medium', count: 0 },
      { severity: 'low', count: 2 },
    ]);
  });

  it('threatRadar normalises to 0–100 against the busiest type, in web label order', () => {
    const r = threatRadar([ev('malware'), ev('malware'), ev('malware'), ev('malware'), ev('phishing')]);
    expect(r.map((a) => a.label)).toEqual(['Malware', 'Phishing', 'Exploit', 'DDoS', 'Ransomware', 'APT', 'Bruteforce']);
    expect(r[0].value).toBe(100);
    expect(r[1].value).toBe(25);
    expect(r[2].value).toBe(0);
    expect(threatRadar([]).every((a) => a.value === 0)).toBe(true);
  });

  it('groupCounts honours limit and falls back to unknown', () => {
    const items = [{ t: 'botnet_cc' }, { t: 'botnet_cc' }, { t: null }, { t: '' }, { t: 'payload' }];
    const g = groupCounts(items, (i) => i.t, 2);
    expect(g).toEqual([
      { label: 'botnet_cc', count: 2, pct: 0.4 },
      { label: 'unknown', count: 2, pct: 0.4 },
    ]);
    expect(groupCounts([], () => 'x')).toEqual([]);
  });

  it('donutArcs spans 360° in proportion', () => {
    const arcs = donutArcs([1, 3]);
    expect(arcs[0]).toEqual({ startAngle: 0, endAngle: 90, pct: 0.25 });
    expect(arcs[1]).toEqual({ startAngle: 90, endAngle: 360, pct: 0.75 });
    const many = donutArcs([5, 7, 11, 13]);
    expect(many[many.length - 1].endAngle).toBeCloseTo(360);
    expect(many.reduce((s, a) => s + (a.endAngle - a.startAngle), 0)).toBeCloseTo(360);
    expect(many.reduce((s, a) => s + a.pct, 0)).toBeCloseTo(1);
  });

  it('donutArcs handles a single slice and degenerate input', () => {
    expect(donutArcs([42])).toEqual([{ startAngle: 0, endAngle: 360, pct: 1 }]);
    expect(donutArcs([0, 0])).toEqual([
      { startAngle: 0, endAngle: 0, pct: 0 },
      { startAngle: 0, endAngle: 0, pct: 0 },
    ]);
    expect(donutArcs([2, -1, NaN])).toEqual([
      { startAngle: 0, endAngle: 360, pct: 1 },
      { startAngle: 360, endAngle: 360, pct: 0 },
      { startAngle: 360, endAngle: 360, pct: 0 },
    ]);
  });
});
