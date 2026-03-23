'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Shield, Layers, Users, Grid3X3 } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { GlowCard } from '@/components/ui/GlowCard';
import { useMitreData } from '@/hooks/useMitreData';
import { TacticColumn } from './TacticColumn';
import { TechniqueDetail } from './TechniqueDetail';

export function MitreMatrixPanel() {
  const { data, isLoading } = useMitreData();
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const tactics = data?.tactics || [];
  const techniques = data?.techniques || [];
  const groups = data?.groups || [];

  // Only top-level techniques (no sub-techniques for the matrix view)
  const topLevelTechniques = useMemo(
    () => techniques.filter((t) => !t.isSubtechnique),
    [techniques]
  );

  // Group counts: how many groups use each technique
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    groups.forEach((g) => {
      g.techniqueIds.forEach((tid) => {
        counts[tid] = (counts[tid] || 0) + 1;
      });
    });
    return counts;
  }, [groups]);

  const maxGroupCount = useMemo(
    () => Math.max(1, ...Object.values(groupCounts)),
    [groupCounts]
  );

  // Filter techniques by search
  const filteredTechniques = useMemo(() => {
    if (!searchFilter.trim()) return topLevelTechniques;
    const query = searchFilter.toLowerCase();
    return topLevelTechniques.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query)
    );
  }, [topLevelTechniques, searchFilter]);

  // Map techniques to their tactic columns
  const tacticTechniques = useMemo(() => {
    const map: Record<string, typeof filteredTechniques> = {};
    tactics.forEach((tactic) => {
      map[tactic.shortName] = filteredTechniques.filter((t) =>
        t.tacticRefs.includes(tactic.id) || t.tacticRefs.includes(tactic.shortName)
      );
    });
    return map;
  }, [tactics, filteredTechniques]);

  const selectedTechnique = techniques.find((t) => t.id === selectedTechniqueId) || null;

  const handleTechniqueClick = (id: string) => {
    setSelectedTechniqueId(id === selectedTechniqueId ? null : id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-cyan-400" />
          <div>
            <h2 className="text-xl font-bold text-slate-100">MITRE ATT&CK Matrix</h2>
            <p className="text-sm text-slate-500">Loading framework data...</p>
          </div>
        </div>
        <div className="bg-[#0d1528] border border-[#1a2744] rounded-xl p-6">
          <LoadingSkeleton count={8} className="h-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-cyan-400" />
          <div>
            <h2 className="text-xl font-bold text-slate-100">MITRE ATT&CK Matrix</h2>
            <p className="text-sm text-slate-500">Enterprise tactics, techniques & groups</p>
          </div>
        </div>
        <SearchInput
          value={searchFilter}
          onChange={setSearchFilter}
          placeholder="Filter techniques..."
          className="w-64"
        />
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-6 bg-[#0d1528] border border-[#1a2744] rounded-xl p-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          <span className="text-xs text-slate-500">Tactics:</span>
          <span className="text-sm font-semibold text-slate-200">{tactics.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-cyan-400" />
          <span className="text-xs text-slate-500">Techniques:</span>
          <span className="text-sm font-semibold text-slate-200">{topLevelTechniques.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-cyan-400" />
          <span className="text-xs text-slate-500">Groups:</span>
          <span className="text-sm font-semibold text-slate-200">{groups.length}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500">Usage frequency:</span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500">Rarely used</span>
          <div className="flex gap-0.5">
            {[0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4].map((opacity) => (
              <div
                key={opacity}
                className="w-5 h-3 rounded-sm"
                style={{ backgroundColor: `rgba(6, 182, 212, ${opacity})` }}
              />
            ))}
          </div>
          <span className="text-[10px] text-slate-500">Commonly used</span>
        </div>
      </div>

      {/* Matrix */}
      <GlowCard className="p-2">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)]">
          <div className="flex gap-2 min-w-max p-2">
            {tactics.map((tactic) => (
              <TacticColumn
                key={tactic.id}
                tactic={tactic}
                techniques={tacticTechniques[tactic.shortName] || []}
                groupCounts={groupCounts}
                maxGroupCount={maxGroupCount}
                selectedTechniqueId={selectedTechniqueId}
                onTechniqueClick={handleTechniqueClick}
              />
            ))}
          </div>
        </div>
      </GlowCard>

      {/* Detail panel (slide-in from right) */}
      <AnimatePresence>
        {selectedTechnique && (
          <TechniqueDetail
            key={selectedTechnique.id}
            technique={selectedTechnique}
            groups={groups}
            onClose={() => setSelectedTechniqueId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
