'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  ChevronRight,
  ExternalLink,
  Eye,
  Lock,
  Shield,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { GlowCard } from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';

// ── Types ──────────────────────────────────────────────────────────────

interface PatchDate {
  date: Date;
  vendors: string[];
  label: string;
  isPast: boolean;
  isNext: boolean;
}

interface DarkWebService {
  name: string;
  url: string;
  description: string;
  type: string;
}

// ── Date Calculation Helpers ───────────────────────────────────────────

function getNthDayOfMonth(year: number, month: number, dayOfWeek: number, n: number): Date {
  const first = new Date(year, month, 1);
  const firstDayOfWeek = first.getDay();
  let dayOffset = dayOfWeek - firstDayOfWeek;
  if (dayOffset < 0) dayOffset += 7;
  const nthDay = 1 + dayOffset + (n - 1) * 7;
  return new Date(year, month, nthDay);
}

function getSecondTuesday(year: number, month: number): Date {
  return getNthDayOfMonth(year, month, 2, 2); // Tuesday = 2, 2nd occurrence
}

function getOracleCPUDate(year: number, quarter: number): Date | null {
  // Oracle Critical Patch Updates: Jan, Apr, Jul, Oct — closest Tuesday to the 17th
  const months = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct
  if (quarter < 0 || quarter > 3) return null;
  const month = months[quarter];
  const target = new Date(year, month, 17);
  const dayOfWeek = target.getDay();
  // Find closest Tuesday (2)
  let diff = 2 - dayOfWeek;
  if (diff > 3) diff -= 7;
  if (diff < -3) diff += 7;
  return new Date(year, month, 17 + diff);
}

function generatePatchDates(now: Date): PatchDate[] {
  const dates: PatchDate[] = [];
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Generate 12 months of Patch Tuesday dates (past 6 + future 6)
  for (let offset = -6; offset <= 6; offset++) {
    let month = currentMonth + offset;
    let year = currentYear;
    if (month < 0) {
      month += 12;
      year -= 1;
    } else if (month > 11) {
      month -= 12;
      year += 1;
    }

    const patchTuesday = getSecondTuesday(year, month);
    const vendors = ['Microsoft', 'Adobe'];
    const isPast = patchTuesday < now;

    dates.push({
      date: patchTuesday,
      vendors,
      label: `Patch Tuesday`,
      isPast,
      isNext: false,
    });
  }

  // Add Oracle CPU dates
  for (let yearOff = -1; yearOff <= 1; yearOff++) {
    const y = currentYear + yearOff;
    for (let q = 0; q < 4; q++) {
      const cpuDate = getOracleCPUDate(y, q);
      if (cpuDate) {
        const isPast = cpuDate < now;
        dates.push({
          date: cpuDate,
          vendors: ['Oracle'],
          label: `Critical Patch Update`,
          isPast,
          isNext: false,
        });
      }
    }
  }

  // Sort chronologically
  dates.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Find the next upcoming date and mark it
  let foundNext = false;
  for (const d of dates) {
    if (!d.isPast && !foundNext) {
      d.isNext = true;
      foundNext = true;
    }
  }

  // Filter to past 3 and next 3 for Patch Tuesdays, plus nearby Oracle dates
  const nextIdx = dates.findIndex((d) => d.isNext);
  if (nextIdx >= 0) {
    const startIdx = Math.max(0, nextIdx - 3);
    const endIdx = Math.min(dates.length, nextIdx + 6);
    return dates.slice(startIdx, endIdx);
  }

  return dates.slice(-6);
}

// ── Constants ──────────────────────────────────────────────────────────

const DARK_WEB_SERVICES: DarkWebService[] = [
  {
    name: 'Intelligence X',
    url: 'https://intelx.io',
    description:
      'Search engine for paste sites, dark web forums, leaked databases, and Tor services. Offers a free tier with limited searches.',
    type: 'Search Engine',
  },
  {
    name: 'SpyCloud',
    url: 'https://spycloud.com',
    description:
      'Credential exposure monitoring and automated remediation. Tracks breached credentials before they are weaponized.',
    type: 'Credential Monitoring',
  },
  {
    name: 'Recorded Future',
    url: 'https://recordedfuture.com',
    description:
      'AI-powered threat intelligence platform with dark web collection covering forums, marketplaces, and paste sites.',
    type: 'Threat Intelligence',
  },
  {
    name: 'DarkOwl',
    url: 'https://darkowl.com',
    description:
      'Darknet data platform providing structured access to Tor, I2P, and ZeroNet content for threat intelligence teams.',
    type: 'Darknet Data',
  },
];


const vendorIcons: Record<string, typeof Shield> = {
  Microsoft: Shield,
  Adobe: Server,
  Oracle: Server,
};

const vendorColors: Record<string, 'cyan' | 'red' | 'amber' | 'purple'> = {
  Microsoft: 'cyan',
  Adobe: 'red',
  Oracle: 'amber',
};

// ── Main Component ─────────────────────────────────────────────────────

export function VulnCalendarPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Calendar className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Vulnerability Calendar
          </h2>
          <p className="text-xs text-slate-500">
            Patch Tuesday, Adobe & Oracle patch schedules
          </p>
        </div>
      </div>

      <PatchTuesdayTab />
    </div>
  );
}

// ── Patch Tuesday Tab ──────────────────────────────────────────────────

