'use client';

import { cn } from '@/lib/cn';
import { getSeverityFromScore, getSeverityColors } from '@/lib/cvss-utils';

interface CVSSBadgeProps {
  score: number;
  severity?: string;
}

export function CVSSBadge({ score, severity }: CVSSBadgeProps) {
  const resolvedSeverity = severity || getSeverityFromScore(score);
  const colors = getSeverityColors(resolvedSeverity);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border',
        colors.bg,
        colors.text,
        colors.border
      )}
    >
      <span className="tabular-nums">{score.toFixed(1)}</span>
      <span className="uppercase tracking-wide">{resolvedSeverity}</span>
    </span>
  );
}
