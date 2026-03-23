'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Shield,
  AlertTriangle,
  Globe,
  Hash,
  Link,
  Fingerprint,
  Clock,
  Bug,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { GlowCard } from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useThreatFox } from '@/hooks/useThreatFox';
import { IOCResultCard } from './IOCResultCard';

const IOC_TABS = [
  { id: 'ip', label: 'IP Address' },
  { id: 'domain', label: 'Domain' },
  { id: 'hash', label: 'Hash' },
  { id: 'url', label: 'URL' },
];

const TAB_ICONS: Record<string, React.ReactNode> = {
  ip: <Globe className="h-4 w-4" />,
  domain: <Globe className="h-4 w-4" />,
  hash: <Hash className="h-4 w-4" />,
  url: <Link className="h-4 w-4" />,
};

const TAB_PLACEHOLDERS: Record<string, string> = {
  ip: 'e.g., 192.168.1.1',
  domain: 'e.g., malicious-domain.com',
  hash: 'e.g., d41d8cd98f00b204e9800998ecf8427e',
  url: 'e.g., http://malware-site.com/payload',
};

function getConfidenceVariant(level: number): 'red' | 'amber' | 'green' | 'gray' {
  if (level >= 75) return 'red';
  if (level >= 50) return 'amber';
  if (level >= 25) return 'green';
  return 'gray';
}

export function IOCLookupPanel() {
  const [activeTab, setActiveTab] = useState('ip');
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  // Search query for ThreatFox
  const {
    data: searchData,
    error: searchError,
    isLoading: searchLoading,
  } = useThreatFox(
    searchQuery ? 'search' : null,
    searchQuery || undefined
  );

  // Recent IOCs
  const {
    data: recentData,
    error: recentError,
    isLoading: recentLoading,
  } = useThreatFox('recent', undefined, 1);

  const handleSearch = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setSearchQuery(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const searchResults = Array.isArray(searchData?.data) ? searchData.data : [];
  const recentIOCs = useMemo(() => {
    const items = Array.isArray(recentData?.data) ? recentData.data : [];
    return items.slice(0, 20);
  }, [recentData]);

  const noApiKey =
    recentError?.message?.includes('401') ||
    recentError?.message?.includes('403') ||
    recentError?.message?.includes('auth');

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <div className="flex flex-col items-center text-center space-y-5">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-cyan-400" />
          <h2 className="text-xl font-semibold text-slate-100">IOC Lookup</h2>
        </div>
        <p className="text-sm text-slate-400 max-w-lg">
          Enter an IP, domain, file hash, or URL to search threat databases
        </p>

        <Tabs
          tabs={IOC_TABS}
          activeTab={activeTab}
          onTabChange={(id) => {
            setActiveTab(id);
            setInputValue('');
            setSearchQuery(null);
          }}
        />

        <div className="flex items-center gap-2 w-full max-w-2xl">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              {TAB_ICONS[activeTab]}
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={TAB_PLACEHOLDERS[activeTab]}
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-lg',
                'bg-[#0d1528] border border-[#1a2744]',
                'text-sm text-slate-200 placeholder:text-slate-500',
                'focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20',
                'transition-all duration-200'
              )}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!inputValue.trim() || searchLoading}
            className={cn(
              'px-5 py-3 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200',
              'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25',
              'hover:bg-cyan-500/25 hover:border-cyan-500/40',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#0d1528] border border-[#1a2744] rounded-xl p-4">
              <LoadingSkeleton count={4} />
            </div>
          ))}
        </div>
      )}

      {searchError && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-400 mb-3" />
          <p className="text-sm text-slate-300 mb-1">Failed to search IOCs</p>
          <p className="text-xs text-slate-500">
            {searchError.message || 'An unexpected error occurred'}
          </p>
        </div>
      )}

      {!searchLoading && !searchError && searchQuery && searchResults.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Shield className="h-10 w-10 text-emerald-500 mb-3" />
          <p className="text-sm text-slate-300">No threats associated with this indicator</p>
          <p className="text-xs text-slate-500 mt-1">
            This indicator was not found in the ThreatFox database
          </p>
        </div>
      )}

      {!searchLoading && !searchError && searchResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">
              Search Results
            </h3>
            <span className="text-xs text-slate-500">
              {searchResults.length} indicator{searchResults.length !== 1 ? 's' : ''} found
            </span>
          </div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.05 } },
            }}
          >
            <AnimatePresence mode="popLayout">
              {searchResults.map((ioc) => (
                <IOCResultCard key={ioc.id} ioc={ioc} />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* Recent Threats Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-medium text-slate-300">Recent Threats (Last 24h)</h3>
        </div>

        {noApiKey && (
          <GlowCard glowColor="amber" className="text-center py-6 space-y-2">
            <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
            <p className="text-sm text-slate-300">API Key Required</p>
            <p className="text-xs text-slate-500">
              Configure <code className="text-amber-400 bg-amber-500/10 px-1 rounded">ABUSECH_AUTH_KEY</code> in{' '}
              <code className="text-amber-400 bg-amber-500/10 px-1 rounded">.env.local</code> to enable IOC lookups.
              Get a free key at{' '}
              <a
                href="https://auth.abuse.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                auth.abuse.ch
              </a>
            </p>
          </GlowCard>
        )}

        {recentLoading && (
          <div className="bg-[#0d1528] border border-[#1a2744] rounded-xl p-4">
            <LoadingSkeleton count={6} />
          </div>
        )}

        {!recentLoading && !recentError && recentIOCs.length > 0 && (
          <div className="bg-[#0d1528] border border-[#1a2744] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#1a2744]">
                    <th className="text-left py-2.5 px-3 text-slate-500 font-medium">IOC</th>
                    <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Type</th>
                    <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Malware</th>
                    <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Confidence</th>
                    <th className="text-left py-2.5 px-3 text-slate-500 font-medium">First Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIOCs.map((ioc, idx) => (
                    <tr
                      key={ioc.id}
                      className={cn(
                        'border-b border-[#1a2744]/50 hover:bg-white/[0.02] transition-colors',
                        idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'
                      )}
                    >
                      <td className="py-2 px-3">
                        <span
                          className="font-mono text-slate-300 truncate block max-w-[200px]"
                          title={ioc.ioc}
                        >
                          {ioc.ioc.length > 40 ? ioc.ioc.slice(0, 40) + '...' : ioc.ioc}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="cyan">{ioc.threat_type}</Badge>
                      </td>
                      <td className="py-2 px-3">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Bug className="h-3 w-3 text-purple-400" />
                          {ioc.malware_printable}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant={getConfidenceVariant(ioc.confidence_level)}>
                          {ioc.confidence_level}%
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                        {ioc.first_seen}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!recentLoading && !recentError && !noApiKey && recentIOCs.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-slate-500">No recent threats found in the last 24 hours</p>
          </div>
        )}
      </div>
    </div>
  );
}
