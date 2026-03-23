'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink, Calendar, Clock, Shield } from 'lucide-react';
import { cn } from '@/lib/cn';
import { GlowCard } from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/Badge';
import { CVSSBadge } from './CVSSBadge';
import type { CVEItem } from '@/types/cve';

interface CVEDetailCardProps {
  cve: CVEItem;
}

const vectorLabels: Record<string, string> = {
  attackVector: 'Attack Vector',
  attackComplexity: 'Attack Complexity',
  privilegesRequired: 'Privileges Required',
  userInteraction: 'User Interaction',
  scope: 'Scope',
  confidentialityImpact: 'Confidentiality',
  integrityImpact: 'Integrity',
  availabilityImpact: 'Availability',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function CVEDetailCard({ cve }: CVEDetailCardProps) {
  const [expanded, setExpanded] = useState(false);

  const description =
    cve.cve.descriptions.find((d) => d.lang === 'en')?.value ||
    cve.cve.descriptions[0]?.value ||
    'No description available.';

  const cvssMetric = cve.cve.metrics?.cvssMetricV31?.[0];
  const score = cvssMetric?.cvssData.baseScore ?? 0;
  const severity = cvssMetric?.cvssData.baseSeverity;

  const weaknesses = cve.cve.weaknesses
    ?.flatMap((w) => w.description.filter((d) => d.lang === 'en').map((d) => d.value))
    .filter((v) => v && v !== 'NVD-CWE-noinfo') || [];

  const references = cve.cve.references || [];

  const glowColor = score >= 9 ? 'red' : score >= 7 ? 'amber' : score >= 4 ? 'blue' : 'cyan';

  return (
    <GlowCard glowColor={glowColor} className="cursor-pointer" >
      <div onClick={() => setExpanded((prev) => !prev)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-base font-semibold text-slate-100 font-mono">
                {cve.cve.id}
              </h3>
              <CVSSBadge score={score} severity={severity} />
            </div>

            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Published {formatDate(cve.cve.published)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Modified {formatDate(cve.cve.lastModified)}
              </span>
            </div>

            <p className={cn(
              'mt-2 text-sm text-slate-400 leading-relaxed',
              !expanded && 'line-clamp-2'
            )}>
              {description}
            </p>
          </div>

          <ChevronDown
            className={cn(
              'h-5 w-5 text-slate-500 transition-transform duration-200 flex-shrink-0 mt-1',
              expanded && 'rotate-180'
            )}
          />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-[#1a2744] space-y-4">
              {cvssMetric && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    CVSS Vector Breakdown
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(vectorLabels).map(([key, label]) => {
                      const value = cvssMetric.cvssData[key as keyof typeof cvssMetric.cvssData];
                      if (!value || typeof value !== 'string') return null;
                      return (
                        <Badge key={key} variant="gray" className="text-[10px]">
                          {label}: {value}
                        </Badge>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    <span>Exploitability: {cvssMetric.exploitabilityScore.toFixed(1)}</span>
                    <span>Impact: {cvssMetric.impactScore.toFixed(1)}</span>
                  </div>
                </div>
              )}

              {weaknesses.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Weaknesses
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {weaknesses.map((cwe, i) => (
                      <Badge key={i} variant="purple">
                        {cwe}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {references.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    References
                  </h4>
                  <ul className="space-y-1 max-h-32 overflow-y-auto">
                    {references.slice(0, 8).map((ref, i) => (
                      <li key={i}>
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 truncate max-w-full"
                        >
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{ref.url}</span>
                          {ref.tags && ref.tags.length > 0 && (
                            <span className="text-slate-600 flex-shrink-0">
                              [{ref.tags.join(', ')}]
                            </span>
                          )}
                        </a>
                      </li>
                    ))}
                    {references.length > 8 && (
                      <li className="text-xs text-slate-500">
                        +{references.length - 8} more references
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Source: {cve.cve.sourceIdentifier}</span>
                <span className="text-slate-700">|</span>
                <span>Status: {cve.cve.vulnStatus}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlowCard>
  );
}
