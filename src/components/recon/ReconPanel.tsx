'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Scan,
  Search,
  Globe,
  FileSearch,
  Network,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Server,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { GlowCard } from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/Badge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Tabs } from '@/components/ui/Tabs';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface WhoisResult {
  domain: string;
  registrar: string | null;
  createdDate: string | null;
  expiryDate: string | null;
  updatedDate: string | null;
  status: string[];
  nameservers: string[];
}

interface DnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DnsResult {
  answers: DnsAnswer[];
  status: number;
}

interface CrtEntry {
  id: number;
  commonName: string;
  issuerName: string;
  notBefore: string;
  notAfter: string;
}

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: 'whois', label: 'WHOIS' },
  { id: 'dns', label: 'DNS' },
  { id: 'subdomains', label: 'Subdomains' },
];

const DNS_TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME'] as const;

const DNS_TYPE_NUMBER: Record<number, string> = {
  1: 'A',
  2: 'NS',
  5: 'CNAME',
  15: 'MX',
  16: 'TXT',
  28: 'AAAA',
};

/* ------------------------------------------------------------------ */
/* Helper: copy to clipboard                                          */
/* ------------------------------------------------------------------ */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-slate-500 hover:text-slate-300 transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Helper: date formatting                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/* ------------------------------------------------------------------ */
/* Shared search bar                                                  */
/* ------------------------------------------------------------------ */

