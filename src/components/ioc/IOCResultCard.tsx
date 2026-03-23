'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Copy,
  CheckCircle,
  ExternalLink,
  Clock,
  Fingerprint,
  Bug,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { GlowCard } from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/Badge';
import type { ThreatFoxIOC } from '@/types/threatfox';

interface IOCResultCardProps {
  ioc: ThreatFoxIOC;
}

const threatTypeVariant: Record<string, 'red' | 'amber' | 'purple' | 'cyan'> = {
  botnet_cc: 'red',
  payload_delivery: 'amber',
  payload: 'purple',
  c2: 'red',
};

function getConfidenceVariant(level: number): 'red' | 'amber' | 'green' | 'gray' {
  if (level >= 75) return 'red';
  if (level >= 50) return 'amber';
  if (level >= 25) return 'green';
  return 'gray';
}

function getConfidenceBarColor(level: number): string {
  if (level >= 75) return 'bg-red-500';
  if (level >= 50) return 'bg-amber-500';
  if (level >= 25) return 'bg-emerald-500';
  return 'bg-slate-500';
}

function getGlowColor(level: number): 'red' | 'amber' | 'green' | 'cyan' {
  if (level >= 75) return 'red';
  if (level >= 50) return 'amber';
  return 'cyan';
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '...' : str;
}

export function IOCResultCard({ ioc }: IOCResultCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(ioc.ioc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <GlowCard glowColor={getGlowColor(ioc.confidence_level)} className="space-y-3">
        {/* Header: IOC value + copy */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Fingerprint className="h-4 w-4 text-cyan-400 flex-shrink-0" />
            <span
              className="text-sm font-mono text-slate-200 truncate"
              title={ioc.ioc}
            >
              {truncate(ioc.ioc, 64)}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 p-1 rounded hover:bg-white/5 transition-colors"
            title="Copy IOC"
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4 text-slate-500 hover:text-slate-300" />
            )}
          </button>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={threatTypeVariant[ioc.threat_type] || 'cyan'}>
            {ioc.threat_type}
          </Badge>
          <Badge variant="purple">
            <Bug className="h-3 w-3 mr-1" />
            {ioc.malware_printable}
          </Badge>
          <Badge variant={getConfidenceVariant(ioc.confidence_level)}>
            {ioc.confidence_level}% confidence
          </Badge>
        </div>

        {/* Confidence bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', getConfidenceBarColor(ioc.confidence_level))}
            style={{ width: `${ioc.confidence_level}%` }}
          />
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="h-3 w-3" />
            <span>First seen</span>
          </div>
          <div className="text-slate-300">{ioc.first_seen || 'N/A'}</div>

          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="h-3 w-3" />
            <span>Last seen</span>
          </div>
          <div className="text-slate-300">{ioc.last_seen || 'N/A'}</div>

          <div className="flex items-center gap-1.5 text-slate-500">
            <Eye className="h-3 w-3" />
            <span>Reporter</span>
          </div>
          <div className="text-slate-300">{ioc.reporter}</div>

          <div className="flex items-center gap-1.5 text-slate-500">
            <span>Type</span>
          </div>
          <div className="text-slate-300">{ioc.ioc_type_desc}</div>
        </div>

        {/* Tags */}
        {ioc.tags && ioc.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {ioc.tags.map((tag) => (
              <Badge key={tag} variant="gray" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Reference link */}
        {ioc.reference && (
          <a
            href={ioc.reference}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Reference
          </a>
        )}
      </GlowCard>
    </motion.div>
  );
}
