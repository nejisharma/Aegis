'use client';

import { Crosshair, Code, Cpu } from 'lucide-react';
import { cn } from '@/lib/cn';
import { GlowCard } from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/Badge';
import type { MITREGroup } from '@/types/mitre';

const countryFlags: Record<string, string> = {
  China: '\u{1F1E8}\u{1F1F3}',
  Russia: '\u{1F1F7}\u{1F1FA}',
  Iran: '\u{1F1EE}\u{1F1F7}',
  'North Korea': '\u{1F1F0}\u{1F1F5}',
  'South Korea': '\u{1F1F0}\u{1F1F7}',
  Vietnam: '\u{1F1FB}\u{1F1F3}',
  Pakistan: '\u{1F1F5}\u{1F1F0}',
  Lebanon: '\u{1F1F1}\u{1F1E7}',
  India: '\u{1F1EE}\u{1F1F3}',
  Nigeria: '\u{1F1F3}\u{1F1EC}',
  Israel: '\u{1F1EE}\u{1F1F1}',
  Palestine: '\u{1F1F5}\u{1F1F8}',
  Turkey: '\u{1F1F9}\u{1F1F7}',
};

interface APTGroupCardProps {
  group: MITREGroup;
  onClick: () => void;
  isSelected: boolean;
}

export function APTGroupCard({ group, onClick, isSelected }: APTGroupCardProps) {
  return (
    <div onClick={onClick} className="cursor-pointer">
      <GlowCard
        glowColor={isSelected ? 'cyan' : 'blue'}
        className={cn(
          'transition-all duration-200',
          isSelected && 'border-cyan-500/40 bg-cyan-500/5'
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant="cyan" className="font-mono text-[10px]">
            {group.id}
          </Badge>
          {group.country && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              {countryFlags[group.country] || '\u{1F3F3}'} {group.country}
            </span>
          )}
        </div>

        <h3 className="text-sm font-bold text-slate-100 mb-1.5">{group.name}</h3>

        {group.aliases.length > 1 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {group.aliases.slice(1, 4).map((alias) => (
              <Badge key={alias} variant="gray" className="text-[10px]">
                {alias}
              </Badge>
            ))}
            {group.aliases.length > 4 && (
              <span className="text-[10px] text-slate-500">
                +{group.aliases.length - 4} more
              </span>
            )}
          </div>
        )}

        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {group.description || 'No description available.'}
        </p>

        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Crosshair className="h-3 w-3" />
            {group.techniqueIds.length} techniques
          </span>
          <span className="inline-flex items-center gap-1">
            <Code className="h-3 w-3" />
            {group.softwareIds.length} software
          </span>
        </div>
      </GlowCard>
    </div>
  );
}
