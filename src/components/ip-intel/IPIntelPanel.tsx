'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Globe,
  AlertTriangle,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useShodanLookup } from '@/hooks/useShodanLookup';
import { useGeoIP } from '@/hooks/useGeoIP';
import { IPGeoCard } from './IPGeoCard';
import { PortsTable } from './PortsTable';
import { VulnsList } from './VulnsList';

const IP_REGEX = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;

const QUICK_LOOKUPS = [
  { ip: '8.8.8.8', label: '8.8.8.8 (Google)' },
  { ip: '1.1.1.1', label: '1.1.1.1 (Cloudflare)' },
  { ip: '208.67.222.222', label: '208.67.222.222 (OpenDNS)' },
];

export function IPIntelPanel() {
  const [inputValue, setInputValue] = useState('');
  const [searchIP, setSearchIP] = useState('');
  const [validationError, setValidationError] = useState('');

  const { data: geoData, error: geoError, isLoading: geoLoading } = useGeoIP(searchIP);
  const { data: shodanData, error: shodanError, isLoading: shodanLoading } = useShodanLookup(searchIP);

  const handleSearch = (ip?: string) => {
    const target = (ip || inputValue).trim();
    if (!IP_REGEX.test(target)) {
      setValidationError('Please enter a valid IPv4 address (e.g., 8.8.8.8)');
      return;
    }
    setValidationError('');
    setSearchIP(target);
    if (!ip) setInputValue(target);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const hasResults = searchIP && (geoData || shodanData);
  const isLoading = geoLoading || shodanLoading;

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <div className="flex flex-col items-center text-center space-y-5">
        <div className="flex items-center gap-3">
          <Globe className="h-8 w-8 text-blue-400" />
          <h2 className="text-xl font-semibold text-slate-100">IP Intelligence</h2>
        </div>
        <p className="text-sm text-slate-400 max-w-lg">
          Get geolocation, open ports, vulnerabilities, and threat intelligence for any IP address
        </p>

        <div className="flex items-center gap-2 w-full max-w-xl">
          <div className="relative flex-1">
            <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (validationError) setValidationError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter an IP address (e.g., 8.8.8.8)"
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-lg',
                'bg-[#0d1528] border',
                validationError ? 'border-red-500/50' : 'border-[#1a2744]',
                'text-sm text-slate-200 placeholder:text-slate-500',
                'focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20',
                'transition-all duration-200'
              )}
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={!inputValue.trim() || isLoading}
            className={cn(
              'px-5 py-3 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200',
              'bg-blue-500/15 text-blue-400 border border-blue-500/25',
              'hover:bg-blue-500/25 hover:border-blue-500/40',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            <Search className="h-4 w-4" />
            Lookup
          </button>
        </div>

        {validationError && (
          <p className="text-xs text-red-400">{validationError}</p>
        )}

        {/* Quick lookup buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-xs text-slate-500">Quick lookup:</span>
          {QUICK_LOOKUPS.map(({ ip, label }) => (
            <button
              key={ip}
              onClick={() => {
                setInputValue(ip);
                handleSearch(ip);
              }}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200',
                'bg-slate-500/5 text-slate-400 border-slate-500/15',
                'hover:bg-slate-500/10 hover:text-slate-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && !hasResults && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#0d1528] border border-[#1a2744] rounded-xl p-4">
            <LoadingSkeleton count={6} />
          </div>
          <div className="space-y-4">
            <div className="bg-[#0d1528] border border-[#1a2744] rounded-xl p-4">
              <LoadingSkeleton count={4} />
            </div>
            <div className="bg-[#0d1528] border border-[#1a2744] rounded-xl p-4">
              <LoadingSkeleton count={3} />
            </div>
          </div>
        </div>
      )}

      {/* Error states */}
      {geoError && !geoLoading && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-400 mb-2" />
          <p className="text-sm text-slate-300">Failed to fetch geolocation data</p>
          <p className="text-xs text-slate-500 mt-1">{geoError.message}</p>
        </div>
      )}

      {/* Results */}
      {hasResults && (
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Left column: Geo */}
          <div>
            {geoLoading ? (
              <div className="bg-[#0d1528] border border-[#1a2744] rounded-xl p-4">
                <LoadingSkeleton count={6} />
              </div>
            ) : geoData ? (
              <IPGeoCard data={geoData} />
            ) : null}
          </div>

          {/* Right column: Shodan */}
          <div className="space-y-4">
            {shodanLoading ? (
              <>
                <div className="bg-[#0d1528] border border-[#1a2744] rounded-xl p-4">
                  <LoadingSkeleton count={4} />
                </div>
                <div className="bg-[#0d1528] border border-[#1a2744] rounded-xl p-4">
                  <LoadingSkeleton count={3} />
                </div>
              </>
            ) : shodanError ? (
              <div className="bg-[#0d1528] border border-[#1a2744] rounded-xl p-4 text-center py-6">
                <AlertTriangle className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                <p className="text-sm text-slate-300">Shodan data unavailable</p>
                <p className="text-xs text-slate-500 mt-1">{shodanError.message}</p>
              </div>
            ) : shodanData ? (
              <>
                <PortsTable
                  ports={shodanData.ports}
                  hostnames={shodanData.hostnames}
                />
                <VulnsList
                  vulns={shodanData.vulns}
                  cpes={shodanData.cpes}
                  tags={shodanData.tags}
                />
              </>
            ) : null}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!searchIP && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Globe className="h-12 w-12 text-slate-700 mb-4" />
          <p className="text-sm text-slate-400">Enter an IP address to begin analysis</p>
          <p className="text-xs text-slate-500 mt-1">
            Combines geolocation, port scanning, and vulnerability data
          </p>
        </div>
      )}
    </div>
  );
}
