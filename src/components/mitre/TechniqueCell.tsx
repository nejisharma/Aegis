'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { MITRETechnique } from '@/types/mitre';

interface TechniqueCellProps {
  technique: MITRETechnique;
  groupCount: number;
  maxGroupCount: number;
  onClick: () => void;
  isSelected: boolean;
}

export function TechniqueCell({
  technique,
  groupCount,
  maxGroupCount,
  onClick,
  isSelected,
}: TechniqueCellProps) {
  const [hovered, setHovered] = useState(false);

  const intensity = maxGroupCount > 0 ? groupCount / maxGroupCount : 0;
  const bgOpacity = Math.max(0.05, intensity * 0.4);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'w-full text-left py-1 px-2 rounded border transition-all duration-200 relative group',
        isSelected
          ? 'border-cyan-400/60 bg-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
          : 'border-[#1a2744] hover:border-cyan-500/40'
      )}
      style={{
        backgroundColor: isSelected
          ? undefined
          : `rgba(6, 182, 212, ${bgOpacity})`,
      }}
      title={`${technique.id}: ${technique.name} (Used by ${groupCount} groups)`}
    >
      <p className="text-[10px] font-mono text-cyan-400/80">{technique.id}</p>
      <p className="text-xs text-slate-300 truncate leading-tight">
        {technique.name}
      </p>

      {/* Tooltip on hover */}
      {hovered && (
        <div className="absolute z-50 left-full ml-2 top-0 bg-[#0a0f1e] border border-[#1a2744] rounded-lg px-3 py-2 shadow-xl min-w-[200px] max-w-[280px] pointer-events-none">
          <p className="text-xs font-mono text-cyan-400">{technique.id}</p>
          <p className="text-xs text-slate-200 font-medium mt-0.5">{technique.name}</p>
          <p className="text-[10px] text-slate-500 mt-1">
            Used by {groupCount} group{groupCount !== 1 ? 's' : ''}
          </p>
          {technique.platforms.length > 0 && (
            <p className="text-[10px] text-slate-500 mt-0.5">
              Platforms: {technique.platforms.slice(0, 3).join(', ')}
            </p>
          )}
        </div>
      )}
    </button>
  );
}
