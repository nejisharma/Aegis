// Types copied verbatim from the web app (src/types/*.ts) plus mobile-only response shapes.

// ---- src/types/cve.ts ----
export interface CVEItem {
  cve: {
    id: string;
    sourceIdentifier: string;
    published: string;
    lastModified: string;
    vulnStatus: string;
    descriptions: Array<{ lang: string; value: string }>;
    metrics?: {
      cvssMetricV31?: Array<{
        source: string;
        type: string;
        cvssData: {
          version: string;
          vectorString: string;
          attackVector: string;
          attackComplexity: string;
          privilegesRequired: string;
          userInteraction: string;
          scope: string;
          confidentialityImpact: string;
          integrityImpact: string;
          availabilityImpact: string;
          baseScore: number;
          baseSeverity: string;
        };
        exploitabilityScore: number;
        impactScore: number;
      }>;
    };
    weaknesses?: Array<{
      source: string;
      type: string;
      description: Array<{ lang: string; value: string }>;
    }>;
    references?: Array<{
      url: string;
      source: string;
      tags?: string[];
    }>;
  };
}

export interface NVDResponse {
  resultsPerPage: number;
  startIndex: number;
  totalResults: number;
  vulnerabilities: CVEItem[];
}

// ---- src/types/geoip.ts ----
export interface GeoIPResult {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
}

// ---- src/types/malware.ts ----
export interface MalwareSample {
  sha256_hash: string;
  sha1_hash: string;
  md5_hash: string;
  first_seen: string;
  last_seen: string | null;
  file_name: string | null;
  file_size: number;
  file_type_mime: string | null;
  file_type: string | null;
  reporter: string;
  origin_country: string | null;
  signature: string | null;
  tags: string[] | null;
  intelligence?: {
    clamav: string[] | null;
    downloads: string;
    uploads: string;
    mail?: {
      generic: string[];
    };
  };
}

export interface MalwareBazaarResponse {
  query_status: string;
  data: MalwareSample[];
}

// ---- src/types/mitre.ts ----
export interface MITRETactic {
  id: string;
  stixId: string;
  name: string;
  description: string;
  shortName: string;
}

export interface MITRETechnique {
  id: string;
  stixId: string;
  name: string;
  description: string;
  tacticRefs: string[];
  platforms: string[];
  isSubtechnique: boolean;
  parentId?: string;
  detection?: string;
  url: string;
}

export interface MITREGroup {
  id: string;
  stixId: string;
  name: string;
  description: string;
  aliases: string[];
  country?: string;
  techniqueIds: string[];
  softwareIds: string[];
  url: string;
}

export interface MITRESoftware {
  id: string;
  stixId: string;
  name: string;
  description: string;
  type: 'malware' | 'tool';
  platforms: string[];
  aliases: string[];
}

export interface MITREData {
  tactics: MITRETactic[];
  techniques: MITRETechnique[];
  groups: MITREGroup[];
  software: MITRESoftware[];
}

// ---- src/types/news.ts ----
export interface NewsItem {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  sourceIcon: string;
  category?: string;
}

// ---- src/types/shodan.ts ----
export interface ShodanInternetDB {
  cpes: string[];
  hostnames: string[];
  ip: string;
  ports: number[];
  tags: string[];
  vulns: string[];
}

// ---- src/types/threat-event.ts ----
export interface ThreatEvent {
  id: string;
  sourceCountry: string;
  sourceCountryCode: string;
  sourceLat: number;
  sourceLng: number;
  targetCountry: string;
  targetCountryCode: string;
  targetLat: number;
  targetLng: number;
  type: 'malware' | 'phishing' | 'exploit' | 'ddos' | 'bruteforce' | 'ransomware' | 'apt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  label: string;
}

// ---- src/types/threatfox.ts ----
export interface ThreatFoxIOC {
  id: string;
  ioc: string;
  threat_type: string;
  threat_type_desc: string;
  ioc_type: string;
  ioc_type_desc: string;
  malware: string;
  malware_printable: string;
  malware_alias: string | null;
  malware_malpedia: string | null;
  confidence_level: number;
  first_seen: string;
  last_seen: string | null;
  reporter: string;
  reference: string | null;
  tags: string[] | null;
}

