'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useDashboardStore } from '@/store/dashboard-store';
import type { PanelId } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const OverviewPanel = dynamic(() => import('@/components/dashboard/OverviewPanel').then(m => ({ default: m.OverviewPanel })), {
  loading: () => <LoadingSkeleton count={6} />,
});

const ThreatMapPanel = dynamic(() => import('@/components/threat-map/ThreatMap'), {
  ssr: false,
  loading: () => <LoadingSkeleton count={4} />,
});

const CVESearchPanel = dynamic(() => import('@/components/cve/CVESearchPanel').then(m => ({ default: m.CVESearchPanel })), {
  loading: () => <LoadingSkeleton count={4} />,
});

const NewsFeedPanel = dynamic(() => import('@/components/news/NewsFeedPanel').then(m => ({ default: m.NewsFeedPanel })), {
  loading: () => <LoadingSkeleton count={4} />,
});

const APTTrackerPanel = dynamic(() => import('@/components/apt/APTTrackerPanel').then(m => ({ default: m.APTTrackerPanel })), {
  loading: () => <LoadingSkeleton count={4} />,
});

const IOCLookupPanel = dynamic(() => import('@/components/ioc/IOCLookupPanel').then(m => ({ default: m.IOCLookupPanel })), {
  loading: () => <LoadingSkeleton count={4} />,
});

const IPIntelPanel = dynamic(() => import('@/components/ip-intel/IPIntelPanel').then(m => ({ default: m.IPIntelPanel })), {
  loading: () => <LoadingSkeleton count={4} />,
});

const AnalyticsPanel = dynamic(() => import('@/components/analytics/AnalyticsPanel').then(m => ({ default: m.AnalyticsPanel })), {
  loading: () => <LoadingSkeleton count={4} />,
});

const MalwareBazaarPanel = dynamic(() => import('@/components/malware/MalwareBazaarPanel').then(m => ({ default: m.MalwareBazaarPanel })), {
  loading: () => <LoadingSkeleton count={4} />,
});

const MitreMatrixPanel = dynamic(() => import('@/components/mitre/MitreMatrixPanel').then(m => ({ default: m.MitreMatrixPanel })), {
  loading: () => <LoadingSkeleton count={4} />,
});

const ThreatIntelPanel = dynamic(() => import('@/components/threat-intel/ThreatIntelPanel').then(m => ({ default: m.ThreatIntelPanel })), {
  loading: () => <LoadingSkeleton count={4} />,
});

const ExploitsPanel = dynamic(() => import('@/components/exploits/ExploitsPanel').then(m => ({ default: m.ExploitsPanel })), {
  loading: () => <LoadingSkeleton count={4} />,
});

const VulnCalendarPanel = dynamic(() => import('@/components/vuln-calendar/VulnCalendarPanel').then(m => ({ default: m.VulnCalendarPanel })), {
  loading: () => <LoadingSkeleton count={4} />,
});

function ActivePanel({ panelId }: { panelId: PanelId }) {
  switch (panelId) {
    case 'overview':
      return <OverviewPanel />;
    case 'threat-map':
      return (
        <div className="h-[calc(100vh-140px)] rounded-xl overflow-hidden">
          <ThreatMapPanel />
        </div>
      );
    case 'cve':
      return <CVESearchPanel />;
    case 'news':
      return <NewsFeedPanel />;
    case 'apt':
      return <APTTrackerPanel />;
    case 'ioc':
      return <IOCLookupPanel />;
    case 'ip-intel':
      return <IPIntelPanel />;
    case 'analytics':
      return <AnalyticsPanel />;
    case 'malware':
      return <MalwareBazaarPanel />;
    case 'mitre':
      return <MitreMatrixPanel />;
    case 'threat-intel':
      return <ThreatIntelPanel />;
    case 'exploits':
      return <ExploitsPanel />;
    case 'vuln-calendar':
      return <VulnCalendarPanel />;
    default:
      return <OverviewPanel />;
  }
}

export function DashboardShell() {
  const activePanel = useDashboardStore((s) => s.activePanel);
  const [lastRefresh, setLastRefresh] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      setLastRefresh(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#060a13]">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header onMenuToggle={() => setMobileMenuOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4">
          <ActivePanel panelId={activePanel} />
        </main>
        <div className="h-7 md:h-8 flex items-center justify-between px-3 md:px-4 bg-[#080e1c]/60 border-t border-[#1a2744] text-[10px] md:text-[11px] text-slate-500 flex-shrink-0">
          <span>AEGIS v1.0</span>
          <div className="flex items-center gap-2 md:gap-4">
            <span className="hidden sm:inline">APIs Active: 8/8</span>
            <span>Last Refresh: {lastRefresh}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
