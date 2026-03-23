'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Search, Database } from 'lucide-react';
import { cn } from '@/lib/cn';
import { SearchInput } from '@/components/ui/SearchInput';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useCVESearch } from '@/hooks/useCVESearch';
import { getSeverityFromScore } from '@/lib/cvss-utils';
import { CVEDetailCard } from './CVEDetailCard';
import { CVETrendChart } from './CVETrendChart';

const SEVERITY_FILTERS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

const filterColors: Record<string, { active: string; inactive: string }> = {
  CRITICAL: {
    active: 'bg-red-500/20 text-red-400 border-red-500/40',
    inactive: 'bg-red-500/5 text-red-400/50 border-red-500/10 hover:bg-red-500/10',
  },
  HIGH: {
    active: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    inactive: 'bg-orange-500/5 text-orange-400/50 border-orange-500/10 hover:bg-orange-500/10',
  },
  MEDIUM: {
    active: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    inactive: 'bg-yellow-500/5 text-yellow-400/50 border-yellow-500/10 hover:bg-yellow-500/10',
  },
  LOW: {
    active: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    inactive: 'bg-blue-500/5 text-blue-400/50 border-blue-500/10 hover:bg-blue-500/10',
  },
};

export function CVESearchPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Only search when 3+ characters typed
  const searchQuery = debouncedTerm.length >= 3 ? debouncedTerm : '';
  const { data, error, isLoading, mutate } = useCVESearch(searchQuery);

  const filteredVulnerabilities = useMemo(() => {
    if (!data?.vulnerabilities) return [];
    if (activeFilters.size === 0) return data.vulnerabilities;

    return data.vulnerabilities.filter((item) => {
      const score = item.cve.metrics?.cvssMetricV31?.[0]?.cvssData.baseScore ?? 0;
      const severity = getSeverityFromScore(score);
      return activeFilters.has(severity);
    });
  }, [data?.vulnerabilities, activeFilters]);

  const toggleFilter = (severity: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(severity)) {
        next.delete(severity);
      } else {
        next.add(severity);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search CVEs by keyword, ID, or product (e.g., apache, CVE-2024, log4j)..."
          />

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 mr-1">Filter:</span>
            {SEVERITY_FILTERS.map((sev) => (
              <button
                key={sev}
                onClick={() => toggleFilter(sev)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200',
                  activeFilters.has(sev)
                    ? filterColors[sev].active
                    : filterColors[sev].inactive
                )}
              >
                {sev}
              </button>
            ))}
            {activeFilters.size > 0 && (
              <button
                onClick={() => setActiveFilters(new Set())}
                className="px-2 py-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {data && (
            <div className="text-xs text-slate-500">
              Showing {filteredVulnerabilities.length} of {data.totalResults.toLocaleString()} results
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-[#0d1528] border border-[#1a2744] rounded-xl p-4">
                  <LoadingSkeleton count={3} />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-10 w-10 text-amber-400/60 mb-3" />
              <p className="text-sm text-slate-300 mb-1">Unable to reach NVD database</p>
              <p className="text-xs text-slate-500 mb-4 max-w-md">
                The National Vulnerability Database may be temporarily unavailable or rate-limited. Please wait a moment and try again.
              </p>
              <button
                onClick={() => mutate()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && searchQuery && filteredVulnerabilities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-10 w-10 text-slate-600 mb-3" />
              <p className="text-sm text-slate-400">No CVEs found for &ldquo;{searchQuery}&rdquo;</p>
              <p className="text-xs text-slate-500 mt-1">
                Try a different keyword, CVE ID, or product name
              </p>
            </div>
          )}

          {!isLoading && !error && !searchQuery && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-10 w-10 text-slate-600 mb-3" />
              <p className="text-sm text-slate-400">Search the NVD Database</p>
              <p className="text-xs text-slate-500 mt-1">
                {debouncedTerm.length > 0 && debouncedTerm.length < 3
                  ? `Type ${3 - debouncedTerm.length} more character${3 - debouncedTerm.length > 1 ? 's' : ''} to search...`
                  : 'Enter a keyword, CVE ID, or product name to begin searching'}
              </p>
            </div>
          )}

          {!isLoading && !error && filteredVulnerabilities.length > 0 && (
            <motion.div
              className="grid grid-cols-1 gap-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05 } },
              }}
            >
              <AnimatePresence mode="popLayout">
                {filteredVulnerabilities.map((item) => (
                  <motion.div
                    key={item.cve.id}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    layout
                  >
                    <CVEDetailCard cve={item} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        <div className="lg:w-80 xl:w-96 flex-shrink-0">
          <div className="sticky top-4 bg-[#0d1528] border border-[#1a2744] rounded-xl p-4">
            <CVETrendChart />
          </div>
        </div>
      </div>
    </div>
  );
}
