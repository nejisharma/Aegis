'use client';

import { cn } from '@/lib/cn';
import { TechniqueCell } from './TechniqueCell';
import type { MITRETactic, MITRETechnique } from '@/types/mitre';

interface TacticColumnProps {
  tactic: MITRETactic;
  techniques: MITRETechnique[];
  groupCounts: Record<string, number>;
  maxGroupCount: number;
  selectedTechniqueId: string | null;
  onTechniqueClick: (id: string) => void;
}

export function TacticColumn({
  tactic,
  techniques,
  groupCounts,
  maxGroupCount,
  selectedTechniqueId,
  onTechniqueClick,
}: TacticColumnProps) {
  return (
    <div className="flex flex-col min-w-[180px] max-w-[200px]">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-[#080d1a] border-b border-[#1a2744] pb-2 mb-2 px-1">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider truncate" title={tactic.name}>
          {tactic.name}
        </h3>
        <p className="text-[10px] text-slate-500 mt-0.5">{techniques.length} techniques</p>
      </div>

      {/* Techniques list */}
      <div className="flex flex-col gap-1 px-0.5 overflow-y-auto flex-1 scrollbar-thin">
        {techniques.map((technique) => (
          <TechniqueCell
            key={technique.id}
            technique={technique}
            groupCount={groupCounts[technique.id] || 0}
            maxGroupCount={maxGroupCount}
            onClick={() => onTechniqueClick(technique.id)}
            isSelected={selectedTechniqueId === technique.id}
          />
        ))}
      </div>
    </div>
  );
}
