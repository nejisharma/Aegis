import type { CVEItem, ThreatEvent } from '../api/types';
import { summarizeCve, type Severity } from './cvss';
import { COUNTRY_COORDS } from './geo';

export interface Bucket {
  label: string;
  count: number;
  /** Share of the total, 0..1. */
  pct: number;
}

const SEVERITIES: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const VECTORS = ['NETWORK', 'ADJACENT_NETWORK', 'LOCAL', 'PHYSICAL'];

function toBuckets(labels: string[], counts: Record<string, number>): Bucket[] {
  const total = labels.reduce((s, l) => s + (counts[l] ?? 0), 0);
  return labels.map((label) => {
    const count = counts[label] ?? 0;
    return { label, count, pct: total ? count / total : 0 };
  });
}

/** CRITICAL/HIGH/MEDIUM/LOW counts from a set of NVD items (unscored items are ignored). */
export function severityDistribution(items: CVEItem[]): Bucket[] {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const sev = summarizeCve(item).severity;
    if (sev !== 'NONE') counts[sev] = (counts[sev] ?? 0) + 1;
  }
  return toBuckets(SEVERITIES, counts);
}

/** NETWORK/ADJACENT/LOCAL/PHYSICAL counts from CVSS v3.1 attack vectors. */
export function attackVectorDistribution(items: CVEItem[]): Bucket[] {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const av = summarizeCve(item).attackVector;
    if (av) counts[av.toUpperCase()] = (counts[av.toUpperCase()] ?? 0) + 1;
  }
  return toBuckets(VECTORS, counts).map((b) => ({ ...b, label: b.label === 'ADJACENT_NETWORK' ? 'ADJACENT' : b.label }));
}

export interface CountryCount {
  code: string;
  name: string;
  count: number;
  /** Relative to the top entry, 0..1 — what the web bars use. */
  pct: number;
}

/** Mirrors the web AnalyticsPanel: count events per source or target country, top N. */
export function topCountries(events: ThreatEvent[], side: 'source' | 'target', limit = 10): CountryCount[] {
  const counts: Record<string, number> = {};
  for (const e of events) {
    const code = side === 'source' ? e.sourceCountryCode : e.targetCountryCode;
    counts[code] = (counts[code] ?? 0) + 1;
  }
  const list = Object.entries(counts)
    .map(([code, count]) => ({ code, name: COUNTRY_COORDS[code]?.name ?? code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  const max = list[0]?.count ?? 1;
  return list.map((c) => ({ ...c, pct: c.count / max }));
}

export interface TechniqueUsage {
  id: string;
  name: string;
  count: number;
  pct: number;
}

/** Top ATT&CK techniques by number of APT groups using them (web card 3). */
export function topTechniquesByUsage(
  techniques: { id: string; name: string }[],
  groups: { techniqueIds: string[] }[],
  limit = 10,
): TechniqueUsage[] {
  const names: Record<string, string> = {};
  for (const t of techniques) names[t.id] = t.name;
  const counts: Record<string, number> = {};
  for (const g of groups) for (const tid of g.techniqueIds) counts[tid] = (counts[tid] ?? 0) + 1;
  const list = Object.entries(counts)
    .map(([id, count]) => ({ id, name: names[id] ?? id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  const max = list[0]?.count ?? 1;
  return list.map((t) => ({ ...t, pct: t.count / max }));
}
