# AEGIS Mobile (iOS + Android) — Design

Date: 2026-08-21 · Status: approved in conversation (user: "go go go", follow the first recommendation on any open question)

## Goal

Ship a native iOS/Android companion to aegis.neeraj.ca with near-full feature parity, plus two things the website cannot do: push notifications (critical CVEs immediately, news as a digest) and an offline cache of last-fetched data. Build once, leave it running unattended for months — so no new services beyond the existing Vercel deploy plus a free Upstash Redis.

No ads in v1. Leave one seam (`src/components/AdSlot.tsx`, renders nothing) so AdMob can be added later without touching screens.

## Decisions (from brainstorming)

| Topic | Decision |
|---|---|
| Framework | Expo SDK 57 / RN 0.86 (what `create-expo-app@latest` produced on 2026-08-21; managed, CNG — `ios/` and `android/` not committed), expo-router, TypeScript. Same pattern as MindClutter. |
| Map | `@maplibre/maplibre-react-native` with the **same CartoDB dark raster tiles** and the **same `india-boundary.geojson` overlay** as the website (Survey of India external boundary, styled `#4a4a4a`, 0.8px, 60%). Not `react-native-maps`: Apple/Google render disputed borders per user region and cannot be overridden cleanly. No Google Maps key. |
| Backend | Existing Next.js `/api/*` routes at aegis.neeraj.ca. Mobile never calls third-party APIs directly; no third-party keys ship in the binary. |
| Push | Expo Push Service. Detection job = **Vercel Cron** → `/api/cron/notify` every 30 min. State (device tokens, prefs, last-seen IDs) in **Upstash Redis** via `@upstash/redis` REST (free tier). |
| Notification categories v1 | `critical_cve` (CVSS v3.1 ≥ 9.0, one push per CVE, max 5 per run) and `news_digest` (batched "N new security stories", at most one every 3 h). Per-category toggles in Settings. Ransomware / Patch Tuesday deferred. |
| Scope | All website panels except crt.sh / RDAP / DNS recon tools. MITRE matrix redesigned as tactic → technique drill-down. |
| Ads | None in v1. |
| Identity | App name "Aegis"; iOS bundleIdentifier and Android package `ca.neeraj.aegis`; scheme `aegis`. |
| Builds | Android locally (`expo run:android`; SDK `D:\dev\android-sdk`, JDK = Android Studio JBR, AVD `pixel`). iOS via Codemagic (MindClutter workflow adapted). EAS profiles kept for parity. |
| Location | `mobile/` directory in this repo. |

## Architecture

```
mobile/                       Expo app
  app/                        expo-router routes
    _layout.tsx               providers: SWR config + persisted cache, theme, notification bootstrap
    (tabs)/_layout.tsx        5 tabs: Home · News · Search · Intel · Settings
    (tabs)/index.tsx          Home: stats strip + ThreatMap + latest critical CVEs
    (tabs)/news.tsx           News list with source filter chips
    (tabs)/search.tsx         Segmented: CVE · IOC · IP · Exploits
    (tabs)/intel.tsx          Grid of intel sections
    (tabs)/settings.tsx       Notification toggles, about, privacy link
    cve/[id].tsx              CVE detail
    apt/index.tsx, apt/[id].tsx
    ransomware.tsx, malware.tsx, phishing.tsx, calendar.tsx, analytics.tsx
    mitre/index.tsx (tactics) → mitre/[tactic].tsx (techniques) → mitre/technique/[id].tsx
  src/
    api/client.ts             fetch wrapper: base URL, 10 s timeout, ApiError
    api/endpoints.ts          one typed function per route (mirrors web hooks)
    api/types.ts              copied from web src/types/*
    hooks/*                   useSWR wrappers
    lib/threat-simulator.ts   ported from web
    lib/geo.ts                COUNTRY_COORDS etc. ported
    lib/cvss.ts               severity colors/labels
    lib/ioc.ts                detect ip / domain / hash / url
    lib/patch-dates.ts        Patch Tuesday / Oracle CPU generator ported
    lib/storage.ts            AsyncStorage-backed SWR cache provider + prefs
    notifications/
      register.ts            permission → Expo push token → POST /api/push/register
      prefs.ts               category toggles (local + server sync)
      handlers.ts            tap → deep link (aegis://cve/ID, aegis://news)
    components/               ThreatMap, StatCard, CVSSBadge, SeverityDot, ListRow, Skeleton, EmptyState, SearchBar, Segmented, OfflineBanner, AdSlot (no-op)
    theme/                    colors (dark cyber palette from the web Tailwind theme), spacing, typography
  assets/                     icon, adaptive icon, splash, india-boundary.geojson
  app.json, eas.json, codemagic.yaml, package.json, tsconfig.json
  __tests__/                  jest-expo unit tests

src/app/api/ (web, new)
  push/register/route.ts      POST {token, platform, prefs} → upsert in Redis
  push/prefs/route.ts         PATCH {token, prefs}; DELETE {token}
  cron/notify/route.ts        GET guarded by CRON_SECRET; runs detectors, sends via Expo Push
src/lib/push/
  redis.ts                    Upstash client (returns null with a warning if env missing)
  expo-push.ts                batch sender (100/chunk), prunes DeviceNotRegistered
  detectors.ts                pure functions: criticalCves(), newsDigest()
vercel.json                   crons: [{ path: "/api/cron/notify", schedule: "*/30 * * * *" }]
```