function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder,
  loading,
  icon: Icon = Search,
}: {
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
  placeholder: string;
  loading: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className="flex items-center gap-2 w-full max-w-xl">
      <div className="relative flex-1">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-4 py-3 rounded-lg',
            'bg-[#0d1528] border border-[#1a2744]',
            'text-sm text-slate-200 placeholder:text-slate-500',
            'focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20',
            'transition-all duration-200'
          )}
        />
      </div>
      <button
        onClick={onSearch}
        disabled={!value.trim() || loading}
        className={cn(
          'px-5 py-3 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200',
          'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25',
          'hover:bg-cyan-500/25 hover:border-cyan-500/40',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      >
        <Search className="h-4 w-4" />
        Lookup
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab 1: WHOIS Lookup                                                */
/* ------------------------------------------------------------------ */

function WhoisTab() {
  const [input, setInput] = useState('');
  const [data, setData] = useState<WhoisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = useCallback(async () => {
    const domain = input.trim().toLowerCase();
    if (!domain) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await fetch(`/api/whois?domain=${encodeURIComponent(domain)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [input]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <p className="text-sm text-slate-400 max-w-lg">
          Query domain registration data via RDAP protocol
        </p>
        <SearchBar
          value={input}
          onChange={setInput}
          onSearch={handleSearch}
          placeholder="Enter domain (e.g., example.com)"
          loading={loading}
          icon={Globe}
        />
      </div>

      {loading && (
        <GlowCard>
          <LoadingSkeleton count={6} />
        </GlowCard>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-400 mb-2" />
          <p className="text-sm text-slate-300">WHOIS lookup failed</p>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
        </div>
      )}

      {data && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GlowCard>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">{data.domain}</h3>
                <CopyButton text={data.domain} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow label="Registrar" value={data.registrar ?? 'N/A'} />
                <InfoRow label="Created" value={formatDate(data.createdDate)} />
                <InfoRow label="Expires" value={formatDate(data.expiryDate)} />
                <InfoRow label="Updated" value={formatDate(data.updatedDate)} />
              </div>

              {data.status.length > 0 && (
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Status</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {data.status.map((s) => (
                      <Badge key={s} variant="cyan">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {data.nameservers.length > 0 && (
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Nameservers</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {data.nameservers.map((ns) => (
                      <Badge key={ns} variant="blue">{ns}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GlowCard>
        </motion.div>
      )}

      {!data && !loading && !error && (
        <EmptyState icon={Globe} text="Enter a domain to look up WHOIS data" />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab 2: DNS Lookup                                                  */
/* ------------------------------------------------------------------ */

function DnsTab() {
  const [input, setInput] = useState('');
  const [recordType, setRecordType] = useState<string>('A');
  const [data, setData] = useState<DnsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = useCallback(async () => {
    const domain = input.trim().toLowerCase();
    if (!domain) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await fetch(
        `/api/dns?domain=${encodeURIComponent(domain)}&type=${recordType}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [input, recordType]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <p className="text-sm text-slate-400 max-w-lg">
          Query DNS records via Cloudflare DNS-over-HTTPS
        </p>
        <SearchBar
          value={input}
          onChange={setInput}
          onSearch={handleSearch}
          placeholder="Enter domain (e.g., example.com)"
          loading={loading}
          icon={Server}
        />

        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          <span className="text-xs text-slate-500 mr-1">Record type:</span>
          {DNS_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setRecordType(t)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium border transition-all duration-200',
                recordType === t
                  ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25'
                  : 'bg-slate-500/5 text-slate-400 border-slate-500/15 hover:bg-slate-500/10 hover:text-slate-300'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <GlowCard>
          <LoadingSkeleton count={4} />
        </GlowCard>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-400 mb-2" />
          <p className="text-sm text-slate-300">DNS lookup failed</p>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
        </div>
      )}

      {data && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GlowCard>
            {data.answers.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No {recordType} records found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-[#1a2744]">
                      <th className="pb-2 pr-4">Name</th>
                      <th className="pb-2 pr-4">Type</th>
                      <th className="pb-2 pr-4">TTL</th>
                      <th className="pb-2">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a2744]">
                    {data.answers.map((ans, i) => (
                      <tr key={i} className="text-slate-300">
                        <td className="py-2 pr-4 font-mono text-xs">{ans.name}</td>
                        <td className="py-2 pr-4">
                          <Badge variant="cyan">
                            {DNS_TYPE_NUMBER[ans.type] ?? ans.type}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4 text-slate-400">{ans.TTL}s</td>
                        <td className="py-2 font-mono text-xs break-all">
                          <div className="flex items-center gap-2">
                            <span>{ans.data}</span>
                            <CopyButton text={ans.data} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlowCard>
        </motion.div>
      )}

      {!data && !loading && !error && (
        <EmptyState icon={Server} text="Enter a domain and select record type to query DNS" />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab 3: Subdomain Finder                                            */
/* ------------------------------------------------------------------ */

function SubdomainTab() {
  const [input, setInput] = useState('');
  const [entries, setEntries] = useState<CrtEntry[]>([]);
  const [uniqueSubs, setUniqueSubs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = useCallback(async () => {
    const domain = input.trim().toLowerCase();
    if (!domain) return;
    setLoading(true);
    setError('');
    setEntries([]);
    setUniqueSubs([]);
    try {
      const res = await fetch(`/api/crtsh?domain=${encodeURIComponent(domain)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);

      const data: CrtEntry[] = Array.isArray(json) ? json : [];
      setEntries(data);

      const subs = new Set<string>();
      data.forEach((e) => {
        const names = e.commonName.split('\n');
        names.forEach((n) => {
          const clean = n.trim().toLowerCase().replace(/^\*\./, '');
          if (clean && clean.includes(domain)) subs.add(clean);
        });
      });
      setUniqueSubs(Array.from(subs).sort());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [input]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <p className="text-sm text-slate-400 max-w-lg">
          Discover subdomains using Certificate Transparency logs (crt.sh)
        </p>
        <SearchBar
          value={input}
          onChange={setInput}
          onSearch={handleSearch}
          placeholder="Enter domain (e.g., example.com)"
          loading={loading}
          icon={Network}
        />
      </div>

      {loading && (
        <GlowCard>
          <LoadingSkeleton count={8} />
        </GlowCard>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-400 mb-2" />
          <p className="text-sm text-slate-300">Subdomain lookup failed</p>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
        </div>
      )}

      {uniqueSubs.length > 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-slate-200">
                Unique Subdomains
              </span>
            </div>
            <Badge variant="cyan">{uniqueSubs.length} found</Badge>
          </div>

          <GlowCard>
            <div className="flex flex-wrap gap-2">
              {uniqueSubs.map((sub) => (
                <div
                  key={sub}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono',
                    'bg-[#0a1020] border border-[#1a2744]',
                    'text-slate-300 hover:border-cyan-500/30 transition-colors'
                  )}
                >
                  <span>{sub}</span>
                  <CopyButton text={sub} />
                </div>
              ))}
            </div>
          </GlowCard>

          <GlowCard>
            <div className="space-y-2">
              <h4 className="text-xs text-slate-500 uppercase tracking-wide">
                Certificate Details ({entries.length} entries)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-[#1a2744]">
                      <th className="pb-2 pr-4">Common Name</th>
                      <th className="pb-2 pr-4">Issuer</th>
                      <th className="pb-2 pr-4">Valid From</th>
                      <th className="pb-2">Valid Until</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a2744]">
                    {entries.slice(0, 50).map((entry) => (
                      <tr key={entry.id} className="text-slate-300">
                        <td className="py-2 pr-4 font-mono text-xs">{entry.commonName}</td>
                        <td className="py-2 pr-4 text-xs text-slate-400 max-w-[200px] truncate">
                          {entry.issuerName}
                        </td>
                        <td className="py-2 pr-4 text-xs text-slate-400">
                          {formatDate(entry.notBefore)}
                        </td>
                        <td className="py-2 text-xs text-slate-400">
                          {formatDate(entry.notAfter)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {entries.length > 50 && (
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    Showing 50 of {entries.length} certificate entries
                  </p>
                )}
              </div>
            </div>
          </GlowCard>
        </motion.div>
      )}

      {entries.length === 0 && !loading && !error && input && uniqueSubs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Network className="h-8 w-8 text-slate-600 mb-2" />
          <p className="text-sm text-slate-400">No subdomains found</p>
        </div>
      )}

      {!loading && !error && uniqueSubs.length === 0 && !input && (
        <EmptyState icon={Network} text="Enter a domain to discover subdomains via CT logs" />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab 4: Email Breach Check (placeholder)                            */
/* ------------------------------------------------------------------ */

function BreachTab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <p className="text-sm text-slate-400 max-w-lg">
          Check if an email address has been compromised in known data breaches
        </p>

        <div className="flex items-center gap-2 w-full max-w-xl">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="email"
              disabled
              placeholder="Enter email address..."
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-lg',
                'bg-[#0d1528] border border-[#1a2744]',
                'text-sm text-slate-200 placeholder:text-slate-500',
                'opacity-50 cursor-not-allowed'
              )}
            />
          </div>
          <button
            disabled
            className={cn(
              'px-5 py-3 rounded-lg flex items-center gap-2 text-sm font-medium',
              'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25',
              'opacity-40 cursor-not-allowed'
            )}
          >
            <Search className="h-4 w-4" />
            Check
          </button>
        </div>
      </div>

      <GlowCard glowColor="amber">
        <div className="flex flex-col items-center text-center space-y-3 py-4">
          <ShieldAlert className="h-10 w-10 text-amber-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-200">
              API Key Required
            </p>
            <p className="text-sm text-slate-400 max-w-md">
              Email breach checking requires a Have I Been Pwned API key ($3.50/month).
              Configure <code className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-xs">HIBP_API_KEY</code> in{' '}
              <code className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-xs">.env.local</code> to
              enable this feature.
            </p>
          </div>
          <a
            href="https://haveibeenpwned.com/API/Key"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium mt-2',
              'bg-amber-500/15 text-amber-400 border border-amber-500/25',
              'hover:bg-amber-500/25 hover:border-amber-500/40 transition-all duration-200'
            )}
          >
            <ExternalLink className="h-4 w-4" />
            Get HIBP API Key
          </a>
        </div>
      </GlowCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared components                                                  */
/* ------------------------------------------------------------------ */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-200">{value}</span>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="h-12 w-12 text-slate-700 mb-4" />
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Panel                                                         */
/* ------------------------------------------------------------------ */

export function ReconPanel() {
  const [activeTab, setActiveTab] = useState('whois');

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center space-y-5">
        <div className="flex items-center gap-3">
          <Scan className="h-8 w-8 text-cyan-400" />
          <h2 className="text-xl font-semibold text-slate-100">Recon Tools</h2>
        </div>
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div>
        {activeTab === 'whois' && <WhoisTab />}
        {activeTab === 'dns' && <DnsTab />}
        {activeTab === 'subdomains' && <SubdomainTab />}
      </div>
    </div>
  );
}
