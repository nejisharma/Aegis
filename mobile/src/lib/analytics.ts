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

// ---- Website AnalyticsPanel parity (live simulated-event cards, ThreatFox / MalwareBazaar grouping) ----

export type ThreatType = ThreatEvent['type'];
export type EventSeverity = ThreatEvent['severity'];

/** Same hex colours as the web `typeColors`. */
export const THREAT_TYPE_COLORS: Record<ThreatType, string> = {
  malware: '#ef4444',
  phishing: '#f59e0b',
  exploit: '#f97316',
  ddos: '#3b82f6',
  bruteforce: '#8b5cf6',
  ransomware: '#ec4899',
  apt: '#06b6d4',
};

/** Axis labels in the same order as the web radar. */
export const THREAT_RADAR_LABELS: Record<ThreatType, string> = {
  malware: 'Malware',
  phishing: 'Phishing',
  exploit: 'Exploit',
  ddos: 'DDoS',
  ransomware: 'Ransomware',
  apt: 'APT',
  bruteforce: 'Bruteforce',
};

/** Web colour lists for the ThreatFox and MalwareBazaar cards. */
export const IOC_TYPE_COLORS = ['#06b6d4', '#a855f7', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];
export const FILE_TYPE_COLORS = ['#ef4444', '#f97316', '#eab308', '#10b981', '#3b82f6', '#a855f7', '#06b6d4', '#ec4899'];

export interface TypeCount {
  type: ThreatType;
  count: number;
  color: string;
}

/** Web card "Attack Types": counts per event type, sorted descending (types with zero events omitted). */
export function threatTypeDistribution(events: ThreatEvent[]): TypeCount[] {
  const counts: Partial<Record<ThreatType, number>> = {};
  for (const e of events) counts[e.type] = (counts[e.type] ?? 0) + 1;
  return (Object.entries(counts) as [ThreatType, number][])
    .map(([type, count]) => ({ type, count, color: THREAT_TYPE_COLORS[type] ?? '#6b7280' }))
    .sort((a, b) => b.count - a.count);
}

const EVENT_SEVERITIES: EventSeverity[] = ['critical', 'high', 'medium', 'low'];

/** Web card "Threat Severity": all four buckets, always present, in critical→low order. */
export function severityCounts(events: ThreatEvent[]): { severity: EventSeverity; count: number }[] {
  const counts: Record<EventSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const e of events) counts[e.severity]++;
  return EVENT_SEVERITIES.map((severity) => ({ severity, count: counts[severity] }));
}

/** Web card "Threat Radar": each type's count normalised 0–100 against the busiest type. */
export function threatRadar(events: ThreatEvent[]): { label: string; value: number }[] {
  const counts: Partial<Record<ThreatType, number>> = {};
  for (const e of events) counts[e.type] = (counts[e.type] ?? 0) + 1;
  const max = Math.max(1, ...Object.values(counts).map((n) => n ?? 0));
  return (Object.entries(THREAT_RADAR_LABELS) as [ThreatType, string][]).map(([key, label]) => ({
    label,
    value: Math.round(((counts[key] ?? 0) / max) * 100),
  }));
}

export interface GroupCount {
  label: string;
  count: number;
  /** Share of all items (not just the kept top-N), 0..1. */
  pct: number;
}

/** Group items by `keyFn` (empty/null → 'unknown'), sort descending, keep the top `limit`. */
export function groupCounts<T>(items: T[], keyFn: (item: T) => string | null | undefined, limit = 8): GroupCount[] {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = keyFn(item) || 'unknown';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const total = items.length;
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count, pct: total ? count / total : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface DonutArc {
  /** Degrees, clockwise from 12 o'clock. */
  startAngle: number;
  endAngle: number;
  /** Share of the total, 0..1. */
  pct: number;
}

/**
 * Pure donut geometry: one arc per value, proportional to value/total, starting at 12 o'clock.
 * Zero/negative values yield zero-width arcs; an all-zero input yields only zero-width arcs.
 * A single positive value spans the full 360°.
 */
export function donutArcs(values: number[]): DonutArc[] {
  const clean = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const total = clean.reduce((s, v) => s + v, 0);
  let cursor = 0;
  return clean.map((v) => {
    const pct = total ? v / total : 0;
    const startAngle = cursor;
    const endAngle = cursor + pct * 360;
    cursor = endAngle;
    return { startAngle, endAngle, pct };
  });
}