### Data flow

1. Screens call typed endpoint functions through `useSWR`. The SWR cache is persisted to AsyncStorage and rehydrated at launch, so every screen renders last-seen data instantly and offline; `OfflineBanner` shows "Offline — showing cached data" when a fetch fails and cached data exists.
2. Threat map: ported `useSimulatedThreats` generates events on an interval; MapLibre renders a `ShapeSource` of LineStrings (attack lines, severity-colored) plus a `CircleLayer` for source/target points. An event list sits below the map; tapping an event recenters and highlights it. The map is labelled "Simulated activity".
3. Notifications: Settings tab requests permission → Expo token → `POST /api/push/register` with prefs. Toggle → `PATCH /api/push/prefs`. Token and prefs are also stored locally and re-registered on each cold start (idempotent upsert).
4. Cron: every 30 min `/api/cron/notify` (a) fetches NVD with `pubStartDate = now − 2h`, `cvssV3Severity=CRITICAL`, diffs against Redis set `seen:cve`, pushes each new CVE (title "Critical CVE: CVE-…", body = first 120 chars of description, data `{url: "aegis://cve/ID"}`) to tokens with `critical_cve` on, max 5 per run; (b) fetches `/api/news`, counts ids not in `seen:news`; if ≥ 1 new and `last_digest` older than 3 h, pushes "N new security stories" with the newest title to tokens with `news_digest` on. Seen sets trimmed to the 2000 newest ids.

### Error handling

- API client: 10 s timeout; throws `ApiError {status, message}`. Screens render `EmptyState` with a retry button. Endpoint functions do light runtime narrowing so malformed upstream payloads never crash a screen.
- Cron: detectors run independently; one failure does not block the other. Expo push responses with `DeviceNotRegistered` cause token deletion. Missing Upstash env → route returns 200 `{skipped: "no redis"}`.
- Map: if tiles fail, the dark background, boundary and lines still render.

### Testing

- Jest (jest-expo): threat simulator output shape, IOC type detection, CVSS mapping, patch-date generator, API client error mapping.
- Web: `src/lib/push/detectors.test.ts` run with `node --test` via `tsx` (pure functions, fixture data) — no new test framework in the web project.
- Manual on the `pixel` AVD: every tab and intel screen, search flows, map renders the India boundary, a test push lands and deep-links.

### Store compliance (carried into README)

- Privacy labels: no data collected except the anonymous push token ("Device ID — app functionality, not linked to user"). Link the site's privacy notice from Settings.
- MalwareBazaar screen shows hashes/metadata only; no sample download links.
- `ITSAppUsesNonExemptEncryption: false`.

## Added during build (user requests)

- Map zoom +/− buttons, pinch/double-tap zoom, and a maximize button opening a full-screen map.
- Tapping a map marker or a list row opens an event detail sheet (same fields as the website popup plus coordinates and a type description).
- Error states distinguish **no network** (probe to gstatic `generate_204` fails) from **server maintenance** (probe succeeds but aegis.neeraj.ca does not answer / 5xx) and **upstream source down** (502/504), each with its own illustration.
- Web `/api/cve` gained `days` (≤120) and `severity` params so Home and Analytics use genuinely recent CVEs.

- **Phish or Not?** swipe game (`app/phish-game.tsx`, logic in `src/lib/phish-game.ts`): 300 cards (100 easy/medium/hard, 50 % phishing within each), rounds of 3 + 4 + 3, swipe left = phish / right = legit, tells revealed per card, streak bonus, grade + personal best; recently seen ids excluded from the next rounds.
- **Drawer sidebar** (`app/(drawer)/_layout.tsx`, `src/components/DrawerContent.tsx`) wrapping the tabs; hamburger in every tab title (`ScreenTitle`).

## Out of scope (v1)

Ads, accounts, ransomware / Patch-Tuesday notifications, recon tools, animated attack-line tweening at web fidelity, dedicated tablet layouts.

## Web repo cleanup included

Remove unused `mappls-web-maps` and `ol` deps; fix the README Mappls line (tiles are CartoDB; India compliance is via the SOI boundary overlay). Add `/api/push/*`, `/api/cron/notify`, `vercel.json`, and env docs (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `CRON_SECRET`).
