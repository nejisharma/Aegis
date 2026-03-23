'use client';

import { useDashboardStore } from '@/store/dashboard-store';
import { SEVERITY_COLORS, THREAT_TYPES } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { Activity, Pause, Play, Trash2 } from 'lucide-react';
import type { ThreatEvent } from '@/types/threat-event';

interface MapControlsProps {
  eventCount: number;
  isActive: boolean;
  onToggleActive: () => void;
  onClear: () => void;
}

const severityLabels: Record<ThreatEvent['severity'], string> = {
  low: 'Low',
  medium: 'Med',
  high: 'High',
  critical: 'Crit',
};

const typeIcons: Record<ThreatEvent['type'], string> = {
  malware: 'MAL',
  phishing: 'PHI',
  exploit: 'EXP',
  ddos: 'DDS',
  bruteforce: 'BRF',
  ransomware: 'RAN',
  apt: 'APT',
};

export function MapControls({
  eventCount,
  isActive,
  onToggleActive,
  onClear,
}: MapControlsProps) {
  const { mapFilters, toggleSeverityFilter, toggleTypeFilter } =
    useDashboardStore();

  return (
    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-[1000] flex flex-col gap-2">
      {/* Main control card */}
      <div className="bg-[#0d1528]/90 backdrop-blur-md border border-[#1a2744] rounded-lg p-2 sm:p-3 w-[140px] sm:w-[200px]">
        {/* Header with event count */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-300">
              Live Feed
            </span>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded">
            {eventCount}
          </span>
        </div>

        {/* Feed controls */}
        <div className="flex gap-1.5 mb-3">
          <button
            onClick={onToggleActive}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors flex-1 justify-center',
              isActive
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25'
                : 'bg-slate-500/15 text-slate-400 border border-slate-500/25 hover:bg-slate-500/25'
            )}
          >
            {isActive ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            {isActive ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-slate-500/15 text-slate-400 border border-slate-500/25 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/25 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Severity filters - hidden on mobile */}
        <p className="hidden sm:block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
          Severity
        </p>
        <div className="hidden sm:grid grid-cols-4 gap-1 mb-3">
          {(
            Object.entries(severityLabels) as [ThreatEvent['severity'], string][]
          ).map(([severity, label]) => {
            const active = mapFilters.severities.has(severity);
            const color = SEVERITY_COLORS[severity];
            return (
              <button
                key={severity}
                onClick={() => toggleSeverityFilter(severity)}
                className={cn(
                  'flex items-center justify-center gap-1 px-1 py-1 rounded text-[10px] font-medium transition-all border',
                  active
                    ? 'border-opacity-40'
                    : 'bg-slate-800/50 text-slate-600 border-slate-700/30 opacity-50'
                )}
                style={
                  active
                    ? {
                        backgroundColor: `${color}15`,
                        color,
                        borderColor: `${color}40`,
                      }
                    : undefined
                }
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: active ? color : '#475569',
                  }}
                />
                {label}
              </button>
            );
          })}
        </div>

        {/* Type filters - hidden on mobile */}
        <p className="hidden sm:block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
          Type
        </p>
        <div className="hidden sm:flex flex-wrap gap-1">
          {THREAT_TYPES.map((type) => {
            const active = mapFilters.types.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleTypeFilter(type)}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-all border',
                  active
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25'
                    : 'bg-slate-800/50 text-slate-600 border-slate-700/30 opacity-50'
                )}
              >
                {typeIcons[type]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
