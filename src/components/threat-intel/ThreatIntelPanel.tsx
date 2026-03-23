'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Search,
  Shield,
  AlertTriangle,
  Globe,
  Link2,
  Fish,
  Bug,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  Server,
  MonitorSmartphone,
  Hash,
  FileSearch,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { GlowCard } from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/Badge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Tabs } from '@/components/ui/Tabs';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface AbuseIPDBData {
  ipAddress: string;
  isPublic: boolean;
  ipVersion: number;
  isWhitelisted: boolean | null;
  abuseConfidenceScore: number;
  countryCode: string;
  countryName: string;
  usageType: string;
  isp: string;
  domain: string;
  totalReports: number;
  numDistinctUsers: number;
  lastReportedAt: string | null;
}

interface URLScanResult {
  task: {
    url: string;
    domain: string;
    time: string;
    uuid: string;
  };
  page: {
    url: string;
    domain: string;
    ip: string;
    server: string;
    title: string;
    status: string;
  };
  result: string;
  screenshot: string;
}

interface PhishingEntry {
  url: string;
  id: number;
  phish_detail_url?: string;
  target?: string;
  submission_time?: string;
  verified?: string;
  source: string;
}

interface PhishingResponse {
  entries: PhishingEntry[];
  total: number;
  source: string;
}

// ─── Tabs Config ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'abuseipdb', label: 'AbuseIPDB' },
  { id: 'urlscan', label: 'URL Scanner' },
  { id: 'phishing', label: 'Phishing Feed' },
];

const IP_REGEX = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const HASH_REGEX = /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/;

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getConfidenceColor(score: number) {
  if (score < 25) return { bar: 'bg-emerald-500', text: 'text-emerald-400', label: 'Low' };
  if (score < 50) return { bar: 'bg-yellow-500', text: 'text-yellow-400', label: 'Medium' };
  if (score < 75) return { bar: 'bg-orange-500', text: 'text-orange-400', label: 'High' };
  return { bar: 'bg-red-500', text: 'text-red-400', label: 'Critical' };
}

