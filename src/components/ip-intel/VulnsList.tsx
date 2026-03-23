'use client';

import { Shield, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/cn';
import { GlowCard } from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/Badge';

interface VulnsListProps {
  vulns: string[];
  cpes: string[];
  tags: string[];
}

export function VulnsList({ vulns, cpes, tags }: VulnsListProps) {
  const hasVulns = vulns.length > 0;

  return (
    <GlowCard glowColor={hasVulns ? 'red' : 'green'} className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        {hasVulns ? (
          <AlertTriangle className="h-4 w-4 text-red-400" />
        ) : (
          <Shield className="h-4 w-4 text-emerald-400" />
        )}
        <h3 className="text-sm font-semibold text-slate-200">Vulnerabilities</h3>
        {hasVulns && <Badge variant="red">{vulns.length}</Badge>}
      </div>

      {/* Vulns */}
      {hasVulns ? (
        <div className="flex flex-wrap gap-1.5">
          {vulns.map((cve) => (
            <a
              key={cve}
              href={`https://nvd.nist.gov/vuln/detail/${cve}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Badge variant="red" className="cursor-pointer group-hover:bg-red-500/25 transition-colors">
                {cve}
                <ExternalLink className="h-2.5 w-2.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Badge>
            </a>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 py-3">
          <CheckCircle className="h-5 w-5 text-emerald-400" />
          <span className="text-sm text-emerald-400">No known vulnerabilities</span>
        </div>
      )}

      {/* CPEs */}
      {cpes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Common Platform Enumeration
          </h4>
          <div className="flex flex-col gap-1">
            {cpes.map((cpe) => (
              <span
                key={cpe}
                className="text-xs font-mono text-slate-400 bg-slate-800/50 px-2 py-1 rounded break-all"
              >
                {cpe}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Tags
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              let variant: 'red' | 'amber' | 'purple' | 'cyan' | 'gray' = 'gray';
              const lower = tag.toLowerCase();
              if (lower.includes('cloud') || lower.includes('cdn')) variant = 'cyan';
              else if (lower.includes('vpn') || lower.includes('proxy')) variant = 'purple';
              else if (lower.includes('compromised') || lower.includes('malware')) variant = 'red';
              else if (lower.includes('honeypot') || lower.includes('tor')) variant = 'amber';

              return (
                <Badge key={tag} variant={variant}>
                  {tag}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </GlowCard>
  );
}
