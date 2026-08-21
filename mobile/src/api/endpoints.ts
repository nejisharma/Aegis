import { api, postJson, patchJson, deleteJson } from './client';
import type {
  AbuseIpdbResult,
  ExploitsResponse,
  GeoIPResult,
  MITREData,
  MalwareBazaarResponse,
  NVDResponse,
  NewsFeedResponse,
  PhishingResponse,
  PushPrefs,
  RansomwareResponse,
  ShodanInternetDB,
  ThreatFoxResponse,
  URLhausResponse,
  UrlscanResult,
  VirusTotalResult,
} from './types';

const q = (params: Record<string, string | number | undefined>) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
};

// News — GET ?source=
export const getNews = (source?: string) =>
  api<NewsFeedResponse>(`/api/news${q({ source })}`);

// CVE (NVD proxy) — GET ?keyword=&limit=&startIndex=
export const searchCves = (keyword: string, limit = 20, startIndex = 0) =>
  api<NVDResponse>(`/api/cve${q({ keyword, limit, startIndex })}`);

/** The web route only supports keyword search; using the CVE id as the keyword returns that CVE. */
export const getCveById = (id: string) => searchCves(id, 1, 0);

/** CVEs published in the last `days` days (optionally filtered by CVSS v3 severity), newest-first. */
export const getRecentCves = (days = 7, severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', limit = 50) =>
  api<NVDResponse>(`/api/cve${q({ days, severity, limit })}`).then((r) => ({
    ...r,
    vulnerabilities: [...(r.vulnerabilities ?? [])].sort((a, b) => b.cve.published.localeCompare(a.cve.published)),
  }));

// IP intel — GET ?ip=
export const getGeoIp = (ip: string) => api<GeoIPResult>(`/api/geoip${q({ ip })}`);
export const getShodan = (ip: string) => api<ShodanInternetDB>(`/api/shodan${q({ ip })}`);
export const getAbuseIpdb = (ip: string) => api<AbuseIpdbResult>(`/api/abuseipdb${q({ ip })}`);

// ThreatFox — POST {action:'recent'|'search', days?, search_term?}
export const threatfoxRecent = (days = 3) =>
  postJson<ThreatFoxResponse>('/api/threatfox', { action: 'recent', days });
export const threatfoxSearch = (term: string) =>
  postJson<ThreatFoxResponse>('/api/threatfox', { action: 'search', search_term: term });

// URLhaus — POST {action:'recent'|'host'|'url', host?, url?}
export const urlhausRecent = () => postJson<URLhausResponse>('/api/urlhaus', { action: 'recent' });
export const urlhausHost = (host: string) =>
  postJson<URLhausResponse>('/api/urlhaus', { action: 'host', host });
export const urlhausUrl = (url: string) =>
  postJson<URLhausResponse>('/api/urlhaus', { action: 'url', url });

// MalwareBazaar — POST {action:'recent'|'hash', hash?, limit?} (route currently returns 100 recent regardless of limit)
export const malwareRecent = (limit = 50) =>
  postJson<MalwareBazaarResponse>('/api/malwarebazaar', { action: 'recent', limit });
export const malwareHash = (hash: string) =>
  postJson<MalwareBazaarResponse>('/api/malwarebazaar', { action: 'hash', hash });

// VirusTotal — GET ?hash=
export const getVirusTotal = (hash: string) =>
  api<VirusTotalResult>(`/api/virustotal${q({ hash })}`);

// MITRE ATT&CK — GET (optionally ?type=groups|techniques|tactics|software)
export const getMitre = () => api<MITREData>('/api/mitre');
export const getMitreSlice = <K extends keyof MITREData>(type: K) =>
  api<Pick<MITREData, K>>(`/api/mitre${q({ type })}`);

// Exploits (GitHub Advisory DB) — GET ?keyword= (min 3 chars)
export const searchExploits = (keyword: string) =>
  api<ExploitsResponse>(`/api/exploitdb${q({ keyword })}`);

// Ransomware, phishing — GET
export const getRansomware = () => api<RansomwareResponse>('/api/ransomware');
export const getPhishing = () => api<PhishingResponse>('/api/phishing');

// urlscan — POST {url}; returns the urlscan search results array
export const urlscan = (url: string) => postJson<UrlscanResult[]>('/api/urlscan', { url });

// Push (web routes from Task 1)
export interface RegisterPushBody {
  token: string;
  platform: 'ios' | 'android';
  prefs: PushPrefs;
}
export const registerPush = (body: RegisterPushBody) =>
  postJson<{ ok: true }>('/api/push/register', body);
export const updatePushPrefs = (body: { token: string; prefs: PushPrefs }) =>
  patchJson<{ ok: true }>('/api/push/prefs', body);
export const unregisterPush = (token: string) =>
  deleteJson<{ ok: true }>('/api/push/prefs', { token });
