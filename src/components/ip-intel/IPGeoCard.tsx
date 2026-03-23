'use client';

import { useState } from 'react';
import { MapPin, Globe, Server, Clock, Copy, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { GlowCard } from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/Badge';
import type { GeoIPResult } from '@/types/geoip';

interface IPGeoCardProps {
  data: GeoIPResult;
}

export function IPGeoCard({ data }: IPGeoCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GlowCard glowColor="blue" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-200">Geolocation</h3>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          title="Copy IP"
        >
          {copied ? (
            <>
              <CheckCircle className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span className="font-mono">{data.query}</span>
            </>
          )}
        </button>
      </div>

      {/* Location display */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Globe className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <p className="text-base font-medium text-slate-100">
            {data.city}{data.regionName ? `, ${data.regionName}` : ''}
          </p>
          <p className="text-sm text-slate-400">
            {data.country} ({data.countryCode})
          </p>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-2.5 text-xs">
        <div className="flex items-center justify-between py-1.5 border-b border-[#1a2744]/50">
          <span className="flex items-center gap-1.5 text-slate-500">
            <Server className="h-3 w-3" />
            ISP
          </span>
          <span className="text-slate-300 text-right max-w-[60%] truncate" title={data.isp}>
            {data.isp}
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-[#1a2744]/50">
          <span className="flex items-center gap-1.5 text-slate-500">
            <Server className="h-3 w-3" />
            Organization
          </span>
          <span className="text-slate-300 text-right max-w-[60%] truncate" title={data.org}>
            {data.org}
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-[#1a2744]/50">
          <span className="text-slate-500">AS Number</span>
          <Badge variant="blue">{data.as || 'N/A'}</Badge>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-[#1a2744]/50">
          <span className="flex items-center gap-1.5 text-slate-500">
            <Clock className="h-3 w-3" />
            Timezone
          </span>
          <span className="text-slate-300">{data.timezone}</span>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-[#1a2744]/50">
          <span className="text-slate-500">ZIP Code</span>
          <span className="text-slate-300">{data.zip || 'N/A'}</span>
        </div>

        <div className="flex items-center justify-between py-1.5">
          <span className="flex items-center gap-1.5 text-slate-500">
            <MapPin className="h-3 w-3" />
            Coordinates
          </span>
          <span className="font-mono text-slate-300">
            {data.lat.toFixed(4)}, {data.lon.toFixed(4)}
          </span>
        </div>
      </div>
    </GlowCard>
  );
}