export interface ThreatFoxResponse {
  query_status: string;
  data: ThreatFoxIOC[];
}

// ---- src/types/urlhaus.ts ----
export interface URLhausEntry {
  id: string;
  urlhaus_reference: string;
  url: string;
  url_status: string;
  host: string;
  date_added: string;
  threat: string;
  blacklists: {
    spamhaus_dbl: string;
    surbl: string;
  };
  reporter: string;
  larted: string;
  tags: string[] | null;
}

export interface URLhausResponse {
  query_status: string;
  urls: URLhausEntry[];
}

// ---- mobile-only: /api/ransomware ----
export interface RansomwareVictim {
  group: string;
  victim: string;
  country: string;
  date: string;
  website: string | null;
  activity: string | null;
}

export interface RansomwareGroup {
  name: string;
  description: string;
  firstSeen: string;
  lastSeen: string;
  victimCount: number;
  status: string;
  ttps: string[];
}

export type RansomwareResponse =
  | { type: 'victims'; data: RansomwareVictim[] }
  | { type: 'groups'; data: RansomwareGroup[] };

// ---- mobile-only: /api/exploitdb (GitHub Advisory DB) ----
// Field names match src/app/api/exploitdb/route.ts exactly: `id` is the GHSA id, cwes[].id is the CWE id.
export interface ExploitAdvisory {
  id: string;
  cveId: string | null;
  summary: string;
  description: string;
  severity: string;
  publishedAt: string;
  updatedAt: string;
  url: string;
  type: string;
  cwes: { id: string; name: string }[];
  cvss: { score: number; vectorString: string } | null;
  vulnerabilities: {
    ecosystem?: string;
    packageName?: string;
    vulnerableRange?: string;
    patchedVersions?: string;
  }[];
  references: string[];
}

export interface ExploitsResponse {
  advisories: ExploitAdvisory[];
  totalCount: number;
}

// ---- mobile-only: /api/phishing ----
export interface PhishingEntry {
  url: string;
  id?: number;
  source: string;
  target?: string;
  submission_time?: string;
  verified?: string;
  phish_detail_url?: string;
}

export interface PhishingResponse {
  entries: PhishingEntry[];
  total: number;
  source: string;
}

// ---- mobile-only: /api/abuseipdb (returns the AbuseIPDB `data` object) ----
export interface AbuseIpdbResult {
  ipAddress: string;
  isPublic: boolean;
  abuseConfidenceScore: number;
  countryCode: string;
  usageType: string;
  isp: string;
  domain: string;
  totalReports: number;
  lastReportedAt: string | null;
  isTor?: boolean;
}

// ---- mobile-only: /api/urlscan (returns the urlscan search `results` array) ----
export interface UrlscanResult {
  task: { url: string; time: string; domain?: string };
  page?: { domain?: string; ip?: string; country?: string };
  result?: string;
  stats?: Record<string, number>;
}

// ---- mobile-only: /api/news ----
export interface NewsFeedResponse {
  items: NewsItem[];
  count: number;
}

// ---- mobile-only: /api/virustotal (VirusTotal v3 file object) ----
export interface VirusTotalResult {
  id: string;
  type: string;
  attributes?: {
    last_analysis_stats?: Record<string, number>;
    meaningful_name?: string;
    names?: string[];
    size?: number;
    type_description?: string;
    sha256?: string;
    md5?: string;
    sha1?: string;
    reputation?: number;
    last_analysis_date?: number;
    [key: string]: unknown;
  };
}

// ---- mobile-only: push ----
export interface PushPrefs {
  critical_cve: boolean;
  news_digest: boolean;
  watchlist: boolean;
  /** Lower-cased keywords the device wants CVE alerts for (max 20). */
  watchlist_terms: string[];
}