function truncateUrl(url: string, max: number = 60) {
  return url.length > max ? url.slice(0, max) + '...' : url;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// ─── AbuseIPDB Tab ──────────────────────────────────────────────────────────────

function AbuseIPDBTab() {
  const [input, setInput] = useState('');
  const [data, setData] = useState<AbuseIPDBData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [noKey, setNoKey] = useState(false);

  const handleSearch = useCallback(async () => {
    const ip = input.trim();
    if (!IP_REGEX.test(ip)) {
      setError('Enter a valid IPv4 address (e.g., 1.2.3.4)');
      return;
    }
    setError('');
    setData(null);
    setNoKey(false);
    setLoading(true);

    try {
      const res = await fetch(`/api/abuseipdb?ip=${encodeURIComponent(ip)}`);
      const json = await res.json();

      if (!res.ok) {
        if (json.noKey) {
          setNoKey(true);
        } else {
          setError(json.error || `Request failed (${res.status})`);
        }
        return;
      }
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); if (error) setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Enter IP address (e.g., 118.25.6.39)"
            className={cn(
              'w-full pl-10 pr-4 py-2.5 rounded-lg',
              'bg-[#0d1528] border border-[#1a2744]',
              'text-sm text-slate-200 placeholder:text-slate-500',
              'focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20',
              'transition-all duration-200'
            )}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!input.trim() || loading}
          className={cn(
            'px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200',
            'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25',
            'hover:bg-cyan-500/25 hover:border-cyan-500/40',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <Search className="h-4 w-4" />
          Check
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {noKey && (
        <GlowCard glowColor="amber" className="text-center py-6">
          <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-3" />
          <p className="text-sm text-slate-200 font-medium mb-1">API Key Required</p>
          <p className="text-xs text-slate-400 mb-3">
            Get a free API key at abuseipdb.com (1,000 requests/day).
          </p>
          <a
            href="https://www.abuseipdb.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Sign up at abuseipdb.com <ExternalLink className="h-3 w-3" />
          </a>
          <p className="text-xs text-slate-500 mt-2">
            Add <code className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">ABUSEIPDB_API_KEY</code> to your .env.local
          </p>
        </GlowCard>
      )}

      {loading && <LoadingSkeleton count={5} />}

      {data && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Confidence Score */}
          <GlowCard glowColor={data.abuseConfidenceScore >= 50 ? 'red' : 'cyan'}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Abuse Confidence Score</p>
                <p className={cn('text-3xl font-bold mt-1', getConfidenceColor(data.abuseConfidenceScore).text)}>
                  {data.abuseConfidenceScore}%
                </p>
              </div>
              <Badge variant={data.abuseConfidenceScore >= 50 ? 'red' : data.abuseConfidenceScore >= 25 ? 'amber' : 'green'}>
                {getConfidenceColor(data.abuseConfidenceScore).label} Risk
              </Badge>
            </div>
            <div className="w-full h-2.5 bg-[#0a1020] rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', getConfidenceColor(data.abuseConfidenceScore).bar)}
                initial={{ width: 0 }}
                animate={{ width: `${data.abuseConfidenceScore}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </GlowCard>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <GlowCard>
              <InfoRow icon={<Globe className="h-4 w-4 text-blue-400" />} label="IP Address" value={data.ipAddress} />
              <InfoRow icon={<Globe className="h-4 w-4 text-blue-400" />} label="Country" value={`${data.countryName} (${data.countryCode})`} />
              <InfoRow icon={<Server className="h-4 w-4 text-purple-400" />} label="ISP" value={data.isp || 'N/A'} />
              <InfoRow icon={<Link2 className="h-4 w-4 text-cyan-400" />} label="Domain" value={data.domain || 'N/A'} />
            </GlowCard>
            <GlowCard>
              <InfoRow icon={<MonitorSmartphone className="h-4 w-4 text-emerald-400" />} label="Usage Type" value={data.usageType || 'N/A'} />
              <InfoRow
                icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
                label="Total Reports"
                value={`${data.totalReports} (${data.numDistinctUsers} users)`}
              />
              <InfoRow
                icon={<Clock className="h-4 w-4 text-slate-400" />}
                label="Last Reported"
                value={formatDate(data.lastReportedAt)}
              />
              <div className="flex items-center gap-2 py-1.5">
                {data.isWhitelisted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-slate-500" />
                )}
                <span className="text-xs text-slate-500">Whitelisted</span>
                <span className="text-sm text-slate-200 ml-auto">
                  {data.isWhitelisted ? 'Yes' : 'No'}
                </span>
              </div>
            </GlowCard>
          </div>
        </motion.div>
      )}

      {!data && !loading && !noKey && !error && (
        <EmptyState icon={Shield} text="Enter an IP address to check its abuse reputation" />
      )}
    </div>
  );
}

// ─── URL Scanner Tab ────────────────────────────────────────────────────────────

function URLScannerTab() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<URLScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    const url = input.trim();
    if (!url) {
      setError('Enter a URL or domain to search');
      return;
    }
    setError('');
    setResults([]);
    setSearched(true);
    setLoading(true);

    try {
      const res = await fetch('/api/urlscan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || `Request failed (${res.status})`);
        return;
      }
      setResults(Array.isArray(json) ? json.slice(0, 20) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); if (error) setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Enter URL or domain (e.g., example.com)"
            className={cn(
              'w-full pl-10 pr-4 py-2.5 rounded-lg',
              'bg-[#0d1528] border border-[#1a2744]',
              'text-sm text-slate-200 placeholder:text-slate-500',
              'focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20',
              'transition-all duration-200'
            )}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!input.trim() || loading}
          className={cn(
            'px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200',
            'bg-purple-500/15 text-purple-400 border border-purple-500/25',
            'hover:bg-purple-500/25 hover:border-purple-500/40',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <Search className="h-4 w-4" />
          Scan
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {loading && <LoadingSkeleton count={4} />}

      {!loading && searched && results.length === 0 && !error && (
        <GlowCard className="text-center py-8">
          <FileSearch className="h-8 w-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No scans found for this URL</p>
          <p className="text-xs text-slate-500 mt-1">Try a more common domain or submit a new scan at urlscan.io</p>
        </GlowCard>
      )}

      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <p className="text-xs text-slate-500">{results.length} scan result{results.length !== 1 ? 's' : ''} found</p>
          {results.map((r) => (
            <GlowCard key={r.task.uuid} glowColor="purple" className="flex gap-4">
              {/* Screenshot thumbnail */}
              {r.screenshot && (
                <div className="flex-shrink-0 w-28 h-20 rounded-md overflow-hidden bg-[#0a1020] border border-[#1a2744]">
                  <img
                    src={r.screenshot}
                    alt="Page screenshot"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-slate-200 font-medium truncate">
                    {r.page?.title || r.task.domain}
                  </p>
                  {r.page?.status && (
                    <Badge variant={String(r.page.status).startsWith('2') ? 'green' : String(r.page.status).startsWith('3') ? 'amber' : 'red'}>
                      {r.page.status}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-cyan-400 truncate">{r.page?.url || r.task.url}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {r.page?.domain && <span>Domain: {r.page.domain}</span>}
                  {r.page?.ip && <span>IP: {r.page.ip}</span>}
                  {r.page?.server && <span>Server: {r.page.server}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{formatDate(r.task.time)}</span>
                  <a
                    href={r.result}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    View full report <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </GlowCard>
          ))}
        </motion.div>
      )}

      {!searched && !loading && (
        <EmptyState icon={Link2} text="Enter a URL or domain to search for existing scans" />
      )}
    </div>
  );
}

// ─── Phishing Feed Tab ──────────────────────────────────────────────────────────

function PhishingFeedTab() {
  const [data, setData] = useState<PhishingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/phishing');
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load phishing feed');
        return;
      }
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Fish className="h-4 w-4 text-amber-400" />
          <span className="text-sm text-slate-300 font-medium">Active Phishing URLs</span>
          {data && (
            <Badge variant="amber">{data.total.toLocaleString()} total</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {data && <Badge variant="gray">{data.source}</Badge>}
          <button
            onClick={fetchFeed}
            disabled={loading}
            className={cn(
              'p-1.5 rounded-md transition-all duration-200',
              'text-slate-500 hover:text-slate-300 hover:bg-white/5',
              'disabled:opacity-40'
            )}
            title="Refresh feed"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {error && (
        <GlowCard glowColor="red" className="text-center py-6">
          <AlertTriangle className="h-6 w-6 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-slate-300">{error}</p>
        </GlowCard>
      )}

      {loading && !data && <LoadingSkeleton count={8} />}

      {data && data.entries.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-[#1a2744] overflow-hidden"
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-[#0a1020] border-b border-[#1a2744] text-xs text-slate-500 uppercase tracking-wider">
            <span className="col-span-1">#</span>
            <span className="col-span-6">URL</span>
            <span className="col-span-2">{data.source === 'PhishTank' ? 'Target' : 'Source'}</span>
            <span className="col-span-2">{data.source === 'PhishTank' ? 'Submitted' : 'ID'}</span>
            <span className="col-span-1">Status</span>
          </div>

          {/* Scrollable list */}
          <div className="max-h-[480px] overflow-y-auto scrollbar-thin">
            {data.entries.map((entry, idx) => (
              <div
                key={entry.id ?? idx}
                className={cn(
                  'grid grid-cols-12 gap-2 px-4 py-2.5 text-xs border-b border-[#1a2744]/50',
                  'hover:bg-white/[0.02] transition-colors',
                  idx % 2 === 0 ? 'bg-[#0d1528]' : 'bg-[#0b1322]'
                )}
              >
                <span className="col-span-1 text-slate-600">{idx + 1}</span>
                <span className="col-span-6 truncate">
                  <a
                    href={entry.phish_detail_url || `https://urlscan.io/search/#${encodeURIComponent(entry.url)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                    title={entry.url}
                  >
                    {truncateUrl(entry.url, 55)}
                  </a>
                </span>
                <span className="col-span-2 text-slate-400 truncate">
                  {entry.target || entry.source}
                </span>
                <span className="col-span-2 text-slate-500 truncate">
                  {entry.submission_time ? formatDate(entry.submission_time) : `#${entry.id}`}
                </span>
                <span className="col-span-1">
                  {entry.verified === 'yes' || data.source === 'OpenPhish' ? (
                    <Badge variant="red" className="text-[10px]">Active</Badge>
                  ) : (
                    <Badge variant="gray" className="text-[10px]">Unverified</Badge>
                  )}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {data && data.entries.length === 0 && (
        <EmptyState icon={Fish} text="No phishing entries found" />
      )}
    </div>
  );
}

// ─── VirusTotal Tab ─────────────────────────────────────────────────────────────

function VirusTotalTab() {
  const [input, setInput] = useState('');
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [noKey, setNoKey] = useState(false);

  const handleSearch = useCallback(async () => {
    const hash = input.trim();
    if (!HASH_REGEX.test(hash)) {
      setError('Enter a valid MD5, SHA1, or SHA256 hash');
      return;
    }
    setError('');
    setData(null);
    setNoKey(false);
    setLoading(true);

    try {
      const res = await fetch(`/api/virustotal?hash=${encodeURIComponent(hash)}`);
      const json = await res.json();

      if (!res.ok) {
        if (json.noKey) {
          setNoKey(true);
        } else {
          setError(json.error || `Request failed (${res.status})`);
        }
        return;
      }
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Extract stats from VT response
  const stats = data?.attributes
    ? (data.attributes as Record<string, unknown>).last_analysis_stats as Record<string, number> | undefined
    : undefined;
  const fileInfo = data?.attributes as Record<string, unknown> | undefined;
  const totalEngines = stats
    ? Object.values(stats).reduce((a, b) => a + b, 0)
    : 0;
  const detections = stats?.malicious ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); if (error) setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Enter file hash (MD5 / SHA1 / SHA256)"
            className={cn(
              'w-full pl-10 pr-4 py-2.5 rounded-lg',
              'bg-[#0d1528] border border-[#1a2744]',
              'text-sm text-slate-200 placeholder:text-slate-500',
              'focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20',
              'transition-all duration-200'
            )}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!input.trim() || loading}
          className={cn(
            'px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200',
            'bg-green-500/15 text-green-400 border border-green-500/25',
            'hover:bg-green-500/25 hover:border-green-500/40',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <Search className="h-4 w-4" />
          Lookup
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {loading && <LoadingSkeleton count={5} />}

      {/* No API Key / placeholder message */}
      {(noKey || (!data && !loading && !error)) && (
        <GlowCard glowColor="green" className="text-center py-6">
          <Bug className="h-8 w-8 text-green-400 mx-auto mb-3" />
          <p className="text-sm text-slate-200 font-medium mb-1">VirusTotal File Lookup</p>
          <p className="text-xs text-slate-400 mb-3">
            VirusTotal requires a free API key to query file hashes.
          </p>
          <a
            href="https://www.virustotal.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Sign up at virustotal.com <ExternalLink className="h-3 w-3" />
          </a>
          <p className="text-xs text-slate-500 mt-2">
            Add <code className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">VT_API_KEY</code> to your .env.local
          </p>
          {!noKey && !data && (
            <p className="text-xs text-slate-500 mt-3">
              Enter a file hash above to search for analysis results.
            </p>
          )}
        </GlowCard>
      )}

      {/* VT Results */}
      {data && stats && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Detection ratio */}
          <GlowCard glowColor={detections > 0 ? 'red' : 'green'}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Detection Ratio</p>
                <p className={cn('text-3xl font-bold mt-1', detections > 0 ? 'text-red-400' : 'text-emerald-400')}>
                  {detections} / {totalEngines}
                </p>
              </div>
              <Badge variant={detections > 0 ? 'red' : 'green'}>
                {detections > 0 ? 'Malicious' : 'Clean'}
              </Badge>
            </div>
            <div className="w-full h-2.5 bg-[#0a1020] rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', detections > 0 ? 'bg-red-500' : 'bg-emerald-500')}
                initial={{ width: 0 }}
                animate={{ width: `${totalEngines > 0 ? (detections / totalEngines) * 100 : 0}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <div className="flex gap-4 mt-3 text-xs">
              <span className="text-red-400">Malicious: {stats.malicious ?? 0}</span>
              <span className="text-amber-400">Suspicious: {stats.suspicious ?? 0}</span>
              <span className="text-emerald-400">Undetected: {stats.undetected ?? 0}</span>
              <span className="text-slate-500">Timeout: {stats.timeout ?? 0}</span>
            </div>
          </GlowCard>

          {/* File Info */}
          {fileInfo && (
            <GlowCard>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">File Information</p>
              <div className="space-y-0.5">
                {'meaningful_name' in fileInfo && fileInfo.meaningful_name != null && (
                  <InfoRow icon={<FileSearch className="h-4 w-4 text-cyan-400" />} label="Name" value={String(fileInfo.meaningful_name)} />
                )}
                {'type_description' in fileInfo && fileInfo.type_description != null && (
                  <InfoRow icon={<FileSearch className="h-4 w-4 text-purple-400" />} label="Type" value={String(fileInfo.type_description)} />
                )}
                {'size' in fileInfo && fileInfo.size != null && (
                  <InfoRow icon={<FileSearch className="h-4 w-4 text-blue-400" />} label="Size" value={`${(Number(fileInfo.size) / 1024).toFixed(1)} KB`} />
                )}
                {'sha256' in fileInfo && fileInfo.sha256 != null && (
                  <InfoRow icon={<Hash className="h-4 w-4 text-slate-400" />} label="SHA256" value={String(fileInfo.sha256)} mono />
                )}
                {'md5' in fileInfo && fileInfo.md5 != null && (
                  <InfoRow icon={<Hash className="h-4 w-4 text-slate-400" />} label="MD5" value={String(fileInfo.md5)} mono />
                )}
                {'first_submission_date' in fileInfo && fileInfo.first_submission_date != null && (
                  <InfoRow
                    icon={<Clock className="h-4 w-4 text-slate-400" />}
                    label="First Seen"
                    value={formatDate(new Date(Number(fileInfo.first_submission_date) * 1000).toISOString())}
                  />
                )}
              </div>
            </GlowCard>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      {icon}
      <span className="text-xs text-slate-500 whitespace-nowrap">{label}</span>
      <span
        className={cn(
          'text-sm text-slate-200 ml-auto text-right truncate max-w-[65%]',
          mono && 'font-mono text-xs'
        )}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <Icon className="h-10 w-10 text-slate-700 mb-3" />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

// ─── Main Panel ─────────────────────────────────────────────────────────────────

export function ThreatIntelPanel() {
  const [activeTab, setActiveTab] = useState('abuseipdb');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Eye className="h-7 w-7 text-cyan-400" />
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Threat Intelligence</h2>
          <p className="text-xs text-slate-500">
            IP reputation, URL scanning, and phishing feeds
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'abuseipdb' && <AbuseIPDBTab />}
          {activeTab === 'urlscan' && <URLScannerTab />}
          {activeTab === 'phishing' && <PhishingFeedTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
