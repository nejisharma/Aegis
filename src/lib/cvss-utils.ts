import { CVSS_COLORS } from './constants';

export function getSeverityFromScore(score: number): string {
  if (score === 0) return 'NONE';
  if (score <= 3.9) return 'LOW';
  if (score <= 6.9) return 'MEDIUM';
  if (score <= 8.9) return 'HIGH';
  return 'CRITICAL';
}

export function getSeverityColors(severity: string) {
  return CVSS_COLORS[severity as keyof typeof CVSS_COLORS] || CVSS_COLORS.NONE;
}

export function getScoreColor(score: number): string {
  if (score === 0) return '#6b7280';
  if (score <= 3.9) return '#3b82f6';
  if (score <= 6.9) return '#eab308';
  if (score <= 8.9) return '#f97316';
  return '#ef4444';
}
