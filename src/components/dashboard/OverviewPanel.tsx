'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Shield,
  Activity,
  Bug,
  Fingerprint,
  Crosshair,
  Newspaper,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { GlowCard } from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from './StatCard';
import { ActivityTimeline } from './ActivityTimeline';
import { useSimulatedThreats } from '@/hooks/useSimulatedThreats';
import { useNewsFeed } from '@/hooks/useNewsFeed';
import { useMitreData } from '@/hooks/useMitreData';

// Realistic animated counter that drifts up with small random increments
function useAnimatedCounter(baseValue: number, minInterval = 3000, maxInterval = 8000) {
  const [value, setValue] = useState(baseValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const tick = () => {
      const delay = minInterval + Math.random() * (maxInterval - minInterval);
      timerRef.current = setTimeout(() => {
        setValue((prev) => {
          // Small random increment, occasionally a small decrement
          const direction = Math.random() > 0.15 ? 1 : -1;
          const magnitude = Math.floor(Math.random() * 5) + 1;
          return prev + direction * magnitude;
        });
        tick();
      }, delay);
    };
    tick();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [minInterval, maxInterval]);

  return value.toLocaleString();
}

const ThreatMap = dynamic(
  () => import('@/components/threat-map/ThreatMap'),
  { ssr: false }
);

function formatNewsTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = Date.now();
    const diff = now - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return '';
  }
}

// Mock CVE data
const recentCVEs = [
  {
    id: 'CVE-2024-38077',
    severity: 'critical' as const,
    score: 9.8,
    description: 'Windows Remote Desktop Licensing Service RCE vulnerability',
  },
  {
    id: 'CVE-2024-35250',
    severity: 'high' as const,
    score: 7.8,
    description: 'Windows Kernel-Mode Driver elevation of privilege flaw',
  },
  {
    id: 'CVE-2024-30088',
    severity: 'high' as const,
    score: 7.0,
    description: 'Windows Kernel elevation of privilege via race condition',
  },
  {
    id: 'CVE-2024-29988',
    severity: 'medium' as const,
    score: 6.5,
    description: 'SmartScreen prompt bypass through crafted internet shortcut',
  },
  {
    id: 'CVE-2024-21413',
    severity: 'critical' as const,
    score: 9.1,
    description: 'Microsoft Outlook remote code execution via moniker link',
  },
];

const severityBadgeVariant: Record<string, 'red' | 'amber' | 'blue' | 'cyan'> = {
  critical: 'red',
  high: 'amber',
  medium: 'blue',
  low: 'cyan',
};

export function OverviewPanel() {
  const { events } = useSimulatedThreats();
  const { items: newsItems, isLoading: newsLoading } = useNewsFeed();
  const { data: mitreData, isLoading: mitreLoading } = useMitreData();

  const activeThreats = events.length;
  const aptGroupCount = mitreData?.groups?.length ?? 0;
  const newsCount = newsItems.length;

  // Animated counters for static stats
  const totalCVEs = useAnimatedCounter(254387, 2000, 6000);
  const malwareSamples = useAnimatedCounter(12847, 4000, 10000);
  const iocsTracked = useAnimatedCounter(89234, 3000, 8000);


  return (
    <div className="space-y-4">
      {/* TOP ROW - Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total CVEs"
          value={totalCVEs}
          icon={<Shield className="w-5 h-5" />}
          color="#06b6d4"
          glowColor="cyan"
          trend={12}
        />
        <StatCard
          title="Threats (60s)"
          value={activeThreats}
          icon={<Activity className="w-5 h-5" />}
          color="#ef4444"
          glowColor="red"
          trend={-3}
        />
        <StatCard
          title="Malware Samples"
          value={malwareSamples}
          icon={<Bug className="w-5 h-5" />}
          color="#f59e0b"
          glowColor="amber"
          trend={8}
        />
        <StatCard
          title="IOCs Tracked"
          value={iocsTracked}
          icon={<Fingerprint className="w-5 h-5" />}
          color="#a855f7"
          glowColor="purple"
          trend={5}
        />
        <StatCard
          title="APT Groups"
          value={aptGroupCount || 142}
          icon={<Crosshair className="w-5 h-5" />}
          color="#10b981"
          glowColor="green"
        />
        <StatCard
          title="News Articles"
          value={newsCount || 0}
          icon={<Newspaper className="w-5 h-5" />}
          color="#3b82f6"
          glowColor="blue"
          suffix="new"
        />
      </div>

      {/* THREAT MAP + NEWS SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map - takes 3/4 width */}
        <GlowCard glowColor="cyan" className="p-0 overflow-hidden lg:col-span-3">
          <div className="p-3 pb-0 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">
              Global Threat Map
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono bg-cyan-400/10 px-2 py-0.5 rounded">
              LIVE
            </span>
          </div>
          <div className="h-[420px] rounded-b-xl overflow-hidden mt-2">
            <ThreatMap />
          </div>
        </GlowCard>

        {/* Latest News Sidebar */}
        <GlowCard glowColor="blue" className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Newspaper className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-300">Latest News</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
            {newsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="shimmer rounded-lg h-16" />
                ))}
              </div>
            ) : newsItems.length > 0 ? (
              newsItems.slice(0, 10).map((item) => (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2.5 rounded-lg bg-[#0a1120] border border-[#152040] hover:border-blue-500/30 hover:bg-[#0d1528] transition-all group"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <span className="text-[10px] text-blue-400 font-medium uppercase">
                      {item.source}
                    </span>
                    <span className="text-[10px] text-slate-600 ml-auto">
                      {formatNewsTime(item.pubDate)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 group-hover:text-slate-200 transition-colors leading-relaxed">
                    {item.title}
                  </p>
                </a>
              ))
            ) : (
              <p className="text-xs text-slate-600 text-center py-8">
                No news available
              </p>
            )}
          </div>
        </GlowCard>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent CVEs */}
        <GlowCard glowColor="red">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            Recent CVEs
          </h3>
          <div className="space-y-2">
            {recentCVEs.map((cve) => (
              <motion.div
                key={cve.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#0a1120] border border-[#152040] hover:border-[#1e3060] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant={severityBadgeVariant[cve.severity]}>
                    {cve.score.toFixed(1)}
                  </Badge>
                  <div className="min-w-0">
                    <span className="text-sm font-mono text-cyan-400 group-hover:text-cyan-300 transition-colors">
                      {cve.id}
                    </span>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {cve.description}
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0 ml-2" />
              </motion.div>
            ))}
          </div>
        </GlowCard>

        {/* Activity Timeline */}
        <GlowCard glowColor="green">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            Threat Activity Timeline
          </h3>
          <div className="max-h-[400px] overflow-y-auto">
            <ActivityTimeline events={events} />
          </div>
        </GlowCard>
      </div>

    </div>
  );
}
