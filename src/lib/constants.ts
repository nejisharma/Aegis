export const API_URLS = {
  NVD_CVE: 'https://services.nvd.nist.gov/rest/json/cves/2.0',
  SHODAN_INTERNETDB: 'https://internetdb.shodan.io',
  IP_API: 'http://ip-api.com/json',
  THREATFOX: 'https://threatfox-api.abuse.ch/api/v1/',
  URLHAUS: 'https://urlhaus-api.abuse.ch/v1',
  MALWARE_BAZAAR: 'https://mb-api.abuse.ch/api/v1/',
  EPSS: 'https://api.first.org/data/v1/epss',
  KEV: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
} as const;

export const RSS_FEEDS = {
  bleepingcomputer: { url: 'https://www.bleepingcomputer.com/feed/', name: 'BleepingComputer', icon: '\u{1F4BB}' },
  krebs: { url: 'https://krebsonsecurity.com/feed/', name: 'Krebs on Security', icon: '\u{1F512}' },
  hackernews: { url: 'https://feeds.feedburner.com/TheHackersNews', name: 'The Hacker News', icon: '\u{1F4F0}' },
  securityweek: { url: 'https://www.securityweek.com/feed/', name: 'SecurityWeek', icon: '\u{1F6E1}' },
} as const;

export const CVSS_COLORS = {
  NONE: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  LOW: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  MEDIUM: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  HIGH: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  CRITICAL: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
} as const;

export const SEVERITY_COLORS = {
  low: '#3b82f6',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
} as const;

export const THREAT_TYPES = ['malware', 'phishing', 'exploit', 'ddos', 'bruteforce', 'ransomware', 'apt'] as const;

export const PANEL_CONFIG = [
  { id: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
  { id: 'threat-map', label: 'Threat Map', icon: 'Globe' },
  { id: 'cve', label: 'CVE Search', icon: 'Search' },
  { id: 'news', label: 'News Feed', icon: 'Newspaper' },
  { id: 'apt', label: 'APT Tracker', icon: 'Crosshair' },
  { id: 'ioc', label: 'IOC Lookup', icon: 'Fingerprint' },
  { id: 'ip-intel', label: 'IP Intel', icon: 'Radar' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart3' },
  { id: 'malware', label: 'Malware', icon: 'Bug' },
  { id: 'mitre', label: 'MITRE ATT&CK', icon: 'Shield' },
  { id: 'threat-intel', label: 'Threat Intel', icon: 'Eye' },
  { id: 'exploits', label: 'Exploits', icon: 'Flame' },
  { id: 'vuln-calendar', label: 'Vuln Calendar', icon: 'Calendar' },
] as const;

export type PanelId = typeof PANEL_CONFIG[number]['id'];
