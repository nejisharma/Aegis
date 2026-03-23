'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Activity,
  Target,
  ShieldAlert,
  Bug,
  Fingerprint,
  Globe,
  Crosshair,
  Shield,
} from 'lucide-react';
import { GlowCard } from '@/components/ui/GlowCard';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useSimulatedThreats } from '@/hooks/useSimulatedThreats';
import { useMitreData } from '@/hooks/useMitreData';
import { useThreatFox } from '@/hooks/useThreatFox';
import { useMalwareBazaar } from '@/hooks/useMalwareBazaar';

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0f1e] border border-[#1a2744] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs font-medium" style={{ color: entry.color || entry.fill }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: inner } = payload[0];
  const total = inner?.total || 1;
  return (
    <div className="bg-[#0a0f1e] border border-[#1a2744] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-medium" style={{ color: inner?.color }}>
        {name}: {value} ({((value / total) * 100).toFixed(1)}%)
      </p>
    </div>
  );
}

export function AnalyticsPanel() {
  const { events } = useSimulatedThreats();
  const { data: mitreData, isLoading: mitreLoading } = useMitreData();
  const { data: threatFoxData, isLoading: iocLoading } = useThreatFox('recent', undefined, 1);
  const { data: malwareData, isLoading: malwareLoading } = useMalwareBazaar('recent', { limit: 100 });

  // --- CARD 1: Threat Type Distribution from live simulated events ---
  const threatTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e) => {
      counts[e.type] = (counts[e.type] || 0) + 1;
    });
    const typeColors: Record<string, string> = {
      malware: '#ef4444', phishing: '#f59e0b', exploit: '#f97316',
      ddos: '#3b82f6', bruteforce: '#8b5cf6', ransomware: '#ec4899', apt: '#06b6d4',
    };
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value, color: typeColors[name] || '#6b7280' }))
      .sort((a, b) => b.value - a.value);
  }, [events]);

  const totalThreats = useMemo(() => threatTypeData.reduce((s, v) => s + v.value, 0), [threatTypeData]);

  // --- CARD 2: Severity Distribution from live simulated events ---
  const severityData = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    events.forEach((e) => { counts[e.severity]++; });
    const colors: Record<string, string> = {
      critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6',
    };
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count: value,
      color: colors[name],
    }));
  }, [events]);

  // --- CARD 3: Top ATT&CK Techniques from MITRE data (by group usage) ---
  const topTechniques = useMemo(() => {
    if (!mitreData) return [];
    const counts: Record<string, number> = {};
    const nameMap: Record<string, string> = {};
    mitreData.techniques.forEach((t) => { nameMap[t.id] = t.name; });
    mitreData.groups.forEach((g) => {
      g.techniqueIds.forEach((tid) => {
        counts[tid] = (counts[tid] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([id, count]) => ({ name: `${nameMap[id] || id} (${id})`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [mitreData]);

  // --- CARD 4: Threat Radar from live simulated events ---
  const threatRadar = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e) => { counts[e.type] = (counts[e.type] || 0) + 1; });
    const max = Math.max(1, ...Object.values(counts));
    const labels: Record<string, string> = {
      malware: 'Malware', phishing: 'Phishing', exploit: 'Exploit',
      ddos: 'DDoS', ransomware: 'Ransomware', apt: 'APT', bruteforce: 'Bruteforce',
    };
    return Object.entries(labels).map(([key, label]) => ({
      category: label,
      value: Math.round(((counts[key] || 0) / max) * 100),
    }));
  }, [events]);

  // --- CARD 5: IOC Types from ThreatFox ---
  const iocTypeData = useMemo(() => {
    const items = Array.isArray(threatFoxData?.data) ? threatFoxData.data : [];
    const counts: Record<string, number> = {};
    items.forEach((ioc) => {
      const type = ioc.threat_type || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    const colors = ['#06b6d4', '#a855f7', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];
    return Object.entries(counts)
      .map(([name, value], i) => ({ name, value, color: colors[i % colors.length], total: items.length }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [threatFoxData]);

  // --- CARD 6: Malware File Types from MalwareBazaar ---
  const malwareFileTypes = useMemo(() => {
    const items = Array.isArray(malwareData?.data) ? malwareData.data : [];
    const counts: Record<string, number> = {};
    items.forEach((s) => {
      const type = s.file_type || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    const colors = ['#ef4444', '#f97316', '#eab308', '#10b981', '#3b82f6', '#a855f7', '#06b6d4', '#ec4899'];
    return Object.entries(counts)
      .map(([name, value], i) => ({ name, count: value, color: colors[i % colors.length] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [malwareData]);

  // --- Top Attacking Countries (source of attacks in last 60s) ---
  const topAttackers = useMemo(() => {
    const counts: Record<string, { count: number; code: string }> = {};
    events.forEach((e) => {
      if (!counts[e.sourceCountry]) {
        counts[e.sourceCountry] = { count: 0, code: e.sourceCountryCode };
      }
      counts[e.sourceCountry].count++;
    });
    return Object.entries(counts)
      .map(([country, { count, code }]) => ({ country, count, code }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [events]);

  // --- Top Targeted Countries (destination of attacks in last 60s) ---
  const topTargets = useMemo(() => {
    const counts: Record<string, { count: number; code: string }> = {};
    events.forEach((e) => {
      if (!counts[e.targetCountry]) {
        counts[e.targetCountry] = { count: 0, code: e.targetCountryCode };
      }
      counts[e.targetCountry].count++;
    });
    return Object.entries(counts)
      .map(([country, { count, code }]) => ({ country, count, code }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [events]);

  const isLoading = mitreLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-cyan-400" />
          <div>
            <h2 className="text-xl font-bold text-slate-100">Analytics</h2>
            <p className="text-sm text-slate-500">Loading data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <GlowCard key={i}><LoadingSkeleton count={6} /></GlowCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-cyan-400" />
        <div>
          <h2 className="text-xl font-bold text-slate-100">Analytics</h2>
          <p className="text-sm text-slate-500">
            Live metrics from threat feeds, MITRE ATT&CK & simulated events
          </p>
        </div>
      </div>

      {/* Top Attackers & Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Attacking Countries */}
        <GlowCard glowColor="red">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-red-400" />
            Top Attacking Countries (Last 60s)
            <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">LIVE</span>
          </h3>
          {topAttackers.length > 0 ? (
            <div className="space-y-2">
              {topAttackers.map((item, i) => {
                const maxCount = topAttackers[0]?.count || 1;
                const pct = (item.count / maxCount) * 100;
                return (
                  <div key={item.country} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-4 text-right font-mono">{i + 1}</span>
                    <span className="text-xs font-medium text-slate-300 w-28 truncate">{item.country}</span>
                    <div className="flex-1 h-4 bg-slate-800/50 rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, #ef4444${i === 0 ? '' : '80'}, #f97316${i === 0 ? '' : '60'})`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-red-400 w-8 text-right">{item.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-slate-500">
              Waiting for threat events...
            </div>
          )}
        </GlowCard>

        {/* Top Targeted Countries */}
        <GlowCard glowColor="blue">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-400" />
            Top Targeted Countries (Last 60s)
            <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">LIVE</span>
          </h3>
          {topTargets.length > 0 ? (
            <div className="space-y-2">
              {topTargets.map((item, i) => {
                const maxCount = topTargets[0]?.count || 1;
                const pct = (item.count / maxCount) * 100;
                return (
                  <div key={item.country} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-4 text-right font-mono">{i + 1}</span>
                    <span className="text-xs font-medium text-slate-300 w-28 truncate">{item.country}</span>
                    <div className="flex-1 h-4 bg-slate-800/50 rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, #3b82f6${i === 0 ? '' : '80'}, #06b6d4${i === 0 ? '' : '60'})`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-blue-400 w-8 text-right">{item.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-slate-500">
              Waiting for threat events...
            </div>
          )}
        </GlowCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: Threat Severity Breakdown (live from simulated events) */}
        <GlowCard>
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            Threat Severity (Last 60s)
            <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">LIVE</span>
          </h3>
          <div className="h-64">
            {severityData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#1a2744' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#1a2744' }} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                    {severityData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                Waiting for threat events...
              </div>
            )}
          </div>
        </GlowCard>

        {/* CARD 2: Threat Types (live from simulated events) */}
        <GlowCard>
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-cyan-400" />
            Attack Types (Last 60s)
            <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">LIVE</span>
          </h3>
          <div className="h-64 relative">
            {threatTypeData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={threatTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {threatTypeData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span className="text-xs text-slate-400 capitalize">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginBottom: 30 }}>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-100">{totalThreats}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Events</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                Waiting for threat events...
              </div>
            )}
          </div>
        </GlowCard>

        {/* CARD 3: Top ATT&CK Techniques (from MITRE data) */}
        <GlowCard>
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-cyan-400" />
            Top ATT&CK Techniques by APT Usage
          </h3>
          <div className="h-64">
            {topTechniques.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topTechniques}
                  layout="vertical"
                  margin={{ top: 0, right: 40, left: 5, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#1a2744' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#1a2744' }}
                    width={160}
                  />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="count" fill="#06b6d4" radius={[0, 3, 3, 0]} barSize={16}
                    label={{ position: 'right', fill: '#94a3b8', fontSize: 10 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                No MITRE data available
              </div>
            )}
          </div>
        </GlowCard>

        {/* CARD 4: Threat Radar (live from simulated events) */}
        <GlowCard>
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-cyan-400" />
            Threat Radar (Last 60s)
            <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">LIVE</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={threatRadar} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#1a2744" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <PolarRadiusAxis tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} domain={[0, 100]} />
                <Radar name="Intensity %" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip content={<DarkTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 5: IOC Threat Types from ThreatFox */}
        <GlowCard>
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-cyan-400" />
            IOC Threat Types (ThreatFox — Last 24h)
          </h3>
          <div className="h-64">
            {iocLoading ? (
              <LoadingSkeleton count={4} />
            ) : iocTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={iocTypeData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={{ stroke: '#1a2744' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#1a2744' }} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                    {iocTypeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                No IOC data — check API key configuration
              </div>
            )}
          </div>
        </GlowCard>

        {/* CARD 6: Malware File Types from MalwareBazaar */}
        <GlowCard>
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Bug className="h-4 w-4 text-cyan-400" />
            Malware File Types (MalwareBazaar — Latest 100)
          </h3>
          <div className="h-64">
            {malwareLoading ? (
              <LoadingSkeleton count={4} />
            ) : malwareFileTypes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={malwareFileTypes} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#1a2744' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#1a2744' }} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={30}
                    label={{ position: 'top', fill: '#94a3b8', fontSize: 10 }}
                  >
                    {malwareFileTypes.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                No malware data — check API key configuration
              </div>
            )}
          </div>
        </GlowCard>
      </div>
    </div>
  );
}
