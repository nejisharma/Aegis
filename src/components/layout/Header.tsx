'use client';

import { useState, useEffect } from 'react';
import { SearchInput } from '@/components/ui/SearchInput';
import { PulsingDot } from '@/components/ui/PulsingDot';
import { useDashboardStore } from '@/store/dashboard-store';
import { AegisLogo } from '@/components/ui/AegisLogo';

export function Header() {
  const searchQuery = useDashboardStore((s) => s.searchQuery);
  const setSearchQuery = useDashboardStore((s) => s.setSearchQuery);
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedDate = time
    ? time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : '';
  const formattedTime = time
    ? time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    : '';

  return (
    <header className="h-[60px] flex items-center justify-between px-5 bg-[#080e1c]/80 backdrop-blur-xl border-b border-[#1a2744] flex-shrink-0">
      <div className="flex items-center gap-2.5">
        <AegisLogo size={28} />
        <h1 className="text-lg font-bold tracking-wider gradient-text">AEGIS</h1>
      </div>

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Global search — CVEs, IOCs, IPs..."
        className="w-full max-w-md"
      />

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <PulsingDot color="green" size="sm" />
          <span className="text-xs text-emerald-400 font-medium">ONLINE</span>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono text-slate-200 tabular-nums">{formattedTime}</div>
          <div className="text-[10px] text-slate-500">{formattedDate}</div>
        </div>
      </div>
    </header>
  );
}
