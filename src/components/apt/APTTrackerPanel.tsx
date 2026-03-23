'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crosshair } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useMitreData } from '@/hooks/useMitreData';
import { APTGroupCard } from './APTGroupCard';
import { APTDetailView } from './APTDetailView';

export function APTTrackerPanel() {
  const { data, isLoading } = useMitreData();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const groups = data?.groups || [];
  const techniques = data?.techniques || [];

  const filteredGroups = useMemo(() => {
    if (!searchFilter.trim()) return groups;
    const query = searchFilter.toLowerCase();
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(query) ||
        g.id.toLowerCase().includes(query) ||
        g.aliases.some((a) => a.toLowerCase().includes(query))
    );
  }, [groups, searchFilter]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || null;

  if (isLoading) {
    return (
      <div className="flex gap-6">
        <div className="w-80 flex-shrink-0 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#0d1528] border border-[#1a2744] rounded-xl p-4">
              <LoadingSkeleton count={3} />
            </div>
          ))}
        </div>
        <div className="flex-1 bg-[#0d1528] border border-[#1a2744] rounded-xl p-8">
          <LoadingSkeleton count={6} className="h-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-12rem)]">
      {/* Left column - Group list */}
      <div className="w-80 flex-shrink-0 flex flex-col">
        <SearchInput
          value={searchFilter}
          onChange={setSearchFilter}
          placeholder="Filter APT groups..."
          className="mb-3"
        />
        <p className="text-xs text-slate-500 mb-3">
          {filteredGroups.length} groups found
        </p>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {filteredGroups.map((group) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.15 }}
                layout
              >
                <APTGroupCard
                  group={group}
                  onClick={() => setSelectedGroupId(group.id)}
                  isSelected={selectedGroupId === group.id}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredGroups.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No groups match your filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Right column - Detail view */}
      <div className="flex-1 bg-[#0d1528] border border-[#1a2744] rounded-xl p-6 overflow-hidden">
        {selectedGroup ? (
          <APTDetailView
            group={selectedGroup}
            techniques={techniques}
            allGroups={groups}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Crosshair className="h-12 w-12 text-slate-600 mb-4" />
            <p className="text-sm text-slate-400 mb-1">Select an APT group to view details</p>
            <p className="text-xs text-slate-500">
              Browse the list or use the search filter to find a specific threat actor
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
