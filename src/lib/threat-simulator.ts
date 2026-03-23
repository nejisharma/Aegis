import { COUNTRY_COORDS, ATTACK_SOURCES, ATTACK_TARGETS } from './geo-utils';
import { THREAT_TYPES } from './constants';
import type { ThreatEvent } from '../types/threat-event';

const SOURCE_WEIGHTS: Record<string, number> = {
  CN: 25,
  RU: 22,
  KP: 12,
  IR: 10,
  US: 5,
  BR: 4,
  IN: 4,
  NG: 4,
  UA: 4,
  RO: 3,
  VN: 4,
  PK: 3,
};

const SEVERITY_WEIGHTS: { severity: ThreatEvent['severity']; weight: number }[] = [
  { severity: 'low', weight: 30 },
  { severity: 'medium', weight: 40 },
  { severity: 'high', weight: 22 },
  { severity: 'critical', weight: 8 },
];

const THREAT_LABELS: Record<ThreatEvent['type'], string[]> = {
  malware: [
    'Emotet Dropper delivery',
    'QakBot payload distribution',
    'TrickBot module deployment',
    'AgentTesla keylogger spread',
    'Cobalt Strike beacon staging',
    'Raccoon Stealer campaign',
    'RedLine infostealer drop',
    'IcedID loader activity',
  ],
  phishing: [
    'Credential harvesting campaign',
    'Spear-phishing executive targeting',
    'OAuth consent phishing',
    'MFA fatigue attack',
    'Business email compromise',
    'Invoice impersonation scam',
    'Cloud storage phishing lure',
    'QR code phishing campaign',
  ],
  exploit: [
    'Log4Shell exploitation attempt',
    'ProxyShell remote code execution',
    'MOVEit Transfer zero-day',
    'Citrix Bleed exploitation',
    'Fortinet VPN CVE exploit',
    'Apache Struts RCE attempt',
    'Spring4Shell exploitation',
    'Confluence RCE exploitation',
  ],
  ddos: [
    'Volumetric UDP flood',
    'HTTP/2 Rapid Reset attack',
    'DNS amplification attack',
    'SYN flood sustained assault',
    'Memcached reflection attack',
    'NTP amplification flood',
    'Application layer DDoS',
    'Botnet-driven traffic surge',
  ],
  bruteforce: [
    'SSH credential stuffing',
    'RDP brute-force barrage',
    'Active Directory password spray',
    'VPN gateway credential attack',
    'WordPress admin brute-force',
    'Office365 password spray',
    'FTP login enumeration',
    'SMTP relay brute-force',
  ],
  ransomware: [
    'LockBit 3.0 deployment',
    'BlackCat/ALPHV encryption',
    'Cl0p data exfiltration',
    'Royal ransomware staging',
    'Play ransomware lateral movement',
    'Akira ransomware deployment',
    'Medusa locker activation',
    'Black Basta propagation',
  ],
  apt: [
    'APT28 Fancy Bear recon',
    'APT29 Cozy Bear C2 activity',
    'Lazarus Group operation',
    'APT41 Double Dragon intrusion',
    'Turla Group watering hole',
    'Sandworm infrastructure probe',
    'Kimsuky intelligence gathering',
    'Charming Kitten social engineering',
  ],
};

const TARGET_SECTORS = [
  'Defense', 'Finance', 'Healthcare', 'Energy', 'Government',
  'Telecom', 'Technology', 'Manufacturing', 'Education', 'Critical Infrastructure',
];

function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

function pickWeightedSource(): string {
  const sources = ATTACK_SOURCES;
  const weights = sources.map((s) => SOURCE_WEIGHTS[s] || 1);
  return weightedRandom(sources, weights);
}

function pickWeightedSeverity(): ThreatEvent['severity'] {
  return weightedRandom(
    SEVERITY_WEIGHTS.map((s) => s.severity),
    SEVERITY_WEIGHTS.map((s) => s.weight),
  );
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateId(): string {
  return `te-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildLabel(type: ThreatEvent['type'], targetCode: string): string {
  const templates = THREAT_LABELS[type];
  const base = pickRandom(templates);
  const sector = pickRandom(TARGET_SECTORS);
  const targetName = COUNTRY_COORDS[targetCode]?.name || targetCode;
  return `${base} targeting ${targetName} ${sector}`;
}

export function generateThreatEvent(): ThreatEvent {
  const sourceCode = pickWeightedSource();
  const targetCode = pickRandom(ATTACK_TARGETS);
  const source = COUNTRY_COORDS[sourceCode];
  const target = COUNTRY_COORDS[targetCode];
  const type = pickRandom(THREAT_TYPES);
  const severity = pickWeightedSeverity();

  return {
    id: generateId(),
    sourceCountry: source.name,
    sourceCountryCode: sourceCode,
    sourceLat: source.lat + (Math.random() - 0.5) * 4,
    sourceLng: source.lng + (Math.random() - 0.5) * 4,
    targetCountry: target.name,
    targetCountryCode: targetCode,
    targetLat: target.lat + (Math.random() - 0.5) * 4,
    targetLng: target.lng + (Math.random() - 0.5) * 4,
    type,
    severity,
    timestamp: Date.now(),
    label: buildLabel(type, targetCode),
  };
}

export function generateBatch(count: number): ThreatEvent[] {
  return Array.from({ length: count }, () => generateThreatEvent());
}
