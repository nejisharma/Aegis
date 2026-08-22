export const THREAT_TYPES = ['malware', 'phishing', 'exploit', 'ddos', 'bruteforce', 'ransomware', 'apt'] as const;

export const SEVERITY_COLORS = {
  low: '#3b82f6',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
} as const;

export const THREAT_TYPE_LABELS: Record<(typeof THREAT_TYPES)[number], string> = {
  malware: 'Malware',
  phishing: 'Phishing',
  exploit: 'Exploit',
  ddos: 'DDoS',
  bruteforce: 'Brute Force',
  ransomware: 'Ransomware',
  apt: 'APT',
};

export const NEWS_SOURCES = ['BleepingComputer', 'Krebs on Security', 'The Hacker News', 'SecurityWeek'] as const;

export const SITE_URL = 'https://aegis.neeraj.ca';
export const PRIVACY_URL = 'https://aegis.neeraj.ca/privacy';
export const TERMS_URL = 'https://aegis.neeraj.ca/terms';
