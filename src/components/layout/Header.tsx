'use client';

import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { PulsingDot } from '@/components/ui/PulsingDot';
import { useDashboardStore } from '@/store/dashboard-store';
import { AegisLogo } from '@/components/ui/AegisLogo';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
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
    <header className="h-[52px] md:h-[60px] flex items-center justify-between px-3 md:px-5 bg-[#080e1c]/80 backdrop-blur-xl border-b border-[#1a2744] flex-shrink-0 gap-2">
      {/* Left: hamburger (mobile) + logo */}
      <div className="flex items-center gap-2 md:gap-2.5 flex-shrink-0">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <AegisLogo size={24} className="md:w-7 md:h-7" />
        <h1 className="text-base md:text-lg font-bold tracking-wider gradient-text">AEGIS</h1>
      </div>

      {/* Center: search (hidden on small mobile) */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Global search — CVEs, IOCs, IPs..."
        className="hidden sm:block w-full max-w-md"
      />

      {/* Right: status + time */}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <div className="flex items-center gap-1.5 md:gap-2">
          <PulsingDot color="green" size="sm" />
          <span className="text-[10px] md:text-xs text-emerald-400 font-medium">ONLINE</span>
        </div>
        <div className="text-right">
          <div className="text-xs md:text-sm font-mono text-slate-200 tabular-nums">{formattedTime}</div>
          <div className="hidden md:block text-[10px] text-slate-500">{formattedDate}</div>
        </div>
      </div>
    </header>
  );
}
