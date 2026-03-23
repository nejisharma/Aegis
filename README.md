# AEGIS - Security Intelligence Dashboard

A real-time cybersecurity intelligence dashboard for security analysts and researchers. Built with Next.js, featuring live threat visualization, CVE search, APT tracking, and more — powered entirely by free APIs.

## Features

- **Live Threat Map** — Animated global threat visualization with attack lines and pulsing markers
- **CVE Search** — Search the NVD database for vulnerabilities with CVSS scoring
- **APT Tracker** — Browse APT groups from MITRE ATT&CK with TTPs and target countries
- **IOC Lookup** — Search IPs, domains, and hashes against ThreatFox & URLhaus
- **IP Intelligence** — GeoIP lookups + Shodan InternetDB (ports, vulns)
- **News Feed** — Aggregated security news from BleepingComputer, Krebs, The Hacker News, SecurityWeek
- **MITRE ATT&CK Matrix** — Interactive, scrollable matrix colored by APT usage
- **Exploit DB Search** — Search for public exploits
- **Ransomware Tracker** — Track active ransomware groups and recent victims
- **Malware Bazaar** — Browse recent malware samples with hashes and signatures
- **Recon Tools** — WHOIS, DNS lookup, subdomain finder (crt.sh)
- **Threat Intel** — AbuseIPDB, URLScan.io, phishing feed integration
- **Vulnerability Calendar** — Patch Tuesday tracker for Microsoft, Adobe, Oracle
- **Analytics** — CVSS distribution, attack vectors, vulnerability trends (live from NVD)

## Tech Stack

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS, dark cybersecurity theme
- **Maps:** Leaflet + react-leaflet
- **Charts:** Recharts
- **Animations:** Framer Motion
- **State:** Zustand + SWR

## Free APIs Used

| API | Auth | Purpose |
|-----|------|---------|
| NVD CVE API | None | CVE/vulnerability search |
| Shodan InternetDB | None | Open ports & vulns per IP |
| ip-api.com | None | IP geolocation |
| ThreatFox (abuse.ch) | Free key | IOC feed |
| URLhaus (abuse.ch) | Free key | Malicious URL database |
| MalwareBazaar (abuse.ch) | Free key | Malware samples |
| MITRE ATT&CK | None | APT groups, techniques, tactics |
| AbuseIPDB | Free key | IP abuse reports |
| URLScan.io | Free key | URL scanning |
| crt.sh | None | Certificate transparency / subdomain discovery |
| RDAP | None | WHOIS / domain registration |
| DNS-over-HTTPS | None | DNS lookups |
| RSS Feeds | None | Security news aggregation |

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables (Optional)

Create a `.env.local` file for APIs that require keys:

```env
ABUSECH_AUTH_KEY=your_key      # Free at https://auth.abuse.ch — used by ThreatFox, URLhaus, MalwareBazaar
ABUSEIPDB_API_KEY=your_key     # Free at https://www.abuseipdb.com — 1,000 requests/day
```

Most features work without API keys. Panels that require them show setup instructions.

## Deployment

Deploy to Vercel (recommended):

```bash
npm run build
```

Or use any Node.js hosting platform.

## License

MIT
