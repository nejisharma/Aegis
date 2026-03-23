'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SEVERITY_COLORS } from '@/lib/constants';

const trendData = [
  { month: 'Apr', critical: 42, high: 128, medium: 215, low: 89 },
  { month: 'May', critical: 56, high: 145, medium: 198, low: 102 },
  { month: 'Jun', critical: 38, high: 132, medium: 224, low: 95 },
  { month: 'Jul', critical: 61, high: 158, medium: 237, low: 110 },
  { month: 'Aug', critical: 73, high: 167, medium: 251, low: 118 },
  { month: 'Sep', critical: 49, high: 139, medium: 208, low: 97 },
  { month: 'Oct', critical: 65, high: 172, medium: 263, low: 124 },
  { month: 'Nov', critical: 58, high: 151, medium: 241, low: 108 },
  { month: 'Dec', critical: 44, high: 136, medium: 219, low: 91 },
  { month: 'Jan', critical: 71, high: 163, medium: 248, low: 115 },
  { month: 'Feb', critical: 82, high: 179, medium: 272, low: 131 },
  { month: 'Mar', critical: 67, high: 155, medium: 234, low: 104 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-[#0d1528] border border-[#1a2744] rounded-lg p-3 shadow-xl">
      <p className="text-xs font-medium text-slate-300 mb-2">{label} 2025</p>
      {payload.reverse().map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-400 capitalize">{entry.name}</span>
          </span>
          <span className="text-slate-200 font-mono tabular-nums">{entry.value}</span>
        </div>
      ))}
      <div className="mt-1.5 pt-1.5 border-t border-[#1a2744] text-xs text-slate-400 flex justify-between">
        <span>Total</span>
        <span className="font-mono text-slate-200">
          {payload.reduce((sum, e) => sum + e.value, 0)}
        </span>
      </div>
    </div>
  );
}

export function CVETrendChart() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300 mb-3">CVE Trends (12 Months)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCritical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={SEVERITY_COLORS.critical} stopOpacity={0.3} />
                <stop offset="95%" stopColor={SEVERITY_COLORS.critical} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={SEVERITY_COLORS.high} stopOpacity={0.3} />
                <stop offset="95%" stopColor={SEVERITY_COLORS.high} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradMedium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={SEVERITY_COLORS.medium} stopOpacity={0.3} />
                <stop offset="95%" stopColor={SEVERITY_COLORS.medium} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={SEVERITY_COLORS.low} stopOpacity={0.3} />
                <stop offset="95%" stopColor={SEVERITY_COLORS.low} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.2)" />
            <XAxis
              dataKey="month"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#1e293b' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#1e293b' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="low"
              stackId="1"
              stroke={SEVERITY_COLORS.low}
              fill="url(#gradLow)"
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="medium"
              stackId="1"
              stroke={SEVERITY_COLORS.medium}
              fill="url(#gradMedium)"
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="high"
              stackId="1"
              stroke={SEVERITY_COLORS.high}
              fill="url(#gradHigh)"
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="critical"
              stackId="1"
              stroke={SEVERITY_COLORS.critical}
              fill="url(#gradCritical)"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