function PatchTuesdayTab() {
  const patchDates = useMemo(() => generatePatchDates(new Date()), []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="h-4 w-4 text-cyan-400" />
        <h3 className="text-sm font-medium text-slate-200">Upcoming Patch Dates</h3>
      </div>

      <p className="text-xs text-slate-500">
        Track Microsoft Patch Tuesday, Adobe security updates, and Oracle Critical Patch Updates.
      </p>

      {/* Vendor legend */}
      <div className="flex items-center gap-4 text-xs">
        {Object.entries(vendorColors).map(([vendor, color]) => (
          <div key={vendor} className="flex items-center gap-1.5">
            <div
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                color === 'cyan' && 'bg-cyan-400',
                color === 'red' && 'bg-red-400',
                color === 'amber' && 'bg-amber-400'
              )}
            />
            <span className="text-slate-400">{vendor}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[#1a2744]" />

        <div className="space-y-1">
          {patchDates.map((pd, i) => {
            const VendorIcon = vendorIcons[pd.vendors[0]] ?? Shield;
            const primaryColor = vendorColors[pd.vendors[0]] ?? 'cyan';

            return (
              <motion.div
                key={`${pd.date.toISOString()}-${pd.vendors.join('-')}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className="relative"
              >
                {/* Timeline dot */}
                <div
                  className={cn(
                    'absolute -left-6 top-3 h-3 w-3 rounded-full border-2',
                    pd.isNext
                      ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                      : pd.isPast
                        ? 'bg-slate-700 border-slate-600'
                        : 'bg-[#0d1528] border-cyan-500/50'
                  )}
                />

                <GlowCard
                  glowColor={pd.isNext ? 'cyan' : primaryColor}
                  className={cn(
                    'ml-2',
                    pd.isPast && 'opacity-50',
                    pd.isNext && 'border-cyan-500/30 bg-cyan-500/[0.03]'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <VendorIcon
                        className={cn(
                          'h-4 w-4 flex-shrink-0',
                          primaryColor === 'cyan' && 'text-cyan-400',
                          primaryColor === 'red' && 'text-red-400',
                          primaryColor === 'amber' && 'text-amber-400'
                        )}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200">
                            {pd.label}
                          </span>
                          {pd.isNext && (
                            <Badge variant="cyan">NEXT</Badge>
                          )}
                          {pd.isPast && (
                            <span className="text-[10px] text-slate-600">PAST</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {pd.date.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {pd.vendors.map((v) => (
                        <Badge key={v} variant={vendorColors[v] ?? 'gray'}>
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {pd.isNext && (
                    <div className="mt-2 pt-2 border-t border-[#1a2744]">
                      <p className="text-xs text-cyan-400/80">
                        <ChevronRight className="inline h-3 w-3 mr-1 -mt-px" />
                        {getDaysUntil(pd.date)} days from now
                      </p>
                    </div>
                  )}
                </GlowCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-slate-600 text-center pt-2">
        Dates calculated programmatically. Always verify with vendor advisories.
      </p>
    </div>
  );
}

function getDaysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Dark Web Tab ───────────────────────────────────────────────────────

function DarkWebTab() {
  return (
    <div className="space-y-6">
      {/* Header info */}
      <GlowCard glowColor="purple" className="border-purple-500/20 bg-purple-500/[0.03]">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 flex-shrink-0">
            <Eye className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 mb-1">
              Dark Web Monitoring
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time dark web monitoring requires specialized API access to
              crawl Tor hidden services, paste sites, and underground forums.
              Below are recommended providers that can be integrated into this
              dashboard.
            </p>
          </div>
        </div>
      </GlowCard>

      {/* Services grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
      >
        {DARK_WEB_SERVICES.map((svc) => (
          <motion.div
            key={svc.name}
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.2 }}
          >
            <GlowCard glowColor="purple" className="h-full">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="text-sm font-medium text-slate-100">{svc.name}</h4>
                  <Badge variant="purple" className="mt-1">{svc.type}</Badge>
                </div>
                <a
                  href={svc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-cyan-400 transition-colors flex-shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {svc.description}
              </p>
            </GlowCard>
          </motion.div>
        ))}
      </motion.div>

      {/* API Key configuration hint */}
      <GlowCard glowColor="amber" className="border-amber-500/15">
        <div className="flex items-start gap-3">
          <Lock className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-slate-200 mb-1">
              Enable Dark Web Search
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-2">
              Configure <code className="px-1.5 py-0.5 rounded bg-[#0a1020] text-cyan-400 font-mono text-[11px]">INTELX_API_KEY</code> in
              your <code className="px-1.5 py-0.5 rounded bg-[#0a1020] text-cyan-400 font-mono text-[11px]">.env.local</code> file
              to enable basic dark web search capabilities via Intelligence X.
            </p>
            <div className="bg-[#0a1020] border border-[#1a2744] rounded-lg p-3">
              <code className="text-[11px] text-slate-300 font-mono">
                <span className="text-slate-500"># .env.local</span>
                <br />
                INTELX_API_KEY=your_api_key_here
              </code>
            </div>
          </div>
        </div>
      </GlowCard>

      <p className="text-[11px] text-slate-600 text-center">
        Dark web monitoring integrations are modular. Add API keys to enable each provider.
      </p>
    </div>
  );
}
