import { NextResponse } from 'next/server';

const STATIC_RANSOMWARE_GROUPS = [
  {
    name: 'LockBit',
    description: 'One of the most prolific ransomware-as-a-service (RaaS) operations. Uses double extortion tactics and has targeted critical infrastructure worldwide.',
    firstSeen: '2019-09',
    lastSeen: '2024-02',
    victimCount: 1700,
    status: 'disrupted',
    ttps: ['Phishing', 'RDP exploitation', 'Double extortion', 'Data exfiltration'],
  },
  {
    name: 'BlackCat / ALPHV',
    description: 'Rust-based ransomware with cross-platform capabilities. Known for triple extortion including DDoS threats against victims.',
    firstSeen: '2021-11',
    lastSeen: '2024-03',
    victimCount: 450,
    status: 'disrupted',
    ttps: ['Access brokers', 'Credential theft', 'Triple extortion', 'Cross-platform payloads'],
  },
  {
    name: 'Cl0p',
    description: 'Notorious for exploiting zero-day vulnerabilities in file transfer software (MOVEit, GoAnywhere). Conducts mass exploitation campaigns.',
    firstSeen: '2019-02',
    lastSeen: '2024-01',
    victimCount: 660,
    status: 'active',
    ttps: ['Zero-day exploitation', 'Supply chain attacks', 'Mass data theft', 'No encryption variant'],
  },
  {
    name: 'Royal',
    description: 'Operated by former Conti members. Targets critical sectors including healthcare and education with callback phishing.',
    firstSeen: '2022-09',
    lastSeen: '2023-07',
    victimCount: 350,
    status: 'rebranded',
    ttps: ['Callback phishing', 'Batch scripts', 'Partial encryption', 'Cobalt Strike'],
  },
  {
    name: 'Play',
    description: 'Known for targeting Latin American entities and using intermittent encryption for speed. Exploits FortiOS and Exchange vulnerabilities.',
    firstSeen: '2022-06',
    lastSeen: '2024-03',
    victimCount: 300,
    status: 'active',
    ttps: ['ProxyNotShell', 'FortiOS exploits', 'Intermittent encryption', 'AdFind reconnaissance'],
  },
  {
    name: 'Black Basta',
    description: 'Suspected Conti successor. Uses QakBot for initial access and targets large enterprises with double extortion.',
    firstSeen: '2022-04',
    lastSeen: '2024-03',
    victimCount: 500,
    status: 'active',
    ttps: ['QakBot delivery', 'Living off the land', 'PrintNightmare', 'Double extortion'],
  },
  {
    name: 'Akira',
    description: 'Targets small to mid-size businesses, particularly through Cisco VPN vulnerabilities. Retro-themed leak site.',
    firstSeen: '2023-03',
    lastSeen: '2024-03',
    victimCount: 250,
    status: 'active',
    ttps: ['VPN exploitation', 'Cisco ASA targeting', 'Linux variants', 'Double extortion'],
  },
  {
    name: 'Medusa',
    description: 'Operates a Telegram-based leak site. Known for aggressive negotiation timelines and targeting educational institutions.',
    firstSeen: '2021-06',
    lastSeen: '2024-03',
    victimCount: 200,
    status: 'active',
    ttps: ['Telegram leaks', 'RDP brute force', 'WebShell deployment', 'Time-limited extortion'],
  },
  {
    name: 'BianLian',
    description: 'Shifted from encryption to pure data extortion in 2023. Targets healthcare, financial services, and professional services.',
    firstSeen: '2022-07',
    lastSeen: '2024-03',
    victimCount: 180,
    status: 'active',
    ttps: ['Data-only extortion', 'ProxyShell', 'SonicWall exploitation', 'Go-based tooling'],
  },
  {
    name: 'NoEscape',
    description: 'Emerged as an Avaddon successor with RaaS model. Known for targeting VMware ESXi and offering DDoS add-on services.',
    firstSeen: '2023-05',
    lastSeen: '2023-12',
    victimCount: 120,
    status: 'defunct',
    ttps: ['ESXi targeting', 'RaaS model', 'DDoS-as-a-service', 'Affiliate program'],
  },
];

export async function GET() {
  try {
    const res = await fetch('https://api.ransomware.live/recentvictims', {
      headers: { 'User-Agent': 'AEGIS-Dashboard/1.0' },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const victims: RansomwareVictim[] = await res.json();
      const recentVictims = victims.slice(0, 30).map((v) => ({
        group: v.group_name,
        victim: v.post_title || v.victim,
        country: v.country || 'Unknown',
        date: v.discovered || v.published,
        website: v.website || null,
        activity: v.activity || null,
      }));

      return NextResponse.json(
        { type: 'victims', data: recentVictims },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
          },
        }
      );
    }

    throw new Error(`API returned ${res.status}`);
  } catch {
    // Fall back to static group data
    return NextResponse.json(
      { type: 'groups', data: STATIC_RANSOMWARE_GROUPS },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      }
    );
  }
}

interface RansomwareVictim {
  group_name: string;
  post_title?: string;
  victim?: string;
  country?: string;
  discovered?: string;
  published?: string;
  website?: string;
  activity?: string;
}
