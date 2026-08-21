import type { CVEItem } from '../api/types';

export type Severity = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export function cvssSeverity(score: number): Severity {
  if (score === 0) return 'NONE';
  if (score <= 3.9) return 'LOW';
  if (score <= 6.9) return 'MEDIUM';
  if (score <= 8.9) return 'HIGH';
  return 'CRITICAL';
}

export function severityColor(severity: Severity | string): string {
  switch (severity.toUpperCase()) {
    case 'LOW':
      return '#3b82f6';
    case 'MEDIUM':
    case 'MODERATE':
      return '#eab308';
    case 'HIGH':
      return '#f97316';
    case 'CRITICAL':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

export function scoreColor(score: number): string {
  return severityColor(cvssSeverity(score));
}

export interface CveSummary {
  id: string;
  score: number | null;
  severity: Severity;
  vector: string | null;
  description: string;
  published: string;
  attackVector: string | null;
}

export function summarizeCve(item: CVEItem): CveSummary {
  const metric = item.cve.metrics?.cvssMetricV31?.[0];
  const score = metric ? metric.cvssData.baseScore : null;
  const en = item.cve.descriptions.find((d) => d.lang === 'en') ?? item.cve.descriptions[0];
  return {
    id: item.cve.id,
    score,
    severity: score === null ? 'NONE' : cvssSeverity(score),
    vector: metric?.cvssData.vectorString ?? null,
    description: en?.value ?? '',
    published: item.cve.published,
    attackVector: metric?.cvssData.attackVector ?? null,
  };
}
